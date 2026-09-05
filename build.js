#!/usr/bin/env node
/**
 * Quiet Tools static site generator.
 *
 * Zero dependencies on purpose: this site should still build in five years
 * with nothing but a Node runtime. Reads src/tools/*.js, emits dist/.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';
import cfg from './site.config.js';
import { page, esc, adSlot, sponsorCard, breadcrumbLd, url } from './src/layout.js';
import { guides } from './src/pages/guides.js';
import { CATEGORY_ORDER, CATEGORY_BLURB } from './src/categories.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist');
const V = `?v=${cfg.assetVersion}`;

/* ------------------------------------------------------------------ utils */
const write = (rel, contents) => {
  const file = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
  return file;
};
const writePage = (routePath, html) =>
  write(routePath === '/' ? 'index.html' : path.join(routePath.replace(/^\/|\/$/g, ''), 'index.html'), html);

/* ------------------------------------------------------------- load tools */
async function loadTools() {
  const dir = path.join(ROOT, 'src', 'tools');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort();
  const tools = [];
  for (const file of files) {
    const mod = await import(pathToFileURL(path.join(dir, file)).href);
    if (!mod.meta) throw new Error(`${file}: missing named export "meta"`);
    if (typeof mod.client !== 'function') throw new Error(`${file}: missing named export "client"`);
    const m = mod.meta;
    for (const key of ['slug', 'title', 'description', 'category', 'html']) {
      if (!m[key]) throw new Error(`${file}: meta.${key} is required`);
    }
    if (m.description.length > 158) {
      console.warn(`  ! ${m.slug}: meta description is ${m.description.length} chars (Google truncates ~158)`);
    }
    const titleLen = `${m.title} | ${cfg.name}`.length;
    if (titleLen > 65) {
      console.warn(`  ! ${m.slug}: page title is ${titleLen} chars — Google shows about 60, so shorten meta.title`);
    }
    if (!CATEGORY_ORDER.includes(m.category)) {
      throw new Error(`${file}: unknown category "${m.category}" — add it to src/categories.js`);
    }
    tools.push({ ...m, client: mod.client, file });
  }
  const seen = new Set();
  for (const t of tools) {
    if (seen.has(t.slug)) throw new Error(`Duplicate slug: ${t.slug}`);
    seen.add(t.slug);
  }
  for (const t of tools) {
    for (const r of t.related || []) {
      if (!seen.has(r)) throw new Error(`${t.slug}: related tool "${r}" does not exist`);
    }
  }
  return tools;
}

/* Within a category, `meta.weight` decides the order (lower first, default 50),
   then title. The highest-traffic tools should lead — that is the first thing a
   visitor sees and the first link a crawler follows. */
const groupByCategory = tools =>
  CATEGORY_ORDER
    .map(name => ({
      name,
      blurb: CATEGORY_BLURB[name],
      tools: tools
        .filter(t => t.category === name)
        .sort((a, b) => (a.weight ?? 50) - (b.weight ?? 50) ||
                        (a.shortTitle || a.title).localeCompare(b.shortTitle || b.title))
    }))
    .filter(c => c.tools.length);

/* ------------------------------------------------------------- components */
const card = t => `
<a class="card" href="/${t.slug}/">
  <span class="card__t"><span class="card__i" aria-hidden="true">${esc(t.icon || '#')}</span>${esc(t.shortTitle || t.title)}</span>
  <p class="card__d">${esc(t.description)}</p>
</a>`;

const grid = list => `<div class="grid">${list.map(card).join('')}</div>`;

const faqBlock = faq => !faq?.length ? '' : `
<section class="faq">
  <h2>Questions</h2>
  ${faq.map(f => `<details><summary>${esc(f.q)}</summary><p>${f.a}</p></details>`).join('')}
</section>`;

const relatedBlock = (tool, byslug) => {
  const rel = (tool.related || []).map(s => byslug[s]).filter(Boolean);
  if (!rel.length) return '';
  return `
<section class="related">
  <h2>Related tools</h2>
  <div class="chips">${rel.map(t => `<a class="chip" href="/${t.slug}/">${esc(t.shortTitle || t.title)}</a>`).join('')}</div>
</section>`;
};

/* ------------------------------------------------------------- tool pages */
function toolPage(tool, { categories, byslug, siblingsFor }) {
  const siblings = siblingsFor(tool);
  /* Keyword-first, brand last: Google shows roughly the first 60 characters,
     so the part that gets truncated must be the part you can afford to lose. */
  const title = `${tool.title} | ${cfg.name}`;
  const pathname = `/${tool.slug}/`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: tool.title,
      url: url(pathname),
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any (runs in a web browser)',
      browserRequirements: 'Requires JavaScript',
      description: tool.description,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      isAccessibleForFree: true,
      publisher: { '@type': 'Organization', name: cfg.name, url: cfg.origin }
    },
    breadcrumbLd([
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools/' },
      { name: tool.shortTitle || tool.title, path: pathname }
    ])
  ];
  if (tool.faq?.length) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: tool.faq.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') }
      }))
    });
  }

  const body = `
<div class="wrap tool-layout">
  <div>
    <nav class="crumbs" aria-label="Breadcrumb">
      <a href="/">Home</a> / <a href="/tools/">Tools</a> / ${esc(tool.shortTitle || tool.title)}
    </nav>
    <div class="tool-head">
      <h1>${esc(tool.h1 || tool.title)}</h1>
      <p class="lede">${tool.intro || esc(tool.description)}</p>
    </div>

    <div id="tool" class="tool">
${tool.html}
    </div>

    ${adSlot('belowTool', { label: 'Advertisement' })}
    ${tool.about ? `<section class="prose" style="padding:6px 0 0">${tool.about}</section>` : ''}
    ${faqBlock(tool.faq)}
    ${relatedBlock(tool, byslug)}
  </div>

  <aside class="tool-side">
    ${sponsorCard()}
    <div class="panel">
      <h3>Runs on your device</h3>
      <p class="hint" style="margin-bottom:0">This page does the work in your browser with
      JavaScript. Nothing you paste or open is sent anywhere — there is no server to send it to.
      Load the page once and it keeps working offline.</p>
    </div>
    ${adSlot('sidebar', { label: 'Advertisement' })}
    ${siblings.length ? `
    <div class="panel">
      <h3>More in ${esc(tool.category)}</h3>
      <ul style="list-style:none;padding:0;margin:0;display:grid;gap:8px">
        ${siblings.map(t => `<li><a href="/${esc(t.slug)}/" style="font-size:.9rem">${esc(t.shortTitle || t.title)}</a></li>`).join('')}
      </ul>
    </div>` : ''}
  </aside>
</div>`;

  return page({
    title,
    description: tool.description,
    path: pathname,
    body,
    jsonLd,
    categories,
    scripts: [`/t/${tool.slug}.js`]
  });
}

/* --------------------------------------------------------------- home page */
function homePage(tools, categories) {
  const body = `
<div class="wrap">
  <section class="hero">
    <h1>Fast, free tools that never upload your data</h1>
    <p class="hero__sub">
      ${tools.length} developer and everyday utilities that run entirely inside your browser.
      No accounts, no file uploads, no tracking of what you paste. Open a tool, use it, close the tab.
    </p>
    <div class="badges">
      <span class="badge"><strong>${tools.length}</strong> tools</span>
      <span class="badge">100% client-side</span>
      <span class="badge">Works offline</span>
      <span class="badge">No sign-up</span>
      <span class="badge">Free forever</span>
    </div>
  </section>

  ${categories.map(c => `
  <section class="cat">
    <h2>${esc(c.name)}</h2>
    ${grid(c.tools)}
  </section>`).join('')}

  ${adSlot('belowTool', { label: 'Advertisement' })}

  <section class="prose">
    <h2>Why another tools site?</h2>
    <p>
      Most online converters and formatters work by uploading whatever you give them to somebody
      else's server. That is fine for a lorem ipsum generator and genuinely risky for an API key, a
      customer export, a signed token or an internal config file.
    </p>
    <p>
      Every tool here is plain JavaScript that runs in the tab you have open. Your input never leaves
      the machine you are sitting at. You can verify that: open your browser's network panel, use any
      tool, and watch that no request goes out. You can also
      ${cfg.social.github ? `<a href="${esc(cfg.social.github)}" rel="noopener">read the source</a>` : 'read the source'},
      turn off your Wi‑Fi and keep working, or save the page for later.
    </p>
    <h2>How it stays free</h2>
    <p>
      There is no server bill to pay, so there is no subscription to sell you. The site is supported
      by a small number of ads and the occasional sponsor. No paywalls, no "sign in to export", no
      limits on file size beyond what your own machine can handle.
    </p>
  </section>
</div>`;

  return page({
    title: `${cfg.name} — ${tools.length} Free Online Tools That Run In Your Browser`,
    description: `${tools.length} free developer and everyday tools — JSON, Base64, hashes, images, text and more. Everything runs in your browser, so your data is never uploaded.`,
    path: '/',
    body,
    categories,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: cfg.name,
        url: cfg.origin,
        description: cfg.tagline,
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${cfg.origin}/tools/?q={search_term_string}` },
          'query-input': 'required name=search_term_string'
        }
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: cfg.name,
        url: cfg.origin,
        logo: url('/icon-512.png')
      }
    ]
  });
}

/* --------------------------------------------------------- all-tools page */
function allToolsPage(tools, categories) {
  const body = `
<div class="wrap">
  <section class="hero" style="padding-bottom:10px">
    <h1>All ${tools.length} tools</h1>
    <p class="hero__sub">Everything on the site, grouped by what it does. Press <kbd>/</kbd> anywhere to search.</p>
  </section>
  ${categories.map(c => `
  <section class="cat">
    <h2>${esc(c.name)}</h2>
    <p class="hint" style="margin:-4px 0 12px">${esc(c.blurb || '')}</p>
    ${grid(c.tools)}
  </section>`).join('')}
  ${adSlot('belowTool', { label: 'Advertisement' })}
</div>`;
  return page({
    title: `All Free Online Tools (${tools.length}) | ${cfg.name}`,
    description: `The complete list of ${tools.length} free browser-based tools: converters, formatters, generators, encoders and image utilities. Nothing is uploaded.`,
    path: '/tools/',
    body,
    categories,
    jsonLd: [
      breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Tools', path: '/tools/' }]),
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `All ${cfg.name} tools`,
        numberOfItems: tools.length,
        itemListElement: tools.map((t, i) => ({
          '@type': 'ListItem', position: i + 1, name: t.title, url: url(`/${t.slug}/`)
        }))
      }
    ]
  });
}

/* ------------------------------------------------------------ guide pages */
function guideIndexPage(categories) {
  const body = `
<div class="wrap">
  <section class="hero" style="padding-bottom:10px">
    <h1>Guides</h1>
    <p class="hero__sub">Short, practical write-ups on the formats and problems these tools deal with.</p>
  </section>
  <div class="grid">
    ${guides.map(g => `
    <a class="card" href="/guides/${g.slug}/">
      <span class="card__t">${esc(g.title)}</span>
      <p class="card__d">${esc(g.description)}</p>
    </a>`).join('')}
  </div>
</div>`;
  return page({
    title: `Guides | ${cfg.name}`,
    description: 'Practical guides to JSON, Base64, hashing, regular expressions, image formats and the other things our tools touch.',
    path: '/guides/',
    body,
    categories,
    jsonLd: [breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Guides', path: '/guides/' }])]
  });
}

function guidePage(g, categories, byslug) {
  const pathname = `/guides/${g.slug}/`;
  const half = g.body.split('<h2').length > 3 ? 2 : 1;
  const parts = g.body.split('<h2');
  const withAd = parts.length > half + 1
    ? parts.slice(0, half + 1).join('<h2') + adSlot('inArticle', { label: 'Advertisement' }) + '<h2' + parts.slice(half + 1).join('<h2')
    : g.body + adSlot('inArticle', { label: 'Advertisement' });

  const rel = (g.tools || []).map(s => byslug[s]).filter(Boolean);
  const body = `
<div class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb" style="padding-top:20px">
    <a href="/">Home</a> / <a href="/guides/">Guides</a> / ${esc(g.title)}
  </nav>
  <article class="prose">
    <h1>${esc(g.title)}</h1>
    <p class="hint">Updated ${esc(g.updated)}</p>
    ${withAd}
  </article>
  ${rel.length ? `
  <section class="related" style="max-width:72ch;padding-bottom:40px">
    <h2>Tools mentioned here</h2>
    <div class="chips">${rel.map(t => `<a class="chip" href="/${t.slug}/">${esc(t.shortTitle || t.title)}</a>`).join('')}</div>
  </section>` : ''}
</div>`;
  return page({
    title: `${g.title} | ${cfg.name}`,
    description: g.description,
    path: pathname,
    body,
    categories,
    jsonLd: [
      breadcrumbLd([
        { name: 'Home', path: '/' }, { name: 'Guides', path: '/guides/' }, { name: g.title, path: pathname }
      ]),
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: g.title,
        description: g.description,
        datePublished: g.published,
        dateModified: g.updated,
        author: { '@type': 'Organization', name: cfg.name },
        publisher: { '@type': 'Organization', name: cfg.name, logo: { '@type': 'ImageObject', url: url('/icon-512.png') } },
        mainEntityOfPage: url(pathname)
      }
    ]
  });
}

/* ------------------------------------------------------------ static pages */
function simplePage({ title, description, path: p, html, categories, noindex }) {
  return page({
    title: `${title} | ${cfg.name}`,
    description,
    path: p,
    noindex,
    categories,
    body: `<div class="wrap"><article class="prose"><h1>${esc(title)}</h1>${html}</article></div>`
  });
}

/* ------------------------------------------------------------------ images */
/* Minimal PNG writer (no dependencies): RGBA -> PNG via zlib. */
function png(width, height, rgba) {
  const crcTable = (() => {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    return t;
  })();
  const crc = buf => {
    let c = -1;
    for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

/* The app icon: a rounded square with the brand gradient. */
function iconPng(size) {
  const buf = Buffer.alloc(size * size * 4);
  const a = hex('#6ee7b7'), b = hex('#3b82f6');
  const r = size * 0.22;
  const inside = (x, y) => {
    const cx = Math.min(Math.max(x, r), size - r), cy = Math.min(Math.max(y, r), size - r);
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const t = (x / size) * 0.55 + (y / size) * 0.45;
      const on = inside(x + 0.5, y + 0.5);
      buf[i] = a[0] + (b[0] - a[0]) * t;
      buf[i + 1] = a[1] + (b[1] - a[1]) * t;
      buf[i + 2] = a[2] + (b[2] - a[2]) * t;
      buf[i + 3] = on ? 255 : 0;
    }
  }
  return png(size, size, buf);
}

/* Open Graph card: brand mark on the dark background, no text rasterizing
   needed — social platforms show the title next to it. Replace og.png with a
   designed image any time; nothing else needs to change. */
function ogPng() {
  const W = 1200, H = 630;
  const buf = Buffer.alloc(W * H * 4);
  const bg = hex('#0f1115'), line = hex('#272c37');
  const a = hex('#6ee7b7'), b = hex('#3b82f6');
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      let [r, g, bl] = bg;
      /* faint grid, so the card does not read as a broken image */
      if (x % 60 === 0 || y % 60 === 0) { r = line[0]; g = line[1]; bl = line[2]; }
      /* glow toward the mark */
      const d = Math.hypot(x - 250, y - H / 2) / 520;
      const k = Math.max(0, 1 - d) * 0.10;
      buf[i] = r + (a[0] - r) * k;
      buf[i + 1] = g + (a[1] - g) * k;
      buf[i + 2] = bl + (a[2] - bl) * k;
      buf[i + 3] = 255;
    }
  }
  /* the rounded-square mark */
  const S = 220, X0 = 140, Y0 = (H - S) / 2, rad = S * 0.22;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const cx = Math.min(Math.max(x, rad), S - rad), cy = Math.min(Math.max(y, rad), S - rad);
      if ((x - cx) ** 2 + (y - cy) ** 2 > rad * rad) continue;
      const i = ((Y0 + y) * W + (X0 + x)) * 4;
      const t = (x / S) * 0.55 + (y / S) * 0.45;
      buf[i] = a[0] + (b[0] - a[0]) * t;
      buf[i + 1] = a[1] + (b[1] - a[1]) * t;
      buf[i + 2] = a[2] + (b[2] - a[2]) * t;
      buf[i + 3] = 255;
    }
  }
  return png(W, H, buf);
}

/* ------------------------------------------------------------------- build */
async function build() {
  const t0 = Date.now();
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  const tools = await loadTools();
  const byslug = Object.fromEntries(tools.map(t => [t.slug, t]));
  const categories = groupByCategory(tools);
  const siblingsFor = tool => {
    const cat = categories.find(c => c.name === tool.category);
    return cat ? cat.tools.filter(t => t.slug !== tool.slug).slice(0, 8) : [];
  };
  /* the footer only gets the first few per category, or it becomes a wall */
  const footerCats = categories.map(c => ({ ...c, tools: c.tools.slice(0, 7) }));

  /* assets */
  write('assets/style.css', fs.readFileSync(path.join(ROOT, 'src', 'style.css')));
  write('assets/app.js', fs.readFileSync(path.join(ROOT, 'src', 'app.js')));
  write('assets/tools.json', JSON.stringify(tools.map(t => ({
    slug: t.slug, title: t.shortTitle || t.title, description: t.description, keywords: t.keywords || []
  }))));

  /* tool pages + their client scripts */
  for (const tool of tools) {
    writePage(`/${tool.slug}/`, toolPage(tool, { categories: footerCats, byslug, siblingsFor }));
    write(`t/${tool.slug}.js`, `/* ${tool.slug} — runs entirely in your browser */\nQT.tool(${tool.client.toString()});\n`);
  }

  /* index + listing + guides */
  writePage('/', homePage(tools, footerCats));
  writePage('/tools/', allToolsPage(tools, footerCats));
  writePage('/guides/', guideIndexPage(footerCats));
  for (const g of guides) writePage(`/guides/${g.slug}/`, guidePage(g, footerCats, byslug));

  /* static pages */
  const { aboutHtml, privacyHtml, notFoundHtml } = await import('./src/pages/static.js');
  writePage('/about/', simplePage({
    title: 'About', path: '/about/', categories: footerCats,
    description: `What ${cfg.name} is, who makes it, and how a site with no server stays free.`,
    html: aboutHtml(tools.length)
  }));
  writePage('/privacy/', simplePage({
    title: 'Privacy', path: '/privacy/', categories: footerCats,
    description: `${cfg.name} processes everything in your browser. Here is exactly what is and is not collected.`,
    html: privacyHtml()
  }));
  write('404.html', simplePage({
    title: 'Page not found', path: '/404.html', categories: footerCats, noindex: true,
    description: 'That page does not exist.', html: notFoundHtml(tools)
  }));

  /* robots / sitemap / manifest / icons */
  const routes = [
    { loc: '/', pri: '1.0', freq: 'weekly' },
    { loc: '/tools/', pri: '0.9', freq: 'weekly' },
    { loc: '/guides/', pri: '0.6', freq: 'monthly' },
    { loc: '/about/', pri: '0.3', freq: 'yearly' },
    { loc: '/privacy/', pri: '0.3', freq: 'yearly' },
    ...tools.map(t => ({ loc: `/${t.slug}/`, pri: '0.8', freq: 'monthly' })),
    ...guides.map(g => ({ loc: `/guides/${g.slug}/`, pri: '0.6', freq: 'monthly' }))
  ];
  const today = new Date().toISOString().slice(0, 10);
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(r => `  <url><loc>${url(r.loc)}</loc><lastmod>${today}</lastmod><changefreq>${r.freq}</changefreq><priority>${r.pri}</priority></url>`).join('\n')}
</urlset>
`);
  write('robots.txt', `User-agent: *
Allow: /

Sitemap: ${url('/sitemap.xml')}
`);
  write('site.webmanifest', JSON.stringify({
    name: cfg.name, short_name: cfg.name, description: cfg.tagline,
    start_url: '/', display: 'standalone',
    background_color: cfg.themeColor, theme_color: cfg.themeColor,
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }
    ]
  }, null, 2));
  write('favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#6ee7b7"/><stop offset="1" stop-color="#3b82f6"/>
  </linearGradient></defs>
  <rect width="64" height="64" rx="14" fill="url(#g)"/>
</svg>
`);
  write('icon-192.png', iconPng(192));
  write('icon-512.png', iconPng(512));
  write('icon-180.png', iconPng(180));
  write('og.png', ogPng());
  /* GitHub Pages: do not run the output through Jekyll */
  write('.nojekyll', '');
  if (cfg.ads.client) {
    write('ads.txt', `google.com, ${cfg.ads.client.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`);
  }
  /* anything dropped in public/ is copied verbatim and wins over generated files */
  const pub = path.join(ROOT, 'public');
  if (fs.existsSync(pub)) fs.cpSync(pub, DIST, { recursive: true });

  const pages = routes.length;
  console.log(`\n  ${cfg.name} built in ${Date.now() - t0}ms`);
  console.log(`  ${tools.length} tools · ${guides.length} guides · ${pages} pages · ${categories.length} categories`);
  console.log(`  output: dist/\n`);
  if (!cfg.ads.client) console.log('  note: ads.client is empty in site.config.js — no ad code was emitted.');
  if (cfg.origin.includes('quiet.tools')) console.log('  note: site.config.js still uses the default origin. Set it to your domain before launch.\n');
}

build().catch(err => { console.error('\nBuild failed:', err.message, '\n'); process.exit(1); });
