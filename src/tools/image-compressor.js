export const meta = {
  slug: 'image-compressor',
  weight: 15,  /* order within its category — lower comes first */
  title: 'Image Compressor',
  shortTitle: 'Image Compressor',
  h1: 'Compress Images Online',
  category: 'Images',
  icon: '↓',
  description: 'Shrink JPEG, PNG and WebP files to a target size or quality, with a before/after comparison. Compressed on your device — no upload, no file limits.',
  keywords: ['image compressor', 'compress jpeg', 'compress png', 'reduce image size', 'compress image to 100kb', 'optimize images for web'],
  intro: 'Reduce image file size for the web. Set a quality level, or give a target file size in kilobytes and the tool searches for the highest quality that fits. Compare before and after at full resolution before you download.',
  related: ['image-converter', 'image-resizer', 'favicon-generator'],
  html: `
<div class="panel">
  <div class="drop" id="drop">
    <strong>Drop images to compress</strong>
    <span>or click to choose — processed on your device, no size limit but your own memory</span>
    <input type="file" id="file" accept="image/*" multiple hidden>
  </div>
  <div class="row row--tight" style="margin-top:14px">
    <label class="check"><input type="radio" name="mode" value="quality" checked> By quality</label>
    <label class="check"><input type="radio" name="mode" value="size"> By target file size</label>
  </div>
  <div id="m-quality" class="field" style="max-width:340px;margin-top:12px">
    <label for="quality">Quality: <span id="q-val">75</span>%</label>
    <input type="range" id="quality" min="10" max="100" value="75">
  </div>
  <div id="m-size" hidden class="row" style="margin-top:12px">
    <div class="field" style="max-width:200px">
      <label for="target">Target size (KB)</label>
      <input type="number" id="target" value="200" min="5" max="20000">
    </div>
  </div>
  <div class="row row--tight" style="margin-top:12px">
    <label class="lbl" for="format">Output format</label>
    <select id="format" style="width:auto">
      <option value="image/webp" selected>WebP — smallest</option>
      <option value="image/jpeg">JPEG</option>
      <option value="">Keep original</option>
    </select>
    <label class="lbl" for="maxw">Also cap width</label>
    <select id="maxw" style="width:auto">
      <option value="0">No limit</option>
      <option value="2560">2560 px</option>
      <option value="1920">1920 px</option>
      <option value="1600">1600 px</option>
      <option value="1200">1200 px</option>
      <option value="800">800 px</option>
    </select>
  </div>
  <div id="msg" class="msg"></div>
</div>

<div class="panel" id="results-panel" hidden>
  <div class="stat-grid" style="margin-bottom:14px">
    <div class="stat"><b id="s-before">0</b><span>Before</span></div>
    <div class="stat"><b id="s-after">0</b><span>After</span></div>
    <div class="stat"><b id="s-saved" style="color:var(--accent)">0%</b><span>Saved</span></div>
    <div class="stat"><b id="s-count">0</b><span>Images</span></div>
  </div>
  <div class="btns">
    <button class="btn btn--primary" id="dl-all">Download all</button>
    <button class="btn btn--ghost" id="clear">Clear</button>
  </div>
  <div id="results"></div>
</div>`,
  faq: [
    { q: 'How does "target file size" work?', a: 'The tool binary-searches the encoder quality — trying a value, measuring the result, and narrowing the range — until it finds the highest quality that fits under your target. It usually converges in about eight attempts, all locally.' },
    { q: 'Why does compressing a PNG barely help?', a: 'PNG is lossless, so the only savings come from better prediction and palette reduction. Converting a photographic PNG to WebP or JPEG is what actually shrinks it — often by 80% or more. Keep PNG for screenshots, logos and anything with sharp edges or transparency.' },
    { q: 'What quality should I use for the web?', a: '75–80% is the usual sweet spot: visually indistinguishable from the original at normal viewing size, at a fraction of the bytes. Below about 60% you start to see blocking around edges and in flat gradients.' },
    { q: 'Is the compression lossless?', a: 'Only if you keep PNG. JPEG and WebP (in the mode used here) are lossy — pixels are genuinely discarded. Always compress from your original file rather than recompressing an already-compressed copy, which stacks the artefacts.' },
    { q: 'Is there a file size limit?', a: 'No imposed limit. The practical ceiling is your device\'s memory, since the image is decoded to raw pixels — roughly width × height × 4 bytes. A 50-megapixel photo needs about 200 MB while it is being processed.' }
  ]
};

export function client(root, QT) {
  var $ = function (s) { return root.querySelector(s); };
  var outputs = [];

  function decode(file) {
    if (window.createImageBitmap) {
      return createImageBitmap(file, { imageOrientation: 'from-image' }).catch(function () { return viaImg(file); });
    }
    return viaImg(file);
  }
  function viaImg(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('decode failed')); };
      img.src = url;
    });
  }

  function toCanvas(bitmap) {
    var w = bitmap.width, h = bitmap.height;
    var cap = Number($('#maxw').value);
    if (cap && w > cap) { h = Math.round(h * cap / w); w = cap; }
    var canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#fff';
    if ($('#format').value === 'image/jpeg') ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    return canvas;
  }

  function encode(canvas, format, q) {
    return new Promise(function (resolve) {
      canvas.toBlob(function (b) { resolve(b); }, format, q);
    });
  }

  /* Binary search the quality that lands just under the target size. */
  function toTarget(canvas, format, targetBytes) {
    var lo = 0.05, hi = 0.98, best = null;
    var step = function (n) {
      if (n === 0) return Promise.resolve(best);
      var mid = (lo + hi) / 2;
      return encode(canvas, format, mid).then(function (blob) {
        if (blob.size <= targetBytes) { best = { blob: blob, q: mid }; lo = mid; }
        else hi = mid;
        return step(n - 1);
      });
    };
    return step(8).then(function (r) {
      if (r) return r;
      return encode(canvas, format, 0.05).then(function (b) { return { blob: b, q: 0.05 }; });
    });
  }

  function compressOne(file) {
    return decode(file).then(function (bitmap) {
      var canvas = toCanvas(bitmap);
      if (bitmap.close) bitmap.close();
      var format = $('#format').value || (file.type === 'image/png' ? 'image/png' : 'image/jpeg');
      var byTarget = root.querySelector('input[name=mode]:checked').value === 'size';
      var promise = byTarget
        ? toTarget(canvas, format, Number($('#target').value) * 1024)
        : encode(canvas, format, Number($('#quality').value) / 100).then(function (b) {
            return { blob: b, q: Number($('#quality').value) / 100 };
          });
      return promise.then(function (r) {
        return { file: file, blob: r.blob, q: r.q, w: canvas.width, h: canvas.height, format: format };
      });
    });
  }

  function extFor(m) { return { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[m] || 'jpg'; }
  function nameFor(r) { return r.file.name.replace(/\.[^.]+$/, '') + '-compressed.' + extFor(r.format); }

  function row(r) {
    var before = URL.createObjectURL(r.file);
    var after = URL.createObjectURL(r.blob);
    var saved = Math.round((1 - r.blob.size / r.file.size) * 100);
    var el = document.createElement('div');
    el.className = 'panel';
    el.style.marginTop = '12px';
    el.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:10px">' +
      '<strong style="word-break:break-all">' + r.file.name.replace(/[<>&]/g, '') + '</strong>' +
      '<span class="hint">' + r.w + ' × ' + r.h + ' · quality ' + Math.round(r.q * 100) + '%</span></div>' +
      '<div class="io">' +
      '<div><span class="lbl">Before — ' + QT.bytes(r.file.size) + '</span>' +
      '<img src="' + before + '" alt="" style="width:100%;max-height:280px;object-fit:contain;background:var(--bg);border-radius:8px;margin-top:6px"></div>' +
      '<div><span class="lbl">After — ' + QT.bytes(r.blob.size) +
      ' <span style="color:' + (saved > 0 ? 'var(--accent)' : 'var(--warn)') + '">(' +
      (saved > 0 ? '−' + saved : '+' + Math.abs(saved)) + '%)</span></span>' +
      '<img src="' + after + '" alt="" style="width:100%;max-height:280px;object-fit:contain;background:var(--bg);border-radius:8px;margin-top:6px"></div>' +
      '</div>' +
      '<button class="btn btn--sm js-dl" type="button" style="margin-top:12px">Download compressed</button>';
    el.querySelector('.js-dl').addEventListener('click', function () { QT.download(nameFor(r), r.blob); });
    return el;
  }

  var files = [];

  function runAll() {
    if (!files.length) return;
    QT.msg($('#msg'), 'Compressing ' + files.length + ' image' + (files.length === 1 ? '' : 's') + '…', 'warn');
    Promise.all(files.map(function (f) {
      return compressOne(f).catch(function () { return null; });
    })).then(function (results) {
      results = results.filter(Boolean);
      outputs = results;
      var box = $('#results');
      box.innerHTML = '';
      results.forEach(function (r) { box.appendChild(row(r)); });
      var before = results.reduce(function (s, r) { return s + r.file.size; }, 0);
      var after = results.reduce(function (s, r) { return s + r.blob.size; }, 0);
      $('#s-before').textContent = QT.bytes(before);
      $('#s-after').textContent = QT.bytes(after);
      $('#s-saved').textContent = before ? Math.round((1 - after / before) * 100) + '%' : '—';
      $('#s-count').textContent = results.length;
      $('#results-panel').hidden = false;
      QT.msg($('#msg'), 'Done — ' + QT.bytes(before - after) + ' saved, all on this device.', 'ok');
    });
  }

  QT.dropzone($('#drop'), $('#file'), function (list) {
    files = list.filter(function (f) { return /^image\//.test(f.type); });
    if (!files.length) { QT.msg($('#msg'), 'No image files in that selection.', 'warn'); return; }
    runAll();
  });

  QT.$$('input[name=mode]', root).forEach(function (r) {
    r.addEventListener('change', function () {
      var byTarget = root.querySelector('input[name=mode]:checked').value === 'size';
      $('#m-quality').hidden = byTarget;
      $('#m-size').hidden = !byTarget;
      runAll();
    });
  });
  $('#quality').addEventListener('input', function () { $('#q-val').textContent = this.value; });
  $('#quality').addEventListener('change', runAll);
  ['#target', '#format', '#maxw'].forEach(function (s) { $(s).addEventListener('change', runAll); });
  $('#clear').addEventListener('click', function () {
    files = []; outputs = [];
    $('#results').innerHTML = ''; $('#results-panel').hidden = true; QT.msg($('#msg'), '');
  });
  $('#dl-all').addEventListener('click', function () {
    outputs.forEach(function (r, i) {
      setTimeout(function () { QT.download(nameFor(r), r.blob); }, i * 250);
    });
    QT.toast('Saving ' + outputs.length + ' files…');
  });
}
