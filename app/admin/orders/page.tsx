"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Package, Search, Users } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { isAdmin } from "@/lib/admin";
import { listAllOrders, ORDER_STATUS_LABEL, ORDER_STATUSES, type Order, type OrderStatus } from "@/lib/orders";
import { supabase } from "@/lib/supabase";
import { OrderDetailModal } from "@/components/OrderDetailModal";

const fmt = (n: number) => `BHD ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export default function AdminOrdersPage() {
  const { user, loading } = useAuth();
  const [admin, setAdmin]   = useState<boolean | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [q, setQ]           = useState("");
  const [loadingData, setLoadingData] = useState(true);
  // Selected order number drives the modal. Null = closed.
  const [openOrder, setOpenOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setAdmin(false); return; }
    isAdmin(user.email).then(setAdmin);
  }, [user]);

  useEffect(() => {
    if (!admin) return;
    let cancelled = false;
    async function load() {
      const all = await listAllOrders();
      if (!cancelled) { setOrders(all); setLoadingData(false); }
    }
    load();

    // Realtime: refresh whenever any order is inserted/updated.
    const channel = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "mtm_orders" }, () => load())
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [admin]);

  if (loading || admin === null) return <Shell><p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading…</p></Shell>;
  if (!user)   return <Shell><GatePrompt msg="Sign in with an admin email to continue." /></Shell>;
  if (!admin)  return <Shell><GatePrompt msg={`${user.email} isn't authorised for the admin panel.`} /></Shell>;

  const visible = orders
    .filter((o) => filter === "all" || o.status === filter)
    .filter((o) => {
      if (!q.trim()) return true;
      const needle = q.toLowerCase();
      return (
        o.order_number.toLowerCase().includes(needle) ||
        o.customer_name.toLowerCase().includes(needle) ||
        o.customer_email.toLowerCase().includes(needle) ||
        o.customer_phone.toLowerCase().includes(needle)
      );
    });

  const countByStatus = ORDER_STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {});
  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + Number(o.subtotal), 0);

  // Unique customers count
  const uniqueCustomers = new Set(orders.map((o) => o.user_id)).size;

  return (
    <Shell>
      <header className="mb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-eyebrow text-[var(--color-burgundy-700)]">Admin</span>
            <h1 className="text-display text-[clamp(2rem,4vw,3rem)] mt-2 leading-tight">Orders & customers</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin" className="text-eyebrow inline-flex items-center gap-2 border border-black/15 px-4 py-2.5 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors">
              Customizer options
            </Link>
            <Link href="/admin/users" className="text-eyebrow inline-flex items-center gap-2 border border-black/15 px-4 py-2.5 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors">
              Users
            </Link>
            <Link href="/admin/fabrics" className="text-eyebrow inline-flex items-center gap-2 border border-black/15 px-4 py-2.5 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors">
              Fabrics
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Total orders" value={orders.length.toString()} />
          <Stat label="Unique customers" value={uniqueCustomers.toString()} icon={<Users size={14} strokeWidth={1.5} />} />
          <Stat label="In production" value={(countByStatus.in_production ?? 0).toString()} />
          <Stat label="Revenue (BHD)" value={fmt(totalRevenue)} />
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-charcoal-500)]" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search order # / customer / email / phone"
            className="w-full pl-9 pr-3 py-2.5 border border-black/15 bg-[var(--color-ivory-100)] focus:outline-none focus:border-[var(--color-burgundy-700)] text-[0.9rem]"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as OrderStatus | "all")}
          className="border border-black/15 bg-[var(--color-ivory-100)] px-3 py-2.5 text-[0.9rem] focus:outline-none focus:border-[var(--color-burgundy-700)]"
        >
          <option value="all">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{ORDER_STATUS_LABEL[s]} ({countByStatus[s] ?? 0})</option>
          ))}
        </select>
      </div>

      {/* Orders */}
      {loadingData ? (
        <p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading orders…</p>
      ) : visible.length === 0 ? (
        <div className="border border-black/10 bg-[var(--color-ivory-200)] p-10 text-center">
          <Package size={28} strokeWidth={1.4} className="mx-auto text-[var(--color-burgundy-700)]" />
          <p className="mt-4 text-[var(--color-charcoal-700)]">No orders match this filter.</p>
        </div>
      ) : (
        <>
        <OrderDetailModal
          orderNumber={openOrder}
          onClose={() => setOpenOrder(null)}
          onUpdated={async () => {
            // Refresh the list when the modal saved a change so the
            // status badge in the table reflects what just happened.
            const all = await listAllOrders();
            setOrders(all);
          }}
        />
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[0.7rem] tracking-[0.15em] uppercase text-[var(--color-charcoal-500)] border-b border-black/10">
                <th className="text-left py-3 px-3">Order #</th>
                <th className="text-left py-3 px-3">Customer</th>
                <th className="text-left py-3 px-3 hidden md:table-cell">Email</th>
                <th className="text-left py-3 px-3 hidden lg:table-cell">Phone</th>
                <th className="text-left py-3 px-3">Status</th>
                <th className="text-left py-3 px-3 hidden md:table-cell">Date</th>
                <th className="text-right py-3 px-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => setOpenOrder(o.order_number)}
                  className="border-b border-black/10 hover:bg-[var(--color-ivory-200)]/60 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-3 text-display text-[0.95rem] text-[var(--color-charcoal-900)] tabular-nums">
                    {o.order_number}
                  </td>
                  <td className="py-3 px-3 text-[0.9rem] text-[var(--color-charcoal-900)]">{o.customer_name || "—"}</td>
                  <td className="py-3 px-3 text-[0.85rem] text-[var(--color-charcoal-500)] hidden md:table-cell">{o.customer_email}</td>
                  <td className="py-3 px-3 text-[0.85rem] text-[var(--color-charcoal-500)] hidden lg:table-cell tabular-nums">{o.customer_phone || "—"}</td>
                  <td className="py-3 px-3">
                    <span className="text-[0.72rem] uppercase tracking-[0.12em] inline-block px-2 py-1 border border-[var(--color-burgundy-700)]/30 text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)]">
                      {ORDER_STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[0.82rem] text-[var(--color-charcoal-500)] hidden md:table-cell">
                    {new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="py-3 px-3 text-right text-[0.9rem] text-[var(--color-charcoal-900)] tabular-nums">{fmt(Number(o.subtotal))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </Shell>
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

function GatePrompt({ msg }: { msg: string }) {
  return (
    <div className="border border-black/10 bg-[var(--color-ivory-200)] p-10 max-w-xl">
      <p className="text-[var(--color-charcoal-700)]">{msg}</p>
      <Link href="/account" className="mt-5 text-eyebrow inline-flex items-center gap-2 text-[var(--color-burgundy-700)] hover:underline">Sign in</Link>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="border border-black/10 p-4 bg-[var(--color-ivory-100)]">
      <p className="text-eyebrow text-[var(--color-charcoal-500)] inline-flex items-center gap-2">{icon}{label}</p>
      <p className="text-display text-[1.5rem] mt-2 leading-none text-[var(--color-burgundy-700)] tabular-nums">{value}</p>
    </div>
  );
}
