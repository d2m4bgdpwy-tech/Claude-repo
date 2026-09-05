export const meta = {
  slug: 'case-converter',
  weight: 20,  /* order within its category — lower comes first */
  title: 'Case Converter — camelCase, snake_case, Title Case',
  shortTitle: 'Case Converter',
  h1: 'Text Case Converter',
  category: 'Text',
  icon: 'Aa',
  description: 'Convert text between camelCase, snake_case, kebab-case, PascalCase, Title Case, UPPERCASE and more. Instant and entirely in your browser.',
  keywords: ['case converter', 'camelcase converter', 'snake case', 'kebab case', 'title case converter', 'uppercase lowercase', 'pascal case'],
  intro: 'Switch text between every case convention you are likely to need — the programming ones and the writing ones. Handles multi-line input, so you can convert a whole column of identifiers at once.',
  related: ['word-counter', 'slug-generator', 'remove-duplicate-lines'],
  html: `
<div class="panel">
  <div class="field">
    <label for="in">Input</label>
    <textarea id="in" spellcheck="false" style="min-height:120px" placeholder="hello world example text"></textarea>
  </div>
  <label class="check" style="margin-bottom:12px"><input type="checkbox" id="perline"> Treat every line separately</label>
  <div id="results"></div>
</div>`,
  faq: [
    { q: 'What is Title Case, exactly?', a: 'Capitalising the important words and leaving short function words lowercase — "The Rise of the Machines", not "The Rise Of The Machines". This tool follows the common style-guide list of articles, conjunctions and short prepositions, and always capitalises the first and last word.' },
    { q: 'Why does it split "XMLHttpRequest" correctly?', a: 'The word splitter handles runs of capitals followed by a capitalised word, so <code>XMLHttpRequest</code> becomes <code>xml http request</code> rather than one blob. Digits are treated as boundaries too, so <code>utf8Decode</code> splits as expected.' },
    { q: 'Which case should I use where?', a: 'Broad conventions: <code>camelCase</code> for JavaScript and Java variables, <code>PascalCase</code> for classes and React components, <code>snake_case</code> for Python and SQL columns, <code>kebab-case</code> for URLs, CSS classes and file names, <code>SCREAMING_SNAKE</code> for constants and environment variables.' }
  ]
};

export function client(root, QT) {
  var $ = function (s) { return root.querySelector(s); };
  var SMALL = ('a an the and but or nor for yet so at by in of on to up via as if per off out with from into onto over than that').split(' ');

  function words(s) {
    return s
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      .replace(/([a-zA-Z])([0-9])/g, '$1 $2')
      .replace(/([0-9])([a-zA-Z])/g, '$1 $2')
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean);
  }
  var cap = function (w) { return w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w; };

  var CASES = [
    ['camelCase', function (s) { return words(s).map(function (w, i) { return i ? cap(w) : w.toLowerCase(); }).join(''); }],
    ['PascalCase', function (s) { return words(s).map(cap).join(''); }],
    ['snake_case', function (s) { return words(s).map(function (w) { return w.toLowerCase(); }).join('_'); }],
    ['SCREAMING_SNAKE', function (s) { return words(s).map(function (w) { return w.toUpperCase(); }).join('_'); }],
    ['kebab-case', function (s) { return words(s).map(function (w) { return w.toLowerCase(); }).join('-'); }],
    ['dot.case', function (s) { return words(s).map(function (w) { return w.toLowerCase(); }).join('.'); }],
    ['path/case', function (s) { return words(s).map(function (w) { return w.toLowerCase(); }).join('/'); }],
    ['Title Case', function (s) {
      var w = words(s);
      return w.map(function (x, i) {
        var lower = x.toLowerCase();
        return (i !== 0 && i !== w.length - 1 && SMALL.indexOf(lower) > -1) ? lower : cap(x);
      }).join(' ');
    }],
    ['Sentence case', function (s) {
      var t = s.toLowerCase();
      return t.replace(/(^\s*[a-z])|([.!?]\s+[a-z])/g, function (m) { return m.toUpperCase(); });
    }],
    ['UPPERCASE', function (s) { return s.toUpperCase(); }],
    ['lowercase', function (s) { return s.toLowerCase(); }],
    ['aLtErNaTiNg', function (s) {
      var i = 0;
      return s.replace(/[a-zA-Z]/g, function (c) { return (i++ % 2) ? c.toLowerCase() : c.toUpperCase(); });
    }],
    ['Inverted', function (s) {
      return s.replace(/[a-zA-Z]/g, function (c) {
        return c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase();
      });
    }]
  ];

  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function render() {
    var text = $('#in').value;
    var perline = $('#perline').checked;
    if (!text.trim()) { $('#results').innerHTML = '<p class="hint">Type something above.</p>'; return; }

    $('#results').innerHTML = CASES.map(function (c, idx) {
      var result = perline
        ? text.split('\n').map(function (line) { return line.trim() ? c[1](line) : ''; }).join('\n')
        : c[1](text);
      return '<div class="field" style="margin-bottom:10px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px">' +
        '<span class="lbl">' + c[0] + '</span>' +
        '<button class="btn btn--sm js-c" type="button" data-i="' + idx + '">Copy</button></div>' +
        '<pre class="out" data-out="' + idx + '" style="margin:0">' + esc(result) + '</pre></div>';
    }).join('');

    QT.$$('.js-c', root).forEach(function (b) {
      b.addEventListener('click', function () {
        QT.copy(root.querySelector('[data-out="' + b.getAttribute('data-i') + '"]').textContent);
      });
    });
  }

  $('#in').addEventListener('input', QT.debounce(render, 150));
  $('#perline').addEventListener('change', render);
  render();
}
