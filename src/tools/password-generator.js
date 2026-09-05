export const meta = {
  slug: 'password-generator',
  weight: 10,  /* order within its category — lower comes first */
  title: 'Strong Password Generator',
  shortTitle: 'Password Generator',
  h1: 'Strong Random Password Generator',
  category: 'Generators',
  icon: '***',
  description: 'Generate strong random passwords or passphrases using your browser\'s cryptographic RNG. Nothing is generated on a server or ever transmitted.',
  keywords: ['password generator', 'strong password generator', 'random password', 'passphrase generator', 'secure password creator', 'memorable password'],
  intro: 'Passwords generated here come from <code>crypto.getRandomValues</code> — your operating system\'s cryptographic random number generator — running inside this tab. No server sees them, no log records them, and the page keeps working with your network disconnected.',
  related: ['uuid-generator', 'hash-generator', 'lorem-ipsum-generator'],
  html: `
<div class="panel">
  <div class="field">
    <label for="out">Generated password</label>
    <textarea id="out" readonly spellcheck="false" style="min-height:80px;font-size:1.05rem"></textarea>
  </div>
  <div class="btns">
    <button class="btn btn--primary" id="gen">Generate</button>
    <button class="btn" data-copy="#out">Copy</button>
  </div>
  <div id="strength" class="msg is-on msg--ok"></div>
</div>

<div class="panel">
  <h3>Options</h3>
  <div class="row row--tight" style="margin-bottom:14px">
    <label class="check"><input type="radio" name="kind" value="random" checked> Random characters</label>
    <label class="check"><input type="radio" name="kind" value="passphrase"> Memorable passphrase</label>
  </div>

  <div id="opts-random">
    <div class="field">
      <label for="len">Length: <span id="len-val">20</span> characters</label>
      <input type="range" id="len" min="6" max="80" value="20">
    </div>
    <div class="row row--tight" style="margin-bottom:12px">
      <label class="check"><input type="checkbox" id="lower" checked> a–z</label>
      <label class="check"><input type="checkbox" id="upper" checked> A–Z</label>
      <label class="check"><input type="checkbox" id="digits" checked> 0–9</label>
      <label class="check"><input type="checkbox" id="symbols" checked> !@#$%…</label>
      <label class="check"><input type="checkbox" id="ambig"> Avoid look-alikes (0/O, 1/l/I)</label>
    </div>
  </div>

  <div id="opts-phrase" hidden>
    <div class="field">
      <label for="words">Words: <span id="words-val">4</span></label>
      <input type="range" id="words" min="3" max="10" value="4">
    </div>
    <div class="row row--tight" style="margin-bottom:12px">
      <label class="lbl" for="sep">Separator</label>
      <select id="sep" style="width:auto">
        <option value="-">hyphen</option><option value=".">dot</option>
        <option value="_">underscore</option><option value=" ">space</option>
      </select>
      <label class="check"><input type="checkbox" id="cap" checked> Capitalise</label>
      <label class="check"><input type="checkbox" id="num" checked> Add a number</label>
    </div>
  </div>

  <div class="field">
    <label for="count">Generate this many at once</label>
    <select id="count" style="max-width:160px">
      <option>1</option><option>5</option><option>10</option><option>25</option><option>50</option>
    </select>
  </div>
</div>`,
  faq: [
    { q: 'Are these passwords really random?', a: 'They come from <code>crypto.getRandomValues()</code>, the browser API backed by your operating system\'s CSPRNG — the same source used for TLS keys. The tool also rejects modulo bias when mapping random bytes onto the character set, so every character is equally likely.' },
    { q: 'Could you see the passwords I generate?', a: 'No. There is no request to make: this page contains all the code, and the generation happens after it has loaded. Load the page, turn off your network, and it still works — which is the simplest proof.' },
    { q: 'How long should a password be?', a: 'For anything protected by a password manager, 16–24 random characters is comfortably beyond brute force. For a master password or disk encryption you have to type, a 5–6 word passphrase is stronger and far easier to remember.' },
    { q: 'Why do some sites reject the symbols?', a: 'Legacy input validation, usually. Turn symbols off and add a few characters of length instead — length buys more entropy per keystroke than a wider alphabet does.' },
    { q: 'Is a passphrase really as strong?', a: 'Four words drawn randomly from a 2,048-word list is about 44 bits, roughly a 7-character random string; six words is about 66 bits and beyond practical offline cracking. The point is that you can actually remember it, so you do not reuse a weak one.' }
  ]
};

export function client(root, QT) {
  var $ = function (s) { return root.querySelector(s); };
  var out = $('#out');

  var SETS = {
    lower: 'abcdefghijklmnopqrstuvwxyz',
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    digits: '0123456789',
    symbols: '!@#$%^&*()-_=+[]{};:,.?/'
  };
  var AMBIGUOUS = 'O0oIl1|`\'";:.,';

  var WORDS = ('able acid acre afar aged ahoy ajar akin alto amber amble amend ample angel ankle apple apron arbor arch arena argon arrow ash aspen atlas atom aura aunt auto avid awake axis azure bacon badge bagel baker balm bamboo banjo barge basil batch beach beam bean bear beech beetle bell belt bench berry bison black blade bloom blue blush bolt bonus boot boulder brave bread breeze brick bridge brisk broom brush bubble buffalo bugle bunch bunny burst cabin cable cactus camel candle canoe canvas canyon cape cargo carol carpet castle cattle cedar cello chalk charm cheese cherry chess chill chime cider cinder circle citrus clam clay clever cliff cloak clover cloud clover coal cobalt cocoa comet compass copper coral corn cosmic cotton cove coyote crane crate crayon creek crest cricket crown crystal cube cumin curve cyan cycle daisy dance dawn deck deer delta dense desert dew diamond diner dive dock dolphin domain donut dove dozen dragon dream drift drum dune dusk eagle earth easel east echo eclipse eden elbow elder electric elm ember emerald empty engine equal ermine ether ever exact exile fable falcon fancy fang farm feast feather fence fern ferry fiber fiddle field fig finch fire fjord flame flare fleet flint float flora flute foam foil folk forest fossil fox frost fruit fudge gadget galaxy gallon garden garlic gem gentle geyser ghost giant ginger glacier glade glass glide globe glow gnome golden goose grain granite grape grass gravel green grid grove guitar gulf gumbo hail hammer harbor hardy harvest hatch haven hazel heather hedge helix herald herb hero hickory hill hollow honey horizon hornet horse hound hover hunt hush ice icon igloo ember index indigo ink inlet iris iron island ivory ivy jade jaguar jasmine jazz jelly jetty jewel jigsaw jolly journey judge jungle juniper kayak keen kelp kernel kettle keystone kiln kind kingdom kite kiwi knight knoll koala lace ladder lagoon lake lamp lantern lapis larch lark latch laurel lava lemon lentil level lever lichen lilac lily lime linen lion liquid lizard llama lobster locket lodge lotus lucky lumen lunar lupine lynx magnet maize mallow mango manor maple marble marina marsh meadow melon mercury mesa meteor mica midnight mild mimosa mint mirror mist mocha molten monk moon moss motion mountain mulberry muse music mustard myrtle nectar needle nest nettle nickel night noble nomad north nova nozzle nutmeg oak oasis oat ocean ochre octave olive omega onion onyx opal orange orbit orchid osprey otter oval owl oxide oyster pacific paddle palm panda pantry papaya paper parade parcel parsley pasture patch pearl pebble pecan pelican pepper petal pewter phoenix piano picnic pigment pilot pine pioneer pistol pitch pixel plank plateau plaza plum plume pocket polar pollen pond poplar poppy porch portal potato powder prairie prism prowl puddle pulse pumpkin puzzle quail quarry quartz quest quiet quill quilt quince rabbit radar radish raft rain rally ranch rapid raven ray realm reed reef relay resin rhino ribbon ridge rifle rim ripple river roam robin rocket rodeo root rose rowan ruby rudder rug rune rust sable saddle safari sage sail salmon salt sand sapphire satin saturn savanna scarf scout sculpt seal season sedge sequoia shade shale shard sharp shell shield shore shrimp sierra signal silk silver siren sketch sky slate sleet slope smoke snow socket solar sonnet sorrel south spark sparrow spice spiral spring spruce spur square squash stable stag stamp starch steam steel stem stone storm stream stucco sugar sulfur summit sunset surf swallow swan sweep swift sword sycamore syrup table talon tandem tangent tapestry tavern teak teal temple tender tent terrace thicket thistle thorn thread thunder tidal tiger timber tin toffee token tomato topaz torch tower trail tram trench tribe trout truffle trumpet tulip tundra tunnel turbine turquoise turtle twig twilight ultra umber umbrella unity urban urchin valley vanilla vapor vault velvet venture verde vessel vine violet viper vista vivid vole voyage walnut walrus wander warbler wasp watch water wave weave wedge welsh west whale wheat wheel whisk willow window winter wire wisdom wolf wonder wood wool world woven wren yarn yeast yellow yew yield yonder zebra zenith zephyr zigzag zinc zone').split(' ');

  /* Unbiased index into a list of n items. */
  function randIndex(n) {
    var max = Math.floor(4294967296 / n) * n;
    var buf = new Uint32Array(1);
    do { crypto.getRandomValues(buf); } while (buf[0] >= max);
    return buf[0] % n;
  }

  function alphabet() {
    var chars = '';
    ['lower', 'upper', 'digits', 'symbols'].forEach(function (k) {
      if ($('#' + k).checked) chars += SETS[k];
    });
    if ($('#ambig').checked) {
      chars = chars.split('').filter(function (c) { return AMBIGUOUS.indexOf(c) === -1; }).join('');
    }
    return chars;
  }

  function randomPassword() {
    var chars = alphabet();
    if (!chars) return '';
    var len = Number($('#len').value), s = '';
    for (var i = 0; i < len; i++) s += chars[randIndex(chars.length)];
    return s;
  }

  function passphrase() {
    var n = Number($('#words').value), sep = $('#sep').value, cap = $('#cap').checked;
    var parts = [];
    for (var i = 0; i < n; i++) {
      var w = WORDS[randIndex(WORDS.length)];
      parts.push(cap ? w[0].toUpperCase() + w.slice(1) : w);
    }
    var s = parts.join(sep);
    if ($('#num').checked) s += sep + randIndex(100);
    return s;
  }

  function entropyBits() {
    var kind = root.querySelector('input[name=kind]:checked').value;
    if (kind === 'passphrase') {
      var bits = Number($('#words').value) * Math.log2(WORDS.length);
      if ($('#num').checked) bits += Math.log2(100);
      return bits;
    }
    var chars = alphabet();
    return chars ? Number($('#len').value) * Math.log2(chars.length) : 0;
  }

  function describe(bits) {
    /* Time to exhaust at 100 billion guesses/second — a well-funded offline attack. */
    var guesses = Math.pow(2, bits - 1);
    var seconds = guesses / 1e11;
    var label, human;
    if (seconds < 1) human = 'under a second';
    else if (seconds < 3600) human = Math.round(seconds) + ' seconds';
    else if (seconds < 86400) human = Math.round(seconds / 3600) + ' hours';
    else if (seconds < 3.15e7) human = Math.round(seconds / 86400) + ' days';
    else if (seconds < 3.15e10) human = Math.round(seconds / 3.15e7) + ' years';
    else if (seconds < 3.15e14) human = Math.round(seconds / 3.15e10) + ' thousand years';
    else human = 'longer than the age of the universe';

    if (bits < 45) label = 'weak';
    else if (bits < 65) label = 'reasonable';
    else if (bits < 90) label = 'strong';
    else label = 'very strong';
    return { label: label, human: human, kind: bits < 45 ? 'err' : bits < 65 ? 'warn' : 'ok' };
  }

  function generate() {
    var kind = root.querySelector('input[name=kind]:checked').value;
    var n = Number($('#count').value);
    var list = [];
    for (var i = 0; i < n; i++) list.push(kind === 'passphrase' ? passphrase() : randomPassword());
    if (!list[0]) {
      QT.msg($('#strength'), 'Select at least one character set.', 'err');
      out.value = '';
      return;
    }
    out.value = list.join('\n');
    out.style.minHeight = n > 1 ? '200px' : '80px';
    var bits = entropyBits(), d = describe(bits);
    QT.msg($('#strength'), Math.round(bits) + ' bits of entropy — ' + d.label +
      '. A dedicated attacker guessing 100 billion times a second would need ' + d.human + '.', d.kind);
  }

  $('#gen').addEventListener('click', generate);
  $('#len').addEventListener('input', function () { $('#len-val').textContent = this.value; generate(); });
  $('#words').addEventListener('input', function () { $('#words-val').textContent = this.value; generate(); });
  ['#lower', '#upper', '#digits', '#symbols', '#ambig', '#sep', '#cap', '#num', '#count'].forEach(function (s) {
    $(s).addEventListener('change', generate);
  });
  QT.$$('input[name=kind]', root).forEach(function (r) {
    r.addEventListener('change', function () {
      var phrase = r.value === 'passphrase' && r.checked;
      $('#opts-random').hidden = phrase;
      $('#opts-phrase').hidden = !phrase;
      generate();
    });
  });
  generate();
}
