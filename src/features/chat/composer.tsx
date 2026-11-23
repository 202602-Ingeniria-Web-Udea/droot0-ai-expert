"use client";

import { useLayoutEffect, useRef, type KeyboardEvent } from "react";
import { Button } from "@/components/ui";
import { controlStyles } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";

/** Same limit as `messageContentSchema` in the shared contract. */
export const MAX_MESSAGE_LENGTH = 8000;
const COUNTER_FROM = MAX_MESSAGE_LENGTH - 500;
const MAX_HEIGHT = 200;

type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  /** Called with the current text when the user sends it. */
  onSubmit: () => void;
  /** True while a reply is pending: typing stays possible, sending does not. */
  pending: boolean;
};

export function Composer({ value, onChange, onSubmit, pending }: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const length = value.trim().length;
  const tooLong = length > MAX_MESSAGE_LENGTH;
  const canSend = length > 0 && !tooLong && !pending;

  // Grow with the content up to a limit, then scroll inside the field.
  useLayoutEffect(() => {
    const textarea = textareaRef.current;

    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_HEIGHT)}px`;
    }
  }, [value]);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter adds a line. Enter that confirms an IME
    // composition (for example, Japanese input) must not send.
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();

    if (canSend) {
      onSubmit();
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();

        if (canSend) {
          onSubmit();
        }
      }}
    >
      <div className="flex items-end gap-2">
        <label htmlFor="chat-message" className="sr-only">
          Message
        </label>
        <textarea
          ref={textareaRef}
          id="chat-message"
          rows={1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a programming question"
          aria-describedby="chat-message-help"
          aria-invalid={tooLong || undefined}
          className={cn(controlStyles, "min-h-10 resize-none py-2 leading-6")}
        />
        <Button type="submit" disabled={!canSend} loading={pending}>
          {pending ? "Sending" : "Send"}
        </Button>
      </div>
      <div className="mt-1.5 flex justify-between gap-3 text-xs text-ink-muted">
        <p id="chat-message-help">
          {tooLong
            ? `Messages can have up to ${formatNumber(MAX_MESSAGE_LENGTH)} characters.`
            : "Enter to send, Shift+Enter for a new line."}
        </p>
        {length >= COUNTER_FROM ? (
          <p className={tooLong ? "font-medium text-danger" : undefined}>
            {formatNumber(length)} / {formatNumber(MAX_MESSAGE_LENGTH)}
          </p>
        ) : null}
      </div>
    </form>
  );
}
