// @vitest-environment jsdom

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { ConfirmDialog } from "../confirm-dialog";

describe("ConfirmDialog", () => {
  it("renders title and description when open", () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Delete Item?"
        description="This action cannot be undone."
        onConfirm={() => {}}
      />
    );

    expect(screen.getByText("Delete Item?")).toBeInTheDocument();
    expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <ConfirmDialog
        open={false}
        onOpenChange={() => {}}
        title="Delete Item?"
        description="This action cannot be undone."
        onConfirm={() => {}}
      />
    );

    expect(container.querySelector("[data-slot='dialog-content']")).not.toBeInTheDocument();
  });

  it("calls onConfirm when confirm button is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Delete Item?"
        description="This action cannot be undone."
        onConfirm={onConfirm}
      />
    );

    await user.click(screen.getByRole("button", { name: /confirm/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onOpenChange(false) when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Delete Item?"
        description="This action cannot be undone."
        onConfirm={() => {}}
      />
    );

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("uses default confirm label 'Confirm' when confirmLabel is not provided", () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Delete Item?"
        description="This action cannot be undone."
        onConfirm={() => {}}
      />
    );

    expect(screen.getByRole("button", { name: /confirm/i })).toBeInTheDocument();
  });

  it("uses custom confirmLabel when provided", () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Remove Member"
        description="Are you sure?"
        confirmLabel="Remove"
        onConfirm={() => {}}
      />
    );

    expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
  });

  it("defaults to destructive variant styling", () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Delete Item?"
        description="This action cannot be undone."
        onConfirm={() => {}}
      />
    );

    const confirmBtn = screen.getByRole("button", { name: /confirm/i });
    expect(confirmBtn).toHaveAttribute("data-variant", "destructive");
  });

  it("uses outline variant for cancel button", () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Delete Item?"
        description="This action cannot be undone."
        onConfirm={() => {}}
      />
    );

    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    expect(cancelBtn).toHaveAttribute("data-variant", "outline");
  });
});
