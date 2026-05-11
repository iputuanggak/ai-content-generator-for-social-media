// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { Sidebar } from "../layout/Sidebar";

afterEach(cleanup);

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signOut: vi.fn().mockResolvedValue(undefined),
    organization: {
      setActive: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

vi.mock("next/router", () => ({
  useRouter: () => ({
    pathname: "/dashboard",
    push: vi.fn(),
  }),
}));

describe("Sidebar", () => {
  const defaultProps = {
    userName: "Test User",
    teamName: "Test Team",
    teamId: "team-1",
    teams: [{ id: "team-1", name: "Test Team" }],
  };

  it("renders a Button with ghost variant for log out", () => {
    render(<Sidebar {...defaultProps} />);

    const logoutBtn = screen.getByRole("button", { name: /log out/i });
    expect(logoutBtn).toBeInTheDocument();
    expect(logoutBtn).toHaveAttribute("data-variant", "ghost");
  });

  it("renders the user name", () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByText("Test User")).toBeInTheDocument();
  });

  it("calls handleLogout when log out button is clicked", async () => {
    const user = userEvent.setup();
    const { authClient } = await import("@/lib/auth-client");

    render(<Sidebar {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /log out/i }));
    expect(authClient.signOut).toHaveBeenCalledOnce();
  });
});
