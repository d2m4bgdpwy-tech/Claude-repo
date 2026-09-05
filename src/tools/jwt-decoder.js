export const meta = {
  slug: 'jwt-decoder',
  weight: 20,  /* order within its category — lower comes first */
  title: 'JWT Decoder & Verifier',
  shortTitle: 'JWT Decoder',
  h1: 'JWT Decoder and Signature Verifier',
  category: 'Encode & Decode',
  icon: 'JWT',
  description: 'Decode a JSON Web Token header and payload, check expiry, and verify an HMAC signature — all inside your browser. The token is never sent anywhere.',
  keywords: ['jwt decoder', 'decode jwt', 'jwt debugger', 'json web token decoder', 'verify jwt signature', 'jwt expiry check'],
  intro: 'Paste a JSON Web Token to read its header and claims, see when it was issued and when it expires, and optionally verify an HS256/384/512 signature against your secret. A JWT is a live credential — this page decodes it locally so you are not pasting a working session token into someone else\'s server log.',
  related: ['base64-encode-decode', 'json-formatter', 'unix-timestamp-converter', 'hash-generator'],
  html: `
<div class="panel">
  <div class="field">
    <label for="token">JSON Web Token</label>
    <textarea id="token" spellcheck="false" style="min-height:130px" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NSIsIm5hbWUiOiJBZGEiLCJpYXQiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"></textarea>
  </div>
  <div class="btns">
    <button class="btn btn--ghost" id="sample">Load sample token</button>
    <button class="btn btn--ghost" data-clear="#token">Clear</button>
  </div>
  <div id="msg" class="msg"></div>
</div>

<div id="result" hidden>
  <div class="panel">
    <h3>Status</h3>
    <div class="stat-grid">
      <div class="stat"><b id="s-alg">—</b><span>Algorithm</span></div>
      <div class="stat"><b id="s-exp">—</b><span>Expires</span></div>
      <div class="stat"><b id="s-iat">—</b><span>Issued</span></div>
      <div class="stat"><b id="s-sig">—</b><span>Signature</span></div>
    </div>
    <div id="expmsg" class="msg"></div>
  </div>

  <div class="io">
    <div class="panel">
      <h3>Header</h3>
      <pre class="out" id="header"></pre>
      <div class="btns" style="margin:10px 0 0"><button class="btn btn--sm" data-copy="#header">Copy</button></div>
    </div>
    <div class="panel">
      <h3>Payload</h3>
      <pre class="out" id="payload"></pre>
      <div class="btns" style="margin:10px 0 0"><button class="btn btn--sm" data-copy="#payload">Copy</button></div>
    </div>
  </div>

  <div class="panel">
    <h3>Claims</h3>
    <div class="scroll-x"><table class="data" id="claims"></table></div>
  </div>

  <div class="panel">
    <h3>Verify an HMAC signature</h3>
    <p class="hint">For <code>HS256</code>, <code>HS384</code> and <code>HS512</code> tokens. Your secret is used by
      the browser's built-in crypto and is never transmitted or stored.</p>
    <div class="row">
      <div class="field" style="flex:1 1 300px">
        <label for="secret">Shared secret</label>
        <input type="text" id="secret" spellcheck="false" autocomplete="off" placeholder="your-256-bit-secret">
      </div>
      <button class="btn btn--primary" id="verify" style="flex:0 0 auto">Verify</button>
    </div>
    <div id="vmsg" class="msg"></div>
  </div>
</div>`,
  faq: [
    { q: 'Is my token sent to a server?', a: 'No. The token is split and Base64URL-decoded by JavaScript on this page, and signature verification uses the browser\'s built-in <code>SubtleCrypto</code> API. Nothing leaves the tab. That matters here more than on most tools: a JWT you paste somewhere is usually a valid credential until it expires.' },
    { q: 'Can I verify RS256 tokens?', a: 'Not here — RS256 verification needs the issuer\'s public key in JWK or PEM form, and getting that wrong gives false confidence. This tool verifies the HMAC family, where the secret is something you already have.' },
    { q: 'The signature is invalid but the token works. Why?', a: 'Usually the secret is base64-encoded at the issuer and you pasted the decoded form (or the reverse), or the token uses RS256 and cannot be checked with a shared secret. Whitespace pasted with the secret is the other common cause.' },
    { q: 'Does decoding a JWT prove it is legitimate?', a: 'No. Anyone can read a JWT — that is by design, the payload is only Base64, not encryption. Only the signature proves it was issued by someone holding the key, which is why servers must verify it and must never trust the <code>alg</code> header from the token itself.' },
    { q: 'What are iat, exp and nbf?', a: 'Registered claims holding Unix timestamps: <code>iat</code> is when the token was issued, <code>exp</code> when it stops being valid, and <code>nbf</code> the earliest moment it may be used. This tool renders all three as readable dates.' }
  ]
};

export function client(root, QT) {
  var $ = function (s) { return root.querySelector(s); };
  var tokenEl = $('#token'), msg = $('#msg'), result = $('#result');
  var parsed = null;

  function b64urlToBytes(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = atob(s), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function b64urlToJson(s) {
    return JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function when(ts) {
    if (typeof ts !== 'number') return null;
    var ms = ts > 1e11 ? ts : ts * 1000;
    return new Date(ms);
  }
  function relative(d) {
    var diff = d.getTime() - Date.now();
    var abs = Math.abs(diff), unit, n;
    if (abs < 60000) { n = Math.round(abs / 1000); unit = 'second'; }
    else if (abs < 3600000) { n = Math.round(abs / 60000); unit = 'minute'; }
    else if (abs < 86400000) { n = Math.round(abs / 3600000); unit = 'hour'; }
    else { n = Math.round(abs / 86400000); unit = 'day'; }
    var s = n + ' ' + unit + (n === 1 ? '' : 's');
    return diff < 0 ? s + ' ago' : 'in ' + s;
  }

  var CLAIM_DOC = {
    iss: 'Issuer — who created the token', sub: 'Subject — who the token is about',
    aud: 'Audience — who the token is for', exp: 'Expires at', nbf: 'Not valid before',
    iat: 'Issued at', jti: 'Token ID', scope: 'Granted scopes', azp: 'Authorised party',
    email: 'Email address', name: 'Display name', roles: 'Roles'
  };

  function decode() {
    var raw = tokenEl.value.trim().replace(/^Bearer\s+/i, '');
    if (!raw) { result.hidden = true; QT.msg(msg, ''); parsed = null; return; }
    var parts = raw.split('.');
    if (parts.length < 2) {
      QT.msg(msg, 'A JWT has three dot-separated parts: header.payload.signature. This has ' + parts.length + '.', 'err');
      result.hidden = true; return;
    }
    var header, payload;
    try { header = b64urlToJson(parts[0]); }
    catch (e) { QT.msg(msg, 'The header is not valid Base64URL-encoded JSON.', 'err'); result.hidden = true; return; }
    try { payload = b64urlToJson(parts[1]); }
    catch (e) { QT.msg(msg, 'The payload is not valid Base64URL-encoded JSON.', 'err'); result.hidden = true; return; }

    parsed = { raw: raw, parts: parts, header: header, payload: payload };
    QT.msg(msg, '');
    result.hidden = false;

    $('#header').textContent = JSON.stringify(header, null, 2);
    $('#payload').textContent = JSON.stringify(payload, null, 2);
    $('#s-alg').textContent = header.alg || '—';
    $('#s-sig').textContent = parts[2] ? 'unverified' : 'none';

    var exp = when(payload.exp), iat = when(payload.iat), nbf = when(payload.nbf);
    $('#s-exp').textContent = exp ? relative(exp) : '—';
    $('#s-iat').textContent = iat ? relative(iat) : '—';

    var em = $('#expmsg');
    if (exp && exp.getTime() < Date.now()) {
      QT.msg(em, 'This token expired ' + relative(exp) + ' (' + exp.toString() + ').', 'err');
    } else if (nbf && nbf.getTime() > Date.now()) {
      QT.msg(em, 'This token is not valid until ' + nbf.toString() + '.', 'warn');
    } else if (exp) {
      QT.msg(em, 'Valid until ' + exp.toString() + '.', 'ok');
    } else {
      QT.msg(em, 'No exp claim — this token does not expire on its own.', 'warn');
    }

    if (header.alg === 'none') {
      QT.msg(msg, 'This token uses alg "none", meaning it is unsigned. Any server accepting it is trusting unverified input.', 'err');
    }

    var rows = Object.keys(payload).map(function (k) {
      var v = payload[k];
      var display = typeof v === 'object' ? JSON.stringify(v) : String(v);
      var d = when(v);
      if (['exp', 'iat', 'nbf', 'auth_time', 'updated_at'].indexOf(k) > -1 && d) {
        display = display + '  →  ' + d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
      }
      return '<tr><td style="width:130px"><strong>' + esc(k) + '</strong></td><td>' + esc(display) +
        '</td><td style="font-family:var(--sans);color:var(--fg-faint)">' + esc(CLAIM_DOC[k] || '') + '</td></tr>';
    }).join('');
    $('#claims').innerHTML = '<thead><tr><th>Claim</th><th>Value</th><th>Meaning</th></tr></thead><tbody>' + rows + '</tbody>';
  }

  tokenEl.addEventListener('input', QT.debounce(decode, 200));
  $('#sample').addEventListener('click', function () {
    tokenEl.value = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkYSBMb3ZlbGFjZSIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNzc4NzU5MDIyfQ.' +
      '7GrOWBShMA4bOlcrYWNkIyMRZLHLKp9q_LCTEx67IBM';
    decode();
    $('#secret').value = 'your-256-bit-secret';
  });

  $('#verify').addEventListener('click', function () {
    var vmsg = $('#vmsg');
    if (!parsed) { QT.msg(vmsg, 'Paste a token first.', 'warn'); return; }
    var alg = (parsed.header.alg || '').toUpperCase();
    var bits = { HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512' }[alg];
    if (!bits) {
      QT.msg(vmsg, 'This token uses ' + (alg || 'an unknown algorithm') +
        '. Only HS256, HS384 and HS512 can be verified with a shared secret.', 'warn');
      return;
    }
    if (!parsed.parts[2]) { QT.msg(vmsg, 'This token has no signature part.', 'err'); return; }
    var secret = $('#secret').value;
    if (!secret) { QT.msg(vmsg, 'Enter the shared secret.', 'warn'); return; }
    if (!window.crypto || !crypto.subtle) {
      QT.msg(vmsg, 'Your browser does not expose SubtleCrypto here. It requires a secure (https) context.', 'err');
      return;
    }
    var enc = new TextEncoder();
    var signing = parsed.parts[0] + '.' + parsed.parts[1];
    crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: bits }, false, ['sign'])
      .then(function (key) { return crypto.subtle.sign('HMAC', key, enc.encode(signing)); })
      .then(function (sig) {
        var bytes = new Uint8Array(sig), bin = '';
        for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        var expected = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        var actual = parsed.parts[2].replace(/=+$/, '');
        if (expected === actual) {
          QT.msg(vmsg, 'Signature verified — this token was signed with that secret.', 'ok');
          $('#s-sig').textContent = 'valid';
        } else {
          QT.msg(vmsg, 'Signature does not match. Either the secret is wrong, or the token has been altered.', 'err');
          $('#s-sig').textContent = 'invalid';
        }
      })
      .catch(function (e) { QT.msg(vmsg, 'Verification failed: ' + e.message, 'err'); });
  });
}
