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
    expect(circles[0].textContent).toBe("1");
    expect(circles[1].textContent).toBe("2");
    expect(circles[2].textContent).toBe("3");
  });

  it("renders a connecting SVG line", () => {
    const { container } = render(<HowItWorksStepper />);
    const svg = container.querySelector("[data-testid='connecting-line']");
    expect(svg).toBeInTheDocument();
  });

  it("steps are horizontal on desktop (grid-cols-3)", () => {
    const { container } = render(<HowItWorksStepper />);
    const grid = container.querySelector("[data-testid='steps-grid']");
    expect(grid).toBeInTheDocument();
    expect(grid?.className).toMatch(/lg:grid-cols-3/);
  });

  it("steps stack vertically on mobile (grid-cols-1)", () => {
    const { container } = render(<HowItWorksStepper />);
    const grid = container.querySelector("[data-testid='steps-grid']");
    expect(grid?.className).toMatch(/grid-cols-1/);
  });
});
