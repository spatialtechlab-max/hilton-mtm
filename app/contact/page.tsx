"use client";

import { useState } from "react";
import { Reveal, SplitReveal } from "@/components/Reveal";
import { site } from "@/lib/site";
import { Check } from "lucide-react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <>
      <section className="pt-44 pb-20">
        <div className="container-editorial">
          <Reveal>
            <span className="text-eyebrow text-[var(--color-burgundy-700)]">Correspondence</span>
          </Reveal>
          <h1 className="text-display text-[clamp(3.5rem,10vw,9.5rem)] mt-6 leading-[0.92]">
            <SplitReveal text="Get in touch." />
          </h1>
        </div>
      </section>

      <section className="pb-32">
        <div className="container-editorial grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          {/* Form */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            {sent ? (
              <Reveal>
                <div className="border border-[var(--color-burgundy-700)]/30 bg-[var(--color-burgundy-50)] p-12">
                  <Check size={32} className="text-[var(--color-burgundy-700)]" />
                  <h2 className="text-display text-[2.5rem] mt-6 leading-tight">Thank you.</h2>
                  <p className="mt-4 text-[1rem] text-[var(--color-charcoal-700)] max-w-md leading-relaxed">
                    Your note has reached the atelier. Someone from the house will respond within
                    one working day.
                  </p>
                </div>
              </Reveal>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
                className="space-y-10 border-t border-black/10 pt-10"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                  <Field label="Name" id="name" required />
                  <Field label="Email" id="email" type="email" required />
                </div>
                <Field label="Subject" id="subject" />
                <Field label="Your message" id="message" textarea />

                <div className="pt-4">
                  <button
                    type="submit"
                    className="text-eyebrow inline-flex items-center gap-3 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-10 py-5 hover:bg-[var(--color-burgundy-800)] transition-colors"
                  >
                    Send message
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 lg:col-start-9 order-1 lg:order-2 space-y-12">
            <Reveal>
              <div>
                <h3 className="text-eyebrow text-[var(--color-charcoal-500)]">The Atelier</h3>
                <p className="text-display text-[1.6rem] mt-3 leading-tight">
                  {site.address.line1}
                  <br />
                  {site.address.city}
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div>
                <h3 className="text-eyebrow text-[var(--color-charcoal-500)]">Direct</h3>
                <a
                  href={`tel:${site.phone.replace(/[^+\d]/g, "")}`}
                  className="block text-display text-[1.6rem] mt-3 link-underline w-fit"
                >
                  {site.phone}
                </a>
                <a
                  href={`https://wa.me/${site.whatsapp.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-display text-[1.6rem] mt-1 link-underline w-fit"
                >
                  {site.whatsapp} · WhatsApp
                </a>
                <a
                  href={`mailto:${site.email}`}
                  className="block text-display text-[1.6rem] mt-1 link-underline w-fit"
                >
                  {site.email}
                </a>
              </div>
            </Reveal>

            <Reveal delay={0.16}>
              <div>
                <h3 className="text-eyebrow text-[var(--color-charcoal-500)]">Opening hours</h3>
                <dl className="mt-3 space-y-2">
                  {site.hours.map((h) => (
                    <div
                      key={h.day}
                      className="flex justify-between gap-6 text-[0.95rem] text-[var(--color-charcoal-800)]"
                    >
                      <dt>{h.day}</dt>
                      <dd className="text-[var(--color-charcoal-500)]">{h.time}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>

            <Reveal delay={0.24}>
              <div>
                <h3 className="text-eyebrow text-[var(--color-charcoal-500)]">Follow the house</h3>
                <div className="flex gap-6 mt-4 text-eyebrow">
                  <a href={site.social.instagram} className="link-underline">Instagram</a>
                </div>
              </div>
            </Reveal>
          </aside>
        </div>
      </section>
    </>
  );
}

function Field({
  label,
  id,
  type = "text",
  required,
  textarea,
}: {
  label: string;
  id: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-eyebrow text-[var(--color-charcoal-500)] block mb-3"
      >
        {label}
        {required && <span className="text-[var(--color-burgundy-700)] ml-1">*</span>}
      </label>
      {textarea ? (
        <textarea
          id={id}
          name={id}
          rows={6}
          className="w-full bg-transparent border-b border-black/20 focus:border-[var(--color-burgundy-700)] py-3 text-[1rem] text-[var(--color-charcoal-900)] focus:outline-none transition-colors resize-none"
        />
      ) : (
        <input
          id={id}
          name={id}
          type={type}
          required={required}
          className="w-full bg-transparent border-b border-black/20 focus:border-[var(--color-burgundy-700)] py-3 text-[1rem] text-[var(--color-charcoal-900)] focus:outline-none transition-colors"
        />
      )}
    </div>
  );
}
