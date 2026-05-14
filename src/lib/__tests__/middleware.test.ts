import { describe, it, expect } from "vitest";

type CookieValue = { name: string; value: string };

const SESSION_COOKIES = [
  "better-auth.session_token",
  "better-auth.session_token.0",
];

const AUTH_ROUTES = ["/login", "/register"];

const EXCLUDED_PREFIXES = ["/api", "/_next", "/onboarding", "/accept-invitation", "/teams", "/favicon.ico"];

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

  if (EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p))) {
    return { action: "next" };
  }

  if (AUTH_ROUTES.includes(pathname)) {
    if (!hasSession) return { action: "next" };
    if (hasInvitationId) return { action: "next" };
    return { action: "redirect", destination: "/teams" };
  }

  if (!hasSession) {
    return { action: "redirect", destination: "/login" };
  }

  return { action: "next" };
}

describe("middleware logic", () => {
  describe("slug route protection (unauthenticated)", () => {
    it("redirects slug routes without session cookie", () => {
      const result = middlewareLogic("/acme", []);
      expect(result.action).toBe("redirect");
      expect(result.destination).toBe("/login");
    });

    it("redirects slug sub-routes without session cookie", () => {
      const result = middlewareLogic("/acme/settings", []);
      expect(result.action).toBe("redirect");
      expect(result.destination).toBe("/login");
    });

    it("allows slug routes with session cookie", () => {
      const result = middlewareLogic("/acme", [
        { name: "better-auth.session_token", value: "abc" },
      ]);
      expect(result.action).toBe("next");
    });

    it("allows slug sub-routes with session cookie", () => {
      const result = middlewareLogic("/acme/history", [
        { name: "better-auth.session_token", value: "abc" },
      ]);
      expect(result.action).toBe("next");
    });

    it("recognizes chunked session cookie variant", () => {
      const result = middlewareLogic("/acme", [
        { name: "better-auth.session_token.0", value: "chunk" },
      ]);
      expect(result.action).toBe("next");
    });
  });

  describe("excluded routes", () => {
    it("allows /api routes without session", () => {
      const result = middlewareLogic("/api/session", []);
      expect(result.action).toBe("next");
    });

    it("allows /_next routes without session", () => {
      const result = middlewareLogic("/_next/static/abc.js", []);
      expect(result.action).toBe("next");
    });

    it("allows /login without session", () => {
      const result = middlewareLogic("/login", []);
      expect(result.action).toBe("next");
    });

    it("allows /register without session", () => {
      const result = middlewareLogic("/register", []);
      expect(result.action).toBe("next");
    });

    it("allows /teams without session", () => {
      const result = middlewareLogic("/teams", []);
      expect(result.action).toBe("next");
    });

    it("allows /onboarding without session", () => {
      const result = middlewareLogic("/onboarding", []);
      expect(result.action).toBe("next");
    });
  });

  describe("auth route protection (authenticated)", () => {
    it("redirects signed-in user on /login to /teams", () => {
      const result = middlewareLogic("/login", [
        { name: "better-auth.session_token", value: "abc" },
      ]);
      expect(result.action).toBe("redirect");
      expect(result.destination).toBe("/teams");
    });

    it("redirects signed-in user on /register to /teams", () => {
      const result = middlewareLogic("/register", [
        { name: "better-auth.session_token", value: "abc" },
      ]);
      expect(result.action).toBe("redirect");
      expect(result.destination).toBe("/teams");
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
  });

  describe("Next.js data request bypass (x-nextjs-data header)", () => {
    it("passes through slug route data request without redirect", () => {
      const result = middlewareLogic("/acme", [], {}, true);
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

    it("passes through data request for slug sub-route", () => {
      const result = middlewareLogic("/acme/settings", [], {}, true);
      expect(result.action).toBe("next");
    });
  });
});
