import { describe, it, expect } from "vitest";
import { buildPrompts } from "../content-adapter";
import type { Platform, Tone } from "../content-adapter";

const PLATFORMS: Platform[] = [
  "twitter",
  "linkedin",
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "threads",
  "pinterest",
];

const TONES: Tone[] = ["professional", "casual", "humorous", "inspirational"];

describe("Content Adapter – buildPrompts", () => {
  it("returns a systemPrompt and userPrompt for every platform × tone combination", () => {
    for (const platform of PLATFORMS) {
      for (const tone of TONES) {
        const result = buildPrompts("AI trends", tone, "", platform);
        expect(result.systemPrompt, `${platform}/${tone} systemPrompt`).toBeTruthy();
        expect(result.userPrompt, `${platform}/${tone} userPrompt`).toBeTruthy();
      }
    }
  });

  it("includes the platform name in the system prompt", () => {
    for (const platform of PLATFORMS) {
      const { systemPrompt } = buildPrompts("topic", "casual", "", platform);
      expect(systemPrompt.toLowerCase()).toContain(platform);
    }
  });

  it("includes the topic in the user prompt", () => {
    const { userPrompt } = buildPrompts("climate change", "professional", "", "twitter");
    expect(userPrompt).toContain("climate change");
  });

  it("includes brand voice in the system prompt when provided", () => {
    const { systemPrompt } = buildPrompts("topic", "casual", "bold and witty", "linkedin");
    expect(systemPrompt).toContain("bold and witty");
  });

  it("does not include brand voice section when brand voice is empty", () => {
    const { systemPrompt } = buildPrompts("topic", "casual", "", "twitter");
    expect(systemPrompt).not.toContain("Brand Voice:");
  });

  it("includes tone instruction in the system prompt", () => {
    const { systemPrompt: professional } = buildPrompts("topic", "professional", "", "twitter");
    expect(professional).toContain("professional");

    const { systemPrompt: humorous } = buildPrompts("topic", "humorous", "", "twitter");
    expect(humorous).toContain("witty");
  });
});
