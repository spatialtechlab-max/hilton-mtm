"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, GraduationCap, LogOut, Lock, CheckCircle2, Circle, Eye } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { isAdmin, isEmployee } from "@/lib/admin";
import { course, modules } from "@/lib/learn/course";
import { EXAM_PASS_PCT } from "@/lib/learn/examBank";
import { courseProgress, moduleComplete, type ModuleProgress } from "@/lib/learn/quiz";
import { fetchMyProgress, type ProgressByModule } from "@/lib/learn/progressClient";

export default function LearnDashboardPage() {
  const { user, loading, signOut } = useAuth();
  // access: null = checking; { ok, admin } once resolved. Employees and admins
  // may view; admins are previewing.
  const [access, setAccess] = useState<{ ok: boolean; admin: boolean } | null>(null);
  const [progress, setProgress] = useState<ProgressByModule>({});
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) { setAccess({ ok: false, admin: false }); return; }
    Promise.all([isEmployee(user.email), isAdmin(user.email)]).then(([emp, adm]) =>
      setAccess({ ok: emp || adm, admin: adm }),
    );
  }, [user]);

  useEffect(() => {
    if (!user || !access?.ok) return;
    let cancelled = false;
    fetchMyProgress(user.id).then((p) => {
      if (cancelled) return;
      setProgress(p);
      setLoadingData(false);
    });
    return () => { cancelled = true; };
  }, [user, access]);

  if (loading || access === null) return <Shell><p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading…</p></Shell>;

  if (!user) {
    return (
      <Shell>
        <Gate
          title="Sign in to begin"
          body="The Hilton learning platform is for atelier staff. Please sign in with your staff account to continue."
          cta={{ href: "/account", label: "Sign in" }}
        />
      </Shell>
    );
  }

  if (!access.ok) {
    return (
      <Shell onSignOut={signOut}>
        <Gate
          title="You are not enrolled yet"
          body={`${user.email} is not on the staff learning roster. If you should have access, ask an atelier administrator to add you.`}
        />
      </Shell>
    );
  }

  const overall = courseProgress(modules, progress);
  const firstName =
    ((user.user_metadata as { full_name?: string; name?: string } | undefined)?.full_name ??
      (user.user_metadata as { full_name?: string; name?: string } | undefined)?.name ??
      user.email?.split("@")[0] ??
      "")
      .split(" ")[0];

  return (
    <Shell onSignOut={signOut}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-black/10 pb-8">
        <div>
          <span className="text-eyebrow text-[var(--color-burgundy-700)] inline-flex items-center gap-2">
            <GraduationCap size={14} strokeWidth={1.6} /> Staff learning
          </span>
          <h1 className="text-display text-[clamp(2.5rem,5vw,4rem)] mt-3 leading-[1.02]">
            {course.title}
          </h1>
          <p className="mt-3 text-[0.95rem] text-[var(--color-charcoal-700)] leading-relaxed max-w-2xl">
            {firstName ? `Welcome, ${firstName}. ` : ""}{course.intro}
          </p>
        </div>
      </div>

      {access.admin && (
        <div className="mt-6 border border-[var(--color-burgundy-700)]/25 bg-[var(--color-burgundy-50)] px-4 py-3 text-[0.82rem] text-[var(--color-charcoal-800)] inline-flex items-center gap-2">
          <Eye size={14} strokeWidth={1.6} className="text-[var(--color-burgundy-700)]" />
          Admin preview. Your own progress is tracked here too if you complete the modules.
        </div>
      )}

      {/* Overall progress */}
      <section className="mt-8 border border-black/10 p-6 lg:p-8 bg-[var(--color-ivory-100)]">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
          <div>
            <span className="text-eyebrow text-[var(--color-burgundy-700)]">Your progress</span>
            <h2 className="text-display text-[1.4rem] mt-1.5 leading-tight">
              {overall.pct === 100 ? "Course complete. Well done." : "Course progress"}
            </h2>
            <p className="text-[0.85rem] text-[var(--color-charcoal-500)] mt-1.5">
              {overall.lessonsDone} of {overall.lessonsTotal} lessons read · {overall.modulesPassed} of {overall.modulesTotal} quizzes passed
            </p>
          </div>
          <div className="md:text-right">
            <div className="text-display text-[1.75rem] text-[var(--color-burgundy-700)] tabular-nums">{overall.pct}%</div>
          </div>
        </div>
        <div className="h-1.5 bg-[var(--color-ivory-200)] overflow-hidden">
          <div className="h-full bg-[var(--color-burgundy-700)] transition-all duration-500" style={{ width: `${overall.pct}%` }} />
        </div>
      </section>

      {/* Modules */}
      <section className="mt-10">
        <div className="flex items-end justify-between gap-4 mb-5">
          <h2 className="text-display text-[1.75rem] leading-tight">Modules</h2>
          {loadingData && <span className="text-eyebrow text-[var(--color-charcoal-500)]">Loading progress…</span>}
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {modules.map((m) => {
            const p: ModuleProgress | undefined = progress[m.slug];
            const lessonsDone = p ? m.lessons.filter((l) => p.lessons_completed.includes(l.slug)).length : 0;
            const done = moduleComplete(m, p);
            return (
              <li key={m.slug}>
                <Link
                  href={`/learn/${m.slug}`}
                  className="group block h-full border border-black/10 bg-white p-6 lg:p-7 hover:border-[var(--color-burgundy-700)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <span className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full border border-[var(--color-burgundy-700)]/30 text-[var(--color-burgundy-700)] text-display text-[1.1rem] leading-none tabular-nums">
                        <span className="translate-y-[1px]">{m.order}</span>
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-display text-[1.25rem] text-[var(--color-charcoal-900)] leading-tight group-hover:text-[var(--color-burgundy-700)] transition-colors">
                          {m.title}
                        </h3>
                        <p className="mt-2 text-[0.85rem] text-[var(--color-charcoal-700)] leading-relaxed">{m.summary}</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-[var(--color-burgundy-700)]">
                      {done ? <CheckCircle2 size={18} strokeWidth={1.6} /> : <Circle size={18} strokeWidth={1.4} className="text-[var(--color-charcoal-400)]" />}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.78rem] text-[var(--color-charcoal-500)]">
                    <span className="tabular-nums">Lessons {lessonsDone}/{m.lessons.length}</span>
                    <span className="tabular-nums">
                      Quiz {p?.quiz_best_score != null ? `${p.quiz_best_score}%` : "not started"}
                    </span>
                    <span className={p?.quiz_passed ? "text-[var(--color-burgundy-700)]" : ""}>
                      {p?.quiz_passed ? "Passed" : `Pass at ${EXAM_PASS_PCT}%`}
                    </span>
                    <span className="ml-auto inline-flex items-center gap-1.5 text-eyebrow text-[var(--color-burgundy-700)]">
                      {p ? "Continue" : "Start"} <ArrowRight size={13} strokeWidth={1.6} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </Shell>
  );
}

function Shell({ children, onSignOut }: { children: React.ReactNode; onSignOut?: () => void }) {
  return (
    <div className="pt-32 md:pt-40 pb-24 min-h-[80vh]">
      <div className="container-editorial">
        <div className="mx-auto max-w-[1100px]">
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors">
              The House
            </Link>
            {onSignOut && (
              <button type="button" onClick={onSignOut} className="inline-flex items-center gap-2 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors">
                <LogOut size={14} strokeWidth={1.5} /> Sign out
              </button>
            )}
          </div>
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
      {cta && (
        <Link href={cta.href} className="mt-6 inline-flex items-center gap-2 text-eyebrow bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-5 py-3 hover:bg-[var(--color-burgundy-800)] transition-colors">
          {cta.label} <ArrowRight size={14} strokeWidth={1.5} />
        </Link>
      )}
    </div>
  );
}
