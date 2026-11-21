// @vitest-environment jsdom
import "./setup";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui";
import { AssistantForm } from "@/features/admin/assistant-form";
import { assistantConfigFixture } from "@/lib/contracts/fixtures";
import { api, fail, installMockServer, ok, server } from "./msw/server";

vi.mock("@/lib/api/redirect", () => ({ redirectToLogin: vi.fn() }));

installMockServer();

const url = api("/api/admin/assistant");

async function renderLoaded() {
  server.use(http.get(url, () => ok({ config: assistantConfigFixture })));
  render(
    <ToastProvider>
      <AssistantForm />
    </ToastProvider>,
  );

  return screen.findByLabelText("Assistant name");
}

async function replace(label: string, value: string) {
  const field = screen.getByLabelText(label);
  await userEvent.clear(field);

  if (value) {
    await userEvent.type(field, value);
  }
}

describe("AssistantForm", () => {
  it("shows the configuration that the backend returns", async () => {
    expect(await renderLoaded()).toHaveValue("Programming Expert");

    expect(screen.getByLabelText("Model")).toHaveValue("deepseek-chat");
    expect(screen.getByLabelText("Temperature")).toHaveValue("0.3");
    expect(screen.getByLabelText("Max tokens")).toHaveValue("2048");
    expect(screen.getByLabelText("System prompt")).toHaveValue(assistantConfigFixture.systemPrompt);
    expect(screen.getByText("Changes apply to future messages only")).toBeInTheDocument();
  });

  it.each([
    ["Temperature", "3", "Use 2 or less."],
    ["Temperature", "warm", "Enter a number from 0 to 2."],
    ["Temperature", "", "Enter a number from 0 to 2."],
    ["Max tokens", "0", "Use 1 or more."],
    ["Max tokens", "10.5", "Enter a whole number, without decimals."],
    ["Max tokens", "9000", "Use 8192 or less."],
  ])("rejects %s = %p before sending", async (label, value, message) => {
    const onPut = vi.fn();
    await renderLoaded();
    server.use(http.put(url, onPut));

    await replace(label, value);
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByLabelText(label)).toBeInvalid();
    expect(screen.getByLabelText(label)).toHaveAccessibleDescription(
      expect.stringContaining(message),
    );
    expect(onPut).not.toHaveBeenCalled();
  });

  it("saves numbers as numbers and confirms", async () => {
    let body: unknown;
    await renderLoaded();
    server.use(
      http.put(url, async ({ request }) => {
        body = await request.json();
        return ok({
          config: {
            ...assistantConfigFixture,
            ...(body as object),
            updatedAt: "2026-11-12T15:00:00.000Z",
          },
        });
      }),
    );

    await replace("Assistant name", "Code Mentor");
    await replace("Temperature", "0.7");
    await replace("Max tokens", "4096");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Configuration saved")).toBeInTheDocument();
    expect(body).toEqual({
      name: "Code Mentor",
      systemPrompt: assistantConfigFixture.systemPrompt,
      model: "deepseek-chat",
      temperature: 0.7,
      maxTokens: 4096,
    });
    expect(screen.getByRole("button", { name: "Reset" })).toBeDisabled();
  });

  it("resets to the last saved values", async () => {
    await renderLoaded();
    const reset = screen.getByRole("button", { name: "Reset" });
    expect(reset).toBeDisabled();

    await replace("Assistant name", "Something else");
    expect(reset).toBeEnabled();
    await userEvent.click(reset);

    expect(screen.getByLabelText("Assistant name")).toHaveValue("Programming Expert");
    expect(reset).toBeDisabled();
  });

  it("shows server validation errors on their fields and keeps the edits", async () => {
    await renderLoaded();
    server.use(
      http.put(url, () =>
        fail(422, "VALIDATION_ERROR", "The request contains invalid fields.", {
          model: ["Unknown model"],
        }),
      ),
    );

    await replace("Model", "not-a-model");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(screen.getByLabelText("Model")).toHaveAccessibleDescription(
        expect.stringContaining("Unknown model"),
      ),
    );
    expect(screen.getByLabelText("Model")).toHaveValue("not-a-model");
  });

  it("shows a safe message when a non-admin session loads the page", async () => {
    server.use(http.get(url, () => fail(403, "FORBIDDEN", "Administrator access required.")));
    render(
      <ToastProvider>
        <AssistantForm />
      </ToastProvider>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You do not have permission to do this.",
    );
    expect(screen.queryByLabelText("System prompt")).not.toBeInTheDocument();
  });
});
