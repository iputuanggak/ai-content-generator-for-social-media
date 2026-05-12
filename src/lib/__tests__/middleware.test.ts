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
  searchParams: Record<string, string> = {}
): { redirect: boolean; destination?: string } {
  const hasSession = cookies.some((c) => SESSION_COOKIES.includes(c.name));
  const hasInvitationId = "invitationId" in searchParams;

  if (pathname.startsWith("/dashboard") && !hasSession) {
    return { redirect: true, destination: "/login" };
  }

  if (AUTH_ROUTES.includes(pathname) && hasSession) {
    if (hasInvitationId) {
      return { redirect: false };
    }
    return { redirect: true, destination: "/dashboard" };
  }

  return { redirect: false };
}

describe("middleware logic", () => {
  describe("dashboard protection (unauthenticated)", () => {
    it("allows dashboard access with session cookie", () => {
      const result = middlewareLogic("/dashboard", [
        { name: "better-auth.session_token", value: "abc" },
      ]);
      expect(result.redirect).toBe(false);
    });

    it("redirects to /login without session cookie", () => {
      const result = middlewareLogic("/dashboard", []);
      expect(result.redirect).toBe(true);
      expect(result.destination).toBe("/login");
    });

    it("allows dashboard sub-routes with session cookie", () => {
      const result = middlewareLogic("/dashboard/settings", [
        { name: "better-auth.session_token", value: "abc" },
      ]);
      expect(result.redirect).toBe(false);
    });

    it("redirects dashboard sub-routes without session cookie", () => {
      const result = middlewareLogic("/dashboard/settings", []);
      expect(result.redirect).toBe(true);
      expect(result.destination).toBe("/login");
    });

    it("recognizes chunked session cookie variant", () => {
      const result = middlewareLogic("/dashboard", [
        { name: "better-auth.session_token.0", value: "chunk" },
      ]);
      expect(result.redirect).toBe(false);
    });
  });

  describe("auth route protection (authenticated)", () => {
    it("redirects signed-in user on /login to /dashboard", () => {
      const result = middlewareLogic("/login", [
        { name: "better-auth.session_token", value: "abc" },
      ]);
      expect(result.redirect).toBe(true);
      expect(result.destination).toBe("/dashboard");
    });

    it("redirects signed-in user on /register to /dashboard", () => {
      const result = middlewareLogic("/register", [
        { name: "better-auth.session_token", value: "abc" },
      ]);
      expect(result.redirect).toBe(true);
      expect(result.destination).toBe("/dashboard");
    });

    it("passes through /login with invitationId even when signed in", () => {
      const result = middlewareLogic(
        "/login",
        [{ name: "better-auth.session_token", value: "abc" }],
        { invitationId: "inv_123" }
      );
      expect(result.redirect).toBe(false);
    });

    it("passes through /register with invitationId even when signed in", () => {
      const result = middlewareLogic(
        "/register",
        [{ name: "better-auth.session_token", value: "abc" }],
        { invitationId: "inv_123" }
      );
      expect(result.redirect).toBe(false);
    });

    it("allows /login for unauthenticated users", () => {
      const result = middlewareLogic("/login", []);
      expect(result.redirect).toBe(false);
    });

    it("allows /register for unauthenticated users", () => {
      const result = middlewareLogic("/register", []);
      expect(result.redirect).toBe(false);
    });
  });
});
