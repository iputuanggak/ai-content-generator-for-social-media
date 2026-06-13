// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("next/router", () => ({
  useRouter: () => ({
    query: {},
    push: vi.fn(),
  }),
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

describe("Login page forgot-password link", () => {
  afterEach(cleanup);

  it('renders a "Forgot password?" link pointing to /forgot-password', () => {
    render(wrap(<LoginPage />));

    const link = screen.getByRole("link", { name: /forgot password/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/forgot-password");
  });
});
