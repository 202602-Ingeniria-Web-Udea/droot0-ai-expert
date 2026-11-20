const QUESTION_CODE = `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}`;

const ANSWER_CODE = `for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// 0, 1, 2`;

function CodeSample({ language, code }: { language: string; code: string }) {
  return (
    <div className="mt-3 overflow-hidden rounded-control bg-code">
      <div className="border-b border-white/10 px-3 py-1.5 font-mono text-xs text-code-ink/70">
        {language}
      </div>
      <pre className="overflow-x-auto p-3 text-[0.8125rem] leading-6 text-code-ink">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * Static illustration of a conversation for the landing page.
 * It is sample content written for this page, not data from the application.
 */
export function ChatPreview() {
  return (
    <figure className="rounded-dialog border border-line bg-surface shadow-overlay">
      <figcaption className="border-b border-line px-5 py-3 text-sm text-ink-muted">
        Example conversation
      </figcaption>
      <div className="space-y-5 p-5">
        <div className="ml-auto max-w-[92%]">
          <p className="mb-1 text-right text-xs font-medium text-ink-muted">You</p>
          <div className="rounded-card bg-primary-soft px-4 py-3 text-sm leading-6 text-ink">
            <p>Why does this print 3 three times instead of 0, 1, 2?</p>
            <CodeSample language="javascript" code={QUESTION_CODE} />
          </div>
        </div>
        <div className="max-w-[92%]">
          <p className="mb-1 text-xs font-medium text-ink-muted">AI Expert Chat</p>
          <div className="rounded-card border border-line px-4 py-3 text-sm leading-6 text-ink">
            <p>
              <code className="rounded bg-sunken px-1 py-0.5 text-[0.8125rem]">var</code> creates
              one variable shared by every iteration. By the time the callbacks run, the loop has
              finished and that variable is 3. Declare it with{" "}
              <code className="rounded bg-sunken px-1 py-0.5 text-[0.8125rem]">let</code> so each
              iteration gets its own binding:
            </p>
            <CodeSample language="javascript" code={ANSWER_CODE} />
          </div>
        </div>
      </div>
    </figure>
  );
}
