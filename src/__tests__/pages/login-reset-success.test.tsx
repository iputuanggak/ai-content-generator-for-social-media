// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const mockRouter = {
  query: {} as Record<string, string>,
  push: vi.fn(),
};

vi.mock("next/router", () => ({
  useRouter: () => mockRouter,
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: { email: vi.fn() },
  },
}));

import LoginPage from "../../pages/login";

function wrap(children: ReactNode) {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("Login page reset-success banner", () => {
  afterEach(() => {
    cleanup();
    mockRouter.query = {};
  });

  it("shows green success banner when reset=success query param is present", () => {
    mockRouter.query = { reset: "success" };
    render(wrap(<LoginPage />));

    expect(screen.getByText(/your password has been reset/i)).toBeInTheDocument();
  });

  it("banner reads the expected message", () => {
    mockRouter.query = { reset: "success" };
    render(wrap(<LoginPage />));

    expect(screen.getByText(/your password has been reset\. please sign in with your new password\./i)).toBeInTheDocument();
  });

  it("does NOT show the banner when reset=success is absent", () => {
    mockRouter.query = {};
    render(wrap(<LoginPage />));

    expect(screen.queryByText(/your password has been reset/i)).not.toBeInTheDocument();
  });

  it("does NOT show the banner when reset has a different value", () => {
    mockRouter.query = { reset: "other" };
    render(wrap(<LoginPage />));

    expect(screen.queryByText(/your password has been reset/i)).not.toBeInTheDocument();
  });
});
