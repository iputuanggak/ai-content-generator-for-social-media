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
    expect(screen.getByText(/Sarah Chen/)).toBeInTheDocument();
    expect(screen.getByText(/Marketing Lead at Bloom Studio/)).toBeInTheDocument();
    expect(screen.getByText(/Content used to take our team an entire afternoon/)).toBeInTheDocument();
  });

  it("renders Marcus Rivera testimonial", () => {
    render(<TestimonialCards />);
    expect(screen.getByText(/Marcus Rivera/)).toBeInTheDocument();
    expect(screen.getByText(/Social Media Manager at Pulse Digital/)).toBeInTheDocument();
    expect(screen.getByText(/I manage 6 client accounts/)).toBeInTheDocument();
  });

  it("renders Priya Patel testimonial", () => {
    render(<TestimonialCards />);
    expect(screen.getByText(/Priya Patel/)).toBeInTheDocument();
    expect(screen.getByText(/Content Strategist at Novara/)).toBeInTheDocument();
    expect(screen.getByText(/Finally a tool that understands/)).toBeInTheDocument();
  });

  it("has decorative quotation marks on each card", () => {
    const { container } = render(<TestimonialCards />);
    const quotes = container.querySelectorAll("[data-testid='decorative-quote']");
    expect(quotes).toHaveLength(3);
  });

  it("has alternating rotation on cards", () => {
    const { container } = render(<TestimonialCards />);
    const cards = container.querySelectorAll("[data-testid='testimonial-card']");
    expect((cards[0] as HTMLElement).style.transform).toContain("-1");
    expect((cards[1] as HTMLElement).style.transform).toContain("0");
    expect((cards[2] as HTMLElement).style.transform).toContain("1");
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
