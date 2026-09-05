/* Loads every generated page in a real browser and fails on console errors,
   page errors, broken same-origin requests, or a tool that did not mount. */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const PORT = Number(process.env.PORT) || 5199;
const base = `http://localhost:${PORT}`;

const server = spawn(process.execPath, ['serve.js'], {
  env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore'
});
await new Promise(r => setTimeout(r, 800));

const routes = ['/', '/tools/', '/guides/', '/about/', '/privacy/'];
for (const entry of fs.readdirSync('src/tools')) routes.push('/' + entry.replace(/\.js$/, '') + '/');
const { guides } = await import('../src/pages/guides.js');
for (const g of guides) routes.push('/guides/' + g.slug + '/');

const browser = await chromium.launch();
const failures = [];

for (const route of routes) {
  const page = await browser.newPage();
  const problems = [];
  page.on('console', m => { if (m.type() === 'error') problems.push('console: ' + m.text()); });
  page.on('pageerror', e => problems.push('pageerror: ' + e.message));
  page.on('requestfailed', r => {
    if (!r.url().startsWith(base)) return;  /* third-party CDNs may be blocked in CI */
    problems.push('request failed: ' + r.url() + ' — ' + (r.failure()?.errorText || ''));
  });

  try {
    const res = await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 15000 });
    if (!res || res.status() !== 200) problems.push('HTTP ' + (res ? res.status() : 'none'));
    await page.waitForTimeout(500);

    if (!(await page.locator('h1').count())) problems.push('no <h1>');

    if (await page.locator('#tool').count()) {
      const kids = await page.evaluate(() => document.getElementById('tool').children.length);
      if (!kids) problems.push('#tool rendered empty');
      const mountErr = await page.evaluate(() => {
        const el = document.querySelector('#tool > .msg--err');
        return el ? el.textContent : null;
      });
      if (mountErr && /failed to start/.test(mountErr)) problems.push('tool threw on mount');
    }

    const title = await page.title();
    if (!title) problems.push('missing title');
    else if (title.length > 65) problems.push(`title ${title.length} chars: ${title}`);
    const desc = await page.getAttribute('meta[name=description]', 'content');
    if (!desc) problems.push('missing meta description');
    else if (desc.length > 165) problems.push(`description ${desc.length} chars`);
    if (!(await page.locator('link[rel=canonical]').count())) problems.push('missing canonical');
  } catch (e) {
    problems.push('threw: ' + e.message.split('\n')[0]);
  }

  if (problems.length) { failures.push({ route, problems }); process.stdout.write('x'); }
  else process.stdout.write('.');
  await page.close();
}

await browser.close();
server.kill();

console.log(`\n\nChecked ${routes.length} pages.`);
if (failures.length) {
  for (const f of failures) {
    console.log('\nFAIL ' + f.route);
    f.problems.forEach(p => console.log('   - ' + p));
  }
  process.exit(1);
}
console.log('All pages loaded cleanly with no console errors.');
