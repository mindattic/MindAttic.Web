# sync

PowerShell distribution scripts. They mirror what
`.github/workflows/sync-subscribers.yml` does on every push to `main`, but run
locally against working copies — so you can iterate on content changes
without round-tripping through GitHub.

This folder only handles the **splice-in-place subscribers** that
MindAttic.UiUx still owns: `mindattic.com` (CYBERSPACE block), the
`MindAttic.Psst` legal pages (OUTFITFONT block) and Tutor (auth-visual trio).
Prose.Writer, Prose.Codex and Ideas are marked `retired` in `subscribers.json`
(their target projects no longer exist); their scripts print the note and exit 0.
`ryandebraal.com` and `mindatticcares.com` are not spliced at all — they load
fonts and their own assets straight from jsDelivr (see `docs/ASSETS.md`), at the tag
[`MindAttic.Deploy`](../../MindAttic.Deploy/README.md)'s linked deploy pins. There are no
other CDN consumers: the catalog landing pages and the Claudia / ChiMesh long-form pages
that `MindAttic.Deploy` used to render were retired by its DEP-A6 (2026-10-03, see
[MAU-A7](../docs/AMENDMENTS.md#MAU-A7)); each repo's GitHub README is now its project page.

Each `sync-*.ps1` targets one subscriber. Each subscriber has one or more
**marker blocks** (HTML comment pairs or CSS comment pairs) that the sync
script overwrites in place. Anything outside the markers is left alone.

`sync-all.ps1` is the umbrella runner — it invokes every `sync-*.ps1` it
finds and aggregates failures.

**Canonical config: [`../subscribers.json`](../subscribers.json)** declares
the component registry and which subscribers consume which components.
Every sync script reads this file via the shared helper `_subscribers.ps1`
and iterates its subscriber's `subscriptions` array — no subscriber has a
hardcoded component list. Per-subscription config (like AtticFont's
`applyToSelector`) lives on the subscription entry; the helper applies it
with precedence: explicit subscription override > component JSON default
> no apply rule.

| Subscriber kind                            | What "add a subscription" means |
|---|---|
| `html-inline` (mindattic.com)              | Edit `subscribers.json` only **if** the component's type already has a `switch` case in `sync-mindattic-com.ps1` (font-css; html-bundle for Cyberspace/PinFooter/WebSnapshot). Today mindattic.com is enrolled in Cyberspace only. New component types need a builder + dispatch case, and the page needs the marker pair. |
| `blazor-wwwroot` (Tutor; Prose.Writer/Codex and Ideas retired) | Edit `subscribers.json` only **if** the component's type already has a `switch` case in the matching sync script. New types need a dispatch case. CSS marker pairs in `app.css` are one-time hand-inserts. |
| `html-inline-multi` (MindAttic.Psst legal) | Same contract as `html-inline`, but `target` is a folder and `targets[]` lists the files (currently `terms.htm` + `privacy.htm`). |

---

## Layout

```
sync/
├── _subscribers.ps1                   # helper dot-sourced by each sync-*.ps1 (reads subscribers.json)
├── sync-all.ps1                       # umbrella; invokes every sync-*.ps1 in this folder
├── sync-mindattic-com.ps1             # splices the CYBERSPACE block into mindattic.com/index.htm
├── sync-mindattic-psst.ps1            # splices OUTFITFONT into MindAttic.Psst/{terms,privacy}.htm
├── sync-tutor.ps1                     # splices the auth-visual trio into Tutor.Blazor/wwwroot
├── sync-prose.ps1                     # retired subscribers (Prose.Writer / Prose.Codex): reports, exits 0
└── sync-ideas.ps1                     # retired subscriber (MindAttic.Ideas.Web): reports, exits 0
```

---

## Pipelines vs scripts

| Trigger | What runs | When |
|---|---|---|
| **jsDelivr CDN** | Every tag is served at `https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@<ref>/<path>` — versioned, edge-cached, no infra. Consumed by the three sites at the tag the linked deploy pins. | Continuously; cache-immutable for `@V<n>` tags. |
| **GitHub Action** | `.github/workflows/sync-subscribers.yml` opens cross-repo PRs against `mindattic/mindattic.com` and `mindattic/MindAttic.Psst` with refreshed marker blocks. | Push to `main` touching `Components/Cyberspace/**`, `Components/OutfitFont/**`, `subscribers.json`, `sync/**` or the workflow (not when the commit says `[skip ci]`). |
| **`sync/*.ps1`** | Same logic as the Action, but runs locally against working copies. `sync-mindattic-com.ps1` is also invoked by `MindAttic.Deploy` as a `preDeploy` hook for `mindattic.com` (the linked deploy passes the release tag). | Manual (`powershell -File sync-all.ps1`). |

---

## Per-script summary

### `sync-all.ps1`

Discovers every `sync-*.ps1` in this folder (excluding itself), runs them
sequentially, and aggregates failures. Safe to re-run after any edit.

```powershell
powershell -File sync/sync-all.ps1
```

### `sync-mindattic-com.ps1`

Splices each subscribed MindAttic.UiUx group into `mindattic.com/index.htm`
between its own marker pair. Today `subscribers.json` enrolls mindattic.com in
**Cyberspace only** (fonts and the logo load from the CDN, see `docs/ASSETS.md`);
the script still has builders for these groups (in load order):

| Group | Marker pair | Source |
|---|---|---|
| OutfitFont  | `BEGIN/END MINDATTIC.UIUX:OUTFITFONT`  | `Components/OutfitFont/`  |
| AtticFont   | `BEGIN/END MINDATTIC.UIUX:ATTICFONT`   | `Components/AtticFont/`   |
| Cyberspace  | `BEGIN/END MINDATTIC.UIUX:CYBERSPACE`  | `Components/Cyberspace/`  |
| PinFooter   | `BEGIN/END MINDATTIC.UIUX:PINFOOTER`   | `Components/PinFooter/`   |
| WebSnapshot | `BEGIN/END MINDATTIC.UIUX:WEBSNAPSHOT` | `Components/WebSnapshot/` (CSS + viewer JS only; `.b64.txt` payloads are inlined per-tile by the subscriber) |

### `sync-prose.ps1`

1. Overwrites `wwwroot/js/{loader,tv-static,home-bg,console-bg}.js` from `Components/Cyberspace/`.
2. Overwrites `wwwroot/js/pin-footer.js` from `Components/PinFooter/`.
3. Rewrites the CYBERSPACE marker block in `wwwroot/app.css` from `Components/Cyberspace/frontpage.css`.
4. Rewrites the OUTFITFONT + ATTICFONT marker blocks in `wwwroot/app.css` from `Components/OutfitFont/` and `Components/AtticFont/`.

All CSS marker pairs must already exist in `wwwroot/app.css` before the
first run. If you're standing up a new subscriber, add the `BEGIN/END MINDATTIC.UIUX:<MARKER>`
pairs to its `app.css` by hand first.

```powershell
powershell -File sync/sync-prose.ps1    # currently prints the two "retired" notes and exits 0
```

### `sync-mindattic-psst.ps1`

Inlines OutfitFont into `MindAttic.Psst/terms.htm` and `MindAttic.Psst/privacy.htm`
between `<!-- BEGIN/END MINDATTIC.UIUX:OUTFITFONT -->` markers. The repo's
`index.htm` is NOT touched here (it has no UiUx marker block).

```powershell
powershell -File sync/sync-mindattic-psst.ps1
powershell -File sync/sync-mindattic-psst.ps1 -TargetRoot 'D:/path/to/MindAttic.Psst'
```

---

## Adding a new subscriber

Before adding one here, **make sure it can't simply load from the CDN**. A
project page is its GitHub README (the `MindAttic.Deploy` catalog that rendered
READMEs into landing pages was retired by DEP-A6), and a hand-authored page can
reference components and assets by tag-pinned jsDelivr URL. Only add a
`sync-<name>.ps1` here if the subscriber genuinely needs build-time
splice-in-place (e.g. it has hand-authored content outside the marker
blocks, like `mindattic.com/index.htm` or `MindAttic.Psst/{terms,privacy}.htm`).

If you do need a new splice-in-place subscriber:

1. Create `sync-<subscriber>.ps1` in this folder.
2. Make it idempotent — running twice in a row should produce no diff.
3. Use marker pairs (HTML or CSS comments) so the script only touches its
   own region of each downstream file.
4. `sync-all.ps1` picks it up automatically (discovers `sync-*.ps1` by glob).
5. Mirror the logic in `.github/workflows/sync-subscribers.yml`.

---

## Idempotency contract

Every script in this folder must be safe to re-run. The canonical pattern:

1. Read the subscriber file.
2. Find the marker pair.
3. Replace everything between markers with the freshly-built block.
4. Write back.

That way a no-op edit produces no diff, and a real edit produces exactly
the diff that the source change implies.

### Line-ending normalization

Component sources are stored LF; most subscriber host files are CRLF.
Splicing LF blocks into a CRLF file would leave mixed endings and a huge
EOL-only git diff that buries the real content change in every sync PR.
To prevent that, each marker-splice script detects the host file's
dominant line ending *before* splicing (`Get-DominantEol` in
`_subscribers.ps1`, CRLF wins ties) and normalizes the whole written file
to it (`ConvertTo-Eol`) on the way out. So a subscriber only ever sees the
content diff, never an EOL flip. (The first sync after this was introduced
may show a one-time, content-free normalization for any host file that was
previously committed with mixed endings — `git diff --ignore-cr-at-eol`
confirms it's pure EOL. The wholesale `wwwroot/js/*` copies in
`sync-prose.ps1` are byte-for-byte with source and are not
normalized.)

### Cyberspace JS is CDN-loaded for mindattic.com

`console-bg.js` is ~580 KB and `sacred-geometry.js` (the SacredGeometry shape
catalog it draws from) is ~60 KB. Inlining them into `index.htm` bloats the page
on every load and prevents the browser from caching them separately. So
`sync-mindattic-com.ps1` keeps the small Cyberspace scripts (loader, tv-static,
home-bg) and the circuitboard texture override (jsDelivr URLs) inline, but emits
**both** `sacred-geometry.js` and `console-bg.js` as external
`<script src="https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@<tag>/…">`
tags (the CDN set is `@('sacred-geometry.js','console-bg.js')`). The tag is the
`-CyberspaceCdnTag` parameter (default: the latest `V*` tag in this repo, via
`git describe`; the linked deploy passes the release tag explicitly).

Ordering is preserved because both CDN tags carry `defer` (deferred scripts run
after parsing, still in document order), and the CDN tags are emitted in `jsFiles` order: the inline block (which
defines `window.__cyberspaceCircuitboardSrcs`) runs first, then
`sacred-geometry.js` (defining `window.SacredGeometry`), then `console-bg.js`
(whose `TEX_SRCS` reads the circuitboard global and whose SCHEMATIC effect draws
from `window.SacredGeometry`) — both dependencies are in place before it runs.

To ship a change to either externalized file: commit it and run the linked deploy
(`MindAttic.Deploy`: `npm run deploy -- --uiux`), which tags the next whole number and
passes it as `-CyberspaceCdnTag`. Run by hand, the script defaults `-CyberspaceCdnTag`
to the latest `V*` tag in this repo (`git describe`), so it never pins a stale tag.
Both CDN scripts carry `defer`, and the sync also emits low-priority
`<link rel="preload">` tags for the three parallax textures.
