export const meta = {
  slug: 'image-converter',
  title: 'Image Converter — PNG, JPG, WebP',
  shortTitle: 'Image Converter',
  h1: 'Image Converter — PNG, JPEG and WebP',
  category: 'Images',
  icon: 'IMG',
  description: 'Convert images between PNG, JPEG and WebP in your browser. Batch convert, control quality, and keep every file on your own device.',
  keywords: ['image converter', 'png to jpg', 'jpg to png', 'webp converter', 'convert to webp', 'heic to jpg', 'image format converter'],
  intro: 'Convert one image or a whole folder of them between PNG, JPEG and WebP. The conversion uses your browser\'s own image encoder — your photos are never uploaded, which is the difference between a private holiday album and one sitting on a stranger\'s server.',
  related: ['image-resizer', 'image-compressor', 'favicon-generator', 'base64-encode-decode'],
  html: `
<div class="panel">
  <div class="drop" id="drop">
    <strong>Drop images here</strong>
    <span>or click to choose — PNG, JPEG, WebP, GIF, BMP, AVIF and (on Safari) HEIC. Nothing is uploaded.</span>
    <input type="file" id="file" accept="image/*" multiple hidden>
  </div>
  <div class="row row--tight" style="margin-top:14px">
    <label class="lbl" for="format">Convert to</label>
    <select id="format" style="width:auto">
      <option value="image/png">PNG — lossless, supports transparency</option>
      <option value="image/jpeg">JPEG — smallest for photos</option>
      <option value="image/webp" selected>WebP — best all-round</option>
    </select>
    <label class="lbl" for="quality">Quality <span id="q-val">85</span>%</label>
    <input type="range" id="quality" min="1" max="100" value="85" style="max-width:200px">
    <label class="check"><input type="checkbox" id="white"> Flatten transparency to white</label>
  </div>
  <div id="msg" class="msg"></div>
</div>

<div class="panel" id="results-panel" hidden>
  <div class="btns">
    <button class="btn btn--primary" id="dl-all">Download all</button>
    <button class="btn btn--ghost" id="clear">Clear</button>
  </div>
  <div id="results" class="grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))"></div>
</div>`,
  faq: [
    { q: 'Should I use WebP or JPEG?', a: 'WebP, in almost every case. It is typically 25–35% smaller than JPEG at the same visual quality, supports transparency like PNG, and every browser released since 2020 handles it. Keep JPEG only where something old has to open the file.' },
    { q: 'Why did my PNG get bigger as a JPEG?', a: 'PNG compresses flat colour and sharp edges extremely well — screenshots, logos, diagrams. JPEG is built for photographs and wastes bits on hard edges while blurring them. Match the format to the content: photos to JPEG or WebP, graphics to PNG or WebP.' },
    { q: 'What happens to transparency when I convert to JPEG?', a: 'JPEG has no alpha channel, so transparent areas become black unless you tick "flatten to white". Convert to WebP or PNG if transparency matters.' },
    { q: 'Can it convert HEIC photos from my iPhone?', a: 'Only in Safari, which is the one browser that can decode HEIC natively. Elsewhere the file will not open — set your iPhone to "Most Compatible" in Settings → Camera → Formats to shoot JPEG instead.' },
    { q: 'Is metadata like GPS location preserved?', a: 'No, and that is usually what you want. Redrawing through a canvas strips EXIF, including the coordinates of where the photo was taken. Rotation is applied before stripping, so images stay the right way up.' }
  ]
};

export function client(root, QT) {
  var $ = function (s) { return root.querySelector(s); };
  var outputs = [];

  function supports(mime) {
    var c = document.createElement('canvas');
    c.width = c.height = 1;
    return c.toDataURL(mime).indexOf('data:' + mime) === 0;
  }

  function decode(file) {
    if (window.createImageBitmap) {
      return createImageBitmap(file, { imageOrientation: 'from-image' }).catch(function () { return viaImg(file); });
    }
    return viaImg(file);
  }
  function viaImg(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not decode ' + file.name)); };
      img.src = url;
    });
  }

  function convertOne(file) {
    var format = $('#format').value;
    var quality = Number($('#quality').value) / 100;
    return decode(file).then(function (bitmap) {
      var w = bitmap.width, h = bitmap.height;
      var canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      var ctx = canvas.getContext('2d');
      if ($('#white').checked || format === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(bitmap, 0, 0);
      if (bitmap.close) bitmap.close();
      return new Promise(function (resolve, reject) {
        canvas.toBlob(function (blob) {
          if (!blob) { reject(new Error('Your browser could not encode ' + format)); return; }
          resolve({ file: file, blob: blob, w: w, h: h });
        }, format, format === 'image/png' ? undefined : quality);
      });
    });
  }

  function extFor(mime) {
    return { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[mime] || 'img';
  }

  function card(r) {
    var ext = extFor($('#format').value);
    var name = r.file.name.replace(/\.[^.]+$/, '') + '.' + ext;
    var delta = r.blob.size - r.file.size;
    var pct = Math.round((delta / r.file.size) * 100);
    var url = URL.createObjectURL(r.blob);
    var el = document.createElement('div');
    el.className = 'card';
    el.style.cursor = 'default';
    el.innerHTML =
      '<img src="' + url + '" alt="" style="width:100%;height:130px;object-fit:contain;background:var(--bg);border-radius:8px;margin-bottom:10px">' +
      '<div style="font-weight:600;font-size:.87rem;word-break:break-all;margin-bottom:6px">' +
      name.replace(/[<>&]/g, '') + '</div>' +
      '<div class="hint">' + r.w + ' × ' + r.h + ' · ' + QT.bytes(r.file.size) + ' → ' + QT.bytes(r.blob.size) +
      ' <span style="color:' + (delta <= 0 ? 'var(--accent)' : 'var(--warn)') + '">' +
      (delta <= 0 ? pct + '%' : '+' + pct + '%') + '</span></div>' +
      '<button class="btn btn--sm js-dl" type="button" style="margin-top:10px;width:100%">Download</button>';
    el.querySelector('.js-dl').addEventListener('click', function () { QT.download(name, r.blob); });
    return el;
  }

  function handle(files) {
    var images = files.filter(function (f) { return /^image\//.test(f.type) || /\.(heic|heif|avif)$/i.test(f.name); });
    if (!images.length) { QT.msg($('#msg'), 'No image files in that selection.', 'warn'); return; }
    if (!supports($('#format').value)) {
      QT.msg($('#msg'), 'Your browser cannot encode ' + $('#format').value + '. Try PNG or JPEG.', 'err');
      return;
    }
    QT.msg($('#msg'), 'Converting ' + images.length + ' image' + (images.length === 1 ? '' : 's') + '…', 'warn');
    Promise.all(images.map(function (f) {
      return convertOne(f).catch(function (e) { return { error: e.message, file: f }; });
    })).then(function (results) {
      var ok = results.filter(function (r) { return !r.error; });
      var bad = results.filter(function (r) { return r.error; });
      outputs = ok;
      var box = $('#results');
      box.innerHTML = '';
      ok.forEach(function (r) { box.appendChild(card(r)); });
      $('#results-panel').hidden = !ok.length;
      var before = ok.reduce(function (s, r) { return s + r.file.size; }, 0);
      var after = ok.reduce(function (s, r) { return s + r.blob.size; }, 0);
      QT.msg($('#msg'),
        ok.length + ' converted · ' + QT.bytes(before) + ' → ' + QT.bytes(after) +
        (before ? ' (' + Math.round(((after - before) / before) * 100) + '%)' : '') +
        (bad.length ? ' · ' + bad.length + ' could not be decoded by this browser' : ''),
        bad.length ? 'warn' : 'ok');
    });
  }

  QT.dropzone($('#drop'), $('#file'), handle);
  $('#quality').addEventListener('input', function () { $('#q-val').textContent = this.value; });
  $('#clear').addEventListener('click', function () {
    outputs = []; $('#results').innerHTML = ''; $('#results-panel').hidden = true; QT.msg($('#msg'), '');
  });
  $('#dl-all').addEventListener('click', function () {
    if (!outputs.length) return;
    var ext = extFor($('#format').value);
    outputs.forEach(function (r, i) {
      setTimeout(function () {
        QT.download(r.file.name.replace(/\.[^.]+$/, '') + '.' + ext, r.blob);
      }, i * 250);
    });
    QT.toast('Saving ' + outputs.length + ' files…');
  });
}
