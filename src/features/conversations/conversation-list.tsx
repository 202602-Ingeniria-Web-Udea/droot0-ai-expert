"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Button, EmptyState, ErrorState, buttonStyles } from "@/components/ui";
import { listConversations } from "@/lib/api/conversations";
import { describeApiError } from "@/lib/api/errors";
import { useAsyncData } from "@/lib/api/use-async-data";
import type { ConversationSummary } from "@/lib/contracts/conversations";
import { formatDateTime } from "@/lib/utils/format";
import { DeleteConversationDialog } from "./delete-conversation-dialog";
import { RenameConversationDialog } from "./rename-conversation-dialog";

function ListSkeleton() {
  return (
    <div role="status" className="space-y-3">
      <span className="sr-only">Loading conversations</span>
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="h-16 animate-pulse rounded-card bg-sunken" />
      ))}
    </div>
  );
}

/**
 * The signed-in user's conversations, most recent first.
 *
 * The backend returns only conversations owned by the session user, so this
 * list never filters by user on the client. One list serves every screen
 * size: stacked cards on small screens, aligned rows from the `md` breakpoint.
 */
export function ConversationList() {
  const conversations = useAsyncData("conversations", (signal) => listConversations(signal));
  const [toRename, setToRename] = useState<ConversationSummary | null>(null);
  const [toDelete, setToDelete] = useState<ConversationSummary | null>(null);
  const regionRef = useRef<HTMLDivElement>(null);

  if (conversations.status === "loading") {
    return <ListSkeleton />;
  }

  if (conversations.status === "error") {
    return (
      <ErrorState
        title="Your conversations could not be loaded"
        description={describeApiError(conversations.error)}
        onRetry={conversations.reload}
      />
    );
  }

  const items = conversations.data.conversations;

  return (
    <div ref={regionRef} tabIndex={-1} className="outline-none">
      {items.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          description="Conversations appear here after you send your first message."
          action={
            <Link href="/chat" className={buttonStyles({})}>
              Start a conversation
            </Link>
          }
        />
      ) : (
        <>
          <div
            aria-hidden="true"
            className="hidden grid-cols-[1fr_7rem_12rem_10.5rem] gap-4 px-4 pb-2 text-xs font-medium text-ink-muted md:grid"
          >
            <span>Conversation</span>
            <span>Messages</span>
            <span>Last activity</span>
            <span>Actions</span>
          </div>
          <ul className="space-y-2">
            {items.map((conversation) => (
              <li
                key={conversation.id}
                className="grid gap-x-4 gap-y-1 rounded-card border border-line bg-surface p-4 md:grid-cols-[1fr_7rem_12rem_10.5rem] md:items-center md:py-3"
              >
                <Link
                  href={`/chat/${conversation.id}`}
                  className="min-w-0 truncate font-medium text-ink underline-offset-4 hover:text-primary hover:underline"
                >
                  {conversation.title}
                </Link>
                <p className="text-sm text-ink-muted">
                  {conversation.messageCount}{" "}
                  {conversation.messageCount === 1 ? "message" : "messages"}
                </p>
                <p className="text-sm text-ink-muted">
                  <span className="md:sr-only">Last activity: </span>
                  <time dateTime={conversation.updatedAt}>
                    {formatDateTime(conversation.updatedAt)}
                  </time>
                </p>
                <div className="mt-2 flex gap-1 md:mt-0 md:justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Rename conversation: ${conversation.title}`}
                    onClick={() => setToRename(conversation)}
                  >
                    Rename
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:bg-danger-soft"
                    aria-label={`Delete conversation: ${conversation.title}`}
                    onClick={() => setToDelete(conversation)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <RenameConversationDialog
        conversation={toRename}
        onClose={() => setToRename(null)}
        onRenamed={(updated) => {
          conversations.setData((current) => ({
            conversations: current.conversations
              .map((item) => (item.id === updated.id ? updated : item))
              .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
          }));
        }}
      />

      <DeleteConversationDialog
        conversation={toDelete}
        onClose={() => setToDelete(null)}
        onDeleted={(id) => {
          conversations.setData((current) => ({
            conversations: current.conversations.filter((item) => item.id !== id),
          }));
          // The button that opened the dialog is gone; keep focus in the list.
          regionRef.current?.focus();
        }}
      />
    </div>
  );
}
