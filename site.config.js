/**
 * ---------------------------------------------------------------------------
 * THE ONLY FILE YOU NEED TO EDIT TO MAKE THIS SITE YOURS.
 * ---------------------------------------------------------------------------
 * Everything that earns money or identifies the site lives here. Change these
 * values, run `npm run build`, and the whole site updates. See MONETIZATION.md
 * for the step-by-step of where each ID comes from.
 */
export default {
  // --- Identity -------------------------------------------------------------
  name: 'Quiet Tools',
  tagline: 'Free tools that never upload your data',
  // Used for canonical URLs, sitemap.xml and social cards. NO trailing slash.
  // Set this to your real domain before you launch, or search engines will
  // index the wrong URLs and you will lose the traffic you are paying for.
  origin: 'https://quiet.tools',
  locale: 'en',
  author: 'Quiet Tools',
  themeColor: '#0f1115',

  // --- Money ----------------------------------------------------------------
  // Leave any of these empty ('') and the corresponding slot is omitted
  // entirely — no empty boxes, no layout shift, no console errors.
  ads: {
    // Google AdSense publisher ID, e.g. 'ca-pub-1234567890123456'.
    // Empty string = no ad code is emitted at all (good for the first launch:
    // ship clean, apply to AdSense once you have traffic).
    client: '',
    // Ad unit slot IDs from your AdSense dashboard.
    slots: {
      // Shown under the tool on every tool page. Highest earning position.
      belowTool: '',
      // Shown in the sidebar on wide screens.
      sidebar: '',
      // Shown mid-article on guide pages.
      inArticle: ''
    },
    // Show a subtle "supported by ads" note. Builds trust on a privacy site.
    disclosure: true
  },

  // A single sponsor/affiliate card rendered above the ad slot. Costs nothing
  // to run and usually out-earns display ads per pageview. Set `enabled: false`
  // until you have a real offer.
  sponsor: {
    enabled: false,
    label: 'Sponsored',
    title: '',
    body: '',
    cta: '',
    href: '',
    rel: 'sponsored noopener'
  },

  // Tip jar / one-off support link (Buy Me a Coffee, Ko-fi, GitHub Sponsors).
  support: {
    enabled: false,
    label: 'Buy me a coffee',
    href: ''
  },

  // --- Analytics ------------------------------------------------------------
  // Privacy-friendly, cookieless. Plausible has a free self-host option and a
  // cheap hosted tier; leave empty to ship with zero third-party scripts.
  analytics: {
    plausibleDomain: '',       // e.g. 'quiet.tools'
    plausibleSrc: 'https://plausible.io/js/script.js',
    googleAnalyticsId: ''      // e.g. 'G-XXXXXXXXXX'
  },

  // --- Verification ---------------------------------------------------------
  verification: {
    google: '',   // Google Search Console meta tag content
    bing: ''      // Bing Webmaster Tools meta tag content
  },

  // --- Social ---------------------------------------------------------------
  social: {
    twitter: '',        // '@handle' — used for Twitter card attribution
    github: '',         // full URL to the repo, shown in the footer
    contactEmail: ''    // shown on the about page; required by AdSense review
  },

  // --- Build ----------------------------------------------------------------
  // Bump this to bust caches on assets after a deploy.
  assetVersion: '1'
};
