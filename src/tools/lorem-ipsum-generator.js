export const meta = {
  slug: 'lorem-ipsum-generator',
  weight: 30,  /* order within its category — lower comes first */
  title: 'Lorem Ipsum Generator',
  shortTitle: 'Lorem Ipsum',
  h1: 'Lorem Ipsum Placeholder Text Generator',
  category: 'Generators',
  icon: '¶',
  description: 'Generate lorem ipsum paragraphs, sentences, words or list items — with an HTML mode and a plain-English alternative. Instant, offline, no ads in the output.',
  keywords: ['lorem ipsum generator', 'placeholder text', 'dummy text generator', 'lipsum', 'filler text', 'lorem ipsum html'],
  intro: 'Placeholder copy for mockups and layouts. Choose classic Latin lorem ipsum or readable English filler, get it as plain text or wrapped in HTML tags, and copy it straight into your design.',
  related: ['word-counter', 'markdown-preview', 'case-converter'],
  html: `
<div class="panel">
  <div class="row row--tight" style="margin-bottom:14px">
    <label class="lbl" for="unit">Generate</label>
    <input type="number" id="count" value="5" min="1" max="200" style="width:80px" aria-label="How many">
    <select id="unit" style="width:auto">
      <option value="paragraphs">paragraphs</option>
      <option value="sentences">sentences</option>
      <option value="words">words</option>
      <option value="list">list items</option>
    </select>
    <label class="lbl" for="flavour">Flavour</label>
    <select id="flavour" style="width:auto">
      <option value="latin">Classic Latin</option>
      <option value="english">Plain English</option>
      <option value="tech">Tech buzzwords</option>
    </select>
  </div>
  <div class="row row--tight" style="margin-bottom:14px">
    <label class="check"><input type="checkbox" id="classic" checked> Start with "Lorem ipsum dolor sit amet"</label>
    <label class="check"><input type="checkbox" id="html"> Wrap in HTML tags</label>
  </div>
  <div class="btns">
    <button class="btn btn--primary" id="gen">Generate</button>
    <button class="btn" data-copy="#out">Copy</button>
    <button class="btn" data-download="#out" data-filename="lorem.txt">Download</button>
  </div>
  <div class="field">
    <label for="out">Output</label>
    <textarea id="out" readonly style="min-height:320px;font-family:var(--sans);font-size:.95rem"></textarea>
  </div>
  <div id="msg" class="msg"></div>
</div>`,
  faq: [
    { q: 'Where does lorem ipsum come from?', a: 'It is scrambled Latin taken from Cicero\'s <em>De finibus bonorum et malorum</em>, written in 45 BC. A 16th-century printer jumbled a passage to make a type specimen, and the industry has used it ever since.' },
    { q: 'Why use nonsense text at all?', a: 'Because real copy pulls attention to the words. Placeholder text lets you judge rhythm, density and line length without anyone stopping to read. The counter-argument is real: if the layout only works with filler, it will not survive the actual content.' },
    { q: 'Will this text hurt my SEO if it ships?', a: 'It will not be penalised as such, but a page of lorem ipsum is a page with nothing to rank for, and it looks unfinished to anyone who lands on it. Search for "lorem" before you deploy.' },
    { q: 'What does the HTML option produce?', a: 'Each paragraph is wrapped in <code>&lt;p&gt;</code> and list items in <code>&lt;li&gt;</code> inside a <code>&lt;ul&gt;</code>, ready to paste into a template.' }
  ]
};

export function client(root, QT) {
  var $ = function (s) { return root.querySelector(s); };

  var BANKS = {
    latin: ('lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum at vero eos accusamus iusto odio dignissimos ducimus blanditiis praesentium voluptatum deleniti atque corrupti quos dolores quas molestias excepturi occaecati cupiditate provident similique culpa officia animi').split(' '),
    english: ('the quiet morning light fell across an open notebook where someone had written a list of small tasks and then forgotten about it entirely for several weeks until a friend asked what happened to the plan and the answer turned out to be simpler than expected because most plans do not fail loudly they simply drift while other things take their place and nobody notices until the season changes again outside the window a bus stopped a dog barked twice and the street returned to its ordinary hum of traffic and conversation which is how most days pass without any particular event marking them apart from the ones before').split(' '),
    tech: ('scalable cloud native pipeline observability latency throughput container orchestration deployment rollback idempotent eventual consistency sharding replication cache invalidation backpressure circuit breaker service mesh telemetry instrumentation gateway throughput horizontal scaling stateless immutable infrastructure declarative provisioning artifact registry continuous delivery canary release feature flag distributed tracing quorum consensus partition tolerance schema migration index compaction serialization protocol buffer streaming ingestion warehouse lakehouse embedding vector inference quantization').split(' ')
  };

  function pick(bank) { return bank[Math.floor(Math.random() * bank.length)]; }

  function sentence(bank, min, max) {
    var n = min + Math.floor(Math.random() * (max - min + 1));
    var words = [];
    for (var i = 0; i < n; i++) words.push(pick(bank));
    /* the occasional comma, so it reads like prose rather than a word list */
    if (n > 8 && Math.random() < 0.6) {
      var at = 3 + Math.floor(Math.random() * (n - 5));
      words[at] += ',';
    }
    var s = words.join(' ');
    return s[0].toUpperCase() + s.slice(1) + '.';
  }

  function paragraph(bank) {
    var n = 3 + Math.floor(Math.random() * 4);
    var out = [];
    for (var i = 0; i < n; i++) out.push(sentence(bank, 6, 18));
    return out.join(' ');
  }

  function generate() {
    var n = Math.max(1, Math.min(200, Number($('#count').value) || 1));
    var unit = $('#unit').value;
    var bank = BANKS[$('#flavour').value];
    var asHtml = $('#html').checked;
    var out = [];

    if (unit === 'words') {
      var words = [];
      for (var i = 0; i < n; i++) words.push(pick(bank));
      var text = words.join(' ');
      out.push(asHtml ? '<p>' + text + '</p>' : text);
    } else if (unit === 'sentences') {
      for (var s = 0; s < n; s++) out.push(sentence(bank, 6, 18));
      out = [asHtml ? '<p>' + out.join(' ') + '</p>' : out.join(' ')];
    } else if (unit === 'list') {
      for (var l = 0; l < n; l++) {
        var item = sentence(bank, 3, 9);
        out.push(asHtml ? '  <li>' + item + '</li>' : '• ' + item);
      }
      if (asHtml) out = ['<ul>'].concat(out, ['</ul>']);
    } else {
      for (var p = 0; p < n; p++) {
        var para = paragraph(bank);
        out.push(asHtml ? '<p>' + para + '</p>' : para);
      }
    }

    var text2 = out.join(unit === 'paragraphs' ? '\n\n' : '\n');
    if ($('#classic').checked && $('#flavour').value === 'latin' && unit !== 'words') {
      text2 = text2.replace(/^(<p>)?[A-Z][^.]*\./, function (m) {
        var prefix = m.indexOf('<p>') === 0 ? '<p>' : '';
        return prefix + 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
      });
    }
    $('#out').value = text2;
    var wordCount = text2.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
    QT.msg($('#msg'), wordCount + ' words · ' + text2.length + ' characters', 'ok');
  }

  $('#gen').addEventListener('click', generate);
  ['#count', '#unit', '#flavour', '#classic', '#html'].forEach(function (s) {
    $(s).addEventListener('change', generate);
  });
  generate();
}
