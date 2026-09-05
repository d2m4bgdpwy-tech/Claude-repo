export const meta = {
  slug: 'text-diff',
  weight: 15,  /* order within its category — lower comes first */
  title: 'Text Diff Checker',
  shortTitle: 'Text Diff',
  h1: 'Text Diff Checker — Compare Two Texts',
  category: 'Text',
  icon: '±',
  description: 'Compare two blocks of text or code side by side and see exactly what changed, line by line and word by word. Runs offline in your browser.',
  keywords: ['text diff', 'diff checker', 'compare two texts', 'text comparison tool', 'file diff online', 'code diff'],
  intro: 'Paste two versions of anything — a contract, a config file, a block of code — and see the additions, deletions and changes highlighted. The comparison runs on your machine, so you can safely diff things you cannot paste into a website that uploads.',
  related: ['word-counter', 'json-formatter', 'remove-duplicate-lines'],
  html: `
<div class="panel">
  <div class="io">
    <div class="field">
      <label for="a">Original</label>
      <textarea id="a" spellcheck="false" placeholder="Paste the first version here"></textarea>
    </div>
    <div class="field">
      <label for="b">Changed</label>
      <textarea id="b" spellcheck="false" placeholder="Paste the second version here"></textarea>
    </div>
  </div>
  <div class="row row--tight">
    <button class="btn btn--primary" id="run">Compare</button>
    <button class="btn btn--ghost" id="swap">Swap sides</button>
    <button class="btn btn--ghost" data-clear="#a,#b">Clear</button>
    <label class="check"><input type="checkbox" id="ws"> Ignore whitespace</label>
    <label class="check"><input type="checkbox" id="ci"> Ignore case</label>
    <label class="check"><input type="checkbox" id="words" checked> Highlight changed words</label>
  </div>
  <div id="msg" class="msg"></div>
</div>

<div class="panel" id="out-panel" hidden>
  <div class="stat-grid" style="margin-bottom:14px">
    <div class="stat"><b id="s-add" style="color:var(--accent)">0</b><span>Added</span></div>
    <div class="stat"><b id="s-del" style="color:var(--err)">0</b><span>Removed</span></div>
    <div class="stat"><b id="s-same">0</b><span>Unchanged</span></div>
    <div class="stat"><b id="s-sim">0%</b><span>Similarity</span></div>
  </div>
  <div class="scroll-x"><div id="diff" style="font-family:var(--mono);font-size:.85rem;line-height:1.6"></div></div>
</div>`,
  faq: [
    { q: 'How does the comparison work?', a: 'It computes a longest-common-subsequence diff over the lines — the same algorithm family behind <code>git diff</code> — then, for lines that changed, runs a second word-level pass so you can see which words moved rather than just "this line differs".' },
    { q: 'Can I compare two files?', a: 'Open each file in a text editor and paste its contents in. Everything stays local either way.' },
    { q: 'Is there a size limit?', a: 'The algorithm is quadratic in the number of differing lines, so documents of a few thousand lines are instant and very large files (tens of thousands of changed lines) will get slow. For those, <code>diff</code> on the command line is the right tool.' },
    { q: 'Why do identical-looking lines show as different?', a: 'Almost always invisible characters: trailing spaces, tabs versus spaces, or Windows <code>\\r\\n</code> line endings against Unix <code>\\n</code>. Tick "ignore whitespace" to confirm that is the cause.' }
  ]
};

export function client(root, QT) {
  var $ = function (s) { return root.querySelector(s); };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function normalize(line) {
    var s = line;
    if ($('#ws').checked) s = s.replace(/\s+/g, ' ').trim();
    if ($('#ci').checked) s = s.toLowerCase();
    return s;
  }

  /* Classic LCS table diff. Fine for the document sizes a browser tool sees. */
  function diff(a, b) {
    var n = a.length, m = b.length;
    var lcs = [];
    for (var i = 0; i <= n; i++) lcs.push(new Uint32Array(m + 1));
    for (var i2 = n - 1; i2 >= 0; i2--) {
      for (var j = m - 1; j >= 0; j--) {
        lcs[i2][j] = normalize(a[i2]) === normalize(b[j])
          ? lcs[i2 + 1][j + 1] + 1
          : Math.max(lcs[i2 + 1][j], lcs[i2][j + 1]);
      }
    }
    var out = [], x = 0, y = 0;
    while (x < n && y < m) {
      if (normalize(a[x]) === normalize(b[y])) { out.push({ t: '=', a: a[x], b: b[y] }); x++; y++; }
      else if (lcs[x + 1][y] >= lcs[x][y + 1]) { out.push({ t: '-', a: a[x] }); x++; }
      else { out.push({ t: '+', b: b[y] }); y++; }
    }
    while (x < n) { out.push({ t: '-', a: a[x] }); x++; }
    while (y < m) { out.push({ t: '+', b: b[y] }); y++; }
    return out;
  }

  /* Pair a removal immediately followed by an addition so we can word-diff them. */
  function pairUp(rows) {
    var out = [];
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].t === '-' && rows[i + 1] && rows[i + 1].t === '+') {
        out.push({ t: '~', a: rows[i].a, b: rows[i + 1].b });
        i++;
      } else out.push(rows[i]);
    }
    return out;
  }

  function wordDiff(a, b) {
    var aw = a.split(/(\s+)/), bw = b.split(/(\s+)/);
    var rows = (function () {
      var n = aw.length, m = bw.length, t = [];
      for (var i = 0; i <= n; i++) t.push(new Uint32Array(m + 1));
      for (var i2 = n - 1; i2 >= 0; i2--) {
        for (var j = m - 1; j >= 0; j--) {
          t[i2][j] = aw[i2] === bw[j] ? t[i2 + 1][j + 1] + 1 : Math.max(t[i2 + 1][j], t[i2][j + 1]);
        }
      }
      var res = [], x = 0, y = 0;
      while (x < n && y < m) {
        if (aw[x] === bw[y]) { res.push(['=', aw[x]]); x++; y++; }
        else if (t[x + 1][y] >= t[x][y + 1]) { res.push(['-', aw[x]]); x++; }
        else { res.push(['+', bw[y]]); y++; }
      }
      while (x < n) { res.push(['-', aw[x]]); x++; }
      while (y < m) { res.push(['+', bw[y]]); y++; }
      return res;
    })();

    var left = '', right = '';
    rows.forEach(function (r) {
      var v = esc(r[1]);
      if (r[0] === '=') { left += v; right += v; }
      else if (r[0] === '-') left += '<mark style="background:color-mix(in srgb,var(--err) 34%,transparent);color:inherit;border-radius:3px">' + v + '</mark>';
      else right += '<mark style="background:color-mix(in srgb,var(--accent) 30%,transparent);color:inherit;border-radius:3px">' + v + '</mark>';
    });
    return [left, right];
  }

  function row(sign, num, html, tone) {
    var bg = tone === '+' ? 'color-mix(in srgb,var(--accent) 10%,transparent)'
      : tone === '-' ? 'color-mix(in srgb,var(--err) 10%,transparent)' : 'transparent';
    return '<div style="display:flex;background:' + bg + ';padding:1px 0">' +
      '<span style="flex:0 0 56px;color:var(--fg-faint);text-align:right;padding-right:10px;user-select:none">' + num + '</span>' +
      '<span style="flex:0 0 16px;color:var(--fg-faint);user-select:none">' + sign + '</span>' +
      '<span style="white-space:pre-wrap;word-break:break-word;flex:1 1 auto">' + (html || '&nbsp;') + '</span></div>';
  }

  function run() {
    var aText = $('#a').value, bText = $('#b').value;
    if (!aText && !bText) {
      $('#out-panel').hidden = true;
      QT.msg($('#msg'), 'Paste text into both boxes.', 'warn');
      return;
    }
    var rows = pairUp(diff(aText.split('\n'), bText.split('\n')));
    var add = 0, del = 0, same = 0;
    var la = 0, lb = 0;
    var html = rows.map(function (r) {
      if (r.t === '=') { same++; la++; lb++; return row(' ', la, esc(r.a)); }
      if (r.t === '-') { del++; la++; return row('−', la, esc(r.a), '-'); }
      if (r.t === '+') { add++; lb++; return row('+', lb, esc(r.b), '+'); }
      add++; del++; la++; lb++;
      var w = $('#words').checked ? wordDiff(r.a, r.b) : [esc(r.a), esc(r.b)];
      return row('−', la, w[0], '-') + row('+', lb, w[1], '+');
    }).join('');

    $('#diff').innerHTML = html || '<p class="hint">No content.</p>';
    $('#s-add').textContent = add;
    $('#s-del').textContent = del;
    $('#s-same').textContent = same;
    var total = add + del + same;
    $('#s-sim').textContent = total ? Math.round((same / total) * 100) + '%' : '—';
    $('#out-panel').hidden = false;
    QT.msg($('#msg'), add === 0 && del === 0
      ? 'The two texts are identical.'
      : add + ' line' + (add === 1 ? '' : 's') + ' added, ' + del + ' removed.',
      add === 0 && del === 0 ? 'ok' : 'warn');
  }

  $('#run').addEventListener('click', run);
  $('#swap').addEventListener('click', function () {
    var t = $('#a').value; $('#a').value = $('#b').value; $('#b').value = t; run();
  });
  ['#ws', '#ci', '#words'].forEach(function (s) {
    $(s).addEventListener('change', function () { if (!$('#out-panel').hidden) run(); });
  });
  [$('#a'), $('#b')].forEach(function (el) {
    el.addEventListener('input', QT.debounce(function () { if (!$('#out-panel').hidden) run(); }, 400));
  });
}
