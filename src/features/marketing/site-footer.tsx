import Link from "next/link";
import { Container } from "@/components/layout";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <Container className="flex flex-col gap-3 py-8 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
        <p>AI Expert Chat is a Web Engineering course project at Universidad de Antioquia.</p>
        <nav aria-label="Footer" className="flex gap-5">
          <Link href="/login" className="underline underline-offset-4 hover:text-ink">
            Log in
          </Link>
          <Link href="/register" className="underline underline-offset-4 hover:text-ink">
            Create account
          </Link>
        </nav>
      </Container>
    </footer>
  );
}
