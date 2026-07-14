/**
 * Generates lib/learn/examBank.ts from scripts/examBank.mjs so the app uses the
 * EXACT client-approved 90-question master bank (the one rendered in
 * docs/master-exam-sheet.pdf). examBank.mjs stays the single source of truth
 * (it also feeds the PDF renderer); this script emits the typed TS mirror.
 *
 * Run: node scripts/genExamBankTs.mjs
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const { examBank } = await import(pathToFileURL(path.join(__dirname, "examBank.mjs")).href);

// Basic integrity gate before we emit, so a broken bank never reaches the app.
let problems = 0;
for (const m of examBank) {
  if (m.questions.length !== 10) { console.error(`[bad] ${m.slug}: ${m.questions.length} questions (want 10)`); problems++; }
  for (const q of m.questions) {
    if (!Array.isArray(q.correct) || q.correct.length < 1 || q.correct.length > 3) { console.error(`[bad] ${q.id}: correct length ${q.correct?.length}`); problems++; }
    if (q.options.length < 4 || q.options.length > 5) { console.error(`[bad] ${q.id}: ${q.options.length} options`); problems++; }
    if (new Set(q.correct).size !== q.correct.length) { console.error(`[bad] ${q.id}: duplicate correct index`); problems++; }
    for (const i of q.correct) if (i < 0 || i >= q.options.length) { console.error(`[bad] ${q.id}: correct index ${i} out of range`); problems++; }
    if (/[—–]/.test(q.scenario + q.options.join("") + q.rationale)) { console.error(`[bad] ${q.id}: em/en dash`); problems++; }
  }
}
if (problems > 0) { console.error(`\nRefusing to generate: ${problems} problem(s).`); process.exit(1); }

const data = JSON.stringify(examBank, null, 2);

const out = `/**
 * The Hilton Way: the client-approved master examination bank (90 scenario
 * questions, 10 per module across the 9 modules), as consumed by the app.
 *
 * GENERATED from scripts/examBank.mjs by scripts/genExamBankTs.mjs. Do not edit
 * by hand. To change a question, edit scripts/examBank.mjs (which also feeds the
 * PDF at docs/master-exam-sheet.pdf) and re-run: node scripts/genExamBankTs.mjs
 *
 * A question with a single correct index renders as a single-select (radio); a
 * question with two or three correct indices renders as a multi-select
 * (checkboxes) and is scored full-credit-only. \`correct\` holds 0-based indices
 * into \`options\`. The player draws a random ${"QUESTIONS_PER_ATTEMPT"} of each module's 10 per
 * attempt and shuffles the options, so two staff rarely see the same paper.
 */

export type ExamQuestion = {
  id: string;
  scenario: string;
  options: string[];
  /** 0-based indices of the correct options. Length 1 = single, 2 to 3 = multi. */
  correct: number[];
  rationale: string;
};

export type ModuleExam = {
  slug: string;
  order: number;
  title: string;
  questions: ExamQuestion[];
};

/** Pass mark, matching the rest of the course. */
export const EXAM_PASS_PCT = 80;

/** How many of a module's 10 pool questions are shown per attempt. */
export const QUESTIONS_PER_ATTEMPT = 5;

export const examBank: ModuleExam[] = ${data};

/** The exam pool for a module, by slug. */
export function examBySlug(slug: string): ModuleExam | undefined {
  return examBank.find((m) => m.slug === slug);
}

/** A question is multi-select when it has more than one correct option. */
export function isMultiSelect(q: Pick<ExamQuestion, "correct">): boolean {
  return q.correct.length > 1;
}
`;

const dest = path.join(repoRoot, "lib", "learn", "examBank.ts");
writeFileSync(dest, out, "utf8");
const total = examBank.reduce((n, m) => n + m.questions.length, 0);
console.log(`Wrote ${dest}`);
console.log(`Modules: ${examBank.length}  Questions: ${total}`);
