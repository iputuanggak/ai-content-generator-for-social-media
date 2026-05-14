import { describe, it, expect } from "vitest";

type CookieValue = { name: string; value: string };

const SESSION_COOKIES = [
  "better-auth.session_token",
  "better-auth.session_token.0",
];

const AUTH_ROUTES = ["/login", "/register"];

function middlewareLogic(
  pathname: string,
  cookies: CookieValue[],
  searchParams: Record<string, string> = {},
  isNextjsDataRequest = false
): { action: "next" | "redirect"; destination?: string } {
  if (isNextjsDataRequest) {
    return { action: "next" };
  }

  const hasSession = cookies.some((c) => SESSION_COOKIES.includes(c.name));
  const hasInvitationId = "invitationId" in searchParams;

  if (pathname.startsWith("/dashboard") && !hasSession) {
    return { action: "redirect", destination: "/login" };
  }

  if (AUTH_ROUTES.includes(pathname) && hasSession) {
    if (hasInvitationId) {
      return { action: "next" };
    }
    return { action: "redirect", destination: "/dashboard" };
  }

  return { action: "next" };
}

describe("middleware logic", () => {
  describe("dashboard protection (unauthenticated)", () => {
    it("allows dashboard access with session cookie", () => {
      const result = middlewareLogic("/dashboard", [
        { name: "better-auth.session_token", value: "abc" },
      ]);
      expect(result.action).toBe("next");
    });

    it("redirects to /login without session cookie", () => {
      const result = middlewareLogic("/dashboard", []);
      expect(result.action).toBe("redirect");
      expect(result.destination).toBe("/login");
    });

    it("allows dashboard sub-routes with session cookie", () => {
      const result = middlewareLogic("/dashboard/settings", [
        { name: "better-auth.session_token", value: "abc" },
      ]);
      expect(result.action).toBe("next");
    });

    it("redirects dashboard sub-routes without session cookie", () => {
      const result = middlewareLogic("/dashboard/settings", []);
      expect(result.action).toBe("redirect");
      expect(result.destination).toBe("/login");
    });

    it("recognizes chunked session cookie variant", () => {
      const result = middlewareLogic("/dashboard", [
        { name: "better-auth.session_token.0", value: "chunk" },
      ]);
      expect(result.action).toBe("next");
    });
  });

  describe("auth route protection (authenticated)", () => {
    it("redirects signed-in user on /login to /dashboard", () => {
      const result = middlewareLogic("/login", [
        { name: "better-auth.session_token", value: "abc" },
      ]);
      expect(result.action).toBe("redirect");
      expect(result.destination).toBe("/dashboard");
    });

    it("redirects signed-in user on /register to /dashboard", () => {
      const result = middlewareLogic("/register", [
        { name: "better-auth.session_token", value: "abc" },
      ]);
      expect(result.action).toBe("redirect");
      expect(result.destination).toBe("/dashboard");
    });

    it("passes through /login with invitationId even when signed in", () => {
      const result = middlewareLogic(
        "/login",
        [{ name: "better-auth.session_token", value: "abc" }],
        { invitationId: "inv_123" }
      );
      expect(result.action).toBe("next");
    });

    it("passes through /register with invitationId even when signed in", () => {
      const result = middlewareLogic(
        "/register",
        [{ name: "better-auth.session_token", value: "abc" }],
        { invitationId: "inv_123" }
      );
      expect(result.action).toBe("next");
    });

    it("allows /login for unauthenticated users", () => {
      const result = middlewareLogic("/login", []);
      expect(result.action).toBe("next");
    });

    it("allows /register for unauthenticated users", () => {
      const result = middlewareLogic("/register", []);
      expect(result.action).toBe("next");
    });
  });

  describe("Next.js data request bypass (x-nextjs-data header)", () => {
    it("passes through dashboard data request without redirect", () => {
      const result = middlewareLogic("/dashboard", [], {}, true);
      expect(result.action).toBe("next");
    });

    it("passes through login data request without redirect", () => {
      const result = middlewareLogic(
        "/login",
        [{ name: "better-auth.session_token", value: "abc" }],
        {},
        true
      );
      expect(result.action).toBe("next");
    });

    it("passes through data request for protected route", () => {
      const result = middlewareLogic("/dashboard/settings", [], {}, true);
      expect(result.action).toBe("next");
    });
  });
});
