"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, MapPin, Star, Trash2, Pencil, Save, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import {
  listMyAddresses,
  upsertAddress,
  deleteAddress,
  setDefaultAddress,
  MAX_ADDRESSES,
  type Address,
  type AddressInput,
} from "@/lib/addresses";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-32 md:pt-40 pb-24 min-h-[80vh]">
      <div className="container-editorial">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors mb-8"
        >
          <ArrowLeft size={14} strokeWidth={1.5} /> Your account
        </Link>
        {children}
      </div>
    </div>
  );
}

function emptyDraft(): AddressInput {
  return {
    label: "",
    full_name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    country: "Bahrain",
    is_default: false,
  };
}

export default function AddressBookPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Address[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null); // null = adding new, otherwise the row being edited
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<AddressInput>(emptyDraft());
  const [saving, setSaving] = useState(false);

  // Bounce signed-out visitors back to /account so they sign in there.
  useEffect(() => {
    if (!loading && !user) router.replace("/account");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoadingData(true);
      const rows = await listMyAddresses();
      if (!cancelled) {
        setItems(rows);
        setLoadingData(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  function openAdd() {
    setEditingId(null);
    // Default the recipient on a brand new address to the most recently
    // used recipient so the visitor doesn't retype their own name.
    const last = items[0];
    const seed = emptyDraft();
    if (last) {
      seed.full_name = last.full_name;
      seed.phone = last.phone;
    }
    seed.is_default = items.length === 0;
    setDraft(seed);
    setEditorOpen(true);
  }

  function openEdit(addr: Address) {
    setEditingId(addr.id);
    setDraft({
      label: addr.label ?? "",
      full_name: addr.full_name,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2 ?? "",
      city: addr.city,
      country: addr.country,
      is_default: addr.is_default,
    });
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditingId(null);
    setError(null);
  }

  async function save() {
    setError(null);
    const required = ["full_name", "phone", "line1", "city", "country"] as const;
    for (const k of required) {
      if (!String(draft[k] ?? "").trim()) {
        setError("Name, phone, line 1, city and country are required.");
        return;
      }
    }
    if (!editingId && items.length >= MAX_ADDRESSES) {
      setError(`You can save up to ${MAX_ADDRESSES} addresses. Remove one to add another.`);
      return;
    }
    setSaving(true);
    const { data, error: err } = await upsertAddress(draft, editingId ?? undefined);
    setSaving(false);
    if (err || !data) {
      setError(err ?? "Couldn't save the address.");
      return;
    }
    setItems(await listMyAddresses());
    closeEditor();
  }

  async function makeDefault(addr: Address) {
    if (addr.is_default) return;
    await setDefaultAddress(addr.id);
    setItems(await listMyAddresses());
  }

  async function remove(addr: Address) {
    if (!confirm(`Remove ${addr.label || addr.line1}?`)) return;
    await deleteAddress(addr.id);
    setItems(await listMyAddresses());
  }

  if (loading || !user) {
    return <Shell><p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading…</p></Shell>;
  }

  return (
    <Shell>
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 border-b border-black/10 pb-8">
        <div>
          <h1 className="text-display text-[clamp(2rem,4vw,3rem)] leading-tight inline-flex items-center gap-3">
            <MapPin size={26} strokeWidth={1.5} className="text-[var(--color-burgundy-700)]" />
            Addresses
          </h1>
          <p className="mt-3 text-[0.9rem] text-[var(--color-charcoal-500)] max-w-2xl">
            Save up to {MAX_ADDRESSES} delivery addresses for your commissions. One is your default — checkout
            will pre-select it, and you can switch or add a new one inline at any time.
          </p>
        </div>
        {!editorOpen && items.length < MAX_ADDRESSES && (
          <button
            type="button"
            onClick={openAdd}
            className="text-eyebrow inline-flex items-center gap-2 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-5 py-3 hover:bg-[var(--color-burgundy-800)] transition-colors self-start md:self-auto"
          >
            <Plus size={14} strokeWidth={1.5} /> Add an address
          </button>
        )}
      </header>

      {error && (
        <p className="mt-6 text-[0.85rem] text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)] border border-[var(--color-burgundy-700)]/20 px-3 py-2">
          {error}
        </p>
      )}

      {editorOpen && (
        <AddressEditor
          draft={draft}
          setDraft={setDraft}
          editing={Boolean(editingId)}
          allowSetDefault={!editingId || !items.find((x) => x.id === editingId)?.is_default || items.length === 1}
          saving={saving}
          onCancel={closeEditor}
          onSave={save}
        />
      )}

      <section className="mt-10">
        <h2 className="text-eyebrow text-[var(--color-charcoal-500)] mb-5">
          {items.length} of {MAX_ADDRESSES} saved
        </h2>
        {loadingData ? (
          <p className="text-eyebrow text-[var(--color-charcoal-500)]">Loading…</p>
        ) : items.length === 0 ? (
          <div className="border border-black/10 bg-[var(--color-ivory-200)] px-6 py-8 text-[0.9rem] text-[var(--color-charcoal-700)]">
            No saved addresses yet. Add one above and we'll pre-fill it at checkout.
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {items.map((a) => (
              <li key={a.id} className="border border-black/10 p-5 bg-[var(--color-ivory-100)] flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-eyebrow text-[var(--color-burgundy-700)] inline-flex items-center gap-1.5">
                      {a.is_default && <Star size={12} strokeWidth={1.5} className="fill-current" />}
                      {a.label || (a.is_default ? "Default" : "Address")}
                    </div>
                    <p className="mt-2 text-display text-[1.1rem] text-[var(--color-charcoal-900)] leading-tight">
                      {a.full_name}
                    </p>
                    <p className="mt-2 text-[0.9rem] text-[var(--color-charcoal-700)] leading-relaxed">
                      {a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />
                      {a.city}, {a.country}
                    </p>
                    <p className="mt-2 text-[0.78rem] text-[var(--color-charcoal-500)]">{a.phone}</p>
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t border-black/10 flex flex-wrap items-center gap-3">
                  {!a.is_default && (
                    <button
                      type="button"
                      onClick={() => makeDefault(a)}
                      className="text-eyebrow text-[0.65rem] text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors inline-flex items-center gap-1.5"
                    >
                      <Star size={12} strokeWidth={1.5} /> Make default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openEdit(a)}
                    className="text-eyebrow text-[0.65rem] text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors inline-flex items-center gap-1.5"
                  >
                    <Pencil size={12} strokeWidth={1.5} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(a)}
                    className="ml-auto text-eyebrow text-[0.65rem] text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors inline-flex items-center gap-1.5"
                    aria-label={`Remove address ${a.label || a.line1}`}
                  >
                    <Trash2 size={12} strokeWidth={1.5} /> Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Shell>
  );
}

/** Inline add/edit form. Lives in the same page (no modal) so the
 *  visitor's existing list stays visible above the form for context. */
function AddressEditor({
  draft,
  setDraft,
  editing,
  allowSetDefault,
  saving,
  onCancel,
  onSave,
}: {
  draft: AddressInput;
  setDraft: (d: AddressInput) => void;
  editing: boolean;
  allowSetDefault: boolean;
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <section className="mt-10 border border-black/10 bg-[var(--color-ivory-100)]">
      <header className="px-6 py-4 border-b border-black/10 flex items-center justify-between">
        <h2 className="text-eyebrow text-[var(--color-burgundy-700)] inline-flex items-center gap-2">
          <Plus size={14} strokeWidth={1.5} />
          {editing ? "Edit address" : "New address"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close editor"
          className="text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </header>
      <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
        <Field label="Label (optional)" placeholder="Home, Office, Mum…" value={draft.label ?? ""} onChange={(v) => setDraft({ ...draft, label: v })} />
        <Field label="Recipient name" placeholder="Full name on the parcel" value={draft.full_name} onChange={(v) => setDraft({ ...draft, full_name: v })} required />
        <Field label="Phone" placeholder="+973 1234 5678" value={draft.phone} onChange={(v) => setDraft({ ...draft, phone: v })} required />
        <div />
        <Field label="Address line 1" placeholder="Building, street" value={draft.line1} onChange={(v) => setDraft({ ...draft, line1: v })} required full />
        <Field label="Address line 2 (optional)" placeholder="Block, area, floor" value={draft.line2 ?? ""} onChange={(v) => setDraft({ ...draft, line2: v })} full />
        <Field label="City" placeholder="Manama" value={draft.city} onChange={(v) => setDraft({ ...draft, city: v })} required />
        <Field label="Country" placeholder="Bahrain" value={draft.country} onChange={(v) => setDraft({ ...draft, country: v })} required />
        <label className="inline-flex items-center gap-2 text-[0.9rem] text-[var(--color-charcoal-800)] mt-2">
          <input
            type="checkbox"
            checked={Boolean(draft.is_default)}
            onChange={(e) => setDraft({ ...draft, is_default: e.target.checked })}
            disabled={!allowSetDefault}
            className="w-4 h-4 accent-[var(--color-burgundy-700)]"
          />
          Use this as my default
        </label>
        <div className="md:col-span-2 flex items-center justify-end gap-4 pt-4 border-t border-black/10">
          <button
            type="button"
            onClick={onCancel}
            className="text-eyebrow text-[var(--color-charcoal-500)] hover:text-[var(--color-burgundy-700)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="text-eyebrow inline-flex items-center justify-center gap-2 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-5 py-2.5 hover:bg-[var(--color-burgundy-800)] transition-colors disabled:opacity-60"
          >
            <Save size={13} strokeWidth={1.5} /> {editing ? "Update address" : "Save address"}
          </button>
        </div>
      </div>
    </section>
  );
}

function Field({
  label, placeholder, value, onChange, required, full,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? "md:col-span-2" : ""}`}>
      <span className="text-eyebrow text-[var(--color-charcoal-500)]">
        {label}{required ? " *" : ""}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full bg-white border border-black/15 px-3 py-2.5 text-[0.95rem] focus:outline-none focus:border-[var(--color-burgundy-700)]"
      />
    </label>
  );
}
