// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { PlatformOutputCard } from "../platform-output-card";

describe("PlatformOutputCard", () => {
  afterEach(() => {
    cleanup();
  });

  const defaultProps = {
    platformName: "Twitter / X",
    content: "Hello world this is a tweet",
    onChange: vi.fn(),
    onCopy: vi.fn(),
    onSave: vi.fn(),
    onRegenerate: vi.fn(),
    loading: false,
    hasUnsavedChanges: false,
    isSaving: false,
  };

  it("renders platform name", () => {
    render(<PlatformOutputCard {...defaultProps} />);
    expect(screen.getByText("Twitter / X")).toBeInTheDocument();
  });

  it("renders editable textarea with content", () => {
    render(<PlatformOutputCard {...defaultProps} />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue("Hello world this is a tweet");
  });

  it("calls onChange when textarea content changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PlatformOutputCard {...defaultProps} onChange={onChange} />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "!");
    expect(onChange).toHaveBeenCalled();
  });

  it("calls onCopy when copy button is clicked", async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    render(<PlatformOutputCard {...defaultProps} onCopy={onCopy} />);

    await user.click(screen.getByRole("button", { name: /copy/i }));
    expect(onCopy).toHaveBeenCalledOnce();
  });

  it("calls onSave when save button is clicked", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <PlatformOutputCard {...defaultProps} onSave={onSave} hasUnsavedChanges={true} />
    );

    await user.click(screen.getByRole("button", { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("calls onRegenerate when regenerate button is clicked", async () => {
    const user = userEvent.setup();
    const onRegenerate = vi.fn();
    render(<PlatformOutputCard {...defaultProps} onRegenerate={onRegenerate} />);

    const regenButtons = screen.getAllByRole("button", { name: /regenerate/i });
    await user.click(regenButtons[0]);
    expect(onRegenerate).toHaveBeenCalledOnce();
  });

  it("shows loading skeleton when loading is true", () => {
    const { container } = render(<PlatformOutputCard {...defaultProps} loading={true} />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("disables save button when no unsaved changes", () => {
    render(<PlatformOutputCard {...defaultProps} hasUnsavedChanges={false} />);
    const saveBtn = screen.getByRole("button", { name: /^save$/i });
    expect(saveBtn).toBeDisabled();
  });

  it("disables save button when saving", () => {
    render(
      <PlatformOutputCard
        {...defaultProps}
        hasUnsavedChanges={true}
        isSaving={true}
      />
    );
    const saveBtn = screen.getByRole("button", { name: /saving/i });
    expect(saveBtn).toBeDisabled();
  });

  it("shows unsaved badge when hasUnsavedChanges is true", () => {
    render(<PlatformOutputCard {...defaultProps} hasUnsavedChanges={true} />);
    expect(screen.getByText("Unsaved")).toBeInTheDocument();
  });

  it("hides unsaved badge when hasUnsavedChanges is false", () => {
    render(<PlatformOutputCard {...defaultProps} hasUnsavedChanges={false} />);
    expect(screen.queryByText("Unsaved")).not.toBeInTheDocument();
  });

  it("renders mobile overflow menu trigger", () => {
    render(<PlatformOutputCard {...defaultProps} />);
    expect(screen.getByTitle("More actions")).toBeInTheDocument();
  });
});
