/**
 * Generation Service
 *
 * Orchestrates the full content generation event:
 * 1. Reads Brand Settings from the database
 * 2. Calls Content Adapter per platform to build prompt pairs
 * 3. Calls OpenRouter Client concurrently for all platforms
 * 4. Persists Generation record + PlatformOutput rows to Neon
 * 5. Returns the full result
 */

import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { brandSettings, generation, platformOutput } from "@/lib/db/schema";
import { buildPrompts, type Platform, type Tone } from "@/lib/content-adapter";
import { callOpenRouter, type OpenRouterClientOptions } from "@/lib/openrouter-client";

export interface GenerateContentInput {
  organizationId: string;
  memberId: string;
  topic: string;
  tone: Tone;
  intendedPublishAt?: Date;
}

export interface PlatformOutputResult {
  platform: Platform;
  content: string;
}

export interface GenerationResult {
  generationId: string;
  organizationId: string;
  topic: string;
  tone: Tone;
  platformOutputs: PlatformOutputResult[];
}

/** Injectable dependencies for testing */
export interface GenerationServiceDeps {
  dbClient?: typeof db;
  openRouterFetch?: OpenRouterClientOptions["fetchFn"];
}

export async function generateContent(
  input: GenerateContentInput,
  deps: GenerationServiceDeps = {}
): Promise<GenerationResult> {
  const dbClient = deps.dbClient ?? db;

  // 1. Read Brand Settings
  const settings = await dbClient
    .select()
    .from(brandSettings)
    .where(eq(brandSettings.organizationId, input.organizationId))
    .limit(1);

  if (settings.length === 0) {
    throw new Error(`Brand settings not found for organization ${input.organizationId}`);
  }

  const brandSetting = settings[0];
  const activePlatforms = brandSetting.activePlatforms as Platform[];
  const modelId = brandSetting.modelId;
  const brandVoice = brandSetting.brandVoice;

  // 2. Build prompt pairs per platform
  const promptPairs = activePlatforms.map((platform) =>
    buildPrompts(input.topic, input.tone, brandVoice, platform)
  );

  // 3. Call OpenRouter concurrently for all platforms
  const generatedTexts = await Promise.all(
    promptPairs.map((pair, i) =>
      callOpenRouter({
        modelId,
        systemPrompt: pair.systemPrompt,
        userPrompt: pair.userPrompt,
        fetchFn: deps.openRouterFetch,
      })
    )
  );

  // 4. Persist Generation record
  const generationId = randomUUID();
  const now = new Date();

  await dbClient.insert(generation).values({
    id: generationId,
    organizationId: input.organizationId,
    memberId: input.memberId,
    topic: input.topic,
    tone: input.tone,
    intendedPublishAt: input.intendedPublishAt ?? null,
    createdAt: now,
  });

  // 5. Persist PlatformOutput rows
  const platformOutputRows = activePlatforms.map((platform, i) => ({
    id: randomUUID(),
    generationId,
    platform,
    content: generatedTexts[i],
    editedContent: null,
    updatedAt: now,
  }));

  await dbClient.insert(platformOutput).values(platformOutputRows);

  return {
    generationId,
    organizationId: input.organizationId,
    topic: input.topic,
    tone: input.tone,
    platformOutputs: activePlatforms.map((platform, i) => ({
      platform,
      content: generatedTexts[i],
    })),
  };
}
