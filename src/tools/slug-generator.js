export const meta = {
  slug: 'slug-generator',
  weight: 30,  /* order within its category — lower comes first */
  title: 'URL Slug Generator',
  shortTitle: 'Slug Generator',
  h1: 'URL Slug Generator',
  category: 'Text',
  icon: '/',
  description: 'Turn titles into clean, lowercase URL slugs. Transliterates accents and non-Latin scripts, strips stop words, and handles whole lists at once.',
  keywords: ['slug generator', 'url slug', 'seo friendly url', 'permalink generator', 'slugify online', 'title to url'],
  intro: 'Convert headlines into tidy URL slugs. Accented characters are transliterated rather than dropped (<code>café</code> → <code>cafe</code>), punctuation is removed, and you can optionally strip stop words to keep the URL short.',
  related: ['case-converter', 'url-encode-decode', 'word-counter'],
  html: `
<div class="panel">
  <div class="io">
    <div class="field">
      <label for="in">Titles — one per line</label>
      <textarea id="in" spellcheck="false" placeholder="10 Ways to Improve Your Café's Menu!&#10;The Best of 2026: A Review"></textarea>
    </div>
    <div class="field">
      <label for="out">Slugs</label>
      <textarea id="out" spellcheck="false" readonly></textarea>
    </div>
  </div>
  <div class="row row--tight" style="margin-bottom:12px">
    <label class="lbl" for="sep">Separator</label>
    <select id="sep" style="width:auto">
      <option value="-">hyphen (recommended)</option>
      <option value="_">underscore</option>
    </select>
    <label class="check"><input type="checkbox" id="lower" checked> Lowercase</label>
    <label class="check"><input type="checkbox" id="stop"> Remove stop words</label>
    <label class="check"><input type="checkbox" id="nums" checked> Keep numbers</label>
    <label class="lbl" for="max">Max length</label>
    <input type="number" id="max" value="0" min="0" max="200" style="width:80px" title="0 = no limit">
  </div>
  <div class="btns">
    <button class="btn btn--sm" data-copy="#out">Copy</button>
    <button class="btn btn--sm btn--ghost" data-clear="#in,#out">Clear</button>
  </div>
</div>`,
  faq: [
    { q: 'Hyphens or underscores?', a: 'Hyphens. Google has said for years that it treats a hyphen as a word separator and an underscore as a word joiner, so <code>blue_shoes</code> can be read as one token while <code>blue-shoes</code> is read as two. Every major CMS defaults to hyphens for this reason.' },
    { q: 'Should I strip stop words like "the" and "of"?', a: 'It is a mild win at best. Shorter URLs are easier to read and share, but removing small words can make a slug read strangely. Do it when a title is long; leave them when the slug is already short.' },
    { q: 'What happens to non-Latin characters?', a: 'Accented Latin characters are transliterated to their base letter. Scripts with no Latin equivalent (Chinese, Arabic, Hebrew) cannot be transliterated meaningfully here, so those characters are dropped — for those languages, most sites keep the native characters in the URL and let the browser percent-encode them.' },
    { q: 'Should I change a slug on an existing page?', a: 'Only with a 301 redirect from the old URL. Changing a slug without one throws away every link and every bit of ranking history pointing at the old address.' }
  ]
};

export function client(root, QT) {
  var $ = function (s) { return root.querySelector(s); };
  var STOP = ('a an the and or but of in on at to for with from by is are was were be been this that ' +
    'these those it its as if into over under about your you my our their his her').split(' ');

  function slugify(text) {
    var sep = $('#sep').value;
    var s = text.normalize('NFKD').replace(/[̀-ͯ]/g, '');
    /* letters that NFKD does not decompose */
    s = s.replace(/[øØ]/g, 'o').replace(/[æÆ]/g, 'ae').replace(/[đĐ]/g, 'd')
         .replace(/[ßẞ]/g, 'ss').replace(/[łŁ]/g, 'l').replace(/[þÞ]/g, 'th')
         .replace(/[œŒ]/g, 'oe').replace(/&/g, ' and ');
    /* apostrophes disappear rather than splitting a word: cafe's -> cafes */
    s = s.replace(/['\u2019\u02BC]/g, '');
    if ($('#lower').checked) s = s.toLowerCase();
    s = s.replace($('#nums').checked ? /[^a-zA-Z0-9]+/g : /[^a-zA-Z]+/g, ' ').trim();

    var words = s.split(/\s+/).filter(Boolean);
    if ($('#stop').checked && words.length > 2) {
      var kept = words.filter(function (w) { return STOP.indexOf(w.toLowerCase()) === -1; });
      if (kept.length) words = kept;
    }
    var out = words.join(sep);
    var max = Number($('#max').value) || 0;
    if (max > 0 && out.length > max) {
      out = out.slice(0, max);
      var cut = out.lastIndexOf(sep);
      if (cut > max * 0.5) out = out.slice(0, cut);
    }
    return out;
  }

  function run() {
    $('#out').value = $('#in').value.split('\n')
      .map(function (l) { return l.trim() ? slugify(l) : ''; }).join('\n');
  }

  QT.$$('input, select, textarea', root).forEach(function (el) {
    el.addEventListener('input', QT.debounce(run, 140));
    el.addEventListener('change', run);
  });
}
