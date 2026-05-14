// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: { email: vi.fn().mockResolvedValue({ error: null }) },
    signUp: { email: vi.fn().mockResolvedValue({ error: null }) },
    getSession: vi.fn().mockResolvedValue({ data: { user: { id: "1" } } }),
    organization: {
      create: vi.fn().mockResolvedValue({ error: null }),
      acceptInvitation: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

vi.mock("next/router", () => ({
  useRouter: () => ({
    query: { invitationId: "inv-123" },
    push: vi.fn(),
  }),
}));

import LoginPage from "../login";
import RegisterPage from "../register";
import OnboardingPage from "../onboarding";
import AcceptInvitationPage from "../accept-invitation";

const queryClient = new QueryClient();

function wrap(children: ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function getShadcnButtons(container: HTMLElement) {
  return container.querySelectorAll('[data-slot="button"]');
}

describe("LoginPage buttons", () => {
  afterEach(cleanup);

  it("uses shadcn Button for submit", () => {
    const { container } = render(wrap(<LoginPage />));
    const buttons = getShadcnButtons(container);
    expect(buttons.length).toBeGreaterThanOrEqual(1);
    const submitBtn = screen.getByRole("button", { name: /sign in/i });
    expect(submitBtn).toHaveAttribute("data-slot", "button");
    expect(submitBtn).toHaveAttribute("data-variant", "default");
  });

  it("uses shadcn Button for password toggle with ghost variant", () => {
    render(wrap(<LoginPage />));
    const toggleBtn = screen.getByLabelText("Show password");
    expect(toggleBtn).toHaveAttribute("data-slot", "button");
    expect(toggleBtn).toHaveAttribute("data-variant", "ghost");
  });

  it("password toggle changes aria-label when clicked", async () => {
    const user = userEvent.setup();
    render(wrap(<LoginPage />));
    const toggleBtn = screen.getByLabelText("Show password");
    await user.click(toggleBtn);
    expect(screen.getByLabelText("Hide password")).toBeInTheDocument();
  });
});

describe("RegisterPage buttons", () => {
  afterEach(cleanup);

  it("uses shadcn Button for submit", () => {
    const { container } = render(wrap(<RegisterPage />));
    const buttons = getShadcnButtons(container);
    expect(buttons.length).toBeGreaterThanOrEqual(1);
    const submitBtn = screen.getByRole("button", { name: /create account/i });
    expect(submitBtn).toHaveAttribute("data-slot", "button");
    expect(submitBtn).toHaveAttribute("data-variant", "default");
  });

  it("uses shadcn Button for password toggle with ghost variant", () => {
    render(wrap(<RegisterPage />));
    const toggleBtn = screen.getByLabelText("Show password");
    expect(toggleBtn).toHaveAttribute("data-slot", "button");
    expect(toggleBtn).toHaveAttribute("data-variant", "ghost");
  });
});

describe("OnboardingPage buttons", () => {
  afterEach(cleanup);

  it("uses shadcn Button for submit", () => {
    render(<OnboardingPage />);
    const submitBtn = screen.getByRole("button", { name: /create team/i });
    expect(submitBtn).toHaveAttribute("data-slot", "button");
    expect(submitBtn).toHaveAttribute("data-variant", "default");
  });
});

describe("AcceptInvitationPage buttons", () => {
  afterEach(cleanup);

  it("uses shadcn Button for accept invitation", async () => {
    render(<AcceptInvitationPage />);
    const acceptBtn = await screen.findByRole("button", { name: /accept invitation/i });
    expect(acceptBtn).toHaveAttribute("data-slot", "button");
    expect(acceptBtn).toHaveAttribute("data-variant", "default");
  });
});
