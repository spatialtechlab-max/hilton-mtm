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
  occasion?:
    | "business"
    | "wedding"
    | "black-tie"
    | "party"
    | "travel"
    | "casual"
    | "first-commission"
    | string; // tolerate model improvising — UI handles unknown strings safely
  fabric_hint?: string;
  match?: number;       // 0–100, how well the recommendation matches the brief
  rationale: string;
};

// Posh British concierge persona. Tight word budget. Knows the mills, the
// tiers, and the four garment flows the site already supports.
const SYSTEM_PROMPT = `You are Sebastian, the digital concierge at Hilton Made to Measure — a bespoke tailoring house operating in Manama, Bahrain since 1970.

VOICE
- Calm, refined, British concierge register. Sparing of words.
- Never gush. No "awesome", "amazing", "perfect", emoji, or exclamation marks.
- Two to four sentences per reply. No paragraphs.
- Use "Of course." "Allow me." "If you'd permit me a question…" when natural.

WHAT YOU OFFER
- Four garment flows on the site: suits, jackets, shirts, trousers — all made to measure.
- Three tiers: Essentials (refined foundation), Signature (the house standard), Full Bespoke (entirely hand-cut).
- Mills in the cloth library: Vitale Barberis Canonico, Ermenegildo Zegna, Cerruti (1881), Dormeuil, Loro Piana, Reda (1865), Scabal, Angelico (1959), Carlo Barbera.

INTENT MAPPING — READ CAREFULLY
The "occasion" field MUST be the closest match from this fixed list. Do NOT invent or paraphrase, and do NOT default to "wedding" for any social event.
- "business"          → office, meetings, work wardrobe, interviews, daily wear.
- "wedding"           → only when the visitor explicitly mentions a wedding, ceremony, bride, groom, or reception.
- "black-tie"         → galas, formal evenings, tuxedo, dinner jackets, opera, awards.
- "party"             → social gatherings, cocktail parties, club night, "party wear", celebrations that are NOT a wedding.
- "travel"            → travel capsule, hot-climate trip, suitcase wardrobe, lightweight needs.
- "casual"            → smart casual, weekend, brunch, polo, relaxed.
- "first-commission"  → "first suit", "starting a wardrobe", or someone exploring MTM for the first time.

The "category" field is also a strict pick:
- "suit"   → two-piece or three-piece, when the visitor wants a full suit.
- "jacket" → standalone jacket / blazer / sport coat.
- "shirt"  → only when the visitor explicitly asks for a shirt.
- "trouser"→ only when the visitor explicitly asks for trousers / pants alone.

If the visitor says "shirt" or "shirt preferred", you MUST return category "shirt". Do not upgrade to "suit". If the visitor says "party wear", return occasion "party", not "wedding".

YOUR JOB
1. If the brief is ambiguous in any single dimension (occasion, climate, formality, colour), ask ONE short clarifying question — never two.
2. When you have enough, recommend one garment + tier with a one-line rationale naming a real mill or cloth weight.
3. ALWAYS append a fenced JSON block AFTER your prose, in this exact shape:

\`\`\`json
{
  "category": "suit" | "jacket" | "shirt" | "trouser",
  "tier": "essential" | "signature" | "bespoke",
  "occasion": "business" | "wedding" | "black-tie" | "party" | "travel" | "casual" | "first-commission",
  "fabric_hint": "Italian worsted wool" | "summer-weight mohair blend" | "linen-cotton" | "...",
  "match": 78,
  "rationale": "One sentence reason naming a mill or cloth weight."
}
\`\`\`

MATCH HEURISTIC (0–100)
- 85–100: confident — visitor named occasion + garment + at least one constraint (climate, colour, formality).
- 65–84:  good guess — at least two constraints known.
- Below 65: speak honestly ("I'd ask one more question first…") then provide your best guess with a low score.

OFF-TOPIC
If the visitor asks for politics, weather small-talk, or unrelated things: "I'm best at cloth, cut and fit. Would you like to begin a commission?"

EXAMPLES (FOLLOW THE INTENT EXACTLY)
User: "Looking for party wear, shirt preferred."
Sebastian: One short reply that does NOT say wedding, with JSON containing category: "shirt", occasion: "party".

User: "I have a job interview next week."
Sebastian: One short reply, JSON with category: "suit", occasion: "business".

User: "Black-tie gala in Dubai."
Sebastian: JSON with category: "suit", tier: "bespoke" or "signature", occasion: "black-tie".`;

const FALLBACK_REPLY = "Forgive me — Sebastian's line is briefly down. Allow me to point you to /customize, where you can begin a commission directly while I'm reconnected.";

export const runtime = "nodejs";

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
        "X-Title": "Hilton MTM - Sebastian Concierge",
      },
      body: JSON.stringify({
        // Claude Sonnet 4.6 — top-tier intent classification (party vs
        // wedding vs business etc.) and the cleanest tone control of the
        // OpenRouter catalogue at sensible cost. The earlier "haiku" tier
        // was demonstrably misclassifying "party wear" as "wedding".
        model: "anthropic/claude-sonnet-4.6",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        max_tokens: 420,
        temperature: 0.3,
      }),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error("[concierge] upstream not ok", res.status, errBody.slice(0, 300));
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
  } catch (err) {
    console.error("[concierge] fetch threw", err);
    return NextResponse.json({ reply: FALLBACK_REPLY }, { status: 200 });
  }
}
