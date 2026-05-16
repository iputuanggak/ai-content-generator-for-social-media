// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TeamProvider, useTeamGuard } from "@/lib/team-context";

const mockRouterPush = vi.fn();
vi.mock("next/router", () => ({
  useRouter: () => ({ push: mockRouterPush, pathname: "/[slug]", query: { slug: "acme" } }),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
}

function wrap(children: React.ReactNode) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <TeamProvider>{children}</TeamProvider>
    </QueryClientProvider>
  );
}

function GuardConsumer() {
  useTeamGuard();
  return <div data-testid="guarded">content</div>;
}

describe("useTeamGuard", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
  });

  it("redirects to /login when session is null", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ session: null }),
    });

    render(wrap(<GuardConsumer />));

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/login");
    });
  });

  it("redirects to /login when session fetch errors", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    render(wrap(<GuardConsumer />));

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/login");
    });
  });

  it("redirects to /teams when slug resolves to no team", async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/teams/resolve")) {
        return Promise.resolve({ ok: false, json: () => Promise.resolve(null) });
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            session: { user: { id: "user-1" }, session: {} },
            userName: "Alice",
            teamName: null,
            teamId: null,
            teams: [],
          }),
      });
    });

    render(wrap(<GuardConsumer />));

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/teams");
    });
  });

  it("does not redirect when session and team are valid", async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/teams/resolve")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: "org-1", name: "Team Alpha", slug: "acme" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            session: { user: { id: "user-1" }, session: {} },
            userName: "Alice",
            teamName: "Team Alpha",
            teamId: "org-1",
            teams: [{ id: "org-1", name: "Team Alpha", slug: "acme" }],
          }),
      });
    });

    render(wrap(<GuardConsumer />));

    await waitFor(() => {
      expect(mockRouterPush).not.toHaveBeenCalled();
    });
  });
});
