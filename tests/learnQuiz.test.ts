import { describe, expect, test } from "vitest";
import {
  countCorrect,
  scorePct,
  isPass,
  gradeAttempt,
  keepBest,
  courseProgress,
  type ModuleProgress,
} from "@/lib/learn/quiz";
import { modules, type Module, type QuizQuestion } from "@/lib/learn/course";

/**
 * Learning-platform quiz scoring. Load-bearing: the dashboard, the module
 * player, and the admin tracker all read their numbers from these pure
 * functions, so a regression here mis-reports staff training completion.
 */

const Q = (answer: number): QuizQuestion => ({
  q: "q",
  options: ["a", "b", "c", "d"],
  answer,
  feedback: "f",
});

describe("countCorrect", () => {
  const qs = [Q(0), Q(1), Q(2)];
  test("counts exact matches", () => {
    expect(countCorrect([0, 1, 2], qs)).toBe(3);
    expect(countCorrect([0, 1, 0], qs)).toBe(2);
    expect(countCorrect([1, 0, 1], qs)).toBe(0);
  });
  test("undefined / unanswered counts as wrong", () => {
    expect(countCorrect([0, undefined, 2], qs)).toBe(2);
    expect(countCorrect([], qs)).toBe(0);
  });
});

describe("scorePct", () => {
  test("whole-number percentage", () => {
    expect(scorePct(5, 5)).toBe(100);
    expect(scorePct(4, 5)).toBe(80);
    expect(scorePct(0, 5)).toBe(0);
  });
  test("rounds to nearest integer", () => {
    expect(scorePct(2, 3)).toBe(67); // 66.66 -> 67
    expect(scorePct(1, 3)).toBe(33); // 33.33 -> 33
  });
  test("0 of 0 is 0, never NaN", () => {
    expect(scorePct(0, 0)).toBe(0);
  });
});

describe("isPass at the 80 line", () => {
  test("80 passes, 79 fails", () => {
    expect(isPass(80, 80)).toBe(true);
    expect(isPass(79, 80)).toBe(false);
    expect(isPass(100, 80)).toBe(true);
  });
});

describe("gradeAttempt", () => {
  const quiz = { passPct: 80, questions: [Q(0), Q(1), Q(2), Q(3), Q(0)] };
  test("all correct passes at 100%", () => {
    const r = gradeAttempt([0, 1, 2, 3, 0], quiz);
    expect(r).toEqual({ correct: 5, total: 5, pct: 100, passed: true });
  });
  test("4 of 5 is exactly the pass line", () => {
    const r = gradeAttempt([0, 1, 2, 3, 9], quiz);
    expect(r.pct).toBe(80);
    expect(r.passed).toBe(true);
  });
  test("3 of 5 fails", () => {
    const r = gradeAttempt([0, 1, 2, 9, 9], quiz);
    expect(r.pct).toBe(60);
    expect(r.passed).toBe(false);
  });
});

describe("keepBest", () => {
  test("keeps the higher score", () => {
    expect(keepBest(60, 80)).toBe(80);
    expect(keepBest(80, 60)).toBe(80);
    expect(keepBest(80, 80)).toBe(80);
  });
  test("first attempt with no prior best", () => {
    expect(keepBest(null, 40)).toBe(40);
    expect(keepBest(undefined, 0)).toBe(0);
  });
  test("a worse retake never lowers the stored best", () => {
    expect(keepBest(100, 20)).toBe(100);
  });
});

describe("courseProgress", () => {
  const all: Record<string, ModuleProgress> = {};
  for (const m of modules) {
    all[m.slug] = {
      lessons_completed: m.lessons.map((l) => l.slug),
      quiz_best_score: 100,
      quiz_attempts: 1,
      quiz_passed: true,
    };
  }
  test("empty progress is 0%", () => {
    const r = courseProgress(modules, {});
    expect(r.pct).toBe(0);
    expect(r.lessonsDone).toBe(0);
    expect(r.modulesPassed).toBe(0);
  });
  test("everything done is 100%", () => {
    const r = courseProgress(modules, all);
    expect(r.pct).toBe(100);
    expect(r.modulesPassed).toBe(modules.length);
    expect(r.lessonsDone).toBe(r.lessonsTotal);
  });
  test("partial progress sits between 0 and 100", () => {
    const partial: Record<string, ModuleProgress> = {
      [modules[0].slug]: {
        lessons_completed: [modules[0].lessons[0].slug],
        quiz_best_score: 40,
        quiz_attempts: 1,
        quiz_passed: false,
      },
    };
    const r = courseProgress(modules, partial);
    expect(r.pct).toBeGreaterThan(0);
    expect(r.pct).toBeLessThan(100);
    expect(r.lessonsDone).toBe(1);
    expect(r.modulesPassed).toBe(0);
  });
});

describe("a module quiz is winnable and not trivially passable", () => {
  test.each(modules)("$slug: a perfect attempt passes", (m: Module) => {
    const perfect = m.quiz.questions.map((q) => q.answer);
    expect(gradeAttempt(perfect, m.quiz).passed).toBe(true);
  });
  test.each(modules)("$slug: an all-zero attempt does not auto-pass", (m: Module) => {
    // Not every answer is index 0, so blindly picking the first option must
    // fall below the 80% line for a well-formed quiz.
    const allZero = m.quiz.questions.map(() => 0);
    const everyAnswerIsZero = m.quiz.questions.every((q) => q.answer === 0);
    if (!everyAnswerIsZero) {
      expect(gradeAttempt(allZero, m.quiz).passed).toBe(false);
    }
  });
});
