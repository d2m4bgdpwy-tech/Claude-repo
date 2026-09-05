export const meta = {
  slug: 'html-entities',
  weight: 30,  /* order within its category — lower comes first */
  title: 'HTML Entity Encoder & Decoder',
  shortTitle: 'HTML Entities',
  h1: 'HTML Entity Encoder and Decoder',
  category: 'Encode & Decode',
  icon: '&',
  description: 'Escape HTML special characters, or decode named, decimal and hex entities back to plain text. Private, in-browser, no upload.',
  keywords: ['html entity encoder', 'html decode', 'escape html', 'html special characters', 'unescape html', 'html entities list'],
  intro: 'Escape text so it can be dropped safely into HTML, or decode entities you have pulled out of a scraped page or an email. Both directions handle named entities, decimal and hex numeric references.',
  related: ['url-encode-decode', 'base64-encode-decode', 'markdown-preview'],
  html: `
<div class="panel">
  <div class="btns">
    <button class="btn btn--primary" id="encode">Escape →</button>
    <button class="btn" id="decode">← Unescape</button>
    <button class="btn btn--ghost" id="swap">Swap</button>
    <button class="btn btn--ghost" data-clear="#in,#out">Clear</button>
  </div>
  <div class="row row--tight" style="margin-bottom:12px">
    <label class="check"><input type="checkbox" id="all"> Escape every non-ASCII character too</label>
    <label class="check"><input type="checkbox" id="quotes" checked> Escape quotes (safe for attributes)</label>
  </div>
  <div class="io">
    <div class="field">
      <label for="in">Text / HTML</label>
      <textarea id="in" spellcheck="false" placeholder='<a href="x">Tom &amp; Jerry</a>'></textarea>
    </div>
    <div class="field">
      <label for="out">Entities</label>
      <textarea id="out" spellcheck="false" placeholder="&amp;lt;a href=&amp;quot;x&amp;quot;&amp;gt;Tom &amp;amp; Jerry&amp;lt;/a&amp;gt;"></textarea>
    </div>
  </div>
  <div class="btns">
    <button class="btn btn--sm" data-copy="#out">Copy escaped</button>
    <button class="btn btn--sm" data-copy="#in">Copy plain</button>
  </div>
  <div id="msg" class="msg"></div>
</div>

<div class="panel">
  <h3>Common entities</h3>
  <div class="scroll-x"><table class="data" id="ref"></table></div>
</div>`,
  faq: [
    { q: 'Which characters must be escaped in HTML?', a: 'Four, always: <code>&amp;</code>, <code>&lt;</code>, <code>&gt;</code>. Inside an attribute value you must also escape whichever quote character delimits it. Everything else is optional and only affects how the source reads.' },
    { q: 'Is escaping HTML enough to prevent XSS?', a: 'Only in the right context. Escaping these characters makes text safe inside an element body or a quoted attribute. It does <em>not</em> make it safe inside a <code>&lt;script&gt;</code> block, a <code>style</code> attribute, or a URL attribute like <code>href</code>, where <code>javascript:</code> still executes. Context-aware escaping in your template engine is the real fix.' },
    { q: 'What is the difference between &amp;#8212; and &amp;mdash;?', a: 'Nothing to a browser — both produce an em dash. The numeric form works everywhere; the named form is easier to read. This decoder understands both, plus the hex form <code>&amp;#x2014;</code>.' },
    { q: 'Why would I escape non-ASCII characters?', a: 'Almost never, these days — UTF-8 is universal. It is occasionally useful for legacy email templates or systems that mangle encodings in transit.' }
  ]
};

export function client(root, QT) {
  var $ = function (s) { return root.querySelector(s); };
  var inEl = $('#in'), outEl = $('#out'), msg = $('#msg');

  function encode() {
    var t = inEl.value;
    if (!t) { outEl.value = ''; return; }
    var s = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if ($('#quotes').checked) s = s.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    if ($('#all').checked) {
      s = s.replace(/[ -\u{10FFFF}]/gu, function (c) {
        return '&#' + c.codePointAt(0) + ';';
      });
    }
    outEl.value = s;
    QT.msg(msg, '');
  }

  function decode() {
    var t = outEl.value;
    if (!t) { inEl.value = ''; return; }
    /* A detached textarea decodes named entities without ever running markup. */
    var ta = document.createElement('textarea');
    ta.innerHTML = t.replace(/<\/?[a-z][^>]*>/gi, function (m) {
      return m.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    });
    inEl.value = ta.value;
    QT.msg(msg, '');
  }

  $('#encode').addEventListener('click', encode);
  $('#decode').addEventListener('click', decode);
  $('#swap').addEventListener('click', function () { var a = inEl.value; inEl.value = outEl.value; outEl.value = a; });
  ['#all', '#quotes'].forEach(function (s) { $(s).addEventListener('change', encode); });
  inEl.addEventListener('input', QT.debounce(encode, 180));
  outEl.addEventListener('input', QT.debounce(function () { if (document.activeElement === outEl) decode(); }, 260));

  var common = [
    ['&', '&amp;', 'ampersand'], ['<', '&lt;', 'less than'], ['>', '&gt;', 'greater than'],
    ['"', '&quot;', 'double quote'], ["'", '&#39;', 'apostrophe'], [' ', '&nbsp;', 'non-breaking space'],
    ['©', '&copy;', 'copyright'], ['®', '&reg;', 'registered'], ['™', '&trade;', 'trademark'],
    ['—', '&mdash;', 'em dash'], ['–', '&ndash;', 'en dash'], ['…', '&hellip;', 'ellipsis'],
    ['“', '&ldquo;', 'left double quote'], ['”', '&rdquo;', 'right double quote'],
    ['€', '&euro;', 'euro'], ['£', '&pound;', 'pound'], ['°', '&deg;', 'degree'],
    ['×', '&times;', 'multiplication'], ['÷', '&divide;', 'division'], ['→', '&rarr;', 'right arrow']
  ];
  $('#ref').innerHTML = '<thead><tr><th>Character</th><th>Entity</th><th>Name</th></tr></thead><tbody>' +
    common.map(function (r) {
      return '<tr><td>' + r[0].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') +
        '</td><td>' + r[1].replace(/&/g, '&amp;') + '</td><td>' + r[2] + '</td></tr>';
    }).join('') + '</tbody>';
}
