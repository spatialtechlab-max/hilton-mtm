export const site = {
  name: "Hilton Made to Measure",
  shortName: "Hilton MTM",
  tagline: "Tailored, not merely fitted.",
  description:
    "The Collection by Hilton MTM. From impeccably tailored suits and crisp shirting to footwear and the finishing touches — every piece is the starting point of a conversation about your personal style.",
  url: "https://hiltonmtm.com",
  email: "atelier@hiltonmtm.com",
  phone: "+973 17 245 689",
  whatsapp: "+973 33 330 675",
  address: {
    line1: "Shop No. 119, Shaikh Abdulla Avenue",
    city: "Manama, Kingdom of Bahrain",
  },
  hours: [
    { day: "Saturday – Thursday", time: "9:00 – 12:30 · 16:00 – 20:30" },
    { day: "Friday", time: "Closed" },
  ],
  social: {
    instagram: "https://instagram.com/hiltonmtm",
    // LinkedIn and Pinterest hidden until the client provides real accounts.
  },
};

export const nav = [
  // "The Collection" is hidden for now — it isn't in the client brief and the
  // category libraries cover the same purpose. Uncomment to bring it back.
  // { href: "/collection", label: "The Collection" },
  { href: "/customize", label: "Design Yours" },
  { href: "/process", label: "Made to Measure" },
  { href: "/heritage", label: "Heritage" },
  { href: "/contact", label: "Contact" },
];
