export const meta = {
  slug: 'markdown-preview',
  weight: 15,  /* order within its category — lower comes first */
  title: 'Markdown Preview & HTML Converter',
  shortTitle: 'Markdown → HTML',
  h1: 'Markdown Preview and HTML Converter',
  category: 'Developer',
  icon: 'M',
  description: 'Write Markdown and see it rendered live, or convert it to clean HTML you can paste anywhere. Runs entirely offline in your browser.',
  keywords: ['markdown preview', 'markdown to html', 'markdown editor online', 'md to html converter', 'markdown viewer', 'readme preview'],
  intro: 'A live Markdown editor with an HTML output pane. Supports headings, emphasis, links, images, code blocks, tables, task lists and blockquotes. Nothing is uploaded, so drafting a private README or an internal doc here is safe.',
  related: ['html-entities', 'word-counter', 'case-converter', 'text-diff'],
  html: `
<div class="panel">
  <div class="btns">
    <button class="btn btn--sm" id="tab-preview">Preview</button>
    <button class="btn btn--sm" id="tab-html">HTML</button>
    <button class="btn btn--sm btn--ghost" id="sample">Load sample</button>
    <button class="btn btn--sm btn--ghost" data-clear="#md">Clear</button>
    <button class="btn btn--sm" data-copy="#html" style="margin-left:auto">Copy HTML</button>
    <button class="btn btn--sm" data-download="#html" data-filename="document.html">Download</button>
  </div>
  <div class="io">
    <div class="field">
      <label for="md">Markdown</label>
      <textarea id="md" spellcheck="false" style="min-height:420px"></textarea>
    </div>
    <div class="field">
      <label id="out-label" for="preview">Preview</label>
      <div id="preview" class="out prose" style="min-height:420px;max-height:620px;overflow:auto;font-family:var(--sans);font-size:.95rem;white-space:normal"></div>
      <textarea id="html" readonly spellcheck="false" hidden style="min-height:420px"></textarea>
    </div>
  </div>
  <div class="hint" id="stats"></div>
</div>`,
  faq: [
    { q: 'Which Markdown flavour is this?', a: 'CommonMark basics plus the GitHub extensions people actually use: tables, task lists, strikethrough, fenced code blocks and autolinks. It is not a complete CommonMark implementation — for exotic nesting, check against your target renderer.' },
    { q: 'Is raw HTML in my Markdown rendered?', a: 'No. HTML in the input is escaped and shown as text. That keeps the preview safe from anything you paste in from elsewhere, at the cost of not supporting inline HTML blocks.' },
    { q: 'Can I use this to preview a GitHub README?', a: 'Yes, for the common cases — headings, badges, code, tables and lists all render the same. GitHub-specific extras like alerts, footnotes and Mermaid diagrams will not.' },
    { q: 'Where does my document go?', a: 'Nowhere. It is parsed by JavaScript on this page and rendered into the panel beside it. Close the tab and it is gone.' }
  ]
};

export function client(root, QT) {
  var $ = function (s) { return root.querySelector(s); };
  var SENT = String.fromCharCode(0xE000);
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function inline(s) {
    var out = esc(s);
    /* pull code spans out first, so their contents are not further processed */
    var codes = [];
    out = out.replace(/`([^`]+)`/g, function (_, c) {
      codes.push(c);
      return SENT + (codes.length - 1) + SENT;
    });
    out = out
      .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g,
        function (_, alt, src, title) {
          if (!/^(https?:|\/|data:image\/)/i.test(src)) return esc('![' + alt + '](' + src + ')');
          return '<img src="' + src + '" alt="' + alt + '"' + (title ? ' title="' + title + '"' : '') + '>';
        })
      .replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g,
        function (_, text, href, title) {
          if (!/^(https?:|mailto:|#|\/)/i.test(href)) return esc('[' + text + '](' + href + ')');
          return '<a href="' + href + '"' + (title ? ' title="' + title + '"' : '') + ' rel="noopener">' + text + '</a>';
        })
      .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" rel="noopener">$2</a>')
      .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_]+)__/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      .replace(/(^|[^_\w])_([^_\n]+)_/g, '$1<em>$2</em>')
      .replace(/~~([^~]+)~~/g, '<del>$1</del>');
    var re = new RegExp(SENT + '(\\d+)' + SENT, 'g');
    return out.replace(re, function (_, i) { return '<code>' + codes[Number(i)] + '</code>'; });
  }

  function render(md) {
    var lines = md.replace(/\r\n/g, '\n').split('\n');
    var out = [], i = 0, listStack = [];

    function closeList() { while (listStack.length) out.push('</' + listStack.pop() + '>'); }

    while (i < lines.length) {
      var line = lines[i];

      var fence = /^```\s*(\S*)/.exec(line);
      if (fence) {
        closeList();
        var buf = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
        i++;
        out.push('<pre><code' + (fence[1] ? ' class="language-' + esc(fence[1]) + '"' : '') + '>' +
          esc(buf.join('\n')) + '</code></pre>');
        continue;
      }

      if (/\|/.test(line) && lines[i + 1] && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1])) {
        closeList();
        var cells = function (row) {
          return row.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(function (c) { return c.trim(); });
        };
        var head = cells(line);
        var aligns = cells(lines[i + 1]).map(function (c) {
          if (/^:.*:$/.test(c)) return 'center';
          if (/:$/.test(c)) return 'right';
          return 'left';
        });
        i += 2;
        var body = [];
        while (i < lines.length && /\|/.test(lines[i]) && lines[i].trim()) { body.push(cells(lines[i])); i++; }
        out.push('<table><thead><tr>' + head.map(function (h, n) {
          return '<th style="text-align:' + (aligns[n] || 'left') + '">' + inline(h) + '</th>';
        }).join('') + '</tr></thead><tbody>' + body.map(function (r) {
          return '<tr>' + r.map(function (c, n) {
            return '<td style="text-align:' + (aligns[n] || 'left') + '">' + inline(c) + '</td>';
          }).join('') + '</tr>';
        }).join('') + '</tbody></table>');
        continue;
      }

      var h = /^(#{1,6})\s+(.*)$/.exec(line);
      if (h) {
        closeList();
        var lvl = h[1].length;
        out.push('<h' + lvl + '>' + inline(h[2].replace(/\s+#+\s*$/, '')) + '</h' + lvl + '>');
        i++; continue;
      }

      if (/^\s*([-*_])\s*(\1\s*){2,}$/.test(line)) {
        closeList(); out.push('<hr>'); i++; continue;
      }

      if (/^\s*>/.test(line)) {
        closeList();
        var quote = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) { quote.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
        out.push('<blockquote>' + render(quote.join('\n')) + '</blockquote>');
        continue;
      }

      var li = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line);
      if (li) {
        var ordered = /\d/.test(li[2]);
        var tag = ordered ? 'ol' : 'ul';
        var depth = Math.floor(li[1].length / 2);
        while (listStack.length > depth + 1) out.push('</' + listStack.pop() + '>');
        if (listStack.length < depth + 1) { out.push('<' + tag + '>'); listStack.push(tag); }
        else if (listStack[listStack.length - 1] !== tag) {
          out.push('</' + listStack.pop() + '>');
          out.push('<' + tag + '>'); listStack.push(tag);
        }
        var content = li[3];
        var task = /^\[([ xX])\]\s+(.*)$/.exec(content);
        out.push(task
          ? '<li style="list-style:none;margin-left:-1.1em"><input type="checkbox" disabled' +
            (task[1].toLowerCase() === 'x' ? ' checked' : '') + '> ' + inline(task[2]) + '</li>'
          : '<li>' + inline(content) + '</li>');
        i++; continue;
      }

      if (!line.trim()) { closeList(); i++; continue; }

      closeList();
      var para = [];
      while (i < lines.length && lines[i].trim() &&
             !/^(#{1,6}\s|```|\s*>|\s*([-*+]|\d+[.)])\s)/.test(lines[i])) {
        para.push(lines[i]); i++;
      }
      out.push('<p>' + inline(para.join('\n')).replace(/ {2}\n/g, '<br>\n') + '</p>');
    }
    closeList();
    return out.join('\n');
  }

  var SAMPLE = '# Project Atlas\n\n' +
    'A short description with **bold text**, *emphasis*, `inline code` and a [link](https://example.com).\n\n' +
    '## Install\n\n```bash\nnpm install project-atlas\n```\n\n' +
    '## Features\n\n- Runs anywhere\n- No configuration\n  - Except when there is\n- Fast\n\n' +
    '## Status\n\n- [x] Parser\n- [x] Renderer\n- [ ] Documentation\n\n' +
    '## Comparison\n\n| Tool | Speed | Size |\n| --- | ---: | ---: |\n| Atlas | 1.2 ms | 4 kB |\n| Other | 18 ms | 91 kB |\n\n' +
    '> Design is not just what it looks like. Design is how it works.\n\n---\n\nMade with care.\n';

  function update() {
    var md = $('#md').value;
    var html = render(md);
    $('#preview').innerHTML = html || '<p class="hint">Start typing on the left.</p>';
    $('#html').value = html;
    var words = md.trim() ? md.trim().split(/\s+/).length : 0;
    $('#stats').textContent = words + ' words · ' + md.length + ' characters · ' + html.length + ' characters of HTML';
  }

  function tab(showHtml) {
    $('#preview').hidden = showHtml;
    $('#html').hidden = !showHtml;
    $('#out-label').textContent = showHtml ? 'HTML output' : 'Preview';
  }

  $('#md').addEventListener('input', QT.debounce(update, 140));
  $('#tab-preview').addEventListener('click', function () { tab(false); });
  $('#tab-html').addEventListener('click', function () { tab(true); });
  $('#sample').addEventListener('click', function () { $('#md').value = SAMPLE; update(); });

  $('#md').value = SAMPLE;
  update();
}
