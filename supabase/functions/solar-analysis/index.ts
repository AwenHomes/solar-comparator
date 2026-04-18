// Solar proposal analysis proxy.
//
// Sits between the browser and the Anthropic API so the API key stays server-side
// (it would otherwise be baked into the built JS bundle). Accepts a small array
// of proposal summaries, calls Claude, returns a friendly write-up as plain text.
//
// JWT verification is disabled at the gateway level because the project uses
// publishable keys (sb_publishable_...), which are not JWTs. The function is
// still protected by per-IP rate limiting and strict input validation below.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk@^0.88.0";

const SYSTEM_PROMPT = `You are a friendly, knowledgeable solar energy advisor helping a homeowner compare solar proposals. You are NOT selling anything — give them honest, clear analysis.

Write a clear, friendly analysis covering:
1. Each proposal's strengths and weaknesses (2-3 sentences each)
2. Key differences to pay attention to (price per watt, loan costs, battery, production)
3. Red flags or hidden costs (high interest, missing battery, unrealistic production)
4. Your honest recommendation on best overall value
5. Questions they should ask each company before signing

Tone: warm, conversational — like a smart neighbor who knows solar. Plain language. No bullet points — flowing paragraphs. Under 500 words.`;

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function checkRate(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_LIMIT_MAX) return false;
  bucket.count += 1;
  return true;
}

function validateSummaries(value: unknown): value is Record<string, unknown>[] {
  if (!Array.isArray(value)) return false;
  if (value.length < 1 || value.length > 3) return false;
  return value.every((v) => v !== null && typeof v === "object" && !Array.isArray(v));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY not configured");
    return json(503, { error: "Service not configured" });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRate(ip)) return json(429, { error: "Rate limit exceeded" });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const summaries = (body as { summaries?: unknown })?.summaries;
  if (!validateSummaries(summaries)) {
    return json(400, { error: "summaries must be an array of 1-3 objects" });
  }

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Proposals:\n\n${JSON.stringify(summaries, null, 2)}`,
        },
      ],
    });

    const text = message.content
      .filter((block): block is { type: "text"; text: string } => block.type === "text")
      .map((block) => block.text)
      .join("");

    return json(200, { text });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      console.error("Anthropic rate limit:", err.message);
      return json(503, { error: "Upstream busy, try again shortly" });
    }
    if (err instanceof Anthropic.AuthenticationError) {
      console.error("Anthropic auth failed:", err.message);
      return json(500, { error: "Service misconfigured" });
    }
    if (err instanceof Anthropic.APIError) {
      console.error("Anthropic API error:", err.status, err.message);
      return json(502, { error: "Upstream error" });
    }
    console.error("Unexpected error:", err);
    return json(502, { error: "Upstream error" });
  }
});
