// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/components/layout/DashboardLayout", () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockPush = vi.fn();
vi.mock("next/router", () => ({
  useRouter: () => ({ push: mockPush, pathname: "/[slug]/settings", query: { slug: "acme" } }),
}));

let teamContextValue = {
  userName: "Test User",
  teamName: "Test Team",
  teamId: "team-1" as string | null,
  slug: "acme",
  teams: [{ id: "team-1", name: "Test Team", slug: "acme" }],
  loading: false,
};

vi.mock("@/lib/team-context", () => ({
  useTeam: () => teamContextValue,
}));

vi.mock("@/lib/platform-metadata", () => ({
  PLATFORM_OPTIONS: [
    { value: "twitter", label: "Twitter / X" },
    { value: "linkedin", label: "LinkedIn" },
  ],
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

vi.mock("@/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));

vi.mock("@/components/ui/toggle-group", () => ({
  ToggleGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ToggleGroupItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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

import SettingsPage from "../[slug]/settings";

describe("SettingsPage email verification redirect", () => {
  afterEach(() => {
    cleanup();
    mockPush.mockClear();
    mockFetch.mockReset();
    mockHookLoading = false;
    teamContextValue = {
      userName: "Test User",
      teamName: "Test Team",
      teamId: "team-1",
      slug: "acme",
      teams: [{ id: "team-1", name: "Test Team", slug: "acme" }],
      loading: false,
    };
  });

  it("renders nothing when useRequireVerifiedEmail returns loading", () => {
    mockHookLoading = true;

    const { container } = render(<SettingsPage />);
    expect(container.innerHTML).toBe("");
  });

  it("renders content when useRequireVerifiedEmail returns not loading", async () => {
    mockHookLoading = false;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          brandVoice: "",
          defaultTone: "professional",
          activePlatforms: [],
          modelId: "",
          isAdmin: true,
        }),
    });

    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getAllByText("Brand Settings").length).toBeGreaterThan(0);
    });
  });
});
