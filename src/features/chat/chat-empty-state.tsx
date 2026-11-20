const SUGGESTIONS = [
  "Explain JavaScript closures with a short example.",
  "Why does my recursive function cause a stack overflow?",
  "Compare quicksort and merge sort.",
  "When should I use a hash map instead of an array?",
] as const;

type ChatEmptyStateProps = {
  /** When provided, suggestions become buttons that start a message. */
  onSelect?: (suggestion: string) => void;
};

/** Shown in a conversation that has no messages yet. */
export function ChatEmptyState({ onSelect }: ChatEmptyStateProps) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center py-10 text-center sm:py-16">
      <h2 className="text-2xl font-bold tracking-tight text-ink">What are you working on?</h2>
      <p className="mt-2 leading-7 text-ink-muted">
        Ask about a concept, paste an error message, or share code you want to improve.
      </p>

      <h3 className="mt-8 text-sm font-medium text-ink-muted">Questions to try</h3>
      <ul className="mt-3 grid w-full gap-2 text-left sm:grid-cols-2">
        {SUGGESTIONS.map((suggestion) => (
          <li key={suggestion}>
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(suggestion)}
                className="h-full w-full rounded-card border border-line bg-surface px-4 py-3 text-left text-sm leading-6 text-ink transition-colors hover:border-line-strong"
              >
                {suggestion}
              </button>
            ) : (
              <p className="h-full rounded-card border border-line bg-surface px-4 py-3 text-sm leading-6 text-ink">
                {suggestion}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
