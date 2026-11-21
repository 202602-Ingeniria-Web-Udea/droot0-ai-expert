/**
 * Shown while the assistant's reply is pending. It lives inside the message
 * log, so screen readers announce it like any other new entry.
 */
export function TypingIndicator() {
  return (
    <li className="flex items-center gap-3 text-sm text-ink-muted">
      <span aria-hidden="true" className="flex gap-1">
        <span className="size-1.5 animate-pulse rounded-full bg-ink-subtle" />
        <span className="size-1.5 animate-pulse rounded-full bg-ink-subtle [animation-delay:200ms]" />
        <span className="size-1.5 animate-pulse rounded-full bg-ink-subtle [animation-delay:400ms]" />
      </span>
      AI Expert Chat is writing a reply
    </li>
  );
}
