# MindAttic.Content Project Rules

## Conversation
- A bare "do" / "do it" / "yes" from the user means "continue", "keep going", "proceed". Resume the current task without asking for clarification.

## What this is
- Source-of-truth repo for **optional** front-end content delivered to MindAttic web properties.
- Currently: the CBG (Console Background) cyberpunk effects suite (CSS + JS) used by StreetSamurai and mindattic.com.
- Decoupled from consumers. Consumers receive updates through delivery pipelines (see "Pipelines" below) — not by direct dependency.

## Layout
- `cbg/` — the CBG (Console Background) bundle: `console-bg.js` engine + companion JS/CSS/HTML + `assets/` (parallax textures).
- `sync/` — PowerShell distribution scripts (legacy / dev-only fallback). `sync-all.ps1` is the umbrella runner; `/sync` slash command wraps it.
- `.github/workflows/` — GitHub Actions that automate cross-repo PRs into consumer repos on push to `main`.

## Delivery pipelines (consumers)
- **jsDelivr CDN** — every tag is served at `https://cdn.jsdelivr.net/gh/mindattic/MindAttic.Content@<tag>/cbg/<file>`. Production runtime path.
- **GitHub Actions cross-repo sync** — on push to `main`, `.github/workflows/sync-consumers.yml` opens PRs against `mindattic/mindattic.com` and `mindattic/StreetSamurai` with refreshed marker blocks / wwwroot copies.
- **PowerShell `sync/*.ps1`** — local dev fallback for fast iteration without round-tripping through GitHub.

## Sync targets (marker blocks consumed by every pipeline)
- `mindattic.com/index.htm` — inlined between `<!-- BEGIN MINDATTIC.CONTENT:CBG --> ... <!-- END MINDATTIC.CONTENT:CBG -->` markers.
- `StreetSamurai/v3/StreetSamurai.Blazor/wwwroot/` — JS files copied into `js/`, CSS injected between `/* == BEGIN/END MINDATTIC.CONTENT:CBG.CSS == */` markers in `app.css`.

## Editing rule
- Edit only in `cbg/`. Push to `main` and let GitHub Actions deliver, or run `sync/sync-all.ps1` (or `/sync`) locally for fast iteration. Downstream copies are derived artifacts.
