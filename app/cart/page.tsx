"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Minus, Plus, Pencil, Trash2, ShoppingBag, Tag, Check, X, MapPin, Star, Camera, Upload } from "lucide-react";
import { useCart, removeFromCart, updateQty, clearCart } from "@/lib/cart";
import { useAuth } from "@/components/AuthProvider";
import { ProfileForm } from "@/components/ProfileForm";
import { AuthForm } from "@/components/AuthForm";
import { createOrderFromCart, fetchProfile, isProfileComplete, type Profile } from "@/lib/orders";
import { listMyAddresses, upsertAddress, MAX_ADDRESSES, type Address, type AddressInput } from "@/lib/addresses";
import { uploadOrderPhoto, ORDER_VIEWS, ORDER_VIEW_LABEL, type OrderView } from "@/lib/orderMedia";
import { computeOrderTotals, VAT_RATE } from "@/lib/checkoutFees";
import { listFreeShippingCountries, isFreeShippingCountry, type FreeShippingCountry } from "@/lib/shippingZones";
import { supabase } from "@/lib/supabase";

const fmt = (n: number) =>
  `BHD ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export default function CartPage() {
  const { items, subtotal, count } = useCart();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [phase, setPhase]     = useState<"cart" | "auth" | "profile">("cart");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // Discount code state. Applied = a validated code stamped with the
  // percentage and amount returned by the server. We keep the input
  // separate so the visitor can clear and try a different one.
  const [codeInput, setCodeInput] = useState("");
  const [applying, setApplying]   = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [applied, setApplied] = useState<{ code: string; percent: number; amount: number } | null>(null);

  // Address-book picker state. We seed from listMyAddresses once the
  // visitor signs in, default-select whichever row has is_default = true,
  // and let the visitor switch or add a new address inline without
  // leaving checkout.
  const [addresses, setAddresses]     = useState<Address[]>([]);
  const [selectedAddrId, setSelected] = useState<string | null>(null);
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddr, setNewAddr] = useState<AddressInput>({
    label: "", full_name: "", phone: "",
    line1: "", line2: "", city: "", country: "Bahrain",
    is_default: false,
  });

  useEffect(() => {
    if (!user) { setAddresses([]); setSelected(null); return; }
    let cancelled = false;
    async function refresh() {
      const rows = await listMyAddresses();
      if (cancelled) return;
      setAddresses(rows);
      setSelected((prev) => {
        // Keep the explicit selection if it still exists; otherwise
        // fall through to whatever is now flagged as default (the
        // customer may have just promoted a different row from the
        // address book), or the first available row.
        if (prev && rows.some((r) => r.id === prev)) return prev;
        if (rows.length === 0) return null;
        return (rows.find((r) => r.is_default) ?? rows[0]).id;
      });
    }
    refresh();
    // Refresh whenever the customer comes back to this tab — covers
    // the "go to /account/addresses, change default, come back" loop.
    const onFocus = () => { refresh(); };
    const onShow  = (e: PageTransitionEvent) => { if (e.persisted) refresh(); };
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onShow);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onShow);
    };
  }, [user]);

  const selectedAddr = addresses.find((a) => a.id === selectedAddrId) ?? null;

  // Free-shipping list: SELECT is public so we fetch on mount regardless of
  // sign-in state. Used to zero the shipping fee when the selected address
  // (or, if none, the profile country) sits on the admin's list.
  const [freeCountries, setFreeCountries] = useState<FreeShippingCountry[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await listFreeShippingCountries();
      if (!cancelled) setFreeCountries(list);
    })();
    return () => { cancelled = true; };
  }, []);

  // Body-measurement photos: one optional File per labeled view. Kept in
  // local state until the order is placed — we don't know the orderId
  // until createOrderFromCart returns. After the insert, placeOrder
  // uploads any picked files to the order-media bucket.
  const [photos, setPhotos] = useState<Record<OrderView, File | null>>({
    front: null, back: null, left: null, right: null,
  });
  const [photoPreviews, setPhotoPreviews] = useState<Record<OrderView, string | null>>({
    front: null, back: null, left: null, right: null,
  });

  function pickPhoto(view: OrderView, file: File | null) {
    setPhotos((p) => ({ ...p, [view]: file }));
    setPhotoPreviews((prev) => {
      // Revoke previous object URL to avoid memory leaks.
      const old = prev[view];
      if (old) URL.revokeObjectURL(old);
      return { ...prev, [view]: file ? URL.createObjectURL(file) : null };
    });
  }
  function clearPhoto(view: OrderView) {
    pickPhoto(view, null);
  }
  useEffect(() => {
    // Revoke all preview URLs when the cart unmounts.
    return () => {
      Object.values(photoPreviews).forEach((url) => url && URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const itemsAfterDiscount = applied
    ? Math.max(0, Math.round((subtotal - applied.amount) * 100) / 100)
    : subtotal;
  const shipCountry = selectedAddr?.country ?? null;
  const freeShipping = isFreeShippingCountry(shipCountry, freeCountries);
  const { vat, shipping, grandTotal } = computeOrderTotals(itemsAfterDiscount, { freeShipping });

  async function applyDiscount() {
    setDiscountError(null);
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    setApplying(true);
    try {
      const res = await fetch("/api/discount-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const body = await res.json();
      if (!res.ok || !body.valid) {
        setDiscountError(body?.reason ?? "Couldn't apply that code.");
        setApplied(null);
        return;
      }
      setApplied({ code: body.code, percent: body.percent_off, amount: body.amount });
      setCodeInput("");
    } catch {
      setDiscountError("Couldn't reach the discount service. Please try again.");
    } finally {
      setApplying(false);
    }
  }
  function clearDiscount() {
    setApplied(null);
    setDiscountError(null);
  }

  // When the user signs in mid-checkout, advance phase automatically.
  useEffect(() => {
    if (!user) return;
    fetchProfile(user.id).then((p) => {
      setProfile(p);
      if (phase === "auth") setPhase(isProfileComplete(p) ? "cart" : "profile");
    });
  }, [user, phase]);

  async function startCheckout() {
    setError(null);
    if (items.length === 0) return;
    if (!user)              { setPhase("auth"); return; }
    let p = profile;
    if (!p) { p = await fetchProfile(user.id); setProfile(p); }
    if (!isProfileComplete(p)) { setPhase("profile"); return; }
    placeOrder(p!);
  }

  async function placeOrder(p: Profile) {
    if (!user) return;
    setPlacing(true);
    const { order, error } = await createOrderFromCart(
      items,
      p,
      user.email ?? "",
      applied ? { code: applied.code } : null,
      selectedAddr
        ? {
            full_name: selectedAddr.full_name,
            phone:     selectedAddr.phone,
            line1:     selectedAddr.line1,
            line2:     selectedAddr.line2 ?? null,
            city:      selectedAddr.city,
            country:   selectedAddr.country,
          }
        : null,
    );
    if (error || !order) {
      setError(error ?? "Could not place the order.");
      setPlacing(false);
      setPhase("cart");
      return;
    }
    // Body photos — upload any selected files against the new order. We
    // await these (sequentially) because the customer expects to see the
    // photos on their order page right after redirect. A single upload
    // failure doesn't block the others or the redirect.
    const picked = ORDER_VIEWS.filter((v) => photos[v]);
    for (const view of picked) {
      const file = photos[view];
      if (!file) continue;
      try {
        await uploadOrderPhoto(order.id, user.id, view, file);
      } catch { /* swallow — the customer can re-upload from the order page later */ }
    }

    // Confirmation email — fire-and-forget. The order is already
    // saved; we don't want a transient email-service hiccup to
    // strand the customer on the cart page.
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        fetch("/api/notify/order-confirmation", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id }),
        }).catch(() => { /* non-blocking */ });
      }
    } catch { /* non-blocking */ }
    clearCart();
    router.push(`/account/orders/${order.order_number}`);
  }

  return (
    <div className="pt-28 md:pt-32 pb-24 min-h-[80vh]">
      <div className="container-editorial">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors mb-6"
        >
          <ArrowLeft size={14} strokeWidth={1.5} /> Continue shopping
        </Link>

        <header className="mb-10">
          <span className="text-eyebrow text-[var(--color-burgundy-700)]">Your cart</span>
          <h1 className="text-display text-[clamp(2.5rem,5vw,4rem)] mt-3 leading-[0.98]">
            {count === 0 ? "Empty for now." : `${count} item${count === 1 ? "" : "s"}.`}
          </h1>
        </header>

        {items.length === 0 ? (
          <div className="border border-black/10 bg-[var(--color-ivory-200)] p-10 max-w-2xl">
            <ShoppingBag size={32} strokeWidth={1.4} className="text-[var(--color-burgundy-700)]" />
            <p className="mt-5 text-[1rem] text-[var(--color-charcoal-700)] leading-relaxed">
              Your cart is empty. Browse the libraries to find a piece, or design your own commission.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/library/tailoring"
                className="text-eyebrow inline-flex items-center gap-2 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-6 py-3 hover:bg-[var(--color-burgundy-800)] transition-colors"
              >
                Browse the house <ArrowRight size={14} strokeWidth={1.5} />
              </Link>
              <Link
                href="/customize"
                className="text-eyebrow inline-flex items-center gap-2 border border-[var(--color-burgundy-700)] text-[var(--color-burgundy-700)] px-6 py-3 hover:bg-[var(--color-burgundy-700)] hover:text-[var(--color-ivory-100)] transition-colors"
              >
                Design your own
              </Link>
            </div>
          </div>
        ) : phase === "cart" ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 lg:gap-16">
            {/* Line items */}
            <div className="space-y-6">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="flex gap-5 border-b border-black/10 pb-6"
                >
                  <Link
                    href={it.href}
                    className={`relative shrink-0 w-28 h-28 md:w-32 md:h-32 overflow-hidden bg-[var(--color-ivory-200)] hover-grow`}
                  >
                    <Image
                      src={it.image}
                      alt={it.name}
                      fill
                      sizes="128px"
                      className={it.contain ? "object-contain p-3" : "object-cover"}
                      unoptimized={it.image.includes("erp.hiltontailoringhouse.com")}
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <span className="text-eyebrow text-[var(--color-charcoal-500)]">{it.type}</span>
                    <Link
                      href={it.href}
                      className="block text-display text-[1.25rem] mt-1 leading-tight text-[var(--color-charcoal-900)] hover:text-[var(--color-burgundy-700)] transition-colors"
                    >
                      {it.name}
                    </Link>
                    {it.custom && (
                      <p className="text-[0.78rem] text-[var(--color-charcoal-500)] mt-1.5">
                        Custom {it.custom.category}
                        {it.custom.tier ? ` · ${it.custom.tier}` : ""}
                        {it.custom.fabric ? ` · ${it.custom.fabric}` : ""}
                      </p>
                    )}

                    <div className="mt-3 flex items-end justify-between gap-3">
                      <div className="inline-flex items-center border border-black/15">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => updateQty(it.id, it.qty - 1)}
                          className="px-2.5 py-2 hover:text-[var(--color-burgundy-700)] transition-colors"
                        >
                          <Minus size={12} strokeWidth={1.5} />
                        </button>
                        <span className="px-3 text-[0.9rem] tabular-nums">{it.qty}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => updateQty(it.id, it.qty + 1)}
                          className="px-2.5 py-2 hover:text-[var(--color-burgundy-700)] transition-colors"
                        >
                          <Plus size={12} strokeWidth={1.5} />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-display text-[1.1rem] text-[var(--color-charcoal-900)]">
                          {fmt(it.priceNum * it.qty)}
                        </span>
                        <div className="mt-2 flex items-center justify-end gap-4">
                          {it.custom && (
                            <Link
                              href={it.href}
                              className="text-[0.72rem] tracking-[0.18em] uppercase text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors inline-flex items-center gap-1"
                            >
                              <Pencil size={11} strokeWidth={1.5} /> Edit
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => removeFromCart(it.id)}
                            className="text-[0.72rem] tracking-[0.18em] uppercase text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors inline-flex items-center gap-1"
                          >
                            <Trash2 size={11} strokeWidth={1.5} /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Body-measurement photos — four labeled slots (Front /
                  Back / Left side / Right side). All optional, applies to
                  every order type. Lives here in the main content column
                  (rather than the narrow sidebar) so the four slots can
                  sit side-by-side on desktop with proper breathing room. */}
              {user && (
                <section className="mt-10 pt-10 border-t border-black/10">
                  <div className="flex items-baseline justify-between gap-3 mb-2">
                    <h2 className="text-eyebrow text-[var(--color-charcoal-500)] inline-flex items-center gap-2">
                      <Camera size={14} strokeWidth={1.5} /> Body photographs
                    </h2>
                    <span className="text-eyebrow text-[0.62rem] text-[var(--color-charcoal-500)]">Optional</span>
                  </div>
                  <p className="text-[0.85rem] text-[var(--color-charcoal-700)] leading-relaxed mb-5 max-w-2xl">
                    Help the cutter understand your build. Each slot accepts one photo: front,
                    back, and a side view from each direction. Visible only to the atelier; we never
                    share these.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-[520px]">
                    {ORDER_VIEWS.map((view) => (
                      <PhotoSlot
                        key={view}
                        label={ORDER_VIEW_LABEL[view]}
                        preview={photoPreviews[view]}
                        onPick={(file) => pickPhoto(view, file)}
                        onClear={() => clearPhoto(view)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Summary */}
            <aside className="lg:sticky lg:top-28 self-start border border-black/10 p-6 lg:p-8 bg-[var(--color-ivory-200)]">
              {/* Address picker — shows when the visitor has signed in and
                  has saved addresses. The default is pre-selected; they
                  can switch or add a new one inline without leaving cart. */}
              {user && addresses.length > 0 && !addingAddress && (
                <div className="mb-6 pb-6 border-b border-black/10">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="text-eyebrow text-[var(--color-charcoal-500)] inline-flex items-center gap-2">
                      <MapPin size={12} strokeWidth={1.5} /> Ship to
                    </h3>
                    {addresses.length < MAX_ADDRESSES && (
                      <button
                        type="button"
                        onClick={() => setAddingAddress(true)}
                        className="text-eyebrow text-[0.62rem] text-[var(--color-burgundy-700)] hover:underline inline-flex items-center gap-1"
                      >
                        <Plus size={11} strokeWidth={1.5} /> New address
                      </button>
                    )}
                  </div>
                  <ul className="space-y-2">
                    {addresses.map((a) => (
                      <li key={a.id}>
                        <label className={`block border px-3 py-3 cursor-pointer transition-colors ${
                          selectedAddrId === a.id
                            ? "border-[var(--color-burgundy-700)] bg-[var(--color-ivory-100)]"
                            : "border-black/10 bg-white/40 hover:border-[var(--color-burgundy-700)]/40"
                        }`}>
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="ship-to"
                              value={a.id}
                              checked={selectedAddrId === a.id}
                              onChange={() => setSelected(a.id)}
                              className="mt-1 accent-[var(--color-burgundy-700)]"
                            />
                            <div className="min-w-0 flex-1 text-[0.82rem] leading-relaxed">
                              <div className="text-eyebrow text-[var(--color-burgundy-700)] text-[0.58rem] inline-flex items-center gap-1.5">
                                {a.is_default && <Star size={10} strokeWidth={1.5} className="fill-current" />}
                                {a.label || (a.is_default ? "Default" : "Address")}
                              </div>
                              <div className="mt-1 text-[var(--color-charcoal-900)]">
                                {a.full_name}
                              </div>
                              <div className="text-[var(--color-charcoal-700)]">
                                {a.line1}{a.line2 ? `, ${a.line2}` : ""} · {a.city}, {a.country}
                              </div>
                            </div>
                          </div>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/account/addresses"
                    className="mt-3 inline-block text-eyebrow text-[0.6rem] text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors"
                  >
                    Manage saved addresses →
                  </Link>
                </div>
              )}

              {/* Inline add-new-address form. Same fields as the address
                  book page, kept narrow so it fits the aside. */}
              {user && addingAddress && (
                <div className="mb-6 pb-6 border-b border-black/10">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="text-eyebrow text-[var(--color-charcoal-500)] inline-flex items-center gap-2">
                      <Plus size={12} strokeWidth={1.5} /> New address
                    </h3>
                    <button
                      type="button"
                      onClick={() => setAddingAddress(false)}
                      aria-label="Cancel new address"
                      className="text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors"
                    >
                      <X size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    <SmallField placeholder="Recipient name" value={newAddr.full_name} onChange={(v) => setNewAddr({ ...newAddr, full_name: v })} />
                    <SmallField placeholder="Phone" value={newAddr.phone} onChange={(v) => setNewAddr({ ...newAddr, phone: v })} />
                    <SmallField placeholder="Address line 1" value={newAddr.line1} onChange={(v) => setNewAddr({ ...newAddr, line1: v })} />
                    <SmallField placeholder="Address line 2 (optional)" value={newAddr.line2 ?? ""} onChange={(v) => setNewAddr({ ...newAddr, line2: v })} />
                    <div className="grid grid-cols-2 gap-2.5">
                      <SmallField placeholder="City" value={newAddr.city} onChange={(v) => setNewAddr({ ...newAddr, city: v })} />
                      <SmallField placeholder="Country" value={newAddr.country} onChange={(v) => setNewAddr({ ...newAddr, country: v })} />
                    </div>
                    <SmallField placeholder="Label (Home, Office… optional)" value={newAddr.label ?? ""} onChange={(v) => setNewAddr({ ...newAddr, label: v })} />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newAddr.full_name.trim() || !newAddr.phone.trim() || !newAddr.line1.trim() || !newAddr.city.trim() || !newAddr.country.trim()) {
                          setError("Recipient, phone, address line 1, city and country are required.");
                          return;
                        }
                        setError(null);
                        const { data, error: err } = await upsertAddress({
                          ...newAddr,
                          is_default: addresses.length === 0, // first one becomes default automatically
                        });
                        if (err || !data) {
                          setError(err ?? "Couldn't save the address.");
                          return;
                        }
                        const fresh = await listMyAddresses();
                        setAddresses(fresh);
                        setSelected(data.id);
                        setNewAddr({ label: "", full_name: "", phone: "", line1: "", line2: "", city: "", country: "Bahrain", is_default: false });
                        setAddingAddress(false);
                      }}
                      className="mt-1 text-eyebrow inline-flex items-center justify-center gap-2 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-4 py-2.5 hover:bg-[var(--color-burgundy-800)] transition-colors"
                    >
                      Save & use this address
                    </button>
                  </div>
                </div>
              )}

              <h2 className="text-eyebrow text-[var(--color-charcoal-500)]">Order summary</h2>
              <div className="mt-5 space-y-3 text-[0.9rem]">
                <div className="flex justify-between">
                  <span className="text-[var(--color-charcoal-500)]">Subtotal</span>
                  <span className="text-[var(--color-charcoal-900)]">{fmt(subtotal)}</span>
                </div>
                {applied && (
                  <div className="flex justify-between text-[var(--color-burgundy-700)]">
                    <span className="inline-flex items-center gap-2">
                      <Tag size={12} strokeWidth={1.5} /> {applied.code} · {applied.percent}% off
                    </span>
                    <span className="tabular-nums">− {fmt(applied.amount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[var(--color-charcoal-500)]">VAT ({Math.round(VAT_RATE * 100)}%)</span>
                  <span className="text-[var(--color-charcoal-900)] tabular-nums">{fmt(vat)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-charcoal-500)]">Shipping</span>
                  {freeShipping ? (
                    <span className="text-eyebrow text-[var(--color-burgundy-700)]">Free{shipCountry ? ` to ${shipCountry}` : ""}</span>
                  ) : (
                    <span className="text-[var(--color-charcoal-900)] tabular-nums">{fmt(shipping)}</span>
                  )}
                </div>
              </div>

              {/* Discount code — line-item entry the customer can apply
                  any time before placing the order. */}
              <div className="mt-5 border-t border-black/10 pt-5">
                {!applied ? (
                  <>
                    <label className="block text-eyebrow text-[var(--color-charcoal-500)] mb-2">
                      Discount code
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={codeInput}
                        onChange={(e) => { setCodeInput(e.target.value.toUpperCase().slice(0, 5)); setDiscountError(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void applyDiscount(); } }}
                        placeholder="DIS25"
                        maxLength={5}
                        className="flex-1 min-w-0 bg-white border border-black/15 px-3 py-2.5 text-[0.9rem] tabular-nums tracking-[0.18em] uppercase focus:outline-none focus:border-[var(--color-burgundy-700)]"
                      />
                      <button
                        type="button"
                        onClick={applyDiscount}
                        disabled={applying || codeInput.trim().length < 5}
                        className="text-eyebrow border border-[var(--color-burgundy-700)] text-[var(--color-burgundy-700)] px-4 py-2.5 hover:bg-[var(--color-burgundy-700)] hover:text-[var(--color-ivory-100)] transition-colors disabled:opacity-50"
                      >
                        {applying ? "Checking…" : "Apply"}
                      </button>
                    </div>
                    {discountError && (
                      <p className="mt-2 text-[0.78rem] text-[var(--color-burgundy-700)]">
                        {discountError}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-between gap-3 bg-[var(--color-burgundy-50)] border border-[var(--color-burgundy-700)]/20 px-3 py-2.5">
                    <span className="text-[0.85rem] text-[var(--color-burgundy-700)] inline-flex items-center gap-2">
                      <Check size={14} strokeWidth={1.5} />
                      <span className="tabular-nums tracking-[0.15em]">{applied.code}</span>
                      <span className="opacity-70">applied</span>
                    </span>
                    <button
                      type="button"
                      onClick={clearDiscount}
                      aria-label="Remove discount code"
                      className="text-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-800)] transition-colors"
                    >
                      <X size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-5 border-t border-black/10 flex justify-between items-baseline">
                <span className="text-eyebrow text-[var(--color-charcoal-900)]">Total</span>
                <span className="text-display text-[1.5rem] text-[var(--color-burgundy-700)]">{fmt(grandTotal)}</span>
              </div>

              <button
                type="button"
                onClick={startCheckout}
                disabled={placing || authLoading}
                className="mt-7 w-full text-eyebrow inline-flex items-center justify-center gap-3 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-6 py-4 hover:bg-[var(--color-burgundy-800)] transition-colors disabled:opacity-60"
              >
                {placing ? "Placing order…" : <>Place order <ArrowRight size={14} strokeWidth={1.5} /></>}
              </button>

              {error && (
                <p className="mt-3 text-[0.8rem] text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)] border border-[var(--color-burgundy-700)]/20 px-3 py-2">
                  {error}
                </p>
              )}

              <p className="mt-4 text-[0.72rem] text-[var(--color-charcoal-500)] leading-relaxed">
                You&rsquo;ll sign in (or create an account) at checkout to save your pattern on file.
                Secure payment will be added soon; your atelier will confirm by email.
              </p>
            </aside>
          </div>
        ) : null}

        {/* ── Sign-in gate ── */}
        {phase === "auth" && (
          <div className="max-w-md mx-auto mt-10 border border-black/10 p-6 lg:p-8">
            <h2 className="text-display text-[1.5rem] leading-tight">Sign in to complete your order.</h2>
            <p className="mt-2 text-[0.85rem] text-[var(--color-charcoal-700)]">
              We&rsquo;ll save your pattern on file and confirm by email.
            </p>
            <div className="mt-6">
              <AuthForm />
            </div>
            <button type="button" onClick={() => setPhase("cart")} className="mt-6 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors">
              ← Back to cart
            </button>
          </div>
        )}

        {/* ── Profile completion gate ── */}
        {phase === "profile" && user && (
          <div className="max-w-2xl mx-auto mt-10">
            <ProfileForm
              userId={user.id}
              initialName={(user.user_metadata as { full_name?: string; name?: string } | undefined)?.full_name ?? ""}
              onSaved={(p) => { setProfile(p); placeOrder(p); }}
            />
            <button type="button" onClick={() => setPhase("cart")} className="mt-4 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors">
              ← Back to cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** One dropzone for a single labeled body photo. Clicking the empty
 *  state opens the file picker; once a file is chosen the preview thumb
 *  takes over and the X clears it back to the placeholder. */
function PhotoSlot({
  label, preview, onPick, onClear,
}: {
  label: string;
  preview: string | null;
  onPick: (file: File | null) => void;
  onClear: () => void;
}) {
  const inputId = `photo-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="block">
      <label
        htmlFor={inputId}
        className="relative block aspect-[3/4] border border-dashed border-black/20 bg-white/40 hover:border-[var(--color-burgundy-700)]/50 transition-colors cursor-pointer overflow-hidden"
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt={label} className="absolute inset-0 w-full h-full object-cover" />
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--color-charcoal-500)]">
            <Upload size={16} strokeWidth={1.5} />
            <span className="mt-1 text-[0.6rem] uppercase tracking-[0.18em]">Add photo</span>
          </div>
        )}
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/webp"
        className="sr-only"
        onChange={(e) => onPick(e.currentTarget.files?.[0] ?? null)}
      />
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-eyebrow text-[0.58rem] text-[var(--color-charcoal-700)]">{label}</span>
        {preview && (
          <button
            type="button"
            onClick={onClear}
            aria-label={`Remove ${label} photo`}
            className="text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors"
          >
            <X size={11} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  );
}

/** Compact text input used by the inline new-address form in the cart
 *  aside. Kept text-only to fit the narrow column. */
function SmallField({
  placeholder, value, onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white border border-black/15 px-3 py-2 text-[0.85rem] focus:outline-none focus:border-[var(--color-burgundy-700)]"
    />
  );
}
