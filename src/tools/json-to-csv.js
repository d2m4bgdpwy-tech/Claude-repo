export const meta = {
  slug: 'json-to-csv',
  weight: 20,  /* order within its category — lower comes first */
  title: 'JSON to CSV Converter',
  shortTitle: 'JSON → CSV',
  h1: 'Convert JSON to CSV',
  category: 'JSON & Data',
  icon: '⇄',
  description: 'Turn a JSON array into a CSV or TSV file you can open in Excel or Sheets. Flattens nested objects. Runs entirely in your browser.',
  keywords: ['json to csv', 'convert json to csv', 'json to excel', 'json array to spreadsheet', 'json to tsv'],
  intro: 'Paste an array of JSON objects and get a spreadsheet-ready CSV. Nested objects are flattened into dotted column names, and the file is built in your browser — useful when the JSON is a customer export you should not be pasting into a random website.',
  related: ['csv-to-json', 'json-formatter', 'yaml-json-converter'],
  html: `
<div class="panel">
  <div class="row row--tight" style="margin-bottom:12px">
    <label class="lbl" for="delim">Delimiter</label>
    <select id="delim" style="width:auto">
      <option value=",">Comma (.csv)</option>
      <option value=";">Semicolon</option>
      <option value="\t">Tab (.tsv)</option>
      <option value="|">Pipe</option>
    </select>
    <label class="check"><input type="checkbox" id="flatten" checked> Flatten nested objects</label>
    <label class="check"><input type="checkbox" id="header" checked> Header row</label>
    <label class="check"><input type="checkbox" id="bom"> Excel-safe (UTF-8 BOM)</label>
  </div>
  <div class="io">
    <div class="field">
      <label for="in">JSON array</label>
      <textarea id="in" spellcheck="false" placeholder='[{"name":"Ada","city":"London"},{"name":"Alan","city":"Wilmslow"}]'></textarea>
    </div>
    <div class="field">
      <label for="out">CSV</label>
      <textarea id="out" spellcheck="false" readonly placeholder="name,city&#10;Ada,London"></textarea>
    </div>
  </div>
  <div class="btns">
    <button class="btn btn--primary" id="convert">Convert</button>
    <button class="btn btn--ghost" id="sample">Load sample</button>
    <button class="btn btn--sm" id="copy">Copy</button>
    <button class="btn btn--sm" id="dl">Download</button>
    <button class="btn btn--sm btn--ghost" data-clear="#in,#out">Clear</button>
  </div>
  <div id="msg" class="msg"></div>
</div>`,
  faq: [
    { q: 'What shape does my JSON need to be?', a: 'An array of objects, like <code>[{"a":1},{"a":2}]</code> — that is what a table is. A single object is treated as a one-row table. If your array is wrapped in an envelope such as <code>{"data":[…]}</code>, the tool finds the first array property automatically.' },
    { q: 'What happens to nested objects and arrays?', a: 'With flattening on, <code>{"user":{"name":"Ada"}}</code> becomes a column called <code>user.name</code>. Arrays of primitives are joined with a semicolon. Arrays of objects are written as JSON in the cell, since there is no lossless way to fit them in one column.' },
    { q: 'Why does Excel mangle my accented characters?', a: 'Excel guesses the encoding of a plain CSV and often guesses wrong. Tick "Excel-safe (UTF-8 BOM)" to prepend a byte-order mark, which tells Excel the file is UTF-8.' },
    { q: 'Do the rows have to have the same keys?', a: 'No. The tool collects every key it sees across all rows and uses the union as the header. Missing values become empty cells.' }
  ]
};

export function client(root, QT) {
  var $ = function (s) { return root.querySelector(s); };
  var inEl = $('#in'), outEl = $('#out'), msg = $('#msg');
  var csvText = '';

  function flatten(obj, prefix, out) {
    out = out || {}; prefix = prefix || '';
    Object.keys(obj).forEach(function (k) {
      var v = obj[k], key = prefix ? prefix + '.' + k : k;
      if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
      else if (Array.isArray(v)) {
        out[key] = v.every(function (x) { return x === null || typeof x !== 'object'; })
          ? v.join('; ') : JSON.stringify(v);
      } else out[key] = v;
    });
    return out;
  }

  function cell(v, d) {
    if (v === null || v === undefined) return '';
    var s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    if (s.indexOf(d) > -1 || s.indexOf('"') > -1 || /[\r\n]/.test(s)) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  function convert() {
    var text = inEl.value.trim();
    if (!text) { outEl.value = ''; csvText = ''; QT.msg(msg, ''); return; }
    var data;
    try { data = JSON.parse(text); }
    catch (e) { QT.msg(msg, 'That is not valid JSON: ' + e.message, 'err'); return; }

    if (!Array.isArray(data)) {
      if (data && typeof data === 'object') {
        var arrKey = Object.keys(data).find(function (k) { return Array.isArray(data[k]); });
        data = arrKey ? data[arrKey] : [data];
      } else {
        QT.msg(msg, 'Expected an array of objects, or an object containing one.', 'err');
        return;
      }
    }
    if (!data.length) { outEl.value = ''; QT.msg(msg, 'The array is empty — nothing to convert.', 'warn'); return; }

    var doFlat = $('#flatten').checked;
    var rows = data.map(function (r) {
      if (r === null || typeof r !== 'object') return { value: r };
      return doFlat ? flatten(r) : r;
    });

    var cols = [];
    rows.forEach(function (r) {
      Object.keys(r).forEach(function (k) { if (cols.indexOf(k) === -1) cols.push(k); });
    });

    var d = $('#delim').value;
    var lines = [];
    if ($('#header').checked) lines.push(cols.map(function (c) { return cell(c, d); }).join(d));
    rows.forEach(function (r) {
      lines.push(cols.map(function (c) { return cell(r[c], d); }).join(d));
    });
    /* RFC 4180 wants CRLF line endings, but reading a textarea's .value back
       normalises them to LF — so keep the real text here for copy/download. */
    csvText = lines.join('\r\n');
    outEl.value = csvText;
    QT.msg(msg, rows.length + ' rows × ' + cols.length + ' columns', 'ok');
  }

  $('#convert').addEventListener('click', convert);
  inEl.addEventListener('input', QT.debounce(convert, 250));
  root.querySelector('[data-clear]').addEventListener('click', function () { csvText = ''; });
  ['#delim', '#flatten', '#header'].forEach(function (s) {
    $(s).addEventListener('change', convert);
  });
  $('#sample').addEventListener('click', function () {
    inEl.value = JSON.stringify([
      { id: 1, name: 'Ada Lovelace', role: 'Analyst', address: { city: 'London', country: 'UK' }, tags: ['math', 'engines'] },
      { id: 2, name: 'Alan Turing', role: 'Cryptanalyst', address: { city: 'Wilmslow', country: 'UK' }, tags: ['logic'] },
      { id: 3, name: 'Grace Hopper', role: 'Rear Admiral', address: { city: 'Arlington', country: 'US' }, tags: ['compilers', 'navy'] }
    ], null, 2);
    convert();
  });
  $('#copy').addEventListener('click', function () {
    if (!csvText) { QT.toast('Nothing to copy'); return; }
    QT.copy(csvText);
  });
  $('#dl').addEventListener('click', function () {
    if (!outEl.value) { QT.toast('Nothing to download'); return; }
    var d = $('#delim').value;
    var ext = d === '\t' ? 'tsv' : 'csv';
    var body = ($('#bom').checked ? '\ufeff' : '') + csvText;
    QT.download('data.' + ext, body, 'text/' + (ext === 'tsv' ? 'tab-separated-values' : 'csv') + ';charset=utf-8');
  });
}
