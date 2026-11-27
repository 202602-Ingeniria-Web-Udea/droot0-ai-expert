// @vitest-environment jsdom
import "./setup";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui";
import { ChatView } from "@/features/chat/chat-view";
import { ConversationList } from "@/features/conversations/conversation-list";
import type { ConversationSummary } from "@/lib/contracts/conversations";
import { conversationDetailFixture, conversationSummaryFixture } from "@/lib/contracts/fixtures";
import { api, fail, installMockServer, ok, server } from "./msw/server";

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/lib/api/redirect", () => ({ redirectToLogin: vi.fn() }));

installMockServer();

beforeEach(() => {
  router.replace.mockClear();
});

const closures = conversationSummaryFixture;
const sorting: ConversationSummary = {
  id: "a2d0b1c3-4e5f-4a6b-9c8d-7e6f5a4b3c2d",
  title: "Compare quicksort and merge sort",
  createdAt: "2026-11-07T14:00:00.000Z",
  updatedAt: "2026-11-07T14:20:00.000Z",
  messageCount: 1,
};

const listUrl = api("/api/conversations");

function renderList() {
  return render(
    <ToastProvider>
      <ConversationList />
    </ToastProvider>,
  );
}

describe("ConversationList", () => {
  it("lists conversations with a link to open each one", async () => {
    server.use(http.get(listUrl, () => ok({ conversations: [sorting, closures] })));
    renderList();

    const link = await screen.findByRole("link", { name: "Explain JavaScript closures" });
    expect(link).toHaveAttribute("href", `/chat/${closures.id}`);

    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Compare quicksort and merge sort");
    expect(rows[0]).toHaveTextContent("1 message");
    expect(rows[1]).toHaveTextContent("2 messages");
    expect(rows[1]).toHaveTextContent("Last activity");
  });

  it("shows an empty state that leads to a new conversation", async () => {
    server.use(http.get(listUrl, () => ok({ conversations: [] })));
    renderList();

    expect(
      await screen.findByRole("heading", { name: "No conversations yet" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start a conversation" })).toHaveAttribute(
      "href",
      "/chat",
    );
  });

  it("shows a loading state and then recovers from an error with retry", async () => {
    let calls = 0;
    server.use(
      http.get(listUrl, () => {
        calls += 1;
        return calls === 1
          ? fail(500, "INTERNAL_ERROR", "An unexpected server error occurred.")
          : ok({ conversations: [closures] });
      }),
    );
    renderList();

    expect(screen.getByRole("status")).toHaveTextContent("Loading conversations");
    await userEvent.click(await screen.findByRole("button", { name: "Try again" }));

    expect(await screen.findByRole("link", { name: closures.title })).toBeInTheDocument();
  });

  it("does not delete until the user confirms", async () => {
    const onDelete = vi.fn();
    server.use(
      http.get(listUrl, () => ok({ conversations: [closures] })),
      http.delete(api(`/api/conversations/${closures.id}`), onDelete),
    );
    renderList();

    await userEvent.click(
      await screen.findByRole("button", { name: `Delete conversation: ${closures.title}` }),
    );
    const dialog = screen.getByRole("dialog", { name: "Delete this conversation?" });
    expect(dialog).toHaveAccessibleDescription(/Explain JavaScript closures/);

    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: closures.title })).toBeInTheDocument();
  });

  it("deletes with the keyboard after confirmation and updates the list", async () => {
    const onDelete = vi.fn();
    server.use(
      http.get(listUrl, () => ok({ conversations: [sorting, closures] })),
      http.delete(api(`/api/conversations/${closures.id}`), () => {
        onDelete();
        return ok({ success: true });
      }),
    );
    renderList();

    const deleteButton = await screen.findByRole("button", {
      name: `Delete conversation: ${closures.title}`,
    });
    deleteButton.focus();
    await userEvent.keyboard("{Enter}");
    const dialog = screen.getByRole("dialog");
    within(dialog).getByRole("button", { name: "Delete conversation" }).focus();
    await userEvent.keyboard("{Enter}");

    await waitFor(() =>
      expect(screen.queryByRole("link", { name: closures.title })).not.toBeInTheDocument(),
    );
    expect(onDelete).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: sorting.title })).toBeInTheDocument();
    expect(await screen.findByText("Conversation deleted")).toBeInTheDocument();
  });

  it("keeps the conversation and explains when deleting fails", async () => {
    server.use(
      http.get(listUrl, () => ok({ conversations: [closures] })),
      http.delete(api(`/api/conversations/${closures.id}`), () =>
        fail(500, "INTERNAL_ERROR", "An unexpected server error occurred."),
      ),
    );
    renderList();

    await userEvent.click(
      await screen.findByRole("button", { name: `Delete conversation: ${closures.title}` }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Delete conversation" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("The conversation was not deleted");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: closures.title, hidden: true })).toBeInTheDocument();
  });

  it("renames a conversation and updates the list", async () => {
    const onRename = vi.fn();
    const renamed = {
      ...closures,
      title: "Closures and lexical scope",
      updatedAt: "2026-11-08T10:00:00.000Z",
    };

    server.use(
      http.get(listUrl, () => ok({ conversations: [sorting, closures] })),
      http.patch(api(`/api/conversations/${closures.id}`), async ({ request }) => {
        onRename(await request.json());
        return ok({ conversation: renamed });
      }),
    );
    renderList();

    await userEvent.click(
      await screen.findByRole("button", { name: `Rename conversation: ${closures.title}` }),
    );

    const dialog = screen.getByRole("dialog", { name: "Rename conversation" });
    const input = within(dialog).getByLabelText("Conversation title");
    expect(input).toHaveValue(closures.title);

    await userEvent.clear(input);
    await userEvent.type(input, "Closures and lexical scope");
    await userEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(screen.queryByRole("link", { name: closures.title })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("link", { name: "Closures and lexical scope" })).toBeInTheDocument();
    expect(onRename).toHaveBeenCalledWith({ title: "Closures and lexical scope" });
    expect(await screen.findByText("Conversation renamed")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("Closures and lexical scope");
  });

  it("rejects an empty conversation title", async () => {
    const onRename = vi.fn();

    server.use(
      http.get(listUrl, () => ok({ conversations: [closures] })),
      http.patch(api(`/api/conversations/${closures.id}`), onRename),
    );
    renderList();

    await userEvent.click(
      await screen.findByRole("button", { name: `Rename conversation: ${closures.title}` }),
    );

    const dialog = screen.getByRole("dialog", { name: "Rename conversation" });
    await userEvent.clear(within(dialog).getByLabelText("Conversation title"));
    await userEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));

    expect(
      await within(dialog).findByText("Enter a title for the conversation."),
    ).toBeInTheDocument();
    expect(onRename).not.toHaveBeenCalled();
  });
});

describe("Renaming the open conversation", () => {
  it("updates the chat header title", async () => {
    const renamed = {
      ...closures,
      title: "Closures and lexical scope",
      updatedAt: "2026-11-08T10:00:00.000Z",
    };

    server.use(
      http.get(api(`/api/conversations/${closures.id}`), () => ok(conversationDetailFixture)),
      http.patch(api(`/api/conversations/${closures.id}`), () => ok({ conversation: renamed })),
    );

    render(
      <ToastProvider>
        <ChatView conversationId={closures.id} />
      </ToastProvider>,
    );

    await userEvent.click(await screen.findByRole("button", { name: "Rename" }));
    const dialog = screen.getByRole("dialog", { name: "Rename conversation" });
    const input = within(dialog).getByLabelText("Conversation title");

    await userEvent.clear(input);
    await userEvent.type(input, "Closures and lexical scope");
    await userEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByRole("heading", { name: "Closures and lexical scope" }),
    ).toBeInTheDocument();
  });
});

describe("Deleting the open conversation", () => {
  it("returns to a new, empty chat", async () => {
    server.use(
      http.get(api(`/api/conversations/${closures.id}`), () => ok(conversationDetailFixture)),
      http.delete(api(`/api/conversations/${closures.id}`), () => ok({ success: true })),
    );
    render(
      <ToastProvider>
        <ChatView conversationId={closures.id} />
      </ToastProvider>,
    );

    await userEvent.click(await screen.findByRole("button", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete conversation" }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/chat"));
  });
});
