import { describe, it, expect } from "vitest";

interface OrgLike {
  id: string;
  slug: string | null;
}

function getSmartRedirectLogic(orgs: OrgLike[]): string {
  if (orgs.length === 0) return "/onboarding";
  if (orgs.length === 1) return `/${orgs[0].slug ?? orgs[0].id}`;
  return "/teams";
}

describe("getSmartRedirectLogic", () => {
  it("returns /onboarding when user has 0 teams", () => {
    expect(getSmartRedirectLogic([])).toBe("/onboarding");
  });

  it("returns /:slug when user has exactly 1 team with a slug", () => {
    expect(
      getSmartRedirectLogic([{ id: "org-1", slug: "acme-marketing" }])
    ).toBe("/acme-marketing");
  });

  it("returns /:id when user has 1 team without a slug", () => {
    expect(
      getSmartRedirectLogic([{ id: "org-123", slug: null }])
    ).toBe("/org-123");
  });

  it("returns /teams when user has multiple teams", () => {
    expect(
      getSmartRedirectLogic([
        { id: "org-1", slug: "acme" },
        { id: "org-2", slug: "beta" },
      ])
    ).toBe("/teams");
  });

  it("returns /teams when user has more than 2 teams", () => {
    expect(
      getSmartRedirectLogic([
        { id: "org-1", slug: "a" },
        { id: "org-2", slug: "b" },
        { id: "org-3", slug: "c" },
      ])
    ).toBe("/teams");
  });
});
