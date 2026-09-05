export const meta = {
  slug: 'qr-code-generator',
  weight: 25,  /* order within its category — lower comes first */
  title: 'QR Code Generator',
  shortTitle: 'QR Code',
  h1: 'Free QR Code Generator',
  category: 'Generators',
  icon: 'QR',
  description: 'Make QR codes for links, WiFi, text, email and phone numbers. Download PNG or SVG. No watermark, no account, no expiry, no tracking redirect.',
  keywords: ['qr code generator', 'free qr code', 'qr code maker', 'wifi qr code', 'qr code png', 'qr code svg', 'url to qr code'],
  intro: 'Generate a QR code that encodes your data <em>directly</em> — not a redirect through someone else\'s tracking domain that stops working when they shut the service down. The image is built in your browser, so it is yours, permanently, with no scan limits.',
  related: ['url-encode-decode', 'base64-encode-decode', 'color-converter'],
  html: `
<div class="panel">
  <div class="row row--tight" style="margin-bottom:14px">
    <label class="lbl" for="type">Content type</label>
    <select id="type" style="width:auto">
      <option value="text">Text or URL</option>
      <option value="wifi">WiFi network</option>
      <option value="email">Email</option>
      <option value="tel">Phone number</option>
      <option value="sms">SMS</option>
      <option value="vcard">Contact card</option>
    </select>
  </div>

  <div id="f-text" class="field">
    <label for="text">Text or URL</label>
    <textarea id="text" spellcheck="false" style="min-height:90px" placeholder="https://example.com"></textarea>
  </div>

  <div id="f-wifi" hidden>
    <div class="row">
      <div class="field"><label for="ssid">Network name (SSID)</label><input type="text" id="ssid" autocomplete="off"></div>
      <div class="field"><label for="pass">Password</label><input type="text" id="pass" autocomplete="off"></div>
      <div class="field"><label for="enc">Security</label>
        <select id="enc"><option value="WPA">WPA/WPA2/WPA3</option><option value="WEP">WEP</option><option value="nopass">Open</option></select>
      </div>
    </div>
    <label class="check"><input type="checkbox" id="hidden-net"> Hidden network</label>
  </div>

  <div id="f-email" hidden>
    <div class="row">
      <div class="field"><label for="to">To</label><input type="text" id="to" placeholder="hello@example.com"></div>
      <div class="field"><label for="subj">Subject</label><input type="text" id="subj"></div>
    </div>
    <div class="field"><label for="body">Message</label><textarea id="body" style="min-height:70px"></textarea></div>
  </div>

  <div id="f-tel" hidden class="field">
    <label for="tel">Phone number</label><input type="text" id="tel" placeholder="+1 555 010 0000">
  </div>

  <div id="f-sms" hidden>
    <div class="row">
      <div class="field"><label for="smsto">Number</label><input type="text" id="smsto"></div>
      <div class="field"><label for="smsbody">Message</label><input type="text" id="smsbody"></div>
    </div>
  </div>

  <div id="f-vcard" hidden>
    <div class="row">
      <div class="field"><label for="vname">Name</label><input type="text" id="vname"></div>
      <div class="field"><label for="vorg">Organisation</label><input type="text" id="vorg"></div>
    </div>
    <div class="row">
      <div class="field"><label for="vtel">Phone</label><input type="text" id="vtel"></div>
      <div class="field"><label for="vemail">Email</label><input type="text" id="vemail"></div>
      <div class="field"><label for="vurl">Website</label><input type="text" id="vurl"></div>
    </div>
  </div>
</div>

<div class="panel">
  <div class="row row--tight" style="margin-bottom:14px">
    <label class="lbl" for="ec">Error correction</label>
    <select id="ec" style="width:auto">
      <option value="L">L — 7% (smallest)</option>
      <option value="M" selected>M — 15%</option>
      <option value="Q">Q — 25%</option>
      <option value="H">H — 30% (survives damage)</option>
    </select>
    <label class="lbl" for="size">Size</label>
    <select id="size" style="width:auto">
      <option value="256">256 px</option><option value="512" selected>512 px</option>
      <option value="1024">1024 px</option><option value="2048">2048 px</option>
    </select>
    <label class="lbl" for="fg">Colours</label>
    <input type="color" id="fg" value="#000000" style="width:52px" aria-label="Foreground">
    <input type="color" id="bg" value="#ffffff" style="width:52px" aria-label="Background">
    <label class="check"><input type="checkbox" id="quiet" checked> Quiet zone</label>
  </div>
  <div id="preview" style="text-align:center;padding:10px 0;min-height:120px"></div>
  <div class="btns" style="justify-content:center">
    <button class="btn btn--primary" id="png">Download PNG</button>
    <button class="btn" id="svg">Download SVG</button>
  </div>
  <div id="msg" class="msg"></div>
</div>`,
  faq: [
    { q: 'Do these QR codes expire?', a: 'No. The data is encoded directly into the pattern, so the code works forever with no service behind it. Free generators that route through their own short domain can and do expire, start charging, or turn the code into an ad redirect — after your posters are printed.' },
    { q: 'Which error correction level should I pick?', a: 'M is right for almost everything. Choose H if the code will be printed small, on a curved surface, or somewhere it might get scuffed — it can still be read with about 30% of the pattern destroyed, at the cost of a denser image.' },
    { q: 'Why will my code not scan?', a: 'Three usual causes: not enough contrast (dark on light is required — inverted codes fail on many scanners), no quiet zone (the code needs clear margin all round), or printed too small. As a rule of thumb, print at least 2 cm square, and 1/10th of the scanning distance.' },
    { q: 'Is a WiFi QR code safe to put on the wall?', a: 'It contains the password in plain text, so anyone who photographs it has your network. That is fine for a guest network and a bad idea for the one your NAS is on.' },
    { q: 'Can I use these commercially?', a: 'Yes. QR Code is a registered trademark of Denso Wave, but the specification is open and free to use — you can print these on products, menus and packaging without a licence or attribution.' }
  ]
};

export function client(root, QT) {
  var $ = function (s) { return root.querySelector(s); };
  var LIB = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';
  var lastSvg = '', lastText = '';

  function escVal(s) { return String(s).replace(/([\;,:"])/g, '\\$1'); }

  function payload() {
    var t = $('#type').value;
    if (t === 'wifi') {
      var enc = $('#enc').value;
      return 'WIFI:T:' + enc + ';S:' + escVal($('#ssid').value) + ';' +
        (enc === 'nopass' ? '' : 'P:' + escVal($('#pass').value) + ';') +
        ($('#hidden-net').checked ? 'H:true;' : '') + ';';
    }
    if (t === 'email') {
      var q = [];
      if ($('#subj').value) q.push('subject=' + encodeURIComponent($('#subj').value));
      if ($('#body').value) q.push('body=' + encodeURIComponent($('#body').value));
      return 'mailto:' + $('#to').value + (q.length ? '?' + q.join('&') : '');
    }
    if (t === 'tel') return 'tel:' + $('#tel').value.replace(/[^\d+]/g, '');
    if (t === 'sms') return 'SMSTO:' + $('#smsto').value + ':' + $('#smsbody').value;
    if (t === 'vcard') {
      return ['BEGIN:VCARD', 'VERSION:3.0',
        'N:' + $('#vname').value, 'FN:' + $('#vname').value,
        $('#vorg').value ? 'ORG:' + $('#vorg').value : '',
        $('#vtel').value ? 'TEL:' + $('#vtel').value : '',
        $('#vemail').value ? 'EMAIL:' + $('#vemail').value : '',
        $('#vurl').value ? 'URL:' + $('#vurl').value : '',
        'END:VCARD'].filter(Boolean).join('\n');
    }
    return $('#text').value;
  }

  function buildSvg(modules, size) {
    var n = modules.length;
    var quiet = $('#quiet').checked ? 4 : 0;
    var total = n + quiet * 2;
    var fg = $('#fg').value, bg = $('#bg').value;
    var path = '';
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        if (modules[r][c]) path += 'M' + (c + quiet) + ',' + (r + quiet) + 'h1v1h-1z';
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size +
      '" viewBox="0 0 ' + total + ' ' + total + '" shape-rendering="crispEdges">' +
      '<rect width="' + total + '" height="' + total + '" fill="' + bg + '"/>' +
      '<path d="' + path + '" fill="' + fg + '"/></svg>';
  }

  function render() {
    var text = payload();
    lastText = text;
    var preview = $('#preview');
    if (!text || text === 'WIFI:T:WPA;S:;P:;;' || text === 'mailto:' || text === 'tel:') {
      preview.innerHTML = '<p class="hint">Enter something above and the QR code appears here.</p>';
      lastSvg = '';
      QT.msg($('#msg'), '');
      return;
    }
    QT.lib(LIB).then(function () {
      try {
        var qr = window.qrcode(0, $('#ec').value);
        qr.addData(text);
        qr.make();
        var n = qr.getModuleCount();
        var modules = [];
        for (var r = 0; r < n; r++) {
          var row = [];
          for (var c = 0; c < n; c++) row.push(qr.isDark(r, c));
          modules.push(row);
        }
        var size = Number($('#size').value);
        lastSvg = buildSvg(modules, size);
        preview.innerHTML = '<div style="display:inline-block;max-width:300px;width:100%">' +
          buildSvg(modules, 300) + '</div>';
        QT.msg($('#msg'), text.length + ' characters encoded · ' + n + '×' + n +
          ' modules · error correction ' + $('#ec').value, 'ok');
      } catch (e) {
        preview.innerHTML = '';
        QT.msg($('#msg'), 'That is too much data for a single QR code (about 2,900 characters is the hard limit, ' +
          'and far less at high error correction). Shorten it or use a link.', 'err');
      }
    }).catch(function () {
      QT.msg($('#msg'), 'Could not load the QR encoder. Check your connection and reload.', 'err');
    });
  }

  $('#type').addEventListener('change', function () {
    ['text', 'wifi', 'email', 'tel', 'sms', 'vcard'].forEach(function (t) {
      $('#f-' + t).hidden = t !== $('#type').value;
    });
    render();
  });
  QT.$$('input, textarea, select', root).forEach(function (el) {
    el.addEventListener('input', QT.debounce(render, 220));
    el.addEventListener('change', render);
  });

  $('#svg').addEventListener('click', function () {
    if (!lastSvg) { QT.toast('Nothing to download yet'); return; }
    QT.download('qr-code.svg', lastSvg, 'image/svg+xml');
  });

  $('#png').addEventListener('click', function () {
    if (!lastSvg) { QT.toast('Nothing to download yet'); return; }
    var size = Number($('#size').value);
    var img = new Image();
    var blobUrl = URL.createObjectURL(new Blob([lastSvg], { type: 'image/svg+xml' }));
    img.onload = function () {
      var canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      var ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = $('#bg').value;
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(blobUrl);
      canvas.toBlob(function (blob) { QT.download('qr-code.png', blob); }, 'image/png');
    };
    img.onerror = function () { URL.revokeObjectURL(blobUrl); QT.toast('Could not render the PNG'); };
    img.src = blobUrl;
  });

  render();
}
