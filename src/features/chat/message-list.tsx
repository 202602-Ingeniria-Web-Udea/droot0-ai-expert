import type { Message } from "@/lib/contracts/conversations";
import { formatTime } from "@/lib/utils/format";

/**
 * Plain-text message list.
 * Markdown and code blocks are added in the message rendering feature.
 */
export function MessageList({ messages }: { messages: Message[] }) {
  return (
    <ol role="log" aria-label="Conversation messages" className="space-y-6">
      {messages.map((message) => {
        const fromUser = message.role === "USER";

        return (
          <li key={message.id} className={fromUser ? "ml-auto max-w-[85%]" : "max-w-full"}>
            <p className="mb-1 text-xs font-medium text-ink-muted">
              {fromUser ? "You" : "AI Expert Chat"}
              <span className="sr-only"> at </span>
              <time dateTime={message.createdAt} className="ml-2 font-normal">
                {formatTime(message.createdAt)}
              </time>
            </p>
            <p
              className={
                fromUser
                  ? "rounded-card bg-primary-soft px-4 py-3 text-sm leading-6 whitespace-pre-wrap text-ink"
                  : "text-sm leading-7 whitespace-pre-wrap text-ink"
              }
            >
              {message.content}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
