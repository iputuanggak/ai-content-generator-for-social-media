// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import React, { useEffect, type ReactNode } from "react";
import { TeamProvider, useTeam } from "@/lib/team-context";

const mockRouterPush = vi.fn();
vi.mock("next/router", () => ({
  useRouter: () => ({ push: mockRouterPush, pathname: "/dashboard" }),
}));

const PERSIST_KEY = "test-session-cache";

function createPersistedQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 30 * 60 * 1000 },
    },
  });
}

function createPersister() {
  return createSyncStoragePersister({
    storage: window.localStorage,
    key: PERSIST_KEY,
  });
}

const dehydrateOptions = {
  shouldDehydrateQuery: (query: { queryKey: unknown[] }) => {
    return query.queryKey[0] === "session";
  },
};

function PersistWrapper({
  children,
  queryClient,
}: {
  children: ReactNode;
  queryClient: QueryClient;
}) {
  const [persister] = React.useState(() => createPersister());  useEffect(() => {
    const [unsubscribe] = persistQueryClient({
      queryClient,
      persister,
      maxAge: 30 * 60 * 1000,
      dehydrateOptions,
    });
    return unsubscribe;
  }, [queryClient, persister]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function TeamConsumer() {
  const { userName, teamName, teamId, loading } = useTeam();
  if (loading) return <div data-testid="loading">loading</div>;
  return (
    <div>
      <div data-testid="userName">{userName}</div>
      <div data-testid="teamName">{teamName ?? "null"}</div>
      <div data-testid="teamId">{teamId ?? "null"}</div>
    </div>
  );
}

const sessionResponse = {
  session: {
    user: { id: "user-1", name: "Alice" },
    session: { activeOrganizationId: "org-1" },
  },
  userName: "Alice",
  teamName: "Team Alpha",
  teamId: "org-1",
  teams: [{ id: "org-1", name: "Team Alpha" }],
};

describe("Session persistence", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
  });

  it("persists session query data to localStorage after fetch", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(sessionResponse),
    });

    const queryClient = createPersistedQueryClient();

    render(
      <PersistWrapper queryClient={queryClient}>
        <TeamProvider>
          <TeamConsumer />
        </TeamProvider>
      </PersistWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId("userName")).toHaveTextContent("Alice");
    });

    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ["session"] });
    });

    await waitFor(() => {
      const stored = localStorage.getItem(PERSIST_KEY);
      expect(stored).not.toBeNull();
    });

    const stored = localStorage.getItem(PERSIST_KEY);
    const parsed = JSON.parse(stored!);
    expect(parsed.clientState.queries.length).toBeGreaterThanOrEqual(1);
    expect(
      parsed.clientState.queries.some(
        (q: { queryKey: unknown[] }) => q.queryKey[0] === "session"
      )
    ).toBe(true);
  });

  it("restores session data from localStorage without loading state", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(sessionResponse),
    });

    const queryClient = createPersistedQueryClient();

    const { unmount } = render(
      <PersistWrapper queryClient={queryClient}>
        <TeamProvider>
          <TeamConsumer />
        </TeamProvider>
      </PersistWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId("userName")).toHaveTextContent("Alice");
    });

    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ["session"] });
    });

    await waitFor(() => {
      expect(localStorage.getItem(PERSIST_KEY)).not.toBeNull();
    });

    unmount();
    cleanup();

    const queryClient2 = createPersistedQueryClient();
    let resolveSecondFetch!: () => void;
    const fetchPromise = new Promise<void>((r) => {
      resolveSecondFetch = r;
    });

    globalThis.fetch = vi.fn().mockImplementation(async () => {
      await fetchPromise;
      return { ok: true, json: () => Promise.resolve(sessionResponse) };
    });

    render(
      <PersistWrapper queryClient={queryClient2}>
        <TeamProvider>
          <TeamConsumer />
        </TeamProvider>
      </PersistWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId("userName")).toHaveTextContent("Alice");
      expect(screen.getByTestId("teamName")).toHaveTextContent("Team Alpha");
    });

    const loadingEl = screen.queryByTestId("loading");
    expect(loadingEl).toBeNull();

    resolveSecondFetch();
  });

  it("does not persist non-session queries", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(sessionResponse),
    });

    const queryClient = createPersistedQueryClient();
    queryClient.setQueryData(["other-query"], { foo: "bar" });

    render(
      <PersistWrapper queryClient={queryClient}>
        <TeamProvider>
          <TeamConsumer />
        </TeamProvider>
      </PersistWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId("userName")).toHaveTextContent("Alice");
    });

    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ["session"] });
    });

    await waitFor(() => {
      expect(localStorage.getItem(PERSIST_KEY)).not.toBeNull();
    });

    const stored = localStorage.getItem(PERSIST_KEY);
    const parsed = JSON.parse(stored!);
    const hasOtherQuery = parsed.clientState.queries.some(
      (q: { queryKey: unknown[] }) => q.queryKey[0] === "other-query"
    );
    expect(hasOtherQuery).toBe(false);
  });

  it("does not store tokens or secrets in localStorage", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(sessionResponse),
    });

    const queryClient = createPersistedQueryClient();

    render(
      <PersistWrapper queryClient={queryClient}>
        <TeamProvider>
          <TeamConsumer />
        </TeamProvider>
      </PersistWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId("userName")).toHaveTextContent("Alice");
    });

    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ["session"] });
    });

    await waitFor(() => {
      expect(localStorage.getItem(PERSIST_KEY)).not.toBeNull();
    });

    const rawValues = Object.keys(localStorage).map((k) =>
      localStorage.getItem(k)
    );
    const combined = rawValues.join(" ");
    expect(combined).not.toMatch(/token|password|secret|apiKey|api_key/i);
  });

  it("sets gcTime to 30 minutes for session query", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(sessionResponse),
    });

    const queryClient = createPersistedQueryClient();

    render(
      <PersistWrapper queryClient={queryClient}>
        <TeamProvider>
          <TeamConsumer />
        </TeamProvider>
      </PersistWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId("userName")).toHaveTextContent("Alice");
    });

    const cache = queryClient.getQueryCache();
    const sessionQuery = cache.find({ queryKey: ["session"] });
    expect(sessionQuery).not.toBeNull();
    expect(sessionQuery!.observers[0].options.gcTime).toBe(30 * 60 * 1000);
  });
});
