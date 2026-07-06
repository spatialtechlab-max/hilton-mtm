"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ShieldCheck, Lock, Plus, Trash2, RefreshCw, AlertCircle, Check, UserPlus,
  Boxes, GraduationCap,
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
type Person = {
  email: string;
  fullName: string | null;
  isOperator: boolean;
  isStaff: boolean;
  progress: ProgressRow[];
  lastActive: string | null;
};
type Role = "operator" | "staff";

export default function AdminTeamAccessPage() {
  const { user, loading } = useAuth();
  const [admin, setAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) { setAdmin(false); return; }
    isAdmin(user.email).then(setAdmin);
  }, [user]);

  const [people, setPeople] = useState<Person[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Which (email + role) toggle is mid-flight, so only that chip disables.
  const [toggling, setToggling] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [addOperator, setAddOperator] = useState(false);
  const [addStaff, setAddStaff] = useState(true);
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
      const res = await fetch("/api/admin/access", { headers });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setError(body?.error || `Request failed (${res.status}).`); }
      else setPeople((body.people ?? []) as Person[]);
    } catch {
      setError("Could not load the team.");
    } finally {
      setLoadingData(false);
    }
  }, [authHeader]);

  useEffect(() => { if (admin) load(); }, [admin, load]);

  async function addPerson(e: React.FormEvent) {
    e.preventDefault();
    if (!addOperator && !addStaff) { setError("Pick at least one role (Operator or Training)."); return; }
    setBusy(true); setError(null);
    try {
      const headers = await authHeader();
      if (!headers) { setError("Sign in required."); return; }
      const res = await fetch("/api/admin/access", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), fullName: name.trim(), operator: addOperator, staff: addStaff }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setError(body?.error || "Could not add the person."); return; }
      setEmail(""); setName("");
      await load();
    } catch {
      setError("Could not add the person.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleRole(target: string, role: Role, enabled: boolean) {
    setToggling(`${target}:${role}`); setError(null);
    try {
      const headers = await authHeader();
      if (!headers) { setError("Sign in required."); return; }
      const res = await fetch("/api/admin/access", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ email: target, role, enabled }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setError(body?.error || "Could not change that role."); return; }
      await load();
    } catch {
      setError("Could not change that role.");
    } finally {
      setToggling(null);
    }
  }

  async function removePerson(target: string) {
    setBusy(true); setError(null);
    try {
      const headers = await authHeader();
      if (!headers) { setError("Sign in required."); return; }
      const res = await fetch("/api/admin/access", {
        method: "DELETE",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ email: target }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setError(body?.error || "Could not remove the person."); return; }
      setConfirmDel(null);
      await load();
    } catch {
      setError("Could not remove the person.");
    } finally {
      setBusy(false);
    }
  }

  if (loading || admin === null) return <Shell><p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading…</p></Shell>;

  if (!user) {
    return (
      <Shell>
        <h1 className="text-display text-[clamp(2rem,4vw,3rem)]">Team access</h1>
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

  const staffCount = people.filter((p) => p.isStaff).length;
  const operatorCount = people.filter((p) => p.isOperator).length;

  return (
    <Shell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 border-b border-black/10 pb-8">
        <div>
          <span className="text-eyebrow text-[var(--color-burgundy-700)] inline-flex items-center gap-2">
            <ShieldCheck size={14} strokeWidth={1.6} /> Roles & access
          </span>
          <h1 className="text-display text-[clamp(2.25rem,4.5vw,3.5rem)] leading-[1.02] mt-2">Team access</h1>
          <p className="mt-3 text-[0.9rem] text-[var(--color-charcoal-500)] max-w-2xl">
            Grant either role to any email. <strong>Operator</strong> opens the ERP image tool at <code className="text-[0.78rem]">/admin/erp</code>;
            <strong> Training</strong> opens the {modules.length}-module learning platform at <code className="text-[0.78rem]">/learn</code>. One person can hold both.
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

      {/* Add a person */}
      <section className="mt-8 border border-black/10 bg-[var(--color-ivory-100)] p-6 lg:p-7">
        <h2 className="text-display text-[1.25rem] inline-flex items-center gap-2">
          <UserPlus size={16} strokeWidth={1.6} className="text-[var(--color-burgundy-700)]" /> Add a person
        </h2>
        <form onSubmit={addPerson} className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="person@hiltonmtm.com"
              className="flex-1 min-w-[220px] px-3 py-2.5 border border-black/15 bg-white focus:outline-none focus:border-[var(--color-burgundy-700)] text-[0.9rem]"
            />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name (optional)"
              className="flex-1 min-w-[180px] px-3 py-2.5 border border-black/15 bg-white focus:outline-none focus:border-[var(--color-burgundy-700)] text-[0.9rem]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-eyebrow text-[0.62rem] text-[var(--color-charcoal-500)]">Roles</span>
            <RoleCheckbox
              label="Operator"
              hint="ERP image tool"
              icon={<Boxes size={13} strokeWidth={1.6} />}
              checked={addOperator}
              onChange={setAddOperator}
            />
            <RoleCheckbox
              label="Training (Staff)"
              hint="Learning platform"
              icon={<GraduationCap size={13} strokeWidth={1.6} />}
              checked={addStaff}
              onChange={setAddStaff}
            />
            <button
              type="submit"
              disabled={busy}
              className="ml-auto text-eyebrow inline-flex items-center justify-center gap-2 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-5 py-3 hover:bg-[var(--color-burgundy-800)] transition-colors disabled:opacity-60"
            >
              <Plus size={14} strokeWidth={1.6} /> Add
            </button>
          </div>
        </form>
        <p className="mt-3 text-[0.75rem] text-[var(--color-charcoal-500)]">
          The person signs in at <code className="text-[0.72rem]">/account</code> with the same email and is routed by role (Operator → <code className="text-[0.72rem]">/admin/erp</code>, otherwise Training → <code className="text-[0.72rem]">/learn</code>). Both roles are exempt from the login code.
        </p>
      </section>

      {/* Roster */}
      <section className="mt-10">
        <div className="flex items-end justify-between gap-4 mb-4">
          <h2 className="text-display text-[1.5rem] leading-tight">Roster</h2>
          <span className="text-eyebrow text-[var(--color-charcoal-500)]">
            {people.length} {people.length === 1 ? "person" : "people"} · {operatorCount} operator{operatorCount === 1 ? "" : "s"} · {staffCount} training
          </span>
        </div>

        {loadingData ? (
          <p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading…</p>
        ) : people.length === 0 ? (
          <div className="border border-dashed border-black/15 py-14 px-6 text-center">
            <p className="text-[0.9rem] text-[var(--color-charcoal-700)]">Nobody has a role yet. Add someone above to begin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-black/10">
            <table className="w-full text-[0.82rem] border-collapse">
              <thead>
                <tr className="bg-[var(--color-ivory-200)] text-left">
                  <th className="px-4 py-3 text-eyebrow text-[var(--color-charcoal-500)] font-normal sticky left-0 bg-[var(--color-ivory-200)] whitespace-nowrap">Person</th>
                  <th className="px-3 py-3 text-eyebrow text-[var(--color-charcoal-500)] font-normal whitespace-nowrap text-center">Operator</th>
                  <th className="px-3 py-3 text-eyebrow text-[var(--color-charcoal-500)] font-normal whitespace-nowrap text-center">Training</th>
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
                {people.map((person) => {
                  const byModule: Record<string, ModuleProgress> = {};
                  for (const r of person.progress) {
                    byModule[r.module_slug] = {
                      lessons_completed: r.lessons_completed ?? [],
                      quiz_best_score: r.quiz_best_score,
                      quiz_attempts: r.quiz_attempts ?? 0,
                      quiz_passed: !!r.quiz_passed,
                    };
                  }
                  const overall = courseProgress(modules, byModule);
                  return (
                    <tr key={person.email} className="align-top">
                      <td className="px-4 py-3 sticky left-0 bg-white whitespace-nowrap">
                        <div className="text-[var(--color-charcoal-900)]">{person.fullName || person.email.split("@")[0]}</div>
                        <div className="text-[0.72rem] text-[var(--color-charcoal-500)]">{person.email}</div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <RoleToggle
                          on={person.isOperator}
                          busy={toggling === `${person.email}:operator`}
                          onClick={() => toggleRole(person.email, "operator", !person.isOperator)}
                          label="Operator"
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <RoleToggle
                          on={person.isStaff}
                          busy={toggling === `${person.email}:staff`}
                          onClick={() => toggleRole(person.email, "staff", !person.isStaff)}
                          label="Training"
                        />
                      </td>
                      {person.isStaff ? (
                        <>
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
                            {person.lastActive ? new Date(person.lastActive).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Not started"}
                          </td>
                        </>
                      ) : (
                        <td colSpan={modules.length + 2} className="px-3 py-3 text-[0.78rem] text-[var(--color-charcoal-400)] italic">
                          Operator only — no learning progress
                        </td>
                      )}
                      <td className="px-3 py-3 whitespace-nowrap text-right">
                        {confirmDel === person.email ? (
                          <span className="inline-flex items-center gap-2">
                            <button type="button" disabled={busy} onClick={() => removePerson(person.email)} className="text-eyebrow text-[var(--color-burgundy-700)] hover:underline disabled:opacity-50">Confirm</button>
                            <button type="button" onClick={() => setConfirmDel(null)} className="text-eyebrow text-[var(--color-charcoal-500)] hover:underline">Cancel</button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDel(person.email)}
                            className="text-[var(--color-charcoal-400)] hover:text-[var(--color-burgundy-700)] transition-colors"
                            title="Remove from every role"
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
          Toggle a role on to grant it, off to revoke it. Turning off a person&rsquo;s last remaining role removes them from the roster; use the bin to remove every role at once.
          For Training rows, L = lessons read, the percentage under it is the best quiz score (a tick means the {modules[0]?.quiz.passPct}% pass mark was met), and Overall blends lessons read with quizzes passed.
        </p>
      </section>
    </Shell>
  );
}

/* Add-form role checkbox with icon + hint. */
function RoleCheckbox({
  label, hint, icon, checked, onChange,
}: {
  label: string;
  hint: string;
  icon: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={`inline-flex items-center gap-2 border px-3 py-2 cursor-pointer transition-colors ${
        checked
          ? "bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] border-[var(--color-burgundy-700)]"
          : "text-[var(--color-charcoal-700)] border-black/15 hover:border-[var(--color-burgundy-700)]"
      }`}
    >
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      {checked ? <Check size={13} strokeWidth={2.4} /> : icon}
      <span className="text-[0.82rem]">{label}</span>
      <span className={`text-[0.66rem] ${checked ? "text-[var(--color-ivory-100)]/70" : "text-[var(--color-charcoal-400)]"}`}>· {hint}</span>
    </label>
  );
}

/* Per-row on/off role toggle. Burgundy pill when on, outline when off. */
function RoleToggle({
  on, busy, onClick, label,
}: {
  on: boolean;
  busy: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={on}
      title={on ? `Revoke ${label}` : `Grant ${label}`}
      className={`text-eyebrow text-[0.6rem] inline-flex items-center justify-center gap-1 px-3 py-1.5 border transition-colors min-w-[64px] ${
        on
          ? "bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] border-[var(--color-burgundy-700)]"
          : "text-[var(--color-charcoal-400)] border-black/15 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)]"
      } ${busy ? "opacity-50" : ""}`}
    >
      {on ? <><Check size={11} strokeWidth={2.4} /> On</> : "Off"}
    </button>
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
