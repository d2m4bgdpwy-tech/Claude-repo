export const meta = {
  slug: 'regex-tester',
  weight: 10,  /* order within its category — lower comes first */
  title: 'Regex Tester & Debugger',
  shortTitle: 'Regex Tester',
  h1: 'Regular Expression Tester',
  category: 'Developer',
  icon: '.*',
  description: 'Test JavaScript regular expressions against text with live match highlighting, capture groups, replace preview and a cheat sheet. Runs locally.',
  keywords: ['regex tester', 'regular expression tester', 'regex online', 'regex debugger', 'regex101 alternative', 'javascript regex test', 'regex replace'],
  intro: 'Write a pattern and see every match highlighted as you type, with capture groups broken out, a replacement preview, and a warning when a pattern is at risk of catastrophic backtracking.',
  related: ['text-diff', 'slug-generator', 'cron-expression-parser', 'json-formatter'],
  html: `
<div class="panel">
  <div class="field">
    <label for="pattern">Pattern</label>
    <div style="display:flex;align-items:stretch;gap:0">
      <span style="display:grid;place-items:center;padding:0 10px;background:var(--bg-soft);border:1px solid var(--line);border-right:0;border-radius:8px 0 0 8px;color:var(--fg-faint);font-family:var(--mono)">/</span>
      <input type="text" id="pattern" spellcheck="false" style="border-radius:0;font-family:var(--mono)" value="(\\w+)@(\\w+)\\.(\\w+)">
      <span style="display:grid;place-items:center;padding:0 10px;background:var(--bg-soft);border:1px solid var(--line);border-left:0;border-radius:0 8px 8px 0;color:var(--fg-faint);font-family:var(--mono)">/</span>
      <input type="text" id="flags" spellcheck="false" value="g" style="flex:0 0 80px;margin-left:8px;font-family:var(--mono)" aria-label="Flags">
    </div>
  </div>
  <div class="row row--tight" style="margin-bottom:8px">
    <label class="check"><input type="checkbox" class="js-flag" value="g" checked> g <span class="hint">global</span></label>
    <label class="check"><input type="checkbox" class="js-flag" value="i"> i <span class="hint">ignore case</span></label>
    <label class="check"><input type="checkbox" class="js-flag" value="m"> m <span class="hint">multiline</span></label>
    <label class="check"><input type="checkbox" class="js-flag" value="s"> s <span class="hint">dot matches newline</span></label>
    <label class="check"><input type="checkbox" class="js-flag" value="u"> u <span class="hint">unicode</span></label>
  </div>
  <div id="msg" class="msg"></div>
</div>

<div class="panel">
  <div class="field">
    <label for="text">Test string</label>
    <textarea id="text" spellcheck="false" style="min-height:150px">Contact ada@example.com or alan@bletchley.org before Friday.
Backup address: grace@navy.mil</textarea>
  </div>
  <div class="field">
    <label>Matches <span class="hint" id="count"></span></label>
    <div class="out" id="highlight" style="min-height:100px;font-family:var(--mono)"></div>
  </div>
</div>

<div class="panel">
  <h3>Match details</h3>
  <div class="scroll-x"><table class="data" id="details"></table></div>
</div>

<div class="panel">
  <h3>Replace</h3>
  <div class="field">
    <label for="replace">Replacement — use $1, $2 for groups, $&amp; for the whole match</label>
    <input type="text" id="replace" spellcheck="false" placeholder="$1 [at] $2 dot $3">
  </div>
  <div class="field">
    <label for="result">Result</label>
    <textarea id="result" readonly spellcheck="false" style="min-height:100px"></textarea>
  </div>
  <button class="btn btn--sm" data-copy="#result">Copy result</button>
</div>

<div class="panel">
  <h3>Cheat sheet</h3>
  <div class="scroll-x"><table class="data">
    <tbody>
      <tr><td>.</td><td style="font-family:var(--sans)">any character except newline</td><td>\\d</td><td style="font-family:var(--sans)">a digit</td></tr>
      <tr><td>\\w</td><td style="font-family:var(--sans)">word character [A-Za-z0-9_]</td><td>\\s</td><td style="font-family:var(--sans)">whitespace</td></tr>
      <tr><td>^ $</td><td style="font-family:var(--sans)">start / end of string (or line with m)</td><td>\\b</td><td style="font-family:var(--sans)">word boundary</td></tr>
      <tr><td>*</td><td style="font-family:var(--sans)">0 or more</td><td>+</td><td style="font-family:var(--sans)">1 or more</td></tr>
      <tr><td>?</td><td style="font-family:var(--sans)">0 or 1 — or make the previous quantifier lazy</td><td>{2,5}</td><td style="font-family:var(--sans)">between 2 and 5</td></tr>
      <tr><td>(…)</td><td style="font-family:var(--sans)">capture group</td><td>(?:…)</td><td style="font-family:var(--sans)">group without capturing</td></tr>
      <tr><td>(?&lt;name&gt;…)</td><td style="font-family:var(--sans)">named group</td><td>[abc]</td><td style="font-family:var(--sans)">any one of a, b, c</td></tr>
      <tr><td>(?=…)</td><td style="font-family:var(--sans)">lookahead</td><td>(?&lt;=…)</td><td style="font-family:var(--sans)">lookbehind</td></tr>
    </tbody>
  </table></div>
</div>`,
  faq: [
    { q: 'Which regex flavour is this?', a: 'JavaScript (ECMAScript), because it runs on your browser\'s own engine. It is close to PCRE for everyday patterns, but there are differences: no possessive quantifiers, no recursion, no <code>\\A</code>/<code>\\z</code> anchors, and named groups use <code>(?&lt;name&gt;…)</code>.' },
    { q: 'What is catastrophic backtracking?', a: 'A pattern with nested quantifiers over overlapping character sets — <code>(a+)+b</code> is the classic — can take exponential time on a string that nearly matches. On a server this is a denial-of-service bug (ReDoS). This tool flags the shapes that commonly cause it.' },
    { q: 'Why does my global regex skip every other match?', a: 'A regex object with the <code>g</code> flag keeps a <code>lastIndex</code> between calls to <code>test()</code> and <code>exec()</code>. Reusing the same object without resetting it is one of the most common JavaScript regex bugs. This tool creates a fresh one each run.' },
    { q: 'Should I use a regex to parse HTML or email addresses?', a: 'For HTML, no — use a parser. For email, the practical answer is a loose check (something, an @, something with a dot) plus a confirmation email; RFC 5322 permits addresses no sane regex should try to validate.' }
  ]
};

export function client(root, QT) {
  var $ = function (s) { return root.querySelector(s); };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  var RISKY = [
    /\([^)]*[+*]\)[+*]/,
    /\([^)]*\|[^)]*\)[+*]\+/
  ];

  function syncCheckboxes() {
    var flags = $('#flags').value;
    QT.$$('.js-flag', root).forEach(function (cb) { cb.checked = flags.indexOf(cb.value) > -1; });
  }
  function syncFlagsInput() {
    $('#flags').value = QT.$$('.js-flag', root)
      .filter(function (cb) { return cb.checked; })
      .map(function (cb) { return cb.value; }).join('');
  }

  function run() {
    var pattern = $('#pattern').value;
    var flags = $('#flags').value;
    var text = $('#text').value;
    var msg = $('#msg');

    if (!pattern) {
      $('#highlight').textContent = text;
      $('#details').innerHTML = '';
      $('#count').textContent = '';
      QT.msg(msg, '');
      return;
    }

    var re;
    try { re = new RegExp(pattern, flags); }
    catch (e) {
      QT.msg(msg, e.message, 'err');
      $('#highlight').textContent = text;
      $('#details').innerHTML = '';
      return;
    }

    var risky = RISKY.some(function (r) { return r.test(pattern); });

    var matches = [];
    var t0 = performance.now();
    if (flags.indexOf('g') > -1) {
      var m, guard = 0;
      while ((m = re.exec(text)) !== null && guard++ < 10000) {
        matches.push(m);
        if (m.index === re.lastIndex) re.lastIndex++;
        if (performance.now() - t0 > 800) break;
      }
    } else {
      var one = re.exec(text);
      if (one) matches.push(one);
    }
    var ms = performance.now() - t0;

    var html = '', last = 0;
    matches.forEach(function (m) {
      html += esc(text.slice(last, m.index));
      html += '<mark style="background:var(--accent-soft);color:var(--accent);border-radius:3px;padding:1px 0">' +
        esc(m[0] || '') + '</mark>';
      last = m.index + (m[0] ? m[0].length : 0);
    });
    html += esc(text.slice(last));
    $('#highlight').innerHTML = html || '<span class="hint">Nothing to match against.</span>';
    $('#count').textContent = matches.length + ' match' + (matches.length === 1 ? '' : 'es') +
      ' in ' + ms.toFixed(1) + ' ms';

    if (risky && ms > 50) {
      QT.msg(msg, 'This pattern has nested quantifiers and is already slow. On a server it would be a ReDoS risk — rewrite it before shipping.', 'err');
    } else if (risky) {
      QT.msg(msg, 'Nested quantifiers detected. This shape can backtrack catastrophically on inputs that nearly match — worth rewriting if it will see untrusted input.', 'warn');
    } else if (matches.length) {
      QT.msg(msg, 'Valid pattern.', 'ok');
    } else {
      QT.msg(msg, 'Valid pattern, but no matches in the test string.', 'warn');
    }

    if (matches.length) {
      var hasGroups = matches.some(function (m) { return m.length > 1; });
      var maxGroups = Math.max.apply(null, matches.map(function (m) { return m.length - 1; }));
      var head = '<thead><tr><th>#</th><th>Match</th><th>At</th>' +
        (hasGroups ? Array.from({ length: maxGroups }, function (_, i) { return '<th>$' + (i + 1) + '</th>'; }).join('') : '') +
        '</tr></thead>';
      $('#details').innerHTML = head + '<tbody>' + matches.slice(0, 200).map(function (m, i) {
        var groups = '';
        for (var g = 1; g <= maxGroups; g++) {
          groups += '<td>' + (m[g] === undefined ? '<span class="hint">—</span>' : esc(m[g])) + '</td>';
        }
        var named = m.groups ? Object.keys(m.groups).map(function (k) {
          return k + ': ' + m.groups[k];
        }).join(', ') : '';
        return '<tr><td>' + (i + 1) + '</td><td>' + esc(m[0]) + (named ? '<br><span class="hint">' + esc(named) + '</span>' : '') +
          '</td><td>' + m.index + '</td>' + (hasGroups ? groups : '') + '</tr>';
      }).join('') + '</tbody>';
    } else {
      $('#details').innerHTML = '<tbody><tr><td class="hint">No matches.</td></tr></tbody>';
    }

    try {
      $('#result').value = $('#replace').value ? text.replace(new RegExp(pattern, flags), $('#replace').value) : '';
    } catch (e) { $('#result').value = ''; }
  }

  $('#flags').addEventListener('input', function () { syncCheckboxes(); run(); });
  QT.$$('.js-flag', root).forEach(function (cb) {
    cb.addEventListener('change', function () { syncFlagsInput(); run(); });
  });
  ['#pattern', '#text', '#replace'].forEach(function (s) {
    $(s).addEventListener('input', QT.debounce(run, 180));
  });
  syncCheckboxes();
  run();
}
