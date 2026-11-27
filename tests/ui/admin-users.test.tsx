// @vitest-environment jsdom
import "./setup";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui";
import { AdminGuard } from "@/features/admin/admin-guard";
import { AdminNav } from "@/features/admin/admin-nav";
import { UsersTable } from "@/features/admin/users-table";
import { CurrentUserProvider } from "@/features/auth/current-user";
import type { AuthUser } from "@/lib/contracts/auth";
import { adminUser, regularUser } from "./fixtures";
import { api, fail, installMockServer, ok, server } from "./msw/server";

vi.mock("next/navigation", () => ({ usePathname: () => "/admin/users" }));
vi.mock("@/lib/api/redirect", () => ({ redirectToLogin: vi.fn() }));

installMockServer();

const usersUrl = api("/api/admin/users");
const roleUrl = api(`/api/admin/users/${regularUser.id}/role`);

const thirdUser: AuthUser = {
  ...regularUser,
  id: "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
  email: "grace@example.com",
  name: "Grace Hopper",
};

const firstPageUsers: AuthUser[] = [
  adminUser,
  regularUser,
  ...Array.from({ length: 18 }, (_, index) => ({
    ...regularUser,
    id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    email: `user${index}@example.com`,
    name: `User ${index}`,
  })),
];

/** Paginated response around the users a test wants to show. */
function pageOf(
  users: AuthUser[],
  {
    page = 1,
    pageSize = 20,
    total = users.length,
  }: {
    page?: number;
    pageSize?: number;
    total?: number;
  } = {},
) {
  return { users, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}

function renderAs(user: AuthUser, children: ReactNode) {
  return render(
    <ToastProvider>
      <CurrentUserProvider user={user}>{children}</CurrentUserProvider>
    </ToastProvider>,
  );
}

function roleSelect(email: string) {
  return screen.findByRole("combobox", { name: `Role for ${email}` });
}

describe("AdminGuard", () => {
  it("does not render the admin area for a USER", () => {
    renderAs(
      regularUser,
      <AdminGuard>
        <p>Secret admin content</p>
      </AdminGuard>,
    );

    expect(
      screen.getByRole("heading", { name: "You do not have access to this page" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Secret admin content")).not.toBeInTheDocument();
  });

  it("renders the admin area for an ADMIN", () => {
    renderAs(
      adminUser,
      <AdminGuard>
        <p>Secret admin content</p>
      </AdminGuard>,
    );

    expect(screen.getByText("Secret admin content")).toBeInTheDocument();
  });
});

describe("AdminNav", () => {
  it("links to the three sections and marks the current one", () => {
    render(<AdminNav />);
    const nav = within(screen.getByRole("navigation", { name: "Administration" }));

    expect(nav.getByRole("link", { name: "Users" })).toHaveAttribute("aria-current", "page");
    expect(nav.getByRole("link", { name: "Assistant" })).toHaveAttribute(
      "href",
      "/admin/assistant",
    );
    expect(nav.getByRole("link", { name: "Statistics" })).toHaveAttribute("href", "/admin/stats");
  });
});

describe("UsersTable", () => {
  it("lists users with email, role, and creation date", async () => {
    server.use(http.get(usersUrl, () => ok(pageOf([adminUser, regularUser]))));
    renderAs(adminUser, <UsersTable />);

    expect(await roleSelect("ada@example.com")).toHaveValue("USER");
    expect(await roleSelect("admin@example.com")).toHaveValue("ADMIN");
    const rows = screen.getAllByRole("listitem");
    expect(rows[1]).toHaveTextContent("Ada Lovelace");
    expect(rows[1]).toHaveTextContent("Nov 6, 2026");
  });

  it("paginates users and requests the next page", async () => {
    server.use(
      http.get(usersUrl, ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get("page") ?? "1");

        return page === 2
          ? ok(pageOf([thirdUser], { page: 2, total: 21 }))
          : ok(pageOf(firstPageUsers, { page: 1, total: 21 }));
      }),
    );
    renderAs(adminUser, <UsersTable />);

    expect(await screen.findByText(/Showing 1–20 of 21 users/)).toBeInTheDocument();
    expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "Next page" }));

    expect(await screen.findByText(/Page 2 of 2/)).toBeInTheDocument();
    expect(await roleSelect("grace@example.com")).toHaveValue("USER");
    expect(
      screen.queryByRole("combobox", { name: "Role for ada@example.com" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous page" })).toBeEnabled();

    await userEvent.click(screen.getByRole("button", { name: "Previous page" }));

    expect(await screen.findByText(/Page 1 of 2/)).toBeInTheDocument();
    expect(await roleSelect("ada@example.com")).toHaveValue("USER");
  });

  it("disables the role control on the signed-in admin and explains why", async () => {
    server.use(http.get(usersUrl, () => ok(pageOf([adminUser, regularUser]))));
    renderAs(adminUser, <UsersTable />);

    const own = await roleSelect("admin@example.com");
    expect(own).toBeDisabled();
    expect(own).toHaveAccessibleDescription("You cannot change your own role.");
    expect(await roleSelect("ada@example.com")).toBeEnabled();
  });

  it("asks for confirmation and does nothing when cancelled", async () => {
    const onPatch = vi.fn();
    server.use(
      http.get(usersUrl, () => ok(pageOf([adminUser, regularUser]))),
      http.patch(roleUrl, onPatch),
    );
    renderAs(adminUser, <UsersTable />);

    await userEvent.selectOptions(await roleSelect("ada@example.com"), "ADMIN");
    const dialog = screen.getByRole("dialog", { name: "Change role to ADMIN?" });
    expect(dialog).toHaveAccessibleDescription(/ada@example.com will become ADMIN/);

    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onPatch).not.toHaveBeenCalled();
    expect(await roleSelect("ada@example.com")).toHaveValue("USER");
  });

  it("changes the role after confirmation and gives feedback", async () => {
    let body: unknown;
    server.use(
      http.get(usersUrl, () => ok(pageOf([adminUser, regularUser]))),
      http.patch(roleUrl, async ({ request }) => {
        body = await request.json();
        return ok({ user: { ...regularUser, role: "ADMIN" } });
      }),
    );
    renderAs(adminUser, <UsersTable />);

    await userEvent.selectOptions(await roleSelect("ada@example.com"), "ADMIN");
    await userEvent.click(screen.getByRole("button", { name: "Change role" }));

    expect(await screen.findByText("Role updated")).toBeInTheDocument();
    expect(body).toEqual({ role: "ADMIN" });
    expect(await roleSelect("ada@example.com")).toHaveValue("ADMIN");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the business rule when the backend rejects the change", async () => {
    server.use(
      http.get(usersUrl, () => ok(pageOf([adminUser, { ...regularUser, role: "ADMIN" }]))),
      http.patch(roleUrl, () => fail(409, "CONFLICT", "The last administrator cannot be demoted.")),
    );
    renderAs(adminUser, <UsersTable />);

    await userEvent.selectOptions(await roleSelect("ada@example.com"), "USER");
    await userEvent.click(screen.getByRole("button", { name: "Change role" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The last administrator cannot be demoted.",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows a safe message when the API answers 403", async () => {
    server.use(http.get(usersUrl, () => fail(403, "FORBIDDEN", "Administrator access required.")));
    renderAs(regularUser, <UsersTable />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("You do not have permission to do this.");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
