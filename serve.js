#!/usr/bin/env node
/* Local preview server for dist/. Mirrors how a static host resolves URLs:
   /foo/ -> /foo/index.html, unknown paths -> 404.html. No dependencies. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const PORT = Number(process.env.PORT) || 5173;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json'
};

const send = (res, code, body, type) => {
  res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(body);
};

http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname); }
  catch { return send(res, 400, 'Bad request', 'text/plain'); }

  const candidates = pathname.endsWith('/')
    ? [path.join(pathname, 'index.html')]
    : [pathname, path.join(pathname, 'index.html')];

  for (const c of candidates) {
    const file = path.join(DIST, c);
    if (!file.startsWith(DIST)) return send(res, 403, 'Forbidden', 'text/plain');
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      return send(res, 200, fs.readFileSync(file), TYPES[path.extname(file)] || 'application/octet-stream');
    }
  }
  /* directory without a trailing slash -> redirect, same as a real host */
  if (!pathname.endsWith('/') && fs.existsSync(path.join(DIST, pathname, 'index.html'))) {
    res.writeHead(301, { location: pathname + '/' });
    return res.end();
  }
  const nf = path.join(DIST, '404.html');
  send(res, 404, fs.existsSync(nf) ? fs.readFileSync(nf) : 'Not found', 'text/html; charset=utf-8');
}).listen(PORT, () => console.log(`\n  preview: http://localhost:${PORT}\n`));
