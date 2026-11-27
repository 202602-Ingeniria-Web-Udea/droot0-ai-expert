// @vitest-environment jsdom
import "./setup";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui";
import { ChatView as BareChatView } from "@/features/chat/chat-view";
import { conversationDetailFixture } from "@/lib/contracts/fixtures";
import { api, fail, installMockServer, ok, server } from "./msw/server";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("@/lib/api/redirect", () => ({ redirectToLogin: vi.fn() }));

installMockServer();

/** ChatView needs the toast context that the root layout provides in the app. */
function ChatView(props: { conversationId?: string }) {
  return (
    <ToastProvider>
      <BareChatView {...props} />
    </ToastProvider>
  );
}

const conversationId = conversationDetailFixture.conversation.id;
const conversationUrl = api(`/api/conversations/${conversationId}`);

describe("ChatView layout", () => {
  it("shows the empty state for a new conversation, without any message", () => {
    render(<ChatView />);

    expect(screen.getByRole("heading", { level: 1, name: "New conversation" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What are you working on?" })).toBeInTheDocument();
    expect(screen.getByText("Compare quicksort and merge sort.")).toBeInTheDocument();
    expect(screen.queryByRole("log")).not.toBeInTheDocument();
  });

  it("shows a loading state, then the conversation title and messages", async () => {
    server.use(
      http.get(conversationUrl, async () => {
        await delay(30);
        return ok(conversationDetailFixture);
      }),
    );
    render(<ChatView conversationId={conversationId} />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading conversation");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Explain JavaScript closures" }),
    ).toBeInTheDocument();
    const log = screen.getByRole("log", { name: "Conversation messages" });
    expect(log).toHaveTextContent("Can you explain JavaScript closures with a small example?");
    expect(log).toHaveTextContent("A closure is a function that keeps access to variables");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows a not-found state without details when the conversation is not available", async () => {
    server.use(http.get(conversationUrl, () => fail(404, "NOT_FOUND", "Conversation not found.")));
    render(<ChatView conversationId={conversationId} />);

    expect(
      await screen.findByRole("heading", { name: "This conversation is not available" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start a new conversation" })).toHaveAttribute(
      "href",
      "/chat",
    );
  });

  it("offers a retry when loading fails", async () => {
    let calls = 0;
    server.use(
      http.get(conversationUrl, () => {
        calls += 1;
        return calls === 1
          ? fail(500, "INTERNAL_ERROR", "An unexpected server error occurred.")
          : ok(conversationDetailFixture);
      }),
    );
    render(<ChatView conversationId={conversationId} />);

    await userEvent.click(await screen.findByRole("button", { name: "Try again" }));

    expect(await screen.findByRole("log")).toBeInTheDocument();
  });

  it("saves feedback on an assistant message", async () => {
    const assistantId = conversationDetailFixture.messages[1]!.id;
    const bodies: unknown[] = [];

    server.use(
      http.get(conversationUrl, () => ok(conversationDetailFixture)),
      http.put(api(`/api/messages/${assistantId}/feedback`), async ({ request }) => {
        bodies.push(await request.json());
        return ok({
          feedback: {
            value: "UP",
            createdAt: "2026-11-06T09:07:00.000Z",
            updatedAt: "2026-11-06T09:07:00.000Z",
          },
        });
      }),
    );
    render(<ChatView conversationId={conversationId} />);

    const helpful = await screen.findByRole("button", { name: "Helpful" });
    await userEvent.click(helpful);

    await waitFor(() => expect(helpful).toHaveAttribute("aria-pressed", "true"));
    expect(bodies).toEqual([{ value: "UP" }]);
  });

  it("restores the previous rating when saving fails", async () => {
    const assistantId = conversationDetailFixture.messages[1]!.id;

    server.use(
      http.get(conversationUrl, () => ok(conversationDetailFixture)),
      http.put(api(`/api/messages/${assistantId}/feedback`), () =>
        fail(500, "INTERNAL_ERROR", "An unexpected server error occurred."),
      ),
    );
    render(<ChatView conversationId={conversationId} />);

    const helpful = await screen.findByRole("button", { name: "Helpful" });
    await userEvent.click(helpful);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Feedback was not saved");
    await waitFor(() => expect(helpful).toHaveAttribute("aria-pressed", "false"));
  });
});
