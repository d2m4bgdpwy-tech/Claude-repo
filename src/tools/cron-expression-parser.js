export const meta = {
  slug: 'cron-expression-parser',
  title: 'Cron Expression Parser & Next Run Times',
  shortTitle: 'Cron Parser',
  h1: 'Cron Expression Parser',
  category: 'Time & Numbers',
  icon: '*',
  description: 'Explain any cron expression in plain English and see the next run times. Supports 5 and 6 field crontabs, ranges, steps and named days.',
  keywords: ['cron expression parser', 'crontab generator', 'cron schedule explained', 'next cron run time', 'cron syntax checker', 'crontab guru alternative'],
  intro: 'Paste a crontab line to get a plain-English description and the next ten times it will fire. Supports the standard five fields, an optional seconds field, ranges, steps, lists and named months and weekdays.',
  related: ['unix-timestamp-converter', 'regex-tester', 'number-base-converter'],
  html: `
<div class="panel">
  <div class="field">
    <label for="expr">Cron expression</label>
    <input type="text" id="expr" spellcheck="false" value="0 9 * * 1-5"
      style="font-family:var(--mono);font-size:1.15rem" placeholder="0 9 * * 1-5">
  </div>
  <div class="btns">
    <button class="btn btn--sm btn--ghost js-ex" data-v="*/5 * * * *">every 5 min</button>
    <button class="btn btn--sm btn--ghost js-ex" data-v="0 * * * *">hourly</button>
    <button class="btn btn--sm btn--ghost js-ex" data-v="0 0 * * *">daily</button>
    <button class="btn btn--sm btn--ghost js-ex" data-v="0 9 * * 1-5">weekdays 9am</button>
    <button class="btn btn--sm btn--ghost js-ex" data-v="30 2 1 * *">monthly</button>
    <button class="btn btn--sm btn--ghost js-ex" data-v="0 0 1 1 *">yearly</button>
  </div>
  <div id="desc" style="font-size:1.15rem;font-weight:600;margin:14px 0"></div>
  <div id="msg" class="msg"></div>
</div>

<div class="io">
  <div class="panel">
    <h3>Fields</h3>
    <div class="scroll-x"><table class="data" id="fields"></table></div>
  </div>
  <div class="panel">
    <h3>Next 10 runs <span class="hint" id="tz"></span></h3>
    <div class="scroll-x"><table class="data" id="runs"></table></div>
  </div>
</div>

<div class="panel">
  <h3>Syntax reference</h3>
  <div class="scroll-x"><table class="data">
    <thead><tr><th>Symbol</th><th>Meaning</th><th>Example</th></tr></thead>
    <tbody>
      <tr><td>*</td><td style="font-family:var(--sans)">every value</td><td>* * * * * — every minute</td></tr>
      <tr><td>,</td><td style="font-family:var(--sans)">list of values</td><td>0 9,17 * * * — at 09:00 and 17:00</td></tr>
      <tr><td>-</td><td style="font-family:var(--sans)">range</td><td>0 9-17 * * * — hourly from 09:00 to 17:00</td></tr>
      <tr><td>/</td><td style="font-family:var(--sans)">step</td><td>*/15 * * * * — every 15 minutes</td></tr>
      <tr><td>MON-SUN</td><td style="font-family:var(--sans)">named weekday</td><td>0 9 * * MON-FRI</td></tr>
      <tr><td>JAN-DEC</td><td style="font-family:var(--sans)">named month</td><td>0 0 1 JAN *</td></tr>
    </tbody>
  </table></div>
</div>`,
  faq: [
    { q: 'Five fields or six?', a: 'Standard Unix cron uses five: minute, hour, day of month, month, day of week. Quartz, Spring and some cloud schedulers prepend a seconds field for six. This parser accepts both and tells you which it detected.' },
    { q: 'What happens when both day-of-month and day-of-week are set?', a: 'This trips people up constantly: cron treats them as OR, not AND. <code>0 0 1 * MON</code> runs on the 1st of the month <em>and</em> every Monday, not only on Mondays that fall on the 1st. If either field is <code>*</code>, the other simply applies.' },
    { q: 'Which time zone do the run times use?', a: 'Your browser\'s local time zone, shown above the table. Real cron uses the server\'s time zone, and most cloud schedulers default to UTC — a difference that has caused more incidents than it should have.' },
    { q: 'Is 0 or 7 Sunday?', a: 'Both. In the day-of-week field, 0 and 7 mean Sunday, and 1 to 6 are Monday to Saturday. Named forms (SUN, MON…) are clearer and worth using.' },
    { q: 'Why does */5 in the hours field not mean "every 5 hours from now"?', a: 'Steps are counted from the start of the field\'s range, not from the current time. <code>0 */5 * * *</code> fires at 00:00, 05:00, 10:00, 15:00 and 20:00 — and then the gap to midnight is four hours, not five.' }
  ]
};

export function client(root, QT) {
  var $ = function (s) { return root.querySelector(s); };
  var DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
             'August', 'September', 'October', 'November', 'December'];
  var NAMES = {
    dow: { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 },
    month: { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 }
  };

  var ALIASES = {
    '@yearly': '0 0 1 1 *', '@annually': '0 0 1 1 *', '@monthly': '0 0 1 * *',
    '@weekly': '0 0 * * 0', '@daily': '0 0 * * *', '@midnight': '0 0 * * *', '@hourly': '0 * * * *'
  };

  function parseField(spec, min, max, names) {
    var out = [];
    var parts = spec.split(',');
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i].trim();
      var step = 1;
      var slash = part.indexOf('/');
      if (slash > -1) {
        step = parseInt(part.slice(slash + 1), 10);
        part = part.slice(0, slash);
        if (!(step > 0)) throw new Error('Step must be a positive number in "' + parts[i] + '".');
      }
      var lo, hi;
      if (part === '*' || part === '?') { lo = min; hi = max; }
      else if (part.indexOf('-') > 0) {
        var seg = part.split('-');
        lo = resolve(seg[0], names); hi = resolve(seg[1], names);
      } else {
        lo = hi = resolve(part, names);
        if (slash > -1) hi = max;
      }
      if (isNaN(lo) || isNaN(hi)) throw new Error('"' + parts[i] + '" is not a valid value.');
      if (lo < min || hi > max) throw new Error('"' + parts[i] + '" is outside the allowed range ' + min + '–' + max + '.');
      if (lo > hi) throw new Error('"' + parts[i] + '" has its range the wrong way round.');
      for (var v = lo; v <= hi; v += step) out.push(v);
    }
    return out.filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; });
  }

  function resolve(token, names) {
    var t = String(token).trim().toLowerCase();
    if (names && names[t] !== undefined) return names[t];
    return parseInt(t, 10);
  }

  function parse(expr) {
    var e = expr.trim().toLowerCase();
    if (ALIASES[e]) e = ALIASES[e];
    if (e === '@reboot') throw new Error('@reboot runs at startup and has no schedule to predict.');
    var f = e.split(/\s+/);
    var seconds = null;
    if (f.length === 6) { seconds = f.shift(); }
    else if (f.length !== 5) {
      throw new Error('Expected 5 fields (minute hour day month weekday), or 6 with a leading seconds field. Got ' + f.length + '.');
    }
    var dowRaw = parseField(f[4], 0, 7, NAMES.dow).map(function (d) { return d === 7 ? 0 : d; });
    return {
      seconds: seconds === null ? null : parseField(seconds, 0, 59, null),
      minute: parseField(f[0], 0, 59, null),
      hour: parseField(f[1], 0, 23, null),
      dom: parseField(f[2], 1, 31, null),
      month: parseField(f[3], 1, 12, NAMES.month),
      dow: dowRaw.filter(function (v, i, a) { return a.indexOf(v) === i; }),
      raw: f,
      domAll: /^[*?]$/.test(f[2]),
      dowAll: /^[*?]$/.test(f[4])
    };
  }

  function listPhrase(values, all, fmt, everyLabel) {
    if (all) return 'every ' + everyLabel;
    var named = values.map(fmt);
    if (named.length === 1) return named[0];
    if (named.length === 2) return named[0] + ' and ' + named[1];
    if (named.length > 6) return named.length + ' values';
    return named.slice(0, -1).join(', ') + ' and ' + named[named.length - 1];
  }

  function step(values, max) {
    if (values.length < 3) return null;
    var d = values[1] - values[0];
    for (var i = 2; i < values.length; i++) if (values[i] - values[i - 1] !== d) return null;
    return values[0] === 0 && values[values.length - 1] + d > max ? d : null;
  }

  function describe(c) {
    var pad = function (n) { return ('0' + n).slice(-2); };
    var time;
    var minStep = step(c.minute, 59), hourStep = step(c.hour, 23);
    var minAll = /^[*]$/.test(c.raw[0]), hourAll = /^[*]$/.test(c.raw[1]);

    if (minAll && hourAll) time = 'Every minute';
    else if (minStep && hourAll) time = 'Every ' + minStep + ' minutes';
    else if (minAll) time = 'Every minute during ' + listPhrase(c.hour, false, function (h) { return pad(h) + ':00'; }, 'hour');
    else if (hourAll) time = 'At ' + listPhrase(c.minute, false, function (m) { return 'minute ' + m; }, 'minute') + ' of every hour';
    else if (hourStep) time = 'At ' + pad(c.minute[0]) + ' minutes past every ' + hourStep + 'th hour';
    else {
      var times = [];
      for (var h = 0; h < c.hour.length && times.length < 8; h++) {
        for (var m = 0; m < c.minute.length && times.length < 8; m++) {
          times.push(pad(c.hour[h]) + ':' + pad(c.minute[m]));
        }
      }
      var total = c.hour.length * c.minute.length;
      time = 'At ' + times.join(', ') + (total > times.length ? ' and ' + (total - times.length) + ' more' : '');
    }

    var parts = [time];
    if (!c.dowAll) parts.push('on ' + listPhrase(c.dow, false, function (d) { return DOW[d]; }, 'day'));
    if (!c.domAll) {
      parts.push((c.dowAll ? 'on ' : 'and on ') + 'day ' +
        listPhrase(c.dom, false, function (d) { return String(d); }, 'day') + ' of the month');
    }
    if (!/^[*]$/.test(c.raw[3])) parts.push('in ' + listPhrase(c.month, false, function (m) { return MON[m - 1]; }, 'month'));
    return parts.join(' ') + '.';
  }

  function nextRuns(c, count) {
    var out = [];
    var d = new Date();
    d.setSeconds(0, 0);
    d.setMinutes(d.getMinutes() + 1);
    var guard = 0;
    while (out.length < count && guard++ < 500000) {
      var month = d.getMonth() + 1;
      if (c.month.indexOf(month) === -1) {
        d.setMonth(d.getMonth() + 1, 1); d.setHours(0, 0, 0, 0); continue;
      }
      var domOk = c.dom.indexOf(d.getDate()) > -1;
      var dowOk = c.dow.indexOf(d.getDay()) > -1;
      /* cron ORs the two day fields unless one is a wildcard */
      var dayOk = (c.domAll && c.dowAll) ? true
        : c.domAll ? dowOk
        : c.dowAll ? domOk
        : (domOk || dowOk);
      if (!dayOk) { d.setDate(d.getDate() + 1); d.setHours(0, 0, 0, 0); continue; }
      if (c.hour.indexOf(d.getHours()) === -1) { d.setHours(d.getHours() + 1, 0, 0, 0); continue; }
      if (c.minute.indexOf(d.getMinutes()) === -1) { d.setMinutes(d.getMinutes() + 1, 0, 0); continue; }
      out.push(new Date(d.getTime()));
      d.setMinutes(d.getMinutes() + 1);
    }
    return out;
  }

  function relative(d) {
    var diff = d.getTime() - Date.now();
    var mins = Math.round(diff / 60000);
    if (mins < 60) return 'in ' + mins + ' min';
    if (mins < 1440) return 'in ' + Math.round(mins / 60) + ' h';
    return 'in ' + Math.round(mins / 1440) + ' days';
  }

  function run() {
    var expr = $('#expr').value;
    if (!expr.trim()) { $('#desc').textContent = ''; QT.msg($('#msg'), ''); return; }
    var c;
    try { c = parse(expr); }
    catch (e) {
      $('#desc').textContent = '';
      $('#fields').innerHTML = ''; $('#runs').innerHTML = '';
      QT.msg($('#msg'), e.message, 'err');
      return;
    }
    $('#desc').textContent = describe(c);
    QT.msg($('#msg'), c.seconds ? 'Six-field expression — the seconds field is shown but not used for the run times below.' : '', c.seconds ? 'warn' : 'ok');

    var summarize = function (vals) {
      if (vals.length > 12) return vals.slice(0, 12).join(', ') + '… (' + vals.length + ')';
      return vals.join(', ');
    };
    var fieldRows = [
      ['Minute', c.raw[0], summarize(c.minute)],
      ['Hour', c.raw[1], summarize(c.hour)],
      ['Day of month', c.raw[2], summarize(c.dom)],
      ['Month', c.raw[3], c.month.map(function (m) { return MON[m - 1].slice(0, 3); }).join(', ')],
      ['Day of week', c.raw[4], c.dow.map(function (d) { return DOW[d].slice(0, 3); }).join(', ')]
    ];
    $('#fields').innerHTML = '<thead><tr><th>Field</th><th>Value</th><th>Matches</th></tr></thead><tbody>' +
      fieldRows.map(function (r) {
        return '<tr><td style="font-family:var(--sans)">' + r[0] + '</td><td><strong>' + r[1] + '</strong></td><td>' + r[2] + '</td></tr>';
      }).join('') + '</tbody>';

    $('#tz').textContent = '(' + Intl.DateTimeFormat().resolvedOptions().timeZone + ')';
    var runs = nextRuns(c, 10);
    $('#runs').innerHTML = runs.length
      ? '<tbody>' + runs.map(function (d) {
          return '<tr><td>' + d.toLocaleString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) +
            '</td><td style="color:var(--fg-faint)">' + relative(d) + '</td></tr>';
        }).join('') + '</tbody>'
      : '<tbody><tr><td class="hint">This expression never matches a real date — check the day and month combination.</td></tr></tbody>';
  }

  $('#expr').addEventListener('input', QT.debounce(run, 220));
  QT.$$('.js-ex', root).forEach(function (b) {
    b.addEventListener('click', function () { $('#expr').value = b.getAttribute('data-v'); run(); });
  });
  run();
}
