// @vitest-environment jsdom

import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get(_target, prop: string) {
        return (props: Record<string, unknown>) => {
          const {
            initial: _i,
            animate: _a,
            exit: _e,
            transition: _t,
            variants: _v,
            whileHover: _wh,
            whileTap: _wt,
            whileInView: _wiv,
            ...rest
          } = props;
          const El = prop as keyof JSX.IntrinsicElements;
          return React.createElement(El, rest);
        };
      },
    }
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) =>
    children,
}));

import { PlatformBadges } from "../platform-badges";

afterEach(cleanup);

const platformNames = [
  "Twitter / X",
  "LinkedIn",
  "Instagram",
  "Facebook",
  "TikTok",
  "YouTube",
  "Threads",
  "Pinterest",
];

describe("PlatformBadges", () => {
  it("renders all 8 platform names", () => {
    render(<PlatformBadges />);
    platformNames.forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  it("renders an SVG icon inside each badge", () => {
    const { container } = render(<PlatformBadges />);
    const badges = container.querySelectorAll("[data-testid='platform-badge']");
    expect(badges.length).toBe(8);
    badges.forEach((badge) => {
      expect(badge.querySelector("svg")).toBeInTheDocument();
    });
  });

  it("renders badges with rounded-full shape", () => {
    const { container } = render(<PlatformBadges />);
    const badges = container.querySelectorAll("[data-testid='platform-badge']");
    badges.forEach((badge) => {
      expect(badge.className).toMatch(/rounded-full/);
    });
  });

  it("renders section heading", () => {
    render(<PlatformBadges />);
    expect(
      screen.getByText("8 platforms supported")
    ).toBeInTheDocument();
  });
});
