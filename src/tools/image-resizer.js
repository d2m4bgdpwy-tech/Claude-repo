export const meta = {
  slug: 'image-resizer',
  title: 'Image Resizer',
  shortTitle: 'Image Resizer',
  h1: 'Resize Images Online',
  category: 'Images',
  icon: '⤢',
  description: 'Resize images by pixels, percentage or preset — single or batch, with aspect ratio locked. Runs in your browser, no upload, no quality loss on export.',
  keywords: ['image resizer', 'resize image online', 'resize photo', 'batch image resize', 'change image dimensions', 'resize png', 'instagram image size'],
  intro: 'Resize one image or a batch of them to exact pixel dimensions, a percentage, or a preset for common social and web sizes. Downscaling is done in steps so the result stays sharp instead of aliasing the way a naive single-pass resize does.',
  related: ['image-converter', 'image-compressor', 'favicon-generator'],
  html: `
<div class="panel">
  <div class="drop" id="drop">
    <strong>Drop images here</strong>
    <span>or click to choose — resized on your device, never uploaded</span>
    <input type="file" id="file" accept="image/*" multiple hidden>
  </div>
</div>

<div class="panel">
  <h3>Target size</h3>
  <div class="row row--tight" style="margin-bottom:14px">
    <label class="check"><input type="radio" name="mode" value="px" checked> Exact pixels</label>
    <label class="check"><input type="radio" name="mode" value="pct"> Percentage</label>
    <label class="check"><input type="radio" name="mode" value="preset"> Preset</label>
  </div>

  <div id="m-px" class="row">
    <div class="field"><label for="w">Width (px)</label><input type="number" id="w" min="1" max="20000" placeholder="1920"></div>
    <div class="field"><label for="h">Height (px)</label><input type="number" id="h" min="1" max="20000" placeholder="1080"></div>
    <div class="field" style="flex:0 0 auto;justify-self:end">
      <label>&nbsp;</label>
      <label class="check"><input type="checkbox" id="lock" checked> Lock aspect ratio</label>
    </div>
  </div>

  <div id="m-pct" hidden class="field" style="max-width:320px">
    <label for="pct">Scale: <span id="pct-val">50</span>%</label>
    <input type="range" id="pct" min="1" max="200" value="50">
  </div>

  <div id="m-preset" hidden class="field" style="max-width:420px">
    <label for="preset">Preset</label>
    <select id="preset">
      <option value="1920x1080">Full HD — 1920 × 1080</option>
      <option value="1280x720">HD — 1280 × 720</option>
      <option value="3840x2160">4K — 3840 × 2160</option>
      <option value="1200x630">Open Graph / social card — 1200 × 630</option>
      <option value="1080x1080">Instagram square — 1080 × 1080</option>
      <option value="1080x1350">Instagram portrait — 1080 × 1350</option>
      <option value="1080x1920">Story / Reel — 1080 × 1920</option>
      <option value="1500x500">X header — 1500 × 500</option>
      <option value="1584x396">LinkedIn banner — 1584 × 396</option>
      <option value="2560x1440">YouTube channel art — 2560 × 1440</option>
      <option value="1280x720y">YouTube thumbnail — 1280 × 720</option>
      <option value="800x800">Product photo — 800 × 800</option>
    </select>
  </div>

  <div class="row row--tight" style="margin-top:14px">
    <label class="lbl" for="fit">Fit</label>
    <select id="fit" style="width:auto">
      <option value="contain">Contain — fit inside, keep whole image</option>
      <option value="cover">Cover — fill exactly, crop overflow</option>
      <option value="stretch">Stretch — ignore aspect ratio</option>
    </select>
    <label class="lbl" for="format">Save as</label>
    <select id="format" style="width:auto">
      <option value="">Keep original format</option>
      <option value="image/jpeg">JPEG</option>
      <option value="image/png">PNG</option>
      <option value="image/webp">WebP</option>
    </select>
    <label class="check"><input type="checkbox" id="noup" checked> Never enlarge</label>
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
    { q: 'Will resizing make my image blurry?', a: 'Enlarging always will — there is no extra detail to invent. Shrinking should not: this tool halves the image repeatedly until it is close to the target, then does the final step, which avoids the aliasing you get from one big jump. Leave "never enlarge" ticked unless you specifically want upscaling.' },
    { q: 'Contain or cover?', a: '<strong>Contain</strong> fits the whole image inside your dimensions, so the result may be smaller than requested in one direction. <strong>Cover</strong> fills the box exactly and crops whatever hangs over — right for avatars and banners where the frame is fixed.' },
    { q: 'Does it work on a phone?', a: 'Yes. The processing happens on the device, so very large images on an older phone can be slow or run out of memory — but a handful of photos at a time is fine.' },
    { q: 'Are my photos uploaded?', a: 'No. Files are read with the FileReader API, drawn to a canvas, and encoded back to a blob, all in this tab. You can watch the Network panel stay silent, or work with Wi-Fi off.' }
  ]
};

export function client(root, QT) {
  var $ = function (s) { return root.querySelector(s); };
  var loaded = [], outputs = [];

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
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not decode ' + file.name)); };
      img.src = url;
    });
  }

  function mode() { return root.querySelector('input[name=mode]:checked').value; }

  function targetFor(sw, sh) {
    var m = mode(), tw, th;
    if (m === 'pct') {
      var p = Number($('#pct').value) / 100;
      return { w: Math.max(1, Math.round(sw * p)), h: Math.max(1, Math.round(sh * p)), fit: 'stretch' };
    }
    if (m === 'preset') {
      var dims = $('#preset').value.replace(/[^0-9x]/g, '').split('x');
      tw = Number(dims[0]); th = Number(dims[1]);
    } else {
      tw = Number($('#w').value) || 0;
      th = Number($('#h').value) || 0;
      if (!tw && !th) return null;
      if ($('#lock').checked) {
        if (tw && !th) th = Math.round(tw * sh / sw);
        else if (th && !tw) tw = Math.round(th * sw / sh);
      } else {
        if (!tw) tw = sw;
        if (!th) th = sh;
      }
    }
    return { w: tw, h: th, fit: $('#fit').value };
  }

  /* Halve repeatedly before the final draw — much sharper than one big downscale. */
  function drawScaled(bitmap, dw, dh) {
    var canvas = document.createElement('canvas');
    canvas.width = dw; canvas.height = dh;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    var src = bitmap, sw = bitmap.width, sh = bitmap.height;
    var tmp = null;
    while (sw > dw * 2 && sh > dh * 2) {
      var nw = Math.max(dw, Math.floor(sw / 2)), nh = Math.max(dh, Math.floor(sh / 2));
      var step = document.createElement('canvas');
      step.width = nw; step.height = nh;
      var sctx = step.getContext('2d');
      sctx.imageSmoothingEnabled = true;
      sctx.imageSmoothingQuality = 'high';
      sctx.drawImage(src, 0, 0, nw, nh);
      src = step; sw = nw; sh = nh; tmp = step;
    }
    return { canvas: canvas, ctx: ctx, src: src, sw: sw, sh: sh };
  }

  function resizeOne(item) {
    var bitmap = item.bitmap;
    var t = targetFor(bitmap.width, bitmap.height);
    if (!t) return Promise.resolve(null);

    var tw = t.w, th = t.h;
    if ($('#noup').checked && mode() !== 'pct') {
      if (tw > bitmap.width && th > bitmap.height) { tw = bitmap.width; th = bitmap.height; }
    }

    var outW = tw, outH = th;
    var sx = 0, sy = 0, sw = bitmap.width, sh = bitmap.height;

    if (t.fit === 'contain') {
      var scale = Math.min(tw / bitmap.width, th / bitmap.height);
      if ($('#noup').checked) scale = Math.min(scale, 1);
      outW = Math.max(1, Math.round(bitmap.width * scale));
      outH = Math.max(1, Math.round(bitmap.height * scale));
    } else if (t.fit === 'cover') {
      var ar = tw / th, sar = bitmap.width / bitmap.height;
      if (sar > ar) { sw = Math.round(bitmap.height * ar); sx = Math.round((bitmap.width - sw) / 2); }
      else { sh = Math.round(bitmap.width / ar); sy = Math.round((bitmap.height - sh) / 2); }
    }

    var canvas = document.createElement('canvas');
    canvas.width = outW; canvas.height = outH;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (t.fit === 'cover') {
      ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, outW, outH);
    } else {
      var stepped = drawScaled(bitmap, outW, outH);
      stepped.ctx.drawImage(stepped.src, 0, 0, stepped.sw, stepped.sh, 0, 0, outW, outH);
      ctx.drawImage(stepped.canvas, 0, 0);
    }

    var format = $('#format').value || (item.file.type === 'image/png' ? 'image/png' : 'image/jpeg');
    if (format === 'image/jpeg') {
      var flat = document.createElement('canvas');
      flat.width = outW; flat.height = outH;
      var fctx = flat.getContext('2d');
      fctx.fillStyle = '#fff';
      fctx.fillRect(0, 0, outW, outH);
      fctx.drawImage(canvas, 0, 0);
      canvas = flat;
    }

    return new Promise(function (resolve) {
      canvas.toBlob(function (blob) {
        resolve({ file: item.file, blob: blob, w: outW, h: outH, format: format });
      }, format, 0.9);
    });
  }

  function extFor(mime) { return { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[mime] || 'jpg'; }
  function nameFor(r) { return r.file.name.replace(/\.[^.]+$/, '') + '-' + r.w + 'x' + r.h + '.' + extFor(r.format); }

  function renderAll() {
    if (!loaded.length) return;
    QT.msg($('#msg'), 'Resizing…', 'warn');
    Promise.all(loaded.map(resizeOne)).then(function (results) {
      results = results.filter(Boolean);
      if (!results.length) {
        QT.msg($('#msg'), 'Enter a width or a height.', 'warn');
        return;
      }
      outputs = results;
      var box = $('#results');
      box.innerHTML = '';
      results.forEach(function (r) {
        var url = URL.createObjectURL(r.blob);
        var el = document.createElement('div');
        el.className = 'card';
        el.style.cursor = 'default';
        el.innerHTML =
          '<img src="' + url + '" alt="" style="width:100%;height:130px;object-fit:contain;background:var(--bg);border-radius:8px;margin-bottom:10px">' +
          '<div style="font-weight:600;font-size:.87rem;word-break:break-all;margin-bottom:6px">' +
          nameFor(r).replace(/[<>&]/g, '') + '</div>' +
          '<div class="hint">' + r.w + ' × ' + r.h + ' · ' + QT.bytes(r.blob.size) + '</div>' +
          '<button class="btn btn--sm js-dl" type="button" style="margin-top:10px;width:100%">Download</button>';
        el.querySelector('.js-dl').addEventListener('click', function () { QT.download(nameFor(r), r.blob); });
        box.appendChild(el);
      });
      $('#results-panel').hidden = false;
      QT.msg($('#msg'), results.length + ' image' + (results.length === 1 ? '' : 's') + ' resized on this device.', 'ok');
    });
  }

  QT.dropzone($('#drop'), $('#file'), function (files) {
    var images = files.filter(function (f) { return /^image\//.test(f.type); });
    if (!images.length) { QT.msg($('#msg'), 'No image files in that selection.', 'warn'); return; }
    QT.msg($('#msg'), 'Reading…', 'warn');
    Promise.all(images.map(function (f) {
      return decode(f).then(function (b) { return { file: f, bitmap: b }; }).catch(function () { return null; });
    })).then(function (items) {
      loaded = items.filter(Boolean);
      if (loaded.length && !$('#w').value && !$('#h').value) {
        $('#w').value = Math.round(loaded[0].bitmap.width / 2);
        $('#h').value = Math.round(loaded[0].bitmap.height / 2);
      }
      renderAll();
    });
  });

  QT.$$('input[name=mode]', root).forEach(function (r) {
    r.addEventListener('change', function () {
      $('#m-px').hidden = mode() !== 'px';
      $('#m-pct').hidden = mode() !== 'pct';
      $('#m-preset').hidden = mode() !== 'preset';
      renderAll();
    });
  });
  $('#pct').addEventListener('input', function () { $('#pct-val').textContent = this.value; });
  ['#w', '#h', '#pct', '#preset', '#fit', '#format', '#noup', '#lock'].forEach(function (s) {
    $(s).addEventListener('change', renderAll);
  });
  $('#w').addEventListener('input', QT.debounce(function () {
    if ($('#lock').checked && loaded.length && $('#w').value) {
      var b = loaded[0].bitmap;
      $('#h').value = Math.round(Number($('#w').value) * b.height / b.width);
    }
    renderAll();
  }, 400));
  $('#h').addEventListener('input', QT.debounce(function () {
    if ($('#lock').checked && loaded.length && $('#h').value) {
      var b = loaded[0].bitmap;
      $('#w').value = Math.round(Number($('#h').value) * b.width / b.height);
    }
    renderAll();
  }, 400));

  $('#clear').addEventListener('click', function () {
    loaded = []; outputs = [];
    $('#results').innerHTML = ''; $('#results-panel').hidden = true; QT.msg($('#msg'), '');
  });
  $('#dl-all').addEventListener('click', function () {
    outputs.forEach(function (r, i) {
      setTimeout(function () { QT.download(nameFor(r), r.blob); }, i * 250);
    });
    QT.toast('Saving ' + outputs.length + ' files…');
  });
}
