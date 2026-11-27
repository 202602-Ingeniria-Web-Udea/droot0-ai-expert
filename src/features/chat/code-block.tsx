"use client";

import {
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";

type CopyState = "idle" | "copied" | "failed";

const COPY_LABELS: Record<CopyState, string> = {
  idle: "Copy code",
  copied: "Copied",
  failed: "Copy failed",
};

const LANGUAGE_LABELS: Record<string, { label: string; dot: string }> = {
  js: { label: "JavaScript", dot: "bg-[#f7df1e]" },
  javascript: { label: "JavaScript", dot: "bg-[#f7df1e]" },
  node: { label: "JavaScript", dot: "bg-[#f7df1e]" },
  jsx: { label: "JSX", dot: "bg-[#f7df1e]" },
  ts: { label: "TypeScript", dot: "bg-[#3178c6]" },
  typescript: { label: "TypeScript", dot: "bg-[#3178c6]" },
  tsx: { label: "TSX", dot: "bg-[#3178c6]" },
  py: { label: "Python", dot: "bg-[#3776ab]" },
  python: { label: "Python", dot: "bg-[#3776ab]" },
  html: { label: "HTML", dot: "bg-[#e34f26]" },
  css: { label: "CSS", dot: "bg-[#1572b6]" },
  sql: { label: "SQL", dot: "bg-[#a78bfa]" },
  postgres: { label: "PostgreSQL", dot: "bg-[#336791]" },
  postgresql: { label: "PostgreSQL", dot: "bg-[#336791]" },
  java: { label: "Java", dot: "bg-[#e76f00]" },
  c: { label: "C", dot: "bg-[#a8b9cc]" },
  cpp: { label: "C++", dot: "bg-[#00599c]" },
  "c++": { label: "C++", dot: "bg-[#00599c]" },
  cs: { label: "C#", dot: "bg-[#68217a]" },
  csharp: { label: "C#", dot: "bg-[#68217a]" },
  go: { label: "Go", dot: "bg-[#00add8]" },
  golang: { label: "Go", dot: "bg-[#00add8]" },
  rust: { label: "Rust", dot: "bg-[#dea584]" },
  rs: { label: "Rust", dot: "bg-[#dea584]" },
  php: { label: "PHP", dot: "bg-[#777bb4]" },
  ruby: { label: "Ruby", dot: "bg-[#cc342d]" },
  rb: { label: "Ruby", dot: "bg-[#cc342d]" },
  bash: { label: "Shell", dot: "bg-[#4eaa25]" },
  sh: { label: "Shell", dot: "bg-[#4eaa25]" },
  shell: { label: "Shell", dot: "bg-[#4eaa25]" },
  json: { label: "JSON", dot: "bg-[#f7df1e]" },
  yaml: { label: "YAML", dot: "bg-[#cb171e]" },
  yml: { label: "YAML", dot: "bg-[#cb171e]" },
  md: { label: "Markdown", dot: "bg-[#94a3b8]" },
  markdown: { label: "Markdown", dot: "bg-[#94a3b8]" },
  diff: { label: "Diff", dot: "bg-[#94a3b8]" },
};

/** Reads the language from the `language-xxx` class that Markdown puts on <code>. */
function languageOf(children: ReactNode) {
  if (!isValidElement<{ className?: string }>(children)) {
    return null;
  }

  return /language-([\w+#-]+)/.exec(children.props.className ?? "")?.[1] ?? null;
}

function languageBadge(language: string | null) {
  if (!language) {
    return { label: "Code", dot: "bg-code-ink/50" };
  }

  return (
    LANGUAGE_LABELS[language.toLowerCase()] ?? {
      label: language.toUpperCase(),
      dot: "bg-code-ink/50",
    }
  );
}

/**
 * Fenced code block: language badge, copy button, and horizontal scrolling for
 * long lines. The code is only displayed and copied; it is never executed.
 */
export function CodeBlock({ children, ...props }: ComponentProps<"pre">) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const language = languageOf(children);
  const badge = languageBadge(language);

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
        <span
          data-language={badge.label}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 font-mono text-[0.6875rem] font-medium tracking-wide text-code-ink/85 uppercase"
        >
          <span aria-hidden="true" className={cn("size-1.5 rounded-full", badge.dot)} />
          {badge.label}
        </span>
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
