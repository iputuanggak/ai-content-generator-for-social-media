// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import type { ReactNode } from "react";

const mockPush = vi.fn();

vi.mock("next/router", () => ({
  useRouter: () => ({
    query: {},
    push: mockPush,
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    removeQueries: vi.fn(),
  }),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signUp: {
      email: vi.fn(),
    },
  },
}));

vi.mock("@/lib/disposable-email", () => ({
  isDisposableEmail: () => false,
}));

import RegisterPage from "../../pages/register";
import { authClient } from "@/lib/auth-client";

const mockSignUpEmail = vi.mocked(authClient.signUp.email);

function wrap(children: ReactNode) {
  return <>{children}</>;
}

describe("Register page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  afterEach(cleanup);

  it("renders confirm password field below password field", () => {
    render(wrap(<RegisterPage />));

    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it("confirm password field has a show/hide toggle", () => {
    render(wrap(<RegisterPage />));

    const toggleButtons = screen.getAllByRole("button", { name: /show password|hide password/i });
    expect(toggleButtons.length).toBeGreaterThanOrEqual(2);
  });

  it("shows error when passwords do not match and blocks submission", async () => {
    const user = userEvent.setup();
    render(wrap(<RegisterPage />));

    await user.type(screen.getByLabelText(/name/i), "Test User");
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "different123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(mockSignUpEmail).not.toHaveBeenCalled();
  });

  it("allows submission when passwords match", async () => {
    mockSignUpEmail.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(wrap(<RegisterPage />));

    await user.type(screen.getByLabelText(/name/i), "Test User");
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockSignUpEmail).toHaveBeenCalledWith({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("toggles confirm password visibility", async () => {
    const user = userEvent.setup();
    render(wrap(<RegisterPage />));

    const input = screen.getByLabelText(/confirm password/i) as HTMLInputElement;
    expect(input.type).toBe("password");

    const toggleButtons = screen.getAllByRole("button", { name: /show password/i });
    await user.click(toggleButtons[1]);

    expect(input.type).toBe("text");
  });
});
