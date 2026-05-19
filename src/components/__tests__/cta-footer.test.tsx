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

import { CtaSection } from "../cta-section";
import { MinimalFooter } from "../minimal-footer";

afterEach(cleanup);

describe("CTA Section", () => {
  it("renders the heading text", () => {
    render(<CtaSection />);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /ready to save hours on content creation/i,
      })
    ).toBeInTheDocument();
  });

  it("renders the subtitle text", () => {
    render(<CtaSection />);
    expect(
      screen.getByText(/create your team account and start generating in minutes/i)
    ).toBeInTheDocument();
  });

  it("renders CTA button linking to /register", () => {
    render(<CtaSection />);
    const link = screen.getByRole("link", { name: /create an account/i });
    expect(link).toHaveAttribute("href", "/register");
  });

  it("CTA button has transition class", () => {
    render(<CtaSection />);
    const link = screen.getByRole("link", { name: /create an account/i });
    expect(link.className).toMatch(/transition-all/);
  });

  it("has a gradient background style", () => {
    const { container } = render(<CtaSection />);
    const section = container.querySelector("section[data-testid='cta-section']");
    expect(section?.style.background).toMatch(/gradient/);
  });

  it("contains an organic blob SVG element", () => {
    const { container } = render(<CtaSection />);
    const section = container.querySelector("[data-testid='cta-section']");
    expect(section?.querySelector("svg")).toBeInTheDocument();
  });

  it("has a wave divider SVG before the CTA section", () => {
    const { container } = render(<CtaSection />);
    const wave = container.querySelector("[data-testid='wave-divider']");
    expect(wave).toBeInTheDocument();
    expect(wave?.tagName.toLowerCase()).toBe("svg");
  });
});

describe("Minimal Footer", () => {
  it("renders Lotus wordmark", () => {
    render(<MinimalFooter />);
    expect(screen.getByText("Lotus")).toBeInTheDocument();
  });

  it("renders lotus monogram SVG", () => {
    const { container } = render(<MinimalFooter />);
    const footer = container.querySelector("footer");
    expect(footer?.querySelector("svg")).toBeInTheDocument();
  });

  it("renders Sign in link pointing to /login", () => {
    render(<MinimalFooter />);
    const link = screen.getByRole("link", { name: /sign in/i });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("renders Register link pointing to /register", () => {
    render(<MinimalFooter />);
    const link = screen.getByRole("link", { name: /register/i });
    expect(link).toHaveAttribute("href", "/register");
  });

  it("renders copyright with current year and Lotus", () => {
    render(<MinimalFooter />);
    const year = new Date().getFullYear().toString();
    const copyright = screen.getByText(new RegExp(`© ${year} Lotus`));
    expect(copyright).toBeInTheDocument();
  });

  it("has a wave divider above the footer", () => {
    const { container } = render(<MinimalFooter />);
    const wave = container.querySelector("[data-testid='wave-divider']");
    expect(wave).toBeInTheDocument();
  });

  it("footer is visually distinct from CTA (dark background)", () => {
    const { container } = render(<MinimalFooter />);
    const footer = container.querySelector("footer");
    expect(footer?.className).toMatch(/bg-foreground|bg-\[|bg-gray|bg-neutral|bg-slate/);
  });
});
