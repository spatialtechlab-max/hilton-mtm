/**
 * Renders the master examination sheet (scripts/examBank.mjs) to a single
 * styled HTML document, one module per section, every correct option marked.
 * A separate Chrome headless step converts docs/master-exam-sheet.html to
 * docs/master-exam-sheet.pdf.
 *
 * Run: node scripts/renderExamSheet.mjs
 * Then: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
 *   --headless --disable-gpu --no-pdf-header-footer \
 *   --print-to-pdf=docs/master-exam-sheet.pdf docs/master-exam-sheet.html
 */
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const bankUrl = pathToFileURL(path.join(__dirname, "examBank.mjs")).href;
const { examBank, bankTotals } = await import(bankUrl);
const totals = bankTotals();

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Inline the burgundy monogram as a data URI so headless Chrome renders it.
let logoTag = "";
try {
  const b64 = readFileSync(path.join(repoRoot, "public", "logo-burgundy.png")).toString("base64");
  logoTag = `<img class="logo" src="data:image/png;base64,${b64}" alt="Hilton">`;
} catch {
  logoTag = "";
}

const dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

/* ----------------------------- question block ----------------------------- */

function renderQuestion(q, n) {
  const isMulti = q.correct.length > 1;
  const typeLabel = isMulti
    ? `Multiple answers (${q.correct.length} correct)`
    : "Single answer (1 correct)";
  const typeClass = isMulti ? "multi" : "single";

  const options = q.options
    .map((opt, i) => {
      const correct = q.correct.includes(i);
      const mark = isMulti
        ? `<span class="box">${correct ? "&#10003;" : ""}</span>`
        : `<span class="radio">${correct ? "&#9679;" : ""}</span>`;
      return `
        <li class="opt ${correct ? "correct" : ""}">
          ${mark}
          <span class="letter">${LETTERS[i]}</span>
          <span class="text">${escapeHtml(opt)}</span>
          ${correct ? '<span class="tick">correct</span>' : ""}
        </li>`;
    })
    .join("");

  const answerLetters = q.correct.map((i) => LETTERS[i]).join(", ");

  return `
    <div class="q">
      <div class="q-head">
        <span class="q-num">${n}</span>
        <span class="q-type ${typeClass}">${typeLabel}</span>
      </div>
      <p class="q-scenario">${escapeHtml(q.scenario)}</p>
      <ul class="opts">${options}</ul>
      <div class="q-answer">
        <span class="lbl">Answer</span>
        <span class="ans-letters">${answerLetters}</span>
        <span class="rationale">${escapeHtml(q.rationale)}</span>
      </div>
    </div>`;
}

/* ------------------------------- modules ------------------------------- */

const sections = examBank
  .map((m) => {
    const qs = m.questions.map((q, i) => renderQuestion(q, i + 1)).join("\n");
    const mSingle = m.questions.filter((q) => q.correct.length === 1).length;
    const mMulti = m.questions.length - mSingle;
    return `
      <section class="module">
        <div class="module-head">
          <div class="module-order">Module ${m.order}</div>
          <h2 class="module-title">${escapeHtml(m.title)}</h2>
          <div class="module-meta">${m.questions.length} questions in the pool &middot; ${mSingle} single-answer &middot; ${mMulti} multi-answer &middot; a random 5 are shown per attempt</div>
        </div>
        ${qs}
      </section>`;
  })
  .join("\n");

/* --------------------------------- doc --------------------------------- */

const doc = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>The Hilton Way: Master Examination Sheet</title>
<style>
  @page { size: A4; margin: 12mm 12mm 14mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; color: #1f1d1b; background: #fff;
    font-family: -apple-system, "Segoe UI", Arial, sans-serif; font-size: 11px; line-height: 1.5; }
  .serif { font-family: Georgia, "Times New Roman", serif; }

  /* Cover */
  .cover { height: 271mm; display: flex; flex-direction: column; justify-content: center;
    text-align: center; page-break-after: always; }
  .cover .logo { width: 74px; height: auto; margin: 0 auto 26px; display: block; }
  .cover .eyebrow { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #6e2639; }
  .cover h1 { font-family: Georgia, serif; font-weight: normal; font-size: 34px; line-height: 1.2;
    margin: 14px auto 8px; max-width: 460px; }
  .cover .sub { font-size: 13px; color: #6b6663; margin-bottom: 28px; }
  .cover .rule { width: 48px; border-top: 1px solid rgba(110,38,57,0.5); margin: 0 auto 28px; }
  .stats { display: flex; justify-content: center; gap: 34px; margin-bottom: 34px; }
  .stat .n { font-family: Georgia, serif; font-size: 30px; color: #6e2639; }
  .stat .l { font-size: 9.5px; letter-spacing: 1.5px; text-transform: uppercase; color: #8a827c; margin-top: 2px; }
  .legend { max-width: 430px; margin: 0 auto; text-align: left; border: 1px solid #e2ddd5;
    background: #faf7f2; padding: 16px 20px; }
  .legend h3 { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #6e2639;
    margin: 0 0 10px; }
  .legend p { margin: 0 0 8px; font-size: 11px; color: #46423f; line-height: 1.55; }
  .legend .key { display: inline-flex; align-items: center; gap: 6px; margin-right: 4px; }
  .legend .radio, .legend .box { display: inline-flex; align-items: center; justify-content: center;
    width: 13px; height: 13px; border: 1.5px solid #6e2639; color: #6e2639; font-size: 9px; }
  .legend .radio { border-radius: 50%; }
  .cover .date { margin-top: 30px; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #a49c94; }

  /* Modules */
  .module { page-break-before: always; }
  .module-head { border-bottom: 2px solid #6e2639; padding-bottom: 10px; margin-bottom: 16px; }
  .module-order { font-size: 10px; letter-spacing: 2.5px; text-transform: uppercase; color: #6e2639; }
  .module-title { font-family: Georgia, serif; font-weight: normal; font-size: 21px; margin: 4px 0 6px; }
  .module-meta { font-size: 9.5px; color: #8a827c; letter-spacing: 0.3px; }

  /* Question */
  .q { border: 1px solid #e6e1d9; border-left: 3px solid #6e2639; padding: 11px 14px 12px;
    margin-bottom: 11px; page-break-inside: avoid; break-inside: avoid; }
  .q-head { display: flex; align-items: center; gap: 10px; margin-bottom: 7px; }
  .q-num { font-family: Georgia, serif; font-size: 16px; color: #6e2639; min-width: 20px; }
  .q-type { font-size: 8.5px; letter-spacing: 1.2px; text-transform: uppercase; padding: 2px 8px;
    border-radius: 10px; }
  .q-type.single { background: #eef1f4; color: #3f5a73; }
  .q-type.multi { background: #f3eef6; color: #6e4a7a; }
  .q-scenario { margin: 0 0 9px; font-size: 11.5px; color: #26221f; line-height: 1.55; }

  .opts { list-style: none; margin: 0; padding: 0; }
  .opt { display: flex; align-items: flex-start; gap: 8px; padding: 4px 8px; margin-bottom: 3px;
    border-radius: 3px; }
  .opt.correct { background: #eef6ee; }
  .opt .box, .opt .radio { flex: 0 0 auto; width: 13px; height: 13px; margin-top: 1px;
    border: 1.4px solid #b3aca2; display: inline-flex; align-items: center; justify-content: center;
    font-size: 9px; color: #2e7d32; }
  .opt .radio { border-radius: 50%; }
  .opt.correct .box, .opt.correct .radio { border-color: #2e7d32; }
  .opt .letter { flex: 0 0 auto; font-weight: 600; color: #8a827c; width: 12px; }
  .opt.correct .letter { color: #2e7d32; }
  .opt .text { flex: 1; font-size: 11px; color: #33302d; }
  .opt.correct .text { color: #1f3a20; font-weight: 500; }
  .opt .tick { flex: 0 0 auto; font-size: 8px; letter-spacing: 1px; text-transform: uppercase;
    color: #2e7d32; background: #dcecdc; padding: 1px 6px; border-radius: 8px; align-self: center; }

  .q-answer { margin-top: 8px; padding-top: 7px; border-top: 1px dashed #e0dace; font-size: 10px;
    color: #6b6663; line-height: 1.5; }
  .q-answer .lbl { font-size: 8px; letter-spacing: 1.5px; text-transform: uppercase; color: #6e2639;
    margin-right: 7px; }
  .q-answer .ans-letters { font-weight: 700; color: #2e7d32; margin-right: 8px; }
  .q-answer .rationale { color: #6b6663; }
</style>
</head>
<body>
  <div class="cover">
    ${logoTag}
    <div class="eyebrow">Hilton Bespoke &middot; Staff Learning</div>
    <h1 class="serif">The Hilton Way<br>Master Examination Sheet</h1>
    <div class="sub">Nine modules &middot; ten scenario questions each &middot; correct answers marked</div>
    <div class="rule"></div>
    <div class="stats">
      <div class="stat"><div class="n">${totals.modules}</div><div class="l">Modules</div></div>
      <div class="stat"><div class="n">${totals.questions}</div><div class="l">Questions</div></div>
      <div class="stat"><div class="n">${totals.single}</div><div class="l">Single answer</div></div>
      <div class="stat"><div class="n">${totals.multi}</div><div class="l">Multi answer</div></div>
    </div>
    <div class="legend">
      <h3>How the paper works</h3>
      <p><span class="key"><span class="radio">&#9679;</span></span> A <strong>single-answer</strong> question has exactly one correct option. On screen it shows as radio buttons, so the staff member can select only one.</p>
      <p><span class="key"><span class="box">&#10003;</span></span> A <strong>multi-answer</strong> question has two or three correct options. It shows as checkboxes, so the staff member can select several, and must find all of them to score the question.</p>
      <p>Each module holds a pool of ten questions. Every attempt draws a <strong>random five</strong>, with the options shuffled, so two staff members rarely see the same paper. This sheet is the full master pool with answers, for review only.</p>
    </div>
    <div class="date">Rendered ${dateStr}</div>
  </div>
  ${sections}
</body>
</html>`;

const docsDir = path.join(repoRoot, "docs");
mkdirSync(docsDir, { recursive: true });
const htmlPath = path.join(docsDir, "master-exam-sheet.html");
writeFileSync(htmlPath, doc, "utf8");

console.log(`Modules: ${totals.modules}  Questions: ${totals.questions}  Single: ${totals.single}  Multi: ${totals.multi}`);
console.log(`HTML written: ${htmlPath}`);
