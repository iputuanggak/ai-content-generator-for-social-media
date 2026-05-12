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

vi.mock("@/components/confirm-dialog", () => ({
  ConfirmDialog: ({ open, onConfirm, confirmLabel }: { open: boolean; onConfirm: () => void; confirmLabel: string }) =>
    open ? <button data-testid="confirm-btn" onClick={onConfirm}>{confirmLabel}</button> : null,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockPush = vi.fn();
vi.mock("next/router", () => ({
  useRouter: () => ({ push: mockPush, pathname: "/dashboard/members" }),
}));

let teamContextValue = {
  userName: "Test User",
  userId: "user-1",
  teamName: "Test Team",
  teamId: "team-1" as string | null,
  teams: [{ id: "team-1", name: "Test Team" }],
  loading: false,
};

vi.mock("@/lib/team-context", () => ({
  useTeam: () => teamContextValue,
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

const membersResponse = {
  members: [
    {
      id: "m-1",
      userId: "user-1",
      role: "owner",
      createdAt: "2025-01-01T00:00:00Z",
      user: { id: "user-1", name: "Admin User", email: "admin@example.com" },
    },
    {
      id: "m-2",
      userId: "user-2",
      role: "member",
      createdAt: "2025-01-02T00:00:00Z",
      user: { id: "user-2", name: "Regular Member", email: "member@example.com" },
    },
  ],
  isAdmin: true,
};

import MembersPage from "../dashboard/members";

describe("MembersPage CSR", () => {
  afterEach(() => {
    cleanup();
    mockFetch.mockReset();
    mockPush.mockReset();
    teamContextValue = {
      userName: "Test User",
      userId: "user-1",
      teamName: "Test Team",
      teamId: "team-1",
      teams: [{ id: "team-1", name: "Test Team" }],
      loading: false,
    };
  });

  it("shows skeleton while loading team data", () => {
    teamContextValue = { ...teamContextValue, loading: true, teamId: null };
    render(<MembersPage />);
    expect(document.querySelector('[data-slot="skeleton"]')).toBeInTheDocument();
  });

  it("shows skeleton while loading members data", () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<MembersPage />);
    expect(document.querySelector('[data-slot="skeleton"]')).toBeInTheDocument();
  });

  it("renders members list after loading", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(membersResponse),
    });
    render(<MembersPage />);

    await waitFor(() => {
      expect(screen.getByText("Admin User")).toBeInTheDocument();
      expect(screen.getByText("admin@example.com")).toBeInTheDocument();
      expect(screen.getByText("Regular Member")).toBeInTheDocument();
      expect(screen.getByText("member@example.com")).toBeInTheDocument();
    });
  });

  it("renders role badges for each member", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(membersResponse),
    });
    render(<MembersPage />);

    await waitFor(() => {
      expect(screen.getByText("Owner")).toBeInTheDocument();
      expect(screen.getByText("Member")).toBeInTheDocument();
    });
  });

  it("shows invite form for admin users", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(membersResponse),
    });
    render(<MembersPage />);

    await waitFor(() => {
      expect(screen.getByText("Invite a Member")).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter email/i)).toBeInTheDocument();
    });
  });

  it("hides invite form for non-admin users", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...membersResponse, isAdmin: false }),
    });
    render(<MembersPage />);

    await waitFor(() => {
      expect(screen.getByText("Admin User")).toBeInTheDocument();
    });

    expect(screen.queryByText("Invite a Member")).not.toBeInTheDocument();
  });

  it("shows remove button for non-owner members when admin", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(membersResponse),
    });
    render(<MembersPage />);

    const removeButtons = await screen.findAllByRole("button", { name: /remove/i });
    expect(removeButtons).toHaveLength(1);
  });

  it("hides remove button for non-admin users", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...membersResponse, isAdmin: false }),
    });
    render(<MembersPage />);

    await waitFor(() => {
      expect(screen.getByText("Admin User")).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument();
  });

  it("sends invite on form submit", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(membersResponse),
    }).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ invitation: {} }),
    });
    const user = userEvent.setup();
    render(<MembersPage />);

    const input = await screen.findByPlaceholderText(/enter email/i);
    await user.type(input, "new@example.com");
    const sendBtn = screen.getByRole("button", { name: /send invite/i });
    await user.click(sendBtn);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const [url, options] = mockFetch.mock.calls[1];
    expect(url).toContain("/api/teams/team-1/members");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ email: "new@example.com" });
  });

  it("fetches members from correct API endpoint", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(membersResponse),
    });
    render(<MembersPage />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/teams/team-1/members");
    });
  });

  it("redirects to /onboarding when no teamId", async () => {
    teamContextValue = { ...teamContextValue, loading: false, teamId: null };
    render(<MembersPage />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/onboarding");
    });
  });

  it("has no getServerSideProps export", async () => {
    const mod = await import("../dashboard/members");
    expect((mod as Record<string, unknown>).getServerSideProps).toBeUndefined();
  });
});
