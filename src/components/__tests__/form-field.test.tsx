// @vitest-environment jsdom

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { FormField } from "../form-field";

describe("FormField", () => {
  it("renders label and input with given props", () => {
    render(
      <FormField
        label="Email"
        id="email"
        type="email"
        placeholder="you@example.com"
        value="test@test.com"
        onChange={() => {}}
      />
    );

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "placeholder",
      "you@example.com"
    );
    expect(screen.getByLabelText("Email")).toHaveValue("test@test.com");
  });

  it("renders error message when error prop is provided", () => {
    render(
      <FormField
        label="Email"
        id="email"
        type="email"
        placeholder="you@example.com"
        value=""
        onChange={() => {}}
        error="Email is required"
      />
    );

    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Email is required");
  });

  it("does not render error element when error is empty", () => {
    const { container } = render(
      <FormField
        label="Email"
        id="email"
        type="email"
        placeholder="you@example.com"
        value=""
        onChange={() => {}}
      />
    );

    expect(container.querySelector("[role='alert']")).not.toBeInTheDocument();
  });

  it("passes extra input attributes through", () => {
    render(
      <FormField
        label="Password"
        id="password"
        type="password"
        placeholder="Your password"
        value=""
        onChange={() => {}}
        autoComplete="current-password"
        required
        minLength={8}
      />
    );

    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("autocomplete", "current-password");
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("minlength", "8");
  });

  it("renders children as input suffix", () => {
    render(
      <FormField
        label="Password"
        id="password"
        type="password"
        placeholder="Your password"
        value=""
        onChange={() => {}}
      >
        <button type="button" aria-label="Toggle visibility">
          👁
        </button>
      </FormField>
    );

    expect(screen.getByLabelText("Toggle visibility")).toBeInTheDocument();
  });
});
