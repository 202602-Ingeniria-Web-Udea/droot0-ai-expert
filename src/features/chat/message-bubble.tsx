import type { Message } from "@/lib/contracts/conversations";
import { formatTime } from "@/lib/utils/format";
import { Markdown } from "./markdown";

/**
 * One message of the conversation.
 *
 * Assistant replies are rendered as Markdown. User messages are shown exactly
 * as typed, so pasted code keeps its line breaks and indentation.
 */
export function MessageBubble({ message }: { message: Message }) {
  const fromUser = message.role === "USER";

  return (
    <li className={fromUser ? "ml-auto max-w-[85%]" : "min-w-0"}>
      <p className={`mb-1 text-xs font-medium text-ink-muted ${fromUser ? "text-right" : ""}`}>
        {fromUser ? "You" : "AI Expert Chat"}
        <span className="sr-only"> at </span>
        <time dateTime={message.createdAt} className="ml-2 font-normal">
          {formatTime(message.createdAt)}
        </time>
      </p>
      {fromUser ? (
        <p className="rounded-card bg-primary-soft px-4 py-3 text-[0.9375rem] leading-7 wrap-anywhere whitespace-pre-wrap text-ink">
          {message.content}
        </p>
      ) : (
        <Markdown content={message.content} />
      )}
    </li>
  );
}
