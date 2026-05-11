// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { DatePicker } from "../date-picker";

describe("DatePicker", () => {
  afterEach(cleanup);

  it("renders trigger button with placeholder when no value", () => {
    render(
      <DatePicker value={undefined} onChange={() => {}} placeholder="Pick a date" />
    );

    expect(screen.getByRole("button", { name: /pick a date/i })).toBeInTheDocument();
  });

  it("renders trigger button with formatted date when value is provided", () => {
    const date = new Date(2025, 5, 15);
    render(
      <DatePicker value={date} onChange={() => {}} placeholder="Pick a date" />
    );

    expect(screen.getByRole("button")).toHaveTextContent("Jun 15, 2025");
  });

  it("opens calendar popover when trigger is clicked", async () => {
    const user = userEvent.setup();
    render(
      <DatePicker value={undefined} onChange={() => {}} placeholder="Pick a date" />
    );

    await user.click(screen.getByRole("button", { name: /pick a date/i }));

    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  it("calls onChange with selected date when a day is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DatePicker value={new Date(2025, 5, 1)} onChange={onChange} placeholder="Pick a date" />
    );

    await user.click(screen.getByRole("button"));
    const grid = screen.getByRole("grid");
    const fifteenthButton = within(grid).getAllByRole("button").find(
      (btn) => btn.textContent === "15"
    );
    if (fifteenthButton) {
      await user.click(fifteenthButton);
    }

    expect(onChange).toHaveBeenCalledOnce();
    const calledDate = onChange.mock.calls[0][0] as Date;
    expect(calledDate.getDate()).toBe(15);
  });

  it("closes popover after selecting a date", async () => {
    const user = userEvent.setup();
    render(
      <DatePicker value={new Date(2025, 5, 1)} onChange={() => {}} placeholder="Pick a date" />
    );

    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("grid")).toBeInTheDocument();

    const grid = screen.getByRole("grid");
    const fifteenthButton = within(grid).getAllByRole("button").find(
      (btn) => btn.textContent === "15"
    );
    if (fifteenthButton) {
      await user.click(fifteenthButton);
    }

    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });
});
