export const meta = {
  slug: 'favicon-generator',
  weight: 25,  /* order within its category — lower comes first */
  title: 'Favicon Generator',
  shortTitle: 'Favicon Generator',
  h1: 'Favicon Generator',
  category: 'Images',
  icon: '★',
  description: 'Turn any image or letter into a complete favicon set — .ico, apple-touch-icon, PWA icons and the HTML to paste. Generated in your browser.',
  keywords: ['favicon generator', 'ico converter', 'png to ico', 'apple touch icon', 'favicon from image', 'site icon generator'],
  intro: 'Upload an image — or type a letter and pick colours — and get every icon a modern site needs, plus the exact HTML and web manifest to go with them. Files are generated in your browser, so a client\'s unreleased logo never leaves your laptop.',
  related: ['image-converter', 'image-resizer', 'color-converter'],
  html: `
<div class="panel">
  <div class="row row--tight" style="margin-bottom:14px">
    <label class="check"><input type="radio" name="src" value="file" checked> From an image</label>
    <label class="check"><input type="radio" name="src" value="text"> From a letter</label>
  </div>

  <div id="src-file">
    <div class="drop" id="drop">
      <strong>Drop a square image</strong>
      <span>PNG, JPEG, SVG or WebP — 512 × 512 or larger works best</span>
      <input type="file" id="file" accept="image/*" hidden>
    </div>
  </div>

  <div id="src-text" hidden>
    <div class="row">
      <div class="field" style="flex:0 0 120px">
        <label for="letter">Letter</label>
        <input type="text" id="letter" value="Q" maxlength="2">
      </div>
      <div class="field" style="flex:0 0 110px"><label for="fg">Text</label><input type="color" id="fg" value="#04241a"></div>
      <div class="field" style="flex:0 0 110px"><label for="bg">Background</label><input type="color" id="bg" value="#6ee7b7"></div>
      <div class="field" style="flex:0 0 150px">
        <label for="shape">Shape</label>
        <select id="shape"><option value="rounded">Rounded square</option><option value="circle">Circle</option><option value="square">Square</option></select>
      </div>
      <div class="field" style="flex:0 0 150px">
        <label for="font">Weight</label>
        <select id="font"><option value="700">Bold</option><option value="500">Medium</option><option value="900">Black</option></select>
      </div>
    </div>
  </div>

  <div class="row row--tight" style="margin-top:12px">
    <label class="check"><input type="checkbox" id="padding"> Add 10% padding</label>
    <label class="lbl" for="bgfill">Background behind transparency</label>
    <select id="bgfill" style="width:auto">
      <option value="">Keep transparent</option>
      <option value="#ffffff">White</option>
      <option value="#000000">Black</option>
    </select>
  </div>
  <div id="msg" class="msg"></div>
</div>

<div class="panel" id="out-panel" hidden>
  <h3>Preview</h3>
  <div id="previews" style="display:flex;flex-wrap:wrap;gap:18px;align-items:flex-end;margin-bottom:18px"></div>
  <div class="btns">
    <button class="btn btn--primary" id="dl-ico">Download favicon.ico</button>
    <button class="btn" id="dl-all">Download all PNGs</button>
  </div>
</div>

<div class="panel" id="code-panel" hidden>
  <h3>Paste this into your &lt;head&gt;</h3>
  <div class="field">
    <textarea id="snippet" readonly spellcheck="false" style="min-height:150px"></textarea>
  </div>
  <button class="btn btn--sm" data-copy="#snippet">Copy HTML</button>
  <h3 style="margin-top:20px">site.webmanifest</h3>
  <div class="field">
    <textarea id="manifest" readonly spellcheck="false" style="min-height:170px"></textarea>
  </div>
  <button class="btn btn--sm" data-copy="#manifest">Copy manifest</button>
  <button class="btn btn--sm" data-download="#manifest" data-filename="site.webmanifest">Download manifest</button>
</div>`,
  faq: [
    { q: 'Do I still need a .ico file?', a: 'Yes, but only one: put <code>favicon.ico</code> at the root of your domain. Browsers request it by convention even without a link tag, and some tools and feed readers only look there. Everything else can be PNG or SVG.' },
    { q: 'Which sizes actually matter in 2026?', a: 'A 32×32 for the browser tab, 180×180 for the iOS home screen, and 192/512 for Android and PWA installs. A single SVG covers modern browsers elegantly, but the PNGs remain the reliable fallback.' },
    { q: 'Why does my favicon look muddy at 16×16?', a: 'Because a detailed logo cannot survive 256 pixels. Favicons need to be redrawn, not shrunk: one bold shape or a single letter, high contrast, no thin strokes and no text. Check the 16×16 preview above — if you cannot tell what it is there, neither can anyone else.' },
    { q: 'Why is the browser still showing the old icon?', a: 'Favicons are cached aggressively. Hard-refresh, or visit the icon URL directly to confirm the new file is being served. Adding a version query string to the link tag forces the update.' }
  ]
};

export function client(root, QT) {
  var $ = function (s) { return root.querySelector(s); };
  var SIZES = [16, 32, 48, 64, 96, 128, 180, 192, 256, 512];
  var ICO_SIZES = [16, 32, 48];
  var source = null;

  function decode(file) {
    if (/svg/.test(file.type)) {
      return QT.read(file, 'dataURL').then(function (url) {
        return new Promise(function (resolve, reject) {
          var img = new Image();
          img.onload = function () { resolve(img); };
          img.onerror = reject;
          img.src = url;
        });
      });
    }
    if (window.createImageBitmap) {
      return createImageBitmap(file, { imageOrientation: 'from-image' });
    }
    return new Promise(function (resolve, reject) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = reject;
      img.src = url;
    });
  }

  function drawAt(size) {
    var canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    var bgfill = $('#bgfill').value;
    if (bgfill) { ctx.fillStyle = bgfill; ctx.fillRect(0, 0, size, size); }

    var mode = root.querySelector('input[name=src]:checked').value;
    var pad = $('#padding').checked ? Math.round(size * 0.1) : 0;
    var inner = size - pad * 2;

    if (mode === 'text') {
      var shape = $('#shape').value;
      ctx.fillStyle = $('#bg').value;
      ctx.beginPath();
      if (shape === 'circle') ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      else if (shape === 'rounded') {
        var r = size * 0.22;
        if (ctx.roundRect) ctx.roundRect(0, 0, size, size, r);
        else ctx.rect(0, 0, size, size);
      } else ctx.rect(0, 0, size, size);
      ctx.fill();

      var letter = ($('#letter').value || 'A').slice(0, 2);
      ctx.fillStyle = $('#fg').value;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var scale = letter.length > 1 ? 0.46 : 0.62;
      ctx.font = $('#font').value + ' ' + Math.round(size * scale) +
        'px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(letter, size / 2, size / 2 + size * 0.03);
      return canvas;
    }

    if (!source) return canvas;
    var sw = source.width, sh = source.height;
    var scale2 = Math.min(inner / sw, inner / sh);
    var dw = Math.round(sw * scale2), dh = Math.round(sh * scale2);
    ctx.drawImage(source, Math.round((size - dw) / 2), Math.round((size - dh) / 2), dw, dh);
    return canvas;
  }

  function blobOf(canvas) {
    return new Promise(function (resolve) { canvas.toBlob(resolve, 'image/png'); });
  }

  /* An .ico is a small container; modern Windows and every browser accept
     PNG-encoded entries, so we embed the PNGs directly. */
  function buildIco(pngBuffers) {
    var count = pngBuffers.length;
    var headerSize = 6 + count * 16;
    var total = headerSize + pngBuffers.reduce(function (s, b) { return s + b.byteLength; }, 0);
    var buf = new ArrayBuffer(total);
    var view = new DataView(buf);
    var bytes = new Uint8Array(buf);

    view.setUint16(0, 0, true);       /* reserved */
    view.setUint16(2, 1, true);       /* type 1 = icon */
    view.setUint16(4, count, true);

    var offset = headerSize;
    pngBuffers.forEach(function (png, i) {
      var entry = 6 + i * 16;
      var size = ICO_SIZES[i];
      view.setUint8(entry, size >= 256 ? 0 : size);
      view.setUint8(entry + 1, size >= 256 ? 0 : size);
      view.setUint8(entry + 2, 0);    /* palette */
      view.setUint8(entry + 3, 0);    /* reserved */
      view.setUint16(entry + 4, 1, true);   /* colour planes */
      view.setUint16(entry + 6, 32, true);  /* bits per pixel */
      view.setUint32(entry + 8, png.byteLength, true);
      view.setUint32(entry + 12, offset, true);
      bytes.set(new Uint8Array(png), offset);
      offset += png.byteLength;
    });
    return new Blob([buf], { type: 'image/x-icon' });
  }

  function render() {
    var mode = root.querySelector('input[name=src]:checked').value;
    if (mode === 'file' && !source) { $('#out-panel').hidden = true; $('#code-panel').hidden = true; return; }

    var box = $('#previews');
    box.innerHTML = '';
    [16, 32, 48, 180, 512].forEach(function (size) {
      var canvas = drawAt(size);
      var wrap = document.createElement('div');
      wrap.style.textAlign = 'center';
      var display = Math.min(96, size);
      canvas.style.width = display + 'px';
      canvas.style.height = display + 'px';
      canvas.style.imageRendering = size <= 48 ? 'pixelated' : 'auto';
      canvas.style.border = '1px solid var(--line)';
      canvas.style.borderRadius = '6px';
      canvas.style.background = 'var(--bg)';
      wrap.appendChild(canvas);
      var label = document.createElement('div');
      label.className = 'hint';
      label.style.marginTop = '6px';
      label.textContent = size + '×' + size;
      wrap.appendChild(label);
      box.appendChild(wrap);
    });

    $('#out-panel').hidden = false;
    $('#code-panel').hidden = false;
    $('#snippet').value =
      '<link rel="icon" href="/favicon.ico" sizes="32x32">\n' +
      '<link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192">\n' +
      '<link rel="apple-touch-icon" href="/apple-touch-icon.png"><!-- 180x180 -->\n' +
      '<link rel="manifest" href="/site.webmanifest">';
    $('#manifest').value = JSON.stringify({
      name: 'Your Site',
      short_name: 'Site',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
      ],
      theme_color: '#ffffff',
      background_color: '#ffffff',
      display: 'standalone'
    }, null, 2);
    QT.msg($('#msg'), 'Icons generated on this device. Nothing was uploaded.', 'ok');
  }

  QT.dropzone($('#drop'), $('#file'), function (files) {
    decode(files[0]).then(function (img) {
      source = img;
      render();
    }).catch(function () {
      QT.msg($('#msg'), 'Could not read that image. Try a PNG, JPEG or SVG.', 'err');
    });
  });

  QT.$$('input[name=src]', root).forEach(function (r) {
    r.addEventListener('change', function () {
      var text = root.querySelector('input[name=src]:checked').value === 'text';
      $('#src-file').hidden = text;
      $('#src-text').hidden = !text;
      render();
    });
  });
  ['#letter', '#fg', '#bg', '#shape', '#font', '#padding', '#bgfill'].forEach(function (s) {
    $(s).addEventListener('input', QT.debounce(render, 160));
    $(s).addEventListener('change', render);
  });

  $('#dl-ico').addEventListener('click', function () {
    Promise.all(ICO_SIZES.map(function (size) {
      return blobOf(drawAt(size)).then(function (b) { return b.arrayBuffer(); });
    })).then(function (buffers) {
      QT.download('favicon.ico', buildIco(buffers));
      QT.toast('favicon.ico saved');
    });
  });

  $('#dl-all').addEventListener('click', function () {
    SIZES.forEach(function (size, i) {
      setTimeout(function () {
        blobOf(drawAt(size)).then(function (b) {
          var name = size === 180 ? 'apple-touch-icon.png' : 'icon-' + size + '.png';
          QT.download(name, b);
        });
      }, i * 250);
    });
    QT.toast('Saving ' + SIZES.length + ' PNGs…');
  });
}
