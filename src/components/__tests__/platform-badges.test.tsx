// @vitest-environment jsdom

import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  value: MockIntersectionObserver,
});

const { motionMock } = vi.hoisted(() => {
  const motionProxy = new Proxy(
    {},
    {
      get(_target: unknown, prop: string) {
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
            whileFocus: _wf,
            layout: _l,
            layoutId: _lid,
            ...rest
          } = props;
          const El = prop as keyof JSX.IntrinsicElements;
          return React.createElement(El, rest);
        };
      },
    }
  );
  return {
    motionMock: {
      motion: motionProxy,
      AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
      useInView: () => false,
    },
  };
});

vi.mock("framer-motion", () => motionMock);
vi.mock("motion/react", () => motionMock);

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
