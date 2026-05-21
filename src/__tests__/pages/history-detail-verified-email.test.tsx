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

vi.mock("@/components/content-skeleton", () => ({
  ContentSkeleton: () => <div data-slot="skeleton" />,
}));

vi.mock("sonner", () => ({
  toast: vi.fn(),
}));

vi.mock("@/components/date-time-picker", () => ({
  DateTimePicker: () => <div />,
}));

vi.mock("@/components/platform-output-card", () => ({
  PlatformOutputCard: () => <div />,
}));

vi.mock("@/lib/platform-metadata", () => ({
  PLATFORM_LABELS: {
    twitter: "Twitter / X",
    linkedin: "LinkedIn",
  },
}));

vi.mock("next/router", () => ({
  useRouter: () => ({
    push: vi.fn(),
    pathname: "/[slug]/history/[id]",
    query: { slug: "acme", id: "gen-1" },
  }),
}));

let mockHookLoading = false;

vi.mock("@/lib/use-require-verified-email", () => ({
  useRequireVerifiedEmail: () => ({ loading: mockHookLoading }),
}));

const mockGeneration = {
  generation: {
    id: "gen-1",
    topic: "Summer sale campaign",
    tone: "casual",
    intendedPublishAt: null,
    createdAt: new Date().toISOString(),
    organizationId: "team-1",
  },
  platformOutputs: [],
};

const mockFetch = vi.fn(() =>
  Promise.resolve({ ok: true, json: () => Promise.resolve(mockGeneration) })
);
global.fetch = mockFetch;

import HistoryDetailPage from "../../pages/[slug]/history/[id]";

describe("HistoryDetailPage email verification redirect", () => {
  afterEach(() => {
    cleanup();
    mockFetch.mockClear();
    mockHookLoading = false;
  });

  it("renders nothing when useRequireVerifiedEmail returns loading", () => {
    mockHookLoading = true;

    const { container } = render(<HistoryDetailPage />);
    expect(container.innerHTML).toBe("");
  });

  it("renders content when useRequireVerifiedEmail returns not loading", async () => {
    mockHookLoading = false;

    render(<HistoryDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Summer sale campaign")).toBeInTheDocument();
    });
  });
});
