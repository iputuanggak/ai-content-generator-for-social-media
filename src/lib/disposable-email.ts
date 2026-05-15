import { DISPOSABLE_EMAIL_DOMAINS } from "./disposable-email-domains";

/**
 * Extracts the domain portion from an email address.
 * Returns lowercase domain or empty string if no @ is found.
 */
export function extractEmailDomain(email: string): string {
  const atIndex = email.indexOf("@");
  if (atIndex === -1) return "";
  return email.slice(atIndex + 1).toLowerCase();
}

/**
 * Returns true if the email's domain is on the disposable email blocklist.
 */
export function isDisposableEmail(email: string): boolean {
  const domain = extractEmailDomain(email);
  if (!domain) return false;
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}
