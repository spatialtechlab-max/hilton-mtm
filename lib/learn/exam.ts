/**
 * Pure exam sampling + scoring for the Employee Learning Platform.
 *
 * No React, no Supabase, no side effects, so it is unit tested directly
 * (tests/exam.test.ts). The module player builds one attempt per sitting:
 *  - draw a random 5 of the module's 10 pool questions (anti-copy),
 *  - shuffle each question's options (so the correct letter moves around),
 *  - score full-credit-only: a multi-select question is right only when the
 *    chosen set exactly equals the correct set (all correct, nothing extra).
 *
 * randomness is injected as an rng so tests are deterministic; the player
 * passes Math.random.
 */
import { scorePct, isPass } from "./quiz";
import {
  EXAM_PASS_PCT,
  QUESTIONS_PER_ATTEMPT,
  isMultiSelect,
  type ExamQuestion,
  type ModuleExam,
} from "./examBank";

/** A pool question prepared for one sitting: options shuffled, correct indices
 *  remapped to the shuffled positions. */
export type AttemptQuestion = {
  id: string;
  scenario: string;
  options: string[];
  /** indices into the shuffled `options` that are correct */
  correct: number[];
  rationale: string;
  multi: boolean;
};

/** Fisher-Yates shuffle returning a new array. rng returns [0, 1). */
export function shuffle<T>(arr: readonly T[], rng: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Prepare one question: shuffle its options and remap the correct indices. */
export function prepareQuestion(q: ExamQuestion, rng: () => number): AttemptQuestion {
  // Shuffle the positions [0..n), then read options through the permutation so
  // we can also translate the correct indices to their new home.
  const order = shuffle(
    q.options.map((_, i) => i),
    rng,
  );
  const options = order.map((orig) => q.options[orig]);
  const correctSet = new Set(q.correct);
  const correct = order.map((orig, pos) => (correctSet.has(orig) ? pos : -1)).filter((p) => p >= 0);
  return {
    id: q.id,
    scenario: q.scenario,
    options,
    correct,
    rationale: q.rationale,
    multi: isMultiSelect(q),
  };
}

/**
 * Build one attempt for a module: a random `count` of its pool questions, each
 * with shuffled options. Defaults to QUESTIONS_PER_ATTEMPT (5) of 10.
 */
export function buildAttempt(
  exam: ModuleExam,
  rng: () => number,
  count: number = QUESTIONS_PER_ATTEMPT,
): AttemptQuestion[] {
  const picked = shuffle(exam.questions, rng).slice(0, Math.min(count, exam.questions.length));
  return picked.map((q) => prepareQuestion(q, rng));
}

/** Grade one question, full-credit-only: the selected set must exactly equal
 *  the correct set. Order does not matter; extra or missing picks both fail. */
export function gradeQuestion(selected: readonly number[], q: AttemptQuestion): boolean {
  if (selected.length !== q.correct.length) return false;
  const correctSet = new Set(q.correct);
  const seen = new Set<number>();
  for (const i of selected) {
    if (!correctSet.has(i) || seen.has(i)) return false;
    seen.add(i);
  }
  return true;
}

/**
 * Grade a whole attempt. selections[i] is the set of chosen option indices for
 * question i (empty if unanswered). Each question is worth an equal share.
 */
export function gradeExam(
  selections: ReadonlyArray<readonly number[]>,
  questions: AttemptQuestion[],
  passPct: number = EXAM_PASS_PCT,
): { correct: number; total: number; pct: number; passed: boolean } {
  const total = questions.length;
  let correct = 0;
  for (let i = 0; i < total; i++) {
    if (gradeQuestion(selections[i] ?? [], questions[i])) correct++;
  }
  const pct = scorePct(correct, total);
  return { correct, total, pct, passed: isPass(pct, passPct) };
}
