// @vitest-environment jsdom
import "./setup";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui";
import { AppShell } from "@/features/shell/app-shell";
import { authUserFixture } from "@/lib/contracts/fixtures";
import { adminUser } from "./fixtures";
import { api, fail, installMockServer, ok, server } from "./msw/server";

const navigation = vi.hoisted(() => ({
  pathname: "/chat",
  router: { replace: vi.fn(), refresh: vi.fn(), push: vi.fn() },
}));
const redirectToLogin = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => navigation.router,
  usePathname: () => navigation.pathname,
}));
vi.mock("@/lib/api/redirect", () => ({ redirectToLogin }));

installMockServer();

beforeEach(() => {
  navigation.pathname = "/chat";
  navigation.router.replace.mockClear();
  redirectToLogin.mockClear();
});

function renderShell() {
  return render(
    <ToastProvider>
      <AppShell>
        <p>Page content</p>
      </AppShell>
    </ToastProvider>,
  );
}

/** The desktop sidebar; the mobile drawer renders the same navigation when open. */
async function findSidebar() {
  return within(await screen.findByRole("complementary"));
}

describe("AppShell", () => {
  it("shows the user and hides Admin for a USER", async () => {
    server.use(http.get(api("/api/auth/me"), () => ok({ user: authUserFixture })));
    renderShell();
    const sidebar = await findSidebar();

    expect(sidebar.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(sidebar.getByText("ada@example.com")).toBeInTheDocument();
    expect(sidebar.getByText("USER")).toBeInTheDocument();
    expect(sidebar.getByRole("link", { name: "History" })).toHaveAttribute("href", "/history");
    expect(sidebar.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("Page content");
  });

  it("shows Admin when the backend reports the ADMIN role", async () => {
    server.use(http.get(api("/api/auth/me"), () => ok({ user: adminUser })));
    renderShell();
    const sidebar = await findSidebar();

    expect(sidebar.getByRole("link", { name: "Admin" })).toHaveAttribute("href", "/admin");
  });

  it("marks the current section, including nested routes", async () => {
    navigation.pathname = "/chat/b3e1c2d4-5f6a-4b7c-8d9e-0f1a2b3c4d5e";
    server.use(http.get(api("/api/auth/me"), () => ok({ user: authUserFixture })));
    renderShell();
    const sidebar = await findSidebar();

    expect(sidebar.getByRole("link", { name: "Chat" })).toHaveAttribute("aria-current", "page");
    expect(sidebar.getByRole("link", { name: "History" })).not.toHaveAttribute("aria-current");
  });

  it("redirects to login when the session has ended", async () => {
    server.use(
      http.get(api("/api/auth/me"), () => fail(401, "UNAUTHENTICATED", "Authentication required.")),
    );
    renderShell();

    await waitFor(() => expect(redirectToLogin).toHaveBeenCalledOnce());
    expect(screen.queryByText("Page content")).not.toBeInTheDocument();
  });

  it("offers a retry when the user cannot be loaded", async () => {
    let calls = 0;
    server.use(
      http.get(api("/api/auth/me"), () => {
        calls += 1;
        return calls === 1
          ? fail(500, "INTERNAL_ERROR", "An unexpected server error occurred.")
          : ok({ user: authUserFixture });
      }),
    );
    renderShell();

    await userEvent.click(await screen.findByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Page content")).toBeInTheDocument();
  });

  it("signs out and returns to the login page", async () => {
    const onLogout = vi.fn();
    server.use(
      http.get(api("/api/auth/me"), () => ok({ user: authUserFixture })),
      http.post(api("/api/auth/logout"), () => {
        onLogout();
        return ok({ success: true });
      }),
    );
    renderShell();
    const sidebar = await findSidebar();

    await userEvent.click(sidebar.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(navigation.router.replace).toHaveBeenCalledWith("/login"));
    expect(onLogout).toHaveBeenCalledOnce();
  });

  it("opens the mobile drawer and closes it with Escape", async () => {
    server.use(http.get(api("/api/auth/me"), () => ok({ user: authUserFixture })));
    renderShell();
    const menuButton = await screen.findByRole("button", { name: "Open navigation" });

    await userEvent.click(menuButton);
    const drawer = screen.getByRole("dialog", { name: "Navigation" });
    expect(within(drawer).getByRole("link", { name: "History" })).toBeInTheDocument();
    expect(drawer).toContainElement(document.activeElement as HTMLElement);

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(menuButton).toHaveFocus();
  });

  it("provides a skip link to the main content", async () => {
    server.use(http.get(api("/api/auth/me"), () => ok({ user: authUserFixture })));
    renderShell();
    await findSidebar();

    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute(
      "href",
      "#main-content",
    );
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
  });
});
