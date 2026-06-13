// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import type { ReactNode } from "react";

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    requestPasswordReset: vi.fn(),
  },
}));

import ForgotPasswordPage from "../../pages/forgot-password";
import { authClient } from "@/lib/auth-client";

const mockRequestPasswordReset = vi.mocked(authClient.requestPasswordReset);

function wrap(children: ReactNode) {
  return <>{children}</>;
}

describe("Forgot Password page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it("renders the email input form", () => {
    render(wrap(<ForgotPasswordPage />));

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
  });

  it("calls requestPasswordReset with email and redirectTo on submit", async () => {
    mockRequestPasswordReset.mockResolvedValue({ error: null });
    const user = userEvent.setup();

    render(wrap(<ForgotPasswordPage />));
    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(mockRequestPasswordReset).toHaveBeenCalledWith({
        email: "user@example.com",
        redirectTo: expect.stringContaining("/reset-password"),
      });
    });
  });

  it('shows "Check your email" confirmation after successful submission', async () => {
    mockRequestPasswordReset.mockResolvedValue({ error: null });
    const user = userEvent.setup();

    render(wrap(<ForgotPasswordPage />));
    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/user@example.com/)).toBeInTheDocument();
  });

  it("shows confirmation even when email does not exist (prevents enumeration)", async () => {
    mockRequestPasswordReset.mockResolvedValue({ error: null });
    const user = userEvent.setup();

    render(wrap(<ForgotPasswordPage />));
    await user.type(screen.getByLabelText(/email/i), "nonexistent@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
  });

  it("shows error message when requestPasswordReset returns an error", async () => {
    mockRequestPasswordReset.mockResolvedValue({
      error: { message: "Internal server error" },
    });
    const user = userEvent.setup();

    render(wrap(<ForgotPasswordPage />));
    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/something went wrong/i);
    expect(screen.queryByText(/check your email/i)).not.toBeInTheDocument();
  });

  it('renders a "Back to sign in" link pointing to /login', () => {
    render(wrap(<ForgotPasswordPage />));

    const links = screen.getAllByRole("link", { name: /back to sign in/i });
    expect(links[0]).toHaveAttribute("href", "/login");
  });
});
