export const meta = {
  slug: 'url-encode-decode',
  weight: 25,  /* order within its category — lower comes first */
  title: 'URL Encoder & Decoder',
  shortTitle: 'URL Encode',
  h1: 'URL Encoder and Decoder',
  category: 'Encode & Decode',
  icon: '%',
  description: 'Percent-encode or decode URLs and query strings, and break a URL into its parts. Runs in your browser, nothing is uploaded.',
  keywords: ['url encode', 'url decode', 'percent encoding', 'urlencode online', 'query string parser', 'encodeuricomponent'],
  intro: 'Encode text for safe use in a URL, decode a percent-encoded string, or paste a whole URL to see its components and query parameters laid out in a table.',
  related: ['base64-encode-decode', 'html-entities', 'jwt-decoder'],
  html: `
<div class="panel">
  <div class="btns">
    <button class="btn btn--primary" id="encode">Encode →</button>
    <button class="btn" id="decode">← Decode</button>
    <button class="btn btn--ghost" id="swap">Swap</button>
    <button class="btn btn--ghost" data-clear="#in,#out">Clear</button>
  </div>
  <div class="row row--tight" style="margin-bottom:12px">
    <label class="lbl" for="mode">Mode</label>
    <select id="mode" style="width:auto">
      <option value="component">Component — encodeURIComponent (values, one parameter)</option>
      <option value="uri">Full URI — encodeURI (keeps / ? : &amp; =)</option>
      <option value="form">Form — application/x-www-form-urlencoded (space → +)</option>
    </select>
  </div>
  <div class="io">
    <div class="field">
      <label for="in">Plain text</label>
      <textarea id="in" spellcheck="false" placeholder="hello world & friends?"></textarea>
    </div>
    <div class="field">
      <label for="out">Encoded</label>
      <textarea id="out" spellcheck="false" placeholder="hello%20world%20%26%20friends%3F"></textarea>
    </div>
  </div>
  <div class="btns">
    <button class="btn btn--sm" data-copy="#out">Copy encoded</button>
    <button class="btn btn--sm" data-copy="#in">Copy decoded</button>
  </div>
  <div id="msg" class="msg"></div>
</div>

<div class="panel">
  <h3>Inspect a URL</h3>
  <div class="field">
    <label for="urlin">Paste a full URL</label>
    <input type="text" id="urlin" spellcheck="false" placeholder="https://example.com/search?q=blue+shoes&amp;page=2#results">
  </div>
  <div id="parts" class="scroll-x"></div>
</div>`,
  faq: [
    { q: 'encodeURI or encodeURIComponent — which do I want?', a: 'Use <strong>component</strong> for a single value you are dropping into a query string; it escapes <code>&amp;</code>, <code>=</code>, <code>?</code> and <code>/</code> so they cannot break the URL structure. Use <strong>full URI</strong> only when you have an entire URL and just want stray spaces and unsafe characters fixed.' },
    { q: 'Why does form mode turn spaces into "+"?', a: 'The <code>application/x-www-form-urlencoded</code> format, used by HTML form submissions, encodes a space as <code>+</code> rather than <code>%20</code>. Both are valid in a query string; the plus form is only correct in a query string, never in a path.' },
    { q: 'It says "URI malformed" — what does that mean?', a: 'The decoder hit a <code>%</code> that is not followed by two valid hex digits, usually because the string was double-encoded or truncated. Try decoding twice, or check for a literal percent sign that should have been written <code>%25</code>.' },
    { q: 'What characters actually need encoding?', a: 'Anything outside <code>A–Z a–z 0–9 - _ . ~</code> is unreserved-safe; everything else may be reencoded by an intermediary. In practice: spaces, <code>&amp;</code>, <code>=</code>, <code>?</code>, <code>#</code>, <code>+</code>, <code>/</code> and every non-ASCII character.' }
  ]
};

export function client(root, QT) {
  var $ = function (s) { return root.querySelector(s); };
  var inEl = $('#in'), outEl = $('#out'), msg = $('#msg');

  function encode() {
    var t = inEl.value;
    if (!t) { outEl.value = ''; QT.msg(msg, ''); return; }
    try {
      var mode = $('#mode').value;
      outEl.value = mode === 'uri' ? encodeURI(t)
        : mode === 'form' ? encodeURIComponent(t).replace(/%20/g, '+')
        : encodeURIComponent(t);
      QT.msg(msg, '');
    } catch (e) { QT.msg(msg, 'Could not encode that input.', 'err'); }
  }

  function decode() {
    var t = outEl.value;
    if (!t) { inEl.value = ''; QT.msg(msg, ''); return; }
    try {
      var mode = $('#mode').value;
      inEl.value = mode === 'form' ? decodeURIComponent(t.replace(/\+/g, ' ')) : decodeURIComponent(t);
      QT.msg(msg, '');
    } catch (e) {
      QT.msg(msg, 'Malformed percent-encoding — a "%" is not followed by two hex digits. The string may be truncated or double-encoded.', 'err');
    }
  }

  $('#encode').addEventListener('click', encode);
  $('#decode').addEventListener('click', decode);
  $('#mode').addEventListener('change', encode);
  $('#swap').addEventListener('click', function () { var a = inEl.value; inEl.value = outEl.value; outEl.value = a; });
  inEl.addEventListener('input', QT.debounce(encode, 180));
  outEl.addEventListener('input', QT.debounce(function () { if (document.activeElement === outEl) decode(); }, 260));

  /* --- URL inspector --- */
  var urlin = $('#urlin'), parts = $('#parts');
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };

  function inspect() {
    var v = urlin.value.trim();
    if (!v) { parts.innerHTML = ''; return; }
    var u;
    try { u = new URL(v); }
    catch (e) {
      try { u = new URL('https://' + v); }
      catch (e2) { parts.innerHTML = '<p class="hint">Not a URL that can be parsed yet.</p>'; return; }
    }
    var rows = [
      ['Protocol', u.protocol], ['Host', u.host], ['Hostname', u.hostname],
      ['Port', u.port || '(default)'], ['Path', u.pathname],
      ['Hash', u.hash || '(none)']
    ];
    var qp = [];
    u.searchParams.forEach(function (val, key) { qp.push([key, val]); });
    parts.innerHTML =
      '<table class="data"><tbody>' +
      rows.map(function (r) { return '<tr><th style="width:120px">' + r[0] + '</th><td>' + esc(r[1]) + '</td></tr>'; }).join('') +
      '</tbody></table>' +
      (qp.length
        ? '<h3 style="margin-top:16px">Query parameters (' + qp.length + ')</h3><table class="data"><thead><tr><th>Name</th><th>Decoded value</th></tr></thead><tbody>' +
          qp.map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>'; }).join('') +
          '</tbody></table>'
        : '<p class="hint" style="margin-top:12px">No query parameters.</p>');
  }
  urlin.addEventListener('input', QT.debounce(inspect, 200));
}
