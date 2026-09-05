export const meta = {
  slug: 'remove-duplicate-lines',
  weight: 25,  /* order within its category — lower comes first */
  title: 'Remove Duplicate Lines & Sort Text',
  shortTitle: 'Dedupe & Sort',
  h1: 'Remove Duplicate Lines, Sort and Clean Text',
  category: 'Text',
  icon: '≡',
  description: 'Deduplicate, sort, shuffle, reverse, trim and number lines of text. Handles large lists instantly, entirely in your browser.',
  keywords: ['remove duplicate lines', 'sort lines alphabetically', 'dedupe list', 'text line sorter', 'remove empty lines', 'shuffle lines'],
  intro: 'A line-oriented text cleaner: strip duplicates, sort alphabetically or numerically, remove blanks, trim whitespace, add prefixes and numbering. Useful for cleaning up an export, a list of emails, or a wordlist — none of which needs to leave your machine.',
  related: ['word-counter', 'case-converter', 'text-diff', 'csv-to-json'],
  html: `
<div class="panel">
  <div class="io">
    <div class="field">
      <label for="in">Input <span id="in-count" class="hint"></span></label>
      <textarea id="in" spellcheck="false" placeholder="one&#10;two&#10;two&#10;three"></textarea>
    </div>
    <div class="field">
      <label for="out">Result <span id="out-count" class="hint"></span></label>
      <textarea id="out" spellcheck="false" readonly></textarea>
    </div>
  </div>
  <div class="btns">
    <button class="btn btn--sm" data-copy="#out">Copy result</button>
    <button class="btn btn--sm" data-download="#out" data-filename="lines.txt">Download</button>
    <button class="btn btn--sm btn--ghost" id="push">Use result as input</button>
    <button class="btn btn--sm btn--ghost" data-clear="#in,#out">Clear</button>
  </div>
</div>

<div class="panel">
  <h3>Operations</h3>
  <div class="row row--tight" style="margin-bottom:14px">
    <label class="check"><input type="checkbox" id="dedupe"> Remove duplicates</label>
    <label class="check"><input type="checkbox" id="blank"> Remove empty lines</label>
    <label class="check"><input type="checkbox" id="trim"> Trim each line</label>
    <label class="check"><input type="checkbox" id="ci"> Case-insensitive matching</label>
    <label class="check"><input type="checkbox" id="reverse"> Reverse order</label>
  </div>
  <div class="row row--tight" style="margin-bottom:14px">
    <label class="lbl" for="sort">Sort</label>
    <select id="sort" style="width:auto">
      <option value="">Keep original order</option>
      <option value="az">A → Z</option>
      <option value="za">Z → A</option>
      <option value="num">Numeric ascending</option>
      <option value="numdesc">Numeric descending</option>
      <option value="len">Shortest first</option>
      <option value="lendesc">Longest first</option>
      <option value="shuffle">Shuffle randomly</option>
      <option value="freq">By frequency</option>
    </select>
  </div>
  <div class="row">
    <div class="field"><label for="prefix">Add prefix</label><input type="text" id="prefix" placeholder="e.g. &quot;"></div>
    <div class="field"><label for="suffix">Add suffix</label><input type="text" id="suffix" placeholder="e.g. &quot;,"></div>
    <div class="field"><label for="join">Join lines with</label>
      <select id="join">
        <option value="\n">newline (keep lines)</option>
        <option value=", ">comma + space</option>
        <option value=",">comma</option>
        <option value=" ">space</option>
        <option value="|">pipe</option>
      </select>
    </div>
  </div>
  <div class="row row--tight">
    <label class="check"><input type="checkbox" id="number"> Number the lines</label>
    <label class="check"><input type="checkbox" id="only-dupes"> Show <em>only</em> the duplicated lines</label>
  </div>
  <div id="msg" class="msg"></div>
</div>`,
  faq: [
    { q: 'Does removing duplicates keep the first or the last occurrence?', a: 'The first. The original order of the surviving lines is preserved unless you also choose a sort.' },
    { q: 'What does "show only the duplicated lines" do?', a: 'It inverts the operation: instead of removing repeats, it lists the lines that appeared more than once, with a count. Useful for finding the repeated entries in an export before you decide what to do about them.' },
    { q: 'How does numeric sort handle mixed text?', a: 'It reads the leading number of each line and sorts by it; lines without a number fall to the end in their original order. That makes it work on lines like <code>12. item</code> or <code>3 apples</code>.' },
    { q: 'How many lines can it handle?', a: 'Hundreds of thousands without trouble — it is plain string work in memory. The browser tab, not the algorithm, is the limit.' }
  ]
};

export function client(root, QT) {
  var $ = function (s) { return root.querySelector(s); };

  function key(s) { return $('#ci').checked ? s.toLowerCase() : s; }

  function run() {
    var text = $('#in').value;
    var lines = text.split('\n');
    $('#in-count').textContent = '(' + lines.length + ' lines)';

    if ($('#trim').checked) lines = lines.map(function (l) { return l.trim(); });
    if ($('#blank').checked) lines = lines.filter(function (l) { return l.trim() !== ''; });

    var counts = {};
    lines.forEach(function (l) { counts[key(l)] = (counts[key(l)] || 0) + 1; });

    if ($('#only-dupes').checked) {
      var seenD = {};
      lines = lines.filter(function (l) {
        var k = key(l);
        if (counts[k] > 1 && !seenD[k]) { seenD[k] = true; return true; }
        return false;
      }).map(function (l) { return l + '  (×' + counts[key(l)] + ')'; });
    } else if ($('#dedupe').checked) {
      var seen = {};
      lines = lines.filter(function (l) {
        var k = key(l);
        if (seen[k]) return false;
        seen[k] = true; return true;
      });
    }

    var sort = $('#sort').value;
    var num = function (l) { var m = /-?\d+(\.\d+)?/.exec(l); return m ? parseFloat(m[0]) : NaN; };
    if (sort === 'az') lines.sort(function (a, b) { return key(a).localeCompare(key(b), undefined, { numeric: true }); });
    else if (sort === 'za') lines.sort(function (a, b) { return key(b).localeCompare(key(a), undefined, { numeric: true }); });
    else if (sort === 'num' || sort === 'numdesc') {
      var withNum = lines.filter(function (l) { return !isNaN(num(l)); });
      var without = lines.filter(function (l) { return isNaN(num(l)); });
      withNum.sort(function (a, b) { return sort === 'num' ? num(a) - num(b) : num(b) - num(a); });
      lines = withNum.concat(without);
    }
    else if (sort === 'len') lines.sort(function (a, b) { return a.length - b.length; });
    else if (sort === 'lendesc') lines.sort(function (a, b) { return b.length - a.length; });
    else if (sort === 'freq') lines.sort(function (a, b) { return counts[key(b)] - counts[key(a)]; });
    else if (sort === 'shuffle') {
      for (var i = lines.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = lines[i]; lines[i] = lines[j]; lines[j] = t;
      }
    }

    if ($('#reverse').checked) lines.reverse();

    var pre = $('#prefix').value, suf = $('#suffix').value, numbered = $('#number').checked;
    lines = lines.map(function (l, i) {
      return (numbered ? (i + 1) + '. ' : '') + pre + l + suf;
    });

    var joined = lines.join($('#join').value);
    $('#out').value = joined;
    $('#out-count').textContent = '(' + lines.length + ' lines)';

    var removed = text.split('\n').length - lines.length;
    QT.msg($('#msg'), removed > 0
      ? removed + ' line' + (removed === 1 ? '' : 's') + ' removed.'
      : lines.length + ' lines out.', 'ok');
  }

  QT.$$('input, select, textarea', root).forEach(function (el) {
    el.addEventListener('input', QT.debounce(run, 160));
    el.addEventListener('change', run);
  });
  $('#push').addEventListener('click', function () {
    $('#in').value = $('#out').value; run();
  });
  run();
}
