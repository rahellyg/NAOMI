/**
 * Local web UI: add one JSON key/value to test.json on GitHub.
 * Run: UPDATE_JSON_KEY=... node server.mjs
 * Open http://127.0.0.1:3000/update-test-json.html — token never leaves the server.
 *
 * GitHub Pages: host this HTML on Pages but run server.mjs on Render/Fly/Railway/etc., set
 * CORS_ORIGIN=https://rahellyg.github.io (or *) and point the page meta update-json-api to that base URL.
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { mergeIntoRepoJson, parseJsonValue } from './github-json.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const token = process.env.UPDATE_JSON_KEY;
const owner = process.env.GITHUB_OWNER ?? 'rahellyg';
const repo = process.env.GITHUB_REPO ?? 'NAOMI';
const branch = process.env.GITHUB_BRANCH ?? 'main';
const filePath = process.env.JSON_FILE_PATH ?? 'test.json';
const port = parseInt(process.env.PORT ?? '3000', 10);
const host = process.env.HOST ?? '127.0.0.1';
/** Allow browser requests from GitHub Pages, e.g. https://rahellyg.github.io or * */
const corsOrigin = process.env.CORS_ORIGIN ?? '*';

/** Page filename — avoids clashing with an existing repo root index.html */
const pageFile = 'update-test-json.html';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function loadPageHtml() {
  const raw = fs.readFileSync(path.join(__dirname, pageFile), 'utf8');
  return raw
    .replaceAll('{{FILE_PATH}}', filePath)
    .replaceAll('{{OWNER}}', owner)
    .replaceAll('{{REPO}}', repo)
    .replaceAll('{{BRANCH}}', branch);
}

function json(res, status, body, withCors) {
  const s = JSON.stringify(body);
  res.writeHead(status, {
    ...(withCors ? corsHeaders() : {}),
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(s),
  });
  res.end(s);
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === `/${pageFile}`) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(loadPageHtml());
    return;
  }

  if (req.method === 'OPTIONS' && url.pathname === '/api/update') {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/update') {
    if (!token) {
      json(res, 500, { error: 'Server missing UPDATE_JSON_KEY' }, true);
      return;
    }
    let body;
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      json(res, 400, { error: 'Invalid JSON body' }, true);
      return;
    }
    const key = typeof body.key === 'string' ? body.key.trim() : '';
    if (!key) {
      json(res, 400, { error: 'Missing or empty key' }, true);
      return;
    }
    if (!('value' in body)) {
      json(res, 400, { error: 'Missing value' }, true);
      return;
    }
    const parsed = parseJsonValue(body.value);
    const patch = { [key]: parsed };
    try {
      await mergeIntoRepoJson({
        token,
        owner,
        repo,
        branch,
        filePath,
        patch,
        commitMessage: process.env.COMMIT_MESSAGE ?? `web: set ${JSON.stringify(key)}`,
      });
      json(res, 200, { ok: true, added: patch }, true);
    } catch (e) {
      json(res, 502, { error: e.message || String(e) }, true);
    }
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(port, host, () => {
  if (!token) {
    console.warn('Warning: UPDATE_JSON_KEY is not set; /api/update will fail.');
  }
  console.log(`Open http://${host}:${port}/${pageFile}`);
});
