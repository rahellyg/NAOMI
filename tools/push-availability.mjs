/**
 * Push naomi-availability.json to GitHub (no browser CORS).
 *
 * Prerequisites: Node 18+
 * Token: GitHub → Settings → Developer settings → Fine-grained token
 *   with Contents: Read and write on the target repository.
 *
 * Usage (from project root):
 *   set GITHUB_TOKEN=ghp_xxxx
 *   node tools/push-availability.mjs OWNER REPO [branch] [filepath]
 *
 * Example:
 *   node tools/push-availability.mjs myuser NaomilandingPage main naomi-availability.json
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const token = process.env.GITHUB_TOKEN;
const owner = process.argv[2] || process.env.GITHUB_OWNER;
const repo = process.argv[3] || process.env.GITHUB_REPO;
const branch = process.argv[4] || process.env.GITHUB_BRANCH || 'main';
const filepath = process.argv[5] || process.env.GITHUB_FILE || 'naomi-availability.json';

if (!token) {
  console.error('Missing GITHUB_TOKEN in environment.');
  process.exit(1);
}
if (!owner || !repo) {
  console.error('Usage: GITHUB_TOKEN=xxx node tools/push-availability.mjs <owner> <repo> [branch] [path]');
  process.exit(1);
}

const content = readFileSync(join(root, 'naomi-availability.json'), 'utf8');
const contentB64 = Buffer.from(content, 'utf8').toString('base64');

const apiPath =
  'https://api.github.com/repos/' +
  encodeURIComponent(owner) +
  '/' +
  encodeURIComponent(repo) +
  '/contents/' +
  filepath.split('/').filter(Boolean).map(encodeURIComponent).join('/');

const headers = {
  Authorization: 'Bearer ' + token,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28'
};

let sha = null;
const getRes = await fetch(apiPath + '?ref=' + encodeURIComponent(branch), { headers });
if (getRes.ok) {
  const j = await getRes.json();
  sha = j.sha;
} else if (getRes.status !== 404) {
  console.error(await getRes.text());
  process.exit(1);
}

const putRes = await fetch(apiPath, {
  method: 'PUT',
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Update naomi-availability.json',
    content: contentB64,
    branch,
    ...(sha ? { sha } : {})
  })
});

if (!putRes.ok) {
  console.error(await putRes.text());
  process.exit(1);
}

const out = await putRes.json();
console.log('Updated:', out.content?.html_url || 'ok');
