export const meta = {
  slug: 'json-formatter',
  weight: 10,  /* order within its category — lower comes first */
  title: 'JSON Formatter & Validator',
  shortTitle: 'JSON Formatter',
  h1: 'JSON Formatter and Validator',
  category: 'JSON & Data',
  icon: '{ }',
  description: 'Beautify, minify and validate JSON in your browser. Pinpoints syntax errors by line and column. Nothing is uploaded.',
  keywords: ['json formatter', 'json validator', 'json beautifier', 'json pretty print', 'format json online', 'json lint', 'minify json'],
  intro: 'Paste JSON to pretty-print it, minify it, or find out exactly where it breaks. The parser runs in this tab, so config files, API responses and tokens never leave your machine.',
  related: ['json-to-csv', 'csv-to-json', 'yaml-json-converter', 'jwt-decoder'],
  html: `
<div class="panel">
  <div class="btns">
    <button class="btn btn--primary" id="format">Format</button>
    <button class="btn" id="minify">Minify</button>
    <button class="btn" id="sort">Sort keys</button>
    <button class="btn" id="escape">Escape as string</button>
    <button class="btn btn--ghost" id="sample">Load sample</button>
    <button class="btn btn--ghost" data-clear="#in,#out">Clear</button>
  </div>
  <div class="row row--tight" style="margin-bottom:12px">
    <label class="lbl" for="indent">Indent</label>
    <select id="indent" style="width:auto">
      <option value="2">2 spaces</option>
      <option value="4">4 spaces</option>
      <option value="tab">Tab</option>
    </select>
    <label class="check"><input type="checkbox" id="live" checked> Format as I type</label>
  </div>
  <div class="io">
    <div class="field">
      <label for="in">Input</label>
      <textarea id="in" spellcheck="false" placeholder='{"hello":"world","items":[1,2,3]}'></textarea>
    </div>
    <div class="field">
      <label for="out">Output</label>
      <textarea id="out" spellcheck="false" readonly placeholder="Formatted JSON appears here"></textarea>
    </div>
  </div>
  <div class="btns">
    <button class="btn btn--sm" data-copy="#out">Copy output</button>
    <button class="btn btn--sm" data-download="#out" data-filename="formatted.json">Download .json</button>
  </div>
  <div id="msg" class="msg"></div>
  <div class="stat-grid" id="stats" style="margin-top:12px" hidden>
    <div class="stat"><b id="s-size">0</b><span>Input size</span></div>
    <div class="stat"><b id="s-min">0</b><span>Minified</span></div>
    <div class="stat"><b id="s-keys">0</b><span>Keys</span></div>
    <div class="stat"><b id="s-depth">0</b><span>Max depth</span></div>
  </div>
</div>`,
  faq: [
    { q: 'Is my JSON uploaded anywhere?', a: 'No. The formatting is done by <code>JSON.parse</code> and <code>JSON.stringify</code> running inside your own browser tab. Open the Network panel in your developer tools and you will see no request carrying your data. You can disconnect from the internet and the tool keeps working.' },
    { q: 'What does "Sort keys" do?', a: 'It rebuilds every object with its keys in alphabetical order, all the way down. That makes two JSON documents easy to compare in a diff tool when the only difference is key ordering.' },
    { q: 'Why does it say "Unexpected token" and where is the error?', a: 'That is the browser\'s JSON parser telling you the document is invalid. This tool converts the character offset it reports into a line and column number and shows the offending line, so you can jump straight to it.' },
    { q: 'Can it handle very large files?', a: 'It handles whatever your browser can hold in memory — typically tens of megabytes. Above that, formatting a file in a browser tab of any kind becomes slow; use a streaming tool like <code>jq</code> instead.' },
    { q: 'Does it support JSON with comments or trailing commas?', a: 'Strict JSON does not allow either, so the validator will flag them. That is deliberate: if this tool accepted them, it would tell you a file is valid when the service consuming it will reject it.' }
  ],
  about: `
<h2>Reading the error message</h2>
<p>Four mistakes account for most invalid JSON:</p>
<ul>
  <li><strong>Trailing commas</strong> — <code>{"a":1,}</code> is valid JavaScript and invalid JSON.</li>
  <li><strong>Single quotes</strong> — JSON strings must use double quotes.</li>
  <li><strong>Unquoted keys</strong> — <code>{a:1}</code> is a JavaScript object literal, not JSON.</li>
  <li><strong>Unescaped control characters</strong> — a real newline inside a string must be written <code>\\n</code>.</li>
</ul>`
};

export function client(root, QT) {
  var $ = function (s) { return root.querySelector(s); };
  var inEl = $('#in'), outEl = $('#out'), msg = $('#msg'), stats = $('#stats');

  function indent() {
    var v = $('#indent').value;
    return v === 'tab' ? '\t' : Number(v);
  }

  function locate(text, err) {
    var m = /position (\d+)/.exec(err.message || '');
    if (!m) return err.message;
    var pos = Number(m[1]);
    var before = text.slice(0, pos);
    var line = before.split('\n').length;
    var col = pos - before.lastIndexOf('\n');
    var src = text.split('\n')[line - 1] || '';
    var trimmed = src.length > 90 ? src.slice(0, 90) + '…' : src;
    return 'Invalid JSON at line ' + line + ', column ' + col + ' — ' +
      err.message.replace(/ in JSON at position \d+.*/, '') + '\n' + trimmed;
  }

  function sortKeys(v) {
    if (Array.isArray(v)) return v.map(sortKeys);
    if (v && typeof v === 'object') {
      return Object.keys(v).sort().reduce(function (acc, k) { acc[k] = sortKeys(v[k]); return acc; }, {});
    }
    return v;
  }

  function measure(v) {
    var keys = 0, depth = 0;
    (function walk(node, d) {
      if (d > depth) depth = d;
      if (Array.isArray(node)) node.forEach(function (n) { walk(n, d + 1); });
      else if (node && typeof node === 'object') {
        Object.keys(node).forEach(function (k) { keys++; walk(node[k], d + 1); });
      }
    })(v, 0);
    return { keys: keys, depth: depth };
  }

  function parse() {
    var text = inEl.value;
    if (!text.trim()) { outEl.value = ''; QT.msg(msg, ''); stats.hidden = true; return null; }
    try {
      var data = JSON.parse(text);
      QT.msg(msg, 'Valid JSON', 'ok');
      var m = measure(data);
      $('#s-size').textContent = QT.bytes(new Blob([text]).size);
      $('#s-min').textContent = QT.bytes(new Blob([JSON.stringify(data)]).size);
      $('#s-keys').textContent = m.keys;
      $('#s-depth').textContent = m.depth;
      stats.hidden = false;
      return { data: data };
    } catch (e) {
      QT.msg(msg, locate(text, e), 'err');
      stats.hidden = true;
      return null;
    }
  }

  function run(mode) {
    var r = parse();
    if (!r) return;
    var data = mode === 'sort' ? sortKeys(r.data) : r.data;
    if (mode === 'minify') outEl.value = JSON.stringify(data);
    else if (mode === 'escape') outEl.value = JSON.stringify(JSON.stringify(data));
    else outEl.value = JSON.stringify(data, null, indent());
  }

  $('#format').addEventListener('click', function () { run('format'); });
  $('#minify').addEventListener('click', function () { run('minify'); });
  $('#sort').addEventListener('click', function () { run('sort'); });
  $('#escape').addEventListener('click', function () { run('escape'); });
  $('#indent').addEventListener('change', function () { if (outEl.value) run('format'); });
  $('#sample').addEventListener('click', function () {
    inEl.value = '{"id":42,"name":"Ada Lovelace","active":true,"tags":["math","engines"],' +
      '"address":{"city":"London","postcode":"NW1"},"scores":[9.5,8,10],"note":null}';
    run('format');
  });
  inEl.addEventListener('input', QT.debounce(function () {
    if ($('#live').checked) run('format');
  }, 200));
}
