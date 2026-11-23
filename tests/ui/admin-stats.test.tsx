// @vitest-environment jsdom
import "./setup";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { StatsView } from "@/features/admin/stats-view";
import type { AdminStats } from "@/lib/contracts/admin";
import { adminStats } from "./fixtures";
import { api, fail, installMockServer, ok, server } from "./msw/server";

vi.mock("@/lib/api/redirect", () => ({ redirectToLogin: vi.fn() }));

installMockServer();

const url = api("/api/admin/stats");

/** The number shown in the summary card with the given label. */
function cardValue(label: string) {
  return screen.getByText(label).nextElementSibling;
}

describe("StatsView", () => {
  it("shows exactly the totals that the backend returns", async () => {
    const stats: AdminStats = {
      ...adminStats,
      totalUsers: 37,
      totalConversations: 1234,
      totalMessages: 98765,
      usersByRole: { USER: 35, ADMIN: 2 },
    };
    server.use(http.get(url, () => ok({ stats })));
    render(<StatsView />);

    expect(await screen.findByText("Total users")).toBeInTheDocument();
    expect(cardValue("Total users")).toHaveTextContent("37");
    expect(cardValue("Total conversations")).toHaveTextContent("1,234");
    expect(cardValue("Total messages")).toHaveTextContent("98,765");

    expect(screen.getByText("USER", { selector: "dt" }).nextElementSibling).toHaveTextContent("35");
    expect(screen.getByText("ADMIN", { selector: "dt" }).nextElementSibling).toHaveTextContent("2");
  });

  it("lists recent conversations and users", async () => {
    server.use(http.get(url, () => ok({ stats: adminStats })));
    render(<StatsView />);

    expect(await screen.findByText("Explain JavaScript closures")).toBeInTheDocument();
    expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getAllByText("ada@example.com")).toHaveLength(2);
  });

  it("shows zeros and empty lists for an application without activity", async () => {
    const empty: AdminStats = {
      totalUsers: 0,
      totalConversations: 0,
      totalMessages: 0,
      usersByRole: { USER: 0, ADMIN: 0 },
      recentUsers: [],
      recentConversations: [],
    };
    server.use(http.get(url, () => ok({ stats: empty })));
    render(<StatsView />);

    expect(await screen.findByText("No conversations have been started yet.")).toBeInTheDocument();
    expect(screen.getByText("No users have registered yet.")).toBeInTheDocument();
    expect(cardValue("Total messages")).toHaveTextContent("0");
  });

  it("shows an unavailable state with no numbers, then recovers on retry", async () => {
    let calls = 0;
    server.use(
      http.get(url, () => {
        calls += 1;
        return calls === 1
          ? fail(500, "INTERNAL_ERROR", "An unexpected server error occurred.")
          : ok({ stats: adminStats });
      }),
    );
    render(<StatsView />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading statistics");
    expect(await screen.findByRole("alert")).toHaveTextContent("Statistics are unavailable");
    expect(screen.queryByText("Total users")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Total users")).toBeInTheDocument();
  });

  it("requests the numbers again when refreshed", async () => {
    let calls = 0;
    server.use(
      http.get(url, () => {
        calls += 1;
        return ok({ stats: { ...adminStats, totalUsers: calls === 1 ? 2 : 3 } });
      }),
    );
    render(<StatsView />);

    await screen.findByText("Total users");
    expect(cardValue("Total users")).toHaveTextContent("2");

    await userEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await screen.findByText("Total users");
    expect(cardValue("Total users")).toHaveTextContent("3");
  });
});
