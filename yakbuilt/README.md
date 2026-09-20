# Yakbuilt.com — website rebuild

A rebuilt marketing site for **Yakbuilt, LLC** — a commercial contractor in
Canton, Texas offering **mill work installations, FF&E, and doors & hardware**.

Plain HTML, CSS and JavaScript. No build step, no framework, no server.
Open `index.html` in a browser and it works.

## Pages

| File | What's on it |
| --- | --- |
| `index.html` | Hero, credibility stats, the three services, shop-vs-site story, recent work grid, hospitality highlight reel, 4-step process, review proof, service area, FAQ, CTA |
| `services.html` | Mill work installations, FF&E, doors & hardware, the workshop, process, CTA |
| `projects.html` | Photo-led recent installations plus the Kauai Marriott / Dallas Crescent / Dallas Renaissance write-ups |
| `about.html` | Who we are, how we work, Meet the Team, customer proof |
| `contact.html` | Bid request form, phone/email/addresses, service area, pre-bid FAQ |
| `404.html` | Not-found page (excluded from search indexes) |

## Before this goes live — 3 things to replace

Everything below is a **placeholder**, because the real values weren't available
when the site was built. Search and replace across the `.html` files:

1. **Phone** — `(903) 555-0142` (display) and `+19035550142` (the `tel:` links).
   `555-01xx` numbers are reserved for fiction, so nothing real is being dialed.
2. **Email** — `office@yakbuilt.com` (appears in the footer, contact page, and
   as the fallback address in `js/main.js`).
3. **Brand colors** — the site currently uses charcoal + brass. If the old site's
   palette was different, change it in one place: the `:root` block at the top of
   `css/styles.css` (`--ink`, `--accent`, `--accent-bright`, `--sand`). Every
   button, rule, heading and overlay follows from those variables.

Optional but recommended: confirm the office hours on `contact.html`
(currently Mon–Fri 7:00am–5:00pm CT) and the shop/mailing addresses.

## Wiring up the bid request form

The form on `contact.html` has an empty `action`. Until an endpoint is added, it
falls back to opening the visitor's mail client with every field pre-filled, so
no lead is lost.

To post it properly, set the `action` to a form service (Formspree, Basin,
Netlify Forms, etc.):

```html
<form class="form-card" data-bid-form action="https://formspree.io/f/xxxxxxx" method="post">
```

Once `action` is a real URL, `js/main.js` stops intercepting the submit and the
browser posts normally.

## SEO that's already in place

- Unique `<title>` (48–61 chars) and meta description (140–164 chars) per page
- Canonical URLs, Open Graph and Twitter card tags with a real photo per page
- JSON-LD structured data: `GeneralContractor` business profile (address, hours,
  service catalog, aggregate rating), `FAQPage` on the home and contact pages,
  and `BreadcrumbList` on interior pages
- `sitemap.xml` + `robots.txt` (`404.html` is `noindex`)
- One `<h1>` per page, descriptive alt text on every image, lazy loading below
  the fold, `fetchpriority="high"` on the hero image
- Skip link, visible focus rings, `aria-current` on the active nav item,
  `prefers-reduced-motion` support

**Canonical URLs assume the site is served from `https://www.yakbuilt.com/`.**
If it ends up on a different domain or in a subfolder, update the `<link rel="canonical">`
and `og:url` tags, `sitemap.xml` and `robots.txt` to match.

## Photos

Five job-site photos live in `assets/photos/`:

| File | Used as |
| --- | --- |
| `vanity-millwork.jpg` | Home hero, recent work, services CTA |
| `partitions-laminate.jpg` | Doors & hardware, restroom project, about |
| `fitness-slat-wall.jpg` | Millwork service, amenity-space project |
| `retail-casework.jpg` | FF&E service, market project |
| `partitions-stainless.jpg` | In-progress project, proof section |

They're straight off a phone (~1–1.5 MB each). Before launch, run them through
an image optimizer (Squoosh, ImageOptim, `cwebp`) and aim for ~200–300 KB each —
that's the single biggest page-speed win available here.

## Structure

```
yakbuilt/
├── index.html · services.html · projects.html · about.html · contact.html · 404.html
├── css/styles.css     — the whole design system; brand tokens in :root
├── js/main.js         — nav, sticky header, scroll reveals, form fallback
├── assets/
│   ├── logo.svg · favicon.svg
│   └── photos/
├── robots.txt
└── sitemap.xml
```

Fonts are Archivo + Inter, loaded from Google Fonts. If you'd rather not depend
on a third party, self-host them and swap the `<link>` in each page's `<head>`.

## Deploying

Any static host works — GitHub Pages, Netlify, Cloudflare Pages, or plain
shared hosting. Upload the contents of this folder to the web root.
