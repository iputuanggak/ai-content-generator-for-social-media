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

import { BentoFeatureGrid } from "../bento-feature-grid";

afterEach(cleanup);

const features = [
  { title: "Multi-Platform Generation", description: /Generate adapted content for all 8 social media platforms/ },
  { title: "Brand Settings", description: /Configure your team's brand voice/ },
  { title: "Team Collaboration", description: /Invite team members to a shared workspace/ },
  { title: "Generation History", description: /Every generation is saved with its inputs/ },
];

describe("BentoFeatureGrid", () => {
  it("renders all 4 feature titles", () => {
    render(<BentoFeatureGrid />);
    features.forEach((f) => {
      expect(screen.getByText(f.title)).toBeInTheDocument();
    });
  });

  it("renders all 4 feature descriptions", () => {
    render(<BentoFeatureGrid />);
    features.forEach((f) => {
      expect(screen.getByText(f.description)).toBeInTheDocument();
    });
  });

  it("renders section heading", () => {
    render(<BentoFeatureGrid />);
    expect(
      screen.getByText("Everything your marketing team needs")
    ).toBeInTheDocument();
  });

  it("multi-platform card spans 2 columns", () => {
    const { container } = render(<BentoFeatureGrid />);
    const multiCard = container.querySelector("[data-testid='feature-multi-platform']");
    expect(multiCard).toBeInTheDocument();
    expect(multiCard?.className).toMatch(/sm:col-span-2/);
  });

  it("each feature card has an SVG icon", () => {
    const { container } = render(<BentoFeatureGrid />);
    const cards = container.querySelectorAll("[data-testid^='feature-']");
    expect(cards.length).toBe(4);
    cards.forEach((card) => {
      expect(card.querySelector("svg")).toBeInTheDocument();
    });
  });

  it("grid is responsive with single column on mobile", () => {
    const { container } = render(<BentoFeatureGrid />);
    const grid = container.querySelector("[data-testid='bento-grid']");
    expect(grid).toBeInTheDocument();
    expect(grid?.className).toMatch(/grid-cols-1/);
    expect(grid?.className).toMatch(/sm:grid-cols-2/);
  });
});
