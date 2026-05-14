// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar } from "../layout/Sidebar";
import { TeamProvider } from "@/lib/team-context";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

function wrap(children: React.ReactNode) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

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
    pathname: "/[slug]",
    asPath: "/acme",
    query: { slug: "acme" },
    push: vi.fn(),
  }),
}));

describe("Sidebar", () => {
  const sessionResponse = {
    session: { user: { name: "Test User" }, session: { activeOrganizationId: "team-1" } },
    userName: "Test User",
    teamName: "Test Team",
    teamId: "team-1",
    slug: "acme",
    teams: [{ id: "team-1", name: "Test Team", slug: "acme" }],
  };

  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function mockFetch(sessionRes?: object) {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/teams/resolve")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: "team-1", name: "Test Team", slug: "acme", role: "member" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(sessionRes ?? sessionResponse),
      });
    });
  }

  it("renders a Button with ghost variant for log out", async () => {
    mockFetch();

    render(
      wrap(
        <TeamProvider>
          <Sidebar />
        </TeamProvider>
      )
    );

    const logoutBtn = await screen.findByRole("button", { name: /log out/i });
    expect(logoutBtn).toBeInTheDocument();
    expect(logoutBtn).toHaveAttribute("data-variant", "ghost");
  });

  it("renders the user name", async () => {
    mockFetch();

    render(
      wrap(
        <TeamProvider>
          <Sidebar />
        </TeamProvider>
      )
    );

    expect(await screen.findByText("Test User")).toBeInTheDocument();
  });

  it("calls handleLogout when log out button is clicked", async () => {
    const user = userEvent.setup();
    const { authClient } = await import("@/lib/auth-client");

    mockFetch();

    render(
      wrap(
        <TeamProvider>
          <Sidebar />
        </TeamProvider>
      )
    );

    const logoutBtn = await screen.findByRole("button", { name: /log out/i });
    await user.click(logoutBtn);
    expect(authClient.signOut).toHaveBeenCalledOnce();
  });
});
