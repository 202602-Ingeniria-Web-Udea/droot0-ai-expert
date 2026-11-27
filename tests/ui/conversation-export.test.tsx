// @vitest-environment jsdom
import "./setup";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui";
import { ChatView } from "@/features/chat/chat-view";
import { conversationDetailFixture, conversationSummaryFixture } from "@/lib/contracts/fixtures";
import { api, installMockServer, ok, server } from "./msw/server";

const mocks = vi.hoisted(() => ({
  download: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/lib/api/redirect", () => ({ redirectToLogin: vi.fn() }));

vi.mock("@/lib/utils/conversation-export", () => ({
  downloadConversationExport: mocks.download,
}));

installMockServer();

function renderConversation() {
  return render(
    <ToastProvider>
      <ChatView conversationId={conversationSummaryFixture.id} />
    </ToastProvider>,
  );
}

describe("conversation export", () => {
  it("offers Markdown and JSON downloads from the chat header", async () => {
    server.use(
      http.get(api(`/api/conversations/${conversationSummaryFixture.id}`), () =>
        ok(conversationDetailFixture),
      ),
    );

    renderConversation();
    await screen.findByRole("log");

    await userEvent.click(screen.getByRole("button", { name: "Export" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Download Markdown" }));

    expect(mocks.download).toHaveBeenCalledWith(
      {
        conversation: conversationDetailFixture.conversation,
        messages: conversationDetailFixture.messages,
      },
      "markdown",
    );
    expect(await screen.findByText("Markdown export downloaded")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Export" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Download JSON" }));

    await waitFor(() => expect(mocks.download).toHaveBeenCalledTimes(2));
    expect(mocks.download).toHaveBeenLastCalledWith(
      {
        conversation: conversationDetailFixture.conversation,
        messages: conversationDetailFixture.messages,
      },
      "json",
    );
    expect(await screen.findByText("JSON export downloaded")).toBeInTheDocument();
  });
});
