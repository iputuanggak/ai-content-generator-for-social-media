// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    organization: {
      create: vi.fn(),
      setActive: vi.fn(),
    },
  },
}));

vi.mock("@/lib/slug", () => ({
  generateSlug: (s: string) => s.toLowerCase().replace(/\s+/g, "-"),
  sanitizeSlug: (s: string) => s,
}));

vi.mock("@/components/form-field", () => ({
  FormField: ({ label }: { label: string }) => <label>{label}</label>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));

const mockPush = vi.fn();
vi.mock("next/router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

let mockHookLoading = false;

vi.mock("@/lib/use-require-verified-email", () => ({
  useRequireVerifiedEmail: () => ({ loading: mockHookLoading }),
}));

import OnboardingPage from "../onboarding";

describe("OnboardingPage email verification redirect", () => {
  afterEach(() => {
    cleanup();
    mockPush.mockClear();
    mockHookLoading = false;
  });

  it("renders nothing when useRequireVerifiedEmail returns loading", () => {
    mockHookLoading = true;

    const { container } = render(<OnboardingPage />);
    expect(container.innerHTML).toBe("");
  });

  it("renders content when useRequireVerifiedEmail returns not loading", () => {
    mockHookLoading = false;

    render(<OnboardingPage />);
    expect(screen.getByText("Create your Team")).toBeInTheDocument();
  });
});
