// @vitest-environment jsdom
import "./setup";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui";
import { ChatView as BareChatView } from "@/features/chat/chat-view";
import type { ChatResponse } from "@/lib/contracts/chat";
import {
  chatResponseFixture,
  conversationDetailFixture,
  conversationSummaryFixture,
} from "@/lib/contracts/fixtures";
import { api, fail, installMockServer, ok, server } from "./msw/server";

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }));
const redirectToLogin = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/lib/api/redirect", () => ({ redirectToLogin }));

installMockServer();

/** ChatView needs the toast context that the root layout provides in the app. */
function ChatView(props: { conversationId?: string }) {
  return (
    <ToastProvider>
      <BareChatView {...props} />
    </ToastProvider>
  );
}

beforeEach(() => {
  router.replace.mockClear();
  redirectToLogin.mockClear();
});

const conversationId = conversationSummaryFixture.id;
const chatUrl = api("/api/chat");

/** Reply to a follow-up message in the fixture conversation. */
const followUp: ChatResponse = {
  conversation: { ...conversationSummaryFixture, messageCount: 4 },
  userMessage: {
    id: "e6b4f5a7-8c9d-4eaf-b021-3c4d5e6f7a81",
    role: "USER",
    content: "Show me a counter example.",
    createdAt: "2026-11-06T09:10:00.000Z",
  },
  assistantMessage: {
    id: "f7c5a6b8-9dae-4fb0-8132-4d5e6f7a8b92",
    role: "ASSISTANT",
    content: "Here is a counter built with a closure.",
    createdAt: "2026-11-06T09:10:05.000Z",
  },
};

function composer() {
  return screen.getByRole("textbox", { name: "Message" });
}

async function openStoredConversation() {
  server.use(
    http.get(api(`/api/conversations/${conversationId}`), () => ok(conversationDetailFixture)),
  );
  render(<ChatView conversationId={conversationId} />);
  await screen.findByRole("log");
}

describe("Chat composer", () => {
  it("cannot send an empty message", async () => {
    const onRequest = vi.fn();
    server.use(http.post(chatUrl, onRequest));
    render(<ChatView />);

    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    await userEvent.type(composer(), "   {Enter}");

    expect(onRequest).not.toHaveBeenCalled();
  });

  it("adds a line with Shift+Enter and sends with Enter", async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post(chatUrl, async ({ request }) => {
        bodies.push(await request.json());
        return ok(chatResponseFixture);
      }),
    );
    render(<ChatView />);

    await userEvent.type(composer(), "first line{Shift>}{Enter}{/Shift}second line");
    expect(composer()).toHaveValue("first line\nsecond line");
    expect(bodies).toHaveLength(0);

    await userEvent.keyboard("{Enter}");

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({ conversationId: null, content: "first line\nsecond line" });
  });

  it("opens the new conversation URL after the first successful message", async () => {
    server.use(http.post(chatUrl, () => ok(chatResponseFixture)));
    render(<ChatView />);

    await userEvent.type(composer(), "Explain closures{Enter}");

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith(`/chat/${conversationId}`));
  });

  it("fills the composer from a suggested question", async () => {
    render(<ChatView />);

    await userEvent.click(
      screen.getByRole("button", { name: "Compare quicksort and merge sort." }),
    );

    expect(composer()).toHaveValue("Compare quicksort and merge sort.");
  });

  it("shows the pending state, stays editable, and appends the stored messages", async () => {
    let body: unknown;
    server.use(
      http.post(chatUrl, async ({ request }) => {
        body = await request.json();
        await delay(60);
        return ok(followUp);
      }),
    );
    await openStoredConversation();

    await userEvent.type(composer(), "Show me a counter example.{Enter}");

    const log = screen.getByRole("log");
    expect(await within(log).findByText("AI Expert Chat is writing a reply")).toBeInTheDocument();
    expect(within(log).getByText("Show me a counter example.")).toBeInTheDocument();
    expect(composer()).toHaveValue("");

    // The field stays usable while the reply is pending.
    await userEvent.type(composer(), "next");
    expect(composer()).toHaveValue("next");
    expect(screen.getByRole("button", { name: "Sending" })).toBeDisabled();

    expect(
      await within(log).findByText("Here is a counter built with a closure."),
    ).toBeInTheDocument();
    expect(within(log).queryByText("AI Expert Chat is writing a reply")).not.toBeInTheDocument();
    expect(within(log).getAllByText("Show me a counter example.")).toHaveLength(1);
    expect(body).toEqual({ conversationId, content: "Show me a counter example." });
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("sends once when Enter is pressed twice", async () => {
    const onRequest = vi.fn();
    server.use(
      http.post(chatUrl, async () => {
        onRequest();
        await delay(60);
        return ok(followUp);
      }),
    );
    await openStoredConversation();

    await userEvent.type(composer(), "Show me a counter example.{Enter}{Enter}");

    await screen.findByText("Here is a counter built with a closure.");
    expect(onRequest).toHaveBeenCalledTimes(1);
  });

  it("removes the unsent message, restores the text, and retries without retyping", async () => {
    let calls = 0;
    server.use(
      http.post(chatUrl, () => {
        calls += 1;
        return calls === 1
          ? fail(504, "AI_TIMEOUT", "The assistant took too long to respond.")
          : ok(followUp);
      }),
    );
    await openStoredConversation();

    await userEvent.type(composer(), "Show me a counter example.{Enter}");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Your message was not sent");
    expect(alert).toHaveTextContent("The assistant took too long to respond.");
    // No duplicate or orphan message: only the two stored ones remain.
    expect(within(screen.getByRole("log")).getAllByRole("listitem")).toHaveLength(2);
    expect(composer()).toHaveValue("Show me a counter example.");

    await userEvent.click(within(alert).getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Here is a counter built with a closure.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(within(screen.getByRole("log")).getAllByRole("listitem")).toHaveLength(4);
    expect(composer()).toHaveValue("");
    expect(calls).toBe(2);
  });

  it.each([
    [429, "RATE_LIMITED", "Too many requests. Wait a moment and try again."],
    [502, "AI_PROVIDER_ERROR", "The assistant is unavailable right now. Try again in a moment."],
  ] as const)("explains a %i error and offers a retry", async (status, code, text) => {
    server.use(http.post(chatUrl, () => fail(status, code, "Server detail that is not shown.")));
    render(<ChatView />);

    await userEvent.type(composer(), "Explain closures{Enter}");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(text);
    expect(alert).not.toHaveTextContent("Server detail");
    expect(within(alert).getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("keeps the text and reports a connection problem when the network fails", async () => {
    server.use(http.post(chatUrl, () => HttpResponse.error()));
    render(<ChatView />);

    await userEvent.type(composer(), "Explain closures{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not reach the server.");
    expect(composer()).toHaveValue("Explain closures");
  });

  it("redirects to login on 401 and keeps the text", async () => {
    server.use(http.post(chatUrl, () => fail(401, "UNAUTHENTICATED", "Authentication required.")));
    render(<ChatView />);

    await userEvent.type(composer(), "Explain closures{Enter}");

    await waitFor(() => expect(redirectToLogin).toHaveBeenCalledOnce());
    expect(composer()).toHaveValue("Explain closures");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("does not offer a retry for a forbidden request", async () => {
    server.use(http.post(chatUrl, () => fail(403, "FORBIDDEN", "Invalid request origin.")));
    render(<ChatView />);

    await userEvent.type(composer(), "Explain closures{Enter}");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("You do not have permission to do this.");
    expect(within(alert).queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });
});
