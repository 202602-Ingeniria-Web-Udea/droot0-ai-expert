"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode, type Ref, type UIEventHandler } from "react";
import { Alert, Button, EmptyState, ErrorState, buttonStyles } from "@/components/ui";
import { sendMessage } from "@/lib/api/chat";
import { isApiClientError } from "@/lib/api/client";
import { getConversation } from "@/lib/api/conversations";
import { describeApiError, isRetryableError } from "@/lib/api/errors";
import { redirectToLogin } from "@/lib/api/redirect";
import { useAsyncData } from "@/lib/api/use-async-data";
import type { ConversationDetailResponse, Message } from "@/lib/contracts/conversations";
import { ChatEmptyState } from "./chat-empty-state";
import { ChatHeader } from "./chat-header";
import { ChatSkeleton } from "./chat-skeleton";
import { Composer } from "./composer";
import { primeConversation, takePrimedConversation } from "./conversation-cache";
import { MessageList } from "./message-list";
import { TypingIndicator } from "./typing-indicator";
import { useStickToBottom } from "./use-stick-to-bottom";

type ChatFrameProps = {
  title: string;
  children: ReactNode;
  /** Composer area anchored at the bottom. */
  footer?: ReactNode;
  /** Floating control above the composer, such as "Jump to latest". */
  floating?: ReactNode;
  scrollRef?: Ref<HTMLDivElement>;
  onScroll?: UIEventHandler<HTMLDivElement>;
};

/** Header, independently scrolling message region, and composer anchored at the bottom. */
function ChatFrame({ title, children, footer, floating, scrollRef, onScroll }: ChatFrameProps) {
  return (
    <div className="flex h-full flex-col">
      <ChatHeader title={title} />

      <div className="relative min-h-0 flex-1">
        <div ref={scrollRef} onScroll={onScroll} className="h-full overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">{children}</div>
        </div>
        {floating ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <div className="pointer-events-auto">{floating}</div>
          </div>
        ) : null}
      </div>

      {footer ? (
        <div className="shrink-0 border-t border-line bg-surface">
          <div className="mx-auto w-full max-w-3xl space-y-3 px-4 py-3 sm:px-6">{footer}</div>
        </div>
      ) : null}
    </div>
  );
}

type PendingMessage = { content: string; createdAt: string };
type Failure = { content: string; message: string; retryable: boolean };

/** An open conversation (or a new one, when `initial` is omitted) with its composer. */
function Conversation({ initial }: { initial?: ConversationDetailResponse }) {
  const router = useRouter();
  const [summary, setSummary] = useState(initial?.conversation ?? null);
  const [messages, setMessages] = useState<Message[]>(initial?.messages ?? []);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<PendingMessage | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  // State updates are asynchronous; the ref blocks a second send immediately.
  const inFlight = useRef(false);

  const hasMessages = messages.length > 0 || pending !== null;
  const scroll = useStickToBottom<HTMLDivElement>(
    `${messages.length}:${pending ? 1 : 0}`,
    hasMessages,
  );

  async function send(text: string) {
    const content = text.trim();

    if (!content || inFlight.current) {
      return;
    }

    inFlight.current = true;
    setFailure(null);
    setDraft("");
    // Shown immediately; replaced by the stored message when the reply arrives.
    setPending({ content, createdAt: new Date().toISOString() });
    scroll.scrollToBottom(false);

    try {
      const result = await sendMessage({ conversationId: summary?.id ?? null, content });

      if (!summary) {
        // First message: the backend created the conversation. Open its own
        // URL, handing over what we already have so it is not loaded again.
        primeConversation({
          conversation: result.conversation,
          messages: [result.userMessage, result.assistantMessage],
        });
        router.replace(`/chat/${result.conversation.id}`);
        return;
      }

      setMessages((current) => [...current, result.userMessage, result.assistantMessage]);
      setSummary(result.conversation);
      setPending(null);
      inFlight.current = false;
    } catch (error) {
      inFlight.current = false;
      // The backend stored nothing, so the optimistic message is removed and
      // the text goes back to the composer (unless something new was typed).
      setPending(null);
      setDraft((current) => (current.trim() ? current : content));

      if (isApiClientError(error) && error.status === 401) {
        redirectToLogin();
        return;
      }

      setFailure({
        content,
        message: describeApiError(error),
        retryable: isRetryableError(error),
      });
    }
  }

  function retry() {
    if (!failure) {
      return;
    }

    // If the failed text is still what the composer shows, sending clears it.
    const { content } = failure;
    setDraft((current) => (current.trim() === content ? "" : current));
    void send(content);
  }

  const optimistic: Message[] = pending
    ? [
        {
          id: "pending-message",
          role: "USER",
          content: pending.content,
          createdAt: pending.createdAt,
        },
      ]
    : [];
  const visibleMessages = [...messages, ...optimistic];

  return (
    <ChatFrame
      title={summary?.title ?? "New conversation"}
      scrollRef={scroll.ref}
      onScroll={scroll.onScroll}
      floating={
        !scroll.atBottom && visibleMessages.length > 0 ? (
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full shadow-overlay"
            onClick={() => scroll.scrollToBottom()}
          >
            Jump to latest
          </Button>
        ) : null
      }
      footer={
        <>
          {failure ? (
            <Alert
              variant="error"
              title="Your message was not sent"
              action={
                failure.retryable ? (
                  <Button size="sm" variant="secondary" onClick={retry}>
                    Try again
                  </Button>
                ) : null
              }
            >
              {failure.message}
            </Alert>
          ) : null}
          <Composer
            value={draft}
            onChange={setDraft}
            onSubmit={() => void send(draft)}
            pending={pending !== null}
          />
        </>
      }
    >
      {visibleMessages.length === 0 ? (
        <ChatEmptyState onSelect={setDraft} />
      ) : (
        <MessageList messages={visibleMessages}>{pending ? <TypingIndicator /> : null}</MessageList>
      )}
    </ChatFrame>
  );
}

/** Loads a stored conversation, then hands it to <Conversation>. */
function StoredConversation({ id }: { id: string }) {
  const [primed] = useState(() => takePrimedConversation(id));
  const conversation = useAsyncData(`conversation:${id}`, (signal) => getConversation(id, signal), {
    initialData: primed,
  });

  if (conversation.status === "loading") {
    return (
      <ChatFrame title="Loading conversation">
        <ChatSkeleton />
      </ChatFrame>
    );
  }

  if (conversation.status === "error") {
    // A malformed id fails validation; for the user that is also "not found".
    const notFound =
      isApiClientError(conversation.error) &&
      (conversation.error.code === "NOT_FOUND" || conversation.error.code === "VALIDATION_ERROR");

    return (
      <ChatFrame title={notFound ? "Conversation not found" : "Conversation unavailable"}>
        {notFound ? (
          <EmptyState
            title="This conversation is not available"
            description="It may have been deleted, or the link may be incorrect."
            action={
              <Link href="/chat" className={buttonStyles({})}>
                Start a new conversation
              </Link>
            }
          />
        ) : (
          <ErrorState
            title="The conversation could not be loaded"
            description={describeApiError(conversation.error)}
            onRetry={conversation.reload}
          />
        )}
      </ChatFrame>
    );
  }

  return <Conversation initial={conversation.data} />;
}

type ChatViewProps = {
  /** Omitted for a new conversation that has no messages yet. */
  conversationId?: string;
};

export function ChatView({ conversationId }: ChatViewProps) {
  if (!conversationId) {
    return <Conversation />;
  }

  return <StoredConversation key={conversationId} id={conversationId} />;
}
