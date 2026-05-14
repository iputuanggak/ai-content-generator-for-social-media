// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

const mockFetch = vi.fn();
global.fetch = mockFetch;

const brandSettingsResponse = {
  brandVoice: "Bold and friendly",
  defaultTone: "professional",
  activePlatforms: ["twitter", "linkedin"],
  modelId: "google/gemini-2.5-flash",
  isAdmin: true,
};

import SettingsPage from "../[slug]/settings";

describe("SettingsPage CSR", () => {
  afterEach(() => {
    cleanup();
    mockFetch.mockReset();
    mockPush.mockReset();
    teamContextValue = {
      userName: "Test User",
      teamName: "Test Team",
      teamId: "team-1",
      slug: "acme",
      teams: [{ id: "team-1", name: "Test Team", slug: "acme" }],
      loading: false,
    };
  });

  it("shows skeleton while loading team data", () => {
    teamContextValue = { ...teamContextValue, loading: true, teamId: null };
    render(<SettingsPage />);
    expect(document.querySelector('[data-slot="skeleton"]')).toBeInTheDocument();
  });

  it("shows skeleton while loading brand settings", () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<SettingsPage />);
    expect(document.querySelector('[data-slot="skeleton"]')).toBeInTheDocument();
  });

  it("renders form with data after loading", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(brandSettingsResponse),
    });
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/describe your brand/i)).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/describe your brand/i);
    expect(textarea).toHaveValue("Bold and friendly");
  });

  it("uses shadcn Textarea for brand voice", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(brandSettingsResponse),
    });
    render(<SettingsPage />);
    const textarea = await screen.findByPlaceholderText(/describe your brand/i);
    expect(textarea).toHaveAttribute("data-slot", "textarea");
  });

  it("uses shadcn Select for default tone", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(brandSettingsResponse),
    });
    const { container } = render(<SettingsPage />);
    await waitFor(() => {
      expect(container.querySelector('[data-slot="select-trigger"]')).toBeInTheDocument();
    });
  });

  it("uses shadcn Input for model id", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(brandSettingsResponse),
    });
    render(<SettingsPage />);
    const input = await screen.findByPlaceholderText(/google\/gemini/i);
    expect(input).toHaveAttribute("data-slot", "input");
  });

  it("uses shadcn Button for save settings", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(brandSettingsResponse),
    });
    render(<SettingsPage />);
    const saveBtn = await screen.findByRole("button", { name: /save settings/i });
    expect(saveBtn).toHaveAttribute("data-slot", "button");
  });

  it("uses shadcn ToggleGroup for platform toggles", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(brandSettingsResponse),
    });
    const { container } = render(<SettingsPage />);
    await waitFor(() => {
      expect(container.querySelector('[data-slot="toggle-group"]')).toBeInTheDocument();
    });
  });

  it("renders all 8 platform toggle items", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(brandSettingsResponse),
    });
    const { container } = render(<SettingsPage />);
    await waitFor(() => {
      const items = container.querySelectorAll('[data-slot="toggle-group-item"]');
      expect(items).toHaveLength(8);
    });
  });

  it("marks active platforms as pressed in toggle items", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(brandSettingsResponse),
    });
    const { container } = render(<SettingsPage />);
    await waitFor(() => {
      const items = container.querySelectorAll('[data-slot="toggle-group-item"]');
      const twitterItem = Array.from(items).find(el => el.textContent?.includes("Twitter"));
      const pinterestItem = Array.from(items).find(el => el.textContent?.includes("Pinterest"));
      expect(twitterItem).toHaveAttribute("data-state", "on");
      expect(pinterestItem).toHaveAttribute("data-state", "off");
    });
  });

  it("form saves correctly with all values", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(brandSettingsResponse),
    }).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });
    const user = userEvent.setup();
    render(<SettingsPage />);
    const saveBtn = await screen.findByRole("button", { name: /save settings/i });
    await user.click(saveBtn);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    const [url, options] = mockFetch.mock.calls[1];
    expect(url).toContain("/api/teams/acme/brand-settings");
    expect(options.method).toBe("PUT");
    const body = JSON.parse(options.body);
    expect(body.brandVoice).toBe("Bold and friendly");
    expect(body.defaultTone).toBe("professional");
    expect(body.activePlatforms).toEqual(["twitter", "linkedin"]);
    expect(body.modelId).toBe("google/gemini-2.5-flash");
  });

  it("hides save button for non-admin users", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...brandSettingsResponse, isAdmin: false }),
    });
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByText(/read-only mode/i)).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /save settings/i })).not.toBeInTheDocument();
  });

  it("disables select trigger for non-admin users", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...brandSettingsResponse, isAdmin: false }),
    });
    const { container } = render(<SettingsPage />);
    await waitFor(() => {
      const trigger = container.querySelector('[data-slot="select-trigger"]');
      expect(trigger).toHaveAttribute("disabled");
    });
  });

  it("redirects to /onboarding when no teamId", async () => {
    teamContextValue = { ...teamContextValue, loading: false, teamId: null, slug: null };
    render(<SettingsPage />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/onboarding");
    });
  });

  it("has no getServerSideProps export", async () => {
    const mod = await import("../[slug]/settings");
    expect((mod as Record<string, unknown>).getServerSideProps).toBeUndefined();
  });
});
