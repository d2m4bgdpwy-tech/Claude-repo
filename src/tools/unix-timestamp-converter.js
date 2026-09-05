export const meta = {
  slug: 'unix-timestamp-converter',
  weight: 10,  /* order within its category — lower comes first */
  title: 'Unix Timestamp Converter',
  shortTitle: 'Timestamp',
  h1: 'Unix Timestamp Converter',
  category: 'Time & Numbers',
  icon: '⏱',
  description: 'Convert Unix epoch timestamps to human dates and back, in any time zone, with ISO 8601 and relative time. Live clock, works offline.',
  keywords: ['unix timestamp converter', 'epoch converter', 'timestamp to date', 'date to timestamp', 'iso 8601 converter', 'milliseconds to date'],
  intro: 'Convert between Unix timestamps and readable dates in whichever time zone you need. Handles seconds, milliseconds, microseconds and nanoseconds, and shows the ISO 8601, RFC 2822 and relative forms side by side.',
  related: ['cron-expression-parser', 'uuid-generator', 'number-base-converter', 'jwt-decoder'],
  html: `
<div class="panel">
  <div class="row" style="align-items:center">
    <div>
      <span class="lbl">Current Unix time</span>
      <div style="font-family:var(--mono);font-size:1.8rem;letter-spacing:-.02em" id="now">—</div>
      <div class="hint" id="now-iso">—</div>
    </div>
    <div style="flex:0 0 auto">
      <button class="btn btn--sm" id="copy-now">Copy</button>
      <button class="btn btn--sm btn--ghost" id="pause">Pause</button>
    </div>
  </div>
</div>

<div class="panel">
  <h3>Timestamp → date</h3>
  <div class="row">
    <div class="field" style="flex:1 1 240px">
      <label for="ts">Unix timestamp</label>
      <input type="text" id="ts" spellcheck="false" placeholder="1735689600">
    </div>
    <div class="field" style="flex:0 0 190px">
      <label for="unit">Unit</label>
      <select id="unit">
        <option value="auto">Detect automatically</option>
        <option value="s">Seconds</option>
        <option value="ms">Milliseconds</option>
        <option value="us">Microseconds</option>
        <option value="ns">Nanoseconds</option>
      </select>
    </div>
  </div>
  <div class="scroll-x"><table class="data" id="ts-out"></table></div>
  <div id="msg" class="msg"></div>
</div>

<div class="panel">
  <h3>Date → timestamp</h3>
  <div class="row">
    <div class="field" style="flex:1 1 240px">
      <label for="date">Date and time</label>
      <input type="text" id="date" spellcheck="false" placeholder="2026-01-01 09:30:00  ·  or 'tomorrow', 'in 3 days'">
    </div>
    <div class="field" style="flex:0 0 220px">
      <label for="tz">Interpret in</label>
      <select id="tz">
        <option value="local">Your local time zone</option>
        <option value="utc">UTC</option>
      </select>
    </div>
  </div>
  <div class="scroll-x"><table class="data" id="date-out"></table></div>
  <div id="msg2" class="msg"></div>
</div>`,
  faq: [
    { q: 'What is a Unix timestamp?', a: 'The number of seconds elapsed since 00:00:00 UTC on 1 January 1970, ignoring leap seconds. Because it is a single integer with no time zone attached, it is the least ambiguous way to record an instant.' },
    { q: 'Seconds or milliseconds?', a: 'Unix conventionally uses seconds (10 digits until the year 2286). JavaScript\'s <code>Date.now()</code> and most JSON APIs use milliseconds (13 digits). This tool guesses from the magnitude, but you can force the unit.' },
    { q: 'What is the year 2038 problem?', a: 'A signed 32-bit integer counting seconds overflows on 19 January 2038, wrapping to 1901. Modern systems use 64-bit time, but embedded devices, old file formats and unmigrated databases still carry the bug.' },
    { q: 'Why does my date shift by an hour?', a: 'Daylight saving. A local date is only meaningful with its offset, and that offset changes twice a year. This is exactly why servers store UTC and convert at the edges — and why you should too.' },
    { q: 'Which format should I use in an API?', a: 'ISO 8601 with an explicit offset (<code>2026-01-01T09:30:00Z</code>). It sorts correctly as a string, is unambiguous, and is readable in a log without a converter.' }
  ]
};

export function client(root, QT) {
  var $ = function (s) { return root.querySelector(s); };
  var paused = false;

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function relative(d) {
    var diff = d.getTime() - Date.now(), abs = Math.abs(diff);
    var units = [[31536000000, 'year'], [2592000000, 'month'], [604800000, 'week'],
                 [86400000, 'day'], [3600000, 'hour'], [60000, 'minute'], [1000, 'second']];
    for (var i = 0; i < units.length; i++) {
      if (abs >= units[i][0] || i === units.length - 1) {
        var n = Math.round(abs / units[i][0]);
        var s = n + ' ' + units[i][1] + (n === 1 ? '' : 's');
        return diff < 0 ? s + ' ago' : 'in ' + s;
      }
    }
    return 'now';
  }

  function table(el, rows) {
    el.innerHTML = '<tbody>' + rows.map(function (r) {
      return '<tr><th style="width:180px;font-family:var(--sans)">' + r[0] + '</th>' +
        '<td>' + esc(r[1]) + '</td>' +
        '<td style="width:76px"><button class="btn btn--sm js-c" type="button" data-v="' +
        esc(r[1]).replace(/"/g, '&quot;') + '">Copy</button></td></tr>';
    }).join('') + '</tbody>';
    Array.prototype.forEach.call(el.querySelectorAll('.js-c'), function (b) {
      b.addEventListener('click', function () { QT.copy(b.getAttribute('data-v')); });
    });
  }

  function describe(d) {
    var offMin = -d.getTimezoneOffset();
    var sign = offMin >= 0 ? '+' : '-';
    var off = sign + ('0' + Math.floor(Math.abs(offMin) / 60)).slice(-2) + ':' + ('0' + (Math.abs(offMin) % 60)).slice(-2);
    var tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return [
      ['Unix seconds', String(Math.floor(d.getTime() / 1000))],
      ['Unix milliseconds', String(d.getTime())],
      ['ISO 8601 (UTC)', d.toISOString()],
      ['ISO 8601 (local)', new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19) + off],
      ['Local time', d.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'long' })],
      ['UTC', d.toUTCString()],
      ['Time zone', tzName + ' (UTC' + off + ')'],
      ['Relative', relative(d)],
      ['Day of year', String(Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000))],
      ['Week day', d.toLocaleDateString(undefined, { weekday: 'long' })]
    ];
  }

  function tick() {
    if (paused) return;
    var now = new Date();
    $('#now').textContent = Math.floor(now.getTime() / 1000);
    $('#now-iso').textContent = now.toISOString() + '  ·  ' + now.toLocaleString();
  }
  setInterval(tick, 1000);
  tick();

  $('#copy-now').addEventListener('click', function () { QT.copy($('#now').textContent); });
  $('#pause').addEventListener('click', function () {
    paused = !paused;
    this.textContent = paused ? 'Resume' : 'Pause';
  });

  function fromTs() {
    var raw = $('#ts').value.trim().replace(/[_,\s]/g, '');
    if (!raw) { $('#ts-out').innerHTML = ''; QT.msg($('#msg'), ''); return; }
    if (!/^-?\d+(\.\d+)?$/.test(raw)) {
      QT.msg($('#msg'), 'Enter a number. For a date, use the box below.', 'err');
      $('#ts-out').innerHTML = '';
      return;
    }
    var n = parseFloat(raw), unit = $('#unit').value, ms;
    if (unit === 'auto') {
      var digits = raw.replace(/[-.]/g, '').length;
      unit = digits <= 11 ? 's' : digits <= 14 ? 'ms' : digits <= 17 ? 'us' : 'ns';
    }
    ms = unit === 's' ? n * 1000 : unit === 'ms' ? n : unit === 'us' ? n / 1000 : n / 1e6;
    var d = new Date(ms);
    if (isNaN(d.getTime())) { QT.msg($('#msg'), 'That is outside the range of representable dates.', 'err'); return; }
    table($('#ts-out'), describe(d));
    QT.msg($('#msg'), 'Read as ' + ({ s: 'seconds', ms: 'milliseconds', us: 'microseconds', ns: 'nanoseconds' })[unit] + '.', 'ok');
  }

  function parseNatural(v) {
    var t = v.trim().toLowerCase();
    var now = new Date();
    if (t === 'now') return now;
    if (t === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (t === 'tomorrow') return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    if (t === 'yesterday') return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    var m = /^in (\d+) (second|minute|hour|day|week|month|year)s?$/.exec(t);
    var mAgo = /^(\d+) (second|minute|hour|day|week|month|year)s? ago$/.exec(t);
    var spec = m || mAgo;
    if (spec) {
      var n = Number(spec[1]) * (mAgo ? -1 : 1);
      var d = new Date(now.getTime());
      var unit = spec[2];
      if (unit === 'second') d.setSeconds(d.getSeconds() + n);
      else if (unit === 'minute') d.setMinutes(d.getMinutes() + n);
      else if (unit === 'hour') d.setHours(d.getHours() + n);
      else if (unit === 'day') d.setDate(d.getDate() + n);
      else if (unit === 'week') d.setDate(d.getDate() + n * 7);
      else if (unit === 'month') d.setMonth(d.getMonth() + n);
      else d.setFullYear(d.getFullYear() + n);
      return d;
    }
    return null;
  }

  function fromDate() {
    var v = $('#date').value.trim();
    if (!v) { $('#date-out').innerHTML = ''; QT.msg($('#msg2'), ''); return; }
    var d = parseNatural(v);
    if (!d) {
      var normalized = v.replace(' ', 'T');
      if ($('#tz').value === 'utc' && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(normalized)) normalized += 'Z';
      d = new Date(normalized);
      if (isNaN(d.getTime())) d = new Date(v);
    }
    if (!d || isNaN(d.getTime())) {
      QT.msg($('#msg2'), 'Could not read that date. Try 2026-01-01 09:30, or a phrase like "in 3 days".', 'err');
      $('#date-out').innerHTML = '';
      return;
    }
    table($('#date-out'), describe(d));
    QT.msg($('#msg2'), '', 'ok');
  }

  $('#ts').addEventListener('input', QT.debounce(fromTs, 180));
  $('#unit').addEventListener('change', fromTs);
  $('#date').addEventListener('input', QT.debounce(fromDate, 250));
  $('#tz').addEventListener('change', fromDate);
}
