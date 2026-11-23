import type { ReactNode } from "react";
import type { Message } from "@/lib/contracts/conversations";
import { MessageBubble } from "./message-bubble";

type MessageListProps = {
  messages: Message[];
  /** Extra items after the messages, such as the "assistant is writing" indicator. */
  children?: ReactNode;
};

/**
 * The conversation as a live log: screen readers can find it by name and are
 * told about messages that are added while it is open.
 */
export function MessageList({ messages, children }: MessageListProps) {
  return (
    <ol role="log" aria-label="Conversation messages" className="space-y-7">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {children}
    </ol>
  );
}
