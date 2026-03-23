# Syncing `naomi-availability.json` with the booking page (GitHub Pages)

## Update JSON from the manage calendar page

1. **`schedule-admin.html` → שמור** – Copies formatted JSON to the clipboard. Paste into **`naomi-availability.json`** at the project root (and optionally the same JSON into **`naomi-availability-embed`** in `index.html` if you rely on the embed fallback).

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
   For **GitHub Actions**, add repository secret `UPDATE_JSON_KEY` and pass it as `env: UPDATE_JSON_KEY: ${{ secrets.UPDATE_JSON_KEY }}` in the workflow step that runs the script.

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
