import type { NextApiResponse } from "next";

/**
 * Initialises Server-Sent Events headers on the response.
 * Call once before writing any events.
 */
export function initSSE(res: NextApiResponse): void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
}

/**
 * Writes a single SSE `data:` frame with JSON-serialised payload.
 */
export function sendSSEEvent(res: NextApiResponse, payload: unknown): void {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

/**
 * Sends the terminal `[DONE]` sentinel and closes the stream.
 */
export function closeSSE(res: NextApiResponse): void {
  res.write("data: [DONE]\n\n");
  res.end();
}
