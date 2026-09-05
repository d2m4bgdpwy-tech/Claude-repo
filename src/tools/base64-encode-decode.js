export const meta = {
  slug: 'base64-encode-decode',
  weight: 10,  /* order within its category — lower comes first */
  title: 'Base64 Encoder & Decoder',
  shortTitle: 'Base64',
  h1: 'Base64 Encoder and Decoder',
  category: 'Encode & Decode',
  icon: '64',
  description: 'Encode or decode Base64 text and files, including URL-safe Base64 and data URIs. Runs offline in your browser — nothing is uploaded.',
  keywords: ['base64 encode', 'base64 decode', 'base64 converter', 'base64 to text', 'image to base64', 'url safe base64', 'data uri generator'],
  intro: 'Convert text or files to Base64 and back. Unicode is handled correctly, URL-safe output is one click away, and files are turned into data URIs locally — so encoding a private key or a customer PDF does not mean handing it to a stranger.',
  related: ['url-encode-decode', 'jwt-decoder', 'hash-generator', 'html-entities'],
  html: `
<div class="panel">
  <div class="btns">
    <button class="btn btn--primary" id="encode">Encode →</button>
    <button class="btn" id="decode">← Decode</button>
    <button class="btn btn--ghost" id="swap">Swap</button>
    <button class="btn btn--ghost" data-clear="#in,#out">Clear</button>
  </div>
  <div class="row row--tight" style="margin-bottom:12px">
    <label class="check"><input type="checkbox" id="urlsafe"> URL-safe (<code>-_</code>, no padding)</label>
    <label class="check"><input type="checkbox" id="wrap"> Wrap at 76 characters</label>
  </div>
  <div class="io">
    <div class="field">
      <label for="in">Plain text</label>
      <textarea id="in" spellcheck="false" placeholder="Hello, world"></textarea>
    </div>
    <div class="field">
      <label for="out">Base64</label>
      <textarea id="out" spellcheck="false" placeholder="SGVsbG8sIHdvcmxk"></textarea>
    </div>
  </div>
  <div class="btns">
    <button class="btn btn--sm" data-copy="#out">Copy Base64</button>
    <button class="btn btn--sm" data-copy="#in">Copy text</button>
  </div>
  <div id="msg" class="msg"></div>
</div>

<div class="panel">
  <h3>Files &amp; data URIs</h3>
  <div class="drop" id="drop">
    <strong>Drop any file to Base64-encode it</strong>
    <span>images, PDFs, keys — read locally, never uploaded</span>
    <input type="file" id="file" hidden>
  </div>
  <div id="file-out" hidden style="margin-top:14px">
    <div class="field">
      <label for="datauri">Data URI</label>
      <textarea id="datauri" readonly spellcheck="false" style="min-height:120px"></textarea>
    </div>
    <div class="btns">
      <button class="btn btn--sm" data-copy="#datauri">Copy data URI</button>
      <button class="btn btn--sm" id="copy-raw">Copy Base64 only</button>
      <button class="btn btn--sm" id="copy-css">Copy as CSS background</button>
    </div>
    <div id="thumb"></div>
  </div>
</div>

<div class="panel">
  <h3>Base64 back to a file</h3>
  <div class="field">
    <label for="b64in">Paste Base64 or a data URI</label>
    <textarea id="b64in" spellcheck="false" style="min-height:110px" placeholder="data:image/png;base64,iVBORw0KGgo…"></textarea>
  </div>
  <div class="row row--tight">
    <input type="text" id="fname" value="decoded.bin" style="max-width:220px" aria-label="File name">
    <button class="btn" id="tofile">Download decoded file</button>
  </div>
  <div id="msg2" class="msg"></div>
</div>`,
  faq: [
    { q: 'Does it handle emoji and non-English text?', a: 'Yes. Plain <code>btoa()</code> throws on anything outside Latin-1; this tool encodes to UTF-8 bytes first, so Japanese, Arabic, accented characters and emoji all round-trip correctly.' },
    { q: 'What is URL-safe Base64?', a: 'A variant that replaces <code>+</code> with <code>-</code> and <code>/</code> with <code>_</code>, and usually drops the <code>=</code> padding, so the result can sit in a URL or filename without escaping. It is what JWTs use.' },
    { q: 'Is Base64 encryption?', a: 'No, and this matters. Base64 is an encoding — anyone can decode it in a second, as this page demonstrates. It exists to move binary data through text-only channels, not to hide anything. Never use it to "protect" a password or a key.' },
    { q: 'How much bigger does Base64 make my file?', a: 'About 33% — every 3 bytes become 4 characters. That is the trade-off when inlining images as data URIs: no extra HTTP request, but a larger payload that cannot be cached separately.' },
    { q: 'Is it safe to encode a private key here?', a: 'Safer than anywhere that uploads. The file is read by your own browser via the FileReader API and encoded in JavaScript on this page. No network request carries it. You can verify with your browser\'s Network panel, or simply go offline first.' }
  ]
};

export function client(root, QT) {
  var $ = function (s) { return root.querySelector(s); };
  var inEl = $('#in'), outEl = $('#out'), msg = $('#msg');

  function bytesToB64(bytes) {
    var bin = '', chunk = 0x8000;
    for (var i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(bin);
  }
  function b64ToBytes(b64) {
    var bin = atob(b64);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function normalize(b64) {
    var s = b64.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return s;
  }

  function encode() {
    var text = inEl.value;
    if (!text) { outEl.value = ''; QT.msg(msg, ''); return; }
    try {
      var b64 = bytesToB64(new TextEncoder().encode(text));
      if ($('#urlsafe').checked) b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      if ($('#wrap').checked) b64 = b64.replace(/(.{76})/g, '$1\n');
      outEl.value = b64;
      QT.msg(msg, new Blob([text]).size + ' bytes in → ' + b64.replace(/\n/g, '').length + ' characters out', 'ok');
    } catch (e) { QT.msg(msg, 'Could not encode: ' + e.message, 'err'); }
  }

  function decode() {
    var b64 = outEl.value;
    if (!b64.trim()) { inEl.value = ''; QT.msg(msg, ''); return; }
    try {
      var bytes = b64ToBytes(normalize(b64));
      inEl.value = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      QT.msg(msg, 'Decoded ' + bytes.length + ' bytes', 'ok');
    } catch (e) {
      QT.msg(msg, 'That is not valid Base64. Check for stray characters or a truncated string.', 'err');
    }
  }

  $('#encode').addEventListener('click', encode);
  $('#decode').addEventListener('click', decode);
  $('#swap').addEventListener('click', function () {
    var a = inEl.value; inEl.value = outEl.value; outEl.value = a;
  });
  inEl.addEventListener('input', QT.debounce(encode, 200));
  outEl.addEventListener('input', QT.debounce(function () {
    if (document.activeElement === outEl) decode();
  }, 300));
  $('#urlsafe').addEventListener('change', encode);
  $('#wrap').addEventListener('change', encode);

  /* --- file → base64 --- */
  var lastB64 = '', lastMime = '';
  QT.dropzone($('#drop'), $('#file'), function (files) {
    var f = files[0];
    QT.read(f, 'arrayBuffer').then(function (buf) {
      var bytes = new Uint8Array(buf);
      lastB64 = bytesToB64(bytes);
      lastMime = f.type || 'application/octet-stream';
      var uri = 'data:' + lastMime + ';base64,' + lastB64;
      $('#datauri').value = uri;
      $('#file-out').hidden = false;
      $('#fname').value = f.name;
      var thumb = $('#thumb');
      thumb.innerHTML = /^image\//.test(lastMime)
        ? '<img src="' + uri + '" alt="Preview" style="max-height:180px;border-radius:8px;margin-top:12px">'
        : '';
      QT.toast(f.name + ' → ' + QT.bytes(uri.length) + ' data URI');
    });
  });
  $('#copy-raw').addEventListener('click', function () { QT.copy(lastB64); });
  $('#copy-css').addEventListener('click', function () {
    QT.copy('background-image: url("data:' + lastMime + ';base64,' + lastB64 + '");');
  });

  /* --- base64 → file --- */
  $('#tofile').addEventListener('click', function () {
    var raw = $('#b64in').value.trim();
    var msg2 = $('#msg2');
    if (!raw) { QT.msg(msg2, 'Paste some Base64 first.', 'warn'); return; }
    var mime = 'application/octet-stream';
    var m = /^data:([^;,]+)?(;base64)?,/.exec(raw);
    if (m) { if (m[1]) mime = m[1]; raw = raw.slice(m[0].length); }
    try {
      var bytes = b64ToBytes(normalize(raw));
      QT.download($('#fname').value || 'decoded.bin', new Blob([bytes], { type: mime }));
      QT.msg(msg2, 'Decoded ' + QT.bytes(bytes.length) + ' and saved.', 'ok');
    } catch (e) {
      QT.msg(msg2, 'That does not decode as Base64.', 'err');
    }
  });
}
