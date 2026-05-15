import { auth } from "@/lib/auth";
import { isDisposableEmail } from "@/lib/disposable-email";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Server-side guard: block disposable emails on sign-up
  if (req.method === "POST" && req.url?.includes("/sign-up/email")) {
    const email: string | undefined = req.body?.email;
    if (email && isDisposableEmail(email)) {
      res.status(422).json({
        error: "DISPOSABLE_EMAIL",
        message: "This email provider is not supported. Please use a permanent email address.",
      });
      return;
    }
  }

  // Convert Next.js Pages Router request to a standard Request object
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }
  }

  let body: BodyInit | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = JSON.stringify(req.body);
    headers.set("content-type", "application/json");
  }

  const request = new Request(url.toString(), {
    method: req.method,
    headers,
    body,
  });

  const response = await auth.handler(request);

  res.status(response.status);
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  const responseBody = await response.text();
  if (responseBody) {
    res.send(responseBody);
  } else {
    res.end();
  }
}
