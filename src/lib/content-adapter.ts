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
