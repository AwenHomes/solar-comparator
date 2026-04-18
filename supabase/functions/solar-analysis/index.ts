// Solar proposal analysis proxy.
//
// Sits between the browser and the Anthropic API so the API key stays
// server-side (it would otherwise be baked into the built JS bundle).
// Accepts a structured payload — userInfo, existingProposals, findings —
// and asks Claude to narrate the critical analysis AND recommend the best
// of the submitted proposals. Claude never invents kW / $ / IRR values for
// Awen's proposal: the real numeric build happens downstream on Powur and
// the browser only surfaces a directional preview after lead capture.
//
// JWT verification is disabled at the gateway level because the project
// uses publishable keys (sb_publishable_...), which are not JWTs. The
// function is still protected by per-IP rate limiting and input validation.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk@^0.88.0";

const SYSTEM_PROMPT = `You are a senior solar analyst writing for a homeowner who has submitted 2-3 competitor solar proposals. You will receive a JSON payload with three keys:

- userInfo: state, ZIP, utility rate, net-metering policy, monthly bill, and 0-1 priority weights (cost, payback, reliability, sustainability).
- existingProposals: structured data for each competitor proposal with deterministic metrics already computed (price-per-watt, 25-yr savings, monthly payment, modeled annual production, etc.).
- findings: a pre-computed deterministic audit of each proposal. Possible findings include inflated production, weak warranty, suboptimal orientation/tilt, high APR, lease/PPA financing, missing battery in reduced-net-metering states, missing federal ITC, missing state incentives, and no production guarantee.

RULES:
- Do NOT invent numbers. Only reference figures present in the payload.
- Do NOT describe Awen's proposal in numeric terms. No kW, no dollar amounts, no IRR, no payback years for Awen. Awen's formal proposal is built post-session on the Powur platform; here you speak only directionally about what it would IMPROVE.
- Tone: warm, honest, plain-language — like a smart neighbor who actually knows solar. Flowing prose, not bullet points.

Write three sections separated by the line "---" (three hyphens on their own line). Each section is 80-120 words.

Section 1 — Critical Analysis: Walk through the findings for each proposal, ordered most-severe-first, grounding every point in numbers from the payload.

Section 2 — Best Existing Proposal (given the user's weights): Pick ONE explicitly and explain why, leaning on the weights the user provided. If all proposals have significant gaps, say so honestly and explain which one is the least-bad given those weights.

Section 3 — Stronger Alternative, Directionally: Describe in plain language how a right-sized, properly-tilted, warranty-backed, ownership-based system would address the specific findings you named in section 1. Close with ONE sentence inviting the homeowner to request Awen's formal Powur-built proposal. Still no numeric claims about Awen.`;

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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validatePayload(body: unknown): {
  ok: boolean;
  error?: string;
  userInfo?: Record<string, unknown>;
  existingProposals?: Record<string, unknown>[];
  findings?: Record<string, unknown>[];
} {
  if (!isPlainObject(body)) return { ok: false, error: "Body must be an object" };

  // Back-compat shim: legacy clients posted { summaries }. Treat that as
  // existingProposals with empty userInfo/findings so the endpoint keeps
  // working while older bundles are in the wild.
  if (Array.isArray((body as any).summaries) && !(body as any).existingProposals) {
    const summaries = (body as { summaries: unknown }).summaries as unknown[];
    if (summaries.length < 1 || summaries.length > 3) {
      return { ok: false, error: "summaries must be 1-3 entries" };
    }
    if (!summaries.every(isPlainObject)) {
      return { ok: false, error: "summaries entries must be objects" };
    }
    return {
      ok: true,
      userInfo: {},
      existingProposals: summaries as Record<string, unknown>[],
      findings: [],
    };
  }

  const userInfo = (body as any).userInfo;
  const existingProposals = (body as any).existingProposals;
  const findings = (body as any).findings;

  if (!isPlainObject(userInfo)) return { ok: false, error: "userInfo must be an object" };
  if (!Array.isArray(existingProposals)) return { ok: false, error: "existingProposals must be an array" };
  if (existingProposals.length < 1 || existingProposals.length > 3) {
    return { ok: false, error: "existingProposals must have 1-3 entries" };
  }
  if (!existingProposals.every(isPlainObject)) {
    return { ok: false, error: "existingProposals entries must be objects" };
  }
  if (findings !== undefined && !Array.isArray(findings)) {
    return { ok: false, error: "findings must be an array when provided" };
  }
  if (Array.isArray(findings) && !findings.every(isPlainObject)) {
    return { ok: false, error: "findings entries must be objects" };
  }

  // Cheap size guard — refuse anything over ~64 KB serialized.
  try {
    if (JSON.stringify(body).length > 64 * 1024) {
      return { ok: false, error: "Payload too large" };
    }
  } catch {
    return { ok: false, error: "Payload not serializable" };
  }

  return {
    ok: true,
    userInfo: userInfo as Record<string, unknown>,
    existingProposals: existingProposals as Record<string, unknown>[],
    findings: (findings as Record<string, unknown>[] | undefined) ?? [],
  };
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

  const parsed = validatePayload(body);
  if (!parsed.ok) return json(400, { error: parsed.error });

  const client = new Anthropic({ apiKey });

  const userMessage = `PAYLOAD:\n\n${JSON.stringify(
    {
      userInfo: parsed.userInfo,
      existingProposals: parsed.existingProposals,
      findings: parsed.findings,
    },
    null,
    2,
  )}`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1400,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
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
