// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { Sidebar } from "../layout/Sidebar";
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

describe("Sidebar", () => {
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

  it("renders a Button with ghost variant for log out", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(sessionResponse),
    });

    render(
      <TeamProvider>
        <Sidebar />
      </TeamProvider>
    );

    const logoutBtn = await screen.findByRole("button", { name: /log out/i });
    expect(logoutBtn).toBeInTheDocument();
    expect(logoutBtn).toHaveAttribute("data-variant", "ghost");
  });

  it("renders the user name", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(sessionResponse),
    });

    render(
      <TeamProvider>
        <Sidebar />
      </TeamProvider>
    );

    expect(await screen.findByText("Test User")).toBeInTheDocument();
  });

  it("calls handleLogout when log out button is clicked", async () => {
    const user = userEvent.setup();
    const { authClient } = await import("@/lib/auth-client");

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(sessionResponse),
    });

    render(
      <TeamProvider>
        <Sidebar />
      </TeamProvider>
    );

    const logoutBtn = await screen.findByRole("button", { name: /log out/i });
    await user.click(logoutBtn);
    expect(authClient.signOut).toHaveBeenCalledOnce();
  });
});
