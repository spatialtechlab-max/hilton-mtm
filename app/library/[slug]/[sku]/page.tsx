import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Sparkles, Truck, Ruler, ShieldCheck, Scissors } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { ProductGallery } from "@/components/ProductGallery";
import { AddToCartButton } from "@/components/AddToCartButton";
import { PlaceholderBadge, isPlaceholder } from "@/components/PlaceholderBadge";
import {
  findProduct, productGallery, allProductParams, libraries,
  type CustomizeCategory, type ProductHit,
} from "@/lib/libraries";
import { fetchErpItems, sectionsFromErp, isErpBacked } from "@/lib/erp";

/** Map an ERP categoryName onto the customizer's garment slug, so every
 *  ERP-backed PDP gets the Customise CTA driving into the right flow.
 *  Cloth categories (SUITING / JACKETING) land on suit / jacket so the
 *  customer can commission a garment cut from that cloth. Accessories
 *  (TIE / BELT / SHOES) don't have a configurator and return undefined. */
function customizeForErpType(type: string | undefined): CustomizeCategory | undefined {
  const t = (type ?? "").toUpperCase();
  if (["SUITING", "SUITINGS", "SUITS", "SUIES", "SUIUS"].includes(t)) return "suit";
  if (["JACKETING", "JACKET", "BLAZER", "RTWJKT"].includes(t)) return "jacket";
  if (["SHIRTING", "SHIIRTING", "SHIRTS"].includes(t)) return "shirt";
  if (["PANTS", "CHINO PANTS"].includes(t)) return "trouser";
  return undefined;
}

/**
 * Resolve a product by sku. Static products via libraries; ERP items by id,
 * fetched live with ISR caching.
 */
async function resolveProduct(slug: string, sku: string): Promise<ProductHit | null> {
  const staticHit = findProduct(sku);
  if (staticHit && staticHit.library.slug === slug) return staticHit;

  if (!isErpBacked(slug)) return null;
  const lib = libraries[slug];
  if (!lib) return null;
  const sections = sectionsFromErp(slug, await fetchErpItems());
  for (const section of sections) {
    const item = section.items.find((it) => it.sku === sku);
    if (item) {
      // ERP items inherit their customise category from the ERP
      // categoryName so each PDP exposes the right configurator flow
      // (SUITING → suit, SHIRTING → shirt, etc.).
      const customize = customizeForErpType(item.type);
      return { item, library: { ...lib, sections }, section, customize };
    }
  }
  return null;
}

export function generateStaticParams() {
  return allProductParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; sku: string }>;
}): Promise<Metadata> {
  const { slug, sku } = await params;
  const hit = await resolveProduct(slug, sku);
  if (!hit) return {};
  return {
    title: `${hit.item.name} — ${hit.item.type}`,
    description: hit.item.description ?? hit.item.alt,
  };
}

const CUSTOMIZE_LABEL: Record<CustomizeCategory, string> = {
  suit: "Customise this suit",
  jacket: "Customise this jacket",
  shirt: "Customise this shirt",
  trouser: "Customise these trousers",
};

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; sku: string }>;
}) {
  const { slug, sku } = await params;
  const hit = await resolveProduct(slug, sku);
  if (!hit) notFound();

  const { item, library, section, customize } = hit;
  const gallery = productGallery(item);
  const contain = (item.media.kind === "photo" && item.media.src.startsWith("/products/"));

  // A few more pieces from the same library for the "you may also like" rail.
  const related = library.sections
    .flatMap((s) => s.items)
    .filter((it) => it.sku !== item.sku)
    .slice(0, 4);

  const tailored = customize === "suit" || customize === "jacket";

  // Build the spec table dynamically — every ERP field that's populated gets
  // a row. For non-ERP items the static defaults still appear. Only fields
  // with real data are rendered (no "—" placeholders).
  const row = (label: string, value: string | undefined | null): { label: string; value: string } | null =>
    value && String(value).trim() !== "" ? { label, value: String(value) } : null;

  const specs: { label: string; value: string }[] = [
    row("Style",        item.type),
    row("Brand",        item.brand),
    row("Composition",  item.composition ?? item.cloth),
    row("Pattern",      item.pattern),
    row("Color",        item.color),
    row("Shade",        item.shade),
    row("Weight",       item.weight),
    row("Size",         item.size),
    row("Origin",       item.origin),
    row("Style code",   item.code),
    row("SKU",          item.sku),
    row("Collection",   library.eyebrow.replace(/^The\s+/, "")),
    // House info — kept on every product regardless of source
    row("Construction", tailored ? "Half-canvas · full canvas on Bespoke" : undefined),
    row("Lead time",    "2–4 weeks"),
  ].filter((r): r is { label: string; value: string } => r !== null);

  const howItWorks = [
    { icon: <Sparkles size={20} strokeWidth={1.4} />, title: "Refine your design", body: "Choose your fit, cloth, lapels, buttons, lining and more — every detail is yours." },
    { icon: <Ruler size={20} strokeWidth={1.4} />, title: "Enter your measurements", body: "Add your measurements online, or get measured in minutes at the atelier." },
    { icon: <ShieldCheck size={20} strokeWidth={1.4} />, title: "Experience superior fit", body: "Cut to your body and adjusted until it’s right — your first alteration is on us." },
  ];

  return (
    <div className="pt-28 md:pt-36 pb-24">
      <div className="container-editorial">
       <div className="mx-auto max-w-[1080px]">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-eyebrow text-[var(--color-charcoal-500)] mb-8">
          <Link href={`/library/${library.slug}`} className="inline-flex items-center gap-2 hover:text-[var(--color-burgundy-700)] transition-colors">
            <ArrowLeft size={14} strokeWidth={1.5} /> {library.title.replace(/\.$/, "")}
          </Link>
          <span aria-hidden className="opacity-40">/</span>
          <span className="text-[var(--color-charcoal-800)] normal-case tracking-normal">{item.name}</span>
        </nav>

        {/* Main: gallery + buy */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] gap-10 lg:gap-20 items-start">
          {/* Gallery */}
          <Reveal>
            <ProductGallery images={gallery} alt={item.alt} contain={contain} />
          </Reveal>

          {/* Buy column */}
          <Reveal delay={0.1}>
            <div className="lg:pt-2">
              <span className="text-eyebrow text-[var(--color-burgundy-700)]">{item.type}</span>
              <h1 className="text-display text-[clamp(2.25rem,4.5vw,3.25rem)] mt-3 leading-[1.02]">
                {item.name}
              </h1>
              {item.cloth && (
                <p className="mt-3 text-[0.95rem] text-[var(--color-charcoal-500)]">{item.cloth}</p>
              )}
              {/* Only render real ERP prices — items with placeholder
                  "From BHD …" labels (legacy editorial fakes) are
                  suppressed so the PDP doesn't show made-up numbers. */}
              {item.price && !/^From\b/i.test(item.price) && (
                <div className="mt-5 text-display text-[1.75rem] text-[var(--color-burgundy-700)]">
                  {item.price}
                </div>
              )}

              <p className="mt-6 text-[1rem] text-[var(--color-charcoal-700)] leading-relaxed">
                {item.description ?? item.alt}
              </p>

              {/* CTAs */}
              <div className="mt-9 space-y-3">
                {customize ? (
                  <Link
                    // Suit / jacket carry the Essentials / Signature / Bespoke
                    // tier picker. Per client direction we expose the FULL
                    // step set straight from the PDP — defaulting tier to
                    // 'bespoke' surfaces every booklet option (lapel, vents,
                    // tuxedo, double-breasted, sport jacket, canvas, lining
                    // colour, etc.) so the customer doesn't have to commit
                    // to a tier before they've explored the options.
                    href={
                      customize === "suit" || customize === "jacket"
                        ? `/customize?category=${customize}&sku=${item.sku}&tier=bespoke`
                        : `/customize?category=${customize}&sku=${item.sku}`
                    }
                    className="w-full text-eyebrow inline-flex items-center justify-center gap-3 bg-[var(--color-burgundy-700)] text-[var(--color-ivory-100)] px-8 py-4 hover:bg-[var(--color-burgundy-800)] transition-colors"
                  >
                    <Sparkles size={16} strokeWidth={1.5} /> {CUSTOMIZE_LABEL[customize]}
                    <ArrowRight size={16} strokeWidth={1.5} />
                  </Link>
                ) : (
                  <AddToCartButton
                    label="Add to cart"
                    variant="solid"
                    product={{
                      sku: item.sku,
                      name: item.name,
                      type: item.type,
                      price: item.price,
                      priceNum: (() => { const m = String(item.price).match(/[\d,]+(?:\.\d+)?/); return m ? Number(m[0].replace(/,/g, "")) : 0; })(),
                      image: gallery[0] ?? "/products/no-image.svg",
                      contain,
                      href: `/library/${library.slug}/${item.sku}`,
                    }}
                  />
                )}
              </div>

              {/* Reassurance bullets retired per client direction.
                  The Details panel below now follows directly under
                  the CTA, sitting next to the gallery. */}

              {/* Details panel — sits right next to the gallery so the
                  customer can read the spec without scrolling. */}
              <div className="mt-9 pt-7 border-t border-black/10">
                <span className="text-eyebrow text-[var(--color-burgundy-700)]">Details</span>
                <dl className="mt-5 border-t border-black/10">
                  {specs.map((row) => {
                    const missing = row.value === "Missing value";
                    return (
                      <div key={row.label} className="flex items-start justify-between gap-6 py-3 border-b border-black/10">
                        <dt className="text-[0.72rem] tracking-[0.12em] uppercase text-[var(--color-charcoal-500)]">{row.label}</dt>
                        <dd className={`text-[0.88rem] text-right ${missing ? "italic text-[var(--color-burgundy-700)]/70" : "text-[var(--color-charcoal-900)]"}`}>{row.value}</dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            </div>
          </Reveal>
        </div>

        {/* How it works — three steps */}
        {customize && (
          <section className="mt-20 md:mt-28 border-t border-black/10 pt-14">
            <span className="text-eyebrow text-[var(--color-burgundy-700)]">How it’s made</span>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              {howItWorks.map((s, i) => (
                <div key={s.title} className="flex flex-col">
                  <div className="flex items-center gap-3 text-[var(--color-burgundy-700)]">
                    <span className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-[var(--color-burgundy-700)]/25">{s.icon}</span>
                    <span className="text-eyebrow text-[var(--color-charcoal-500)]">Step {i + 1}</span>
                  </div>
                  <h3 className="text-display text-[1.5rem] mt-4 text-[var(--color-charcoal-900)]">{s.title}</h3>
                  <p className="mt-2 text-[0.9rem] text-[var(--color-charcoal-700)] leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Shipping / Custom made / New-to-MTM — Details now lives next
            to the gallery above, so this strip only carries the editorial
            reassurance content. */}
        <section className="mt-20 md:mt-28 border-t border-black/10 pt-14 grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14">
          <div>
            <div className="text-eyebrow text-[var(--color-burgundy-700)] inline-flex items-center gap-2">
              <Truck size={15} strokeWidth={1.5} /> Shipping
            </div>
            <p className="mt-3 text-[0.95rem] text-[var(--color-charcoal-700)] leading-relaxed">
              Complimentary worldwide delivery on orders over BHD 150. Allow 2–4 weeks for the make.
            </p>
          </div>
          <div>
            <div className="text-eyebrow text-[var(--color-burgundy-700)] inline-flex items-center gap-2">
              <Scissors size={15} strokeWidth={1.5} /> Custom made
            </div>
            <p className="mt-3 text-[0.95rem] text-[var(--color-charcoal-700)] leading-relaxed">
              Cut to your measurement profile and kept on file for life. Every piece is made to order, by hand.
            </p>
          </div>
          <div className="bg-[var(--color-ivory-200)] p-7">
            <div className="text-eyebrow text-[var(--color-burgundy-700)] mb-2">New to Hilton Made to Measure?</div>
            <p className="text-[0.9rem] text-[var(--color-charcoal-700)] leading-relaxed">
              See how a bespoke commission comes together — from cloth, to cut, to your final fitting.
            </p>
            <Link href="/made-to-measure" className="mt-3 inline-flex items-center gap-2 text-eyebrow text-[var(--color-burgundy-700)] hover:text-[var(--color-burgundy-800)] transition-colors">
              Learn how it works <ArrowRight size={14} strokeWidth={1.5} />
            </Link>
          </div>
        </section>

        {/* Recommended */}
        {related.length > 0 && (
          <section className="mt-24 md:mt-32 border-t border-black/10 pt-16">
            <span className="text-eyebrow text-[var(--color-burgundy-700)]">Recommended for you</span>
            <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
              {related.map((it) => {
                const relContain = it.media.kind === "photo" && it.media.src.startsWith("/products/");
                const relIsErp = it.media.kind === "photo" && it.media.src.includes("erp.hiltontailoringhouse.com");
                const tileBg = relIsErp || relContain ? "bg-[var(--color-ivory-100)]" : "bg-[var(--color-ivory-200)]";
                return (
                  <Link key={it.sku} href={`/library/${library.slug}/${it.sku}`} className="group block">
                    <div className={`relative aspect-[4/5] overflow-hidden ${tileBg} hover-grow`}>
                      {it.media.kind === "photo" && isPlaceholder(it.media.src) && <PlaceholderBadge />}
                      {it.media.kind === "photo" && (
                        <Image
                          src={it.media.src}
                          alt={it.alt}
                          fill
                          sizes="(min-width: 1024px) 25vw, 50vw"
                          className={relContain ? "object-contain p-4 md:p-6" : "object-cover"}
                          style={relIsErp ? { mixBlendMode: "multiply" } : undefined}
                        />
                      )}
                    </div>
                    <div className="mt-4">
                      <span className="text-eyebrow text-[var(--color-charcoal-500)]">{it.type}</span>
                      <h3 className="text-display text-[1.25rem] mt-1.5 leading-tight text-[var(--color-charcoal-900)] group-hover:text-[var(--color-burgundy-700)] transition-colors">
                        {it.name}
                      </h3>
                      <span className="text-[0.825rem] text-[var(--color-charcoal-500)]">{it.price}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
       </div>
      </div>
    </div>
  );
}
