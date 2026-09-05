# Making money from this site

Honest version first, then the mechanics.

## The maths

Display ads on a utility site earn roughly **$3–8 per 1,000 pageviews** (RPM), and
developer-tool audiences sit at the lower end — ad blocker usage among developers
runs 40–60%, which cuts effective RPM roughly in half.

| Monthly pageviews | At $4 RPM | At $7 RPM |
| --- | --- | --- |
| 25,000 | $100 | $175 |
| 75,000 | $300 | $525 |
| 150,000 | $600 | $1,050 |
| 250,000 | $1,000 | $1,750 |

**So $1,000/month means roughly 150,000–250,000 pageviews per month.** That is a
real number, reached by plenty of tool sites — and it is not reached in a week.
Realistic shape, if the promotion below actually happens:

- Months 1–2: a few hundred visits. Google has crawled the site but ranks nothing yet.
- Months 3–6: 5,000–20,000/month as long-tail pages start ranking.
- Months 6–12: 50,000–150,000/month if a handful of pages reach the first page.
- Month 12+: this is where $500–1,500/month becomes plausible.

Anyone promising faster is selling something. The compensating fact is that the
costs are a domain name — about $10 a year — and nothing else, forever. There is
no month where this loses money.

**The build is done. The traffic is the actual work**, and it is roughly two weekends
of promotion plus writing a guide page every few weeks.

---

## Step 1 — Launch clean, without ads

Do **not** apply to AdSense on day one. Google rejects sites with no traffic and
"low value content", and a rejection makes reapplying harder. Ship with
`ads.client` empty (the default — no ad code is emitted at all), get the site
indexed, and apply once you have a few weeks of real visitors.

While you wait, the site is fast and completely clean, which is exactly what makes
people share it.

## Step 2 — Get indexed

1. Google Search Console → add the property → copy the meta tag content into
   `site.config.js` under `verification.google` → rebuild → verify.
2. Submit `https://yourdomain.com/sitemap.xml`.
3. Same at Bing Webmaster Tools (this also feeds DuckDuckGo and ChatGPT search,
   which is a growing share of the traffic nobody optimises for).
4. Use "Request indexing" on the home page and your five best tool pages.

Indexing takes days to a few weeks. Nothing you do speeds it up much; links do.

## Step 3 — The launch posts

This is the free advertising, and the privacy angle is the hook. The pitch that
works: *"I got tired of pasting API responses into websites that upload them, so I
built 29 tools that run entirely in the browser. No accounts, no uploads, no
tracking. Open your Network tab and watch nothing leave."*

Post it where developers are, spread over a couple of weeks — not all at once:

- **Hacker News** — Show HN, Tuesday–Thursday, 8–10am Eastern. Title:
  `Show HN: 29 developer tools that run entirely in your browser`. Be in the
  comments for the first three hours; that is what decides whether it sticks.
- **Reddit** — r/webdev, r/programming, r/SideProject, r/InternetIsBeautiful,
  r/privacy, r/selfhosted. **Read each sub's self-promotion rules first**, post to
  one per day, and reply to everyone. r/InternetIsBeautiful in particular can send
  a lot of non-developer traffic.
- **Lobste.rs**, if you have an invite. Small but high quality.
- **Product Hunt** — a launch here is worth a day of traffic and a permanent
  backlink.
- **Dev.to / Hashnode** — republish a guide page (with a canonical link back).
- **Awesome lists** — search GitHub for `awesome developer tools`,
  `awesome privacy`, `awesome self-hosted` and open a PR adding the site. These
  are permanent, high-authority backlinks and almost nobody bothers.
- **Wikipedia** is not appropriate, and neither is comment spam. Both will hurt you.

One good Hacker News front page is 20,000–50,000 visits in a day. Those visitors
do not stay — but the backlinks they generate are what make Google take the site
seriously, and that is the actual prize.

## Step 4 — Turn on ads

Once you have a few weeks of steady traffic:

1. Apply to **Google AdSense**. Approval typically takes a few days to two weeks.
   The site already has what reviewers look for: a real privacy policy, an about
   page with contact details, substantial original content, and clean navigation.
   Add your email to `social.contactEmail` in `site.config.js` before applying —
   this is a common rejection reason.
2. Create three ad units in the AdSense dashboard: one responsive display unit,
   one for the sidebar, one in-article unit.
3. Paste the IDs into `site.config.js`:

```js
ads: {
  client: 'ca-pub-XXXXXXXXXXXXXXXX',
  slots: { belowTool: '1234567890', sidebar: '0987654321', inArticle: '1122334455' }
}
```

4. Rebuild and deploy. `ads.txt` is generated automatically from your publisher ID
   — without it you lose a meaningful share of ad revenue to unverified-inventory
   filtering.

Leaving any slot empty simply omits it. No empty boxes, no layout shift.

### When to leave AdSense

At around **50,000 sessions/month** you qualify for **Ezoic**, and at
**50,000 sessions/month** for **Mediavine Journey**. Both typically pay 2–3× AdSense
RPM for the same traffic. Switching is the single biggest revenue lever available,
and it is a one-line change here. Revisit once you cross the threshold.

## Step 5 — The things that out-earn display ads

Ads are the floor, not the ceiling.

- **A sponsor slot.** One relevant developer-tool sponsor (an API company, a
  monitoring service, a password manager) at $200–500/month is worth far more than
  the ads on the same pageviews, and readers hate it less. `sponsor` in
  `site.config.js` renders it; approach companies once you can show traffic numbers.
- **Affiliate links inside the guides.** The image-format guide can recommend a
  CDN. The privacy guide can recommend a password manager or VPN. Only recommend
  things you would actually use — a bad recommendation costs more trust than it
  earns.
- **A donation link.** `support` in `site.config.js`. It will not be much, but it
  costs nothing and developers do tip tools they use daily.

---

## Step 6 — The compounding part: more pages

The traffic here is almost entirely long-tail search. Each tool page targets a
cluster of keywords with real, steady volume — "json formatter", "base64 decode",
"unix timestamp converter" are searched tens of thousands of times a month each,
forever. They are competitive, so you rank for the long tail first: *"convert
unix timestamp to date in python"*, *"why is my json invalid trailing comma"*.

That is what the guides are for, and it is where the leverage is:

- **Every new tool is a new page that can rank.** Going from 29 to 60 tools
  roughly doubles the surface area. Adding one is a single file.
- **Every guide is a page that can rank for a question**, and it links to the tools,
  which helps them rank too. Aim for one every few weeks. 1,200+ words, answering
  the question properly — thin pages rank for nothing and trigger AdSense "low
  value content" warnings.
- **Update, do not abandon.** Freshness is a ranking factor. Revisiting a guide
  once a year is cheap.

Good candidates for the next batch of tools, all client-side and all with real
search volume: JSON ⇄ XML, SQL formatter, diff for JSON specifically, htpasswd
generator, .htaccess redirect generator, image cropper, colour palette extractor,
EXIF viewer/stripper, PDF merge and split (via pdf-lib), CSV to Markdown table,
Unicode character inspector, IBAN/credit-card format validator, timezone meeting
planner, aspect ratio calculator.

---

## What to watch

Add Plausible or Google Analytics via `site.config.js` and check monthly:

- **Search Console → Performance.** Which queries show the site but do not get
  clicked? Those are pages whose title or meta description needs rewriting — the
  cheapest traffic win available.
- **Pages ranking 8–20.** Nearly-first-page pages are where a small improvement
  pays most: expand the FAQ, add a section, get one more internal link pointing
  at it.
- **Which tools people actually use.** Build more like those.

## What will get you penalised

Worth knowing, because each of these is a permanent problem:

- Buying backlinks, or link-exchange schemes.
- More ads than content, or ads that push content below the fold.
- Auto-generated thin pages ("JSON formatter for Ohio").
- Copying another site's tool descriptions.
- Interstitials and pop-ups on mobile.

None of them are necessary. The site as built already does the legitimate version
of everything that matters.
