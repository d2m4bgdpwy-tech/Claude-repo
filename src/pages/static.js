import cfg from '../../site.config.js';
import { esc } from '../layout.js';

export const aboutHtml = (toolCount) => `
<p>
  ${esc(cfg.name)} is a collection of ${toolCount} small utilities — formatters, converters,
  generators and image tools — that all share one rule: <strong>your data never leaves your
  device</strong>.
</p>

<h2>How it works</h2>
<p>
  Each tool is ordinary JavaScript that runs inside the page you have open. When you paste JSON or
  drop in an image, the work happens on your own processor. There is no upload step, no queue, no
  temporary file on somebody's disk, and no server that could be breached, subpoenaed or sold.
</p>
<p>
  You do not have to take that on faith. Open your browser's developer tools, switch to the Network
  tab, and use any tool on this site. You will see requests for the page and its stylesheet — and
  nothing carrying your content. Turn your Wi‑Fi off after the page loads and every tool still works.
</p>

<h2>Why it is free</h2>
<p>
  Because it costs almost nothing to run. The whole site is static files on a CDN. There is no
  database, no worker queue and no per-request compute bill, so there is no subscription to sell and
  no reason to put a "sign up to export" wall in front of a text box. A few unobtrusive ads and the
  occasional sponsor cover the domain and then some.
</p>

<h2>What it will never do</h2>
<ul>
  <li>Ask you to create an account to use a converter.</li>
  <li>Cap your file size to sell you a Pro plan.</li>
  <li>Send what you paste to an analytics provider, an AI model or anyone else.</li>
  <li>Show interstitials, pop-ups or auto-playing video.</li>
</ul>

<h2>Contact</h2>
<p>
  ${cfg.social.contactEmail
    ? `Bug reports and tool requests: <a href="mailto:${esc(cfg.social.contactEmail)}">${esc(cfg.social.contactEmail)}</a>.`
    : 'Bug reports and tool requests are welcome.'}
  ${cfg.social.github ? `The full source is on <a href="${esc(cfg.social.github)}" rel="noopener">GitHub</a>.` : ''}
</p>
`;

export const privacyHtml = () => {
  const hasAds = !!cfg.ads.client;
  const hasPlausible = !!cfg.analytics.plausibleDomain;
  const hasGa = !!cfg.analytics.googleAnalyticsId;
  return `
<p class="hint">Last updated ${new Date().toISOString().slice(0, 10)}</p>

<h2>The short version</h2>
<p>
  The text, files and images you put into the tools on this site are processed entirely in your
  browser and are <strong>never transmitted to us or to anyone else</strong>. We could not read them
  if we wanted to — there is no server-side component that receives them.
</p>

<h2>What we do not collect</h2>
<ul>
  <li>Anything you type, paste, drag or drop into a tool.</li>
  <li>File names or file contents.</li>
  <li>Accounts, email addresses or passwords — there is no sign-up.</li>
</ul>

<h2>What is stored on your device</h2>
<p>
  A single <code>localStorage</code> entry remembers your light/dark theme preference, and some tools
  remember their own settings the same way. This stays in your browser, is readable only by this
  site, and is cleared when you clear site data. It is not a cookie and is not sent with requests.
</p>

<h2>Server logs</h2>
<p>
  The site is served as static files by a hosting provider (currently a CDN). Like every web host,
  it keeps short-lived request logs — IP address, user agent, the URL requested — for abuse
  prevention. We do not add anything to those logs and do not use them to build a profile of you.
</p>

${hasPlausible ? `
<h2>Analytics</h2>
<p>
  We use <a href="https://plausible.io/data-policy" rel="noopener nofollow">Plausible Analytics</a>
  to count page views. It is cookieless, stores no personal data, does not follow you across sites
  and is fully GDPR/CCPA compliant. It tells us that a page was viewed, not who viewed it.
</p>` : ''}

${hasGa ? `
<h2>Analytics</h2>
<p>
  We use Google Analytics to understand which pages are useful. It sets cookies and collects
  device and approximate location information under
  <a href="https://policies.google.com/privacy" rel="noopener nofollow">Google's privacy policy</a>.
  You can opt out with Google's
  <a href="https://tools.google.com/dlpage/gaoptout" rel="noopener nofollow">browser add-on</a>.
</p>` : ''}

${hasAds ? `
<h2>Advertising</h2>
<p>
  This site displays ads served by Google AdSense. Google and its partners may use cookies or device
  identifiers to serve ads based on your prior visits to this and other websites. You can opt out of
  personalised advertising in
  <a href="https://adssettings.google.com" rel="noopener nofollow">Google Ads Settings</a>, or
  opt out of third-party vendors' use of cookies at
  <a href="https://www.aboutads.info/choices/" rel="noopener nofollow">aboutads.info/choices</a>.
  Read Google's <a href="https://policies.google.com/technologies/partner-sites" rel="noopener nofollow">policy on
  how it uses data from sites that use its services</a>.
</p>
<p>
  Ads are confined to clearly marked slots. They do not have access to what you enter into a tool —
  that data stays in the page's own JavaScript and is never written anywhere an ad script can read.
</p>` : ''}

<h2>Third-party code</h2>
<p>
  A few of the heavier tools load a well-known open-source library from a public CDN
  (jsDelivr) the first time you use them, at a pinned version. That request tells the CDN your IP
  address and which library you asked for. It does not include anything you entered.
</p>

<h2>Children</h2>
<p>This site is a general-audience utility and is not directed at children under 13.</p>

<h2>Changes</h2>
<p>
  If this policy changes, the date at the top changes with it. Because the site keeps no user
  records, there is nobody to notify.
</p>

${cfg.social.contactEmail ? `<h2>Contact</h2>
<p>Questions: <a href="mailto:${esc(cfg.social.contactEmail)}">${esc(cfg.social.contactEmail)}</a></p>` : ''}
`;
};

export const notFoundHtml = (tools) => `
<p>That URL does not match anything on this site. It may have been renamed, or the link may be typed
slightly wrong.</p>
<p>Try <a href="/tools/">the full tool list</a>, or press <kbd>/</kbd> to search.</p>
<h2>Popular tools</h2>
<ul>
  ${tools.slice(0, 8).map(t => `<li><a href="/${esc(t.slug)}/">${esc(t.title)}</a></li>`).join('')}
</ul>
`;
