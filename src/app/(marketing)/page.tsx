import Link from "next/link";
import { Container } from "@/components/layout";
import { buttonStyles } from "@/components/ui";
import { Capabilities } from "@/features/marketing/capabilities";
import { ChatPreview } from "@/features/marketing/chat-preview";

export default function LandingPage() {
  return (
    <>
      <section>
        <Container className="grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-balance text-ink sm:text-5xl">
              Ask programming questions. Get answers you can follow.
            </h1>
            <p className="mt-5 max-w-prose text-lg leading-8 text-ink-muted">
              AI Expert Chat is an assistant specialized in programming. It explains concepts, finds
              bugs, and walks through algorithms step by step, with code you can read.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className={buttonStyles({ size: "lg" })}>
                Create an account
              </Link>
              <Link href="/login" className={buttonStyles({ variant: "secondary", size: "lg" })}>
                Log in
              </Link>
            </div>
          </div>
          <ChatPreview />
        </Container>
      </section>

      <Capabilities />

      <section aria-labelledby="start-heading">
        <Container width="content" className="py-16 text-center lg:py-20">
          <h2 id="start-heading" className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Start with the question you are stuck on
          </h2>
          <p className="mx-auto mt-3 max-w-prose leading-7 text-ink-muted">
            Your conversations are saved to your account, so you can pick them up later.
          </p>
          <div className="mt-7 flex justify-center">
            <Link href="/register" className={buttonStyles({ size: "lg" })}>
              Create an account
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
