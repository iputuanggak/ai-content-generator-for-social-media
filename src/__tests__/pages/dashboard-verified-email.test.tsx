// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/components/layout/DashboardLayout", () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

vi.mock("@/lib/team-context", () => ({
  useTeam: () => ({
    userName: "Test User",
    teamName: "Test Team",
    teamId: "team-1",
    slug: "acme",
    teams: [{ id: "team-1", name: "Test Team", slug: "acme" }],
    loading: false,
  }),
}));

vi.mock("@/lib/platform-metadata", () => ({
  PLATFORM_LABELS: {
    twitter: "Twitter / X",
    linkedin: "LinkedIn",
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    youtube: "YouTube",
    threads: "Threads",
    pinterest: "Pinterest",
  },
}));

vi.mock("sonner", () => ({
  toast: vi.fn(),
}));

vi.mock("@/components/ui/textarea", () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} />
  ),
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: () => <span />,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));

vi.mock("@/components/date-time-picker", () => ({
  DateTimePicker: () => <div />,
}));

vi.mock("@/components/platform-output-card", () => ({
  PlatformOutputCard: () => <div />,
}));

vi.mock("@/components/content-skeleton", () => ({
  ContentSkeleton: () => <div data-slot="skeleton" />,
}));

const mockPush = vi.fn();
vi.mock("next/router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

let mockHookLoading = false;

vi.mock("@/lib/use-require-verified-email", () => ({
  useRequireVerifiedEmail: () => ({ loading: mockHookLoading }),
}));

const mockFetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        defaultTone: "professional",
        activePlatforms: ["twitter"],
      }),
  })
);
global.fetch = mockFetch as unknown as typeof fetch;

import DashboardPage from "../../pages/[slug]/index";

describe("DashboardPage email verification redirect", () => {
  afterEach(() => {
    cleanup();
    mockPush.mockClear();
    mockFetch.mockClear();
    mockHookLoading = false;
  });

  it("renders nothing when useRequireVerifiedEmail returns loading", () => {
    mockHookLoading = true;

    const { container } = render(<DashboardPage />);
    expect(container.innerHTML).toBe("");
  });

  it("renders content when useRequireVerifiedEmail returns not loading", async () => {
    mockHookLoading = false;

    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("Generate Content")).toBeInTheDocument();
    });
  });
});
