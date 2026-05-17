import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { CtaBanner } from "@/components/CtaBanner";

const categories = [
  "All",
  "Suits",
  "Jackets",
  "Overcoats",
  "Shirting",
  "Shoes",
  "Ties & Silks",
  "Accessories",
  "Eveningwear",
];

type Item = {
  name: string;
  cat: typeof categories[number];
  cloth: string;
  price: string;
  image: string;
  scale?: 1 | 2;
};

const items: Item[] = [
  {
    name: "Walden Two-Piece",
    cat: "Suits",
    cloth: "Worsted wool · Huddersfield",
    price: "From $2,400",
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=1800&auto=format&fit=crop",
    scale: 2,
  },
  {
    name: "Marlow Sport Coat",
    cat: "Jackets",
    cloth: "Hopsack · Loro Piana",
    price: "From $1,850",
    image: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?q=80&w=1400&auto=format&fit=crop",
  },
  {
    name: "The Oxford",
    cat: "Shoes",
    cloth: "Hand-welted calf · Northampton",
    price: "From $1,150",
    image: "https://images.unsplash.com/photo-1614253429340-98120bd6d753?q=80&w=1400&auto=format&fit=crop",
  },
  {
    name: "Madison Silk Tie",
    cat: "Ties & Silks",
    cloth: "Como silk · 8-fold",
    price: "From $185",
    image: "https://images.unsplash.com/photo-1593032580308-d4bafafc4f28?q=80&w=1400&auto=format&fit=crop",
  },
  {
    name: "Severn Topcoat",
    cat: "Overcoats",
    cloth: "Camel hair · Abraham Moon",
    price: "From $3,200",
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1400&auto=format&fit=crop",
  },
  {
    name: "Hawthorn Evening",
    cat: "Eveningwear",
    cloth: "Black barathea · Holland & Sherry",
    price: "From $3,800",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1400&auto=format&fit=crop",
  },
  {
    name: "Albany Shirt",
    cat: "Shirting",
    cloth: "Sea-island cotton · Alumo",
    price: "From $290",
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1400&auto=format&fit=crop",
  },
  {
    name: "Beacon Three-Piece",
    cat: "Suits",
    cloth: "Flannel · Fox Brothers",
    price: "From $2,950",
    image: "https://images.unsplash.com/photo-1593032465175-481ac7f401a0?q=80&w=1400&auto=format&fit=crop",
    scale: 2,
  },
  {
    name: "Cloth Bunches",
    cat: "Accessories",
    cloth: "47 mills · 612 swatches",
    price: "Sent on request",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1400&auto=format&fit=crop",
  },
  {
    name: "Linden Linen Jacket",
    cat: "Jackets",
    cloth: "Pure linen · Solbiati",
    price: "From $1,650",
    image: "https://images.unsplash.com/photo-1521334884684-d80222895322?q=80&w=1400&auto=format&fit=crop",
  },
  {
    name: "Carlyle Pea Coat",
    cat: "Overcoats",
    cloth: "Melton · Abraham Moon",
    price: "From $2,800",
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1400&auto=format&fit=crop",
  },
];

export default function CollectionPage() {
  return (
    <>
      <PageHero
        eyebrow="Spring / Summer · N° 01"
        title="The Collection."
        intro="Suits, shirting, footwear, ties and the small things that finish the wardrobe. Every piece is a starting point. A conversation about your own."
        image={{
          src: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1600&auto=format&fit=crop",
          alt: "A finished bespoke jacket on a wooden form",
        }}
      />

      {/* Filter row */}
      <section className="border-y border-black/10">
        <div className="container-editorial flex items-center gap-2 overflow-x-auto py-5 no-scrollbar">
          {categories.map((c, i) => (
            <button
              key={c}
              className={`text-eyebrow shrink-0 px-5 py-2 border transition-colors ${
                i === 0
                  ? "border-[var(--color-burgundy-700)] text-[var(--color-burgundy-700)] bg-[var(--color-burgundy-50)]"
                  : "border-transparent text-[var(--color-charcoal-700)] hover:text-[var(--color-burgundy-700)]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* Editorial grid */}
      <section className="py-24 md:py-32">
        <div className="container-editorial">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-x-6 gap-y-16">
            {items.map((item, i) => (
              <Reveal
                key={item.name}
                delay={(i % 3) * 0.08}
                className={`${
                  item.scale === 2 ? "col-span-2 lg:col-span-3" : "col-span-1 lg:col-span-2"
                }`}
              >
                <Link href="#" className="group block">
                  <div className={`relative ${item.scale === 2 ? "aspect-[4/5]" : "aspect-[3/4]"} overflow-hidden bg-[var(--color-ivory-200)] hover-grow`}>
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes={item.scale === 2 ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 33vw, 50vw"}
                      className="object-cover"
                    />
                  </div>
                  <div className="mt-6 flex items-start justify-between gap-4">
                    <div>
                      <span className="text-eyebrow text-[var(--color-charcoal-500)]">{item.cat}</span>
                      <h3 className="text-display text-[1.85rem] mt-2 text-[var(--color-charcoal-900)] group-hover:text-[var(--color-burgundy-700)] transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-[0.875rem] text-[var(--color-charcoal-500)] mt-1">{item.cloth}</p>
                    </div>
                    <span className="text-[0.875rem] text-[var(--color-charcoal-700)] shrink-0 mt-1">
                      {item.price}
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBanner
        title="Order a cloth bunch."
        body="Forty-seven mills, six hundred and twelve cloths, sent in a leather-bound bunch with the cutter's notes."
        ctaLabel="Request Cloth Bunch"
        href="/contact"
        image="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=2000&auto=format&fit=crop"
      />
    </>
  );
}
