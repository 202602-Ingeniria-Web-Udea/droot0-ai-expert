"use client";

import {
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";

type CopyState = "idle" | "copied" | "failed";

const COPY_LABELS: Record<CopyState, string> = {
  idle: "Copy code",
  copied: "Copied",
  failed: "Copy failed",
};

/** Reads the language from the `language-xxx` class that Markdown puts on <code>. */
function languageOf(children: ReactNode) {
  if (!isValidElement<{ className?: string }>(children)) {
    return null;
  }

  return /language-([\w+#-]+)/.exec(children.props.className ?? "")?.[1] ?? null;
}

/**
 * Fenced code block: language label, copy button, and horizontal scrolling for
 * long lines. The code is only displayed and copied; it is never executed.
 */
export function CodeBlock({ children, ...props }: ComponentProps<"pre">) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const language = languageOf(children);

  // Return the button to its idle label a moment after copying.
  useEffect(() => {
    if (copyState === "idle") {
      return;
    }

    const timer = setTimeout(() => setCopyState("idle"), 2000);
    return () => clearTimeout(timer);
  }, [copyState]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(preRef.current?.textContent ?? "");
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <div className="overflow-hidden rounded-card bg-code">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 py-1 pr-1 pl-4 text-xs text-code-ink/75">
        <span className="font-mono">{language ?? "code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-control px-2.5 py-1.5 font-medium text-code-ink outline-offset-0 outline-white hover:bg-white/10"
        >
          <span aria-live="polite">{COPY_LABELS[copyState]}</span>
        </button>
      </div>
      <pre
        ref={preRef}
        tabIndex={0}
        className="overflow-x-auto p-4 text-[0.8125rem] leading-6 text-code-ink outline-offset-[-2px] outline-white"
        {...props}
      >
        {children}
      </pre>
    </div>
  );
}
