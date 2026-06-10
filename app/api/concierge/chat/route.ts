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
import { getInventory, summarizeInventory, findFabric, type Inventory } from "@/lib/inventorySummary";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

/** Tappable quick-pick options the widget shows under a clarifying message.
 *  Sebastian returns these instead of a recommendation when the brief is
 *  underspecified — the visitor taps an option to send it as their next
 *  message without typing. Keeps the conversation short and concrete. */
export type Clarification = {
  question: string;
  options: string[];
};

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
  // Real ERP SKU picked from the live in-stock list. When present the
  // widget can deep-link the customizer to skip the fabric step entirely
  // and land the visitor on the cloth they've already been recommended.
  fabric_sku?: string;
  // Enrichments stitched on server-side from the matched inventory row
  // so the widget's card can show the real ERP product photo, brand,
  // and price the customer will actually see at checkout.
  fabric_image?: string;
  fabric_brand?: string;
  fabric_price?: string;
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
1. If the brief is ambiguous in any single dimension (occasion, climate, formality, colour), ask ONE short clarifying question — never two — AND return a clarify block with 2 to 4 tappable options so the visitor can answer with a tap.
2. When you have enough, recommend one garment + tier with a one-line rationale naming a real mill or cloth weight from the LIVE INVENTORY section below.
3. ALWAYS append exactly ONE fenced JSON block AFTER your prose. The block is either a recommendation OR a clarification — never both, never neither.

When you have enough info, output the recommendation shape:

\`\`\`json
{
  "category": "suit" | "jacket" | "shirt" | "trouser",
  "tier": "essential" | "signature" | "bespoke",
  "occasion": "business" | "wedding" | "black-tie" | "party" | "travel" | "casual" | "first-commission",
  "fabric_hint": "short phrase describing the cloth — brand + composition + colour",
  "fabric_sku": "the SKU number copied verbatim from the LIVE INVENTORY list",
  "match": 78,
  "rationale": "One sentence reason naming the actual mill/cloth weight you picked."
}
\`\`\`

When you need ONE more piece of info, output the clarification shape instead:

\`\`\`json
{
  "clarify": {
    "question": "Short, direct version of the question you just asked in prose.",
    "options": ["Two to four short tappable answers, no full sentences", "Around 2 to 5 words each"]
  }
}
\`\`\`

CLARIFY RULES
- 2, 3, or 4 options. Never 1, never more than 4.
- Each option must be a complete answer the visitor could literally tap to send — e.g. "Navy", "Office daily", "Black tie". Not a question.
- Never ask the same dimension twice. If you already asked about colour and now know it, move on.
- Prefer concrete chips (named colours, named occasions, named climates) over abstractions.

LIVE INVENTORY RULES
- The "fabric_sku" MUST come from the LIVE INVENTORY block below — copy the digits exactly as they appear after "SKU ".
- The "fabric_hint" MUST describe the SAME cloth you put in "fabric_sku" — never invent a mill or composition that isn't in the list for that category.
- If the matching category in LIVE INVENTORY shows "(no stock — use ...)", use that ATELIER-<CAT> placeholder as the fabric_sku and explain the customer will finalise the cloth at the fitting.

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

  // Pull the live ERP inventory for the four active garments and stitch it
  // into a second system message. We derive the base URL from the request
  // host so the same code works on prod and preview deploys without env.
  // The raw inventory map is also kept around so we can attach the matched
  // fabric's photo + brand + price to the recommendation after the LLM
  // returns its choice.
  const origin = new URL(req.url).origin;
  let inventoryBlock = "";
  let inventory: Inventory | null = null;
  try {
    inventory = await getInventory(origin);
    inventoryBlock = `LIVE INVENTORY (refreshed per request):\n\n${summarizeInventory(inventory)}`;
  } catch {
    // Inventory failures are non-fatal — the model still answers in
    // generic mill terms; the customer can pick cloth at the fitting.
    inventoryBlock = "LIVE INVENTORY: temporarily unavailable. Recommend ATELIER placeholders and explain the customer will pick cloth at the fitting.";
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
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: inventoryBlock },
          ...messages,
        ],
        max_tokens: 460,
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

    // Extract the optional ```json {...} ``` block. It carries either a
    // structured recommendation (when the model is ready to commit) or a
    // clarification (when one more piece of info is needed). We tell the
    // two apart by which fields are present.
    let recommendation: Recommendation | null = null;
    let clarify: Clarification | null = null;
    const match = raw.match(/```json\s*([\s\S]*?)\s*```/);
    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed && typeof parsed === "object") {
          if (typeof parsed.category === "string") {
            recommendation = parsed as Recommendation;
          } else if (
            parsed.clarify &&
            typeof parsed.clarify === "object" &&
            typeof parsed.clarify.question === "string" &&
            Array.isArray(parsed.clarify.options)
          ) {
            // Trust the model's options but normalise / cap defensively.
            const options = parsed.clarify.options
              .filter((s: unknown): s is string => typeof s === "string")
              .map((s: string) => s.trim())
              .filter((s: string) => s.length > 0)
              .slice(0, 4);
            if (options.length >= 2) {
              clarify = { question: parsed.clarify.question.trim(), options };
            }
          }
        }
      } catch {
        /* Bot returned malformed JSON — drop the structured block, keep the prose. */
      }
    }

    // Stitch the matched ERP product photo, brand and price onto the
    // recommendation so the widget can render the cloth the model named
    // (not a generic stock photo, not the wrong garment). We only enrich
    // when the model returned a real numeric SKU — placeholder SKUs like
    // ATELIER-TROUSER intentionally stay image-less so the card honestly
    // signals "no stock, finalised at fitting".
    if (recommendation?.fabric_sku && inventory && !recommendation.fabric_sku.startsWith("ATELIER-")) {
      const hit = findFabric(inventory, recommendation.fabric_sku);
      if (hit) {
        if (hit.fabric.image) recommendation.fabric_image = hit.fabric.image;
        if (hit.fabric.brand && hit.fabric.brand !== "Missing value") {
          recommendation.fabric_brand = hit.fabric.brand;
        }
        if (hit.fabric.price && hit.fabric.price !== "Missing value") {
          recommendation.fabric_price = hit.fabric.price;
        }
      }
    }

    const reply = raw.replace(/```json[\s\S]*?```/g, "").trim();
    return NextResponse.json({ reply: reply || FALLBACK_REPLY, recommendation, clarify });
  } catch (err) {
    console.error("[concierge] fetch threw", err);
    return NextResponse.json({ reply: FALLBACK_REPLY }, { status: 200 });
  }
}
