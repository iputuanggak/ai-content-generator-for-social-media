import { describe, it, expect } from "vitest";
import { isDisposableEmail, extractEmailDomain } from "../disposable-email";

describe("extractEmailDomain", () => {
  it("returns domain portion after @", () => {
    expect(extractEmailDomain("user@mailinator.com")).toBe("mailinator.com");
  });

  it("handles subdomains", () => {
    expect(extractEmailDomain("user@sub.mailinator.com")).toBe("sub.mailinator.com");
  });

  it("returns empty string for invalid email", () => {
    expect(extractEmailDomain("notanemail")).toBe("");
  });

  it("lowercases the domain", () => {
    expect(extractEmailDomain("user@MAILINATOR.COM")).toBe("mailinator.com");
  });
});

describe("isDisposableEmail", () => {
  it("returns true for known disposable domain mailinator.com", () => {
    expect(isDisposableEmail("test@mailinator.com")).toBe(true);
  });

  it("returns true for guerrillamail.com", () => {
    expect(isDisposableEmail("test@guerrillamail.com")).toBe(true);
  });

  it("returns true for tempmail.com", () => {
    expect(isDisposableEmail("test@tempmail.com")).toBe(true);
  });

  it("returns false for gmail.com", () => {
    expect(isDisposableEmail("test@gmail.com")).toBe(false);
  });

  it("returns false for outlook.com", () => {
    expect(isDisposableEmail("test@outlook.com")).toBe(false);
  });

  it("returns false for company email", () => {
    expect(isDisposableEmail("user@company.io")).toBe(false);
  });

  it("is case-insensitive for the domain", () => {
    expect(isDisposableEmail("test@MAILINATOR.COM")).toBe(true);
  });

  it("returns false for empty string", () => {
    expect(isDisposableEmail("")).toBe(false);
  });
});
