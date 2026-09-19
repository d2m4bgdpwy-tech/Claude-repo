# Trinity Stone Co. — countertop website

A complete marketing site for a granite/quartz countertop business serving
**Dallas–Fort Worth and the surrounding areas**. Plain HTML, CSS and
JavaScript — no build step, no framework, no server. Open `index.html` in a
browser and it works.

The site is built around what the business actually does: **price the job,
cut the stone, install the stone.**

## Pages

| File | What's on it |
| --- | --- |
| `index.html` | Hero, the three-stage pitch, what's included, process, material preview, reviews, DFW service area, FAQ |
| `services.html` | Detail on pricing/fabrication/installation, edge-profile table, other work, builder & trade program, warranty |
| `materials.html` | Granite vs. quartz vs. quartzite vs. marble, 12 colors, comparison table, care instructions |
| `gallery.html` | Six project write-ups plus the craftsmanship details customers notice |
| `estimate.html` | **Instant estimator** — live installed pricing, plus the full rate card |
| `contact.html` | Quote request form, shop details, full city list |
| `404.html` | Not-found page |

## The estimator

`estimate.html` prices a job the same way a written quote does: material ×
square footage, edge upcharge, cutouts, backsplash, tear-out, plumbing,
travel, then the shop minimum and tax. It runs entirely in the browser —
nothing is transmitted.

**All pricing lives in one file: [`js/pricing.js`](js/pricing.js).** Change a
number there and both the estimator and the rate card on the page update.

```js
materials: [
  { id: "granite-1", label: "Granite — Level 1", rate: 52, blurb: "…" },
  …
]
```

Other knobs in that file:

- `minimumJob` — the smallest job you'll take (currently $1,450)
- `taxRate` / `taxAppliesTo` — sales tax, charged on goods by default
- `rangeSpread` — how wide the "typical range" band is (10%)
- `edges`, `addons`, `services`, `travel` — per-unit and per-job pricing

When someone clicks **Send this to the shop**, the line items are carried over
into the contact form on `contact.html` so the lead arrives with the customer's
own numbers attached.

## Making it yours

1. **Business name, phone, address.** Search and replace across the `.html`
   files: `Trinity Stone Co.`, `(214) 555-0147`, `+12145550147`,
   `quotes@trinitystoneco.com`, `1420 Industrial Blvd`, and the domain
   `https://www.trinitystoneco.com` (used in canonical URLs, `sitemap.xml`,
   `robots.txt` and the structured data). The phone number also appears in
   `js/contact.js`.
2. **Prices.** `js/pricing.js`, as above. The numbers shipped here are
   realistic mid-2020s DFW installed rates — check them against your own
   slab costs before going live.
3. **Colors and type.** The CSS custom properties at the top of
   `css/styles.css` (`--brass`, `--ink`, `--serif`, …) drive the whole design.
4. **Photos.** Everything in `assets/` is a generated SVG placeholder: slab
   textures and stylized project illustrations, not photographs. Replace them
   with real job photos as you get them — keep the same filenames and nothing
   else has to change. Real photos of your own installs are the single
   highest-value upgrade to this site.
5. **Copy.** Stats on the homepage (`3,400+ kitchens`, `15 yrs`, `4.9★`) and
   the three testimonials are placeholders. Put real numbers and real reviews
   there before launch — don't ship invented ones.

## Hooking up the contact form

A static site can't send email by itself. Out of the box the form opens the
visitor's mail app with everything pre-filled, so no lead is lost. To collect
submissions properly, sign up with a form service (Formspree, Basin, Netlify
Forms — all have free tiers) and paste your endpoint into
[`js/contact.js`](js/contact.js):

```js
var FORM_ENDPOINT = "https://formspree.io/f/your-form-id";
```

That's the only change needed; the form then submits by `fetch` without
leaving the page.

## Deploying

Any static host works. The site is a folder of files.

- **GitHub Pages** — Settings → Pages → deploy from `main`, root folder.
- **Netlify / Vercel / Cloudflare Pages** — drag the folder in, or point it at
  this repo. No build command, publish directory `/`.
- **Traditional hosting** — upload everything by FTP.

Local preview:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## SEO notes

Each page ships a title, meta description, canonical URL, Open Graph tags and
`HomeAndConstructionBusiness` structured data with `areaServed` listing 24 DFW
cities. After launch: claim the Google Business Profile, point `sitemap.xml`
at the real domain, and submit it in Search Console.

## Accessibility

Skip link, labelled form controls, `aria-live` on the estimate total, visible
focus rings, keyboard-operable nav and radio groups, and
`prefers-reduced-motion` honored for the scroll animations.

---

## MCP server configuration

This repo also carries a project-scoped MCP server config in
[`.mcp.json`](.mcp.json), which Claude Code picks up automatically:

| Name | Transport | URL |
| --- | --- | --- |
| `robinhood-trading` | HTTP | `https://agent.robinhood.com/mcp/trading` |

On first use Claude Code asks you to approve the server before connecting;
authentication goes through the server's own OAuth flow (`/mcp` in Claude
Code). The equivalent CLI command:

```bash
claude mcp add robinhood-trading --transport http https://agent.robinhood.com/mcp/trading
```
