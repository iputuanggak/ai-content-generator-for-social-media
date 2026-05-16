// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    getSession: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
    organization: {
      acceptInvitation: vi.fn(),
    },
  },
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));

const mockPush = vi.fn();
vi.mock("next/router", () => ({
  useRouter: () => ({ push: mockPush, query: { invitationId: "inv-1" } }),
}));

let mockHookLoading = false;

vi.mock("@/lib/use-require-verified-email", () => ({
  useRequireVerifiedEmail: () => ({ loading: mockHookLoading }),
}));

import AcceptInvitationPage from "../accept-invitation";

describe("AcceptInvitationPage email verification redirect", () => {
  afterEach(() => {
    cleanup();
    mockPush.mockClear();
    mockHookLoading = false;
  });

  it("renders nothing when useRequireVerifiedEmail returns loading", () => {
    mockHookLoading = true;

    const { container } = render(<AcceptInvitationPage />);
    expect(container.innerHTML).toBe("");
  });

  it("renders content when useRequireVerifiedEmail returns not loading", async () => {
    mockHookLoading = false;

    render(<AcceptInvitationPage />);
    expect((await screen.findAllByText("Accept Invitation")).length).toBeGreaterThan(0);
  });
});
