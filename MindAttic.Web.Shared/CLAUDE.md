# MindAttic.Shared Project Rules

## Conversation
- A bare "do" / "do it" / "yes" from the user means "continue", "keep going", "proceed". Resume the current task without asking for clarification.

## What this is
- Source-of-truth for shared front-end assets across MindAttic web properties.
- Currently: the CBG (Console Background) cyberpunk effects suite (CSS + JS) used by StreetSamurai and mindattic.com.
- Raw source distribution. No NuGet, no npm. Consumers run a PowerShell sync script to pull copies in.

## Layout
- `cbg/` — the CBG (Console Background) bundle: `console-bg.js` engine + companion JS/CSS/HTML + `assets/` (parallax textures).
- `sync/` — PowerShell distribution scripts. `sync-all.ps1` is the umbrella runner; `/sync` slash command wraps it.

## Sync targets
- `mindattic.com/index.htm` — inlined between `<!-- BEGIN MINDATTIC.SHARED:CBG --> ... <!-- END MINDATTIC.SHARED:CBG -->` markers.
- `StreetSamurai/v3/StreetSamurai.Blazor/wwwroot/` — JS files copied into `js/`, CSS injected between `/* == BEGIN/END MINDATTIC.SHARED:CBG.CSS == */` markers in `app.css`.

## Editing rule
- Edit only in `cbg/`. Re-run `sync/sync-all.ps1` (or `/sync`) after any change. Downstream copies are derived artifacts.
