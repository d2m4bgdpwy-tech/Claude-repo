export const meta = {
  slug: 'number-base-converter',
  weight: 25,  /* order within its category — lower comes first */
  title: 'Number Base Converter — Binary, Hex, Decimal, Octal',
  shortTitle: 'Base Converter',
  h1: 'Number Base Converter',
  category: 'Time & Numbers',
  icon: '01',
  description: 'Convert numbers between binary, octal, decimal, hexadecimal and any base from 2 to 36, with big-integer support and a bit inspector.',
  keywords: ['binary to decimal', 'hex to decimal', 'decimal to binary', 'base converter', 'hex converter', 'octal converter', 'binary converter'],
  intro: 'Convert a number between every common base at once. Arbitrarily large integers are supported via BigInt, and the bit inspector shows the binary layout with byte grouping and the two\'s-complement value at each width.',
  related: ['color-converter', 'unix-timestamp-converter', 'hash-generator'],
  html: `
<div class="panel">
  <div class="row">
    <div class="field" style="flex:1 1 260px">
      <label for="value">Value</label>
      <input type="text" id="value" spellcheck="false" value="255" placeholder="255, 0xff, 0b1111, 0o377">
    </div>
    <div class="field" style="flex:0 0 190px">
      <label for="base">Input base</label>
      <select id="base">
        <option value="auto">Detect from prefix</option>
        <option value="2">2 — binary</option>
        <option value="8">8 — octal</option>
        <option value="10">10 — decimal</option>
        <option value="16">16 — hexadecimal</option>
        <option value="32">32</option>
        <option value="36">36</option>
      </select>
    </div>
  </div>
  <div class="scroll-x"><table class="data" id="out"></table></div>
  <div id="msg" class="msg"></div>
</div>

<div class="panel">
  <h3>Any base from 2 to 36</h3>
  <div class="row">
    <div class="field" style="flex:0 0 160px">
      <label for="custom">Base</label>
      <input type="number" id="custom" value="12" min="2" max="36">
    </div>
    <div class="field">
      <label for="custom-out">Result</label>
      <input type="text" id="custom-out" readonly>
    </div>
  </div>
</div>

<div class="panel">
  <h3>Bit inspector</h3>
  <div id="bits" style="font-family:var(--mono);font-size:.9rem;line-height:2;word-break:break-all"></div>
  <div class="scroll-x" style="margin-top:12px"><table class="data" id="widths"></table></div>
</div>`,
  faq: [
    { q: 'Which prefixes are recognised?', a: '<code>0x</code> for hexadecimal, <code>0b</code> for binary, <code>0o</code> for octal, and a leading <code>#</code> for hex as well. Underscores and spaces are ignored, so <code>0b1010_1010</code> works.' },
    { q: 'Can it handle numbers larger than 2^53?', a: 'Yes. Conversion uses JavaScript\'s BigInt, so integers of any length convert exactly — no silent precision loss like you get with ordinary floating-point numbers.' },
    { q: 'What is two\'s complement?', a: 'How signed integers are stored: the top bit means negative, and the value is formed by inverting the bits and adding one. It is why an 8-bit <code>0xFF</code> is 255 unsigned and −1 signed. The table shows both readings at each common width.' },
    { q: 'Why is hexadecimal used so much?', a: 'Each hex digit maps to exactly four bits, so a byte is always two digits and the boundaries line up visually. Decimal has no such relationship with binary, which makes reading memory or colour values in decimal painful.' }
  ]
};

export function client(root, QT) {
  var $ = function (s) { return root.querySelector(s); };

  function parseValue() {
    var raw = $('#value').value.trim().replace(/[_\s,]/g, '');
    if (!raw) return null;
    var neg = false;
    if (raw[0] === '-') { neg = true; raw = raw.slice(1); }
    var base = $('#base').value, digits = raw;

    if (base === 'auto') {
      if (/^0x/i.test(raw)) { base = 16; digits = raw.slice(2); }
      else if (/^#/.test(raw)) { base = 16; digits = raw.slice(1); }
      else if (/^0b/i.test(raw)) { base = 2; digits = raw.slice(2); }
      else if (/^0o/i.test(raw)) { base = 8; digits = raw.slice(2); }
      else base = 10;
    } else {
      base = Number(base);
      if (/^(0x|0b|0o)/i.test(raw)) digits = raw.slice(2);
    }
    base = Number(base);
    if (!digits) return null;

    var valid = '0123456789abcdefghijklmnopqrstuvwxyz'.slice(0, base);
    var lower = digits.toLowerCase();
    for (var i = 0; i < lower.length; i++) {
      if (valid.indexOf(lower[i]) === -1) {
        return { error: '"' + digits[i] + '" is not a valid digit in base ' + base + '.' };
      }
    }
    var n = 0n, b = BigInt(base);
    for (var j = 0; j < lower.length; j++) n = n * b + BigInt(valid.indexOf(lower[j]));
    return { value: neg ? -n : n, base: base };
  }

  function render() {
    var r = parseValue();
    if (!r) { $('#out').innerHTML = ''; $('#bits').innerHTML = ''; $('#widths').innerHTML = ''; QT.msg($('#msg'), ''); return; }
    if (r.error) { QT.msg($('#msg'), r.error, 'err'); return; }

    var n = r.value;
    var abs = n < 0n ? -n : n;
    var sign = n < 0n ? '-' : '';
    var rows = [
      ['Binary (base 2)', sign + abs.toString(2)],
      ['Octal (base 8)', sign + abs.toString(8)],
      ['Decimal (base 10)', n.toString(10)],
      ['Hexadecimal (base 16)', sign + abs.toString(16).toUpperCase()],
      ['Base 32', sign + abs.toString(32).toUpperCase()],
      ['Base 36', sign + abs.toString(36).toUpperCase()],
      ['With prefixes', sign + '0b' + abs.toString(2) + '  ·  ' + sign + '0o' + abs.toString(8) + '  ·  ' + sign + '0x' + abs.toString(16).toUpperCase()]
    ];
    $('#out').innerHTML = '<tbody>' + rows.map(function (row) {
      return '<tr><th style="width:170px;font-family:var(--sans)">' + row[0] + '</th><td>' + row[1] +
        '</td><td style="width:76px"><button class="btn btn--sm js-c" type="button" data-v="' + row[1] + '">Copy</button></td></tr>';
    }).join('') + '</tbody>';
    QT.$$('.js-c', root).forEach(function (b) {
      b.addEventListener('click', function () { QT.copy(b.getAttribute('data-v')); });
    });

    var cb = Math.max(2, Math.min(36, Number($('#custom').value) || 10));
    $('#custom-out').value = sign + abs.toString(cb).toUpperCase();

    var bin = abs.toString(2);
    var padded = bin.padStart(Math.max(8, Math.ceil(bin.length / 8) * 8), '0');
    $('#bits').innerHTML = padded.replace(/(.{4})/g, '$1 ').trim()
      .split(' ').map(function (nib, i) {
        return '<span style="display:inline-block;padding:1px 6px;margin:2px;border-radius:5px;background:' +
          (i % 2 ? 'var(--bg)' : 'var(--bg-raise)') + ';border:1px solid var(--line-soft)">' + nib + '</span>';
      }).join('') +
      '<div class="hint" style="margin-top:8px">' + padded.length + ' bits · ' + (padded.length / 8) + ' bytes · ' +
      (bin.replace(/0/g, '').length) + ' bits set</div>';

    var widths = [8, 16, 32, 64];
    $('#widths').innerHTML = '<thead><tr><th>Width</th><th>Unsigned</th><th>Signed (two\'s complement)</th><th>Fits</th></tr></thead><tbody>' +
      widths.map(function (w) {
        var max = (1n << BigInt(w)) - 1n;
        var fits = abs <= max;
        var unsigned = fits ? (n < 0n ? ((1n << BigInt(w)) + n) : n).toString() : '—';
        var half = 1n << BigInt(w - 1);
        var u = fits ? BigInt(unsigned) : 0n;
        var signed = fits ? (u >= half ? (u - (1n << BigInt(w))).toString() : u.toString()) : '—';
        return '<tr><td style="font-family:var(--sans)">' + w + '-bit</td><td>' + unsigned + '</td><td>' + signed +
          '</td><td style="color:' + (fits ? 'var(--accent)' : 'var(--fg-faint)') + '">' + (fits ? 'yes' : 'overflows') + '</td></tr>';
      }).join('') + '</tbody>';

    QT.msg($('#msg'), '', 'ok');
  }

  ['#value', '#base', '#custom'].forEach(function (s) {
    $(s).addEventListener('input', QT.debounce(render, 140));
    $(s).addEventListener('change', render);
  });
  render();
}
