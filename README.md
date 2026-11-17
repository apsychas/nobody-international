# Nobody International

Two things live here.

## `scout/` — the command-line scout (older)

The private page at `/scout` is the tool to use; see below. This folder holds
the earlier command-line version, kept in step with the same brief: it looks
for people with a unique perspective during difficult or unprecedented times.

```bash
cd scout
pip install -r requirements.txt
export ANTHROPIC_API_KEY=...
python nobody.py scout --country Brazil --country Kenya
python nobody.py report
```

It lacks the page's newer features (open questions, story types, events, notes).

## `site/` — the website

Live at https://nobody-international.vercel.app (Vercel project
`nobody-international`).

- `index.html` — the whole page.
- `api/letters.js` — receives the form and saves each letter as a private JSON
  file in the Vercel Blob store `nobody-letters`, under `letters/<date>/`.
- `package.json` — the one dependency the function needs.
- `nobody-international.html` — the same page as previewed on claude.ai (not deployed).

- `scout.html` + `api/scout.js` + `lib/brief.js` — the private scout page at
  `/scout`: search, read website letters, review queue, introductions. It needs
  two environment variables in the Vercel project: `SCOUT_PASSWORD` (the page
  password, 8+ characters) and `ANTHROPIC_API_KEY`. Leads are stored in the same
  private Blob store under `scout/`.

Read letters in the scout page, or raw in the Vercel dashboard: Storage → nobody-letters. To feed them to
the scout, download them, combine into one JSON list and run
`python scout/nobody.py intake letters.json`.

The Vercel project is connected to this repository with `site` as its root
directory: every push to `main` redeploys the live site, and other branches get
preview deployments.

To add your own domain: Vercel dashboard → the project → Settings → Domains.
