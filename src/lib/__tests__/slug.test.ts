import { describe, it, expect } from "vitest";
import { generateSlug, sanitizeSlug, SLUG_DENYLIST } from "../slug";

describe("generateSlug", () => {
  it("converts name to lowercase hyphenated slug", () => {
    expect(generateSlug("Acme Marketing")).toBe("acme-marketing");
  });

  it("strips non-alphanumeric characters except hyphens", () => {
    expect(generateSlug("Team #1!")).toBe("team-1");
  });

  it("collapses multiple spaces into single hyphen", () => {
    expect(generateSlug("My   Cool   Team")).toBe("my-cool-team");
  });

  it("trims leading and trailing whitespace", () => {
    expect(generateSlug("  hello world  ")).toBe("hello-world");
  });

  it("removes leading and trailing hyphens", () => {
    expect(generateSlug("---hello---")).toBe("hello");
  });

  it("collapses consecutive hyphens", () => {
    expect(generateSlug("hello--world")).toBe("hello-world");
  });

  it("handles empty string", () => {
    expect(generateSlug("")).toBe("");
  });

  it("handles special characters only", () => {
    expect(generateSlug("@#$%")).toBe("");
  });
});

describe("sanitizeSlug", () => {
  it("returns slug unchanged if not in denylist and no collision", () => {
    expect(sanitizeSlug("my-team")).toBe("my-team");
  });

  it("appends -team for denylisted slugs", () => {
    expect(sanitizeSlug("login")).toBe("login-team");
    expect(sanitizeSlug("register")).toBe("register-team");
    expect(sanitizeSlug("onboarding")).toBe("onboarding-team");
    expect(sanitizeSlug("accept-invitation")).toBe("accept-invitation-team");
    expect(sanitizeSlug("api")).toBe("api-team");
    expect(sanitizeSlug("teams")).toBe("teams-team");
    expect(sanitizeSlug("admin")).toBe("admin-team");
    expect(sanitizeSlug("www")).toBe("www-team");
  });

  it("appends numeric suffix when sanitized denylisted slug collides", () => {
    expect(sanitizeSlug("login", ["login-team"])).toBe("login-2");
  });

  it("increments suffix until finding non-colliding slug", () => {
    expect(sanitizeSlug("login", ["login-team", "login-2", "login-3"])).toBe(
      "login-4"
    );
  });

  it("appends numeric suffix on collision with existing slug", () => {
    expect(sanitizeSlug("my-team", ["my-team"])).toBe("my-team-2");
  });

  it("increments suffix past existing collisions", () => {
    expect(sanitizeSlug("my-team", ["my-team", "my-team-2"])).toBe(
      "my-team-3"
    );
  });

  it("returns slug as-is when no collisions and not denylisted", () => {
    expect(sanitizeSlug("unique-slug", ["other-slug"])).toBe("unique-slug");
  });
});

describe("SLUG_DENYLIST", () => {
  it("contains all required reserved words", () => {
    const required = [
      "login",
      "register",
      "onboarding",
      "accept-invitation",
      "api",
      "teams",
      "admin",
      "www",
    ];
    for (const word of required) {
      expect(SLUG_DENYLIST.has(word)).toBe(true);
    }
  });

  it("has exactly 8 entries", () => {
    expect(SLUG_DENYLIST.size).toBe(8);
  });
});
