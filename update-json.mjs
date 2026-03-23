/**
 * Updates a JSON file in a GitHub repo via the Contents API.
 * Set UPDATE_JSON_KEY to a fine-grained PAT or classic PAT with repo scope.
 *
 * Usage:
 *   UPDATE_JSON_KEY=ghp_... node update-json.mjs [path-in-repo] '<json-merge>'
 *   Default file is test.json. One argument that looks like JSON ({...} or [...])
 *   is treated as the merge payload for test.json.
 *
 * Env (optional overrides):
 *   JSON_FILE_PATH default test.json
 *   GITHUB_OWNER   default rahellyg
 *   GITHUB_REPO    default NAOMI
 *   GITHUB_BRANCH  default main
 *   COMMIT_MESSAGE optional
 *
 * json-merge is deep-merged into the existing file (objects merge; arrays replace).
 */

import process from 'node:process';
import { mergeIntoRepoJson } from './github-json.mjs';

const token = process.env.UPDATE_JSON_KEY;
const owner = process.env.GITHUB_OWNER ?? 'rahellyg';
const repo = process.env.GITHUB_REPO ?? 'NAOMI';
const branch = process.env.GITHUB_BRANCH ?? 'main';

async function main() {
  const arg2 = process.argv[2];
  const arg3 = process.argv[3];
  const looksLikeJson = (s) => typeof s === 'string' && /^[\s]*[{[]/.test(s);

  let filePath;
  let mergeArg;
  if (arg3 !== undefined) {
    filePath = arg2 ?? process.env.JSON_FILE_PATH ?? 'test.json';
    mergeArg = arg3 ?? process.env.JSON_MERGE;
  } else if (arg2 !== undefined && looksLikeJson(arg2)) {
    filePath = process.env.JSON_FILE_PATH ?? 'test.json';
    mergeArg = arg2;
  } else {
    filePath = arg2 ?? process.env.JSON_FILE_PATH ?? 'test.json';
    mergeArg = process.env.JSON_MERGE;
  }

  if (!token) {
    console.error('Missing UPDATE_JSON_KEY (GitHub PAT with contents:write on the repo).');
    process.exit(1);
  }
  if (mergeArg == null || mergeArg === '') {
    console.error('Provide JSON to merge as second argument or JSON_MERGE env.');
    process.exit(1);
  }

  let patch;
  try {
    patch = JSON.parse(mergeArg);
  } catch (e) {
    console.error('Invalid JSON merge:', e.message);
    process.exit(1);
  }

  await mergeIntoRepoJson({
    token,
    owner,
    repo,
    branch,
    filePath,
    patch,
    commitMessage: process.env.COMMIT_MESSAGE,
  });

  console.log(`Updated ${owner}/${repo}:${filePath} on ${branch}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
