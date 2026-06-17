"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight, LogOut, ShoppingBag, Ruler, CalendarClock, Mail, Package, MapPin, Camera,
} from "lucide-react";
import { listProfilePhotos, countProfilePhotos, PROFILE_VIEWS } from "@/lib/profilePhotos";
import type { User } from "@supabase/supabase-js";
import { AuthForm } from "@/components/AuthForm";
import { useAuth } from "@/components/AuthProvider";
import { MediaImageClient } from "@/components/MediaImageClient";
import { PlaceholderBadge } from "@/components/PlaceholderBadge";
import { ProfileForm } from "@/components/ProfileForm";
import { isAdmin } from "@/lib/admin";
import { computeOrderTotals } from "@/lib/checkoutFees";
import { listFreeShippingCountries, isFreeShippingCountry, type FreeShippingCountry } from "@/lib/shippingZones";
import { fetchMyMeasurements, countSavedMeasurements } from "@/lib/measurements";
import { listMyAddresses, type Address } from "@/lib/addresses";
import { allMeasurements } from "@/lib/customizer";
import {
  fetchProfile, isProfileComplete, listMyOrders, ORDER_STATUS_LABEL,
  type Profile, type Order,
} from "@/lib/orders";

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  // Admins never see the customer dashboard. The moment they're signed in
  // we send them to /admin. This handles every entry point (sign-in form,
  // returning visitor, direct URL) without touching the AuthForm flow.
  const [redirecting, setRedirecting] = useState(false);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    isAdmin(user.email).then((adm) => {
      if (cancelled || !adm) return;
      setRedirecting(true);
      router.replace("/admin");
    });
    return () => { cancelled = true; };
  }, [user, router]);

  if (loading || redirecting) {
    return (
      <div className="pt-40 pb-24 min-h-[70vh] flex items-center justify-center">
        <span className="text-eyebrow text-[var(--color-charcoal-500)]">
          {redirecting ? "Taking you to the atelier admin…" : "Loading…"}
        </span>
      </div>
    );
  }

  return user ? <AccountDashboard user={user} onSignOut={signOut} /> : <SignInSplit />;
}

/* ─────────────────────────── Signed-out: split-screen sign in ─────────────────────────── */

function SignInSplit() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 min-h-[100svh]">
      {/* Editorial visual */}
      <div className="relative hidden lg:block overflow-hidden bg-[var(--color-charcoal-900)]">
        <PlaceholderBadge />
        <MediaImageClient
          slot="account.signin"
          fallback="https://images.unsplash.com/photo-1593030103066-0093718efeb9?q=80&w=1600&auto=format&fit=crop"
          fallbackAlt="The Hilton atelier"
          fill
          sizes="50vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-charcoal-900)]/85 via-[var(--color-charcoal-900)]/25 to-[var(--color-charcoal-900)]/40" />
        <div className="absolute inset-x-0 bottom-0 p-12 xl:p-16 text-[var(--color-ivory-100)]">
          <span className="text-eyebrow text-[var(--color-ivory-100)]/75">Since 1970 · Made to Measure</span>
          <h2 className="text-display text-[clamp(2rem,2.6vw,3rem)] mt-4 leading-[1.05] max-w-md">
            Your bespoke, kept on file for life.
          </h2>
          <p className="mt-4 max-w-sm text-[0.95rem] text-[var(--color-ivory-200)]/85 leading-relaxed">
            Sign in to save your specifications, follow each commission through the atelier, and pick up
            exactly where you left off.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center px-6 sm:px-10 pt-32 pb-20 lg:pt-28 lg:pb-16">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors"
          >
            ← The House
          </Link>
          <div className="mt-8 mb-8">
            <span className="text-eyebrow text-[var(--color-burgundy-700)]">Account</span>
            <h1 className="text-display text-[clamp(2.25rem,5vw,3.25rem)] mt-3 leading-[1.05]">
              Sign in
            </h1>
            <p className="mt-3 text-[0.95rem] text-[var(--color-charcoal-700)] leading-relaxed">
              Sign in or create an account to save your bespoke specifications and track your commissions.
            </p>
          </div>
          <AuthForm />
          <Link
            href="/customize"
            className="mt-8 flex items-center justify-center gap-2 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors"
          >
            Continue without an account <ArrowRight size={14} strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── Signed-in: account dashboard ─────────────────────────── */

function AccountDashboard({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const email = user.email ?? "";
  const googleName =
    (user.user_metadata as { full_name?: string; name?: string } | undefined)?.full_name ??
    (user.user_metadata as { full_name?: string; name?: string } | undefined)?.name ??
    "";

  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [freeCountries, setFreeCountries] = useState<FreeShippingCountry[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [savedMeasurementsCount, setSavedMeasurementsCount] = useState(0);
  const [photoCount, setPhotoCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [p, os, fc, addr, meas, photos] = await Promise.all([
        fetchProfile(user.id),
        listMyOrders(),
        listFreeShippingCountries(),
        listMyAddresses(),
        fetchMyMeasurements(),
        listProfilePhotos(user.id).catch(() => ({})),
      ]);
      if (cancelled) return;
      setProfile(p);
      setOrders(os);
      setFreeCountries(fc);
      setAddresses(addr);
      setSavedMeasurementsCount(countSavedMeasurements(meas?.values));
      setPhotoCount(countProfilePhotos(photos));
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [user.id]);

  const needsProfile = !loading && !isProfileComplete(profile);
  const displayName = profile?.full_name?.trim() || googleName || email.split("@")[0];

  return (
    <div className="pt-32 md:pt-40 pb-24 min-h-[80vh]">
      <div className="container-editorial">
        <div className="mx-auto max-w-[1100px]">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-black/10 pb-10">
            <div>
              <span className="text-eyebrow text-[var(--color-burgundy-700)]">Your account</span>
              <h1 className="text-display text-[clamp(2.5rem,5vw,4rem)] mt-3 leading-[1.02]">
                Welcome back{displayName ? `, ${displayName.split(" ")[0]}` : ""}.
              </h1>
              <p className="mt-3 inline-flex items-center gap-2 text-[0.9rem] text-[var(--color-charcoal-500)]">
                <Mail size={14} strokeWidth={1.5} /> {email}
              </p>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="self-start md:self-auto text-eyebrow inline-flex items-center gap-2 border border-[var(--color-charcoal-900)]/25 text-[var(--color-charcoal-900)] px-5 py-3 hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)] transition-colors"
            >
              <LogOut size={15} strokeWidth={1.5} /> Sign out
            </button>
          </div>

          {/* Profile completion prompt */}
          {needsProfile && (
            <div className="mt-10">
              <ProfileForm
                userId={user.id}
                initialName={googleName}
                onSaved={(p) => setProfile(p)}
              />
            </div>
          )}

          {/* Profile completion bar — shows three sections (contact,
              address, measurements) so the customer can complete their
              file once and skip data entry on every future order. */}
          {!needsProfile && !loading && (() => {
            const contactComplete = isProfileComplete(profile);
            const addressComplete = addresses.length > 0;
            const measurementsComplete = savedMeasurementsCount >= allMeasurements.length;
            const measurementsStarted = savedMeasurementsCount > 0;
            const items = [
              { key: "contact",      label: "Contact & address on file", done: contactComplete, href: "/account/addresses", icon: Mail },
              { key: "address",      label: "At least one saved address", done: addressComplete, href: "/account/addresses", icon: MapPin },
              { key: "measurements", label: measurementsComplete
                ? "Tape-measure flow complete"
                : measurementsStarted
                  ? `Measurements ${savedMeasurementsCount} of ${allMeasurements.length}`
                  : "Take your measurements",
                done: measurementsComplete, href: "/account/measurements", icon: Ruler },
              { key: "photos", label: photoCount > 0
                ? `Body photographs ${photoCount} of ${PROFILE_VIEWS.length}`
                : "Add body photographs (optional)",
                done: photoCount >= PROFILE_VIEWS.length, href: "/account/photos", icon: Camera },
            ];
            const doneCount = items.filter((i) => i.done).length;
            const pct = Math.round((doneCount / items.length) * 100);
            return (
              <section className="mt-10 border border-black/10 p-6 lg:p-8 bg-[var(--color-ivory-100)]">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
                  <div>
                    <span className="text-eyebrow text-[var(--color-burgundy-700)]">Your profile</span>
                    <h2 className="text-display text-[1.4rem] mt-1.5 leading-tight">
                      {pct === 100 ? "Profile complete." : "Complete your profile."}
                    </h2>
                    <p className="text-[0.85rem] text-[var(--color-charcoal-500)] mt-1.5 max-w-xl">
                      Finish these once and every future commission pre-fills your details. You can still edit per order.
                    </p>
                  </div>
                  <div className="md:text-right">
                    <div className="text-display text-[1.75rem] text-[var(--color-burgundy-700)] tabular-nums">{pct}%</div>
                    <div className="text-eyebrow text-[0.6rem] text-[var(--color-charcoal-500)]">{doneCount} of {items.length} done</div>
                  </div>
                </div>
                <div className="h-1.5 bg-[var(--color-ivory-200)] overflow-hidden mb-6">
                  <div
                    className="h-full bg-[var(--color-burgundy-700)] transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.key}>
                        <Link
                          href={item.href}
                          className={`block border p-4 transition-colors ${
                            item.done
                              ? "border-[var(--color-burgundy-700)]/30 bg-[var(--color-ivory-200)]"
                              : "border-black/15 bg-white hover:border-[var(--color-burgundy-700)]"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`mt-0.5 ${item.done ? "text-[var(--color-burgundy-700)]" : "text-[var(--color-charcoal-500)]"}`}>
                              <Icon size={16} strokeWidth={1.5} />
                            </span>
                            <div className="min-w-0">
                              <div className="text-[0.85rem] text-[var(--color-charcoal-900)] leading-tight">
                                {item.label}
                              </div>
                              <div className="text-eyebrow text-[0.6rem] mt-1.5 text-[var(--color-charcoal-500)]">
                                {item.done ? "Done · edit" : "Open"}
                              </div>
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })()}

          {/* Primary action */}
          {!needsProfile && (
            <Link
              href="/customize"
              className="group mt-10 block relative overflow-hidden border border-[var(--color-burgundy-700)] bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)]"
            >
              <div className="p-8 lg:p-10 flex items-center justify-between gap-6">
                <div>
                  <div className="text-eyebrow text-[var(--color-ivory-100)]/75">Pick up where you left off</div>
                  <div className="text-display text-[clamp(1.75rem,3vw,2.5rem)] mt-2 leading-tight">
                    Continue your bespoke
                  </div>
                </div>
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-[var(--color-ivory-100)]/40 group-hover:bg-[var(--color-ivory-100)] group-hover:text-[var(--color-burgundy-700)] transition-colors shrink-0">
                  <ArrowRight size={18} strokeWidth={1.5} />
                </span>
              </div>
            </Link>
          )}

          {/* Orders */}
          <section className="mt-10">
            <div className="flex items-end justify-between gap-4 mb-5">
              <h2 className="text-display text-[1.75rem] leading-tight inline-flex items-center gap-3">
                <Package size={20} strokeWidth={1.5} className="text-[var(--color-burgundy-700)]" />
                Your commissions
              </h2>
              {orders.length > 0 && (
                <span className="text-eyebrow text-[var(--color-charcoal-500)]">
                  {orders.length} order{orders.length === 1 ? "" : "s"}
                </span>
              )}
            </div>

            {loading ? (
              <p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading…</p>
            ) : orders.length === 0 ? (
              <div className="border border-black/10 bg-[var(--color-ivory-200)] p-8">
                <p className="text-[0.95rem] text-[var(--color-charcoal-700)] leading-relaxed">
                  No commissions yet. Your first will appear here with the order number and status updates from the atelier.
                </p>
                <Link
                  href="/customize"
                  className="mt-5 text-eyebrow inline-flex items-center gap-2 text-[var(--color-burgundy-700)] hover:underline"
                >
                  Start a commission <ArrowRight size={14} strokeWidth={1.5} />
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-black/10 border-y border-black/10">
                {orders.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/account/orders/${o.order_number}`}
                      className="grid grid-cols-12 gap-3 items-center py-5 group hover:bg-[var(--color-ivory-200)]/50 px-3 -mx-3 transition-colors"
                    >
                      <span className="col-span-12 sm:col-span-3 text-display text-[1.05rem] text-[var(--color-charcoal-900)] group-hover:text-[var(--color-burgundy-700)] transition-colors tabular-nums">
                        {o.order_number}
                      </span>
                      <span className="col-span-6 sm:col-span-3 text-[0.82rem] text-[var(--color-charcoal-500)]">
                        {new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      <span className="col-span-6 sm:col-span-3 text-eyebrow text-[var(--color-burgundy-700)]">
                        {ORDER_STATUS_LABEL[o.status]}
                      </span>
                      <span className="col-span-9 sm:col-span-2 text-[0.9rem] text-[var(--color-charcoal-900)] tabular-nums">
                        BHD {computeOrderTotals(o.subtotal, { freeShipping: isFreeShippingCountry(o.shipping_address?.country, freeCountries) }).grandTotal.toLocaleString()}
                      </span>
                      <ArrowRight size={14} strokeWidth={1.5} className="col-span-3 sm:col-span-1 justify-self-end text-[var(--color-charcoal-500)] group-hover:text-[var(--color-burgundy-700)] group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Other cards */}
          {!needsProfile && (
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <DashCard
                icon={<MapPin size={18} strokeWidth={1.5} />}
                title="Addresses"
                body="Save up to five delivery addresses; pick one at checkout."
                cta={{ href: "/account/addresses", label: "Manage addresses" }}
              />
              <DashCard
                icon={<Ruler size={18} strokeWidth={1.5} />}
                title="Saved measurements"
                body="Your numbers, kept on file so every future order fits the same."
                cta={{ href: "/account/measurements", label: "Add measurements" }}
              />
              <DashCard
                icon={<Camera size={18} strokeWidth={1.5} />}
                title="Body photographs"
                body="Front, back and both sides — uploaded once, used for every order. Optional."
                cta={{ href: "/account/photos", label: photoCount > 0 ? `Photos · ${photoCount} of ${PROFILE_VIEWS.length}` : "Add photos" }}
              />
              {/* Fittings card hidden per atelier request (code kept). */}
              {false && (
                <DashCard
                  icon={<CalendarClock size={18} strokeWidth={1.5} />}
                  title="Fittings"
                  body="Book and manage your atelier appointments."
                  cta={{ href: "/book", label: "Book a fitting" }}
                />
              )}
              <DashCard
                icon={<ShoppingBag size={18} strokeWidth={1.5} />}
                title="Your cart"
                body="Items waiting for checkout."
                cta={{ href: "/cart", label: "Open cart" }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DashCard({
  icon, title, body, cta,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  cta: { href: string; label: string };
}) {
  return (
    <div className="border border-black/10 bg-[var(--color-ivory-100)] p-6 lg:p-7 flex flex-col">
      <div className="flex items-center gap-3 text-[var(--color-burgundy-700)]">
        {icon}
        <h3 className="text-display text-[1.2rem] text-[var(--color-charcoal-900)]">{title}</h3>
      </div>
      <p className="mt-3 text-[0.875rem] text-[var(--color-charcoal-700)] leading-relaxed flex-1">{body}</p>
      <Link
        href={cta.href}
        className="mt-5 text-eyebrow inline-flex items-center gap-2 text-[var(--color-burgundy-700)] hover:underline"
      >
        {cta.label} <ArrowRight size={14} strokeWidth={1.5} />
      </Link>
    </div>
  );
}
