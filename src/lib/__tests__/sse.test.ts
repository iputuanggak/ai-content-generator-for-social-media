import { describe, it, expect, vi } from "vitest";
import { initSSE, sendSSEEvent, closeSSE } from "@/lib/sse";
import type { NextApiResponse } from "next";

function makeMockRes(): NextApiResponse & {
  _headers: Record<string, string>;
  _written: string[];
  _ended: boolean;
} {
  const mock = {
    _headers: {} as Record<string, string>,
    _written: [] as string[],
    _ended: false,
    setHeader(key: string, value: string) {
      mock._headers[key] = value;
    },
    flushHeaders: vi.fn(),
    write(chunk: string) {
      mock._written.push(chunk);
    },
    end() {
      mock._ended = true;
    },
  };
  return mock as unknown as ReturnType<typeof makeMockRes>;
}

describe("lib/sse", () => {
  it("initSSE sets correct headers and flushes", () => {
    const res = makeMockRes();
    initSSE(res);
    expect(res._headers["Content-Type"]).toBe("text/event-stream");
    expect(res._headers["Cache-Control"]).toBe("no-cache");
    expect(res._headers["Connection"]).toBe("keep-alive");
    expect(res.flushHeaders).toHaveBeenCalledOnce();
  });

  it("sendSSEEvent writes a data frame with JSON payload", () => {
    const res = makeMockRes();
    sendSSEEvent(res, { platform: "twitter", content: "hello" });
    expect(res._written).toHaveLength(1);
    expect(res._written[0]).toBe(
      `data: ${JSON.stringify({ platform: "twitter", content: "hello" })}\n\n`
    );
  });

  it("closeSSE writes [DONE] sentinel and ends response", () => {
    const res = makeMockRes();
    closeSSE(res);
    expect(res._written).toContain("data: [DONE]\n\n");
    expect(res._ended).toBe(true);
  });

  it("sendSSEEvent serialises error objects correctly", () => {
    const res = makeMockRes();
    sendSSEEvent(res, { error: "Generation failed" });
    expect(res._written[0]).toContain('"error":"Generation failed"');
  });
});
