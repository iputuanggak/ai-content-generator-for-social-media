// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    organization: {
      create: vi.fn(),
      setActive: vi.fn(),
    },
  },
}));

vi.mock("@/lib/slug", () => ({
  generateSlug: (s: string) => s.toLowerCase().replace(/\s+/g, "-"),
  sanitizeSlug: (s: string) => s,
}));

vi.mock("@/components/form-field", () => ({
  FormField: ({ label, id, value, onChange, placeholder }: { label: string; id: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string }) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <button {...props}>{children}</button>,
}));

const mockPush = vi.fn();
vi.mock("next/router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

let mockHookLoading = false;

vi.mock("@/lib/use-require-verified-email", () => ({
  useRequireVerifiedEmail: () => ({ loading: mockHookLoading }),
}));

import CreateTeamPage from "../../pages/create-team";
import { authClient } from "@/lib/auth-client";

describe("CreateTeamPage", () => {
  afterEach(() => {
    cleanup();
    mockPush.mockClear();
    mockHookLoading = false;
  });

  it("renders nothing when useRequireVerifiedEmail returns loading", () => {
    mockHookLoading = true;

    const { container } = render(<CreateTeamPage />);
    expect(container.innerHTML).toBe("");
  });

  it("renders content when useRequireVerifiedEmail returns not loading", () => {
    mockHookLoading = false;

    render(<CreateTeamPage />);
    expect(screen.getByText("Create a new Team")).toBeInTheDocument();
  });

  it("renders team name form field", () => {
    render(<CreateTeamPage />);
    expect(screen.getByText("Team name")).toBeInTheDocument();
  });

  it("renders create team button", () => {
    render(<CreateTeamPage />);
    expect(screen.getByText("Create team")).toBeInTheDocument();
  });

  describe("form submission", () => {
    it("displays error when organization creation fails", async () => {
      const user = userEvent.setup();
      vi.mocked(authClient.organization.create).mockResolvedValueOnce({
        data: null,
        error: { message: "Slug already exists" },
      });

      render(<CreateTeamPage />);
      await user.type(screen.getByPlaceholderText("e.g. Acme Marketing"), "Test Team");
      await user.click(screen.getByRole("button", { name: "Create team" }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Slug already exists");
      });
    });

    it("sets active org and redirects on success", async () => {
      const user = userEvent.setup();
      vi.mocked(authClient.organization.create).mockResolvedValueOnce({
        data: { id: "org-123" },
        error: null,
      });
      vi.mocked(authClient.organization.setActive).mockResolvedValueOnce({ data: null, error: null });

      render(<CreateTeamPage />);
      await user.type(screen.getByPlaceholderText("e.g. Acme Marketing"), "Test Team");
      await user.click(screen.getByRole("button", { name: "Create team" }));

      await waitFor(() => {
        expect(authClient.organization.setActive).toHaveBeenCalledWith({ organizationId: "org-123" });
        expect(mockPush).toHaveBeenCalledWith("/test-team");
      });
    });

    it("generates slug from team name via generateSlug and sanitizeSlug", async () => {
      const user = userEvent.setup();
      vi.mocked(authClient.organization.create).mockResolvedValueOnce({
        data: { id: "org-456" },
        error: null,
      });
      vi.mocked(authClient.organization.setActive).mockResolvedValueOnce({ data: null, error: null });

      render(<CreateTeamPage />);
      await user.type(screen.getByPlaceholderText("e.g. Acme Marketing"), "My Cool Team");
      await user.click(screen.getByRole("button", { name: "Create team" }));

      await waitFor(() => {
        expect(authClient.organization.create).toHaveBeenCalledWith({
          name: "My Cool Team",
          slug: "my-cool-team",
        });
      });
    });
  });
});
