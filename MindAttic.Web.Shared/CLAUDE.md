# MindAttic.Shared Project Rules

## Conversation
- A bare "do" / "do it" / "yes" from the user means "continue", "keep going", "proceed". Resume the current task without asking for clarification.

## What this is
- Source-of-truth for shared front-end assets across MindAttic web properties.
- Currently: the CBG (Console Background) cyberpunk effects suite (CSS + JS) used by StreetSamurai and mindattic.com.
- Raw source distribution. No NuGet, no npm. Consumers run a PowerShell sync script to pull copies in.

## Sync targets
- `mindattic.com/index.htm` — inlined between `<!-- BEGIN MINDATTIC.SHARED:FRONTPAGE --> ... <!-- END MINDATTIC.SHARED:FRONTPAGE -->` markers.
- `StreetSamurai/v3/StreetSamurai.Blazor/wwwroot/` — JS files copied into `js/`, CSS injected between markers in `app.css`.

## Editing rule
- Edit only in `frontpage/`. Re-run consumer sync scripts after any change. Downstream copies are derived artifacts.
