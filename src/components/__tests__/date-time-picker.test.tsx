// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { DateTimePicker } from "../date-time-picker";

describe("DateTimePicker", () => {
  afterEach(cleanup);

  it("renders trigger button with placeholder when no value", () => {
    render(
      <DateTimePicker value={undefined} onChange={() => {}} placeholder="Pick date & time" />
    );

    expect(screen.getByRole("button", { name: /pick date & time/i })).toBeInTheDocument();
  });

  it("renders trigger button with formatted date and time when value is provided", () => {
    const date = new Date(2025, 5, 15, 14, 30);
    render(
      <DateTimePicker value={date} onChange={() => {}} placeholder="Pick date & time" />
    );

    expect(screen.getByRole("button")).toHaveTextContent("Jun 15, 2025");
    expect(screen.getByRole("button")).toHaveTextContent("14:30");
  });

  it("renders a time input alongside the calendar", async () => {
    const user = userEvent.setup();
    render(
      <DateTimePicker value={new Date(2025, 5, 15, 10, 0)} onChange={() => {}} placeholder="Pick" />
    );

    await user.click(screen.getByRole("button"));

    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.getByLabelText(/time/i)).toBeInTheDocument();
  });

  it("calls onChange with updated time when time input changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DateTimePicker value={new Date(2025, 5, 15, 10, 0)} onChange={onChange} placeholder="Pick" />
    );

    await user.click(screen.getByRole("button"));
    const timeInput = screen.getByLabelText(/time/i);
    fireEvent.change(timeInput, { target: { value: "14:30" } });

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as Date;
    expect(lastCall.getHours()).toBe(14);
    expect(lastCall.getMinutes()).toBe(30);
  });

  it("calls onChange with selected date preserving time when a day is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DateTimePicker value={new Date(2025, 5, 1, 14, 30)} onChange={onChange} placeholder="Pick" />
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
    expect(calledDate.getHours()).toBe(14);
    expect(calledDate.getMinutes()).toBe(30);
  });

  it("does not close popover after selecting a date (user may adjust time)", async () => {
    const user = userEvent.setup();
    render(
      <DateTimePicker value={new Date(2025, 5, 1, 14, 30)} onChange={() => {}} placeholder="Pick" />
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

    expect(screen.getByRole("grid")).toBeInTheDocument();
  });
});
