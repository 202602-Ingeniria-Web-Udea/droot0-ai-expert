// @vitest-environment jsdom
import "./setup";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/features/auth/login-form";
import { RegisterForm } from "@/features/auth/register-form";
import { authUserFixture } from "@/lib/contracts/fixtures";
import { api, fail, installMockServer, ok, server } from "./msw/server";

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => router }));

installMockServer();

beforeEach(() => {
  router.replace.mockClear();
  router.refresh.mockClear();
});

async function fillLogin(email = "ada@example.com", password = "correct-horse") {
  await userEvent.type(screen.getByLabelText("Email"), email);
  await userEvent.type(screen.getByLabelText("Password"), password);
}

async function fillRegister(overrides: Partial<Record<string, string>> = {}) {
  const values = {
    Name: "Ada Lovelace",
    Email: "ada@example.com",
    Password: "correct-horse",
    "Confirm password": "correct-horse",
    ...overrides,
  };

  for (const [label, value] of Object.entries(values)) {
    if (value) {
      await userEvent.type(screen.getByLabelText(label), value);
    }
  }
}

describe("LoginForm", () => {
  it("does not send an invalid form and explains each field", async () => {
    const onRequest = vi.fn();
    server.use(http.post(api("/api/auth/login"), onRequest));
    render(<LoginForm returnTo="/chat" />);

    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
      "Enter a valid email address.",
    );
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription("Enter your password.");
    expect(onRequest).not.toHaveBeenCalled();
  });

  it("logs in with the keyboard only and opens the returnTo path", async () => {
    let body: unknown;
    server.use(
      http.post(api("/api/auth/login"), async ({ request }) => {
        body = await request.json();
        return ok({ user: authUserFixture });
      }),
    );
    render(<LoginForm returnTo="/history" />);

    await fillLogin();
    await userEvent.keyboard("{Enter}");

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/history"));
    expect(body).toEqual({ email: "ada@example.com", password: "correct-horse" });
    expect(screen.getByLabelText("Password")).toHaveValue("");
  });

  it("sends one request when the form is submitted twice", async () => {
    const onRequest = vi.fn();
    server.use(
      http.post(api("/api/auth/login"), async () => {
        onRequest();
        await delay(50);
        return ok({ user: authUserFixture });
      }),
    );
    render(<LoginForm returnTo="/chat" />);

    await fillLogin();
    await userEvent.keyboard("{Enter}{Enter}");

    await waitFor(() => expect(router.replace).toHaveBeenCalledTimes(1));
    expect(onRequest).toHaveBeenCalledTimes(1);
  });

  it("reports wrong credentials without navigating", async () => {
    server.use(
      http.post(api("/api/auth/login"), () =>
        fail(401, "UNAUTHENTICATED", "Invalid email or password."),
      ),
    );
    render(<LoginForm returnTo="/chat" />);

    await fillLogin();
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect email or password.");
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("keeps what was typed when the network fails", async () => {
    server.use(http.post(api("/api/auth/login"), () => HttpResponse.error()));
    render(<LoginForm returnTo="/chat" />);

    await fillLogin();
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not reach the server.");
    expect(screen.getByLabelText("Email")).toHaveValue("ada@example.com");
    expect(screen.getByLabelText("Password")).toHaveValue("correct-horse");
  });

  it("shows server validation errors on their fields", async () => {
    server.use(
      http.post(api("/api/auth/login"), () =>
        fail(422, "VALIDATION_ERROR", "The request contains invalid fields.", {
          email: ["Invalid email address"],
        }),
      ),
    );
    render(<LoginForm returnTo="/chat" />);

    await fillLogin();
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() =>
      expect(screen.getByLabelText("Email")).toHaveAccessibleDescription("Invalid email address"),
    );
  });

  it("toggles password visibility", async () => {
    render(<LoginForm returnTo="/chat" />);
    const password = screen.getByLabelText("Password");

    expect(password).toHaveAttribute("type", "password");
    await userEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
    await userEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(password).toHaveAttribute("type", "password");
  });
});

describe("RegisterForm", () => {
  it("rejects a short password and mismatched confirmation before sending", async () => {
    const onRequest = vi.fn();
    server.use(http.post(api("/api/auth/register"), onRequest));
    render(<RegisterForm />);

    await fillRegister({ Password: "short", "Confirm password": "different" });
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByLabelText("Password")).toBeInvalid();
    expect(screen.getByLabelText("Confirm password")).toHaveAccessibleDescription(
      "The passwords do not match.",
    );
    expect(onRequest).not.toHaveBeenCalled();
  });

  it("registers without sending confirmPassword and opens the chat", async () => {
    let body: unknown;
    server.use(
      http.post(api("/api/auth/register"), async ({ request }) => {
        body = await request.json();
        return ok({ user: authUserFixture, requiresEmailConfirmation: false }, 201);
      }),
    );
    render(<RegisterForm />);

    await fillRegister();
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/chat"));
    expect(body).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "correct-horse",
    });
  });

  it("shows the email confirmation state when the backend requires it", async () => {
    server.use(
      http.post(api("/api/auth/register"), () =>
        ok({ user: authUserFixture, requiresEmailConfirmation: true }, 201),
      ),
    );
    render(<RegisterForm />);

    await fillRegister();
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "We sent a confirmation link to ada@example.com",
    );
    expect(screen.getByRole("link", { name: "Go to log in" })).toHaveAttribute("href", "/login");
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("marks the email field when the account already exists", async () => {
    server.use(
      http.post(api("/api/auth/register"), () =>
        fail(409, "CONFLICT", "An account with this email already exists."),
      ),
    );
    render(<RegisterForm />);

    await fillRegister();
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
        "An account with this email already exists.",
      ),
    );
    expect(screen.getByLabelText("Name")).toHaveValue("Ada Lovelace");
  });
});
