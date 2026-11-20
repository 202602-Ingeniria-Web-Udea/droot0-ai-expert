// @vitest-environment jsdom
import "./setup";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MarketingLayout from "@/app/(marketing)/layout";
import LandingPage from "@/app/(marketing)/page";

function renderLanding() {
  return render(
    <MarketingLayout>
      <LandingPage />
    </MarketingLayout>,
  );
}

describe("Landing page", () => {
  it("presents the product with a single top-level heading", () => {
    renderLanding();

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("main")).toHaveTextContent("assistant specialized in programming");
  });

  it("links the calls to action to the auth pages", () => {
    renderLanding();
    const main = within(screen.getByRole("main"));

    for (const link of main.getAllByRole("link", { name: "Create an account" })) {
      expect(link).toHaveAttribute("href", "/register");
    }
    expect(main.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
  });

  it("offers login and registration in the header", () => {
    renderLanding();
    const header = within(screen.getByRole("banner"));

    expect(header.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
    expect(header.getByRole("link", { name: "Create account" })).toHaveAttribute(
      "href",
      "/register",
    );
  });

  it("lists the five capabilities", () => {
    renderLanding();

    for (const name of [
      "Concept explanations",
      "Debugging",
      "Algorithms",
      "Data structures",
      "Code improvement",
    ]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it("starts with a skip link to the main content", () => {
    renderLanding();

    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute(
      "href",
      "#main-content",
    );
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
  });
});
