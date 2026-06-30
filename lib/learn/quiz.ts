/**
 * Pure quiz scoring + progress maths for the Employee Learning Platform.
 *
 * No React, no Supabase, no side effects, so it can be unit tested directly
 * (see tests/learnQuiz.test.ts). The module player and the dashboard both
 * read their numbers from here, so scoring can never drift between the two.
 */
import type { Module, QuizQuestion } from "./course";

/**
 * Count correctly answered questions. answers[i] is the option index the
 * employee chose for question i; anything that does not match the stored
 * answer index (including undefined / -1 for unanswered) counts as wrong.
 */
export function countCorrect(answers: ReadonlyArray<number | undefined>, questions: QuizQuestion[]): number {
  let correct = 0;
  for (let i = 0; i < questions.length; i++) {
    if (answers[i] === questions[i].answer) correct++;
  }
  return correct;
}

/** Score as a whole-number percentage. 0 questions answered out of 0 is 0%. */
export function scorePct(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
}

/** Pass when the score meets or beats the pass mark (80 for this course). */
export function isPass(pct: number, passPct: number): boolean {
  return pct >= passPct;
}

/** Score a full attempt in one call. */
export function gradeAttempt(
  answers: ReadonlyArray<number | undefined>,
  quiz: { passPct: number; questions: QuizQuestion[] },
): { correct: number; total: number; pct: number; passed: boolean } {
  const total = quiz.questions.length;
  const correct = countCorrect(answers, quiz.questions);
  const pct = scorePct(correct, total);
  return { correct, total, pct, passed: isPass(pct, quiz.passPct) };
}

/** Keep the higher of the stored best and this attempt. */
export function keepBest(previousBest: number | null | undefined, attempt: number): number {
  if (previousBest === null || previousBest === undefined) return attempt;
  return Math.max(previousBest, attempt);
}

/** Shape of one progress row, as the dashboard and player consume it. */
export type ModuleProgress = {
  lessons_completed: string[];
  quiz_best_score: number | null;
  quiz_attempts: number;
  quiz_passed: boolean;
};

/** Is every lesson in this module marked complete? */
export function lessonsComplete(module: Module, completed: ReadonlyArray<string>): boolean {
  return module.lessons.every((l) => completed.includes(l.slug));
}

/** A module is fully done when every lesson is read AND its quiz is passed. */
export function moduleComplete(module: Module, progress: ModuleProgress | undefined): boolean {
  if (!progress) return false;
  return lessonsComplete(module, progress.lessons_completed) && progress.quiz_passed;
}

/**
 * Roll progress for every module into one course-wide summary for the
 * dashboard bar. progressByModule is keyed on module.slug.
 */
export function courseProgress(
  modules: Module[],
  progressByModule: Record<string, ModuleProgress | undefined>,
): { lessonsDone: number; lessonsTotal: number; modulesPassed: number; modulesTotal: number; pct: number } {
  let lessonsDone = 0;
  let lessonsTotal = 0;
  let modulesPassed = 0;
  for (const m of modules) {
    lessonsTotal += m.lessons.length;
    const p = progressByModule[m.slug];
    if (p) {
      lessonsDone += m.lessons.filter((l) => p.lessons_completed.includes(l.slug)).length;
      if (p.quiz_passed) modulesPassed++;
    }
  }
  // Weight lessons and quizzes together: every lesson read is one unit, every
  // module quiz passed is one unit. Gives an honest "how far through" figure.
  const unitsTotal = lessonsTotal + modules.length;
  const unitsDone = lessonsDone + modulesPassed;
  const pct = unitsTotal <= 0 ? 0 : Math.round((unitsDone / unitsTotal) * 100);
  return { lessonsDone, lessonsTotal, modulesPassed, modulesTotal: modules.length, pct };
}
