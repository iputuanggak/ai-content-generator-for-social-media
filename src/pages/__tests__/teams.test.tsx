// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const mockGetSession = vi.fn().mockResolvedValue(null);
const mockListOrganizations = vi.fn().mockResolvedValue([]);

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      listOrganizations: (...args: unknown[]) => mockListOrganizations(...args),
    },
  },
}));

vi.mock("@hugeicons/react", () => ({
  HugeiconsIcon: () => <span data-testid="icon" />,
}));
vi.mock("@hugeicons/core-free-icons", () => ({
  UserGroupIcon: "UserGroupIcon",
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  } & Record<string, unknown>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockPush = vi.fn();

vi.mock("next/router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

let mockHookLoading = false;

vi.mock("@/lib/use-require-verified-email", () => ({
  useRequireVerifiedEmail: () => ({ loading: mockHookLoading }),
}));

import TeamsPage, { getServerSideProps } from "../teams";

afterEach(() => {
  cleanup();
  mockPush.mockClear();
  mockHookLoading = false;
});

describe("TeamsPage", () => {
  it("renders heading and subtitle", () => {
    render(
      <TeamsPage
        teams={[
          { id: "1", name: "Acme", slug: "acme" },
          { id: "2", name: "Beta", slug: "beta" },
        ]}
        userName="Alice"
      />
    );
    expect(screen.getByText("Pick a team")).toBeInTheDocument();
    expect(
      screen.getByText("Hi Alice, select a team to continue.")
    ).toBeInTheDocument();
  });

  it("renders without userName", () => {
    render(
      <TeamsPage
        teams={[{ id: "1", name: "Acme", slug: "acme" }]}
        userName={null}
      />
    );
    expect(screen.getByText("select a team to continue.")).toBeInTheDocument();
  });

  it("renders team cards as links with correct hrefs", () => {
    render(
      <TeamsPage
        teams={[
          { id: "1", name: "Acme Marketing", slug: "acme" },
          { id: "2", name: "Beta Corp", slug: "beta-corp" },
        ]}
        userName={null}
      />
    );
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/acme");
    expect(links[1]).toHaveAttribute("href", "/beta-corp");
    expect(screen.getByText("Acme Marketing")).toBeInTheDocument();
    expect(screen.getByText("Beta Corp")).toBeInTheDocument();
  });

  it("falls back to id when slug is null", () => {
    render(
      <TeamsPage
        teams={[{ id: "org-123", name: "NoSlug", slug: null }]}
        userName={null}
      />
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/org-123");
  });

  it("renders slug as subtitle text", () => {
    render(
      <TeamsPage
        teams={[{ id: "1", name: "Acme", slug: "acme" }]}
        userName={null}
      />
    );
    expect(screen.getByText("acme")).toBeInTheDocument();
  });

  it("does not render slug subtitle when slug is null", () => {
    render(
      <TeamsPage
        teams={[{ id: "1", name: "NoSlug", slug: null }]}
        userName={null}
      />
    );
    const link = screen.getByRole("link");
    expect(link.querySelector("p.text-xs")).toBeNull();
  });

  it("shows Lotus wordmark", () => {
    render(<TeamsPage teams={[]} userName={null} />);
    expect(screen.getByText("Lotus")).toBeInTheDocument();
  });
});

describe("TeamsPage getServerSideProps", () => {
  afterEach(() => {
    mockGetSession.mockReset();
    mockListOrganizations.mockReset();
  });

  it("redirects to /login when no session", async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const result = await getServerSideProps({
      req: { headers: { cookie: "" } },
    } as never);
    expect(result).toEqual({
      redirect: { destination: "/login", permanent: false },
    });
  });

  it("redirects to /onboarding when user has 0 teams", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { name: "Alice" },
      session: { activeOrganizationId: null },
    });
    mockListOrganizations.mockResolvedValueOnce([]);

    const result = await getServerSideProps({
      req: { headers: { cookie: "" } },
    } as never);
    expect(result).toEqual({
      redirect: { destination: "/onboarding", permanent: false },
    });
  });

  it("redirects to /:slug when user has 1 team", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { name: "Alice" },
      session: { activeOrganizationId: "1" },
    });
    mockListOrganizations.mockResolvedValueOnce([
      { id: "1", name: "Acme", slug: "acme" },
    ]);

    const result = await getServerSideProps({
      req: { headers: { cookie: "" } },
    } as never);
    expect(result).toEqual({
      redirect: { destination: "/acme", permanent: false },
    });
  });

  it("returns teams as props when user has 2+ teams", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { name: "Alice" },
      session: { activeOrganizationId: "1" },
    });
    mockListOrganizations.mockResolvedValueOnce([
      { id: "1", name: "Acme", slug: "acme" },
      { id: "2", name: "Beta", slug: "beta" },
    ]);

    const result = await getServerSideProps({
      req: { headers: { cookie: "" } },
    } as never);
    expect(result).toEqual({
      props: {
        teams: [
          { id: "1", name: "Acme", slug: "acme" },
          { id: "2", name: "Beta", slug: "beta" },
        ],
        userName: "Alice",
      },
    });
  });
});

describe("TeamsPage email verification redirect", () => {
  it("renders nothing when useRequireVerifiedEmail returns loading", () => {
    mockHookLoading = true;

    const { container } = render(
      <TeamsPage
        teams={[{ id: "1", name: "Acme", slug: "acme" }]}
        userName="Alice"
      />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders content when useRequireVerifiedEmail returns not loading", () => {
    mockHookLoading = false;

    render(
      <TeamsPage
        teams={[{ id: "1", name: "Acme", slug: "acme" }]}
        userName="Alice"
      />
    );
    expect(screen.getByText("Pick a team")).toBeInTheDocument();
  });
});
