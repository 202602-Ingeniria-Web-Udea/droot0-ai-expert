import Link from "next/link";
import { Brand, Container } from "@/components/layout";
import { buttonStyles } from "@/components/ui";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-surface">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Brand />
        <nav aria-label="Account" className="flex items-center gap-1 sm:gap-2">
          {/* On narrow screens the header keeps one action; the hero offers "Log in" too. */}
          <Link
            href="/login"
            className={buttonStyles({ variant: "ghost", size: "sm", className: "max-sm:hidden" })}
          >
            Log in
          </Link>
          <Link href="/register" className={buttonStyles({ size: "sm" })}>
            Create account
          </Link>
        </nav>
      </Container>
    </header>
  );
}
