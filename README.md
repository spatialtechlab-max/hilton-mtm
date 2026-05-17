# Hilton Made to Measure — Website

An editorial brand site for **Hilton Made to Measure**, a bespoke tailoring atelier.
Designed in the spirit of Indochino / Black Lapel — quieter, more architectural,
built around the burgundy of Pantone 7421 C.

---

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (theme-based, no `tailwind.config.js` needed)
- **Framer Motion** — scroll-triggered fades & split-word reveals
- **Cormorant Garamond** (display) + **Inter** (body), served via `next/font`
- **next/image** + Unsplash editorial photography (swap for real shoots)

## Pages

| Route        | What it is                                                                  |
| ------------ | --------------------------------------------------------------------------- |
| `/`          | Hero, press, brand statement, atelier feature, collection grid, process, testimonials, CTA |
| `/collection`| Editorial filterable grid of all signature garments                         |
| `/process`   | Five chapters of the Made-to-Measure journey + pricing                      |
| `/heritage`  | Brand story, full-bleed atelier image, six-decade timeline, four house rules |
| `/book`      | Multi-step appointment request form (occasion, location, date/time, notes)  |
| `/contact`   | Contact form, atelier address, hours, social                                |

## Run

```bash
npm install   # already done once
npm run dev   # http://localhost:3000
```

Build for production:

```bash
npm run build && npm start
```

## Design tokens

All design tokens live in `app/globals.css` under `@theme`. Change the brand colour
once there (`--color-burgundy-700: #6e2639;`) and it propagates everywhere.

```
Burgundy   #6e2639   primary (Pantone 7421 C)
Ivory      #f6f1ea   page background
Charcoal   #14110f   text / dark sections
Gold       #c9a961   reserved accent
```

## Logo

The original `Hilton_MTM_Logo_Pantone_7421_C.pdf` is rendered as `public/logo-full.png`
(high resolution). The navigation/footer mark is a hand-traced inline SVG inside
`components/Logo.tsx`, so it always stays crisp and recoloured with the theme.

## Imagery

Hero / collection / atelier photography uses Unsplash for the demo (configured in
`next.config.ts` under `images.remotePatterns`). For production, replace with your
own shoots; the layouts are aspect-ratio driven and will hold.

## Deploy

The site is deploy-anywhere (Vercel recommended):

1. Push to a Git repo
2. Connect to Vercel → "Import Project"
3. Defaults are fine — Next 15 + App Router auto-detected
