export const meta = {
  slug: 'color-converter',
  title: 'Color Converter — HEX, RGB, HSL, OKLCH',
  shortTitle: 'Color Converter',
  h1: 'Colour Converter and Contrast Checker',
  category: 'Time & Numbers',
  icon: '◐',
  description: 'Convert colours between HEX, RGB, HSL, HWB and OKLCH, generate tints and shades, and check WCAG contrast — all in your browser.',
  keywords: ['hex to rgb', 'rgb to hex', 'color converter', 'hsl converter', 'oklch converter', 'wcag contrast checker', 'color picker'],
  intro: 'Type a colour in any notation and get every other notation back, plus a generated tint and shade scale and a WCAG contrast check against white and black. Handy when a designer hands you HSL and your codebase wants hex.',
  related: ['image-converter', 'number-base-converter', 'qr-code-generator'],
  html: `
<div class="panel">
  <div class="row">
    <div class="field" style="flex:1 1 240px">
      <label for="input">Colour — any notation</label>
      <input type="text" id="input" spellcheck="false" value="#6ee7b7"
        placeholder="#6ee7b7 · rgb(110 231 183) · hsl(157 71% 67%) · rebeccapurple">
    </div>
    <div class="field" style="flex:0 0 90px">
      <label for="picker">Pick</label>
      <input type="color" id="picker" value="#6ee7b7">
    </div>
    <div class="field" style="flex:0 0 auto">
      <label>&nbsp;</label>
      <button class="btn" id="random">Random</button>
    </div>
  </div>
  <div id="swatch" style="height:88px;border-radius:12px;border:1px solid var(--line);margin-bottom:14px"></div>
  <div class="scroll-x"><table class="data" id="formats"></table></div>
  <div id="msg" class="msg"></div>
</div>

<div class="panel">
  <h3>Contrast</h3>
  <div id="contrast"></div>
</div>

<div class="panel">
  <h3>Tints and shades</h3>
  <div id="scale" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(72px,1fr));gap:6px"></div>
  <p class="hint" style="margin-top:10px">Click any swatch to copy its hex value.</p>
</div>`,
  faq: [
    { q: 'What is OKLCH and should I use it?', a: 'A perceptually uniform colour space now supported by every major browser. Its lightness value corresponds to what your eye actually sees, so a palette built by varying L stays visually even — unlike HSL, where yellow at 50% lightness looks far brighter than blue at 50%.' },
    { q: 'What do the contrast numbers mean?', a: 'The WCAG contrast ratio between two colours, from 1:1 (identical) to 21:1 (black on white). AA requires 4.5:1 for body text and 3:1 for large text or UI components; AAA requires 7:1. Anything under 3:1 is hard to read for a lot of people.' },
    { q: 'Why does the hex of my HSL colour look slightly off?', a: 'HSL to RGB conversion involves rounding to 8-bit integers per channel, so a round trip can shift a value by one. It is imperceptible, but it is why you should keep one canonical notation in your codebase rather than converting back and forth.' },
    { q: 'What is the alpha channel in #RRGGBBAA?', a: 'The last two hex digits are opacity, from <code>00</code> (transparent) to <code>FF</code> (opaque). Supported in every current browser and a compact alternative to <code>rgba()</code>.' }
  ]
};

export function client(root, QT) {
  var $ = function (s) { return root.querySelector(s); };
  var current = { r: 110, g: 231, b: 183, a: 1 };

  function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }
  function hex2(n) { return ('0' + Math.round(clamp(n, 0, 255)).toString(16)).slice(-2); }

  function parse(str) {
    var s = str.trim();
    if (!s) return null;
    /* let the browser resolve named colours and anything exotic */
    var probe = document.createElement('span');
    probe.style.color = '';
    probe.style.color = s;
    if (!probe.style.color) {
      /* bare hex without # */
      if (/^[0-9a-f]{3,8}$/i.test(s)) { probe.style.color = '#' + s; }
      if (!probe.style.color) return null;
    }
    document.body.appendChild(probe);
    var computed = getComputedStyle(probe).color;
    document.body.removeChild(probe);
    var m = /rgba?\(([^)]+)\)/.exec(computed);
    if (!m) return null;
    var parts = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  }

  function toHsl(c) {
    var r = c.r / 255, g = c.g / 255, b = c.b / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return { h: h, s: s * 100, l: l * 100 };
  }

  function toHwb(c) {
    var hsl = toHsl(c);
    var w = Math.min(c.r, c.g, c.b) / 255 * 100;
    var bl = 100 - Math.max(c.r, c.g, c.b) / 255 * 100;
    return { h: hsl.h, w: w, b: bl };
  }

  /* sRGB -> linear -> OKLab -> OKLCH (Björn Ottosson's constants) */
  function toOklch(c) {
    function lin(u) { u /= 255; return u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4); }
    var r = lin(c.r), g = lin(c.g), b = lin(c.b);
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    var L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
    var A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
    var B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
    var C = Math.sqrt(A * A + B * B);
    var H = C < 1e-6 ? 0 : (Math.atan2(B, A) * 180 / Math.PI + 360) % 360;
    return { l: L * 100, c: C, h: H };
  }

  function luminance(c) {
    function lin(u) { u /= 255; return u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4); }
    return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  }
  function contrast(a, b) {
    var l1 = luminance(a), l2 = luminance(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  function mix(c, target, t) {
    return {
      r: c.r + (target - c.r) * t,
      g: c.g + (target - c.g) * t,
      b: c.b + (target - c.b) * t,
      a: c.a
    };
  }

  function hexOf(c) {
    return '#' + hex2(c.r) + hex2(c.g) + hex2(c.b) + (c.a < 1 ? hex2(c.a * 255) : '');
  }

  function render(c) {
    current = c;
    var hsl = toHsl(c), hwb = toHwb(c), ok = toOklch(c);
    var r1 = function (n) { return Math.round(n); };
    var hexv = hexOf(c);

    $('#swatch').style.background = hexv;
    if (/^#[0-9a-f]{6}$/i.test(hexv)) $('#picker').value = hexv;

    var rows = [
      ['HEX', hexv.toUpperCase()],
      ['RGB', 'rgb(' + r1(c.r) + ' ' + r1(c.g) + ' ' + r1(c.b) + (c.a < 1 ? ' / ' + c.a : '') + ')'],
      ['RGB (legacy)', 'rgb(' + r1(c.r) + ', ' + r1(c.g) + ', ' + r1(c.b) + ')'],
      ['HSL', 'hsl(' + r1(hsl.h) + ' ' + r1(hsl.s) + '% ' + r1(hsl.l) + '%' + (c.a < 1 ? ' / ' + c.a : '') + ')'],
      ['HWB', 'hwb(' + r1(hwb.h) + ' ' + r1(hwb.w) + '% ' + r1(hwb.b) + '%)'],
      ['OKLCH', 'oklch(' + ok.l.toFixed(1) + '% ' + ok.c.toFixed(3) + ' ' + r1(ok.h) + ')'],
      ['CSS variable', '--color: ' + hexv.toUpperCase() + ';'],
      ['Android', '0xFF' + hex2(c.r).toUpperCase() + hex2(c.g).toUpperCase() + hex2(c.b).toUpperCase()],
      ['Swift', 'UIColor(red: ' + (c.r / 255).toFixed(3) + ', green: ' + (c.g / 255).toFixed(3) +
        ', blue: ' + (c.b / 255).toFixed(3) + ', alpha: 1)']
    ];

    $('#formats').innerHTML = '<tbody>' + rows.map(function (r) {
      return '<tr><th style="width:130px;font-family:var(--sans)">' + r[0] + '</th><td>' + r[1] +
        '</td><td style="width:76px"><button class="btn btn--sm js-c" type="button" data-v="' +
        r[1].replace(/"/g, '&quot;') + '">Copy</button></td></tr>';
    }).join('') + '</tbody>';
    QT.$$('.js-c', root).forEach(function (b) {
      b.addEventListener('click', function () { QT.copy(b.getAttribute('data-v')); });
    });

    var white = { r: 255, g: 255, b: 255 }, black = { r: 0, g: 0, b: 0 };
    var cw = contrast(c, white), cb = contrast(c, black);
    function grade(ratio) {
      if (ratio >= 7) return ['AAA', 'ok'];
      if (ratio >= 4.5) return ['AA', 'ok'];
      if (ratio >= 3) return ['AA large text only', 'warn'];
      return ['fails WCAG', 'err'];
    }
    $('#contrast').innerHTML = [[white, 'White', cw], [black, 'Black', cb]].map(function (p) {
      var g = grade(p[2]);
      var col = g[1] === 'ok' ? 'var(--accent)' : g[1] === 'warn' ? 'var(--warn)' : 'var(--err)';
      return '<div style="display:flex;align-items:center;gap:14px;margin-bottom:10px">' +
        '<div style="flex:0 0 150px;height:52px;border-radius:8px;border:1px solid var(--line);' +
        'background:' + hexv + ';color:' + hexOf(p[0]) + ';display:grid;place-items:center;font-weight:600">Sample</div>' +
        '<div><strong style="font-size:1.15rem">' + p[2].toFixed(2) + ':1</strong> on ' + p[1] +
        '<br><span style="color:' + col + ';font-size:.87rem">' + g[0] + '</span></div></div>';
    }).join('');

    var steps = [0.9, 0.75, 0.6, 0.45, 0.3, 0.15, 0, 0.15, 0.3, 0.45, 0.6, 0.75];
    $('#scale').innerHTML = steps.map(function (t, i) {
      var col = i < 6 ? mix(c, 255, t) : i === 6 ? c : mix(c, 0, t);
      var h = hexOf(col).toUpperCase();
      var label = i < 6 ? (100 * (6 - i)) : i === 6 ? 'base' : (100 * (i - 5) + 500);
      return '<button type="button" class="js-sw" data-v="' + h + '" style="border:1px solid var(--line);' +
        'border-radius:8px;overflow:hidden;cursor:pointer;background:none;padding:0;font:inherit">' +
        '<span style="display:block;height:48px;background:' + h + '"></span>' +
        '<span style="display:block;font-size:.68rem;padding:4px 2px;color:var(--fg-faint);font-family:var(--mono)">' +
        h.slice(1) + '</span></button>';
    }).join('');
    QT.$$('.js-sw', root).forEach(function (b) {
      b.addEventListener('click', function () { QT.copy(b.getAttribute('data-v')); });
    });

    QT.msg($('#msg'), '');
  }

  function fromInput() {
    var c = parse($('#input').value);
    if (!c) { QT.msg($('#msg'), 'Could not read that colour. Try #6ee7b7, rgb(110 231 183), hsl(157 71% 67%) or a CSS colour name.', 'err'); return; }
    render(c);
  }

  $('#input').addEventListener('input', QT.debounce(fromInput, 160));
  $('#picker').addEventListener('input', function () {
    $('#input').value = this.value;
    fromInput();
  });
  $('#random').addEventListener('click', function () {
    var b = new Uint8Array(3);
    crypto.getRandomValues(b);
    $('#input').value = '#' + hex2(b[0]) + hex2(b[1]) + hex2(b[2]);
    fromInput();
  });
  fromInput();
}
