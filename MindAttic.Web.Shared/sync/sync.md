# sync

PowerShell distribution scripts. They mirror what
`.github/workflows/sync-subscribers.yml` does on every push to `main`, but run
locally against working copies — so you can iterate on content changes
without round-tripping through GitHub.

Each `sync-*.ps1` targets one downstream subscriber. Each subscriber has one or
more **marker blocks** (HTML comment pairs or CSS comment pairs) that the
sync script overwrites in place. Anything outside the markers is left alone.

`sync-all.ps1` is the umbrella runner — it invokes every `sync-*.ps1` it
finds and aggregates failures.

**Canonical config: [`../subscribers.json`](../subscribers.json)** declares
the component registry and which subscribers consume which components.
Every sync script reads this file via the shared helper `_subscribers.ps1`
and iterates its subscriber's `subscriptions` array — no subscriber has a
hardcoded component list anymore. Per-subscription config (like AtticFont's
`applyToSelector`) lives on the subscription entry; the helper applies it
with precedence: explicit subscription override > component JSON default
> no apply rule.

| Subscriber kind        | What "add a subscription" means |
|---|---|
| `build-html-js` (Claudia, ChiMesh) | Edit `subscribers.json` only. Marker pair must exist in `build-html.js` once (one-time hand-insert). |
| `html-inline` (mindattic.com)      | Edit `subscribers.json` only **if** the component's type already has a `switch` case in `sync-mindattic-com.ps1` (font-css, html-bundle for Cyberspace/PinFooter/WebSnapshot). New component types need a builder + dispatch case. Marker pair must exist in `index.htm` once. |
| `blazor-wwwroot` (StreetSamurai)    | Edit `subscribers.json` only **if** the component's type already has a `switch` case in `sync-streetsamurai.ps1`. New types need a dispatch case. CSS marker pairs in `app.css` are one-time hand-inserts (`bootstrap-streetsamurai-appcss.ps1` helps). |

---

## Layout

```
sync/
├── sync-all.ps1                       # umbrella; invokes every sync-*.ps1 in this folder
├── sync-mindattic-com.ps1             # inlines bundles into mindattic.com/index.htm
├── sync-streetsamurai.ps1             # rewrites StreetSamurai.Blazor wwwroot files
├── sync-chimesh.ps1                   # splices font CSS into ChiMesh/build-html.js
├── sync-claudia.ps1                   # splices font CSS into Claudia/build-html.js
├── bootstrap-textures.ps1             # one-shot: pull circuitboard PNGs from StreetSamurai
└── bootstrap-streetsamurai-appcss.ps1 # one-shot: insert CYBERSPACE markers into app.css
```

---

## Pipelines vs scripts

| Trigger | What runs | When |
|---|---|---|
| **jsDelivr CDN** | Every tag is served at `https://cdn.jsdelivr.net/gh/mindattic/MindAttic.Components@<ref>/<path>` — versioned, edge-cached, no infra. | Continuously; cache-immutable for `@v*` tags. |
| **GitHub Action** | `.github/workflows/sync-subscribers.yml` opens cross-repo PRs against `mindattic/mindattic.com` and `mindattic/StreetSamurai` with refreshed marker blocks. | Every push to `main`. |
| **`sync/*.ps1`** | Same logic as the Action, but runs locally against working copies. | Manual (`/sync` slash command or `powershell -File sync-all.ps1`). |

---

## Per-script summary

### `sync-all.ps1`

Discovers every `sync-*.ps1` in this folder (excluding itself), runs them
sequentially, and aggregates failures. Safe to re-run after any edit.

```powershell
powershell -File sync/sync-all.ps1
```

### `sync-mindattic-com.ps1`

Inlines each MindAttic.Components group into `mindattic.com/index.htm` between
its own marker pair. Groups (in load order):

| Group | Marker pair | Source |
|---|---|---|
| OutfitFont  | `BEGIN/END MINDATTIC.COMPONENTS:OUTFITFONT`  | `OutfitFont/`  |
| AtticFont   | `BEGIN/END MINDATTIC.COMPONENTS:ATTICFONT`   | `AtticFont/`   |
| Cyberspace  | `BEGIN/END MINDATTIC.COMPONENTS:CYBERSPACE`  | `Cyberspace/`  |
| PinFooter   | `BEGIN/END MINDATTIC.COMPONENTS:PINFOOTER`   | `PinFooter/`   |
| WebSnapshot | `BEGIN/END MINDATTIC.COMPONENTS:WEBSNAPSHOT` | `WebSnapshot/` (CSS + viewer JS only; `.b64.txt` payloads are inlined per-tile by the subscriber) |

### `sync-streetsamurai.ps1`

1. Overwrites `wwwroot/js/{loader,tv-static,home-bg,console-bg}.js` from `Cyberspace/`.
2. Overwrites `wwwroot/js/pin-footer.js` from `PinFooter/`.
3. Rewrites the CYBERSPACE marker block in `wwwroot/app.css` from
   `Cyberspace/frontpage.css`.
4. Rewrites the OUTFITFONT + ATTICFONT marker blocks in `wwwroot/app.css`
   from `OutfitFont/` and `AtticFont/`.

All CSS marker pairs must already exist in `wwwroot/app.css` before the
first run. If you're standing up a new subscriber, use
`bootstrap-streetsamurai-appcss.ps1` first to insert them.

```powershell
powershell -File sync/sync-streetsamurai.ps1
powershell -File sync/sync-streetsamurai.ps1 -BlazorRoot 'D:/path/StreetSamurai.Blazor'
```

### `sync-chimesh.ps1` / `sync-claudia.ps1`

Splice the OutfitFont + AtticFont `@font-face` CSS into each project's
`scripts/cli/build-html.js` inside the `<style>` template literal. Every
subsequent `node scripts/cli/build-html.js` run inherits the fresh fonts
into the generated HTML.

Marker pairs must already exist in `build-html.js` (insert manually once,
right after the opening `<style>`).

```powershell
powershell -File sync/sync-chimesh.ps1
powershell -File sync/sync-claudia.ps1 -ClaudiaRoot 'D:/path/Claudia'
```

### `bootstrap-textures.ps1`

One-shot. Pulls the three `circuitboard.0X.png` parallax textures from
StreetSamurai's media folder into `Cyberspace/assets/` as lossless copies.
JPEG block compression breaks the edge-pixel match between tile copies and
produces visible seams — keep these as PNG.

Re-run only when upstream PNGs change.

### `bootstrap-streetsamurai-appcss.ps1`

One-shot. Replaces a hard-coded line range in
`StreetSamurai/wwwroot/app.css` (the legacy CYBERSPACE block) with a
marker pair, so subsequent `sync-streetsamurai.ps1` runs have somewhere to
write into. Read the file before running on a new branch — the line numbers
are tied to a specific historical revision.

---

## Adding a new subscriber

1. Create `sync-<subscriber>.ps1` in this folder.
2. Make it idempotent — running twice in a row should produce no diff.
3. Use marker pairs (HTML or CSS comments) so the script only touches its
   own region of each downstream file.
4. `sync-all.ps1` picks it up automatically (discovers `sync-*.ps1` by glob).
5. If the subscriber also needs the GitHub Action delivery, mirror the logic
   in `.github/workflows/sync-subscribers.yml`.

---

## Idempotency contract

Every script in this folder must be safe to re-run. The canonical pattern:

1. Read the subscriber file.
2. Find the marker pair.
3. Replace everything between markers with the freshly-built block.
4. Write back.

That way a no-op edit produces no diff, and a real edit produces exactly
the diff that the source change implies.
