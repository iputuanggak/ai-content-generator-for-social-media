// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const mockPush = vi.fn();
let mockQuery: Record<string, string> = {};

vi.mock("next/router", () => ({
  useRouter: () => ({
    query: mockQuery,
    push: mockPush,
  }),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: { email: vi.fn() },
  },
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

import LoginPage from "../../pages/login";
import { authClient } from "@/lib/auth-client";

function wrap(children: ReactNode) {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

async function fillAndSubmit() {
  const user = userEvent.setup();
  render(wrap(<LoginPage />));
  await user.type(screen.getByLabelText(/email/i), "test@example.com");
  // Use the input by id to avoid matching the "Show password" button aria-label
  const passwordInput = document.getElementById("password") as HTMLElement;
  await user.type(passwordInput, "password123");
  await user.click(screen.getByRole("button", { name: /sign in/i }));
}

describe("Login redirect for unverified users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery = {};
    vi.mocked(authClient.signIn.email).mockResolvedValue({ error: null } as never);
  });

  afterEach(cleanup);

  it("redirects unverified user to /verify-email and sends OTP", async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: async () => ({
          session: { user: { emailVerified: false } },
          teams: [],
        }),
      })
      .mockResolvedValueOnce({ json: async () => ({ success: true }) });

    await fillAndSubmit();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        "/verify-email?email=test%40example.com"
      );
    });

    // Should have called /api/session then /api/auth/send-otp
    expect(mockFetch).toHaveBeenCalledWith("/api/session");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/auth/send-otp",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "test@example.com", purpose: "email_verification" }),
      })
    );
  });

  it("redirects verified user with no teams to /onboarding", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        session: { user: { emailVerified: true } },
        teams: [],
      }),
    });

    await fillAndSubmit();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/onboarding");
    });
    // Should NOT call send-otp
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("redirects verified user with one team to /{slug}", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        session: { user: { emailVerified: true } },
        teams: [{ id: "team-1", name: "My Team", slug: "my-team" }],
      }),
    });

    await fillAndSubmit();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/my-team");
    });
  });

  it("redirects verified user with multiple teams to /teams", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        session: { user: { emailVerified: true } },
        teams: [
          { id: "team-1", name: "Team A", slug: "team-a" },
          { id: "team-2", name: "Team B", slug: "team-b" },
        ],
      }),
    });

    await fillAndSubmit();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/teams");
    });
  });

  it("preserves invitationId when redirecting unverified user to /verify-email", async () => {
    mockQuery = { invitationId: "inv-123" };

    mockFetch
      .mockResolvedValueOnce({
        json: async () => ({
          session: { user: { emailVerified: false } },
          teams: [],
        }),
      })
      .mockResolvedValueOnce({ json: async () => ({ success: true }) });

    await fillAndSubmit();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        "/verify-email?email=test%40example.com&invitationId=inv-123"
      );
    });
  });

  it("shows error message when sign-in fails", async () => {
    vi.mocked(authClient.signIn.email).mockResolvedValue({ error: { message: "Invalid credentials" } } as never);

    await fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
