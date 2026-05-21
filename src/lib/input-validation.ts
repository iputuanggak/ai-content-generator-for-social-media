export const MAX_TOPIC_LENGTH = 500;
export const MAX_BRAND_VOICE_LENGTH = 2000;
export const MAX_EDITED_CONTENT_LENGTH = 5000;

export function validateLength(field: string, value: string, max: number): string | null {
  if (value.length > max) {
    return `${field} must be at most ${max} characters`;
  }
  return null;
}
