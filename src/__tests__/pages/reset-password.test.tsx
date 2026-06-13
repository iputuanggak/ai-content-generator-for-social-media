// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import type { ReactNode } from "react";

const mockPush = vi.fn();

vi.mock("next/router", () => ({
  useRouter: () => ({
    query: { token: "valid-token-123" },
    push: mockPush,
  }),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    resetPassword: vi.fn(),
  },
}));

import ResetPasswordPage from "../../pages/reset-password";
import { authClient } from "@/lib/auth-client";

const mockResetPassword = vi.mocked(authClient.resetPassword);

function wrap(children: ReactNode) {
  return <>{children}</>;
}

describe("Reset Password page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it("renders new password and confirm password fields", () => {
    render(wrap(<ResetPasswordPage />));

    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset password/i })).toBeInTheDocument();
  });

  it("has show/hide toggles on both password fields", () => {
    render(wrap(<ResetPasswordPage />));

    const toggleButtons = screen.getAllByRole("button", { name: /show password/i });
    expect(toggleButtons).toHaveLength(2);
  });

  it("shows error when password is under 8 characters", async () => {
    const user = userEvent.setup();
    render(wrap(<ResetPasswordPage />));

    await user.type(screen.getByLabelText(/new password/i), "short");
    await user.type(screen.getByLabelText(/confirm password/i), "short");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it("shows error when passwords do not match", async () => {
    const user = userEvent.setup();
    render(wrap(<ResetPasswordPage />));

    await user.type(screen.getByLabelText(/new password/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "different123");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it("calls resetPassword with newPassword and token on valid submission", async () => {
    mockResetPassword.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(wrap(<ResetPasswordPage />));

    await user.type(screen.getByLabelText(/new password/i), "newpassword123");
    await user.type(screen.getByLabelText(/confirm password/i), "newpassword123");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith({
        newPassword: "newpassword123",
        token: "valid-token-123",
      });
    });
  });

  it("redirects to /login?reset=success on successful reset", async () => {
    mockResetPassword.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(wrap(<ResetPasswordPage />));

    await user.type(screen.getByLabelText(/new password/i), "newpassword123");
    await user.type(screen.getByLabelText(/confirm password/i), "newpassword123");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login?reset=success");
    });
  });

  it("shows error with link to /forgot-password when token is invalid", async () => {
    mockResetPassword.mockResolvedValue({
      error: { message: "Invalid token" },
    });
    const user = userEvent.setup();
    render(wrap(<ResetPasswordPage />));

    await user.type(screen.getByLabelText(/new password/i), "newpassword123");
    await user.type(screen.getByLabelText(/confirm password/i), "newpassword123");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByText(/invalid or has expired/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /request a new reset link/i })).toHaveAttribute("href", "/forgot-password");
  });

  it("toggles new password visibility", async () => {
    const user = userEvent.setup();
    render(wrap(<ResetPasswordPage />));

    const input = screen.getByLabelText(/new password/i) as HTMLInputElement;
    expect(input.type).toBe("password");

    const toggleButtons = screen.getAllByRole("button", { name: /show password/i });
    await user.click(toggleButtons[0]);

    expect(input.type).toBe("text");
  });

  it("toggles confirm password visibility", async () => {
    const user = userEvent.setup();
    render(wrap(<ResetPasswordPage />));

    const input = screen.getByLabelText(/confirm password/i) as HTMLInputElement;
    expect(input.type).toBe("password");

    const toggleButtons = screen.getAllByRole("button", { name: /show password/i });
    await user.click(toggleButtons[1]);

    expect(input.type).toBe("text");
  });
});
