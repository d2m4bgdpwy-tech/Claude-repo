export const meta = {
  slug: 'uuid-generator',
  weight: 20,  /* order within its category — lower comes first */
  title: 'UUID Generator (v4, v7 and NIL)',
  shortTitle: 'UUID Generator',
  h1: 'UUID Generator — v4, v7 and NIL',
  category: 'Generators',
  icon: 'ID',
  description: 'Generate random UUID v4s, time-ordered UUID v7s, ULIDs and NanoIDs in bulk. Uses your browser\'s crypto RNG — nothing touches a server.',
  keywords: ['uuid generator', 'guid generator', 'uuid v4', 'uuid v7', 'random uuid', 'ulid generator', 'nanoid generator', 'bulk uuid'],
  intro: 'Generate one identifier or ten thousand. UUID v4 for pure randomness, UUID v7 or ULID when you want IDs that sort by creation time (much kinder to your database index), or NanoID when you need something short enough for a URL.',
  related: ['password-generator', 'hash-generator', 'unix-timestamp-converter'],
  html: `
<div class="panel">
  <div class="row row--tight" style="margin-bottom:14px">
    <label class="lbl" for="kind">Format</label>
    <select id="kind" style="width:auto">
      <option value="v4">UUID v4 — random</option>
      <option value="v7">UUID v7 — time-ordered</option>
      <option value="ulid">ULID — time-ordered, 26 chars</option>
      <option value="nano">NanoID — 21 chars, URL-safe</option>
      <option value="nil">NIL UUID — all zeros</option>
    </select>
    <label class="lbl" for="count">How many</label>
    <select id="count" style="width:auto">
      <option>1</option><option selected>10</option><option>50</option>
      <option>100</option><option>1000</option><option>10000</option>
    </select>
    <label class="check"><input type="checkbox" id="upper"> Uppercase</label>
    <label class="check"><input type="checkbox" id="braces"> Wrap in {braces}</label>
    <label class="check"><input type="checkbox" id="quotes"> Quote &amp; comma-separate</label>
  </div>
  <div class="btns">
    <button class="btn btn--primary" id="gen">Generate</button>
    <button class="btn" data-copy="#out">Copy all</button>
    <button class="btn" data-download="#out" data-filename="uuids.txt">Download .txt</button>
  </div>
  <div class="field">
    <label for="out">Output</label>
    <textarea id="out" readonly spellcheck="false" style="min-height:280px"></textarea>
  </div>
  <div id="msg" class="msg"></div>
</div>`,
  faq: [
    { q: 'What is the difference between v4 and v7?', a: 'A v4 UUID is 122 bits of pure randomness. A v7 UUID puts a millisecond timestamp in the leading bits and fills the rest with randomness, so v7s generated later always sort after earlier ones. That makes v7 far better as a primary key: random v4s scatter inserts across a B-tree index and fragment it.' },
    { q: 'Will these collide?', a: 'Practically, no. A v4 UUID has 2<sup>122</sup> possibilities; you would need to generate about 2.7 × 10<sup>18</sup> of them before a collision became likely at 50%. Your database will fail for other reasons first.' },
    { q: 'ULID or UUID v7?', a: 'They solve the same problem. ULIDs are shorter (26 Crockford base-32 characters) and more pleasant in a URL; UUID v7 is a standard, is 128 bits like every other UUID, and drops into any <code>uuid</code> column unchanged. If your database has a UUID type, use v7.' },
    { q: 'Are these cryptographically secure?', a: 'The random portion comes from <code>crypto.getRandomValues()</code>, so yes, they are unpredictable. But note that v7 and ULID deliberately leak their creation time — do not use them where the timing is a secret.' },
    { q: 'Can I use these as session tokens?', a: 'A v4 UUID is unguessable enough, but a purpose-made token from the password generator is a better habit — it makes the intent obvious and the length adjustable.' }
  ]
};

export function client(root, QT) {
  var $ = function (s) { return root.querySelector(s); };
  var HEX = '0123456789abcdef';
  var CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  var NANO = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';

  function bytes(n) {
    var b = new Uint8Array(n);
    crypto.getRandomValues(b);
    return b;
  }
  function hex(b) {
    var s = '';
    for (var i = 0; i < b.length; i++) s += HEX[b[i] >> 4] + HEX[b[i] & 15];
    return s;
  }
  function dash(h) {
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20, 32);
  }

  function v4() {
    if (crypto.randomUUID) return crypto.randomUUID();
    var b = bytes(16);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    return dash(hex(b));
  }

  /* RFC 9562 v7 with the monotonic-counter option: within a single millisecond
     the 12-bit rand_a field counts up, so a burst of IDs still sorts in
     creation order instead of scattering randomly. */
  var lastMs = 0, counter = 0;
  function v7() {
    var b = bytes(16);
    var ts = Date.now();
    if (ts === lastMs) {
      counter++;
      if (counter > 0xfff) { ts = ++lastMs; counter = 0; }   /* overflow: borrow a ms */
    } else {
      lastMs = ts;
      /* seed low so there is room to count up inside this millisecond */
      counter = ((b[6] << 8 | b[7]) & 0xfff) >>> 2;
    }
    /* 48-bit big-endian millisecond timestamp */
    b[0] = Math.floor(ts / 1099511627776) & 0xff;
    b[1] = Math.floor(ts / 4294967296) & 0xff;
    b[2] = Math.floor(ts / 16777216) & 0xff;
    b[3] = Math.floor(ts / 65536) & 0xff;
    b[4] = Math.floor(ts / 256) & 0xff;
    b[5] = ts & 0xff;
    b[6] = 0x70 | ((counter >> 8) & 0x0f);   /* version 7 + high 4 bits of rand_a */
    b[7] = counter & 0xff;                   /* low 8 bits of rand_a */
    b[8] = (b[8] & 0x3f) | 0x80;             /* RFC 4122 variant */
    return dash(hex(b));
  }

  function ulid() {
    var ts = Date.now(), time = '';
    for (var i = 9; i >= 0; i--) { time = CROCKFORD[ts % 32] + time; ts = Math.floor(ts / 32); }
    var rand = '', b = bytes(16);
    for (var j = 0; j < 16; j++) rand += CROCKFORD[b[j] % 32];
    return time + rand;
  }

  function nano() {
    var b = bytes(21), s = '';
    for (var i = 0; i < 21; i++) s += NANO[b[i] & 63];
    return s;
  }

  function generate() {
    var kind = $('#kind').value, n = Number($('#count').value);
    var make = { v4: v4, v7: v7, ulid: ulid, nano: nano, nil: function () { return '00000000-0000-0000-0000-000000000000'; } }[kind];
    var t0 = performance.now();
    var list = new Array(n);
    for (var i = 0; i < n; i++) {
      var id = make();
      if ($('#upper').checked) id = id.toUpperCase();
      else if (kind === 'ulid') id = id;
      if ($('#braces').checked) id = '{' + id + '}';
      if ($('#quotes').checked) id = '"' + id + '"' + (i < n - 1 ? ',' : '');
      list[i] = id;
    }
    $('#out').value = list.join('\n');
    QT.msg($('#msg'), n.toLocaleString() + ' generated in ' + (performance.now() - t0).toFixed(1) + ' ms, entirely on this device.', 'ok');
  }

  $('#gen').addEventListener('click', generate);
  ['#kind', '#count', '#upper', '#braces', '#quotes'].forEach(function (s) {
    $(s).addEventListener('change', generate);
  });
  generate();
}
