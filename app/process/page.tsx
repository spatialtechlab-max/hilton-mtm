import { PageHero } from "@/components/PageHero";
import { Reveal, SplitReveal } from "@/components/Reveal";
import { CtaBanner } from "@/components/CtaBanner";
import { Button } from "@/components/Button";
import { MediaImage } from "@/components/MediaImage";
import { MEDIA_SLOTS } from "@/lib/mediaSlots";

const PROCESS_INSTORE = MEDIA_SLOTS.find((s) => s.key === "process.instore")!;
const PROCESS_ONLINE = MEDIA_SLOTS.find((s) => s.key === "process.online")!;

const inStore = [
  {
    n: "01",
    title: "Book Your Appointment",
    body:
      "Reach out by phone or email to schedule a time. We book private appointments to make sure we can give you our full, undivided attention — without any rush.",
  },
  {
    n: "02",
    title: "Consultation & Fabric Selection",
    body:
      "When you arrive, you meet with your wardrobe consultant. We discuss your day-to-day routine, your travel schedule and what you actually need from your wardrobe, then help you select the perfect fabric from our range of trusted, high-quality brands.",
  },
  {
    n: "03",
    title: "Choose Your Customisation Level",
    body:
      "Three different tiers to fit your needs — Essentials (a great foundation for quality made-to-measure), Signature (our standard Hilton finish), or Full Bespoke (extensive hand-stitching and completely custom canvas construction).",
  },
  {
    n: "04",
    title: "Getting Measured",
    body:
      "Our experienced master tailor takes your precise measurements. We don't just write down numbers — we look at your posture and listen to how you actually like your clothes to fit, so the final cut is both comfortable and flattering.",
  },
  {
    n: "05",
    title: "Your Fitting",
    body:
      "Before the garment is completely finished, you come back in to try it on. This lets us check the fit in real time and make any necessary adjustments based on your feedback.",
  },
  {
    n: "06",
    title: "Final Pickup",
    body:
      "Collect your finished garment on a date that works for you. We keep your personal pattern on file, which makes ordering your next piece incredibly easy.",
  },
];

const online = [
  {
    n: "01",
    title: "Pick Your Fabric",
    body:
      "Browse the online collection to find the right material. We provide clear details on the weight and feel of each fabric so you know exactly what to expect — whether you need a breathable summer jacket or a warm winter coat.",
  },
  {
    n: "02",
    title: "Select Your Tier",
    body:
      "Just like in the store, choose the level of craftsmanship that makes sense for you: Essentials, Signature or Full Bespoke.",
  },
  {
    n: "03",
    title: "Design Your Garment",
    body:
      "Customise the details of your clothing on the website. You are in control of the style — from the type of lapel and pockets down to the lining and button choices.",
  },
  {
    n: "04",
    title: "Take Measurements at Home",
    body:
      "We've made it simple to get accurate measurements without a tailor. Watch our easy-to-follow video guides and enter your numbers directly into the website.",
  },
  {
    n: "05",
    title: "Create Your Profile",
    body:
      "Once you enter your measurements, create your Hilton MTM profile. This saves your digital pattern and style preferences securely in our system, so your future orders are just a few clicks away.",
  },
  {
    n: "06",
    title: "Delivery to Your Door",
    body:
      "We get to work making your clothing. Depending on the tier you chose, your finished garment is shipped directly to your door in 3 to 4 weeks, ready to wear.",
  },
];

export default function ProcessPage() {
  return (
    <>
      <PageHero
        eyebrow="The Method"
        title="Made to Measure."
        intro="Two ways to get your perfect fit. Sit down with us in person, or design your clothing from the comfort of your home. The process is built around you — your lifestyle, your needs."
        image={{
          src: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?q=80&w=1400&auto=format&fit=crop",
          alt: "A basted jacket on the cutting table",
        }}
      />

      {/* ─────────────── IN-STORE ─────────────── */}
      <section className="py-14 md:py-20 border-t border-black/10">
        <div className="container-editorial">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-16">
            <div className="lg:col-span-5">
              <Reveal>
                <span className="text-eyebrow text-[var(--color-burgundy-700)]">N° 01 · In Person</span>
              </Reveal>
              <h2 className="text-display text-[clamp(2.5rem,5vw,4.5rem)] mt-4 leading-[1.02]">
                <SplitReveal text="The In-Store Experience." />
              </h2>
              <Reveal delay={0.2}>
                <p className="mt-8 text-[1.05rem] text-[var(--color-charcoal-700)] leading-relaxed max-w-md">
                  For those who prefer a traditional, face-to-face consultation at our tailoring house in Manama — or during our US trunk shows.
                </p>
              </Reveal>
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <Reveal delay={0.2}>
                <div className="relative aspect-[4/5] overflow-hidden hover-grow">
                  <MediaImage
                    slot={PROCESS_INSTORE.key}
                    fallback={PROCESS_INSTORE.fallback}
                    fallbackAlt={PROCESS_INSTORE.fallbackAlt}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </Reveal>
            </div>
          </div>

          <ol className="border-t border-black/10">
            {inStore.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.05} as="li">
                <div className="grid grid-cols-12 gap-4 lg:gap-8 py-10 border-b border-black/10 group">
                  <span className="col-span-2 lg:col-span-1 text-display text-[1.75rem] text-[var(--color-burgundy-700)]">
                    {s.n}
                  </span>
                  <h3 className="col-span-10 lg:col-span-4 text-display text-[1.75rem] text-[var(--color-charcoal-900)] group-hover:text-[var(--color-burgundy-700)] transition-colors">
                    {s.title}
                  </h3>
                  <p className="col-span-12 lg:col-span-7 text-[0.975rem] text-[var(--color-charcoal-700)] leading-relaxed">
                    {s.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ─────────────── ONLINE ─────────────── */}
      <section className="py-14 md:py-20 bg-[var(--color-ivory-200)]">
        <div className="container-editorial">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-16">
            <div className="lg:col-span-6 lg:order-2 lg:col-start-7">
              <Reveal>
                <span className="text-eyebrow text-[var(--color-burgundy-700)]">N° 02 · From Home</span>
              </Reveal>
              <h2 className="text-display text-[clamp(2.5rem,5vw,4.5rem)] mt-4 leading-[1.02]">
                <SplitReveal text="The Online Experience." />
              </h2>
              <Reveal delay={0.2}>
                <p className="mt-8 text-[1.05rem] text-[var(--color-charcoal-700)] leading-relaxed max-w-md">
                  A simple, step-by-step digital process for designing custom clothing from anywhere — fabric, tier, style and measurements, all from the comfort of your home.
                </p>
              </Reveal>
              <Reveal delay={0.3}>
                <div className="mt-10">
                  <Button href="/customize" variant="solid">Start designing</Button>
                </div>
              </Reveal>
            </div>
            <div className="lg:col-span-5 lg:order-1">
              <Reveal delay={0.2}>
                <div className="relative aspect-[4/5] overflow-hidden hover-grow">
                  <MediaImage
                    slot={PROCESS_ONLINE.key}
                    fallback={PROCESS_ONLINE.fallback}
                    fallbackAlt={PROCESS_ONLINE.fallbackAlt}
                    fill
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </Reveal>
            </div>
          </div>

          <ol className="border-t border-black/10">
            {online.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.05} as="li">
                <div className="grid grid-cols-12 gap-4 lg:gap-8 py-10 border-b border-black/10 group">
                  <span className="col-span-2 lg:col-span-1 text-display text-[1.75rem] text-[var(--color-burgundy-700)]">
                    {s.n}
                  </span>
                  <h3 className="col-span-10 lg:col-span-4 text-display text-[1.75rem] text-[var(--color-charcoal-900)] group-hover:text-[var(--color-burgundy-700)] transition-colors">
                    {s.title}
                  </h3>
                  <p className="col-span-12 lg:col-span-7 text-[0.975rem] text-[var(--color-charcoal-700)] leading-relaxed">
                    {s.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

    </>
  );
}
