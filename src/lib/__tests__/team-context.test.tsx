// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { TeamProvider, useTeam } from "@/lib/team-context";

const mockRouterPush = vi.fn();
vi.mock("next/router", () => ({
  useRouter: () => ({ push: mockRouterPush, pathname: "/dashboard" }),
}));

function TeamConsumer() {
  const { userName, userId, teamName, teamId, teams, loading } = useTeam();
  if (loading) return <div data-testid="loading">loading</div>;
  return (
    <div>
      <div data-testid="userName">{userName}</div>
      <div data-testid="userId">{userId}</div>
      <div data-testid="teamName">{teamName ?? "null"}</div>
      <div data-testid="teamId">{teamId ?? "null"}</div>
      <div data-testid="teams">{teams.map((t) => t.name).join(",")}</div>
    </div>
  );
}

describe("TeamProvider", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
  });

  it("shows loading state initially then fetches session data", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          session: {
            user: { id: "user-1", name: "Alice" },
            session: { activeOrganizationId: "org-1" },
          },
          userName: "Alice",
          teamName: "Team Alpha",
          teamId: "org-1",
          teams: [{ id: "org-1", name: "Team Alpha" }],
        }),
    });

    render(
      <TeamProvider>
        <TeamConsumer />
      </TeamProvider>
    );

    expect(screen.getByTestId("loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("userName")).toHaveTextContent("Alice");
      expect(screen.getByTestId("userId")).toHaveTextContent("user-1");
      expect(screen.getByTestId("teamName")).toHaveTextContent("Team Alpha");
      expect(screen.getByTestId("teamId")).toHaveTextContent("org-1");
      expect(screen.getByTestId("teams")).toHaveTextContent("Team Alpha");
    });

    expect(globalThis.fetch).toHaveBeenCalledWith("/api/session");
  });

  it("redirects to /login when session is null", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ session: null }),
    });

    render(
      <TeamProvider>
        <TeamConsumer />
      </TeamProvider>
    );

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/login");
    });
  });

  it("handles missing team gracefully", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          session: { user: { id: "user-2", name: "Bob" }, session: {} },
          userName: "Bob",
          teamName: null,
          teamId: null,
          teams: [],
        }),
    });

    render(
      <TeamProvider>
        <TeamConsumer />
      </TeamProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("userName")).toHaveTextContent("Bob");
      expect(screen.getByTestId("userId")).toHaveTextContent("user-2");
      expect(screen.getByTestId("teamName")).toHaveTextContent("null");
      expect(screen.getByTestId("teamId")).toHaveTextContent("null");
      expect(screen.getByTestId("teams")).toHaveTextContent("");
    });
  });
});
