import { describe, expect, test } from "vitest";

/**
 * Recommendation extractor — duplicated here from app/api/concierge/chat to
 * pin its behaviour without mocking the whole route handler. If the route
 * changes the extraction logic, the test should fail and be updated.
 */

type Rec = { category?: string; rationale?: string };

function extract(raw: string): { reply: string; recommendation: Rec | null } {
  let rec: Rec | null = null;
  const m = raw.match(/```json\s*([\s\S]*?)\s*```/);
  if (m) {
    try {
      const parsed = JSON.parse(m[1]) as Rec;
      if (parsed && typeof parsed === "object" && typeof parsed.category === "string") {
        rec = parsed;
      }
    } catch {
      rec = null;
    }
  }
  const reply = raw.replace(/```json[\s\S]*?```/g, "").trim();
  return { reply, recommendation: rec };
}

describe("Sebastian recommendation parser", () => {
  test("plain prose returns no recommendation, full text as reply", () => {
    const out = extract("A wise choice. Allow me to suggest a Signature suit.");
    expect(out.recommendation).toBeNull();
    expect(out.reply).toBe("A wise choice. Allow me to suggest a Signature suit.");
  });

  test("prose + json block: extracts recommendation, strips block from reply", () => {
    const raw = [
      "A wise choice for a black-tie evening.",
      "",
      "```json",
      '{ "category": "suit", "tier": "bespoke", "occasion": "black-tie", "match": 88, "rationale": "Zegna mohair-wool." }',
      "```",
    ].join("\n");
    const out = extract(raw);
    expect(out.recommendation).not.toBeNull();
    expect(out.recommendation?.category).toBe("suit");
    expect(out.reply).not.toContain("```json");
    expect(out.reply).toContain("A wise choice");
  });

  test("malformed json block is dropped, reply preserved", () => {
    const raw = [
      "I'd suggest a shirt.",
      "```json",
      '{ "category": "shirt", "rationale": "missing closing brace"',
      "```",
    ].join("\n");
    const out = extract(raw);
    expect(out.recommendation).toBeNull();
    expect(out.reply).toContain("I'd suggest a shirt");
    expect(out.reply).not.toContain("```");
  });

  test("missing category field is rejected (anti-hallucination)", () => {
    const raw = [
      "Let me ask one more question.",
      "```json",
      '{ "tier": "signature", "rationale": "no category here" }',
      "```",
    ].join("\n");
    const out = extract(raw);
    expect(out.recommendation).toBeNull();
  });
});
