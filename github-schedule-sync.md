# Syncing `naomi-availability.json` with the booking page (GitHub Pages)

## Update JSON from the manage calendar page

1. **שמור** – In `schedule-admin.html`, fill GitHub owner/repo/token under **„הגדרות סנכרון GitHub (מתקדם)”**, then click **שמור**. That **pushes** `naomi-availability.json` to the repo (may fail in-browser due to **CORS**). Without full GitHub fields, **שמור** copies one-line JSON to the clipboard for pasting into `index.html` / GitHub.

2. **`schedule-admin.html` → „דחיפה ידנית ל-GitHub”**  
   Same API push as above, on demand. May fail in the browser with **CORS** (GitHub’s API often blocks direct calls from web pages).

3. **„פתיחת עריכת הקובץ ב-GitHub”**  
   Opens the GitHub web editor; paste JSON (e.g. after **שמור** copied to clipboard).

4. **Reliable: Node script** (from project folder; you need a local `naomi-availability.json` or paste into the file first):
   ```bash
   set GITHUB_TOKEN=your_fine_grained_token
   node tools/push-availability.mjs YOUR_USER YOUR_REPO main naomi-availability.json
   ```
   Uses the file `naomi-availability.json` in the project root.

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

1. Click **שמור** – pushes to GitHub if configured, or copies JSON to the clipboard.
2. In your repo (if you pasted manually):
   - Update **`naomi-availability.json`** and/or the embed in **`index.html`** with the same JSON.
3. `git add naomi-availability.json index.html`
4. `git commit -m "Update availability"`
5. `git push`
6. Wait ~1 minute for GitHub Pages, then hard refresh (**Ctrl+F5**).

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
