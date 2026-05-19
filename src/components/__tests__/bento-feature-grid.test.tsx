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

  it("multi-platform card spans 2 columns on md", () => {
    const { container } = render(<BentoFeatureGrid />);
    const articles = container.querySelectorAll("article");
    const multiCard = Array.from(articles).find((a) =>
      a.textContent?.includes("Multi-Platform Generation")
    );
    expect(multiCard).toBeInTheDocument();
    expect(multiCard?.className).toMatch(/md:col-span-2/);
  });

  it("each feature card has SVG elements", () => {
    const { container } = render(<BentoFeatureGrid />);
    const articles = container.querySelectorAll("article");
    expect(articles.length).toBe(4);
    articles.forEach((card) => {
      expect(card.querySelector("svg")).toBeInTheDocument();
    });
  });

  it("grid is responsive with single column on mobile", () => {
    const { container } = render(<BentoFeatureGrid />);
    const grid = container.querySelector("[class*='grid-cols-1'][class*='md:grid-cols-2'][class*='lg:grid-cols-3']");
    expect(grid).toBeInTheDocument();
    expect(grid?.className).toMatch(/grid-cols-1/);
    expect(grid?.className).toMatch(/md:grid-cols-2/);
  });
});
