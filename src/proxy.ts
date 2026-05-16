import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveSlugToOrg } from "@/lib/resolve-slug";
import { SLUG_DENYLIST } from "@/lib/slug";
import { getSmartRedirect } from "@/lib/smart-redirect";

const SESSION_COOKIES = [
  "better-auth.session_token",
  "better-auth.session_token.0",
];

const EXCLUDED_PREFIXES = [
  "/api",
  "/_next",
  "/login",
  "/register",
  "/onboarding",
  "/accept-invitation",
  "/teams",
  "/favicon.ico",
];

function hasSessionCookie(request: NextRequest): boolean {
  return SESSION_COOKIES.some((name) => request.cookies.has(name));
}

function isExcludedPath(pathname: string): boolean {
  return (
    EXCLUDED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/")) ||
    pathname === "/"
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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (AUTH_PAGES.includes(pathname)) {
    if (hasSessionCookie(request)) {
      try {
        const destination = await getSmartRedirect(request.headers);
        return NextResponse.redirect(new URL(destination, request.url));
      } catch {
        const response = NextResponse.next();
        for (const name of SESSION_COOKIES) {
          response.cookies.delete(name);
        }
        return response;
      }
    }
    return NextResponse.next();
  }

  if (
    pathname === "/verify-email" ||
    pathname.startsWith("/verify-email/")
  ) {
    if (!hasSessionCookie(request)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (session.user.emailVerified) {
      const destination = await getSmartRedirect(request.headers);
      return NextResponse.redirect(new URL(destination, request.url));
    }
    return NextResponse.next();
  }

  if (isExcludedPath(pathname)) {
    return NextResponse.next();
  }

  const slug = extractSlug(pathname);
  if (!slug) {
    return NextResponse.next();
  }

  if (!hasSessionCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const result = await resolveSlugToOrg(slug, request.headers);

  if (result.status === 401) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (result.status === 404) {
    return NextResponse.redirect(new URL("/teams", request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-org-id", result.body.id);
  requestHeaders.set("x-org-slug", result.body.slug ?? slug);
  requestHeaders.set("x-org-role", result.body.role);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    {
      source: "/((?!api/|_next/|onboarding|accept-invitation|teams|favicon\\.ico).*)",
    },
  ],
};
