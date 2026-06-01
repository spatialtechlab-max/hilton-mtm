/**
 * Sebastian — the Hilton MTM concierge.
 *
 * Proxies the browser's chat turn to OpenRouter so the API key never reaches
 * the client bundle, and post-processes the reply to extract the optional
 * recommendation JSON block (which the widget converts into a "take me to
 * the customizer" card). Falls back to a sensible canned reply on error so
 * the bot never goes silent in front of a customer.
 */
import { NextResponse } from "next/server";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

export type Recommendation = {
  category: "suit" | "jacket" | "shirt" | "trouser";
  tier?: "essential" | "signature" | "bespoke";
  occasion?: string;
  fabric_hint?: string;
  match?: number;       // 0–100, how well the recommendation matches the brief
  rationale: string;
};

// Posh British concierge persona. Tight word budget. Knows the mills, the
// tiers, and the four garment flows the site already supports.
const SYSTEM_PROMPT = `You are Sebastian, the digital concierge at Hilton Made to Measure — a bespoke tailoring house operating in Manama, Bahrain since 1970.

Voice:
- Calm, refined, British concierge register. Sparing of words.
- Never gush. No "awesome", "amazing", emoji, or exclamation marks beyond the rare one.
- Address the visitor as "you", referring to yourself as Sebastian when natural.
- Two to four sentences per reply. No paragraphs.
- Use "Of course." "A wise choice." "Allow me." "If you'd permit me a question…" when natural.

What you know:
- The house works in suits, jackets, shirts, and trousers, made to measure.
- Three tiers: Essentials (refined foundation), Signature (the house standard), Full Bespoke (entirely hand-cut).
- Mill partners on the cloth library: Vitale Barberis Canonico, Ermenegildo Zegna, Lanificio F.lli Cerruti (1881), Dormeuil, Loro Piana, Reda (1865), Scabal, Angelico (1959), Carlo Barbera.
- A signature commission begins at د.ب 1,400; Essentials at د.ب 1,000; Bespoke from د.ب 2,400.
- A two-piece signature suit takes 4–5 weeks and two fittings.

Your job:
1. Ask one short clarifying question if the brief is ambiguous (occasion, climate, formality).
2. Recommend a single garment + tier with a one-line rationale that names a real mill or cloth weight.
3. When you have enough to recommend, ALWAYS append a fenced JSON block in this exact format AFTER your prose. Keep the prose itself free of brackets and code fences.

\`\`\`json
{
  "category": "suit" | "jacket" | "shirt" | "trouser",
  "tier": "essential" | "signature" | "bespoke",
  "occasion": "wedding" | "business" | "black-tie" | "travel" | "first-commission" | "casual",
  "fabric_hint": "Italian worsted wool" | "summer-weight mohair blend" | "soft brushed flannel" | "linen-wool" | "...",
  "match": 78,
  "rationale": "One sentence reason naming a mill or cloth weight."
}
\`\`\`

Heuristics for match (0–100): how confident you are that this is the right thing for the brief you have so far. Below 60 means you should also ask one short follow-up. Above 80 means you're confident.

If the visitor asks something off-topic (politics, weather small-talk), politely steer back: "I'm best at cloth, cut and fit. Would you like to begin a commission?"`;

const FALLBACK_REPLY = "Forgive me — Sebastian's line is briefly down. Allow me to point you to /customize, where you can begin a commission directly while I'm reconnected.";

export const runtime = "nodejs";

// Debug GET — verifies the function is running with the right env shape
// without leaking the secret itself. Remove after sanity-check.
export async function GET() {
  const key = process.env.OPENROUTER_API_KEY ?? "";
  const probe = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://hilton-mtm-virid.vercel.app",
      "X-Title": "Hilton MTM probe",
    },
    body: JSON.stringify({
      model: "anthropic/claude-3.5-haiku",
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 6,
    }),
  }).catch((e) => ({ ok: false, status: 0, text: () => Promise.resolve(String(e)) } as Response));
  const status = (probe as Response).status;
  const ok = (probe as Response).ok;
  let body = "";
  try { body = await (probe as Response).text(); } catch { /* ignore */ }
  return NextResponse.json({
    keyShape: { len: key.length, head: key.slice(0, 12), tail: key.slice(-4) },
    upstream: { ok, status, body: body.slice(0, 400) },
  });
}

export async function POST(req: Request) {
  let messages: ChatMessage[] = [];
  try {
    const body = await req.json();
    messages = Array.isArray(body.messages) ? body.messages : [];
  } catch {
    return NextResponse.json({ reply: FALLBACK_REPLY }, { status: 400 });
  }
  // Trim runaway history so token cost stays bounded.
  if (messages.length > 16) messages = messages.slice(-16);

  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    return NextResponse.json({ reply: FALLBACK_REPLY }, { status: 500 });
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        // Surface the calling app to OpenRouter for usage analytics.
        "HTTP-Referer": "https://hilton-mtm-virid.vercel.app",
        "X-Title": "Hilton MTM — Sebastian Concierge",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-haiku",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        max_tokens: 360,
        temperature: 0.45,
      }),
      // Keep the request snappy — Sebastian should reply within a few seconds.
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) {
      return NextResponse.json({ reply: FALLBACK_REPLY }, { status: 200 });
    }
    const data = await res.json();
    const raw: string = data?.choices?.[0]?.message?.content ?? "";

    // Extract the optional ```json {...} ``` block as a structured recommendation.
    let recommendation: Recommendation | null = null;
    const match = raw.match(/```json\s*([\s\S]*?)\s*```/);
    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed && typeof parsed === "object" && typeof parsed.category === "string") {
          recommendation = parsed as Recommendation;
        }
      } catch {
        /* Bot returned malformed JSON — drop the recommendation, keep the prose. */
      }
    }
    const reply = raw.replace(/```json[\s\S]*?```/g, "").trim();
    return NextResponse.json({ reply: reply || FALLBACK_REPLY, recommendation });
  } catch {
    return NextResponse.json({ reply: FALLBACK_REPLY }, { status: 200 });
  }
}
