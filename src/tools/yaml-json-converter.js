export const meta = {
  slug: 'yaml-json-converter',
  weight: 30,  /* order within its category — lower comes first */
  title: 'YAML to JSON Converter (and back)',
  shortTitle: 'YAML ⇄ JSON',
  h1: 'YAML ⇄ JSON Converter',
  category: 'JSON & Data',
  icon: 'Y',
  description: 'Convert YAML to JSON or JSON to YAML in your browser. Handles multi-document YAML, anchors and comments-free round trips.',
  keywords: ['yaml to json', 'json to yaml', 'yaml converter', 'yaml validator', 'convert yaml online', 'kubernetes yaml to json'],
  intro: 'Paste YAML to get JSON, or JSON to get YAML. Handy for Kubernetes manifests, GitHub Actions workflows and docker-compose files — none of which you should be pasting into a server you do not control.',
  related: ['json-formatter', 'json-to-csv', 'env-to-json'],
  html: `
<div class="panel">
  <div class="btns">
    <button class="btn btn--primary" id="to-json">YAML → JSON</button>
    <button class="btn" id="to-yaml">JSON → YAML</button>
    <button class="btn btn--ghost" id="swap">Swap panes</button>
    <button class="btn btn--ghost" id="sample">Load sample</button>
    <button class="btn btn--ghost" data-clear="#in,#out">Clear</button>
  </div>
  <div class="io">
    <div class="field">
      <label for="in">Input</label>
      <textarea id="in" spellcheck="false" placeholder="name: my-app&#10;replicas: 3&#10;ports:&#10;  - 80&#10;  - 443"></textarea>
    </div>
    <div class="field">
      <label for="out">Output</label>
      <textarea id="out" spellcheck="false" readonly></textarea>
    </div>
  </div>
  <div class="btns">
    <button class="btn btn--sm" data-copy="#out">Copy output</button>
    <button class="btn btn--sm" id="dl">Download</button>
  </div>
  <div id="msg" class="msg"></div>
</div>`,
  faq: [
    { q: 'Are my comments preserved?', a: 'No, and no converter can preserve them in both directions: JSON has no syntax for comments, so anything after a <code>#</code> is dropped when YAML becomes JSON. Converting back produces valid YAML without the original comments.' },
    { q: 'Does it support multi-document YAML?', a: 'Yes. A file with <code>---</code> separators becomes a JSON array with one entry per document.' },
    { q: 'Which YAML version?', a: 'YAML 1.2 core schema, via the js-yaml library loaded from a public CDN the first time you use the tool. That request contains the library name only — never your document.' },
    { q: 'Why did my "yes" turn into true?', a: 'That is YAML 1.1 behaviour and js-yaml\'s 1.2 core schema deliberately does not do it — <code>yes</code> stays a string here. If another tool in your pipeline uses YAML 1.1, quote such values explicitly.' }
  ]
};

export function client(root, QT) {
  var $ = function (s) { return root.querySelector(s); };
  var inEl = $('#in'), outEl = $('#out'), msg = $('#msg');
  var LIB = 'https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js';
  var lastMode = 'json';

  function withYaml(fn) {
    if (window.jsyaml) { fn(window.jsyaml); return; }
    QT.msg(msg, 'Loading the YAML parser…', 'warn');
    QT.lib(LIB).then(function () {
      QT.msg(msg, '');
      fn(window.jsyaml);
    }).catch(function () {
      QT.msg(msg, 'Could not load the YAML parser. Check your connection and reload — once it is cached, the tool works offline.', 'err');
    });
  }

  function toJson() {
    lastMode = 'json';
    var text = inEl.value;
    if (!text.trim()) { outEl.value = ''; QT.msg(msg, ''); return; }
    withYaml(function (Y) {
      try {
        var docs = Y.loadAll(text);
        var data = docs.length === 1 ? docs[0] : docs;
        outEl.value = JSON.stringify(data, null, 2);
        QT.msg(msg, docs.length > 1 ? 'Valid YAML — ' + docs.length + ' documents' : 'Valid YAML', 'ok');
      } catch (e) {
        QT.msg(msg, String(e.message || e).split('\n').slice(0, 3).join('\n'), 'err');
      }
    });
  }

  function toYaml() {
    lastMode = 'yaml';
    var text = inEl.value;
    if (!text.trim()) { outEl.value = ''; QT.msg(msg, ''); return; }
    withYaml(function (Y) {
      try {
        var data = JSON.parse(text);
        outEl.value = Y.dump(data, { indent: 2, lineWidth: 100, noRefs: true });
        QT.msg(msg, 'Converted to YAML', 'ok');
      } catch (e) {
        QT.msg(msg, 'That is not valid JSON: ' + e.message, 'err');
      }
    });
  }

  function auto() {
    var t = inEl.value.trim();
    if (!t) { outEl.value = ''; QT.msg(msg, ''); return; }
    if (t[0] === '{' || t[0] === '[') toYaml(); else toJson();
  }

  $('#to-json').addEventListener('click', toJson);
  $('#to-yaml').addEventListener('click', toYaml);
  $('#swap').addEventListener('click', function () {
    var v = outEl.value;
    if (!v) return;
    outEl.value = inEl.value; inEl.value = v;
    auto();
  });
  inEl.addEventListener('input', QT.debounce(auto, 320));
  $('#sample').addEventListener('click', function () {
    inEl.value = 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: web\n  labels:\n    app: web\n' +
      'spec:\n  replicas: 3\n  template:\n    spec:\n      containers:\n        - name: web\n' +
      '          image: nginx:1.27\n          ports:\n            - containerPort: 80\n';
    toJson();
  });
  $('#dl').addEventListener('click', function () {
    if (!outEl.value) { QT.toast('Nothing to download'); return; }
    QT.download(lastMode === 'json' ? 'output.json' : 'output.yaml', outEl.value);
  });
}
