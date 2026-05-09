/**
 * OpenRouter Client
 *
 * Accepts modelId, systemPrompt, userPrompt.
 * Calls the OpenRouter chat completions API.
 * Returns the generated text string.
 * API key is server-side only.
 */

export interface OpenRouterClientOptions {
  modelId: string;
  systemPrompt: string;
  userPrompt: string;
  /** Override fetch implementation (useful for testing) */
  fetchFn?: typeof fetch;
}

export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

export async function callOpenRouter({
  modelId,
  systemPrompt,
  userPrompt,
  fetchFn = fetch,
}: OpenRouterClientOptions): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new OpenRouterError("OPENROUTER_API_KEY environment variable is not set");
  }

  const response = await fetchFn("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new OpenRouterError(
      `OpenRouter API error: ${response.status} ${response.statusText}`,
      response.status
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new OpenRouterError("OpenRouter returned an empty response");
  }

  return content;
}
