# Quiet Tools

A static website of **29 browser-based utilities** — JSON, CSV, Base64, hashes, JWTs,
regex, images, colours, cron — with one rule: nothing the user pastes or opens is
ever uploaded. Every tool is plain JavaScript running in the visitor's own tab.

That constraint is also the business model. No server means **no hosting bill, no
database, no API keys, no scaling, no on-call** — so once it is deployed there is
genuinely nothing to maintain. The whole site is 940 KB of static files.

```bash
npm run dev     # build + preview at http://localhost:5173
npm test        # build, then check every page and every tool in a real browser
```

---

## Getting it live in 15 minutes

1. **Pick a domain.** Short and generic beats clever — people type these into a
   search bar, not a browser. ~$10/year at Cloudflare or Porkbun.
2. **Set it in `site.config.js`** — the `origin` field. Every canonical URL,
   the sitemap and the social cards are generated from it, so this must be right
   *before* search engines index the site.
3. **Deploy.** Cloudflare Pages is the recommendation: free, unlimited bandwidth,
   fast everywhere.
   - Build command: `node build.js`
   - Output directory: `dist`
   - No environment variables, no framework preset.

   GitHub Pages works too — `.github/workflows/deploy.yml` is ready; enable Pages
   with "GitHub Actions" as the source. Netlify reads `netlify.toml` as-is.
4. **Verify in Google Search Console**, put the meta tag in `site.config.js`, and
   submit `/sitemap.xml`. Do the same at Bing Webmaster Tools — it also feeds
   DuckDuckGo and ChatGPT search.

That is the whole deployment. There is nothing to restart and nothing that expires.

Read **[MONETIZATION.md](MONETIZATION.md)** next — it covers turning ads on, the
realistic revenue maths, and the launch sequence.

---

## How the site is built

Zero dependencies, by design: this should still build in five years with nothing
but a Node runtime.

```
site.config.js        every setting that makes the site yours — brand, domain, ad IDs
build.js              the static site generator (~450 lines, no dependencies)
serve.js              local preview server that mimics a static host's URL rules
src/
  layout.js           page shell, SEO head, structured data, ad slots
  style.css           one stylesheet, light + dark, no framework
  app.js              theme, search, and the QT helper namespace tools use
  categories.js       category names and their order on the home page
  tools/*.js          one file per tool — meta + markup + browser code
  pages/
    guides.js         long-form articles
    static.js         about, privacy, 404
test/
  smoke.mjs           loads all 38 pages in Chromium, fails on any console error
  tools.mjs           drives 40 real interactions and checks the answers
```

### The shape of a tool

Each tool is one self-contained file exporting `meta` and `client`:

```js
export const meta = {
  slug: 'my-tool',              // the URL: /my-tool/
  title: 'My Tool',             // <h1> and <title> — keyword-first
  shortTitle: 'My Tool',        // for cards and the footer
  category: 'Text',             // must exist in src/categories.js
  description: '...',           // meta description, under 158 characters
  keywords: [...],              // used by the on-site search
  intro: '...',                 // the paragraph under the heading
  related: ['other-tool'],      // validated at build time
  faq: [{ q: '...', a: '...' }],// rendered, and emitted as FAQPage schema
  html: `<div class="panel">…</div>`
};

export function client(root, QT) {
  // Runs in the browser with the tool's root element.
  // Stringified at build time, so it must not close over module scope —
  // everything it needs comes from `root`, `QT`, and its own body.
}
```

`build.js` refuses to build if a slug is duplicated, a category is unknown, a
`related` entry points at a tool that does not exist, or a required field is
missing. It warns when a title or meta description is too long for search results.

### The `QT` helper namespace

Available to every tool: `QT.$` / `QT.$$`, `QT.copy`, `QT.download`, `QT.read`,
`QT.dropzone`, `QT.msg`, `QT.debounce`, `QT.bytes`, `QT.store` (localStorage that
never throws), `QT.lib` (lazy-load a pinned CDN library), and `QT.toast`.

Buttons wire themselves: `data-copy="#out"`, `data-download="#out"` with
`data-filename`, and `data-clear="#in,#out"`.

### Adding a tool

1. Drop a file in `src/tools/`.
2. `npm test` — the new page is picked up automatically and checked in a browser.
3. Commit. The sitemap, home page, footer, search index and category listings all
   regenerate themselves.

There is no registry to update and no route to add.

---

## What runs where

Everything is client-side. Three tools lazily load a pinned library from jsDelivr
the first time they are used — js-yaml for the YAML converter, qrcode-generator
for QR codes. That request carries the library name and nothing else; once it is
cached, those tools work offline too. Every other tool uses only browser
built-ins: `JSON`, `SubtleCrypto`, `crypto.getRandomValues`, `TextEncoder`,
`FileReader`, `canvas` and `Intl`.

The privacy claim is testable, which is the point: load any tool, turn off your
network, and it keeps working.

---

## Testing

`npm test` builds the site, then:

- **`test/smoke.mjs`** loads all 38 pages in headless Chromium and fails on any
  console error, page error, broken same-origin request, missing `<h1>`,
  over-long title, missing meta description or missing canonical link.
- **`test/tools.mjs`** performs 40 real interactions — typing into the JSON
  formatter, verifying a JWT signature against a known secret, checking MD5 and
  SHA-256 against published test vectors, confirming UUID v7s come out
  time-ordered, checking the Markdown renderer escapes `<script>` — and asserts
  the exact output.

Both run in CI on every push.

---

## Licence

MIT. Use it, fork it, rebrand it, sell the ads on it.

---

## Appendix: this repository's MCP config

Unrelated to the site, and kept from before it existed: [`.mcp.json`](.mcp.json)
holds a project-scoped MCP server that Claude Code picks up automatically for
anyone working in this repo.

| Name | Transport | URL |
| --- | --- | --- |
| `robinhood-trading` | HTTP | `https://agent.robinhood.com/mcp/trading` |

On first use Claude Code asks you to approve the server before connecting, and
authentication goes through the server's own OAuth flow (`/mcp` in Claude Code).
The equivalent CLI command is:

```bash
claude mcp add robinhood-trading --transport http https://agent.robinhood.com/mcp/trading
```

Adding `-s project` writes the same `.mcp.json` entry instead of a personal,
machine-local one.
