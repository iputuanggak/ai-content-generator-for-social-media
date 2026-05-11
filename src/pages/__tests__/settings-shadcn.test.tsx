// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
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

const mockFetch = vi.fn();
global.fetch = mockFetch;

import SettingsPage from "../dashboard/settings";

const defaultProps = {
  userName: "Test User",
  teamName: "Test Team",
  teamId: "team-1",
  isAdmin: true,
  brandVoice: "Bold and friendly",
  defaultTone: "professional" as const,
  activePlatforms: ["twitter", "linkedin"] as Array<"twitter" | "linkedin">,
  modelId: "google/gemini-2.5-flash",
  teams: [{ id: "team-1", name: "Test Team" }],
};

describe("SettingsPage shadcn components", () => {
  afterEach(() => {
    cleanup();
    mockFetch.mockReset();
  });

  it("uses shadcn Textarea for brand voice", () => {
    render(<SettingsPage {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(/describe your brand/i);
    expect(textarea).toHaveAttribute("data-slot", "textarea");
  });

  it("uses shadcn Select for default tone", () => {
    const { container } = render(<SettingsPage {...defaultProps} />);
    const trigger = container.querySelector('[data-slot="select-trigger"]');
    expect(trigger).toBeInTheDocument();
  });

  it("uses shadcn Input for model id", () => {
    render(<SettingsPage {...defaultProps} />);
    const input = screen.getByPlaceholderText(/google\/gemini/i);
    expect(input).toHaveAttribute("data-slot", "input");
  });

  it("uses shadcn Button for save settings", () => {
    render(<SettingsPage {...defaultProps} />);
    const saveBtn = screen.getByRole("button", { name: /save settings/i });
    expect(saveBtn).toHaveAttribute("data-slot", "button");
  });

  it("uses shadcn ToggleGroup for platform toggles", () => {
    const { container } = render(<SettingsPage {...defaultProps} />);
    const toggleGroup = container.querySelector('[data-slot="toggle-group"]');
    expect(toggleGroup).toBeInTheDocument();
  });

  it("renders all 8 platform toggle items", () => {
    const { container } = render(<SettingsPage {...defaultProps} />);
    const items = container.querySelectorAll('[data-slot="toggle-group-item"]');
    expect(items).toHaveLength(8);
  });

  it("marks active platforms as pressed in toggle items", () => {
    const { container } = render(<SettingsPage {...defaultProps} />);
    const items = container.querySelectorAll('[data-slot="toggle-group-item"]');
    const twitterItem = Array.from(items).find(el => el.textContent?.includes("Twitter"));
    const pinterestItem = Array.from(items).find(el => el.textContent?.includes("Pinterest"));
    expect(twitterItem).toHaveAttribute("data-state", "on");
    expect(pinterestItem).toHaveAttribute("data-state", "off");
  });

  it("form still saves correctly with all values", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    const user = userEvent.setup();
    render(<SettingsPage {...defaultProps} />);
    const saveBtn = screen.getByRole("button", { name: /save settings/i });
    await user.click(saveBtn);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/teams/team-1/brand-settings");
    expect(options.method).toBe("PUT");
    const body = JSON.parse(options.body);
    expect(body.brandVoice).toBe("Bold and friendly");
    expect(body.defaultTone).toBe("professional");
    expect(body.activePlatforms).toEqual(["twitter", "linkedin"]);
    expect(body.modelId).toBe("google/gemini-2.5-flash");
  });

  it("hides save button for non-admin users", () => {
    render(<SettingsPage {...defaultProps} isAdmin={false} />);
    expect(screen.queryByRole("button", { name: /save settings/i })).not.toBeInTheDocument();
  });

  it("disables select trigger for non-admin users", () => {
    const { container } = render(<SettingsPage {...defaultProps} isAdmin={false} />);
    const trigger = container.querySelector('[data-slot="select-trigger"]');
    expect(trigger).toHaveAttribute("disabled");
  });
});
