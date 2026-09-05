export const meta = {
  slug: 'word-counter',
  weight: 10,  /* order within its category — lower comes first */
  title: 'Word & Character Counter',
  shortTitle: 'Word Counter',
  h1: 'Word and Character Counter',
  category: 'Text',
  icon: 'W',
  description: 'Count words, characters, sentences and paragraphs as you type, with reading time and keyword density. Your text stays in your browser.',
  keywords: ['word counter', 'character counter', 'word count tool', 'letter count', 'reading time calculator', 'keyword density', 'twitter character count'],
  intro: 'Live counts for words, characters, sentences, paragraphs and reading time, plus limits for the places that enforce them. Everything is computed as you type, on your machine — which matters if the text is an unpublished manuscript or a client\'s brief.',
  related: ['case-converter', 'remove-duplicate-lines', 'text-diff', 'lorem-ipsum-generator'],
  html: `
<div class="panel">
  <div class="stat-grid" style="margin-bottom:14px">
    <div class="stat"><b id="s-words">0</b><span>Words</span></div>
    <div class="stat"><b id="s-chars">0</b><span>Characters</span></div>
    <div class="stat"><b id="s-nospace">0</b><span>No spaces</span></div>
    <div class="stat"><b id="s-sent">0</b><span>Sentences</span></div>
    <div class="stat"><b id="s-para">0</b><span>Paragraphs</span></div>
    <div class="stat"><b id="s-read">0s</b><span>Reading time</span></div>
  </div>
  <div class="field">
    <label for="text">Your text</label>
    <textarea id="text" style="min-height:280px;font-family:var(--sans);font-size:.98rem"
      placeholder="Start typing or paste your text — counts update live and nothing is sent anywhere."></textarea>
  </div>
  <div class="btns">
    <button class="btn btn--sm" data-copy="#text">Copy</button>
    <button class="btn btn--sm btn--ghost" data-clear="#text">Clear</button>
    <label class="check" style="margin-left:auto"><input type="checkbox" id="remember"> Remember this text on this device</label>
  </div>
</div>

<div class="io">
  <div class="panel">
    <h3>Limits</h3>
    <div id="limits"></div>
  </div>
  <div class="panel">
    <h3>Most used words</h3>
    <div class="scroll-x"><table class="data" id="density"></table></div>
    <label class="check" style="margin-top:10px"><input type="checkbox" id="stop" checked> Ignore common words (the, and, of…)</label>
  </div>
</div>`,
  faq: [
    { q: 'How is a word counted?', a: 'Any run of characters separated by whitespace. Hyphenated words count as one; "it\'s" counts as one. This matches how Word and Google Docs count, so the number should line up with whatever your editor or client expects.' },
    { q: 'How is reading time calculated?', a: 'At 238 words per minute, the mean silent-reading speed for adults reading non-fiction found in a 2019 meta-analysis. Speaking aloud is much slower — around 130–150 wpm — so allow roughly double for a script.' },
    { q: 'Does it work for Chinese, Japanese or Korean?', a: 'Word counting does not, because those scripts do not separate words with spaces — use the character count instead, which is the standard measure for CJK text anyway.' },
    { q: 'Is my text saved anywhere?', a: 'Only if you tick "remember", which stores it in your own browser\'s localStorage on this device. Nothing is ever transmitted; there is no server to receive it.' }
  ]
};

export function client(root, QT) {
  var $ = function (s) { return root.querySelector(s); };
  var ta = $('#text');

  var LIMITS = [
    ['Twitter/X post', 280, 'chars'],
    ['SMS (single message)', 160, 'chars'],
    ['Meta description', 158, 'chars'],
    ['Page title', 60, 'chars'],
    ['LinkedIn post', 3000, 'chars'],
    ['Instagram caption', 2200, 'chars'],
    ['YouTube description', 5000, 'chars']
  ];

  var STOP = ('a an and are as at be but by for from has have he her his i in is it its of on or ' +
    'that the their them they this to was were will with you your we our not can if all would there ' +
    'what so no when up out about into more which who been had do does did than then some what').split(' ');

  function count() {
    var t = ta.value;
    var words = t.trim() ? t.trim().split(/\s+/).length : 0;
    var chars = Array.from(t).length;
    var nospace = Array.from(t.replace(/\s/g, '')).length;
    var sentences = (t.match(/[^.!?…]+[.!?…]+(\s|$)/g) || []).length || (t.trim() ? 1 : 0);
    var paragraphs = t.trim() ? t.trim().split(/\n{2,}/).length : 0;
    var secs = Math.round((words / 238) * 60);

    $('#s-words').textContent = words.toLocaleString();
    $('#s-chars').textContent = chars.toLocaleString();
    $('#s-nospace').textContent = nospace.toLocaleString();
    $('#s-sent').textContent = sentences.toLocaleString();
    $('#s-para').textContent = paragraphs.toLocaleString();
    $('#s-read').textContent = secs < 60 ? secs + 's'
      : Math.floor(secs / 60) + 'm ' + (secs % 60) + 's';

    $('#limits').innerHTML = LIMITS.map(function (l) {
      var used = chars, max = l[1];
      var pct = Math.min(100, (used / max) * 100);
      var over = used > max;
      return '<div style="margin-bottom:10px">' +
        '<div style="display:flex;justify-content:space-between;font-size:.85rem;margin-bottom:4px">' +
        '<span>' + l[0] + '</span><span style="color:' + (over ? 'var(--err)' : 'var(--fg-faint)') + '">' +
        used.toLocaleString() + ' / ' + max.toLocaleString() + (over ? ' (' + (used - max) + ' over)' : '') + '</span></div>' +
        '<div style="height:5px;background:var(--bg);border-radius:3px;overflow:hidden">' +
        '<div style="height:100%;width:' + pct + '%;background:' + (over ? 'var(--err)' : 'var(--accent)') + '"></div>' +
        '</div></div>';
    }).join('');

    var freq = {};
    (t.toLowerCase().match(/[a-z0-9']{2,}/g) || []).forEach(function (w) {
      if ($('#stop').checked && STOP.indexOf(w) > -1) return;
      freq[w] = (freq[w] || 0) + 1;
    });
    var top = Object.keys(freq).sort(function (a, b) { return freq[b] - freq[a]; }).slice(0, 10);
    $('#density').innerHTML = top.length
      ? '<thead><tr><th>Word</th><th>Count</th><th>Density</th></tr></thead><tbody>' +
        top.map(function (w) {
          return '<tr><td>' + w + '</td><td>' + freq[w] + '</td><td>' +
            ((freq[w] / Math.max(1, words)) * 100).toFixed(1) + '%</td></tr>';
        }).join('') + '</tbody>'
      : '<tbody><tr><td class="hint">Nothing yet.</td></tr></tbody>';

    if ($('#remember').checked) QT.store.set('wc:text', t);
  }

  ta.addEventListener('input', QT.debounce(count, 120));
  $('#stop').addEventListener('change', count);
  $('#remember').addEventListener('change', function () {
    QT.store.set('wc:remember', this.checked);
    if (!this.checked) QT.store.set('wc:text', '');
    else count();
  });
  if (QT.store.get('wc:remember', false)) {
    $('#remember').checked = true;
    ta.value = QT.store.get('wc:text', '');
  }
  count();
}
