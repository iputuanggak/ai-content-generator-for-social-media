import { describe, it, expect, vi } from "vitest";
import { getSmartRedirectLogic } from "@/lib/smart-redirect";

type CookieValue = { name: string; value: string };

const SESSION_COOKIES = [
  "better-auth.session_token",
  "better-auth.session_token.0",
  "__Secure-better-auth.session_token",
  "__Secure-better-auth.session_token.0",
];

const EXCLUDED_PREFIXES = [
  "/api",
  "/_next",
  "/login",
  "/register",
  "/onboarding",
  "/accept-invitation",
  "/teams",
  "/create-team",
  "/favicon.ico",
];

const SLUG_DENYLIST = new Set([
  "login",
  "register",
  "onboarding",
  "accept-invitation",
  "api",
  "teams",
  "admin",
  "www",
  "create-team",
]);

interface ResolveResult {
  status: number;
  body: { id?: string; slug?: string; role?: string; error?: string };
}

function isExcludedPath(pathname: string): boolean {
  return (
    EXCLUDED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
    ) || pathname === "/"
  );
}

function extractSlug(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;
  const candidate = segments[0];
  if (SLUG_DENYLIST.has(candidate)) return null;
  return candidate;
}

const AUTH_PAGES = ["/login", "/register"];

async function proxyLogic({
  pathname,
  cookies,
  resolveSlug,
  listOrganizations,
  getSession,
}: {
  pathname: string;
  cookies: CookieValue[];
  resolveSlug: (
    slug: string,
    headers: Record<string, string>
  ) => Promise<ResolveResult>;
  listOrganizations: () => Promise<
    Array<{ id: string; slug: string | null }>
  >;
  getSession: () => Promise<{
    user: { emailVerified: boolean };
  } | null>;
}): Promise<{
  action: "next" | "redirect";
  destination?: string;
  headers?: Record<string, string>;
}> {
  if (AUTH_PAGES.includes(pathname)) {
    const hasSession = cookies.some((c) => SESSION_COOKIES.includes(c.name));
    if (hasSession) {
      const orgs = await listOrganizations();
      const destination = getSmartRedirectLogic(orgs);
      return { action: "redirect", destination };
    }
    return { action: "next" };
  }

  if (pathname === "/verify-email" || pathname.startsWith("/verify-email/")) {
    const hasSession = cookies.some((c) => SESSION_COOKIES.includes(c.name));
    if (!hasSession) {
      return { action: "redirect", destination: "/login" };
    }
    const session = await getSession();
    if (!session) {
      return { action: "redirect", destination: "/login" };
    }
    if (session.user.emailVerified) {
      const orgs = await listOrganizations();
      const destination = getSmartRedirectLogic(orgs);
      return { action: "redirect", destination };
    }
    return { action: "next" };
  }

  if (isExcludedPath(pathname)) {
    return { action: "next" };
  }

  const slug = extractSlug(pathname);
  if (!slug) {
    return { action: "next" };
  }

  const hasSession = cookies.some((c) => SESSION_COOKIES.includes(c.name));
  if (!hasSession) {
    return { action: "redirect", destination: "/login" };
  }

  const result = await resolveSlug(slug, {});

  if (result.status === 401) {
    return { action: "redirect", destination: "/login" };
  }

  if (result.status === 404) {
    return { action: "redirect", destination: "/teams" };
  }

  return {
    action: "next",
    headers: {
      "x-org-id": result.body.id!,
      "x-org-slug": result.body.slug!,
      "x-org-role": result.body.role!,
    },
  };
}

const resolvedOrg: ResolveResult = {
  status: 200,
  body: {
    id: "org-1",
    slug: "acme-marketing",
    role: "owner",
  },
};

const validCookies = [{ name: "better-auth.session_token", value: "abc" }];

const defaultListOrganizations = async () => [
  { id: "org-1", slug: "acme-marketing" },
  { id: "org-2", slug: "beta-team" },
];

describe("proxy auth gate", () => {
  describe("excluded paths pass through", () => {
    it.each([
      "/api",
      "/api/teams/resolve",
      "/_next/static/chunk.js",
      "/login",
      "/register",
      "/onboarding",
      "/accept-invitation",
      "/teams",
      "/create-team",
      "/favicon.ico",
      "/",
    ])("passes through %s without auth check", async (pathname) => {
      const result = await proxyLogic({
        pathname,
        cookies: [],
        resolveSlug: async () => resolvedOrg,
        listOrganizations: defaultListOrganizations,
        getSession: async () => ({ user: { emailVerified: false } }),
      });
      expect(result.action).toBe("next");
    });
  });

  describe("unauthenticated users on slug routes", () => {
    it("redirects /acme-marketing to /login", async () => {
      const result = await proxyLogic({
        pathname: "/acme-marketing",
        cookies: [],
        resolveSlug: async () => resolvedOrg,
        listOrganizations: defaultListOrganizations,
        getSession: async () => null,
      });
      expect(result.action).toBe("redirect");
      expect(result.destination).toBe("/login");
    });

    it("redirects /acme-marketing/history to /login", async () => {
      const result = await proxyLogic({
        pathname: "/acme-marketing/history",
        cookies: [],
        resolveSlug: async () => resolvedOrg,
        listOrganizations: defaultListOrganizations,
        getSession: async () => null,
      });
      expect(result.action).toBe("redirect");
      expect(result.destination).toBe("/login");
    });

    it("recognizes chunked session cookie variant", async () => {
      const result = await proxyLogic({
        pathname: "/acme-marketing",
        cookies: [{ name: "better-auth.session_token.0", value: "chunk" }],
        resolveSlug: async () => resolvedOrg,
        listOrganizations: defaultListOrganizations,
        getSession: async () => ({ user: { emailVerified: true } }),
      });
      expect(result.action).toBe("next");
    });

    it("recognizes __Secure- prefixed session cookie", async () => {
      const result = await proxyLogic({
        pathname: "/acme-marketing",
        cookies: [{ name: "__Secure-better-auth.session_token", value: "abc" }],
        resolveSlug: async () => resolvedOrg,
        listOrganizations: defaultListOrganizations,
        getSession: async () => ({ user: { emailVerified: true } }),
      });
      expect(result.action).toBe("next");
    });
  });

  describe("authenticated users — invalid slug or no membership", () => {
    it("redirects to /teams when slug does not resolve", async () => {
      const result = await proxyLogic({
        pathname: "/nonexistent-team",
        cookies: validCookies,
        resolveSlug: async () => ({
          status: 404,
          body: { error: "Team not found" },
        }),
        listOrganizations: defaultListOrganizations,
        getSession: async () => ({ user: { emailVerified: true } }),
      });
      expect(result.action).toBe("redirect");
      expect(result.destination).toBe("/teams");
    });

    it("redirects to /teams when user is not a member", async () => {
      const result = await proxyLogic({
        pathname: "/other-team",
        cookies: validCookies,
        resolveSlug: async () => ({
          status: 404,
          body: { error: "Team not found" },
        }),
        listOrganizations: defaultListOrganizations,
        getSession: async () => ({ user: { emailVerified: true } }),
      });
      expect(result.action).toBe("redirect");
      expect(result.destination).toBe("/teams");
    });

    it("redirects to /login when session is stale (401)", async () => {
      const result = await proxyLogic({
        pathname: "/acme-marketing",
        cookies: validCookies,
        resolveSlug: async () => ({
          status: 401,
          body: { error: "Unauthorized" },
        }),
        listOrganizations: defaultListOrganizations,
        getSession: async () => ({ user: { emailVerified: true } }),
      });
      expect(result.action).toBe("redirect");
      expect(result.destination).toBe("/login");
    });
  });

  describe("authenticated members access slug routes", () => {
    it("allows access to /acme-marketing", async () => {
      const result = await proxyLogic({
        pathname: "/acme-marketing",
        cookies: validCookies,
        resolveSlug: async () => resolvedOrg,
        listOrganizations: defaultListOrganizations,
        getSession: async () => ({ user: { emailVerified: true } }),
      });
      expect(result.action).toBe("next");
    });

    it("allows access to /acme-marketing/history", async () => {
      const result = await proxyLogic({
        pathname: "/acme-marketing/history",
        cookies: validCookies,
        resolveSlug: async () => resolvedOrg,
        listOrganizations: defaultListOrganizations,
        getSession: async () => ({ user: { emailVerified: true } }),
      });
      expect(result.action).toBe("next");
    });

    it("allows access to /acme-marketing/settings/brand", async () => {
      const result = await proxyLogic({
        pathname: "/acme-marketing/settings/brand",
        cookies: validCookies,
        resolveSlug: async () => resolvedOrg,
        listOrganizations: defaultListOrganizations,
        getSession: async () => ({ user: { emailVerified: true } }),
      });
      expect(result.action).toBe("next");
    });

    it("sets x-org-id, x-org-slug, x-org-role headers", async () => {
      const result = await proxyLogic({
        pathname: "/acme-marketing",
        cookies: validCookies,
        resolveSlug: async () => ({
          status: 200,
          body: { id: "org-42", slug: "acme-marketing", role: "member" },
        }),
        listOrganizations: defaultListOrganizations,
        getSession: async () => ({ user: { emailVerified: true } }),
      });
      expect(result.action).toBe("next");
      expect(result.headers).toEqual({
        "x-org-id": "org-42",
        "x-org-slug": "acme-marketing",
        "x-org-role": "member",
      });
    });
  });

  describe("auth-page guard — logged-in users redirected using smart redirect", () => {
    it("redirects /login to /teams when user has multiple teams", async () => {
      const result = await proxyLogic({
        pathname: "/login",
        cookies: validCookies,
        resolveSlug: async () => resolvedOrg,
        listOrganizations: async () => [
          { id: "org-1", slug: "acme" },
          { id: "org-2", slug: "beta" },
        ],
        getSession: async () => ({ user: { emailVerified: true } }),
      });
      expect(result.action).toBe("redirect");
      expect(result.destination).toBe("/teams");
    });

    it("redirects /register to /teams when user has multiple teams", async () => {
      const result = await proxyLogic({
        pathname: "/register",
        cookies: validCookies,
        resolveSlug: async () => resolvedOrg,
        listOrganizations: async () => [
          { id: "org-1", slug: "acme" },
          { id: "org-2", slug: "beta" },
        ],
        getSession: async () => ({ user: { emailVerified: true } }),
      });
      expect(result.action).toBe("redirect");
      expect(result.destination).toBe("/teams");
    });

    it("redirects /login to /:slug when user has exactly 1 team", async () => {
      const result = await proxyLogic({
        pathname: "/login",
        cookies: validCookies,
        resolveSlug: async () => resolvedOrg,
        listOrganizations: async () => [
          { id: "org-1", slug: "acme-marketing" },
        ],
        getSession: async () => ({ user: { emailVerified: true } }),
      });
      expect(result.action).toBe("redirect");
      expect(result.destination).toBe("/acme-marketing");
    });

    it("redirects /register to /onboarding when user has 0 teams", async () => {
      const result = await proxyLogic({
        pathname: "/register",
        cookies: validCookies,
        resolveSlug: async () => resolvedOrg,
        listOrganizations: async () => [],
        getSession: async () => ({ user: { emailVerified: true } }),
      });
      expect(result.action).toBe("redirect");
      expect(result.destination).toBe("/onboarding");
    });

    it("passes through /login without session cookie", async () => {
      const result = await proxyLogic({
        pathname: "/login",
        cookies: [],
        resolveSlug: async () => resolvedOrg,
        listOrganizations: defaultListOrganizations,
        getSession: async () => null,
      });
      expect(result.action).toBe("next");
    });

    it("passes through /register without session cookie", async () => {
      const result = await proxyLogic({
        pathname: "/register",
        cookies: [],
        resolveSlug: async () => resolvedOrg,
        listOrganizations: defaultListOrganizations,
        getSession: async () => null,
      });
      expect(result.action).toBe("next");
    });

    it("does not redirect other excluded paths with session cookie", async () => {
      const otherPaths = ["/api", "/_next/static/chunk.js", "/onboarding", "/favicon.ico"];
      for (const pathname of otherPaths) {
        const result = await proxyLogic({
          pathname,
          cookies: validCookies,
          resolveSlug: async () => resolvedOrg,
          listOrganizations: defaultListOrganizations,
          getSession: async () => ({ user: { emailVerified: true } }),
        });
        expect(result.action).toBe("next");
      }
    });
  });

  describe("verify-email guard", () => {
    it("redirects unauthenticated user to /login", async () => {
      const result = await proxyLogic({
        pathname: "/verify-email",
        cookies: [],
        resolveSlug: async () => resolvedOrg,
        listOrganizations: defaultListOrganizations,
        getSession: async () => null,
      });
      expect(result.action).toBe("redirect");
      expect(result.destination).toBe("/login");
    });

    it("redirects verified user with 0 teams to /onboarding", async () => {
      const result = await proxyLogic({
        pathname: "/verify-email",
        cookies: validCookies,
        resolveSlug: async () => resolvedOrg,
        listOrganizations: async () => [],
        getSession: async () => ({ user: { emailVerified: true } }),
      });
      expect(result.action).toBe("redirect");
      expect(result.destination).toBe("/onboarding");
    });

    it("redirects verified user with 1 team to /:slug", async () => {
      const result = await proxyLogic({
        pathname: "/verify-email",
        cookies: validCookies,
        resolveSlug: async () => resolvedOrg,
        listOrganizations: async () => [
          { id: "org-1", slug: "acme-marketing" },
        ],
        getSession: async () => ({ user: { emailVerified: true } }),
      });
      expect(result.action).toBe("redirect");
      expect(result.destination).toBe("/acme-marketing");
    });

    it("redirects verified user with multiple teams to /teams", async () => {
      const result = await proxyLogic({
        pathname: "/verify-email",
        cookies: validCookies,
        resolveSlug: async () => resolvedOrg,
        listOrganizations: async () => [
          { id: "org-1", slug: "acme" },
          { id: "org-2", slug: "beta" },
        ],
        getSession: async () => ({ user: { emailVerified: true } }),
      });
      expect(result.action).toBe("redirect");
      expect(result.destination).toBe("/teams");
    });

    it("allows unverified user to access /verify-email", async () => {
      const result = await proxyLogic({
        pathname: "/verify-email",
        cookies: validCookies,
        resolveSlug: async () => resolvedOrg,
        listOrganizations: defaultListOrganizations,
        getSession: async () => ({ user: { emailVerified: false } }),
      });
      expect(result.action).toBe("next");
    });

    it("redirects to /login when session cookie exists but getSession returns null", async () => {
      const result = await proxyLogic({
        pathname: "/verify-email",
        cookies: validCookies,
        resolveSlug: async () => resolvedOrg,
        listOrganizations: defaultListOrganizations,
        getSession: async () => null,
      });
      expect(result.action).toBe("redirect");
      expect(result.destination).toBe("/login");
    });
  });

  describe("slug extraction", () => {
    it("extracts slug from /acme-marketing/history", () => {
      expect(extractSlug("/acme-marketing/history")).toBe("acme-marketing");
    });

    it("extracts slug from /acme-marketing", () => {
      expect(extractSlug("/acme-marketing")).toBe("acme-marketing");
    });

    it("returns null for denylisted slugs", () => {
      for (const slug of SLUG_DENYLIST) {
        expect(extractSlug(`/${slug}`)).toBeNull();
      }
    });

    it("returns null for root path", () => {
      expect(extractSlug("/")).toBeNull();
    });
  });
});
