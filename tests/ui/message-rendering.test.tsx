// @vitest-environment jsdom
import "./setup";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MessageList } from "@/features/chat/message-list";
import type { Message } from "@/lib/contracts/conversations";

function message(role: Message["role"], content: string, index = 0): Message {
  return {
    id: `d5a3e4f6-7b8c-4d9e-af10-2b3c4d5e6f7${index}`,
    role,
    content,
    createdAt: "2026-11-06T09:06:00.000Z",
  };
}

const MARKDOWN = [
  "Use `const` for values that never change.",
  "",
  "```typescript",
  "const total: number = items.reduce((sum, item) => sum + item.price, 0);",
  "```",
  "",
  "- First point",
  "- Second point",
  "",
  "| Structure | Lookup |",
  "| --- | --- |",
  "| Array | O(n) |",
  "",
  "Read the [MDN guide](https://developer.mozilla.org/docs/Web/JavaScript) or the [history](/history).",
].join("\n");

describe("MessageList", () => {
  it("exposes the conversation as a named log with both authors", () => {
    render(
      <MessageList
        messages={[
          message("USER", "What is a closure?", 0),
          message("ASSISTANT", "A function.", 1),
        ]}
      />,
    );

    const log = screen.getByRole("log", { name: "Conversation messages" });
    expect(within(log).getAllByRole("listitem")).toHaveLength(2);
    expect(log).toHaveTextContent("You");
    expect(log).toHaveTextContent("AI Expert Chat");
  });

  it("renders inline code, lists, tables, and a labeled code block", () => {
    render(<MessageList messages={[message("ASSISTANT", MARKDOWN)]} />);

    expect(screen.getByText("const", { selector: "p > code" })).toBeInTheDocument();
    expect(screen.getByText("First point").closest("ul")).toBeInTheDocument();
    expect(screen.getByRole("table")).toHaveTextContent("Array");
    expect(screen.getByRole("columnheader", { name: "Lookup" })).toBeInTheDocument();
    expect(screen.getByText("typescript")).toBeInTheDocument();

    const code = document.querySelector("pre code");
    expect(code).toHaveTextContent("items.reduce((sum, item) => sum + item.price, 0);");
    // Syntax highlighting wraps tokens in spans.
    expect(code?.querySelector("span")).not.toBeNull();
  });

  it("opens external links in a new tab safely and leaves internal links alone", () => {
    render(<MessageList messages={[message("ASSISTANT", MARKDOWN)]} />);

    const external = screen.getByRole("link", { name: "MDN guide" });
    expect(external).toHaveAttribute("target", "_blank");
    expect(external).toHaveAttribute("rel", "noopener noreferrer");

    const internal = screen.getByRole("link", { name: "history" });
    expect(internal).not.toHaveAttribute("target");
  });

  it("copies the code and confirms it", async () => {
    const user = userEvent.setup();
    render(<MessageList messages={[message("ASSISTANT", MARKDOWN)]} />);

    await user.click(screen.getByRole("button", { name: "Copy code" }));

    expect(await screen.findByRole("button", { name: "Copied" })).toBeInTheDocument();
    expect(await navigator.clipboard.readText()).toContain(
      "const total: number = items.reduce((sum, item) => sum + item.price, 0);",
    );
  });

  it("does not turn HTML from the assistant into active markup", () => {
    const malicious = [
      'Before <script>window.hacked = true</script> <img src="x" onerror="window.hacked = true">',
      "",
      "[click me](javascript:window.hacked=true)",
    ].join("\n");
    render(<MessageList messages={[message("ASSISTANT", malicious)]} />);

    const log = screen.getByRole("log");
    expect(log.querySelector("script")).toBeNull();
    expect(log.querySelector("img")).toBeNull();
    expect(log.querySelector("[onerror]")).toBeNull();
    expect(log.querySelector('a[href^="javascript:"]')).toBeNull();
    expect((window as unknown as { hacked?: boolean }).hacked).toBeUndefined();
  });

  it("shows user messages exactly as typed, without interpreting Markdown or HTML", () => {
    render(<MessageList messages={[message("USER", "# not a heading\n<b>not bold</b>")]} />);

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.getByText(/# not a heading/)).toHaveTextContent("<b>not bold</b>");
  });
});
