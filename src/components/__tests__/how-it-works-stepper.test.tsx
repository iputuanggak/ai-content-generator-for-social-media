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

import { HowItWorksStepper } from "../how-it-works-stepper";

afterEach(cleanup);

const steps = [
  { number: 1, heading: "Write your prompt" },
  { number: 2, heading: "AI adapts to each platform" },
  { number: 3, heading: "Copy and schedule" },
];

describe("HowItWorksStepper", () => {
  it("renders the section heading", () => {
    render(<HowItWorksStepper />);
    expect(screen.getByText("How it works")).toBeInTheDocument();
  });

  it("renders all 3 step headings", () => {
    render(<HowItWorksStepper />);
    steps.forEach((s) => {
      expect(screen.getByText(s.heading)).toBeInTheDocument();
    });
  });

  it("renders all 3 step descriptions", () => {
    render(<HowItWorksStepper />);
    expect(screen.getByText(/Describe your topic and choose a tone/)).toBeInTheDocument();
    expect(screen.getByText(/reshaped for every platform/)).toBeInTheDocument();
    expect(screen.getByText(/Review each output/)).toBeInTheDocument();
  });

  it("renders numbered circles for each step", () => {
    const { container } = render(<HowItWorksStepper />);
    const circles = container.querySelectorAll("[data-testid^='step-circle-']");
    expect(circles.length).toBe(3);
    expect(circles[0].textContent).toBe("01");
    expect(circles[1].textContent).toBe("02");
    expect(circles[2].textContent).toBe("03");
  });

  it("renders vine connector SVGs between steps", () => {
    const { container } = render(<HowItWorksStepper />);
    const vineSvgs = container.querySelectorAll("svg path");
    expect(vineSvgs.length).toBeGreaterThan(0);
  });

  it("steps use two-column layout on desktop (lg:grid-cols-2)", () => {
    const { container } = render(<HowItWorksStepper />);
    const grids = container.querySelectorAll("[class*='lg:grid-cols-2']");
    expect(grids.length).toBeGreaterThan(0);
  });

  it("steps stack vertically on mobile (grid-cols-1)", () => {
    const { container } = render(<HowItWorksStepper />);
    const grid = container.querySelector("[data-testid='steps-grid']");
    expect(grid?.className).toMatch(/flex/);
  });
});
