// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const mockPush = vi.fn();
const mockRefetchSession = vi.fn().mockResolvedValue(undefined);

vi.mock("next/router", () => ({
  useRouter: () => ({
    push: mockPush,
    query: { email: "test@example.com", invitationId: "inv-123" },
  }),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({
      data: { user: { email: "test@example.com", emailVerified: false } },
      refetch: mockRefetchSession,
    }),
    signOut: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/lib/smart-redirect", () => ({
  getSmartRedirectLogic: () => "/teams",
}));

import VerifyEmailPage from "../verify-email";

function wrap(children: ReactNode) {
  return (
    <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
  );
}

describe("VerifyEmailPage session cache", () => {
  afterEach(() => {
    cleanup();
    mockPush.mockClear();
    mockRefetchSession.mockClear();
    vi.restoreAllMocks();
  });

  it("refetches Better Auth session after successful OTP verification", async () => {
    const user = userEvent.setup();

    vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.includes("/api/auth/verify-otp")) {
        return Promise.resolve(
          new Response(JSON.stringify({ success: true }), { status: 200 })
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ teams: [] }), { status: 200 })
      );
    });

    render(wrap(<VerifyEmailPage />));

    const input = screen.getByPlaceholderText("000000");
    await user.type(input, "123456");

    const submitBtn = screen.getByRole("button", { name: /verify/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockRefetchSession).toHaveBeenCalled();
    });
  });

  it("redirects to accept-invitation with invitationId after successful verification", async () => {
    const user = userEvent.setup();

    vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.includes("/api/auth/verify-otp")) {
        return Promise.resolve(
          new Response(JSON.stringify({ success: true }), { status: 200 })
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ teams: [] }), { status: 200 })
      );
    });

    render(wrap(<VerifyEmailPage />));

    const input = screen.getByPlaceholderText("000000");
    await user.type(input, "123456");

    const submitBtn = screen.getByRole("button", { name: /verify/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        "/accept-invitation?invitationId=inv-123"
      );
    });
  });
});
