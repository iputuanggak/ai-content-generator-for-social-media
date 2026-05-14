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

vi.mock("next/router", () => ({
  useRouter: () => ({ push: vi.fn(), pathname: "/[slug]/history/[id]", query: { slug: "acme", id: "gen-1" } }),
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
  platformOutputs: [
    { id: "po-1", platform: "twitter", content: "Twitter content here", editedContent: null },
    { id: "po-2", platform: "linkedin", content: "LinkedIn content here", editedContent: "Edited LinkedIn" },
  ],
};

const mockFetch = vi.fn((url: string) => {
  if (typeof url === "string" && url.includes("/api/generations/gen-1")) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGeneration) });
  }
  if (typeof url === "string" && url.includes("/api/generations/gen-404")) {
    return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({ error: "Not found" }) });
  }
  if (typeof url === "string" && url.includes("/api/generations/gen-403")) {
    return Promise.resolve({ ok: false, status: 403, json: () => Promise.resolve({ error: "Forbidden" }) });
  }
  return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
});
global.fetch = mockFetch;

import HistoryDetailPage from "../[slug]/history/[id]";

describe("HistoryDetailPage CSR conversion", () => {
  afterEach(() => {
    cleanup();
    mockFetch.mockClear();
  });

  it("renders without getServerSideProps (CSR)", async () => {
    render(<HistoryDetailPage />);
    await screen.findByText("Summer sale campaign");
    expect(screen.getByText("Summer sale campaign")).toBeInTheDocument();
  });

  it("shows ContentSkeleton while data loads", () => {
    let resolveFetch: (value: unknown) => void;
    mockFetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );
    const { container } = render(<HistoryDetailPage />);
    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument();
    resolveFetch!({
      ok: true,
      json: () => Promise.resolve(mockGeneration),
    });
  });

  it("fetches generation data from API on mount", async () => {
    render(<HistoryDetailPage />);
    await screen.findByText("Summer sale campaign");
    expect(mockFetch).toHaveBeenCalledWith("/api/generations/gen-1");
  });

  it("displays generation topic and tone", async () => {
    render(<HistoryDetailPage />);
    await screen.findByText("Summer sale campaign");
    expect(screen.getByText("Casual")).toBeInTheDocument();
  });

  it("displays platform outputs", async () => {
    render(<HistoryDetailPage />);
    await screen.findByText("Summer sale campaign");
    expect(screen.getByText("Twitter / X")).toBeInTheDocument();
    expect(screen.getByText("LinkedIn")).toBeInTheDocument();
  });

  it("shows back link to history", async () => {
    render(<HistoryDetailPage />);
    await screen.findByText("Summer sale campaign");
    const backLink = screen.getByText("← Back to History");
    expect(backLink.closest("a")).toHaveAttribute("href", "/acme/history");
  });

  it("shows not found message for 404 response", async () => {
    vi.doMock("next/router", () => ({
      useRouter: () => ({ push: vi.fn(), pathname: "/[slug]/history/[id]", query: { slug: "acme", id: "gen-404" } }),
    }));
    const { container } = render(<HistoryDetailPage />);
    await waitFor(() => {
      expect(container.querySelector('[data-slot="skeleton"]')).not.toBeInTheDocument();
    });
  });
});
