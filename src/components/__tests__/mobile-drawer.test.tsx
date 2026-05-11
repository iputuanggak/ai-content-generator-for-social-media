// @vitest-environment jsdom

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MobileDrawer } from "../layout/MobileDrawer";

afterEach(cleanup);

describe("MobileDrawer", () => {
  const defaultProps = {
    userName: "Test User",
    teamName: "Test Team",
    teamId: "team-1",
    teams: [{ id: "team-1", name: "Test Team" }],
  };

  it("renders a Button with ghost variant as the hamburger trigger", () => {
    render(<MobileDrawer {...defaultProps} />);

    const trigger = screen.getByRole("button", { name: /open navigation/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("data-variant", "ghost");
  });

  it("renders the app title", () => {
    render(<MobileDrawer {...defaultProps} />);

    expect(screen.getByText("ContentGen")).toBeInTheDocument();
  });
});
