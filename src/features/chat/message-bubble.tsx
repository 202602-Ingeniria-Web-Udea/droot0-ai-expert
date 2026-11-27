import { Button } from "@/components/ui";
import { ThumbsDownIcon, ThumbsUpIcon } from "@/components/ui/icons";
import type { FeedbackValue, Message } from "@/lib/contracts/conversations";
import { cn } from "@/lib/utils/cn";
import { formatTime } from "@/lib/utils/format";
import { Markdown } from "./markdown";

type MessageBubbleProps = {
  message: Message;
  /** True while this message's feedback is being saved. */
  feedbackPending?: boolean;
  /** Called with the new value, or null when the selected rating is removed. */
  onFeedbackChange?: (messageId: string, value: FeedbackValue | null) => void;
};

/**
 * One message of the conversation.
 *
 * Assistant replies are rendered as Markdown and can be rated by the reader.
 * User messages are shown exactly as typed, so pasted code keeps its line
 * breaks and indentation.
 */
export function MessageBubble({
  message,
  feedbackPending = false,
  onFeedbackChange,
}: MessageBubbleProps) {
  const fromUser = message.role === "USER";
  const feedback = message.feedback?.value ?? null;

  function rate(value: FeedbackValue) {
    if (!onFeedbackChange) {
      return;
    }

    // Choosing the active rating again removes it.
    onFeedbackChange(message.id, feedback === value ? null : value);
  }

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
        <>
          <Markdown content={message.content} />
          {onFeedbackChange ? (
            <div
              role="group"
              aria-label="Rate this response"
              aria-busy={feedbackPending || undefined}
              className="mt-2 flex items-center gap-1"
            >
              <Button
                variant="ghost"
                size="sm"
                aria-pressed={feedback === "UP"}
                disabled={feedbackPending}
                className={cn(
                  "gap-1.5 px-2 text-ink-muted",
                  feedback === "UP" && "bg-primary-soft text-primary hover:bg-primary-soft",
                )}
                onClick={() => rate("UP")}
              >
                <ThumbsUpIcon className="size-4" />
                Helpful
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-pressed={feedback === "DOWN"}
                disabled={feedbackPending}
                className={cn(
                  "gap-1.5 px-2 text-ink-muted",
                  feedback === "DOWN" && "bg-danger-soft text-danger hover:bg-danger-soft",
                )}
                onClick={() => rate("DOWN")}
              >
                <ThumbsDownIcon className="size-4" />
                Not helpful
              </Button>
              {feedbackPending ? (
                <span role="status" className="sr-only">
                  Saving feedback
                </span>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </li>
  );
}
