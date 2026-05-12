// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MobileDrawer } from "../layout/MobileDrawer";
import { TeamProvider } from "@/lib/team-context";

afterEach(cleanup);

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signOut: vi.fn().mockResolvedValue(undefined),
    organization: {
      setActive: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

vi.mock("next/router", () => ({
  useRouter: () => ({
    pathname: "/dashboard",
    push: vi.fn(),
  }),
}));

describe("MobileDrawer", () => {
  const sessionResponse = {
    session: { user: { name: "Test User" }, session: { activeOrganizationId: "team-1" } },
    userName: "Test User",
    teamName: "Test Team",
    teamId: "team-1",
    teams: [{ id: "team-1", name: "Test Team" }],
  };

  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("renders a Button with ghost variant as the hamburger trigger", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(sessionResponse),
    });

    render(
      <TeamProvider>
        <MobileDrawer />
      </TeamProvider>
    );

    const trigger = await screen.findByRole("button", { name: /open navigation/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("data-variant", "ghost");
  });

  it("renders the app title", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(sessionResponse),
    });

    render(
      <TeamProvider>
        <MobileDrawer />
      </TeamProvider>
    );

    await screen.findByRole("button", { name: /open navigation/i }, { timeout: 3000 });
    const titles = screen.getAllByText("ContentGen");
    expect(titles.length).toBeGreaterThan(0);
  });
});
