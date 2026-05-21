/**
 * Content Adapter
 *
 * Pure function — no I/O dependencies.
 * Accepts topic, tone, brand voice, and a platform identifier.
 * Returns a { systemPrompt, userPrompt } pair tailored to that platform.
 */

export type Platform =
  | "twitter"
  | "linkedin"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "threads"
  | "pinterest";

export type Tone = "professional" | "casual" | "humorous" | "inspirational";

export const PLATFORM_LABELS: Record<Platform, string> = {
  twitter: "Twitter / X",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  threads: "Threads",
  pinterest: "Pinterest",
};

export const PLATFORM_OPTIONS: { value: Platform; label: string }[] = [
  { value: "twitter", label: "Twitter / X" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "threads", label: "Threads" },
  { value: "pinterest", label: "Pinterest" },
];

export const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "humorous", label: "Humorous" },
  { value: "inspirational", label: "Inspirational" },
];

export const MODEL_OPTIONS: { group: string; models: { value: string; label: string }[] }[] = [
  {
    group: "Google",
    models: [
      { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { value: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash" },
    ],
  },
  {
    group: "OpenAI",
    models: [
      { value: "openai/gpt-4.1-mini", label: "GPT-4.1 Mini" },
      { value: "openai/gpt-4.1-nano", label: "GPT-4.1 Nano" },
    ],
  },
  {
    group: "Anthropic",
    models: [
      { value: "anthropic/claude-3.5-haiku", label: "Claude 3.5 Haiku" },
      { value: "anthropic/claude-3-haiku", label: "Claude 3 Haiku" },
    ],
  },
];

const VALID_MODEL_IDS = new Set(
  MODEL_OPTIONS.flatMap((g) => g.models.map((m) => m.value))
);

export function isValidModelId(id: string): boolean {
  return VALID_MODEL_IDS.has(id);
}

export interface PromptPair {
  systemPrompt: string;
  userPrompt: string;
}

const platformGuides: Record<Platform, { limits: string; norms: string }> = {
  twitter: {
    limits: "Maximum 280 characters.",
    norms:
      "Short, punchy, conversational. May include 1-2 relevant hashtags. No corporate jargon.",
  },
  linkedin: {
    limits: "Optimal 150-300 words. Maximum 3000 characters.",
    norms:
      "Professional tone, structured paragraphs, insight-driven. May end with a call to action or question. Hashtags optional (2-3 max).",
  },
  instagram: {
    limits: "Caption up to 2200 characters; first 125 chars shown before 'more'.",
    norms:
      "Engaging hook in the first line, storytelling style, 5-10 relevant hashtags at the end.",
  },
  facebook: {
    limits: "Optimal 40-80 words. Up to 63,206 characters allowed.",
    norms:
      "Conversational and community-focused. Encourages engagement (likes, shares, comments). May include a question.",
  },
  tiktok: {
    limits: "Caption up to 2200 characters.",
    norms:
      "Trendy, energetic, Gen-Z-friendly language. Reference video/visual content. 3-5 trending hashtags.",
  },
  youtube: {
    limits: "Description: 100-200 words for SEO. Maximum 5000 characters.",
    norms:
      "SEO-optimised, structured. First 2-3 sentences serve as the teaser. May include timestamps or links placeholder. Call to action (subscribe, like).",
  },
  threads: {
    limits: "Maximum 500 characters.",
    norms:
      "Conversational, opinion-forward, community-driven. Similar to Twitter but slightly longer. No hashtags needed.",
  },
  pinterest: {
    limits: "Pin description: 100-500 characters optimal.",
    norms:
      "Inspirational, visually descriptive, keyword-rich for discoverability. Focuses on ideas, DIY, or lifestyle. May include a call to action.",
  },
};

const toneInstructions: Record<Tone, string> = {
  professional:
    "Use a professional, authoritative tone. Write clearly and confidently. Avoid slang or overly casual language.",
  casual:
    "Use a friendly, relaxed tone. Write as if talking to a friend. Keep it light and approachable.",
  humorous:
    "Use a witty, playful tone. Include light humour, wordplay, or a clever twist. Keep it fun without being offensive.",
  inspirational:
    "Use an uplifting, motivational tone. Inspire the reader with powerful language, calls to action, and positive energy.",
};

export function buildPrompts(
  topic: string,
  tone: Tone,
  brandVoice: string,
  platform: Platform
): PromptPair {
  const guide = platformGuides[platform];
  const toneInstruction = toneInstructions[tone];

  const brandVoiceSection = brandVoice.trim()
    ? `\n\nBrand Voice: ${brandVoice.trim()}`
    : "";

  const systemPrompt =
    `You are a social media content writer specialising in ${platform} content.` +
    `\n\nPlatform constraints: ${guide.limits}` +
    `\n\nPlatform norms: ${guide.norms}` +
    `\n\nTone instruction: ${toneInstruction}` +
    brandVoiceSection +
    `\n\nWrite ONLY the post content. Do not include any explanation, preamble, or metadata.`;

  const userPrompt = `Write a ${platform} post about the following topic: ${topic}`;

  return { systemPrompt, userPrompt };
}
