"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, GraduationCap, Lock, Plus, Trash2, RefreshCw, AlertCircle, Check, UserPlus,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { isAdmin } from "@/lib/admin";
import { supabase } from "@/lib/supabase";
import { modules } from "@/lib/learn/course";
import { courseProgress, type ModuleProgress } from "@/lib/learn/quiz";

type ProgressRow = {
  module_slug: string;
  lessons_completed: string[];
  quiz_best_score: number | null;
  quiz_attempts: number;
  quiz_passed: boolean;
  updated_at: string;
};
type Employee = {
  email: string;
  full_name: string | null;
  added_at: string;
  progress: ProgressRow[];
  lastActive: string | null;
};

export default function AdminEmployeesPage() {
  const { user, loading } = useAuth();
  const [admin, setAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) { setAdmin(false); return; }
    isAdmin(user.email).then(setAdmin);
  }, [user]);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const authHeader = useCallback(async () => {
    const { data: s } = await supabase.auth.getSession();
    const token = s.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : null;
  }, []);

  const load = useCallback(async () => {
    setLoadingData(true); setError(null);
    try {
      const headers = await authHeader();
      if (!headers) { setError("Sign in required."); setLoadingData(false); return; }
      const res = await fetch("/api/admin/employees", { headers });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setError(body?.error || `Request failed (${res.status}).`); }
      else setEmployees((body.employees ?? []) as Employee[]);
    } catch {
      setError("Could not load employees.");
    } finally {
      setLoadingData(false);
    }
  }, [authHeader]);

  useEffect(() => { if (admin) load(); }, [admin, load]);

  async function addEmployee(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const headers = await authHeader();
      if (!headers) { setError("Sign in required."); return; }
      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), full_name: name.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setError(body?.error || "Could not add employee."); return; }
      setEmail(""); setName("");
      await load();
    } catch {
      setError("Could not add employee.");
    } finally {
      setBusy(false);
    }
  }

  async function removeEmployee(target: string) {
    setBusy(true); setError(null);
    try {
      const headers = await authHeader();
      if (!headers) { setError("Sign in required."); return; }
      const res = await fetch("/api/admin/employees", {
        method: "DELETE",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ email: target }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setError(body?.error || "Could not remove employee."); return; }
      setConfirmDel(null);
      await load();
    } catch {
      setError("Could not remove employee.");
    } finally {
      setBusy(false);
    }
  }

  if (loading || admin === null) return <Shell><p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading…</p></Shell>;

  if (!user) {
    return (
      <Shell>
        <h1 className="text-display text-[clamp(2rem,4vw,3rem)]">Employees</h1>
        <p className="mt-4 text-[0.95rem] text-[var(--color-charcoal-700)]">
          Please <Link href="/account" className="text-[var(--color-burgundy-700)] underline">sign in</Link> with an admin account.
        </p>
      </Shell>
    );
  }
  if (!admin) {
    return (
      <Shell>
        <div className="max-w-md">
          <Lock size={22} strokeWidth={1.4} className="text-[var(--color-burgundy-700)]" />
          <h1 className="text-display text-[clamp(2rem,4vw,3rem)] mt-4">Access restricted</h1>
          <p className="mt-4 text-[0.95rem] text-[var(--color-charcoal-700)] leading-relaxed">
            This area is reserved for the atelier. Visit <Link href="/account" className="text-[var(--color-burgundy-700)] underline">your account</Link> instead.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 border-b border-black/10 pb-8">
        <div>
          <span className="text-eyebrow text-[var(--color-burgundy-700)] inline-flex items-center gap-2">
            <GraduationCap size={14} strokeWidth={1.6} /> Learning platform
          </span>
          <h1 className="text-display text-[clamp(2.25rem,4.5vw,3.5rem)] leading-[1.02] mt-2">Employees</h1>
          <p className="mt-3 text-[0.9rem] text-[var(--color-charcoal-500)] max-w-2xl">
            Add staff to the learning roster and track their progress through {modules.length} modules of The Hilton Way.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loadingData || busy}
          className="self-start text-eyebrow inline-flex items-center gap-2 border border-[var(--color-charcoal-900)]/25 px-4 py-3 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} strokeWidth={1.5} className={loadingData ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {error && (
        <p className="mt-6 text-[0.85rem] text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)] border border-[var(--color-burgundy-700)]/20 px-3 py-2 inline-flex items-center gap-2">
          <AlertCircle size={14} strokeWidth={1.5} /> {error}
        </p>
      )}

      {/* Add employee */}
      <section className="mt-8 border border-black/10 bg-[var(--color-ivory-100)] p-6 lg:p-7">
        <h2 className="text-display text-[1.25rem] inline-flex items-center gap-2">
          <UserPlus size={16} strokeWidth={1.6} className="text-[var(--color-burgundy-700)]" /> Add an employee
        </h2>
        <form onSubmit={addEmployee} className="mt-4 flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="staff@hiltonmtm.com"
            className="flex-1 min-w-[220px] px-3 py-2.5 border border-black/15 bg-white focus:outline-none focus:border-[var(--color-burgundy-700)] text-[0.9rem]"
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name (optional)"
            className="flex-1 min-w-[180px] px-3 py-2.5 border border-black/15 bg-white focus:outline-none focus:border-[var(--color-burgundy-700)] text-[0.9rem]"
          />
          <button
            type="submit"
            disabled={busy}
            className="text-eyebrow inline-flex items-center justify-center gap-2 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-5 py-3 hover:bg-[var(--color-burgundy-800)] transition-colors disabled:opacity-60"
          >
            <Plus size={14} strokeWidth={1.6} /> Add
          </button>
        </form>
        <p className="mt-3 text-[0.75rem] text-[var(--color-charcoal-500)]">
          The employee signs in at <code className="text-[0.72rem]">/account</code> with the same email and is taken straight to <code className="text-[0.72rem]">/learn</code>. They are exempt from the login code, like other staff.
        </p>
      </section>

      {/* Tracker */}
      <section className="mt-10">
        <div className="flex items-end justify-between gap-4 mb-4">
          <h2 className="text-display text-[1.5rem] leading-tight">Progress tracker</h2>
          <span className="text-eyebrow text-[var(--color-charcoal-500)]">{employees.length} employee{employees.length === 1 ? "" : "s"}</span>
        </div>

        {loadingData ? (
          <p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading…</p>
        ) : employees.length === 0 ? (
          <div className="border border-dashed border-black/15 py-14 px-6 text-center">
            <p className="text-[0.9rem] text-[var(--color-charcoal-700)]">No employees on the roster yet. Add one above to begin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-black/10">
            <table className="w-full text-[0.82rem] border-collapse">
              <thead>
                <tr className="bg-[var(--color-ivory-200)] text-left">
                  <th className="px-4 py-3 text-eyebrow text-[var(--color-charcoal-500)] font-normal sticky left-0 bg-[var(--color-ivory-200)] whitespace-nowrap">Employee</th>
                  {modules.map((m) => (
                    <th key={m.slug} className="px-3 py-3 text-eyebrow text-[var(--color-charcoal-500)] font-normal whitespace-nowrap" title={m.title}>
                      M{m.order}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-eyebrow text-[var(--color-charcoal-500)] font-normal whitespace-nowrap">Overall</th>
                  <th className="px-3 py-3 text-eyebrow text-[var(--color-charcoal-500)] font-normal whitespace-nowrap">Last active</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {employees.map((emp) => {
                  const byModule: Record<string, ModuleProgress> = {};
                  for (const r of emp.progress) {
                    byModule[r.module_slug] = {
                      lessons_completed: r.lessons_completed ?? [],
                      quiz_best_score: r.quiz_best_score,
                      quiz_attempts: r.quiz_attempts ?? 0,
                      quiz_passed: !!r.quiz_passed,
                    };
                  }
                  const overall = courseProgress(modules, byModule);
                  return (
                    <tr key={emp.email} className="align-top">
                      <td className="px-4 py-3 sticky left-0 bg-white whitespace-nowrap">
                        <div className="text-[var(--color-charcoal-900)]">{emp.full_name || emp.email.split("@")[0]}</div>
                        <div className="text-[0.72rem] text-[var(--color-charcoal-500)]">{emp.email}</div>
                      </td>
                      {modules.map((m) => {
                        const p = byModule[m.slug];
                        const lessonsDone = p ? m.lessons.filter((l) => p.lessons_completed.includes(l.slug)).length : 0;
                        return (
                          <td key={m.slug} className="px-3 py-3 whitespace-nowrap tabular-nums">
                            {p ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[var(--color-charcoal-700)]">L {lessonsDone}/{m.lessons.length}</span>
                                <span className={p.quiz_passed ? "text-[var(--color-burgundy-700)] inline-flex items-center gap-1" : "text-[var(--color-charcoal-500)]"}>
                                  {p.quiz_best_score != null ? `${p.quiz_best_score}%` : "no quiz yet"}
                                  {p.quiz_passed && <Check size={11} strokeWidth={2.4} />}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[var(--color-charcoal-400)]">Not started</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="text-display text-[1.05rem] text-[var(--color-burgundy-700)] tabular-nums">{overall.pct}%</span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-[0.78rem] text-[var(--color-charcoal-500)]">
                        {emp.lastActive ? new Date(emp.lastActive).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Not started"}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right">
                        {confirmDel === emp.email ? (
                          <span className="inline-flex items-center gap-2">
                            <button type="button" disabled={busy} onClick={() => removeEmployee(emp.email)} className="text-eyebrow text-[var(--color-burgundy-700)] hover:underline disabled:opacity-50">Confirm</button>
                            <button type="button" onClick={() => setConfirmDel(null)} className="text-eyebrow text-[var(--color-charcoal-500)] hover:underline">Cancel</button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDel(emp.email)}
                            className="text-[var(--color-charcoal-400)] hover:text-[var(--color-burgundy-700)] transition-colors"
                            title="Remove from roster"
                          >
                            <Trash2 size={15} strokeWidth={1.5} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-[0.72rem] text-[var(--color-charcoal-400)]">
          L = lessons read. The percentage under it is the best quiz score (a tick means the {modules[0]?.quiz.passPct}% pass mark was met). Overall blends lessons read with quizzes passed.
        </p>
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-32 md:pt-40 pb-24 min-h-[80vh]">
      <div className="container-editorial">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors mb-8"
        >
          <ArrowLeft size={14} strokeWidth={1.5} /> Admin
        </Link>
        {children}
      </div>
    </div>
  );
}
