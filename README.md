# Nobody International

Two things live here.

## `scout/` — the search

Finds people with a story before they have made a film. It works in two modes,
chosen per country in `scout/brief.py`:

- People may have some video experience, as Pavel did. What the scout scores
  highest is a visible wish to tell their own story.
- **Open countries:** searches the public web in the local language across five
  lanes (local press, first-person writing, small channels, community archives,
  first-timer workshops) and returns named leads scored against the Pavel
  profile.
- **High-risk countries** (`HIGH_RISK` in `brief.py`): never names an
  individual. It maps the exile media, diaspora groups and professional
  networks that could carry an open call, so people choose to come forward.

```bash
cd scout
pip install -r requirements.txt
export ANTHROPIC_API_KEY=...          # or: ant auth login

python nobody.py scout --dry-run                      # the plan: 308 runs
python nobody.py scout --country Brazil --country Kenya
python nobody.py intake letters.json                  # inbound letters, any language
python nobody.py match                                # propose introductions
python nobody.py report --min 10                      # review queue, best first
```

`intake` reads a JSON list of `{name, country, language, role, story}`.
Results accumulate in `scout/data/leads.jsonl` and `introductions.jsonl`.

Edit `brief.py` to change who you are looking for, where, and in which
languages. Nothing in the tool contacts anyone: every lead is for a person to
read first.

Not yet run against the live API (no key in the build session). A full sweep is
308 research runs of up to 10 web searches each; start with two countries.

## `site/` — the website

Live at https://nobody-international.vercel.app (Vercel project
`nobody-international`).

- `index.html` — the whole page.
- `api/letters.js` — receives the form and saves each letter as a private JSON
  file in the Vercel Blob store `nobody-letters`, under `letters/<date>/`.
- `package.json` — the one dependency the function needs.
- `nobody-international.html` — the same page as previewed on claude.ai (not deployed).

Read letters in the Vercel dashboard: Storage → nobody-letters. To feed them to
the scout, download them, combine into one JSON list and run
`python scout/nobody.py intake letters.json`.

The Vercel project is connected to this repository with `site` as its root
directory: every push to `main` redeploys the live site, and other branches get
preview deployments.

To add your own domain: Vercel dashboard → the project → Settings → Domains.
