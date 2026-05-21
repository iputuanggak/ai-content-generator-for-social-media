// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/components/layout/DashboardLayout", () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

vi.mock("@/components/confirm-dialog", () => ({
  ConfirmDialog: () => null,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockPush = vi.fn();
vi.mock("next/router", () => ({
  useRouter: () => ({ push: mockPush, pathname: "/[slug]/members", query: { slug: "acme" } }),
}));

let teamContextValue = {
  userName: "Test User",
  userId: "user-1",
  teamName: "Test Team",
  teamId: "team-1" as string | null,
  slug: "acme",
  teams: [{ id: "team-1", name: "Test Team", slug: "acme" }],
  loading: false,
};

vi.mock("@/lib/team-context", () => ({
  useTeam: () => teamContextValue,
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));

vi.mock("@/components/content-skeleton", () => ({
  ContentSkeleton: () => <div data-slot="skeleton" />,
}));

let mockHookLoading = false;

vi.mock("@/lib/use-require-verified-email", () => ({
  useRequireVerifiedEmail: () => ({ loading: mockHookLoading }),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

import MembersPage from "../../pages/[slug]/members";

describe("MembersPage email verification redirect", () => {
  afterEach(() => {
    cleanup();
    mockPush.mockClear();
    mockFetch.mockReset();
    mockHookLoading = false;
    teamContextValue = {
      userName: "Test User",
      userId: "user-1",
      teamName: "Test Team",
      teamId: "team-1",
      slug: "acme",
      teams: [{ id: "team-1", name: "Test Team", slug: "acme" }],
      loading: false,
    };
  });

  it("renders nothing when useRequireVerifiedEmail returns loading", () => {
    mockHookLoading = true;

    const { container } = render(<MembersPage />);
    expect(container.innerHTML).toBe("");
  });

  it("renders content when useRequireVerifiedEmail returns not loading", async () => {
    mockHookLoading = false;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          members: [],
          isAdmin: true,
        }),
    });

    render(<MembersPage />);
    await waitFor(() => {
      expect(screen.getByText("Team Members")).toBeInTheDocument();
    });
  });
});
