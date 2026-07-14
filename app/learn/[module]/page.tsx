"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, Check, X, Lock, RotateCcw, CheckCircle2, GraduationCap, LogOut,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { isAdmin, isEmployee } from "@/lib/admin";
import { moduleBySlug, modules, type Module } from "@/lib/learn/course";
import { keepBest, type ModuleProgress } from "@/lib/learn/quiz";
import { buildAttempt, gradeExam, gradeQuestion, type AttemptQuestion } from "@/lib/learn/exam";
import { examBySlug, EXAM_PASS_PCT } from "@/lib/learn/examBank";
import { fetchModuleProgress, saveProgress } from "@/lib/learn/progressClient";

type Phase = "lessons" | "quiz";

export default function ModulePlayerPage() {
  const params = useParams<{ module: string }>();
  const slug = params?.module ?? "";
  const mod = moduleBySlug(slug);

  const { user, loading, signOut } = useAuth();
  const [access, setAccess] = useState<{ ok: boolean } | null>(null);
  const [progress, setProgress] = useState<ModuleProgress | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) { setAccess({ ok: false }); return; }
    Promise.all([isEmployee(user.email), isAdmin(user.email)]).then(([emp, adm]) => setAccess({ ok: emp || adm }));
  }, [user]);

  useEffect(() => {
    if (!user || !access?.ok || !mod) return;
    let cancelled = false;
    fetchModuleProgress(user.id, mod.slug).then((p) => {
      if (cancelled) return;
      setProgress(p);
      setLoaded(true);
    });
    return () => { cancelled = true; };
  }, [user, access, mod]);

  if (loading || access === null) return <Shell><p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading…</p></Shell>;

  if (!mod) {
    return (
      <Shell>
        <Gate title="Module not found" body="That module does not exist. Head back to the course overview." />
      </Shell>
    );
  }

  if (!user) {
    return <Shell><Gate title="Sign in to begin" body="Please sign in with your staff account to take this module." cta={{ href: "/account", label: "Sign in" }} /></Shell>;
  }
  if (!access.ok) {
    return <Shell onSignOut={signOut}><Gate title="You are not enrolled" body={`${user.email} is not on the staff learning roster.`} /></Shell>;
  }
  if (!loaded) return <Shell onSignOut={signOut}><p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading module…</p></Shell>;

  return (
    <Shell onSignOut={signOut}>
      <Player mod={mod} userId={user.id} email={user.email ?? ""} initial={progress} />
    </Shell>
  );
}

function Player({
  mod, userId, email, initial,
}: {
  mod: Module;
  userId: string;
  email: string;
  initial: ModuleProgress | null;
}) {
  // Flatten every slide across the module's lessons, remembering which lesson
  // each one belongs to so we can mark lessons complete as the reader advances.
  const flat = useMemo(
    () => mod.lessons.flatMap((l) => l.slides.map((slide, i) => ({ lessonSlug: l.slug, lessonTitle: l.title, slide, slideIndex: i }))),
    [mod],
  );
  // The flat index of the final slide of each lesson.
  const lastIndexByLesson = useMemo(() => {
    const map: Record<string, number> = {};
    flat.forEach((f, i) => { map[f.lessonSlug] = i; });
    return map;
  }, [flat]);

  const [phase, setPhase] = useState<Phase>("lessons");
  const [slideIdx, setSlideIdx] = useState(0);

  // Persisted progress, kept whole in state so every save writes a full row.
  const [completed, setCompleted] = useState<string[]>(initial?.lessons_completed ?? []);
  const [bestScore, setBestScore] = useState<number | null>(initial?.quiz_best_score ?? null);
  const [attempts, setAttempts] = useState<number>(initial?.quiz_attempts ?? 0);
  const [passed, setPassed] = useState<boolean>(initial?.quiz_passed ?? false);
  const completedRef = useRef(completed);
  completedRef.current = completed;

  const persist = useCallback(
    (next: { completed?: string[]; bestScore?: number | null; attempts?: number; passed?: boolean }) => {
      void saveProgress({
        userId,
        email,
        moduleSlug: mod.slug,
        lessonsCompleted: next.completed ?? completedRef.current,
        quizBestScore: next.bestScore !== undefined ? next.bestScore : bestScore,
        quizAttempts: next.attempts !== undefined ? next.attempts : attempts,
        quizPassed: next.passed !== undefined ? next.passed : passed,
      });
    },
    [userId, email, mod.slug, bestScore, attempts, passed],
  );

  // Whenever the reader reaches a new slide, mark any now-finished lesson
  // complete and save (deduped, only when the set actually grows).
  useEffect(() => {
    const reached = mod.lessons
      .map((l) => l.slug)
      .filter((lessonSlug) => slideIdx >= lastIndexByLesson[lessonSlug]);
    const union = Array.from(new Set([...completedRef.current, ...reached]));
    if (union.length !== completedRef.current.length) {
      setCompleted(union);
      persist({ completed: union });
    }
  }, [slideIdx, mod.lessons, lastIndexByLesson, persist]);

  const atFirst = slideIdx === 0;
  const atLast = slideIdx === flat.length - 1;

  if (phase === "quiz") {
    return (
      <ExamRunner
        mod={mod}
        bestScore={bestScore}
        passed={passed}
        onBackToLessons={() => setPhase("lessons")}
        onAttempt={(pct, didPass) => {
          const newAttempts = attempts + 1;
          const newBest = keepBest(bestScore, pct);
          const newPassed = passed || didPass;
          setAttempts(newAttempts);
          setBestScore(newBest);
          setPassed(newPassed);
          persist({ attempts: newAttempts, bestScore: newBest, passed: newPassed });
        }}
      />
    );
  }

  const current = flat[slideIdx];
  return (
    <div>
      <ModuleHeader mod={mod} />

      {/* Lesson label + slide counter */}
      <div className="mt-8 flex items-center justify-between gap-4 text-eyebrow text-[var(--color-charcoal-500)]">
        <span>{current.lessonTitle}</span>
        <span className="tabular-nums">Slide {slideIdx + 1} of {flat.length}</span>
      </div>
      <div className="mt-2 h-1 bg-[var(--color-ivory-200)] overflow-hidden">
        <div className="h-full bg-[var(--color-burgundy-700)] transition-all duration-300" style={{ width: `${((slideIdx + 1) / flat.length) * 100}%` }} />
      </div>

      {/* Slide */}
      <article className="mt-8 border border-black/10 bg-white p-8 lg:p-12 min-h-[280px]">
        {/* Premium slide illustration. Deterministic path; hidden cleanly if the
            file was never generated. Keyed by src so a prior slide's onError-hide
            never leaks onto the next slide's (valid) image. */}
        <img
          key={`/learn/${mod.slug}-${current.lessonSlug}-${current.slideIndex}.jpg`}
          src={`/learn/${mod.slug}-${current.lessonSlug}-${current.slideIndex}.jpg`}
          alt=""
          onError={(e) => { e.currentTarget.style.display = "none"; }}
          className="mb-8 w-full h-[200px] sm:h-[300px] lg:h-[360px] object-cover rounded-2xl border border-[var(--color-burgundy-700)]/15 shadow-[0_1px_20px_rgba(0,0,0,0.06)] bg-[var(--color-ivory-100)]"
        />
        <h2 className="text-display text-[clamp(1.6rem,3vw,2.25rem)] leading-tight text-[var(--color-charcoal-900)]">
          {current.slide.heading}
        </h2>
        <div className="mt-5 max-w-2xl space-y-4">
          {current.slide.body.split(/\n\n+/).map((para, i) => (
            <p key={i} className="text-[1.02rem] text-[var(--color-charcoal-700)] leading-relaxed">
              {para}
            </p>
          ))}
        </div>
      </article>

      {/* Controls */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setSlideIdx((i) => Math.max(0, i - 1))}
          disabled={atFirst}
          className="text-eyebrow inline-flex items-center gap-2 border border-[var(--color-charcoal-900)]/25 px-5 py-3 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors disabled:opacity-40"
        >
          <ArrowLeft size={14} strokeWidth={1.5} /> Previous
        </button>

        {atLast ? (
          <button
            type="button"
            onClick={() => setPhase("quiz")}
            className="text-eyebrow inline-flex items-center gap-2 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-5 py-3 hover:bg-[var(--color-burgundy-800)] transition-colors"
          >
            Go to the quiz <ArrowRight size={14} strokeWidth={1.5} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setSlideIdx((i) => Math.min(flat.length - 1, i + 1))}
            className="text-eyebrow inline-flex items-center gap-2 bg-[var(--color-charcoal-900)] text-[var(--color-ivory-100)] px-5 py-3 hover:bg-[var(--color-burgundy-700)] transition-colors"
          >
            Next <ArrowRight size={14} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  );
}

function ExamRunner({
  mod, bestScore, passed, onAttempt, onBackToLessons,
}: {
  mod: Module;
  bestScore: number | null;
  passed: boolean;
  onAttempt: (pct: number, didPass: boolean) => void;
  onBackToLessons: () => void;
}) {
  const exam = examBySlug(mod.slug);
  // One sitting: a random 5 of the module's 10 pool questions, each with its
  // options shuffled. Re-rolled on retake so no two attempts are identical.
  const [attempt, setAttempt] = useState<AttemptQuestion[]>(() => (exam ? buildAttempt(exam, Math.random) : []));
  const [qIdx, setQIdx] = useState(0);
  // selections[i] = the option indices this staff member ticked for question i.
  const [selections, setSelections] = useState<number[][]>(() => attempt.map(() => []));
  // checked[i] = has the answer for question i been submitted and revealed.
  const [checked, setChecked] = useState<boolean[]>(() => attempt.map(() => false));
  const [finished, setFinished] = useState(false);
  const reportedRef = useRef(false);

  const result = useMemo(() => gradeExam(selections, attempt), [selections, attempt]);

  // Record the attempt once, when the results screen first shows.
  useEffect(() => {
    if (finished && !reportedRef.current) {
      reportedRef.current = true;
      onAttempt(result.pct, result.passed);
    }
  }, [finished, result.pct, result.passed, onAttempt]);

  const retake = () => {
    const next = exam ? buildAttempt(exam, Math.random) : [];
    setAttempt(next);
    setSelections(next.map(() => []));
    setChecked(next.map(() => false));
    setQIdx(0);
    setFinished(false);
    reportedRef.current = false;
  };

  if (!exam || attempt.length === 0) {
    return (
      <div>
        <ModuleHeader mod={mod} />
        <p className="mt-8 text-[0.95rem] text-[var(--color-charcoal-700)]">This module has no exam configured yet.</p>
        <button type="button" onClick={onBackToLessons} className="mt-6 text-eyebrow inline-flex items-center gap-2 border border-[var(--color-charcoal-900)]/25 px-5 py-3 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors">
          <ArrowLeft size={14} strokeWidth={1.5} /> Back to lessons
        </button>
      </div>
    );
  }

  const q = attempt[qIdx];
  const sel = selections[qIdx] ?? [];
  const isRevealed = checked[qIdx];
  const isLastQ = qIdx === attempt.length - 1;
  const questionRight = isRevealed && gradeQuestion(sel, q);

  const toggle = (optIdx: number) => {
    if (isRevealed) return;
    setSelections((prev) => {
      const next = prev.map((a) => a.slice());
      if (q.multi) {
        const cur = next[qIdx];
        const at = cur.indexOf(optIdx);
        if (at >= 0) cur.splice(at, 1);
        else cur.push(optIdx);
      } else {
        next[qIdx] = [optIdx]; // single-select: one choice replaces the last
      }
      return next;
    });
  };

  const check = () => {
    if (isRevealed || sel.length === 0) return;
    setChecked((prev) => { const n = [...prev]; n[qIdx] = true; return n; });
  };

  if (finished) {
    return (
      <div>
        <ModuleHeader mod={mod} />
        <div className="mt-10 border border-black/10 bg-white p-8 lg:p-12 text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${result.passed ? "bg-[var(--color-burgundy-50)] text-[var(--color-burgundy-700)]" : "bg-black/5 text-[var(--color-charcoal-500)]"}`}>
            {result.passed ? <CheckCircle2 size={30} strokeWidth={1.5} /> : <RotateCcw size={28} strokeWidth={1.5} />}
          </div>
          <h2 className="text-display text-[clamp(1.8rem,3.5vw,2.5rem)] mt-5 leading-tight">
            {result.passed ? "Passed" : "Not quite yet"}
          </h2>
          <p className="mt-3 text-[0.95rem] text-[var(--color-charcoal-700)]">
            You scored <strong className="tabular-nums">{result.pct}%</strong> ({result.correct} of {result.total} correct). The pass mark is {EXAM_PASS_PCT}%.
          </p>
          <p className="mt-1 text-[0.82rem] text-[var(--color-charcoal-500)]">
            Best score kept: {keepBest(bestScore, result.pct)}%{passed || result.passed ? " · module passed" : ""}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={retake}
              className="text-eyebrow inline-flex items-center gap-2 border border-[var(--color-charcoal-900)] px-5 py-3 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors"
            >
              <RotateCcw size={14} strokeWidth={1.5} /> Retake with a new set
            </button>
            <Link
              href="/learn"
              className="text-eyebrow inline-flex items-center gap-2 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-5 py-3 hover:bg-[var(--color-burgundy-800)] transition-colors"
            >
              Back to course <ArrowRight size={14} strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ModuleHeader mod={mod} />

      <div className="mt-8 flex items-center justify-between gap-4 text-eyebrow text-[var(--color-charcoal-500)]">
        <span className="inline-flex items-center gap-2"><GraduationCap size={14} strokeWidth={1.6} /> Quiz</span>
        <span className="tabular-nums">Question {qIdx + 1} of {attempt.length}</span>
      </div>
      <div className="mt-2 h-1 bg-[var(--color-ivory-200)] overflow-hidden">
        <div className="h-full bg-[var(--color-burgundy-700)] transition-all duration-300" style={{ width: `${((qIdx + 1) / attempt.length) * 100}%` }} />
      </div>

      <article className="mt-8 border border-black/10 bg-white p-8 lg:p-10">
        <div className="text-eyebrow text-[var(--color-burgundy-700)]">
          {q.multi ? "Select all that apply" : "Select one"}
        </div>
        <h2 className="mt-2 text-display text-[clamp(1.3rem,2.4vw,1.75rem)] leading-tight text-[var(--color-charcoal-900)]">
          {q.scenario}
        </h2>
        <ul className="mt-6 space-y-3">
          {q.options.map((opt, i) => {
            const isChosen = sel.includes(i);
            const isCorrect = q.correct.includes(i);
            // After reveal: every correct option is burgundy, a wrong ticked one is marked.
            let cls = "border-black/15 hover:border-[var(--color-burgundy-700)]";
            if (isRevealed) {
              if (isCorrect) cls = "border-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)]";
              else if (isChosen) cls = "border-[var(--color-charcoal-900)]/40 bg-black/5";
              else cls = "border-black/10 opacity-70";
            } else if (isChosen) {
              cls = "border-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)]";
            }
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  disabled={isRevealed}
                  className={`w-full text-left flex items-center gap-3 border px-4 py-3.5 text-[0.95rem] text-[var(--color-charcoal-900)] transition-colors ${cls} ${isRevealed ? "cursor-default" : ""}`}
                >
                  {/* Selection control: round for single-select, square for multi-select. */}
                  <span className={`shrink-0 inline-flex items-center justify-center w-5 h-5 border ${q.multi ? "rounded-[4px]" : "rounded-full"} ${isChosen || (isRevealed && isCorrect) ? "border-[var(--color-burgundy-700)]" : "border-[var(--color-charcoal-400)]"}`}>
                    {isChosen && <span className={`w-2.5 h-2.5 ${q.multi ? "rounded-[2px]" : "rounded-full"} bg-[var(--color-burgundy-700)]`} />}
                  </span>
                  <span className="flex-1">{opt}</span>
                  {isRevealed && isCorrect && <Check size={16} strokeWidth={2} className="text-[var(--color-burgundy-700)] shrink-0" />}
                  {isRevealed && isChosen && !isCorrect && <X size={16} strokeWidth={2} className="text-[var(--color-charcoal-500)] shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>

        {isRevealed && (
          <div className={`mt-5 border-l-2 pl-4 py-1 text-[0.9rem] leading-relaxed ${questionRight ? "border-[var(--color-burgundy-700)] text-[var(--color-charcoal-800)]" : "border-[var(--color-charcoal-400)] text-[var(--color-charcoal-700)]"}`}>
            <span className="text-eyebrow text-[var(--color-burgundy-700)]">{questionRight ? "Correct" : q.multi ? "Not quite (you need every correct answer)" : "Not quite"}</span>
            <p className="mt-1">{q.rationale}</p>
          </div>
        )}
      </article>

      <div className="mt-8 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBackToLessons}
          className="text-eyebrow inline-flex items-center gap-2 border border-[var(--color-charcoal-900)]/25 px-5 py-3 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors"
        >
          <ArrowLeft size={14} strokeWidth={1.5} /> Back to lessons
        </button>
        {isRevealed ? (
          <button
            type="button"
            onClick={() => { if (isLastQ) { setFinished(true); return; } setQIdx((i) => i + 1); }}
            className="text-eyebrow inline-flex items-center gap-2 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-5 py-3 hover:bg-[var(--color-burgundy-800)] transition-colors"
          >
            {isLastQ ? "See results" : "Next question"} <ArrowRight size={14} strokeWidth={1.5} />
          </button>
        ) : (
          <button
            type="button"
            disabled={sel.length === 0}
            onClick={check}
            className="text-eyebrow inline-flex items-center gap-2 bg-[var(--color-charcoal-900)] text-[var(--color-ivory-100)] px-5 py-3 hover:bg-[var(--color-burgundy-700)] transition-colors disabled:opacity-40"
          >
            Check answer <ArrowRight size={14} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  );
}

function ModuleHeader({ mod }: { mod: Module }) {
  return (
    <div className="border-b border-black/10 pb-6">
      <Link href="/learn" className="inline-flex items-center gap-2 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors">
        <ArrowLeft size={14} strokeWidth={1.5} /> Course overview
      </Link>
      <span className="block mt-5 text-eyebrow text-[var(--color-burgundy-700)]">Module {mod.order} of {modules.length}</span>
      <h1 className="text-display text-[clamp(2rem,4vw,3rem)] mt-2 leading-[1.04]">{mod.title}</h1>
    </div>
  );
}

function Shell({ children, onSignOut }: { children: React.ReactNode; onSignOut?: () => void }) {
  return (
    <div className="pt-32 md:pt-40 pb-24 min-h-[80vh]">
      <div className="container-editorial">
        <div className="mx-auto max-w-[860px]">
          {onSignOut && (
            <div className="flex justify-end mb-6">
              <button type="button" onClick={onSignOut} className="inline-flex items-center gap-2 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors">
                <LogOut size={14} strokeWidth={1.5} /> Sign out
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

function Gate({ title, body, cta }: { title: string; body: string; cta?: { href: string; label: string } }) {
  return (
    <div className="max-w-md">
      <Lock size={22} strokeWidth={1.4} className="text-[var(--color-burgundy-700)]" />
      <h1 className="text-display text-[clamp(2rem,4vw,3rem)] mt-4">{title}</h1>
      <p className="mt-4 text-[0.95rem] text-[var(--color-charcoal-700)] leading-relaxed">{body}</p>
      <Link href={cta?.href ?? "/learn"} className="mt-6 inline-flex items-center gap-2 text-eyebrow bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-5 py-3 hover:bg-[var(--color-burgundy-800)] transition-colors">
        {cta?.label ?? "Course overview"} <ArrowRight size={14} strokeWidth={1.5} />
      </Link>
    </div>
  );
}
