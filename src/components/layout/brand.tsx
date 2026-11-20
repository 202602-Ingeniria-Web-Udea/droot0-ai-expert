import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type BrandProps = {
  /** Where the brand links to. Defaults to the landing page. */
  href?: string;
  className?: string;
};

/** Application name with its mark. Used in every header and in the sidebar. */
export function Brand({ href = "/", className }: BrandProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-control text-base font-semibold tracking-tight whitespace-nowrap text-ink",
        className,
      )}
    >
      <svg viewBox="0 0 28 28" aria-hidden="true" className="size-7 shrink-0">
        <rect width="28" height="28" rx="7" className="fill-primary" />
        <path
          d="m8.5 10 4 4-4 4M15 18.5h5"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      AI Expert Chat
    </Link>
  );
}
