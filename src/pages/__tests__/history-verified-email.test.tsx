// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const mockTeamContext = {
  userName: "Test User",
  teamName: "Test Team",
  teamId: "team-1",
  slug: "acme",
  teams: [{ id: "team-1", name: "Test Team", slug: "acme" }],
  loading: false,
};

vi.mock("@/lib/team-context", () => ({
  useTeam: () => mockTeamContext,
}));

vi.mock("@/components/layout/DashboardLayout", () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

vi.mock("@/components/confirm-dialog", () => ({
  ConfirmDialog: () => null,
}));

vi.mock("@/components/content-skeleton", () => ({
  ContentSkeleton: () => <div data-slot="skeleton" />,
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));

vi.mock("@/components/date-picker", () => ({
  DatePicker: () => <div />,
}));

vi.mock("@/components/ui/pagination", () => ({
  Pagination: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PaginationContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PaginationItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PaginationLink: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PaginationPrevious: () => <div />,
  PaginationNext: () => <div />,
}));

let mockHookLoading = false;

vi.mock("@/lib/use-require-verified-email", () => ({
  useRequireVerifiedEmail: () => ({ loading: mockHookLoading }),
}));

const mockGenerations = {
  items: [
    {
      id: "gen-1",
      topic: "Test topic",
      tone: "casual",
      intendedPublishAt: null,
      createdAt: new Date().toISOString(),
    },
  ],
  total: 1,
};

const mockFetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockGenerations),
  })
);
global.fetch = mockFetch;

import HistoryPage from "../[slug]/history";

describe("HistoryPage email verification redirect", () => {
  afterEach(() => {
    cleanup();
    mockFetch.mockClear();
    mockHookLoading = false;
  });

  it("renders nothing when useRequireVerifiedEmail returns loading", () => {
    mockHookLoading = true;

    const { container } = render(<HistoryPage />);
    expect(container.innerHTML).toBe("");
  });

  it("renders content when useRequireVerifiedEmail returns not loading", async () => {
    mockHookLoading = false;

    render(<HistoryPage />);
    await waitFor(() => {
      expect(screen.getByText("Generation History")).toBeInTheDocument();
    });
  });
});
