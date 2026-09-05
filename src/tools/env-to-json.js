export const meta = {
  slug: 'env-to-json',
  weight: 20,  /* order within its category — lower comes first */
  title: '.env to JSON Converter',
  shortTitle: '.env ⇄ JSON',
  h1: 'Convert .env Files to JSON, YAML or Shell Exports',
  category: 'Developer',
  icon: '$',
  description: 'Convert a .env file into JSON, YAML, shell exports, Docker or Kubernetes format — and back. Runs locally, so secrets stay on your machine.',
  keywords: ['env to json', 'dotenv converter', 'env file to json', 'json to env', 'environment variables converter', 'env to yaml'],
  intro: 'Reshape environment variables between the formats every deployment target wants. This is exactly the kind of file you should never paste into an online converter — so this one runs entirely in your browser, with nothing sent anywhere.',
  related: ['yaml-json-converter', 'json-formatter', 'base64-encode-decode'],
  html: `
<div class="panel">
  <div class="row row--tight" style="margin-bottom:12px">
    <label class="lbl" for="to">Convert to</label>
    <select id="to" style="width:auto">
      <option value="json">JSON</option>
      <option value="json-nested">JSON — nested by prefix</option>
      <option value="yaml">YAML</option>
      <option value="shell">Shell exports</option>
      <option value="docker">Docker --env flags</option>
      <option value="compose">docker-compose environment</option>
      <option value="k8s">Kubernetes env list</option>
      <option value="tf">Terraform variables</option>
      <option value="env">.env (normalise)</option>
    </select>
    <label class="check"><input type="checkbox" id="quote" checked> Quote values that need it</label>
    <label class="check"><input type="checkbox" id="mask"> Mask values (share safely)</label>
    <label class="check"><input type="checkbox" id="sort"> Sort keys</label>
  </div>
  <div class="io">
    <div class="field">
      <label for="in">Input — .env or JSON</label>
      <textarea id="in" spellcheck="false" placeholder="# comments are preserved where the format allows&#10;DATABASE_URL=postgres://localhost:5432/app&#10;PORT=3000&#10;DEBUG=true"></textarea>
    </div>
    <div class="field">
      <label for="out">Output</label>
      <textarea id="out" spellcheck="false" readonly></textarea>
    </div>
  </div>
  <div class="btns">
    <button class="btn btn--sm" data-copy="#out">Copy</button>
    <button class="btn btn--sm" id="dl">Download</button>
    <button class="btn btn--ghost btn--sm" id="sample">Load sample</button>
    <button class="btn btn--ghost btn--sm" data-clear="#in,#out">Clear</button>
  </div>
  <div id="msg" class="msg"></div>
</div>`,
  faq: [
    { q: 'Is it safe to paste real secrets in here?', a: 'Safer than any converter that posts to a server, because this page has no server to post to — the parsing happens in JavaScript in your tab. That said: if a secret has been in a browser tab, in your clipboard, and in your shell history, rotating it is cheap insurance. The "mask" option exists so you can share the shape of a config without the values.' },
    { q: 'How are quotes and multi-line values handled?', a: 'Single and double quotes around a value are stripped, escaped sequences inside double quotes (<code>\\n</code>, <code>\\t</code>) are expanded, and <code>export</code> prefixes are ignored. Multi-line values are supported when wrapped in quotes.' },
    { q: 'What does "nested by prefix" do?', a: 'It turns <code>DB_HOST</code> and <code>DB_PORT</code> into <code>{ "DB": { "HOST": …, "PORT": … } }</code>. Useful when feeding a config library that expects a nested object rather than a flat map.' },
    { q: 'Can it go the other way?', a: 'Yes. Paste JSON in the input box and choose <code>.env</code> or any other target — the tool detects which direction you are going from the shape of the input.' }
  ]
};

export function client(root, QT) {
  var $ = function (s) { return root.querySelector(s); };

  function parseEnv(text) {
    var vars = [], errors = 0;
    var lines = text.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var trimmed = line.trim();
      if (!trimmed || trimmed[0] === '#') continue;
      var m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_.]*)\s*=\s*([\s\S]*)$/.exec(line);
      if (!m) { errors++; continue; }
      var key = m[1], value = m[2];

      /* a quoted value may span lines */
      var q = value[0];
      if (q === '"' || q === "'") {
        if (value.length < 2 || value[value.length - 1] !== q || /\\$/.test(value.slice(0, -1))) {
          while (i + 1 < lines.length && value[value.length - 1] !== q) {
            i++; value += '\n' + lines[i];
          }
        }
        value = value.slice(1, value.lastIndexOf(q));
        if (q === '"') {
          value = value.replace(/\\n/g, '\n').replace(/\\t/g, '\t')
                       .replace(/\\r/g, '\r').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }
      } else {
        value = value.replace(/\s+#.*$/, '').trim();
      }
      vars.push([key, value]);
    }
    return { vars: vars, errors: errors };
  }

  function flatten(obj, prefix, out) {
    out = out || [];
    Object.keys(obj).forEach(function (k) {
      var v = obj[k], key = prefix ? prefix + '_' + k : k;
      if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
      else out.push([key, Array.isArray(v) ? v.join(',') : String(v)]);
    });
    return out;
  }

  function needsQuote(v) {
    return /[\s"'$`\\#]/.test(v) || v === '';
  }
  function shQuote(v) {
    if (!$('#quote').checked) return v;
    if (!needsQuote(v)) return v;
    return "'" + v.replace(/'/g, "'\\''") + "'";
  }
  function envQuote(v) {
    if (!$('#quote').checked || !needsQuote(v)) return v;
    return '"' + v.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
  }
  function maskValue(v) {
    if (!$('#mask').checked) return v;
    if (v.length <= 4) return '****';
    return v.slice(0, 2) + '*'.repeat(Math.min(12, v.length - 4)) + v.slice(-2);
  }

  function nest(vars) {
    var out = {};
    vars.forEach(function (pair) {
      var parts = pair[0].split('_');
      var node = out;
      for (var i = 0; i < parts.length - 1; i++) {
        if (typeof node[parts[i]] !== 'object' || node[parts[i]] === null) node[parts[i]] = {};
        node = node[parts[i]];
      }
      node[parts[parts.length - 1]] = pair[1];
    });
    return out;
  }

  function convert() {
    var text = $('#in').value;
    if (!text.trim()) { $('#out').value = ''; QT.msg($('#msg'), ''); return; }

    var vars, source;
    var trimmed = text.trim();
    if (trimmed[0] === '{') {
      try { vars = flatten(JSON.parse(trimmed)); source = 'JSON'; }
      catch (e) { QT.msg($('#msg'), 'That looks like JSON but does not parse: ' + e.message, 'err'); return; }
    } else {
      var parsed = parseEnv(text);
      vars = parsed.vars;
      source = '.env';
      if (parsed.errors) {
        QT.msg($('#msg'), parsed.errors + ' line(s) could not be read as KEY=value and were skipped.', 'warn');
      }
    }

    if ($('#sort').checked) vars = vars.slice().sort(function (a, b) { return a[0].localeCompare(b[0]); });
    vars = vars.map(function (p) { return [p[0], maskValue(p[1])]; });

    var to = $('#to').value, out;
    if (to === 'json') {
      out = JSON.stringify(vars.reduce(function (o, p) { o[p[0]] = p[1]; return o; }, {}), null, 2);
    } else if (to === 'json-nested') {
      out = JSON.stringify(nest(vars), null, 2);
    } else if (to === 'yaml') {
      out = vars.map(function (p) {
        return p[0] + ': ' + (/[:#\n]|^\s|\s$|^$/.test(p[1]) ? JSON.stringify(p[1]) : p[1]);
      }).join('\n');
    } else if (to === 'shell') {
      out = vars.map(function (p) { return 'export ' + p[0] + '=' + shQuote(p[1]); }).join('\n');
    } else if (to === 'docker') {
      out = vars.map(function (p) { return '  --env ' + shQuote(p[0] + '=' + p[1]) + ' \\'; }).join('\n').replace(/ \\$/, '');
    } else if (to === 'compose') {
      out = 'environment:\n' + vars.map(function (p) {
        return '  - ' + p[0] + '=' + p[1];
      }).join('\n');
    } else if (to === 'k8s') {
      out = 'env:\n' + vars.map(function (p) {
        return '  - name: ' + p[0] + '\n    value: ' + JSON.stringify(p[1]);
      }).join('\n');
    } else if (to === 'tf') {
      out = vars.map(function (p) {
        return 'variable "' + p[0].toLowerCase() + '" {\n  type    = string\n  default = ' +
          JSON.stringify(p[1]) + '\n}';
      }).join('\n\n');
    } else {
      out = vars.map(function (p) { return p[0] + '=' + envQuote(p[1]); }).join('\n');
    }

    $('#out').value = out;
    if (!$('#msg').textContent) {
      QT.msg($('#msg'), vars.length + ' variables read from ' + source + '.', 'ok');
    }
  }

  var EXT = { json: 'json', 'json-nested': 'json', yaml: 'yaml', shell: 'sh', docker: 'txt', compose: 'yaml', k8s: 'yaml', tf: 'tf', env: 'env' };
  $('#dl').addEventListener('click', function () {
    if (!$('#out').value) { QT.toast('Nothing to download'); return; }
    var to = $('#to').value;
    QT.download((to === 'env' ? '.env' : 'config.' + EXT[to]), $('#out').value);
  });
  $('#sample').addEventListener('click', function () {
    $('#in').value = '# Application\nNODE_ENV=production\nPORT=3000\nAPP_NAME="Quiet Tools"\n\n' +
      '# Database\nDB_HOST=localhost\nDB_PORT=5432\nDB_NAME=app_production\nDB_PASSWORD=s3cr3t-with spaces\n\n' +
      '# Feature flags\nFEATURE_NEW_EDITOR=true\nexport LOG_LEVEL=debug\n';
    convert();
  });
  QT.$$('input, select, textarea', root).forEach(function (el) {
    el.addEventListener('input', QT.debounce(function () { QT.msg($('#msg'), ''); convert(); }, 200));
    el.addEventListener('change', function () { QT.msg($('#msg'), ''); convert(); });
  });
}
