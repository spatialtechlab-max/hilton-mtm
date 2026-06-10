"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, X, RotateCcw, Sparkles, ArrowRight } from "lucide-react";
import type { Recommendation } from "@/app/api/concierge/chat/route";

/**
 * Sebastian — the floating Concierge widget.
 *
 * Compact bar at the bottom-right when closed. Click to expand into a chat
 * panel. The transcript ends with a recommendation card when the bot has
 * matched the brief; that card routes into the customizer with the right
 * garment + tier preselected.
 */

type Msg =
  | { role: "user"; content: string; id: string }
  | { role: "assistant"; content: string; id: string; rec?: Recommendation | null };

const GREETING: Msg = {
  id: "greeting",
  role: "assistant",
  content:
    "Good day. I'm Sebastian, your concierge. May I help you find a suit for an occasion, or guide you through your first commission?",
};

// Opening intent chips — light entry points so a visitor doesn't have to
// stare at a blank text box.
const INTENT_CHIPS = [
  "I'm getting married",
  "Business wardrobe",
  "Black tie",
  "Travel capsule",
  "My first commission",
  "Just browsing",
];

const CATEGORY_LABEL: Record<NonNullable<Recommendation["category"]>, string> = {
  suit: "Two-piece suit",
  jacket: "Standalone jacket",
  shirt: "Made-to-measure shirt",
  trouser: "Tailored trouser",
};

// Only the suit recommendation gets a photograph — the rest stay text-only
// (the user pointed out that pairing a "Made-to-measure shirt for party"
// with a shirting flat-lay reads as a generic stock photo, which is worse
// than no image at all). Keeping image surface scarce makes each photo
// feel earned.
const CATEGORY_IMG: Partial<Record<NonNullable<Recommendation["category"]>, string>> = {
  suit: "/atelier/showroom-double-breasted.jpg",
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function Concierge() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [hint, setHint] = useState(true); // small "How may I dress you?" prompt on the closed bar
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // Stick the scroll to the bottom whenever the transcript grows.
  useEffect(() => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [messages, thinking, open]);

  // After 12s of inactivity, the closed-state prompt fades away so it
  // doesn't yell at the visitor while they read the page.
  useEffect(() => {
    if (!hint) return;
    const t = setTimeout(() => setHint(false), 12_000);
    return () => clearTimeout(t);
  }, [hint]);

  async function send(userText: string) {
    const trimmed = userText.trim();
    if (!trimmed || thinking) return;
    const userMsg: Msg = { id: uid(), role: "user", content: trimmed };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setDraft("");
    setThinking(true);
    try {
      // Send only role + content to the API — strip ids and recommendation
      // metadata that only the UI cares about.
      const payload = nextHistory
        .filter((m) => m.role !== "assistant" || m.id !== "greeting")
        .map(({ role, content }) => ({ role, content }));
      const res = await fetch("/api/concierge/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payload }),
      });
      const data = (await res.json()) as { reply: string; recommendation?: Recommendation | null };
      setMessages((m) => [
        ...m,
        { id: uid(), role: "assistant", content: data.reply, rec: data.recommendation ?? null },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "assistant",
          content:
            "Forgive me — I lost the line for a moment. Could you say that again?",
        },
      ]);
    } finally {
      setThinking(false);
    }
  }

  function restart() {
    setMessages([GREETING]);
    setDraft("");
    setThinking(false);
  }

  function takeMeThere(rec: Recommendation) {
    const params = new URLSearchParams({ category: rec.category });
    if (rec.tier) params.set("tier", rec.tier);
    // Real ERP SKUs deep-link the customer to the spec step of the
    // customizer with the cloth Sebastian picked already selected.
    // ATELIER-* placeholders (no-stock fallback) are dropped — sending
    // them would land on a non-existent fabric tile.
    if (rec.fabric_sku && !rec.fabric_sku.startsWith("ATELIER-")) {
      params.set("sku", rec.fabric_sku);
    }
    router.push(`/customize?${params.toString()}`);
    setOpen(false);
  }

  // Burgundy/ivory palette to match the brand. The whole widget lives in a
  // single fixed-position container so layouts elsewhere never have to know
  // about it.
  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.aside
            key="panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[60] w-[min(92vw,400px)] h-[min(78vh,640px)] flex flex-col bg-[var(--color-ivory-100)] border border-black/10 shadow-2xl shadow-black/15"
            role="dialog"
            aria-label="Sebastian, the Hilton MTM concierge"
          >
            {/* Header */}
            <header className="flex items-center gap-3 px-5 py-4 border-b border-black/10 bg-[var(--color-ivory-200)]">
              <div className="w-9 h-9 rounded-full bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] grid place-items-center">
                <Sparkles size={16} strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-display text-[1.1rem] leading-none text-[var(--color-charcoal-900)]">
                  Sebastian
                </div>
                <div className="text-eyebrow text-[var(--color-charcoal-500)] text-[0.62rem] mt-1">
                  Concierge · Atelier
                </div>
              </div>
              <button
                type="button"
                onClick={restart}
                aria-label="Restart the conversation"
                title="Restart"
                className="w-8 h-8 inline-flex items-center justify-center text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors"
              >
                <RotateCcw size={15} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close concierge"
                className="w-8 h-8 inline-flex items-center justify-center text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </header>

            {/* Transcript */}
            <div
              ref={scrollerRef}
              className="flex-1 overflow-y-auto px-5 py-5 space-y-4"
            >
              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  msg={m}
                  onTakeMeThere={takeMeThere}
                />
              ))}
              {thinking && <ThinkingDots />}
              {/* Intent chips only on the very first turn so they don't clutter
                  the running transcript later. */}
              {messages.length === 1 && !thinking && (
                <div className="pt-2 flex flex-wrap gap-2">
                  {INTENT_CHIPS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => send(c)}
                      className="text-eyebrow text-[0.63rem] px-3 py-2 border border-black/10 text-[var(--color-charcoal-800)] hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send(draft);
              }}
              className="border-t border-black/10 px-3 py-3 flex items-end gap-2 bg-[var(--color-ivory-100)]"
            >
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(draft);
                  }
                }}
                rows={1}
                placeholder="A wedding in July, navy preferred…"
                className="flex-1 resize-none bg-transparent px-3 py-2 text-[0.92rem] text-[var(--color-charcoal-900)] placeholder:text-[var(--color-charcoal-500)]/70 focus:outline-none max-h-[120px]"
              />
              <button
                type="submit"
                aria-label="Send"
                disabled={!draft.trim() || thinking}
                className="w-10 h-10 inline-flex items-center justify-center bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] hover:bg-[var(--color-burgundy-800)] disabled:opacity-40 transition-colors"
              >
                <Send size={15} strokeWidth={1.7} />
              </button>
            </form>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Closed-state bar — bottom-right pill */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="bar"
            type="button"
            onClick={() => {
              setOpen(true);
              setHint(false);
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.4 }}
            className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[55] inline-flex items-center gap-3 pl-3 pr-4 py-2.5 bg-[var(--color-charcoal-900)] text-[var(--color-ivory-100)] hover:bg-[var(--color-burgundy-700)] transition-colors shadow-xl shadow-black/30"
            aria-label="Open Sebastian, the concierge"
          >
            <span className="w-7 h-7 rounded-full bg-[var(--color-burgundy-700)] inline-flex items-center justify-center">
              <Sparkles size={13} strokeWidth={1.5} />
            </span>
            <span className="flex flex-col items-start leading-none">
              <span className="text-eyebrow text-[0.6rem] opacity-75">
                Concierge
              </span>
              <span className="text-[0.86rem] mt-1">Ask Sebastian</span>
            </span>
            <AnimatePresence>
              {hint && (
                <motion.span
                  key="hint"
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="hidden md:inline-block text-[0.75rem] text-[var(--color-ivory-100)]/80 border-l border-white/20 pl-3 ml-1"
                >
                  How may I dress you today?
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─────────────────── Sub-components ─────────────────── */

function MessageBubble({
  msg,
  onTakeMeThere,
}: {
  msg: Msg;
  onTakeMeThere: (r: Recommendation) => void;
}) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] px-4 py-2.5 bg-[var(--color-charcoal-900)] text-[var(--color-ivory-100)] text-[0.92rem] leading-relaxed">
          {msg.content}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="max-w-[88%] px-4 py-2.5 bg-[var(--color-ivory-200)] text-[var(--color-charcoal-900)] text-[0.92rem] leading-relaxed whitespace-pre-wrap">
        {msg.content}
      </div>
      {msg.rec && <RecommendationCard rec={msg.rec} onPick={onTakeMeThere} />}
    </div>
  );
}

function RecommendationCard({
  rec,
  onPick,
}: {
  rec: Recommendation;
  onPick: (r: Recommendation) => void;
}) {
  const matchPct = Math.max(0, Math.min(100, Math.round(rec.match ?? 75)));
  const cat = rec.category;
  const img = CATEGORY_IMG[cat];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.35 }}
      className="max-w-[92%] border border-black/10 bg-[var(--color-ivory-100)]"
    >
      {img ? (
        <div className="relative aspect-[5/3] overflow-hidden bg-[var(--color-ivory-200)]">
          <Image
            src={img}
            alt={CATEGORY_LABEL[cat]}
            fill
            sizes="320px"
            className="object-cover"
          />
          {/* Match badge */}
          <div className="absolute top-2 left-2 px-2 py-1 bg-[var(--color-ivory-100)]/95 text-[var(--color-burgundy-700)] text-eyebrow text-[0.58rem]">
            {matchPct}% match
          </div>
        </div>
      ) : (
        // Text-only header. Used for shirts, jackets, trousers — we don't
        // hold a photograph for those that wouldn't read as a generic
        // stock pose. The match badge moves into the header text instead.
        <div className="px-4 pt-4 flex items-center justify-between gap-3">
          <div className="text-eyebrow text-[var(--color-burgundy-700)] text-[0.62rem]">
            Sebastian's pick
          </div>
          <div className="text-eyebrow text-[var(--color-burgundy-700)] text-[0.62rem]">
            {matchPct}% match
          </div>
        </div>
      )}
      <div className={`px-4 ${img ? "py-3.5" : "pt-2 pb-4"}`}>
        <div className="text-eyebrow text-[var(--color-charcoal-500)] text-[0.6rem]">
          {rec.occasion ? `For: ${rec.occasion.replace(/-/g, " ")}` : "Recommended"}
        </div>
        <div className="text-display text-[1.15rem] mt-1.5 text-[var(--color-charcoal-900)] leading-tight">
          {CATEGORY_LABEL[cat]}
          {rec.tier ? (
            <span className="text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-burgundy-700)] ml-2 align-middle">
              {rec.tier}
            </span>
          ) : null}
        </div>
        {rec.fabric_hint && (
          <div className="mt-1 text-[0.78rem] text-[var(--color-charcoal-700)]">
            {rec.fabric_hint}
          </div>
        )}
        <p className="mt-2 text-[0.85rem] text-[var(--color-charcoal-700)] leading-relaxed">
          {rec.rationale}
        </p>
        <button
          type="button"
          onClick={() => onPick(rec)}
          className="mt-4 w-full text-eyebrow inline-flex items-center justify-center gap-2 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-4 py-3 hover:bg-[var(--color-burgundy-800)] transition-colors"
        >
          Take me to the customizer
          <ArrowRight size={14} strokeWidth={1.5} />
        </button>
      </div>
    </motion.div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2 w-fit bg-[var(--color-ivory-200)]">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0.3, y: 0 }}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
          className="block w-1.5 h-1.5 rounded-full bg-[var(--color-burgundy-700)]"
        />
      ))}
    </div>
  );
}
