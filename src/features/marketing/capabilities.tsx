import { Container } from "@/components/layout";

const CAPABILITIES = [
  {
    title: "Concept explanations",
    description:
      "Closures, recursion, async code, type systems. Ask for a plain explanation and a short example you can run.",
  },
  {
    title: "Debugging",
    description:
      "Paste the error and the code around it. The assistant points to the likely cause and explains the fix.",
  },
  {
    title: "Algorithms",
    description:
      "Work through sorting, searching, and graph problems step by step, with time and space complexity.",
  },
  {
    title: "Data structures",
    description:
      "Compare arrays, linked lists, hash maps, and trees, and learn when each one is the right choice.",
  },
  {
    title: "Code improvement",
    description:
      "Share working code and get suggestions for clearer names, simpler logic, and safer edge cases.",
  },
] as const;

export function Capabilities() {
  return (
    <section aria-labelledby="capabilities-heading" className="border-y border-line bg-surface">
      <Container className="grid gap-10 py-16 lg:grid-cols-[1fr_2fr] lg:gap-16 lg:py-20">
        <div>
          <h2
            id="capabilities-heading"
            className="text-2xl font-bold tracking-tight text-ink sm:text-3xl"
          >
            What you can ask about
          </h2>
          <p className="mt-3 max-w-prose leading-7 text-ink-muted">
            The assistant stays within programming and software engineering. Questions outside that
            area are declined, so the answers you get stay focused.
          </p>
        </div>
        <dl className="divide-y divide-line border-y border-line">
          {CAPABILITIES.map((capability) => (
            <div
              key={capability.title}
              className="grid gap-1 py-5 sm:grid-cols-[12rem_1fr] sm:gap-6"
            >
              <dt className="font-semibold text-ink">{capability.title}</dt>
              <dd className="leading-7 text-ink-muted">{capability.description}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
