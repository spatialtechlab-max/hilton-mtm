import { describe, expect, test } from "vitest";
import {
  examBank,
  examBySlug,
  isMultiSelect,
  EXAM_PASS_PCT,
  QUESTIONS_PER_ATTEMPT,
  type ExamQuestion,
} from "@/lib/learn/examBank";
import {
  shuffle,
  prepareQuestion,
  buildAttempt,
  gradeQuestion,
  gradeExam,
  type AttemptQuestion,
} from "@/lib/learn/exam";
import { modules } from "@/lib/learn/course";

/**
 * The exam bank is the client-approved master paper (90 scenario questions, 10
 * per module) plus the anti-copy sampler and full-credit scorer that drive the
 * staff quiz. These guard the answer keys and the scoring rules that decide who
 * passes training.
 */

/** A tiny deterministic RNG so shuffling/sampling tests are reproducible. */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

describe("bank shape", () => {
  test("nine modules, matching the course modules in slug and order", () => {
    expect(examBank).toHaveLength(9);
    expect(examBank.map((m) => m.slug)).toEqual(modules.map((m) => m.slug));
    expect(examBank.map((m) => m.order)).toEqual(modules.map((m) => m.order));
  });
  test("every module has exactly ten pool questions", () => {
    for (const m of examBank) expect(m.questions).toHaveLength(10);
  });
  test("examBySlug resolves and rejects", () => {
    expect(examBySlug("the-cloth")?.order).toBe(4);
    expect(examBySlug("nope")).toBeUndefined();
  });
  test("question ids are unique across the whole bank", () => {
    const ids = examBank.flatMap((m) => m.questions.map((q) => q.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("question integrity", () => {
  const all: ExamQuestion[] = examBank.flatMap((m) => m.questions);
  test("each question has 4 to 5 options, no duplicate option text", () => {
    for (const q of all) {
      expect(q.options.length).toBeGreaterThanOrEqual(4);
      expect(q.options.length).toBeLessThanOrEqual(5);
      expect(new Set(q.options).size).toBe(q.options.length);
    }
  });
  test("each question has 1 to 3 correct, in range, no duplicates", () => {
    for (const q of all) {
      expect(q.correct.length).toBeGreaterThanOrEqual(1);
      expect(q.correct.length).toBeLessThanOrEqual(3);
      expect(new Set(q.correct).size).toBe(q.correct.length);
      for (const i of q.correct) {
        expect(Number.isInteger(i)).toBe(true);
        expect(i).toBeGreaterThanOrEqual(0);
        expect(i).toBeLessThan(q.options.length);
      }
    }
  });
  test("scenario and rationale are real text", () => {
    for (const q of all) {
      expect(q.scenario.trim().length).toBeGreaterThan(10);
      expect(q.rationale.trim().length).toBeGreaterThan(10);
    }
  });
  test("no em-dash or en-dash anywhere in the bank", () => {
    const offenders: string[] = [];
    for (const q of all) {
      const blob = q.scenario + q.options.join(" ") + q.rationale;
      if (/[—–]/.test(blob)) offenders.push(q.id);
    }
    expect(offenders).toEqual([]);
  });
  test("isMultiSelect matches the correct-count", () => {
    for (const q of all) expect(isMultiSelect(q)).toBe(q.correct.length > 1);
  });
});

describe("shuffle", () => {
  test("is a permutation (same multiset, deterministic under a seed)", () => {
    const arr = [1, 2, 3, 4, 5];
    const out = shuffle(arr, seeded(42));
    expect(out).toHaveLength(5);
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5]);
    // Same seed reproduces the same order.
    expect(shuffle(arr, seeded(42))).toEqual(out);
    // Does not mutate the input.
    expect(arr).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("prepareQuestion remaps correct indices to the shuffled options", () => {
  test("the correct option TEXTS are preserved after shuffling", () => {
    for (const m of examBank) {
      for (const q of m.questions) {
        const prepared = prepareQuestion(q, seeded(q.id.length + m.order));
        // Same options, just reordered.
        expect([...prepared.options].sort()).toEqual([...q.options].sort());
        // The texts flagged correct before and after must be the same set.
        const beforeCorrect = q.correct.map((i) => q.options[i]).sort();
        const afterCorrect = prepared.correct.map((i) => prepared.options[i]).sort();
        expect(afterCorrect).toEqual(beforeCorrect);
        expect(prepared.multi).toBe(q.correct.length > 1);
      }
    }
  });
});

describe("buildAttempt draws a shuffled subset", () => {
  test("returns QUESTIONS_PER_ATTEMPT distinct pool questions", () => {
    const exam = examBySlug("the-cloth")!;
    const attempt = buildAttempt(exam, seeded(7));
    expect(attempt).toHaveLength(QUESTIONS_PER_ATTEMPT);
    const ids = attempt.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    const poolIds = new Set(exam.questions.map((q) => q.id));
    for (const id of ids) expect(poolIds.has(id)).toBe(true);
  });
  test("different seeds tend to draw different sets (anti-copy)", () => {
    const exam = examBySlug("style-options")!;
    const a = buildAttempt(exam, seeded(1)).map((q) => q.id).join(",");
    const b = buildAttempt(exam, seeded(999)).map((q) => q.id).join(",");
    expect(a).not.toBe(b);
  });
});

describe("gradeQuestion is full-credit-only", () => {
  const single: AttemptQuestion = { id: "s", scenario: "", options: ["a", "b", "c", "d"], correct: [2], rationale: "", multi: false };
  const multi: AttemptQuestion = { id: "m", scenario: "", options: ["a", "b", "c", "d"], correct: [0, 2], rationale: "", multi: true };

  test("single: exact match passes, anything else fails", () => {
    expect(gradeQuestion([2], single)).toBe(true);
    expect(gradeQuestion([0], single)).toBe(false);
    expect(gradeQuestion([], single)).toBe(false);
    expect(gradeQuestion([2, 0], single)).toBe(false); // extra pick
  });
  test("multi: all correct and nothing extra passes", () => {
    expect(gradeQuestion([0, 2], multi)).toBe(true);
    expect(gradeQuestion([2, 0], multi)).toBe(true); // order irrelevant
  });
  test("multi: a missing correct fails", () => {
    expect(gradeQuestion([0], multi)).toBe(false);
  });
  test("multi: an extra wrong pick fails", () => {
    expect(gradeQuestion([0, 2, 1], multi)).toBe(false);
  });
  test("multi: a duplicate pick does not fake a pass", () => {
    expect(gradeQuestion([0, 0], multi)).toBe(false);
  });
});

describe("gradeExam totals and pass line", () => {
  const qs: AttemptQuestion[] = [
    { id: "1", scenario: "", options: ["a", "b"], correct: [0], rationale: "", multi: false },
    { id: "2", scenario: "", options: ["a", "b"], correct: [1], rationale: "", multi: false },
    { id: "3", scenario: "", options: ["a", "b", "c"], correct: [0, 2], rationale: "", multi: true },
    { id: "4", scenario: "", options: ["a", "b"], correct: [0], rationale: "", multi: false },
    { id: "5", scenario: "", options: ["a", "b"], correct: [1], rationale: "", multi: false },
  ];
  test("all five correct is 100% and passes", () => {
    const r = gradeExam([[0], [1], [0, 2], [0], [1]], qs);
    expect(r).toEqual({ correct: 5, total: 5, pct: 100, passed: true });
  });
  test("four of five is exactly the 80% pass line", () => {
    const r = gradeExam([[0], [1], [0], [0], [1]], qs); // q3 partial -> wrong
    expect(r.pct).toBe(80);
    expect(r.passed).toBe(true);
  });
  test("three of five fails at 60%", () => {
    const r = gradeExam([[0], [1], [0], [1], [1]], qs); // q3 and q4 wrong
    expect(r.pct).toBe(60);
    expect(r.passed).toBe(false);
  });
  test("EXAM_PASS_PCT is 80", () => {
    expect(EXAM_PASS_PCT).toBe(80);
  });
});

describe("every attempt from every module is winnable and not trivially passable", () => {
  test.each(examBank)("$slug: a fully-correct attempt scores 100", (m) => {
    const attempt = buildAttempt(m, seeded(m.order * 13 + 5));
    const perfect = attempt.map((q) => q.correct);
    expect(gradeExam(perfect, attempt).pct).toBe(100);
  });
  test.each(examBank)("$slug: ticking only the first option does not auto-pass", (m) => {
    // Sample the WHOLE pool as one attempt so the check is over all 10.
    const attempt = buildAttempt(m, seeded(m.order + 1), m.questions.length);
    const firstOnly = attempt.map(() => [0]);
    expect(gradeExam(firstOnly, attempt).passed).toBe(false);
  });
});
