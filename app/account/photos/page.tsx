"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, X, Camera } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import {
  PROFILE_VIEWS, PROFILE_VIEW_LABEL, type ProfileView,
  uploadProfilePhoto, listProfilePhotos, deleteProfilePhoto, type ProfilePhotoMap,
} from "@/lib/profilePhotos";

export default function ProfilePhotosPage() {
  const { user, loading } = useAuth();
  const [photos, setPhotos] = useState<ProfilePhotoMap>({});
  const [busy, setBusy] = useState<ProfileView | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    listProfilePhotos(user.id).then((m) => { setPhotos(m); setReady(true); }).catch(() => setReady(true));
  }, [user]);

  if (!loading && !user) {
    return (
      <section className="min-h-[70vh] container-editorial pt-32 md:pt-40 pb-20">
        <h1 className="text-display text-[clamp(2rem,4vw,3rem)]">Sign in to add your photos.</h1>
        <Link href="/account" className="mt-6 inline-block text-eyebrow text-[var(--color-burgundy-700)] hover:underline">Go to your account →</Link>
      </section>
    );
  }

  async function onPick(view: ProfileView, file: File | null) {
    if (!user || !file) return;
    setBusy(view); setError(null);
    const { error } = await uploadProfilePhoto(user.id, view, file);
    if (error) { setError(error); setBusy(null); return; }
    const m = await listProfilePhotos(user.id);
    setPhotos(m); setBusy(null);
  }
  async function onClear(view: ProfileView) {
    if (!user) return;
    setBusy(view);
    await deleteProfilePhoto(user.id, view);
    const m = await listProfilePhotos(user.id);
    setPhotos(m); setBusy(null);
  }

  return (
    <section className="min-h-[80svh] container-editorial pt-32 md:pt-40 pb-20">
      <Link href="/account" className="inline-flex items-center gap-2 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors mb-8">
        <ArrowLeft size={14} strokeWidth={1.5} /> Your account
      </Link>

      <div className="flex items-baseline gap-3">
        <span className="text-eyebrow text-[var(--color-burgundy-700)] inline-flex items-center gap-2">
          <Camera size={14} strokeWidth={1.5} /> Body photographs
        </span>
        <span className="text-eyebrow text-[0.62rem] text-[var(--color-charcoal-500)]">Optional</span>
      </div>
      <h1 className="text-display text-[clamp(2.25rem,5vw,3.5rem)] mt-3 leading-[1.05]">
        Kept on file for every order.
      </h1>
      <p className="mt-5 max-w-xl text-[1rem] text-[var(--color-charcoal-700)] leading-relaxed">
        Upload them once. The cutter uses front, back and a side view from each direction to
        understand your build, so every commission fits the same. Visible only to the atelier;
        we never share these.
      </p>

      {error && (
        <p className="mt-5 text-[0.85rem] text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)] border border-[var(--color-burgundy-700)]/20 px-3 py-2 max-w-xl">
          {error}
        </p>
      )}

      <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-[640px]">
        {PROFILE_VIEWS.map((view) => (
          <PhotoSlot
            key={view}
            label={PROFILE_VIEW_LABEL[view]}
            preview={photos[view]?.url ?? null}
            busy={busy === view}
            onPick={(file) => onPick(view, file)}
            onClear={() => onClear(view)}
          />
        ))}
      </div>
      {ready && (
        <p className="mt-6 text-[0.8rem] text-[var(--color-charcoal-500)]">
          {PROFILE_VIEWS.filter((v) => photos[v]).length} of 4 added · saved automatically
        </p>
      )}
    </section>
  );
}

function PhotoSlot({
  label, preview, busy, onPick, onClear,
}: {
  label: string;
  preview: string | null;
  busy: boolean;
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
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--color-charcoal-500)]">
            <Upload size={16} strokeWidth={1.5} />
            <span className="mt-1 text-[0.6rem] uppercase tracking-[0.18em]">{busy ? "Saving…" : "Add photo"}</span>
          </div>
        )}
        {busy && preview && <div className="absolute inset-0 bg-white/50 flex items-center justify-center text-[0.6rem] uppercase tracking-[0.18em]">Saving…</div>}
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
        {preview && !busy && (
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
