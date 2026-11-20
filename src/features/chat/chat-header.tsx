import type { ReactNode } from "react";

type ChatHeaderProps = {
  title: string;
  /** Actions for the open conversation. */
  actions?: ReactNode;
};

export function ChatHeader({ title, actions }: ChatHeaderProps) {
  return (
    <header className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4 py-2 sm:px-6">
      <h1 className="min-w-0 truncate text-base font-semibold tracking-tight text-ink">{title}</h1>
      {actions}
    </header>
  );
}
