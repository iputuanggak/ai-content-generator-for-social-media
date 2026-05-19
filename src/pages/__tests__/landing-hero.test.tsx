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

import LandingPage from "../index";

afterEach(cleanup);

describe("Landing Page - Navigation", () => {
  it("renders Sign in link in nav pointing to /login", () => {
    const { container } = render(<LandingPage />);
    const nav = container.querySelector("nav");
    const signInLink = nav?.querySelector('a[href="/login"]');
    expect(signInLink).toHaveTextContent("Sign in");
  });

  it("renders Get started link in nav pointing to /register", () => {
    const { container } = render(<LandingPage />);
    const nav = container.querySelector("nav");
    const getStartedLink = nav?.querySelector('a[href="/register"]');
    expect(getStartedLink).toHaveTextContent("Get started");
  });

  it("renders Lotus wordmark in nav", () => {
    const { container } = render(<LandingPage />);
    const nav = container.querySelector("nav");
    expect(nav).toHaveTextContent("Lotus");
  });

  it("renders Lotus monogram SVG in nav", () => {
    const { container } = render(<LandingPage />);
    const nav = container.querySelector("nav");
    expect(nav?.querySelector("svg")).toBeInTheDocument();
  });

  it("nav has sticky positioning", () => {
    const { container } = render(<LandingPage />);
    const nav = container.querySelector("nav");
    expect(nav?.className).toMatch(/sticky/);
  });
});

describe("Landing Page - Hero Section", () => {
  it("renders H1 with expected text", () => {
    render(<LandingPage />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toMatch(
      /Generate social media content for every platform/
    );
  });

  it("renders Start for free CTA linking to /register", () => {
    render(<LandingPage />);
    const link = screen.getByRole("link", { name: /start for free/i });
    expect(link).toHaveAttribute("href", "/register");
  });

  it("renders illustration placeholder with product dashboard label", () => {
    render(<LandingPage />);
    expect(screen.getByText(/Product Dashboard/)).toBeInTheDocument();
  });

  it("hero section has centered text layout", () => {
    const { container } = render(<LandingPage />);
    const h1 = container.querySelector("h1");
    expect(h1?.closest("[class*='text-center']")).toBeTruthy();
  });

  it("renders an ImagePlaceholder in the hero", () => {
    render(<LandingPage />);
    expect(screen.getByText(/AI Content Generator/)).toBeInTheDocument();
  });
});

describe("Landing Page - Testimonial Section", () => {
  it("renders testimonial section with heading", () => {
    render(<LandingPage />);
    expect(
      screen.getByRole("heading", { level: 2, name: /what marketers are saying/i })
    ).toBeInTheDocument();
  });

  it("renders 3 testimonial cards", () => {
    const { container } = render(<LandingPage />);
    expect(
      container.querySelectorAll("[data-testid='testimonial-card']")
    ).toHaveLength(3);
  });

  it("testimonials appear between How It Works and CTA", () => {
    const { container } = render(<LandingPage />);
    const sections = Array.from(container.querySelectorAll("section"));
    const howItWorksIdx = sections.findIndex((s) => s.dataset.testid === "how-it-works");
    const testimonialIdx = sections.findIndex((s) => s.dataset.testid === "testimonial-section");
    const ctaIdx = sections.findIndex((s) => s.dataset.testid === "cta-section");
    expect(howItWorksIdx).toBeLessThan(testimonialIdx);
    expect(testimonialIdx).toBeLessThan(ctaIdx);
  });
});
