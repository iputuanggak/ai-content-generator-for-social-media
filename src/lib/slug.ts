export const SLUG_DENYLIST = new Set([
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

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function sanitizeSlug(
  slug: string,
  existingSlugs: string[] = []
): string {
  let result = slug;

  if (SLUG_DENYLIST.has(result)) {
    result = `${result}-team`;
  }

  const slugSet = new Set(existingSlugs);
  if (!slugSet.has(result)) return result;

  let counter = 2;
  while (slugSet.has(`${slug}-${counter}`)) {
    counter++;
  }
  return `${slug}-${counter}`;
}
