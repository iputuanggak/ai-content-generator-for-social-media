import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { callOpenRouter, OpenRouterError } from "../openrouter-client";

function makeResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: async () => body,
  } as Response;
}

const validResponse = {
  choices: [{ message: { content: "Generated content here." } }],
};

describe("OpenRouter Client – callOpenRouter", () => {
  const originalEnv = process.env.OPENROUTER_API_KEY;

  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "test-api-key";
  });

  afterEach(() => {
    process.env.OPENROUTER_API_KEY = originalEnv;
  });

  it("returns generated text on a successful response", async () => {
    const fetchFn = async () => makeResponse(validResponse);
    const result = await callOpenRouter({
      modelId: "google/gemini-2.5-flash",
      systemPrompt: "You are a writer.",
      userPrompt: "Write something.",
      fetchFn,
    });
    expect(result).toBe("Generated content here.");
  });

  it("sends correct Authorization header with API key", async () => {
    let capturedHeaders: HeadersInit | undefined;
    const fetchFn = async (_url: string | URL | Request, init?: RequestInit) => {
      capturedHeaders = init?.headers;
      return makeResponse(validResponse);
    };
    await callOpenRouter({
      modelId: "google/gemini-2.5-flash",
      systemPrompt: "sys",
      userPrompt: "usr",
      fetchFn,
    });
    expect((capturedHeaders as Record<string, string>)["Authorization"]).toBe(
      "Bearer test-api-key"
    );
  });

  it("throws OpenRouterError on 4xx response", async () => {
    const fetchFn = async () => makeResponse({ error: "bad request" }, 400);
    await expect(
      callOpenRouter({
        modelId: "google/gemini-2.5-flash",
        systemPrompt: "sys",
        userPrompt: "usr",
        fetchFn,
      })
    ).rejects.toBeInstanceOf(OpenRouterError);
  });

  it("throws OpenRouterError with statusCode on 4xx", async () => {
    const fetchFn = async () => makeResponse({ error: "not found" }, 404);
    await expect(
      callOpenRouter({
        modelId: "google/gemini-2.5-flash",
        systemPrompt: "sys",
        userPrompt: "usr",
        fetchFn,
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws OpenRouterError on 5xx response", async () => {
    const fetchFn = async () => makeResponse({ error: "server error" }, 500);
    await expect(
      callOpenRouter({
        modelId: "google/gemini-2.5-flash",
        systemPrompt: "sys",
        userPrompt: "usr",
        fetchFn,
      })
    ).rejects.toBeInstanceOf(OpenRouterError);
  });

  it("throws OpenRouterError if API key is missing", async () => {
    delete process.env.OPENROUTER_API_KEY;
    const fetchFn = async () => makeResponse(validResponse);
    await expect(
      callOpenRouter({
        modelId: "google/gemini-2.5-flash",
        systemPrompt: "sys",
        userPrompt: "usr",
        fetchFn,
      })
    ).rejects.toBeInstanceOf(OpenRouterError);
  });
});
