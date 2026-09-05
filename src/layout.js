import cfg from '../site.config.js';

export const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
           .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const url = (path = '/') => cfg.origin.replace(/\/$/, '') + path;
const v = `?v=${cfg.assetVersion}`;

/* --- monetization partials ------------------------------------------------ */

export function adSlot(which, { label = '' } = {}) {
  const slot = cfg.ads.slots[which];
  if (!cfg.ads.client || !slot) return '';
  return `
<aside class="ad ad--${which}" aria-label="Advertisement">
  ${cfg.ads.disclosure ? `<span class="ad__label">${esc(label || 'Advertisement')}</span>` : ''}
  <ins class="adsbygoogle" style="display:block" data-ad-client="${esc(cfg.ads.client)}"
       data-ad-slot="${esc(slot)}" data-ad-format="auto" data-full-width-responsive="true"></ins>
  <script>(adsbygoogle=window.adsbygoogle||[]).push({});</script>
</aside>`;
}

export function sponsorCard() {
  const s = cfg.sponsor;
  if (!s.enabled || !s.href) return '';
  return `
<aside class="sponsor">
  <span class="sponsor__label">${esc(s.label)}</span>
  <a class="sponsor__link" href="${esc(s.href)}" rel="${esc(s.rel)}" target="_blank">
    <strong>${esc(s.title)}</strong>
    <span>${esc(s.body)}</span>
    <span class="sponsor__cta">${esc(s.cta)} &rarr;</span>
  </a>
</aside>`;
}

/* --- head ----------------------------------------------------------------- */

function head({ title, description, path, jsonLd = [], noindex = false }) {
  const canonical = url(path);
  const ogImage = url('/og.png');
  const a = cfg.analytics;
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
${noindex ? '<meta name="robots" content="noindex,follow">' : '<meta name="robots" content="index,follow,max-image-preview:large">'}
<meta name="theme-color" content="${esc(cfg.themeColor)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(cfg.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(ogImage)}">
<meta name="twitter:card" content="summary_large_image">
${cfg.social.twitter ? `<meta name="twitter:site" content="${esc(cfg.social.twitter)}">` : ''}
${cfg.verification.google ? `<meta name="google-site-verification" content="${esc(cfg.verification.google)}">` : ''}
${cfg.verification.bing ? `<meta name="msvalidate.01" content="${esc(cfg.verification.bing)}">` : ''}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/icon-180.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="stylesheet" href="/assets/style.css${v}">
${jsonLd.map(o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n')}
${a.plausibleDomain ? `<script defer data-domain="${esc(a.plausibleDomain)}" src="${esc(a.plausibleSrc)}"></script>` : ''}
${a.googleAnalyticsId ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(a.googleAnalyticsId)}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${esc(a.googleAnalyticsId)}')</script>` : ''}
${cfg.ads.client ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(cfg.ads.client)}" crossorigin="anonymous"></script>` : ''}`;
}

/* --- chrome --------------------------------------------------------------- */

function header() {
  return `
<a class="skip" href="#main">Skip to content</a>
<header class="site-head">
  <div class="wrap site-head__inner">
    <a class="brand" href="/">
      <span class="brand__mark" aria-hidden="true"></span>
      <span class="brand__name">${esc(cfg.name)}</span>
    </a>
    <div class="site-head__search">
      <input id="q" type="search" placeholder="Search tools…  (press /)" autocomplete="off"
             aria-label="Search tools" spellcheck="false">
      <div id="q-results" class="q-results" hidden></div>
    </div>
    <nav class="site-nav" aria-label="Main">
      <a href="/tools/">All tools</a>
      <a href="/guides/">Guides</a>
      <button id="theme-toggle" class="icon-btn" type="button" aria-label="Toggle light or dark theme" title="Toggle theme">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9Z"/>
        </svg>
      </button>
    </nav>
  </div>
</header>`;
}

function footer(categories = []) {
  const year = new Date().getFullYear();
  return `
<footer class="site-foot">
  <div class="wrap">
    <div class="site-foot__cols">
      ${categories.map(c => `
      <div>
        <h2>${esc(c.name)}</h2>
        <ul>${c.tools.map(t => `<li><a href="/${esc(t.slug)}/">${esc(t.shortTitle || t.title)}</a></li>`).join('')}</ul>
      </div>`).join('')}
      <div>
        <h2>Site</h2>
        <ul>
          <li><a href="/tools/">All tools</a></li>
          <li><a href="/guides/">Guides</a></li>
          <li><a href="/about/">About</a></li>
          <li><a href="/privacy/">Privacy</a></li>
          ${cfg.social.github ? `<li><a href="${esc(cfg.social.github)}" rel="noopener">Source code</a></li>` : ''}
          ${cfg.support.enabled && cfg.support.href ? `<li><a href="${esc(cfg.support.href)}" rel="noopener">${esc(cfg.support.label)}</a></li>` : ''}
        </ul>
      </div>
    </div>
    <p class="site-foot__note">
      &copy; ${year} ${esc(cfg.name)}. Every tool runs entirely in your browser —
      your files and text are never uploaded to a server.
    </p>
  </div>
</footer>`;
}

/* --- page ----------------------------------------------------------------- */

export function page({
  title, description, path, body, jsonLd = [], categories = [],
  bodyClass = '', scripts = [], noindex = false
}) {
  return `<!doctype html>
<html lang="${esc(cfg.locale)}">
<head>
${head({ title, description, path, jsonLd, noindex })}
</head>
<body class="${esc(bodyClass)}">
${header()}
<main id="main">
${body}
</main>
${footer(categories)}
<script src="/assets/app.js${v}"></script>
${scripts.map(s => `<script src="${esc(s)}${v}"></script>`).join('\n')}
</body>
</html>`;
}

export function breadcrumbLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem', position: i + 1, name: it.name, item: url(it.path)
    }))
  };
}

export { cfg, url };
