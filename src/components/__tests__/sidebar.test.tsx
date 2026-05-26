// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
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

const routerState = {
  pathname: "/[slug]" as string,
  asPath: "/acme" as string,
  query: { slug: "acme" } as Record<string, string>,
  push: vi.fn(),
};

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signOut: vi.fn().mockResolvedValue(undefined),
    organization: {
      setActive: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

vi.mock("next/router", () => ({
  useRouter: () => ({ ...routerState }),
}));

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

beforeEach(() => {
  routerState.pathname = "/[slug]";
  routerState.asPath = "/acme";
  routerState.query = { slug: "acme" };
  routerState.push = vi.fn();
});

describe("Sidebar", () => {
  const sessionResponse = {
    session: { user: { name: "Test User" }, session: { activeOrganizationId: "team-1" } },
    userName: "Test User",
    teamName: "Test Team",
    teamId: "team-1",
    slug: "acme",
    teams: [{ id: "team-1", name: "Test Team", slug: "acme" }],
  };

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

  describe("team switcher", () => {
    const multiTeamSession = {
      session: { user: { name: "Test User" }, session: { activeOrganizationId: "team-1" } },
      userName: "Test User",
      teamName: "Team Alpha",
      teamId: "team-1",
      slug: "alpha",
      teams: [
        { id: "team-1", name: "Team Alpha", slug: "alpha" },
        { id: "team-2", name: "Team Beta", slug: "beta" },
        { id: "team-3", name: "Team Gamma", slug: "gamma" },
      ],
    };

    function mockFetchMultiTeam() {
      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/api/teams/resolve")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ id: "team-1", name: "Team Alpha", slug: "alpha", role: "member" }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(multiTeamSession),
        });
      });
    }

    it("navigates to the correct slug URL preserving sub-route when switching teams", async () => {
      const user = userEvent.setup();

      routerState.pathname = "/[slug]/history";
      routerState.asPath = "/alpha/history";
      routerState.query = { slug: "alpha" };

      mockFetchMultiTeam();

      render(
        wrap(
          <TeamProvider>
            <Sidebar />
          </TeamProvider>
        )
      );

      const trigger = await screen.findByRole("button", { name: /Team Alpha/ });
      await user.click(trigger);

      const menu = await screen.findByRole("menu");
      const betaItem = within(menu).getByText("Team Beta");
      await user.click(betaItem);

      expect(routerState.push).toHaveBeenCalledWith("/beta/history");
    });

    it("shows all teams in dropdown with current team highlighted", async () => {
      const user = userEvent.setup();

      routerState.asPath = "/alpha";
      routerState.query = { slug: "alpha" };

      mockFetchMultiTeam();

      render(
        wrap(
          <TeamProvider>
            <Sidebar />
          </TeamProvider>
        )
      );

      const trigger = await screen.findByRole("button", { name: /Team Alpha/ });
      await user.click(trigger);

      const menu = await screen.findByRole("menu");
      expect(within(menu).getByText("Team Alpha")).toBeInTheDocument();
      expect(within(menu).getByText("Team Beta")).toBeInTheDocument();
      expect(within(menu).getByText("Team Gamma")).toBeInTheDocument();

      const dropdownAlpha = within(menu).getByText("Team Alpha").closest('[role="menuitem"]');
      expect(dropdownAlpha).toHaveClass("font-medium");
    });

    it("does not call setActive() during team switching", async () => {
      const user = userEvent.setup();
      const { authClient } = await import("@/lib/auth-client");

      routerState.asPath = "/alpha";
      routerState.query = { slug: "alpha" };

      mockFetchMultiTeam();

      render(
        wrap(
          <TeamProvider>
            <Sidebar />
          </TeamProvider>
        )
      );

      const trigger = await screen.findByRole("button", { name: /Team Alpha/ });
      await user.click(trigger);

      const menu = await screen.findByRole("menu");
      const betaItem = within(menu).getByText("Team Beta");
      await user.click(betaItem);

      expect(authClient.organization.setActive).not.toHaveBeenCalled();
    });

    it("shows Create new team option in dropdown for multi-team users", async () => {
      const user = userEvent.setup();

      routerState.asPath = "/alpha";
      routerState.query = { slug: "alpha" };

      mockFetchMultiTeam();

      render(
        wrap(
          <TeamProvider>
            <Sidebar />
          </TeamProvider>
        )
      );

      const trigger = await screen.findByRole("button", { name: /Team Alpha/ });
      await user.click(trigger);

      const menu = await screen.findByRole("menu");
      expect(within(menu).getByText("Create new team")).toBeInTheDocument();
      expect(within(menu).getByRole("separator")).toBeInTheDocument();
    });

    it("navigates to /create-team when Create new team is clicked", async () => {
      const user = userEvent.setup();

      routerState.asPath = "/alpha";
      routerState.query = { slug: "alpha" };

      mockFetchMultiTeam();

      render(
        wrap(
          <TeamProvider>
            <Sidebar />
          </TeamProvider>
        )
      );

      const trigger = await screen.findByRole("button", { name: /Team Alpha/ });
      await user.click(trigger);

      const menu = await screen.findByRole("menu");
      const createItem = within(menu).getByText("Create new team");
      await user.click(createItem);

      expect(routerState.push).toHaveBeenCalledWith("/create-team");
    });
  });

  describe("single team user", () => {
    it("shows dropdown with Create new team option when user has exactly 1 team", async () => {
      const user = userEvent.setup();

      routerState.asPath = "/acme";
      routerState.query = { slug: "acme" };

      mockFetch();

      render(
        wrap(
          <TeamProvider>
            <Sidebar />
          </TeamProvider>
        )
      );

      const trigger = await screen.findByRole("button", { name: /Test Team/ });
      await user.click(trigger);

      const menu = await screen.findByRole("menu");
      expect(within(menu).getByText("Test Team")).toBeInTheDocument();
      expect(within(menu).getByText("Create new team")).toBeInTheDocument();
      expect(within(menu).getByRole("separator")).toBeInTheDocument();
    });

    it("navigates to /create-team from single-team dropdown", async () => {
      const user = userEvent.setup();

      routerState.asPath = "/acme";
      routerState.query = { slug: "acme" };

      mockFetch();

      render(
        wrap(
          <TeamProvider>
            <Sidebar />
          </TeamProvider>
        )
      );

      const trigger = await screen.findByRole("button", { name: /Test Team/ });
      await user.click(trigger);

      const menu = await screen.findByRole("menu");
      const createItem = within(menu).getByText("Create new team");
      await user.click(createItem);

      expect(routerState.push).toHaveBeenCalledWith("/create-team");
    });
  });
});
