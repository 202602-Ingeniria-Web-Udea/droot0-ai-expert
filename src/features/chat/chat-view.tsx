"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Button, EmptyState, ErrorState, Textarea, buttonStyles } from "@/components/ui";
import { isApiClientError } from "@/lib/api/client";
import { getConversation } from "@/lib/api/conversations";
import { describeApiError } from "@/lib/api/errors";
import { useAsyncData } from "@/lib/api/use-async-data";
import { ChatEmptyState } from "./chat-empty-state";
import { ChatHeader } from "./chat-header";
import { ChatSkeleton } from "./chat-skeleton";
import { MessageList } from "./message-list";

/** Header, independently scrolling message region, and composer anchored at the bottom. */
function ChatFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <ChatHeader title={title} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">{children}</div>
      </div>

      <div className="shrink-0 border-t border-line bg-surface">
        {/* Placeholder: the working composer replaces this block in the composer feature. */}
        <div className="mx-auto flex w-full max-w-3xl items-end gap-2 px-4 py-3 sm:px-6">
          <label htmlFor="chat-message" className="sr-only">
            Message
          </label>
          <Textarea
            id="chat-message"
            rows={1}
            disabled
            placeholder="Message sending is not available yet"
            className="min-h-10 resize-none"
          />
          <Button disabled>Send</Button>
        </div>
      </div>
    </div>
  );
}

function ExistingConversation({ id }: { id: string }) {
  const conversation = useAsyncData(`conversation:${id}`, (signal) => getConversation(id, signal));

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

  const { conversation: summary, messages } = conversation.data;

  return (
    <ChatFrame title={summary.title}>
      {messages.length === 0 ? <ChatEmptyState /> : <MessageList messages={messages} />}
    </ChatFrame>
  );
}

type ChatViewProps = {
  /** Omitted for a new conversation that has no messages yet. */
  conversationId?: string;
};

export function ChatView({ conversationId }: ChatViewProps) {
  if (!conversationId) {
    return (
      <ChatFrame title="New conversation">
        <ChatEmptyState />
      </ChatFrame>
    );
  }

  return <ExistingConversation key={conversationId} id={conversationId} />;
}
