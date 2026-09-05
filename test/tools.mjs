/* Drives the real tools in a real browser and checks they produce the right
   answers. Catches the class of bug a page-load smoke test cannot see. */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { spawn } from 'node:child_process';

const PORT = Number(process.env.PORT) || 5198;
const base = `http://localhost:${PORT}`;
const server = spawn(process.execPath, ['serve.js'], {
  env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore'
});
await new Promise(r => setTimeout(r, 800));

const browser = await chromium.launch();
const results = [];

async function check(name, route, fn) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(250);
    await fn(page);
    if (errors.length) throw new Error('page errors: ' + errors.join('; '));
    results.push({ name, ok: true });
    process.stdout.write('.');
  } catch (e) {
    results.push({ name, ok: false, error: e.message.split('\n')[0] });
    process.stdout.write('x');
  }
  await page.close();
}

const eq = (actual, expected, what) => {
  if (actual !== expected) throw new Error(`${what}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
};
const has = (actual, needle, what) => {
  if (!String(actual).includes(needle)) throw new Error(`${what}: ${JSON.stringify(String(actual).slice(0, 200))} does not contain ${JSON.stringify(needle)}`);
};

/* ---------------------------------------------------------------- JSON */
await check('json-formatter formats', '/json-formatter/', async p => {
  await p.fill('#in', '{"b":1,"a":[1,2]}');
  await p.click('#format');
  eq(await p.inputValue('#out'), '{\n  "b": 1,\n  "a": [\n    1,\n    2\n  ]\n}', 'formatted output');
  has(await p.textContent('#msg'), 'Valid JSON', 'status');
});

await check('json-formatter reports error position', '/json-formatter/', async p => {
  await p.fill('#in', '{\n  "a": 1,\n}');
  await p.click('#format');
  has(await p.textContent('#msg'), 'line 3', 'error location');
});

await check('json-formatter sorts keys', '/json-formatter/', async p => {
  await p.fill('#in', '{"z":1,"a":{"y":2,"b":3}}');
  await p.click('#sort');
  eq(await p.inputValue('#out'), '{\n  "a": {\n    "b": 3,\n    "y": 2\n  },\n  "z": 1\n}', 'sorted');
});

/* ----------------------------------------------------------------- CSV */
await check('json-to-csv flattens', '/json-to-csv/', async p => {
  await p.fill('#in', '[{"a":1,"b":{"c":2}},{"a":3,"b":{"c":4}}]');
  await p.click('#convert');
  eq(await p.inputValue('#out'), 'a,b.c\n1,2\n3,4', 'csv output (textarea normalises CRLF)');
});

await check('json-to-csv quotes commas', '/json-to-csv/', async p => {
  await p.fill('#in', '[{"name":"Lovelace, Ada"}]');
  await p.click('#convert');
  eq(await p.inputValue('#out'), 'name\n"Lovelace, Ada"', 'quoted field');
});

await check('csv-to-json handles quoted fields', '/csv-to-json/', async p => {
  await p.fill('#in', 'name,city\n"Lovelace, Ada",London\nTuring,Wilmslow');
  await p.click('#convert');
  const out = JSON.parse(await p.inputValue('#out'));
  eq(out.length, 2, 'row count');
  eq(out[0].name, 'Lovelace, Ada', 'quoted value');
  eq(out[1].city, 'Wilmslow', 'second row');
});

await check('csv-to-json coerces types', '/csv-to-json/', async p => {
  await p.fill('#in', 'n,flag,blank\n42,true,');
  await p.click('#convert');
  const out = JSON.parse(await p.inputValue('#out'));
  eq(out[0].n, 42, 'number');
  eq(out[0].flag, true, 'boolean');
  eq(out[0].blank, null, 'empty -> null');
});

/* -------------------------------------------------------------- Base64 */
await check('base64 round-trips unicode', '/base64-encode-decode/', async p => {
  await p.fill('#in', 'héllo 🌍');
  await p.click('#encode');
  const b64 = await p.inputValue('#out');
  eq(b64, 'aMOpbGxvIPCfjI0=', 'encoded');
  await p.fill('#in', '');
  await p.click('#decode');
  eq(await p.inputValue('#in'), 'héllo 🌍', 'decoded back');
});

await check('base64 url-safe mode', '/base64-encode-decode/', async p => {
  await p.check('#urlsafe');
  await p.fill('#in', 'ûÿ¾');
  await p.click('#encode');
  const out = await p.inputValue('#out');
  if (/[+/=]/.test(out)) throw new Error('url-safe output still contains + / or =: ' + out);
});

/* ---------------------------------------------------------------- hash */
await check('hash-generator matches known digests', '/hash-generator/', async p => {
  await p.fill('#text', 'abc');
  await p.waitForTimeout(400);
  const rows = await p.$$eval('#out tbody tr', trs =>
    trs.map(tr => [tr.children[0].textContent.trim(), tr.children[1].textContent.trim()]));
  const map = Object.fromEntries(rows);
  eq(map['MD5'], '900150983cd24fb0d6963f7d28e17f72', 'MD5(abc)');
  eq(map['SHA-1'], 'a9993e364706816aba3e25717850c26c9cd0d89d', 'SHA-1(abc)');
  eq(map['SHA-256'], 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', 'SHA-256(abc)');
});

/* ----------------------------------------------------------------- JWT */
await check('jwt-decoder decodes and verifies', '/jwt-decoder/', async p => {
  await p.click('#sample');
  await p.waitForTimeout(300);
  has(await p.textContent('#payload'), 'Ada Lovelace', 'payload');
  eq(await p.textContent('#s-alg'), 'HS256', 'algorithm');
  await p.fill('#secret', 'your-256-bit-secret');
  await p.click('#verify');
  await p.waitForTimeout(400);
  has(await p.textContent('#vmsg'), 'Signature verified', 'verification');
});

await check('jwt-decoder rejects a wrong secret', '/jwt-decoder/', async p => {
  await p.click('#sample');
  await p.waitForTimeout(300);
  await p.fill('#secret', 'wrong-secret');
  await p.click('#verify');
  await p.waitForTimeout(400);
  has(await p.textContent('#vmsg'), 'does not match', 'rejection');
});

/* ------------------------------------------------------------ passwords */
await check('password-generator honours length', '/password-generator/', async p => {
  await p.fill('#len', '32');
  await p.dispatchEvent('#len', 'input');
  await p.click('#gen');
  const pw = await p.inputValue('#out');
  eq(pw.length, 32, 'password length');
  has(await p.textContent('#strength'), 'bits of entropy', 'entropy readout');
});

await check('password-generator makes passphrases', '/password-generator/', async p => {
  await p.click('input[name=kind][value=passphrase]');
  await p.click('#gen');
  const pw = await p.inputValue('#out');
  if (pw.split('-').length < 4) throw new Error('expected at least 4 hyphen-separated parts: ' + pw);
});

/* ----------------------------------------------------------------- UUID */
await check('uuid-generator emits valid v4', '/uuid-generator/', async p => {
  await p.selectOption('#kind', 'v4');
  await p.selectOption('#count', '10');
  await p.click('#gen');
  const lines = (await p.inputValue('#out')).trim().split('\n');
  eq(lines.length, 10, 'count');
  for (const l of lines) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(l)) {
      throw new Error('not a v4 UUID: ' + l);
    }
  }
  eq(new Set(lines).size, 10, 'all unique');
});

await check('uuid-generator v7 is time-ordered', '/uuid-generator/', async p => {
  await p.selectOption('#kind', 'v7');
  await p.selectOption('#count', '100');
  await p.click('#gen');
  const lines = (await p.inputValue('#out')).trim().split('\n');
  for (const l of lines) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(l)) {
      throw new Error('not a v7 UUID: ' + l);
    }
  }
  /* the leading 48 bits are a millisecond timestamp: it must be about now */
  const ts = parseInt(lines[0].slice(0, 8) + lines[0].slice(9, 13), 16);
  if (Math.abs(Date.now() - ts) > 60000) throw new Error('v7 timestamp is not current: ' + new Date(ts).toISOString());
  /* and the monotonic counter must keep a same-millisecond burst in order */
  const sorted = [...lines].sort();
  eq(JSON.stringify(sorted), JSON.stringify(lines), 'v7s come out already sorted');
});

/* ----------------------------------------------------------------- case */
await check('case-converter splits identifiers', '/case-converter/', async p => {
  await p.fill('#in', 'XMLHttpRequest');
  await p.waitForTimeout(350);
  const out = await p.$$eval('#results .field', els =>
    Object.fromEntries(els.map(e => [e.querySelector('.lbl').textContent, e.querySelector('pre').textContent])));
  eq(out['snake_case'], 'xml_http_request', 'snake_case');
  eq(out['kebab-case'], 'xml-http-request', 'kebab-case');
  eq(out['camelCase'], 'xmlHttpRequest', 'camelCase');
});

await check('case-converter does title case', '/case-converter/', async p => {
  await p.fill('#in', 'the rise of the machines');
  await p.waitForTimeout(350);
  const out = await p.$$eval('#results .field', els =>
    Object.fromEntries(els.map(e => [e.querySelector('.lbl').textContent, e.querySelector('pre').textContent])));
  eq(out['Title Case'], 'The Rise of the Machines', 'title case keeps small words lowercase');
});

/* ----------------------------------------------------------------- diff */
await check('text-diff counts changes', '/text-diff/', async p => {
  await p.fill('#a', 'one\ntwo\nthree');
  await p.fill('#b', 'one\ntwo point five\nthree');
  await p.click('#run');
  await p.waitForTimeout(250);
  eq(await p.textContent('#s-add'), '1', 'added');
  eq(await p.textContent('#s-del'), '1', 'removed');
  eq(await p.textContent('#s-same'), '2', 'unchanged');
});

await check('text-diff detects identical text', '/text-diff/', async p => {
  await p.fill('#a', 'same\ntext');
  await p.fill('#b', 'same\ntext');
  await p.click('#run');
  await p.waitForTimeout(250);
  has(await p.textContent('#msg'), 'identical', 'identical message');
});

/* ---------------------------------------------------------------- lines */
await check('remove-duplicate-lines dedupes and sorts', '/remove-duplicate-lines/', async p => {
  await p.fill('#in', 'b\na\nb\nc\na');
  await p.check('#dedupe');
  await p.selectOption('#sort', 'az');
  await p.waitForTimeout(350);
  eq(await p.inputValue('#out'), 'a\nb\nc', 'deduped and sorted');
});

/* ---------------------------------------------------------------- slugs */
await check('slug-generator transliterates', '/slug-generator/', async p => {
  await p.fill('#in', "10 Ways to Improve Your Café's Menu!");
  await p.waitForTimeout(350);
  eq(await p.inputValue('#out'), '10-ways-to-improve-your-cafes-menu', 'slug');
});

/* ----------------------------------------------------------------- cron */
await check('cron-expression-parser describes and predicts', '/cron-expression-parser/', async p => {
  await p.fill('#expr', '0 9 * * 1-5');
  await p.waitForTimeout(450);
  const desc = await p.textContent('#desc');
  has(desc, '09:00', 'time in description');
  has(desc, 'Monday', 'weekday in description');
  const rows = await p.$$eval('#runs tbody tr', trs => trs.length);
  eq(rows, 10, 'next 10 runs');
});

await check('cron-expression-parser rejects bad input', '/cron-expression-parser/', async p => {
  await p.fill('#expr', '99 * * * *');
  await p.waitForTimeout(450);
  has(await p.textContent('#msg'), 'outside the allowed range', 'range error');
});

/* ------------------------------------------------------------ timestamp */
await check('unix-timestamp-converter converts', '/unix-timestamp-converter/', async p => {
  await p.fill('#ts', '1735689600');
  await p.waitForTimeout(400);
  has(await p.textContent('#ts-out'), '2025-01-01T00:00:00.000Z', 'ISO output');
});

/* ---------------------------------------------------------------- bases */
await check('number-base-converter converts and inspects', '/number-base-converter/', async p => {
  await p.fill('#value', '0xff');
  await p.waitForTimeout(300);
  const text = await p.textContent('#out');
  has(text, '11111111', 'binary');
  has(text, '255', 'decimal');
  has(text, '377', 'octal');
});

await check('number-base-converter handles big integers', '/number-base-converter/', async p => {
  await p.selectOption('#base', '10');
  await p.fill('#value', '123456789012345678901234567890');
  await p.waitForTimeout(300);
  has(await p.textContent('#out'), '123456789012345678901234567890', 'exact big decimal');
});

/* ---------------------------------------------------------------- regex */
await check('regex-tester matches and replaces', '/regex-tester/', async p => {
  await p.fill('#pattern', '(\\w+)@(\\w+)\\.(\\w+)');
  await p.fill('#text', 'ada@example.com and alan@bletchley.org');
  await p.fill('#replace', '$1 at $2');
  await p.waitForTimeout(400);
  has(await p.textContent('#count'), '2 matches', 'match count');
  eq(await p.inputValue('#result'), 'ada at example and alan at bletchley', 'replacement');
});

await check('regex-tester reports invalid patterns', '/regex-tester/', async p => {
  await p.fill('#pattern', '([a-z');
  await p.waitForTimeout(400);
  const msg = await p.textContent('#msg');
  if (!/unterminated|Invalid|character class/i.test(msg)) throw new Error('expected a syntax error, got: ' + msg);
});

/* ------------------------------------------------------------- markdown */
await check('markdown-preview renders', '/markdown-preview/', async p => {
  await p.fill('#md', '# Title\n\nSome **bold** and `code`.\n\n- one\n- two\n');
  await p.waitForTimeout(350);
  const html = await p.inputValue('#html');
  has(html, '<h1>Title</h1>', 'heading');
  has(html, '<strong>bold</strong>', 'bold');
  has(html, '<code>code</code>', 'code span');
  has(html, '<li>one</li>', 'list item');
});

await check('markdown-preview escapes raw HTML', '/markdown-preview/', async p => {
  await p.fill('#md', 'text <script>alert(1)</script> more');
  await p.waitForTimeout(350);
  const html = await p.inputValue('#html');
  if (html.includes('<script>')) throw new Error('raw script tag survived escaping');
  has(html, '&lt;script&gt;', 'escaped');
});

/* ------------------------------------------------------------------ env */
await check('env-to-json parses and converts', '/env-to-json/', async p => {
  await p.fill('#in', '# comment\nexport A=1\nB="two words"\nC=3 # trailing\n');
  await p.selectOption('#to', 'json');
  await p.waitForTimeout(400);
  const out = JSON.parse(await p.inputValue('#out'));
  eq(out.A, '1', 'export prefix stripped');
  eq(out.B, 'two words', 'quoted value');
  eq(out.C, '3', 'trailing comment stripped');
});

/* ---------------------------------------------------------------- color */
await check('color-converter converts hex', '/color-converter/', async p => {
  await p.fill('#input', '#6ee7b7');
  await p.waitForTimeout(350);
  const text = await p.textContent('#formats');
  has(text, 'rgb(110 231 183)', 'rgb');
  has(text, 'oklch(', 'oklch');
  has(await p.textContent('#contrast'), ':1', 'contrast ratio');
});

await check('color-converter accepts named colours', '/color-converter/', async p => {
  await p.fill('#input', 'rebeccapurple');
  await p.waitForTimeout(350);
  has(await p.textContent('#formats'), '#663399', 'named colour resolved');
});

/* ------------------------------------------------------------ word count */
await check('word-counter counts', '/word-counter/', async p => {
  await p.fill('#text', 'One two three. Four five!\n\nSecond paragraph here.');
  await p.waitForTimeout(350);
  eq(await p.textContent('#s-words'), '8', 'words');
  eq(await p.textContent('#s-sent'), '3', 'sentences');
  eq(await p.textContent('#s-para'), '2', 'paragraphs');
});

/* ------------------------------------------------------------------ url */
await check('url-encode-decode encodes and inspects', '/url-encode-decode/', async p => {
  await p.fill('#in', 'hello world & friends?');
  await p.click('#encode');
  eq(await p.inputValue('#out'), 'hello%20world%20%26%20friends%3F', 'encoded');
  await p.fill('#urlin', 'https://example.com/s?q=blue+shoes&page=2#top');
  await p.waitForTimeout(350);
  const parts = await p.textContent('#parts');
  has(parts, 'example.com', 'host');
  has(parts, 'blue shoes', 'decoded query value');
});

/* ------------------------------------------------------------- entities */
await check('html-entities escapes and unescapes', '/html-entities/', async p => {
  await p.fill('#in', '<a href="x">Tom & Jerry</a>');
  await p.click('#encode');
  eq(await p.inputValue('#out'), '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&lt;/a&gt;', 'escaped');
  await p.fill('#out', '&mdash; &amp; &#8212;');
  await p.click('#decode');
  eq(await p.inputValue('#in'), '— & —', 'unescaped');
});

/* ----------------------------------------------------------------- lorem */
await check('lorem-ipsum-generator produces paragraphs', '/lorem-ipsum-generator/', async p => {
  await p.fill('#count', '3');
  await p.selectOption('#unit', 'paragraphs');
  await p.click('#gen');
  const out = await p.inputValue('#out');
  eq(out.trim().split(/\n\n+/).length, 3, 'paragraph count');
  has(out, 'Lorem ipsum dolor sit amet', 'classic opener');
});

/* -------------------------------------------------------------- search */
await check('site search finds tools', '/', async p => {
  await p.fill('#q', 'json');
  await p.waitForTimeout(500);
  const links = await p.$$eval('#q-results a', as => as.map(a => a.getAttribute('href')));
  if (!links.some(h => h.includes('json-formatter'))) {
    throw new Error('search did not surface the JSON formatter: ' + JSON.stringify(links));
  }
});

await check('theme toggle persists', '/', async p => {
  await p.click('#theme-toggle');
  await p.waitForTimeout(150);
  const theme = await p.getAttribute('html', 'data-theme');
  if (!theme) throw new Error('no data-theme after toggle');
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(200);
  eq(await p.getAttribute('html', 'data-theme'), theme, 'theme survived reload');
});

await browser.close();
server.kill();

const failed = results.filter(r => !r.ok);
console.log(`\n\n${results.length} checks, ${results.length - failed.length} passed.`);
if (failed.length) {
  failed.forEach(f => console.log(`\nFAIL  ${f.name}\n      ${f.error}`));
  process.exit(1);
}
console.log('Every tool produced the expected output.');
