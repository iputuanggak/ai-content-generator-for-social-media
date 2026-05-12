import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIES = [
  "better-auth.session_token",
  "better-auth.session_token.0",
];

const AUTH_ROUTES = ["/login", "/register"];

function hasSessionCookie(request: NextRequest): boolean {
  return SESSION_COOKIES.some((name) => request.cookies.has(name));
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const authenticated = hasSessionCookie(request);

  if (pathname.startsWith("/dashboard") && !authenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (AUTH_ROUTES.includes(pathname) && authenticated) {
    if (searchParams.has("invitationId")) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
