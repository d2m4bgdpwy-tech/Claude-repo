export const meta = {
  slug: 'csv-to-json',
  weight: 25,  /* order within its category — lower comes first */
  title: 'CSV to JSON Converter',
  shortTitle: 'CSV → JSON',
  h1: 'Convert CSV to JSON',
  category: 'JSON & Data',
  icon: '⇆',
  description: 'Convert CSV or TSV into clean JSON, with type detection and quoted-field support. Drop a file or paste text — nothing is uploaded.',
  keywords: ['csv to json', 'convert csv to json', 'tsv to json', 'csv parser online', 'excel to json'],
  intro: 'Paste a CSV or drop a file to get JSON. The parser follows RFC 4180, so quoted fields containing commas and line breaks come through intact. Everything happens in this tab — a spreadsheet of real customer data never leaves your laptop.',
  related: ['json-to-csv', 'json-formatter', 'yaml-json-converter'],
  html: `
<div class="panel">
  <div class="drop" id="drop">
    <strong>Drop a .csv or .tsv file here</strong>
    <span>or click to choose one — it is read locally, not uploaded</span>
    <input type="file" id="file" accept=".csv,.tsv,.txt,text/csv" hidden>
  </div>
  <div class="row row--tight" style="margin:14px 0">
    <label class="lbl" for="delim">Delimiter</label>
    <select id="delim" style="width:auto">
      <option value="auto">Detect automatically</option>
      <option value=",">Comma</option>
      <option value=";">Semicolon</option>
      <option value="\t">Tab</option>
      <option value="|">Pipe</option>
    </select>
    <label class="check"><input type="checkbox" id="header" checked> First row is a header</label>
    <label class="check"><input type="checkbox" id="types" checked> Detect numbers &amp; booleans</label>
    <label class="check"><input type="checkbox" id="pretty" checked> Pretty print</label>
  </div>
  <div class="io">
    <div class="field">
      <label for="in">CSV</label>
      <textarea id="in" spellcheck="false" placeholder="name,city&#10;Ada,London&#10;Alan,Wilmslow"></textarea>
    </div>
    <div class="field">
      <label for="out">JSON</label>
      <textarea id="out" spellcheck="false" readonly placeholder='[{"name":"Ada","city":"London"}]'></textarea>
    </div>
  </div>
  <div class="btns">
    <button class="btn btn--primary" id="convert">Convert</button>
    <button class="btn btn--ghost" id="sample">Load sample</button>
    <button class="btn btn--sm" data-copy="#out">Copy</button>
    <button class="btn btn--sm" data-download="#out" data-filename="data.json">Download .json</button>
    <button class="btn btn--sm btn--ghost" data-clear="#in,#out">Clear</button>
  </div>
  <div id="msg" class="msg"></div>
  <div id="preview" class="scroll-x" style="margin-top:14px"></div>
</div>`,
  faq: [
    { q: 'Does it handle commas inside quoted fields?', a: 'Yes. The parser implements RFC 4180: a field wrapped in double quotes may contain the delimiter, line breaks, and escaped quotes written as <code>""</code>.' },
    { q: 'What does "detect numbers and booleans" do?', a: 'Values that look like numbers become JSON numbers, <code>true</code>/<code>false</code> become booleans, and empty cells become <code>null</code>. Turn it off if you have things like ZIP codes or IDs with leading zeros that must stay strings.' },
    { q: 'What if there is no header row?', a: 'Untick "First row is a header" and each row is emitted as an array of values instead of an object.' },
    { q: 'Is my file uploaded when I drop it in?', a: 'No. The file is read with the browser\'s FileReader API, which hands the text to JavaScript running on this page. There is no server component to receive it.' }
  ]
};

export function client(root, QT) {
  var $ = function (s) { return root.querySelector(s); };
  var inEl = $('#in'), outEl = $('#out'), msg = $('#msg'), preview = $('#preview');

  function detectDelim(text) {
    var line = text.split(/\r?\n/)[0] || '';
    var best = ',', bestN = 0;
    [',', ';', '\t', '|'].forEach(function (d) {
      var n = line.split(d).length - 1;
      if (n > bestN) { bestN = n; best = d; }
    });
    return best;
  }

  /* RFC 4180 parser */
  function parseCsv(text, d) {
    var rows = [], row = [], field = '', i = 0, inQuotes = false;
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    while (i < text.length) {
      var c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
          inQuotes = false; i++; continue;
        }
        field += c; i++; continue;
      }
      if (c === '"' && field === '') { inQuotes = true; i++; continue; }
      if (c === d) { row.push(field); field = ''; i++; continue; }
      if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
      field += c; i++;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows.filter(function (r) { return r.length > 1 || (r[0] || '').trim() !== ''; });
  }

  function coerce(v) {
    if (!$('#types').checked) return v;
    var t = v.trim();
    if (t === '') return null;
    if (t === 'true' || t === 'TRUE' || t === 'True') return true;
    if (t === 'false' || t === 'FALSE' || t === 'False') return false;
    if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(t)) {
      var n = Number(t);
      if (String(n) === t || Math.abs(n) < Number.MAX_SAFE_INTEGER) return n;
    }
    return v;
  }

  function uniqueHeaders(hdr) {
    var seen = {};
    return hdr.map(function (h, idx) {
      var name = (h || '').trim() || ('column_' + (idx + 1));
      if (seen[name] === undefined) { seen[name] = 1; return name; }
      seen[name]++; return name + '_' + seen[name];
    });
  }

  function convert() {
    var text = inEl.value;
    if (!text.trim()) { outEl.value = ''; preview.innerHTML = ''; QT.msg(msg, ''); return; }
    var d = $('#delim').value === 'auto' ? detectDelim(text) : $('#delim').value;
    var rows = parseCsv(text, d);
    if (!rows.length) { outEl.value = ''; QT.msg(msg, 'No rows found.', 'warn'); return; }

    var result, cols;
    if ($('#header').checked) {
      cols = uniqueHeaders(rows[0]);
      result = rows.slice(1).map(function (r) {
        var o = {};
        cols.forEach(function (c, i) { o[c] = coerce(r[i] === undefined ? '' : r[i]); });
        return o;
      });
    } else {
      cols = rows[0].map(function (_, i) { return 'col ' + (i + 1); });
      result = rows.map(function (r) { return r.map(coerce); });
    }

    outEl.value = JSON.stringify(result, null, $('#pretty').checked ? 2 : 0);
    QT.msg(msg, result.length + ' rows × ' + cols.length + ' columns (delimiter: ' +
      (d === '\t' ? 'tab' : d) + ')', 'ok');

    var head = rows.slice(0, 6);
    preview.innerHTML = '<table class="data"><thead><tr>' +
      cols.map(function (c) { return '<th>' + c.replace(/[<>&]/g, '') + '</th>'; }).join('') +
      '</tr></thead><tbody>' +
      head.slice($('#header').checked ? 1 : 0).map(function (r) {
        return '<tr>' + cols.map(function (_, i) {
          return '<td>' + String(r[i] === undefined ? '' : r[i]).slice(0, 60).replace(/[<>&]/g, '') + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table>';
  }

  $('#convert').addEventListener('click', convert);
  inEl.addEventListener('input', QT.debounce(convert, 250));
  ['#delim', '#header', '#types', '#pretty'].forEach(function (s) { $(s).addEventListener('change', convert); });
  $('#sample').addEventListener('click', function () {
    inEl.value = 'id,name,role,city,active\n1,"Lovelace, Ada",Analyst,London,true\n' +
      '2,Alan Turing,Cryptanalyst,Wilmslow,true\n3,Grace Hopper,"Rear Admiral",Arlington,false';
    convert();
  });
  QT.dropzone($('#drop'), $('#file'), function (files) {
    QT.read(files[0], 'text').then(function (text) {
      inEl.value = text;
      convert();
      QT.toast('Loaded ' + files[0].name);
    });
  });
}
