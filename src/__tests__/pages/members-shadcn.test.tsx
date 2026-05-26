// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

vi.mock("@/components/layout/DashboardLayout", () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

vi.mock("@/components/confirm-dialog", () => ({
  ConfirmDialog: ({ open, onConfirm, confirmLabel, title }: { open: boolean; onConfirm: () => void; confirmLabel: string; title: string }) =>
    open ? <button data-testid={`confirm-btn-${title}`} onClick={onConfirm}>{confirmLabel}</button> : null,
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
  slug: "acme" as string | null,
  teams: [{ id: "team-1", name: "Test Team", slug: "acme" }],
  loading: false,
};

vi.mock("@/lib/team-context", () => ({
  useTeam: () => teamContextValue,
}));

vi.mock("@/lib/use-require-verified-email", () => ({
  useRequireVerifiedEmail: () => ({ loading: false }),
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
  invitations: [
    {
      id: "inv-1",
      email: "pending@example.com",
      role: "member",
      status: "pending",
      expiresAt: "2025-06-01T00:00:00Z",
      createdAt: "2025-05-25T00:00:00Z",
    },
  ],
  isAdmin: true,
};

import MembersPage from "../../pages/[slug]/members";

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
      slug: "acme",
      teams: [{ id: "team-1", name: "Test Team", slug: "acme" }],
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
    expect(url).toContain("/api/teams/acme/members");
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
      expect(mockFetch).toHaveBeenCalledWith("/api/teams/acme/members");
    });
  });

  it("redirects to /onboarding when no teamId", async () => {
    teamContextValue = { ...teamContextValue, loading: false, teamId: null, slug: null };
    render(<MembersPage />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/onboarding");
    });
  });

  it("has no getServerSideProps export", async () => {
    const mod = await import("../../pages/[slug]/members");
    expect((mod as Record<string, unknown>).getServerSideProps).toBeUndefined();
  });

  it("renders pending invitations below active members", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(membersResponse),
    });
    render(<MembersPage />);

    await waitFor(() => {
      expect(screen.getByText("pending@example.com")).toBeInTheDocument();
    });
  });

  it("shows Pending badge for pending invitations", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(membersResponse),
    });
    render(<MembersPage />);

    await waitFor(() => {
      const pendingBadges = screen.getAllByText("Pending");
      expect(pendingBadges.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows email as primary text for pending invitations with no secondary line", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(membersResponse),
    });
    render(<MembersPage />);

    await waitFor(() => {
      expect(screen.getByText("pending@example.com")).toBeInTheDocument();
    });

    const pendingRow = screen.getByText("pending@example.com").closest("div");
    const paragraphs = pendingRow!.querySelectorAll("p");
    expect(paragraphs).toHaveLength(1);
  });

  it("shows cancel button on pending invitation rows for admins", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(membersResponse),
    });
    render(<MembersPage />);

    await waitFor(() => {
      expect(screen.getByText("pending@example.com")).toBeInTheDocument();
    });

    const cancelButtons = screen.getAllByRole("button", { name: /^cancel$/i });
    expect(cancelButtons).toHaveLength(1);
  });

  it("hides cancel button on pending invitation rows for non-admins", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...membersResponse, isAdmin: false }),
    });
    render(<MembersPage />);

    await waitFor(() => {
      expect(screen.getByText("pending@example.com")).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: /^cancel$/i })).not.toBeInTheDocument();
  });

  it("renders pending invitations for non-admin users", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...membersResponse, isAdmin: false }),
    });
    render(<MembersPage />);

    await waitFor(() => {
      expect(screen.getByText("pending@example.com")).toBeInTheDocument();
      expect(screen.getByText("Pending")).toBeInTheDocument();
    });
  });

  it("opens cancel invitation confirm dialog when clicking cancel", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(membersResponse),
    });
    const user = userEvent.setup();
    render(<MembersPage />);

    const cancelButton = await screen.findByRole("button", { name: /^cancel$/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByTestId("confirm-btn-Cancel Invitation")).toBeInTheDocument();
    });
  });

  it("shows invitee email in cancel confirmation dialog", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(membersResponse),
    });
    const user = userEvent.setup();
    render(<MembersPage />);

    const cancelButton = await screen.findByRole("button", { name: /^cancel$/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByTestId("confirm-btn-Cancel Invitation")).toBeInTheDocument();
    });
  });

  it("calls DELETE endpoint when confirming cancel invitation", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(membersResponse),
    }).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    const user = userEvent.setup();
    render(<MembersPage />);

    const cancelButton = await screen.findByRole("button", { name: /^cancel$/i });
    await user.click(cancelButton);

    const confirmBtn = await screen.findByTestId("confirm-btn-Cancel Invitation");
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
      const [url, options] = mockFetch.mock.calls[1];
      expect(url).toBe("/api/teams/acme/invitations/inv-1");
      expect(options.method).toBe("DELETE");
    });
  });

  it("shows resend button on pending invitation rows for admins", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(membersResponse),
    });
    render(<MembersPage />);

    await waitFor(() => {
      expect(screen.getByText("pending@example.com")).toBeInTheDocument();
    });

    const resendButtons = screen.getAllByRole("button", { name: /^resend$/i });
    expect(resendButtons).toHaveLength(1);
  });

  it("hides resend button on pending invitation rows for non-admins", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...membersResponse, isAdmin: false }),
    });
    render(<MembersPage />);

    await waitFor(() => {
      expect(screen.getByText("pending@example.com")).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: /^resend/i })).not.toBeInTheDocument();
  });

  it("calls POST resend endpoint when clicking resend", async () => {
    const newInvitation = {
      id: "inv-new",
      email: "pending@example.com",
      role: "member",
      status: "pending",
      expiresAt: "2025-06-08T00:00:00Z",
      createdAt: "2025-05-25T00:00:00Z",
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(membersResponse),
    }).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ invitation: newInvitation }),
    });
    const user = userEvent.setup();
    render(<MembersPage />);

    const resendButton = await screen.findByRole("button", { name: /^resend$/i });
    await user.click(resendButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
      const [url, options] = mockFetch.mock.calls[1];
      expect(url).toBe("/api/teams/acme/invitations/inv-1/resend");
      expect(options.method).toBe("POST");
    });
  });

  it("shows cooldown state after successful resend", async () => {
    const newInvitation = {
      id: "inv-new",
      email: "pending@example.com",
      role: "member",
      status: "pending",
      expiresAt: "2025-06-08T00:00:00Z",
      createdAt: "2025-05-25T00:00:00Z",
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(membersResponse),
    }).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ invitation: newInvitation }),
    });
    render(<MembersPage />);

    const resendButton = await screen.findByRole("button", { name: /^resend$/i });
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /resend \(\d+s\)/i })).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /resend \(\d+s\)/i })).toBeDisabled();
  });
});
