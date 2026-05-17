"use client";

import Image from "next/image";
import { useState } from "react";
import { Check } from "lucide-react";
import { Reveal, SplitReveal } from "@/components/Reveal";

const occasions = [
  "First commission",
  "Business wardrobe",
  "Wedding",
  "Evening / black tie",
  "Travel capsule",
  "I'm not yet sure",
];

const locations = [
  "Madison Avenue, New York",
  "Mayfair, London (trunk show)",
  "Beverly Hills, LA (trunk show)",
  "Video consultation",
];

export default function BookPage() {
  const [submitted, setSubmitted] = useState(false);
  const [occasion, setOccasion] = useState(occasions[0]);
  const [location, setLocation] = useState(locations[0]);

  return (
    <>
      {/* Hero split layout */}
      <section className="pt-44 pb-16">
        <div className="container-editorial grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-7">
            <Reveal>
              <span className="text-eyebrow text-[var(--color-burgundy-700)]">By appointment</span>
            </Reveal>
            <h1 className="text-display text-[clamp(3.25rem,9vw,8rem)] mt-6 leading-[0.92]">
              <SplitReveal text="Book a Fitting." />
            </h1>
            <Reveal delay={0.3}>
              <p className="mt-8 max-w-xl text-[1.15rem] text-[var(--color-charcoal-700)] leading-relaxed">
                Your first consultation is approximately sixty minutes and entirely without
                obligation. Bring a jacket you love. Bring a jacket you don't. We'll begin from
                there.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Form + sidebar */}
      <section className="pb-32">
        <div className="container-editorial grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          <div className="lg:col-span-7 order-2 lg:order-1">
            {submitted ? (
              <Reveal>
                <div className="border border-[var(--color-burgundy-700)]/30 bg-[var(--color-burgundy-50)] p-12">
                  <Check size={32} className="text-[var(--color-burgundy-700)]" />
                  <h2 className="text-display text-[2.5rem] mt-6 leading-tight">
                    Your appointment is requested.
                  </h2>
                  <p className="mt-4 text-[1rem] text-[var(--color-charcoal-700)] leading-relaxed max-w-md">
                    We will be in touch within one working day to confirm a time. A short
                    questionnaire will follow by email.
                  </p>
                </div>
              </Reveal>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="space-y-10"
              >
                {/* Step 01 */}
                <section className="border-t border-black/10 pt-10">
                  <StepHeading num="01" label="About you" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    <Field label="First name" id="firstName" required />
                    <Field label="Last name" id="lastName" required />
                    <Field label="Email" id="email" type="email" required />
                    <Field label="Telephone" id="phone" type="tel" />
                  </div>
                </section>

                {/* Step 02 */}
                <section className="border-t border-black/10 pt-10">
                  <StepHeading num="02" label="The occasion" />
                  <div className="flex flex-wrap gap-2">
                    {occasions.map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setOccasion(o)}
                        className={`text-eyebrow px-5 py-3 border transition-colors ${
                          occasion === o
                            ? "border-[var(--color-burgundy-700)] bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)]"
                            : "border-black/15 text-[var(--color-charcoal-700)] hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)]"
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Step 03 */}
                <section className="border-t border-black/10 pt-10">
                  <StepHeading num="03" label="Where & when" />
                  <div className="space-y-6">
                    <div>
                      <label className="text-eyebrow text-[var(--color-charcoal-500)] block mb-3">
                        Location
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {locations.map((l) => (
                          <button
                            key={l}
                            type="button"
                            onClick={() => setLocation(l)}
                            className={`text-eyebrow px-5 py-3 border transition-colors ${
                              location === l
                                ? "border-[var(--color-burgundy-700)] bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)]"
                                : "border-black/15 text-[var(--color-charcoal-700)] hover:border-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-700)]"
                            }`}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                      <Field label="Preferred date" id="date" type="date" />
                      <Field label="Preferred time" id="time" type="time" />
                    </div>
                  </div>
                </section>

                {/* Step 04 */}
                <section className="border-t border-black/10 pt-10">
                  <StepHeading num="04" label="Anything we should know" />
                  <Field label="Notes (optional)" id="notes" textarea />
                </section>

                <div className="pt-6">
                  <button
                    type="submit"
                    className="text-eyebrow inline-flex items-center gap-3 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-10 py-5 hover:bg-[var(--color-burgundy-800)] transition-colors"
                  >
                    Request appointment
                  </button>
                  <p className="mt-4 text-[0.8rem] text-[var(--color-charcoal-500)] max-w-md">
                    We respond within one working day. Your details are kept privately and never
                    shared.
                  </p>
                </div>
              </form>
            )}
          </div>

          <aside className="lg:col-span-4 lg:col-start-9 order-1 lg:order-2 lg:sticky lg:top-32">
            <Reveal>
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1593030103066-0093718efeb9?q=80&w=1400&auto=format&fit=crop"
                  alt="A fitting at the atelier"
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <dl className="mt-8 space-y-6">
                <div>
                  <dt className="text-eyebrow text-[var(--color-charcoal-500)]">Duration</dt>
                  <dd className="text-display text-[1.5rem] mt-1">≈ 60 minutes</dd>
                </div>
                <div>
                  <dt className="text-eyebrow text-[var(--color-charcoal-500)]">Obligation</dt>
                  <dd className="text-display text-[1.5rem] mt-1">None</dd>
                </div>
                <div>
                  <dt className="text-eyebrow text-[var(--color-charcoal-500)]">Atelier</dt>
                  <dd className="text-[0.95rem] mt-1 leading-relaxed">
                    118 Madison Avenue,
                    <br />
                    Floor 7, New York
                  </dd>
                </div>
              </dl>
            </Reveal>
          </aside>
        </div>
      </section>
    </>
  );
}

function StepHeading({ num, label }: { num: string; label: string }) {
  return (
    <div className="text-eyebrow text-[var(--color-burgundy-700)] mb-8 flex items-baseline gap-3">
      <span className="text-display text-[1.5rem] text-[var(--color-burgundy-700)] leading-none">
        {num}
      </span>
      <span>{label}</span>
    </div>
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
    <div className="group">
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
          rows={4}
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
