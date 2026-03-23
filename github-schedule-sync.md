# Syncing `naomi-availability.json` with the booking page (GitHub Pages)

## GitHub Secrets (`UPDATE_JSON_KEY`) — protected, not in the browser

Repository **Secrets** in GitHub are **protected by design**:

- They are **encrypted at rest** and **not shown** in logs or the UI after you save (only update/replace).
- They are exposed **only** to **GitHub Actions** (or similar) when you pass them explicitly, e.g. `env: UPDATE_JSON_KEY: ${{ secrets.UPDATE_JSON_KEY }}` in a workflow step.
- A **static page** like `schedule-admin.html` on GitHub Pages **cannot** read `secrets.UPDATE_JSON_KEY`. If it could, anyone opening the site would get your token. So “the variable is in GitHub Secrets” does **not** mean the admin page can load it automatically.

**Ways to use the secret safely:**

| Where | How the token is used |
|--------|------------------------|
| **GitHub Actions** | Reference `secrets.UPDATE_JSON_KEY` only inside workflow YAML (server-side). |
| **Your PC** | `export UPDATE_JSON_KEY=...` or `node tools/push-availability.mjs` — stays on your machine. |
| **Browser admin** | Optional: same PAT value stored once in `localStorage` under key `UPDATE_JSON_KEY` (your choice; keep the admin URL private). |

---

## Update JSON from the manage calendar page

1. **`schedule-admin.html` → שמור** – Uses the same token as env/secret **`UPDATE_JSON_KEY`**, but **GitHub Actions secrets are not available in the browser**. One-time in the browser console (F12) on that site: `localStorage.setItem('UPDATE_JSON_KEY', 'your_pat_here')`, or set `window.UPDATE_JSON_KEY` from a local script (do not commit). Then **שמור** uploads **`naomi-availability.json`** via the API to **`rahellyg/NAOMI`** (`GITHUB_PUSH_*` in the page script). If **CORS** blocks, JSON is copied to the clipboard; use **`push-availability.mjs`** or git.

2. **Push to GitHub – Node script** (from project folder; file must contain the JSON you want live):
   - Set **`UPDATE_JSON_KEY`** (preferred) or **`GITHUB_TOKEN`** to your fine-grained PAT (Contents: read+write on the repo).
   ```powershell
   $env:UPDATE_JSON_KEY = "github_pat_..."
   node tools/push-availability.mjs rahellyg NAOMI main naomi-availability.json
   ```
   ```bash
   export UPDATE_JSON_KEY=github_pat_...
   node tools/push-availability.mjs rahellyg NAOMI main naomi-availability.json
   ```
   Uses the file `naomi-availability.json` in the project root.

---

## GitHub Action (after you push the JSON)

Workflow: **`.github/workflows/naomi-availability.yml`**

- **Triggers** when `naomi-availability.json` changes on **push** or **pull request**, and on **workflow_dispatch** (Run workflow in the Actions tab).
- **Runs** `node tools/validate-availability.mjs` so invalid JSON fails the check before you merge or so you see a red ✗ on the commit.

Pushing `naomi-availability.json` to the branch that **GitHub Pages** builds is enough for the live site to serve the new file (wait ~1 minute, then hard refresh). The Action does **not** need `UPDATE_JSON_KEY`; that secret is only for `push-availability.mjs` from your PC when you upload via API instead of git push.

---

## How the booking page loads data

The public **“קביעת פגישה”** section in `index.html` loads availability in this order:

1. **`naomi-availability.json`** – fetched from the **same folder** as your site (e.g. `https://user.github.io/YourRepo/naomi-availability.json`).
2. If that fails – **embedded JSON** inside `index.html` in:
   ```html
   <script type="application/json" id="naomi-availability-embed">{"version":1,...}</script>
   ```

If the fetch fails (wrong path, file missing, etc.) and the embed still has **`blockedDates: []`**, **every future date will look available**. That’s why you must keep **both** the file and the embed in sync when you use GitHub Pages.

---

## After you change the calendar in `schedule-admin.html`

1. Click **שמור** in `schedule-admin.html` – copies JSON to the clipboard; paste into **`naomi-availability.json`**, then run **`node tools/push-availability.mjs`** with **`UPDATE_JSON_KEY`** set (or commit + push the file).
2. Update the embed in **`index.html`** if you rely on the fallback (same data as the file).
3. `git add naomi-availability.json index.html` (as needed)
4. `git commit` → `git push`
5. Wait ~1 minute for GitHub Pages, then hard refresh (**Ctrl+F5**).

---

## Check that GitHub actually has your blocks

- Open in the browser (adjust URL):
  - `https://<user>.github.io/<repo>/naomi-availability.json`
- You should see `"blockedDates": ["2026-03-25", ...]` (your real dates).
- If you get **404**, the file isn’t deployed (wrong branch/folder). Fix **Settings → Pages** source branch/folder.

---

## English summary

| What you want | What to update on GitHub |
|---------------|---------------------------|
| Gray / blocked dates on the booking page | `blockedDates` in **`naomi-availability.json`** + same data in **`naomi-availability-embed`** in `index.html` |
| Only pushing `index.html` | Not enough if embed is stale |
| Only pushing `naomi-availability.json` | OK **if** fetch works; if the site falls back to embed, update embed too |

The repo copy of `naomi-availability.json` currently may still show **`blockedDates": []`** until you export again after marking days red in the admin calendar.
