// @vitest-environment jsdom

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ContentSkeleton } from "../content-skeleton";

describe("ContentSkeleton", () => {
  it("renders skeleton elements", () => {
    const { container } = render(<ContentSkeleton />);
    const skeletons = container.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders the specified number of lines", () => {
    const { container } = render(<ContentSkeleton lines={5} />);
    const skeletons = container.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons).toHaveLength(5);
  });

  it("defaults to 3 lines", () => {
    const { container } = render(<ContentSkeleton />);
    const skeletons = container.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons).toHaveLength(3);
  });
});
