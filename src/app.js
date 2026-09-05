/* Quiet Tools shell: theme, search, and the QT helper namespace used by tools.
   No dependencies. Runs on every page. */
(function () {
  'use strict';

  /* ---------- tiny helpers exposed to tool scripts ---------- */
  var QT = {
    $: function (sel, root) { return (root || document).querySelector(sel); },
    $$: function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); },

    toast: function (msg) {
      var t = document.getElementById('toast');
      if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
      t.textContent = msg;
      t.classList.add('is-on');
      clearTimeout(t._timer);
      t._timer = setTimeout(function () { t.classList.remove('is-on'); }, 1800);
    },

    copy: function (text) {
      var done = function () { QT.toast('Copied to clipboard'); };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, function () { QT._legacyCopy(text, done); });
      } else { QT._legacyCopy(text, done); }
    },
    _legacyCopy: function (text, done) {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-9999px';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { QT.toast('Copy failed'); }
      document.body.removeChild(ta);
    },

    download: function (filename, content, mime) {
      var blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      var url = URL.createObjectURL(blob);
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    },

    /* read a File as 'text' | 'arrayBuffer' | 'dataURL' */
    read: function (file, as) {
      return new Promise(function (resolve, reject) {
        var fr = new FileReader();
        fr.onload = function () { resolve(fr.result); };
        fr.onerror = function () { reject(fr.error); };
        if (as === 'arrayBuffer') fr.readAsArrayBuffer(file);
        else if (as === 'dataURL') fr.readAsDataURL(file);
        else fr.readAsText(file);
      });
    },

    /* wire a .drop element + hidden <input type=file> to a callback */
    dropzone: function (dropEl, inputEl, onFiles) {
      if (!dropEl) return;
      var stop = function (e) { e.preventDefault(); e.stopPropagation(); };
      ['dragenter', 'dragover'].forEach(function (ev) {
        dropEl.addEventListener(ev, function (e) { stop(e); dropEl.classList.add('is-over'); });
      });
      ['dragleave', 'drop'].forEach(function (ev) {
        dropEl.addEventListener(ev, function (e) { stop(e); dropEl.classList.remove('is-over'); });
      });
      dropEl.addEventListener('drop', function (e) {
        var files = e.dataTransfer && e.dataTransfer.files;
        if (files && files.length) onFiles(Array.prototype.slice.call(files));
      });
      if (inputEl) {
        dropEl.addEventListener('click', function () { inputEl.click(); });
        dropEl.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputEl.click(); }
        });
        dropEl.setAttribute('tabindex', '0');
        dropEl.setAttribute('role', 'button');
        inputEl.addEventListener('change', function () {
          if (inputEl.files && inputEl.files.length) onFiles(Array.prototype.slice.call(inputEl.files));
          inputEl.value = '';
        });
      }
    },

    msg: function (el, text, kind) {
      if (!el) return;
      el.className = 'msg' + (text ? ' is-on msg--' + (kind || 'err') : '');
      el.textContent = text || '';
    },

    debounce: function (fn, ms) {
      var t; return function () {
        var args = arguments, self = this;
        clearTimeout(t); t = setTimeout(function () { fn.apply(self, args); }, ms == null ? 180 : ms);
      };
    },

    bytes: function (n) {
      if (n < 1024) return n + ' B';
      var u = ['KB', 'MB', 'GB'], i = -1;
      do { n /= 1024; i++; } while (n >= 1024 && i < u.length - 1);
      return n.toFixed(n < 10 ? 1 : 0) + ' ' + u[i];
    },

    /* localStorage that never throws (private mode, disabled storage) */
    store: {
      get: function (k, d) { try { var v = localStorage.getItem('qt:' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
      set: function (k, v) { try { localStorage.setItem('qt:' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
    },

    /* lazily load a pinned third-party script; resolves once, caches the promise */
    lib: (function () {
      var cache = {};
      return function (url) {
        if (cache[url]) return cache[url];
        cache[url] = new Promise(function (resolve, reject) {
          var s = document.createElement('script');
          s.src = url; s.async = true; s.crossOrigin = 'anonymous';
          s.onload = function () { resolve(); };
          s.onerror = function () { delete cache[url]; reject(new Error('Could not load ' + url)); };
          document.head.appendChild(s);
        });
        return cache[url];
      };
    })(),

    /* auto-wire [data-copy="#sel"] and [data-download="#sel"] buttons */
    wireButtons: function (root) {
      QT.$$('[data-copy]', root).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var src = QT.$(btn.getAttribute('data-copy'), root);
          if (!src) return;
          var text = 'value' in src ? src.value : src.textContent;
          if (!text) { QT.toast('Nothing to copy'); return; }
          QT.copy(text);
        });
      });
      QT.$$('[data-download]', root).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var src = QT.$(btn.getAttribute('data-download'), root);
          if (!src) return;
          var text = 'value' in src ? src.value : src.textContent;
          if (!text) { QT.toast('Nothing to download'); return; }
          QT.download(btn.getAttribute('data-filename') || 'output.txt', text);
        });
      });
      QT.$$('[data-clear]', root).forEach(function (btn) {
        btn.addEventListener('click', function () {
          QT.$$(btn.getAttribute('data-clear'), root).forEach(function (el) {
            if ('value' in el) { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); }
            else el.textContent = '';
          });
        });
      });
    },

    /* register a tool's main routine; runs after DOM ready with the tool root */
    tool: function (fn) {
      var start = function () {
        var root = document.getElementById('tool');
        if (!root) return;
        QT.wireButtons(root);
        try { fn(root, QT); }
        catch (e) {
          console.error(e);
          var box = document.createElement('div');
          box.className = 'msg is-on msg--err';
          box.textContent = 'This tool failed to start in your browser. Try reloading, or a different browser.';
          root.prepend(box);
        }
      };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
      else start();
    }
  };
  window.QT = QT;

  /* ---------- theme ---------- */
  var root = document.documentElement;
  var saved = QT.store.get('theme', null);
  if (saved) root.setAttribute('data-theme', saved);
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('#theme-toggle');
    if (!btn) return;
    var isLight = root.getAttribute('data-theme') === 'light';
    var next = isLight ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    QT.store.set('theme', next);
  });

  /* ---------- search ---------- */
  var q = document.getElementById('q');
  var results = document.getElementById('q-results');
  if (q && results) {
    var tools = null, active = -1;

    var load = function () {
      if (tools) return Promise.resolve(tools);
      return fetch('/assets/tools.json')
        .then(function (r) { return r.json(); })
        .then(function (j) { tools = j; return j; })
        .catch(function () { tools = []; return tools; });
    };

    var score = function (t, needle) {
      var hay = (t.title + ' ' + t.description + ' ' + (t.keywords || []).join(' ')).toLowerCase();
      var title = t.title.toLowerCase();
      if (title.startsWith(needle)) return 100;
      if (title.indexOf(needle) > -1) return 70;
      if (hay.indexOf(needle) > -1) return 40;
      /* subsequence match, so "jsnfmt" still finds "JSON Formatter" */
      var i = 0;
      for (var c = 0; c < title.length && i < needle.length; c++) if (title[c] === needle[i]) i++;
      return i === needle.length ? 15 : 0;
    };

    var render = function (list) {
      active = -1;
      if (!list.length) {
        results.innerHTML = '<div class="q-empty">No tools match that. <a href="/tools/">Browse all tools</a>.</div>';
      } else {
        results.innerHTML = list.slice(0, 8).map(function (t) {
          return '<a href="/' + t.slug + '/"><span>' + t.title + '</span><small>' + t.description + '</small></a>';
        }).join('');
      }
      results.hidden = false;
    };

    var run = function () {
      var needle = q.value.trim().toLowerCase();
      if (!needle) { results.hidden = true; return; }
      load().then(function (list) {
        var hits = list.map(function (t) { return { t: t, s: score(t, needle) }; })
                       .filter(function (x) { return x.s > 0; })
                       .sort(function (a, b) { return b.s - a.s; })
                       .map(function (x) { return x.t; });
        render(hits);
      });
    };

    q.addEventListener('focus', load);
    q.addEventListener('input', QT.debounce(run, 90));
    q.addEventListener('keydown', function (e) {
      var items = QT.$$('a', results);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!items.length) return;
        e.preventDefault();
        if (active > -1) items[active].classList.remove('is-active');
        active = e.key === 'ArrowDown'
          ? (active + 1) % items.length
          : (active <= 0 ? items.length - 1 : active - 1);
        items[active].classList.add('is-active');
        items[active].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        if (active > -1 && items[active]) { e.preventDefault(); window.location.href = items[active].href; }
        else if (items.length) { e.preventDefault(); window.location.href = items[0].href; }
      } else if (e.key === 'Escape') { q.blur(); results.hidden = true; }
    });
    document.addEventListener('click', function (e) {
      if (!results.contains(e.target) && e.target !== q) results.hidden = true;
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && document.activeElement !== q &&
          !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
        e.preventDefault(); q.focus(); q.select();
      }
    });
  }
})();
