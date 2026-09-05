export const meta = {
  slug: 'hash-generator',
  title: 'Hash Generator — MD5, SHA-1, SHA-256, SHA-512',
  shortTitle: 'Hash Generator',
  h1: 'MD5, SHA-1, SHA-256 and SHA-512 Hash Generator',
  category: 'Generators',
  icon: '#',
  description: 'Generate MD5, SHA-1, SHA-256, SHA-384 and SHA-512 hashes of text or files, plus HMAC. Computed in your browser — files are never uploaded.',
  keywords: ['md5 generator', 'sha256 generator', 'hash generator', 'sha1 hash', 'sha512', 'checksum calculator', 'hmac generator', 'file checksum'],
  intro: 'Hash text or a file with MD5, SHA-1, SHA-256, SHA-384 or SHA-512, or compute an HMAC with a secret key. Everything uses your browser\'s own crypto engine, so you can verify a multi-gigabyte download\'s checksum without uploading it anywhere.',
  related: ['base64-encode-decode', 'uuid-generator', 'password-generator', 'jwt-decoder'],
  html: `
<div class="panel">
  <div class="field">
    <label for="text">Text to hash</label>
    <textarea id="text" spellcheck="false" style="min-height:130px" placeholder="Type or paste anything"></textarea>
  </div>
  <div class="row row--tight" style="margin-bottom:12px">
    <label class="check"><input type="checkbox" id="upper"> Uppercase output</label>
    <label class="check"><input type="checkbox" id="hmac"> HMAC mode</label>
    <input type="text" id="key" placeholder="HMAC secret key" hidden style="max-width:280px" autocomplete="off" spellcheck="false">
  </div>
  <div class="scroll-x"><table class="data" id="out"></table></div>
  <div id="msg" class="msg"></div>
</div>

<div class="panel">
  <h3>Hash a file</h3>
  <div class="drop" id="drop">
    <strong>Drop a file to compute its checksum</strong>
    <span>read from disk in chunks — nothing is uploaded, any size your machine can read</span>
    <input type="file" id="file" hidden>
  </div>
  <div id="fileinfo" class="hint" style="margin-top:10px"></div>
  <div class="scroll-x"><table class="data" id="fout"></table></div>
</div>`,
  faq: [
    { q: 'Is my file uploaded to compute the checksum?', a: 'No. The file is read from disk by your browser and fed to the built-in <code>SubtleCrypto</code> digest function. That is exactly what makes this practical for verifying a 4 GB ISO — there is no upload to wait for.' },
    { q: 'Should I still use MD5?', a: 'Only for non-security purposes: deduplicating files, cache keys, spotting accidental corruption. MD5 collisions can be produced on a laptop, so it must never be used to verify that a file has not been tampered with, and never for passwords. Use SHA-256 for integrity.' },
    { q: 'Why can it not hash passwords properly?', a: 'A raw hash is the wrong tool for passwords — it is fast, which is what an attacker wants. Password storage needs a deliberately slow, salted function such as bcrypt, scrypt or Argon2, which cannot be meaningfully run in a page like this.' },
    { q: 'Can I reverse a hash back to the original text?', a: 'No. Hashing is one-way by design. Sites that claim to "decrypt MD5" are looking your hash up in a table of pre-computed common inputs — which works for <code>password123</code> and never for anything with real entropy.' },
    { q: 'What is HMAC for?', a: 'HMAC combines a hash with a secret key to prove that a message came from someone who holds that key. It is what webhook signatures (Stripe, GitHub, Slack) use so you can confirm a payload really came from them.' }
  ]
};

export function client(root, QT) {
  var $ = function (s) { return root.querySelector(s); };

  /* --- MD5 (RFC 1321). Not in SubtleCrypto, and still the most-requested. --- */
  function md5(bytes) {
    function rl(n, c) { return (n << c) | (n >>> (32 - c)); }
    function add(a, b) { return (a + b) | 0; }
    var S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,
             5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,
             4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,
             6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
    var K = new Array(64);
    for (var i = 0; i < 64; i++) K[i] = (Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296)) | 0;

    var len = bytes.length;
    var withPad = new Uint8Array((((len + 8) >> 6) + 1) << 6);
    withPad.set(bytes);
    withPad[len] = 0x80;
    var bitLen = len * 8;
    var dv = new DataView(withPad.buffer);
    dv.setUint32(withPad.length - 8, bitLen >>> 0, true);
    dv.setUint32(withPad.length - 4, Math.floor(bitLen / 4294967296), true);

    var a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
    var M = new Int32Array(16);
    for (var off = 0; off < withPad.length; off += 64) {
      for (var j = 0; j < 16; j++) M[j] = dv.getInt32(off + j * 4, true);
      var A = a0, B = b0, C = c0, D = d0;
      for (var k = 0; k < 64; k++) {
        var F, g;
        if (k < 16) { F = (B & C) | (~B & D); g = k; }
        else if (k < 32) { F = (D & B) | (~D & C); g = (5 * k + 1) % 16; }
        else if (k < 48) { F = B ^ C ^ D; g = (3 * k + 5) % 16; }
        else { F = C ^ (B | ~D); g = (7 * k) % 16; }
        F = add(add(add(F, A), K[k]), M[g]);
        A = D; D = C; C = B; B = add(B, rl(F, S[k]));
      }
      a0 = add(a0, A); b0 = add(b0, B); c0 = add(c0, C); d0 = add(d0, D);
    }
    var out = '';
    [a0, b0, c0, d0].forEach(function (word) {
      for (var n = 0; n < 4; n++) {
        out += ('0' + ((word >>> (n * 8)) & 0xff).toString(16)).slice(-2);
      }
    });
    return out;
  }

  function hex(buf) {
    var b = new Uint8Array(buf), s = '';
    for (var i = 0; i < b.length; i++) s += ('0' + b[i].toString(16)).slice(-2);
    return s;
  }

  var ALGOS = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

  function digest(algo, bytes, key) {
    if (algo === 'MD5') {
      if (key) return Promise.resolve('— (HMAC-MD5 is not available in browsers)');
      return Promise.resolve(md5(bytes));
    }
    if (!window.crypto || !crypto.subtle) {
      return Promise.resolve('— (needs a secure https context)');
    }
    if (key) {
      var enc = new TextEncoder();
      return crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: algo }, false, ['sign'])
        .then(function (k) { return crypto.subtle.sign('HMAC', k, bytes); })
        .then(hex);
    }
    return crypto.subtle.digest(algo, bytes).then(hex);
  }

  function render(table, results) {
    var up = $('#upper').checked;
    table.innerHTML = '<thead><tr><th style="width:90px">Algorithm</th><th>Hash</th><th style="width:76px"></th></tr></thead><tbody>' +
      results.map(function (r) {
        var v = up ? r.hash.toUpperCase() : r.hash;
        return '<tr><td style="font-family:var(--sans);font-weight:600">' + r.algo +
          '</td><td class="js-h">' + v + '</td>' +
          '<td style="width:76px"><button class="btn btn--sm js-copy" type="button" data-hash="' + v + '">Copy</button></td></tr>';
      }).join('') + '</tbody>';
    Array.prototype.forEach.call(table.querySelectorAll('.js-copy'), function (b) {
      b.addEventListener('click', function () { QT.copy(b.getAttribute('data-hash')); });
    });
  }

  function hashText() {
    var text = $('#text').value;
    var table = $('#out');
    if (!text) { table.innerHTML = ''; return; }
    var key = $('#hmac').checked ? $('#key').value : '';
    var bytes = new TextEncoder().encode(text);
    Promise.all(ALGOS.map(function (a) {
      return digest(a, bytes, key).then(function (h) { return { algo: a, hash: h }; });
    })).then(function (results) { render(table, results); });
  }

  $('#text').addEventListener('input', QT.debounce(hashText, 160));
  $('#upper').addEventListener('change', hashText);
  $('#key').addEventListener('input', QT.debounce(hashText, 200));
  $('#hmac').addEventListener('change', function () {
    $('#key').hidden = !this.checked;
    hashText();
  });

  QT.dropzone($('#drop'), $('#file'), function (files) {
    var f = files[0];
    $('#fileinfo').textContent = 'Reading ' + f.name + ' (' + QT.bytes(f.size) + ')…';
    $('#fout').innerHTML = '';
    QT.read(f, 'arrayBuffer').then(function (buf) {
      var bytes = new Uint8Array(buf);
      $('#fileinfo').textContent = f.name + ' — ' + QT.bytes(f.size);
      return Promise.all(ALGOS.map(function (a) {
        return digest(a, bytes, '').then(function (h) { return { algo: a, hash: h }; });
      }));
    }).then(function (results) { render($('#fout'), results); })
      .catch(function (e) { $('#fileinfo').textContent = 'Could not read that file: ' + e.message; });
  });
}
