function encodeRepoPath(path) {
  return path
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/');
}

function deepMerge(target, source) {
  if (source === null || typeof source !== 'object' || Array.isArray(source)) {
    return source;
  }
  const out = { ...target };
  for (const [k, v] of Object.entries(source)) {
    if (
      v !== null &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      out[k] &&
      typeof out[k] === 'object' &&
      !Array.isArray(out[k])
    ) {
      out[k] = deepMerge(out[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function createGithubClient(token) {
  return async function github(method, path, body) {
    const res = await fetch(`https://api.github.com${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (!res.ok) {
      const msg = typeof data === 'object' && data?.message ? data.message : text;
      throw new Error(`GitHub API ${res.status}: ${msg}`);
    }
    return data;
  };
}

/**
 * Deep-merge `patch` into JSON file at `filePath` and commit via Contents API.
 */
export async function mergeIntoRepoJson({
  token,
  owner,
  repo,
  branch,
  filePath,
  patch,
  commitMessage,
}) {
  const github = createGithubClient(token);
  const apiPath = `/repos/${owner}/${repo}/contents/${encodeRepoPath(filePath)}?ref=${encodeURIComponent(branch)}`;
  const current = await github('GET', apiPath);

  if (!current.content || !current.sha) {
    throw new Error('Unexpected API response: expected file with content and sha');
  }

  const existingJson = JSON.parse(Buffer.from(current.content, 'base64').toString('utf8'));
  const next = deepMerge(existingJson, patch);
  const nextContent = `${JSON.stringify(next, null, 2)}\n`;
  const content = Buffer.from(nextContent, 'utf8').toString('base64');

  await github('PUT', `/repos/${owner}/${repo}/contents/${encodeRepoPath(filePath)}`, {
    message: commitMessage ?? `chore: update ${filePath}`,
    content,
    sha: current.sha,
    branch,
  });
}

/** Turn a form value string into JSON value (number, bool, object, or string). */
export function parseJsonValue(raw) {
  if (raw == null) return null;
  const t = String(raw).trim();
  if (t === '') return '';
  try {
    return JSON.parse(t);
  } catch {
    return raw;
  }
}
