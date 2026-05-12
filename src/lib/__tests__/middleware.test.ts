import { describe, it, expect } from "vitest";

type CookieValue = { name: string; value: string };

function middlewareLogic(
  pathname: string,
  cookies: CookieValue[]
): { redirect: boolean; destination?: string } {
  if (pathname.startsWith("/dashboard")) {
    const hasSession = cookies.some(
      (c) =>
        c.name === "better-auth.session_token" ||
        c.name === "better-auth.session_token.0"
    );
    if (!hasSession) {
      return { redirect: true, destination: "/login" };
    }
  }
  return { redirect: false };
}

describe("middleware logic", () => {
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

  it("allows non-dashboard routes without session cookie", () => {
    const result = middlewareLogic("/login", []);
    expect(result.redirect).toBe(false);
  });

  it("recognizes chunked session cookie variant", () => {
    const result = middlewareLogic("/dashboard", [
      { name: "better-auth.session_token.0", value: "chunk" },
    ]);
    expect(result.redirect).toBe(false);
  });
});
