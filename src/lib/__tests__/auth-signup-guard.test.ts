import { describe, it, expect } from "vitest";
import { isDisposableEmail } from "../disposable-email";

/**
 * Pure guard logic extracted from the auth API route handler.
 * Returns a 422 error response body if the email is disposable, null otherwise.
 */
function signUpDisposableEmailGuard(
  method: string,
  url: string,
  email: string | undefined,
): { status: number; body: { error: string; message: string } } | null {
  if (method === "POST" && url.includes("/sign-up/email")) {
    if (email && isDisposableEmail(email)) {
      return {
        status: 422,
        body: {
          error: "DISPOSABLE_EMAIL",
          message:
            "This email provider is not supported. Please use a permanent email address.",
        },
      };
    }
  }
  return null;
}

describe("signUpDisposableEmailGuard (server-side guard)", () => {
  it("returns 422 for a disposable email on sign-up route", () => {
    const result = signUpDisposableEmailGuard(
      "POST",
      "/api/auth/sign-up/email",
      "test@mailinator.com",
    );
    expect(result).not.toBeNull();
    expect(result!.status).toBe(422);
    expect(result!.body.error).toBe("DISPOSABLE_EMAIL");
  });

  it("returns 422 for guerrillamail.com", () => {
    const result = signUpDisposableEmailGuard(
      "POST",
      "/api/auth/sign-up/email",
      "user@guerrillamail.com",
    );
    expect(result).not.toBeNull();
    expect(result!.status).toBe(422);
  });

  it("returns null for a legitimate email", () => {
    const result = signUpDisposableEmailGuard(
      "POST",
      "/api/auth/sign-up/email",
      "user@gmail.com",
    );
    expect(result).toBeNull();
  });

  it("returns null for a non-sign-up POST route", () => {
    const result = signUpDisposableEmailGuard(
      "POST",
      "/api/auth/sign-in/email",
      "test@mailinator.com",
    );
    expect(result).toBeNull();
  });

  it("returns null for a GET request", () => {
    const result = signUpDisposableEmailGuard(
      "GET",
      "/api/auth/sign-up/email",
      "test@mailinator.com",
    );
    expect(result).toBeNull();
  });

  it("returns null when email is undefined", () => {
    const result = signUpDisposableEmailGuard(
      "POST",
      "/api/auth/sign-up/email",
      undefined,
    );
    expect(result).toBeNull();
  });

  it("is case-insensitive for the domain", () => {
    const result = signUpDisposableEmailGuard(
      "POST",
      "/api/auth/sign-up/email",
      "test@MAILINATOR.COM",
    );
    expect(result).not.toBeNull();
    expect(result!.status).toBe(422);
  });
});
