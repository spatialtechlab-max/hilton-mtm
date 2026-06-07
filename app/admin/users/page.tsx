"use client";

/**
 * /admin/users — atelier-facing list of every registered customer.
 *
 * Calls /api/admin/users with the signed-in Bearer token. The endpoint
 * decides whether it can enumerate auth.users (service-role key set)
 * or has to synthesise the list from profiles + orders; the `partial`
 * flag drives a one-line notice in the UI so the atelier knows.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Users, AlertCircle, ExternalLink } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { isAdmin } from "@/lib/admin";
import { supabase } from "@/lib/supabase";

type AdminUser = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  orders_count: number;
  total_spent: number;
  profile_complete: boolean;
};

const fmtBhd = (n: number) => `BHD ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const fmtDate = (iso: string) => {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }); }
  catch { return "—"; }
};

export default function AdminUsersPage() {
  const { user, loading } = useAuth();
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [partial, setPartial] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!user) { setAdmin(false); return; }
    isAdmin(user.email).then(setAdmin);
  }, [user]);

  useEffect(() => {
    if (!admin) return;
    let cancelled = false;
    (async () => {
      setLoadingData(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token ?? "";
        const res = await fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } });
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) { setError(body?.error ?? "Couldn't load users."); return; }
        setRows((body.users ?? []) as AdminUser[]);
        setPartial(Boolean(body.partial));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Couldn't load users.");
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    })();
    return () => { cancelled = true; };
  }, [admin]);

  const visible = useMemo(() => {
    if (!q.trim()) return rows;
    const n = q.toLowerCase();
    return rows.filter((r) =>
      (r.email ?? "").toLowerCase().includes(n) ||
      (r.full_name ?? "").toLowerCase().includes(n) ||
      (r.phone ?? "").toLowerCase().includes(n) ||
      (r.city ?? "").toLowerCase().includes(n) ||
      (r.country ?? "").toLowerCase().includes(n),
    );
  }, [rows, q]);

  const totalSpend = rows.reduce((s, r) => s + r.total_spent, 0);
  const completed = rows.filter((r) => r.profile_complete).length;

  if (loading || admin === null) return <Shell><p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading…</p></Shell>;
  if (!user) return <Shell><p>Sign in required.</p></Shell>;
  if (!admin) return <Shell><p>Not authorised.</p></Shell>;

  return (
    <Shell>
      <header className="mb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-eyebrow text-[var(--color-burgundy-700)]">Admin · Users</span>
            <h1 className="text-display text-[clamp(2rem,4vw,3rem)] mt-2 leading-tight">Registered customers</h1>
            <p className="mt-3 text-[0.9rem] text-[var(--color-charcoal-500)] max-w-2xl">
              Everyone who has signed up on the website. Click an email to draft a message; the spend column
              excludes cancelled orders.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin"           className="text-eyebrow inline-flex items-center gap-2 border border-black/15 px-4 py-2.5 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors">Customizer options</Link>
            <Link href="/admin/garments"  className="text-eyebrow inline-flex items-center gap-2 border border-black/15 px-4 py-2.5 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors">Garments</Link>
            <Link href="/admin/media"     className="text-eyebrow inline-flex items-center gap-2 border border-black/15 px-4 py-2.5 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors">Media</Link>
            <Link href="/admin/fabrics"   className="text-eyebrow inline-flex items-center gap-2 border border-black/15 px-4 py-2.5 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors">Fabrics</Link>
            <Link href="/admin/orders"    className="text-eyebrow inline-flex items-center gap-2 border border-black/15 px-4 py-2.5 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors">Orders</Link>
            <Link href="/admin/settings"  className="text-eyebrow inline-flex items-center gap-2 border border-black/15 px-4 py-2.5 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors">Settings</Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Total users" value={rows.length.toString()} icon={<Users size={14} strokeWidth={1.5} />} />
          <Stat label="Profile completed" value={`${completed} of ${rows.length}`} />
          <Stat label="Lifetime spend" value={fmtBhd(totalSpend)} />
          <Stat label="With orders" value={rows.filter((r) => r.orders_count > 0).length.toString()} />
        </div>
      </header>

      {partial && (
        <p className="mb-5 text-[0.82rem] text-[var(--color-charcoal-700)] bg-[var(--color-ivory-200)] border border-black/10 px-3 py-2 inline-flex items-center gap-2">
          <AlertCircle size={13} strokeWidth={1.5} className="text-[var(--color-burgundy-700)]" />
          Partial view — signups who never completed a profile or order are hidden. Add <code className="text-[0.78rem]">SUPABASE_SERVICE_ROLE_KEY</code> to your env to enumerate every auth user.
        </p>
      )}

      {error && (
        <p className="mb-6 text-[0.85rem] text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)] border border-[var(--color-burgundy-700)]/20 px-3 py-2 inline-flex items-center gap-2">
          <AlertCircle size={14} strokeWidth={1.5} /> {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-charcoal-500)]" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search email / name / phone / city"
            className="w-full pl-9 pr-3 py-2.5 border border-black/15 bg-[var(--color-ivory-100)] focus:outline-none focus:border-[var(--color-burgundy-700)] text-[0.9rem]"
          />
        </div>
      </div>

      {loadingData ? (
        <p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading users…</p>
      ) : visible.length === 0 ? (
        <div className="border border-black/10 bg-[var(--color-ivory-200)] p-10 text-center">
          <Users size={28} strokeWidth={1.4} className="mx-auto text-[var(--color-burgundy-700)]" />
          <p className="mt-4 text-[var(--color-charcoal-700)]">No users match this search.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[0.7rem] tracking-[0.15em] uppercase text-[var(--color-charcoal-500)] border-b border-black/10">
                <th className="text-left py-3 px-3">Customer</th>
                <th className="text-left py-3 px-3 hidden md:table-cell">Email</th>
                <th className="text-left py-3 px-3 hidden lg:table-cell">Phone</th>
                <th className="text-left py-3 px-3 hidden lg:table-cell">Location</th>
                <th className="text-right py-3 px-3">Orders</th>
                <th className="text-right py-3 px-3">Spend</th>
                <th className="text-left py-3 px-3 hidden md:table-cell">Joined</th>
                <th className="text-left py-3 px-3 hidden xl:table-cell">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id} className="border-b border-black/5 hover:bg-[var(--color-ivory-200)] transition-colors">
                  <td className="py-3 px-3">
                    <div className="text-[0.9rem] text-[var(--color-charcoal-900)]">{r.full_name ?? <span className="text-[var(--color-charcoal-500)] italic">Not provided</span>}</div>
                    {!r.profile_complete && (
                      <span className="text-[0.65rem] tracking-[0.15em] uppercase text-[var(--color-charcoal-500)]">Profile incomplete</span>
                    )}
                  </td>
                  <td className="py-3 px-3 hidden md:table-cell">
                    {r.email ? (
                      <a
                        href={`mailto:${r.email}`}
                        className="text-[0.85rem] text-[var(--color-burgundy-700)] hover:underline inline-flex items-center gap-1"
                      >
                        {r.email}
                        <ExternalLink size={11} strokeWidth={1.5} />
                      </a>
                    ) : <span className="text-[var(--color-charcoal-500)]">—</span>}
                  </td>
                  <td className="py-3 px-3 hidden lg:table-cell text-[0.85rem] tabular-nums">{r.phone ?? "—"}</td>
                  <td className="py-3 px-3 hidden lg:table-cell text-[0.85rem]">{[r.city, r.country].filter(Boolean).join(", ") || "—"}</td>
                  <td className="py-3 px-3 text-right tabular-nums text-[0.9rem]">{r.orders_count}</td>
                  <td className="py-3 px-3 text-right tabular-nums text-[0.9rem]">{r.total_spent > 0 ? fmtBhd(r.total_spent) : "—"}</td>
                  <td className="py-3 px-3 hidden md:table-cell text-[0.85rem] text-[var(--color-charcoal-500)]">{fmtDate(r.created_at)}</td>
                  <td className="py-3 px-3 hidden xl:table-cell text-[0.85rem] text-[var(--color-charcoal-500)]">{fmtDate(r.last_sign_in_at ?? "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="border border-black/10 p-4 bg-[var(--color-ivory-100)]">
      <div className="text-[0.65rem] tracking-[0.18em] uppercase text-[var(--color-charcoal-500)] inline-flex items-center gap-1.5">
        {icon} {label}
      </div>
      <div className="text-display text-[1.4rem] mt-1.5 text-[var(--color-charcoal-900)]">{value}</div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-32 md:pt-40 pb-24 min-h-[80vh]">
      <div className="container-editorial">
        <Link href="/" className="inline-flex items-center gap-2 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors mb-8">
          <ArrowLeft size={14} strokeWidth={1.5} /> The House
        </Link>
        {children}
      </div>
    </div>
  );
}
