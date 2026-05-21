// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

vi.mock("@/lib/use-require-verified-email", () => ({
  useRequireVerifiedEmail: () => ({ loading: false }),
}));

vi.mock("next/router", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/components/layout/DashboardLayout", () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

const mockGenerations = {
  items: [
    {
      id: "gen-1",
      topic: "Summer sale campaign",
      tone: "casual",
      intendedPublishAt: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: "gen-2",
      topic: "Product launch announcement",
      tone: "professional",
      intendedPublishAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ],
  total: 25,
};

const mockFetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockGenerations),
  })
);
global.fetch = mockFetch;

import HistoryPage from "../../pages/[slug]/history";

describe("HistoryPage CSR conversion", () => {
  afterEach(() => {
    cleanup();
    mockFetch.mockClear();
  });

  it("renders without props (uses useTeam context)", async () => {
    render(<HistoryPage />);
    await screen.findByText("Summer sale campaign");
    expect(screen.getByText("Generation History")).toBeInTheDocument();
  });

  it("shows ContentSkeleton while generations load", () => {
    let resolveFetch: (value: unknown) => void;
    mockFetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );
    const { container } = render(<HistoryPage />);
    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument();
    resolveFetch!({
      ok: true,
      json: () => Promise.resolve({ items: [], total: 0 }),
    });
  });

  it("uses shadcn Input for search topic", async () => {
    render(<HistoryPage />);
    await screen.findByText("Summer sale campaign");
    const input = screen.getByPlaceholderText(/summer sale/i);
    expect(input).toHaveAttribute("data-slot", "input");
  });

  it("uses DatePicker for From date filter", async () => {
    render(<HistoryPage />);
    await screen.findByText("Summer sale campaign");
    const fromLabel = screen.getByText("From");
    const fromContainer = fromLabel.parentElement!;
    const fromButton = within(fromContainer).getByRole("button");
    expect(fromButton).toBeInTheDocument();
  });

  it("uses DatePicker for To date filter", async () => {
    render(<HistoryPage />);
    await screen.findByText("Summer sale campaign");
    const toLabel = screen.getByText("To");
    const toContainer = toLabel.parentElement!;
    const toButton = within(toContainer).getByRole("button");
    expect(toButton).toBeInTheDocument();
  });

  it("uses shadcn Button with destructive variant for delete", async () => {
    render(<HistoryPage />);
    await screen.findByText("Summer sale campaign");
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i }).filter(
      (btn) => btn.getAttribute("data-slot") === "button"
    );
    expect(deleteButtons.length).toBeGreaterThan(0);
    expect(deleteButtons[0]).toHaveAttribute("data-slot", "button");
    expect(deleteButtons[0]).toHaveAttribute("data-variant", "destructive");
  });

  it("uses shadcn Pagination components for page navigation", async () => {
    const { container } = render(<HistoryPage />);
    await screen.findByText("Summer sale campaign");
    expect(container.querySelector('[data-slot="pagination"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="pagination-content"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="pagination-item"]')).toBeInTheDocument();
  });

  it("uses shadcn PaginationLink with active page highlighting", async () => {
    const { container } = render(<HistoryPage />);
    await screen.findByText("Summer sale campaign");
    const activeLink = container.querySelector('[data-active="true"]');
    expect(activeLink).toBeInTheDocument();
    expect(activeLink?.textContent).toBe("1");
  });

  it("uses ConfirmDialog for delete confirmation", async () => {
    const user = userEvent.setup();
    render(<HistoryPage />);
    await screen.findByText("Summer sale campaign");
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i }).filter(
      (btn) => btn.getAttribute("data-slot") === "button"
    );
    await user.click(deleteButtons[0]);
    expect(screen.getByText("Delete Generation?")).toBeInTheDocument();
    expect(screen.getByText(/permanently delete/i)).toBeInTheDocument();
  });

  it("search input still filters correctly", async () => {
    const user = userEvent.setup();
    render(<HistoryPage />);
    await screen.findByText("Summer sale campaign");
    const input = screen.getByPlaceholderText(/summer sale/i);
    await user.type(input, "test");
    const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    expect(lastCall[0]).toContain("search=test");
  });

  it("pagination renders Previous and Next links", async () => {
    const { container } = render(<HistoryPage />);
    await screen.findByText("Summer sale campaign");
    const prevLink = container.querySelector('[aria-label="Go to previous page"]');
    const nextLink = container.querySelector('[aria-label="Go to next page"]');
    expect(prevLink).toBeInTheDocument();
    expect(nextLink).toBeInTheDocument();
  });
});
