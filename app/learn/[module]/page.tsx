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
import { gradeAttempt, keepBest, type ModuleProgress } from "@/lib/learn/quiz";
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
      <QuizRunner
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

function QuizRunner({
  mod, bestScore, passed, onAttempt, onBackToLessons,
}: {
  mod: Module;
  bestScore: number | null;
  passed: boolean;
  onAttempt: (pct: number, didPass: boolean) => void;
  onBackToLessons: () => void;
}) {
  const questions = mod.quiz.questions;
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Array<number | undefined>>(() => questions.map(() => undefined));
  const [revealed, setRevealed] = useState(false); // current question answered + feedback shown
  const [finished, setFinished] = useState(false);
  const reportedRef = useRef(false);

  const q = questions[qIdx];
  const chosen = answers[qIdx];

  const choose = (optIdx: number) => {
    if (revealed) return;
    setAnswers((prev) => { const next = [...prev]; next[qIdx] = optIdx; return next; });
    setRevealed(true);
  };

  const result = useMemo(() => gradeAttempt(answers, mod.quiz), [answers, mod.quiz]);

  // Record the attempt once, when the results screen first shows.
  useEffect(() => {
    if (finished && !reportedRef.current) {
      reportedRef.current = true;
      onAttempt(result.pct, result.passed);
    }
  }, [finished, result.pct, result.passed, onAttempt]);

  const retake = () => {
    setAnswers(questions.map(() => undefined));
    setQIdx(0);
    setRevealed(false);
    setFinished(false);
    reportedRef.current = false;
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
            You scored <strong className="tabular-nums">{result.pct}%</strong> ({result.correct} of {result.total} correct). The pass mark is {mod.quiz.passPct}%.
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
              <RotateCcw size={14} strokeWidth={1.5} /> Retake quiz
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

  const isLastQ = qIdx === questions.length - 1;
  return (
    <div>
      <ModuleHeader mod={mod} />

      <div className="mt-8 flex items-center justify-between gap-4 text-eyebrow text-[var(--color-charcoal-500)]">
        <span className="inline-flex items-center gap-2"><GraduationCap size={14} strokeWidth={1.6} /> Quiz</span>
        <span className="tabular-nums">Question {qIdx + 1} of {questions.length}</span>
      </div>
      <div className="mt-2 h-1 bg-[var(--color-ivory-200)] overflow-hidden">
        <div className="h-full bg-[var(--color-burgundy-700)] transition-all duration-300" style={{ width: `${((qIdx + 1) / questions.length) * 100}%` }} />
      </div>

      <article className="mt-8 border border-black/10 bg-white p-8 lg:p-10">
        <h2 className="text-display text-[clamp(1.4rem,2.6vw,1.9rem)] leading-tight text-[var(--color-charcoal-900)]">
          {q.q}
        </h2>
        <ul className="mt-6 space-y-3">
          {q.options.map((opt, i) => {
            const isChosen = chosen === i;
            const isCorrect = i === q.answer;
            // After reveal: correct option is burgundy, a wrong chosen one is marked.
            let cls = "border-black/15 hover:border-[var(--color-burgundy-700)]";
            if (revealed) {
              if (isCorrect) cls = "border-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)]";
              else if (isChosen) cls = "border-[var(--color-charcoal-900)]/40 bg-black/5";
              else cls = "border-black/10 opacity-70";
            }
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => choose(i)}
                  disabled={revealed}
                  className={`w-full text-left flex items-center justify-between gap-3 border px-4 py-3.5 text-[0.95rem] text-[var(--color-charcoal-900)] transition-colors ${cls} ${revealed ? "cursor-default" : ""}`}
                >
                  <span>{opt}</span>
                  {revealed && isCorrect && <Check size={16} strokeWidth={2} className="text-[var(--color-burgundy-700)] shrink-0" />}
                  {revealed && isChosen && !isCorrect && <X size={16} strokeWidth={2} className="text-[var(--color-charcoal-500)] shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>

        {revealed && (
          <div className={`mt-5 border-l-2 pl-4 py-1 text-[0.9rem] leading-relaxed ${chosen === q.answer ? "border-[var(--color-burgundy-700)] text-[var(--color-charcoal-800)]" : "border-[var(--color-charcoal-400)] text-[var(--color-charcoal-700)]"}`}>
            <span className="text-eyebrow text-[var(--color-burgundy-700)]">{chosen === q.answer ? "Correct" : "Not quite"}</span>
            <p className="mt-1">{q.feedback}</p>
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
        <button
          type="button"
          disabled={!revealed}
          onClick={() => {
            if (isLastQ) { setFinished(true); return; }
            setQIdx((i) => i + 1);
            setRevealed(false);
          }}
          className="text-eyebrow inline-flex items-center gap-2 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-5 py-3 hover:bg-[var(--color-burgundy-800)] transition-colors disabled:opacity-40"
        >
          {isLastQ ? "See results" : "Next question"} <ArrowRight size={14} strokeWidth={1.5} />
        </button>
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
