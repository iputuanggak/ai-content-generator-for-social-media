/**
 * Generation Service
 *
 * Orchestrates the full content generation event:
 * 1. Reads Brand Settings from the database
 * 2. Inserts the Generation record (before any LLM calls so streaming can reference it)
 * 3. Calls Content Adapter per platform to build prompt pairs
 * 4. Calls OpenRouter Client concurrently for all platforms
 * 5. Persists each PlatformOutput row as it completes, then fires onPlatformOutput
 * 6. Returns the full result
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
  /**
   * Called as each platform output is persisted to the database.
   * Use this hook to stream results to the client (e.g. via SSE) as they arrive.
   */
  onPlatformOutput?: (result: {
    platform: Platform;
    content: string;
    platformOutputId: string;
    generationId: string;
  }) => void;
}

export interface PlatformOutputResult {
  platformOutputId: string;
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

  // 2. Insert generation record first so the ID is available for streaming
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

  // 3. Generate concurrently; persist each output as it arrives and notify via callback
  const platformOutputResults: PlatformOutputResult[] = [];

  await Promise.all(
    activePlatforms.map(async (platform) => {
      const { systemPrompt, userPrompt } = buildPrompts(
        input.topic,
        input.tone,
        brandVoice,
        platform
      );

      const content = await callOpenRouter({
        modelId,
        systemPrompt,
        userPrompt,
        fetchFn: deps.openRouterFetch,
      });

      const platformOutputId = randomUUID();

      await dbClient.insert(platformOutput).values({
        id: platformOutputId,
        generationId,
        platform,
        content,
        editedContent: null,
        updatedAt: new Date(),
      });

      input.onPlatformOutput?.({ platform, content, platformOutputId, generationId });

      platformOutputResults.push({ platformOutputId, platform, content });
    })
  );

  return {
    generationId,
    organizationId: input.organizationId,
    topic: input.topic,
    tone: input.tone,
    platformOutputs: platformOutputResults,
  };
}
