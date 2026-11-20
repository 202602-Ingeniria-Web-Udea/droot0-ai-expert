import { cn } from "@/lib/utils/cn";

function Bar({ className }: { className: string }) {
  return <div className={cn("h-4 animate-pulse rounded bg-sunken", className)} />;
}

/** Placeholder while a conversation is being opened. */
export function ChatSkeleton() {
  return (
    <div role="status" className="space-y-8 py-2">
      <span className="sr-only">Loading conversation</span>
      <div className="ml-auto w-2/3 space-y-2">
        <Bar className="ml-auto w-16" />
        <Bar className="h-12 w-full" />
      </div>
      <div className="w-5/6 space-y-2">
        <Bar className="w-24" />
        <Bar className="w-full" />
        <Bar className="w-11/12" />
        <Bar className="w-2/3" />
      </div>
      <div className="ml-auto w-1/2 space-y-2">
        <Bar className="ml-auto w-16" />
        <Bar className="h-10 w-full" />
      </div>
    </div>
  );
}
