// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, renderHook } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const mockPush = vi.fn();

vi.mock("next/router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

let mockUseSessionReturn: {
  data: { user?: { emailVerified: boolean } } | null;
  isPending: boolean;
} = { data: null, isPending: true };

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => mockUseSessionReturn,
  },
}));

import { useRequireVerifiedEmail } from "../use-require-verified-email";

function TestComponent() {
  const { loading } = useRequireVerifiedEmail();

  if (loading) return null;

  return <div data-testid="protected-content">Protected Page</div>;
}

afterEach(() => {
  cleanup();
  mockPush.mockClear();
  mockUseSessionReturn = { data: null, isPending: true };
});

describe("useRequireVerifiedEmail", () => {
  it("returns loading:true while session is pending", () => {
    mockUseSessionReturn = { data: null, isPending: true };

    const { result } = renderHookResult();
    expect(result.current.loading).toBe(true);
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("returns loading:false when email is verified", async () => {
    mockUseSessionReturn = {
      data: { user: { emailVerified: true } },
      isPending: false,
    };

    const { result } = renderHookResult();
    expect(result.current.loading).toBe(false);
  });

  it("redirects to /verify-email when email is not verified", async () => {
    mockUseSessionReturn = {
      data: { user: { emailVerified: false } },
      isPending: false,
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/verify-email");
    });
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("does not redirect when email is verified", async () => {
    mockUseSessionReturn = {
      data: { user: { emailVerified: true } },
      isPending: false,
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("renders protected content after verification passes", async () => {
    mockUseSessionReturn = {
      data: { user: { emailVerified: true } },
      isPending: false,
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });
  });
});

function renderHookResult() {
  return renderHook(() => useRequireVerifiedEmail());
}
