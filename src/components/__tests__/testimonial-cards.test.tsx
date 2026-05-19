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

import { TestimonialCards } from "../testimonial-cards";

afterEach(cleanup);

describe("TestimonialCards", () => {
  it("renders section heading", () => {
    render(<TestimonialCards />);
    expect(
      screen.getByRole("heading", { level: 2, name: /what marketers are saying/i })
    ).toBeInTheDocument();
  });

  it("renders 3 testimonial cards", () => {
    const { container } = render(<TestimonialCards />);
    expect(container.querySelectorAll("[data-testid='testimonial-card']")).toHaveLength(3);
  });

  it("renders Sarah Chen testimonial", () => {
    render(<TestimonialCards />);
    expect(screen.getAllByText(/Sarah Chen/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Marketing Lead at Bloom Studio/)).toBeInTheDocument();
    expect(screen.getByText(/Content used to take our team an entire afternoon/)).toBeInTheDocument();
  });

  it("renders Marcus Rivera testimonial", () => {
    render(<TestimonialCards />);
    expect(screen.getAllByText(/Marcus Rivera/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Social Media Manager at Pulse Digital/)).toBeInTheDocument();
    expect(screen.getByText(/I manage 6 client accounts/)).toBeInTheDocument();
  });

  it("renders Priya Patel testimonial", () => {
    render(<TestimonialCards />);
    expect(screen.getAllByText(/Priya Patel/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Content Strategist at Novara/)).toBeInTheDocument();
    expect(screen.getByText(/Finally a tool that understands/)).toBeInTheDocument();
  });

  it("has decorative quotation marks on each card", () => {
    const { container } = render(<TestimonialCards />);
    const quotes = container.querySelectorAll("[data-testid='decorative-quote']");
    expect(quotes).toHaveLength(3);
  });

  it("uses responsive grid (stacks on mobile)", () => {
    const { container } = render(<TestimonialCards />);
    const grid = container.querySelector("[data-testid='testimonial-grid']");
    expect(grid?.className).toMatch(/grid/);
    expect(grid?.className).toMatch(/md:grid-cols-3/);
  });

  it("cards have rounded corners", () => {
    const { container } = render(<TestimonialCards />);
    const cards = container.querySelectorAll("[data-testid='testimonial-card']");
    cards.forEach((card) => {
      expect((card as HTMLElement).className).toMatch(/rounded/);
    });
  });

  it("cards have shadows", () => {
    const { container } = render(<TestimonialCards />);
    const cards = container.querySelectorAll("[data-testid='testimonial-card']");
    cards.forEach((card) => {
      expect((card as HTMLElement).className).toMatch(/shadow/);
    });
  });
});
