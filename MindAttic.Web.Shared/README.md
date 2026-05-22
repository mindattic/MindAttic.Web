# MindAttic.Components

**Drop-in front-end components for MindAttic web properties.** A growing
catalog of self-contained CSS + JS + (sometimes) HTML bundles that any
subscriber can pull in via jsDelivr CDN at runtime, or via marker-block sync
into the subscriber's source tree. Zero build step on the subscriber side.

Currently powers `mindattic.com`, the `StreetSamurai` Blazor home page, and
the `Claudia` / `ChiMesh` markdown-to-HTML build pipelines. New subscribers
declare themselves in [`subscribers.json`](subscribers.json) and pick up
fresh content on every sync.

```html
<!-- pinned production -->
<script src="https://cdn.jsdelivr.net/gh/mindattic/MindAttic.Components@v1.0.0/Cyberspace/console-bg.js"></script>
<link  rel="stylesheet" href="https://cdn.jsdelivr.net/gh/mindattic/MindAttic.Components@v1.0.0/Cyberspace/frontpage.css">
```

---

## Components

Each component folder is fully self-contained: source files, a usage `.html`
comment, a `<FolderName>.md` doc, and any companion `.json` config.

| Component | Type | What it does | Docs |
|---|---|---|---|
| **[Cyberspace](Cyberspace/Cyberspace.md)** | HTML + CSS + JS bundle | Cyberpunk console-background effects engine — 17 named effects (TERMINAL, CRASH, TREMOR, LEAK, SCHEMATIC, CASCADE, ARTIFACT × 7 variants, FRAGMENT, TRACE, PULSAR, HEIST, PREDATOR), scan-line overlay, parallax circuit-board, keepout zones around content. | [Cyberspace.md](Cyberspace/Cyberspace.md) |
| **[OutfitFont](OutfitFont/OutfitFont.md)** | font + CSS | Outfit variable font (Google Fonts, weights 100–900) inlined as base64 woff2. Two `@font-face` declarations (Latin + Latin-Extended) plus `:root { --font-outfit: 'Outfit', system-ui, sans-serif; }` for ergonomic reuse. | [OutfitFont.md](OutfitFont/OutfitFont.md) |
| **[AtticFont](AtticFont/AtticFont.md)** | font + CSS | Attic display face inlined as base64 woff2. Single `@font-face` plus `:root { --font-attic: 'Attic', serif; }`. Per-subscriber `applyToSelector` controls where Attic is auto-applied (`#claudia`, `#chimesh`, `.site-name`, …). | [AtticFont.md](AtticFont/AtticFont.md) |
| **[PinFooter](PinFooter/PinFooter.md)** | CSS + JS | Pin-when-short footer. Toggles `position: fixed; bottom: 0` on any element with class `pin-when-short` while the document is shorter than the viewport; releases it when content overflows. | [PinFooter.md](PinFooter/PinFooter.md) |
| **[BackHomeM](BackHomeM/BackHomeM.md)** | CSS only | A capital "M" in AtticFont pinned to the upper-left, linking back to mindattic.com. Used on satellite sites (Claudia, ChiMesh) so a visitor can always get home. | [BackHomeM.md](BackHomeM/BackHomeM.md) |
| **[WebSnapshot](WebSnapshot/WebSnapshot.md)** | Node CLI + browser viewer | Capture a fresh screenshot of any URL with Playwright, scale + crop it to a preview rectangle (cover-fit + alignment crop), then render it in a `.web-snapshot` container with a handheld-camera Perlin-noise wobble. Math ported from GridGame2026's `ActorThumbnail.cs`. | [WebSnapshot.md](WebSnapshot/WebSnapshot.md) |

---

## Layout

```
MindAttic.Components/
│
├── Cyberspace/                  # Cyberpunk console-background effects
│   ├── frontpage.html           #   DOM scaffolding (3 fixed-position layer divs)
│   ├── frontpage.css            #   17 effects + scan-lines + flicker keyframes
│   ├── console-bg.js            #   animation engine
│   ├── home-bg.js               #   torn-edge portrait compositor
│   ├── tv-static.js             #   navigation-transition TV-static overlay
│   ├── loader.js                #   tiny global loader show/hide helper
│   ├── index.htm                #   ad-hoc local test harness
│   ├── assets/                  #   parallax textures (circuitboard.00..02.png)
│   └── Cyberspace.md
│
├── OutfitFont/                  # Outfit variable font, base64 woff2
│   ├── outfit-font.html
│   ├── outfit-font.css          #   @font-face + --font-outfit
│   ├── outfit-font.json         #   { fontFamily, fallback, applyToSelector }
│   └── OutfitFont.md
│
├── AtticFont/                   # Attic display face, base64 woff2
│   ├── attic-font.html
│   ├── attic-font.css           #   @font-face + --font-attic
│   ├── attic-font.json          #   { fontFamily, fallback }
│   └── AtticFont.md
│
├── PinFooter/                   # Pin-when-short footer
│   ├── pin-footer.html
│   ├── pin-footer.css           #   .pin-when-short.pinned { position: fixed; bottom: 0 }
│   ├── pin-footer.js            #   toggles .pinned on resize / mutation / fonts.ready
│   └── PinFooter.md
│
├── BackHomeM/                   # "M" return-home anchor (upper-left)
│   ├── back-home-m.html
│   ├── back-home-m.css          #   AtticFont stack + position: fixed top/left
│   └── BackHomeM.md
│
├── WebSnapshot/                 # Snapshot capture + handheld-wobble viewer
│   ├── web-snapshot.js          #   Playwright capture engine
│   ├── snapshot.js              #   CLI wrapper
│   ├── snapshots.config.js      #   declarative recurring targets
│   ├── web-snapshot-viewer.js   #   browser-side animation runtime
│   ├── web-snapshot.css         #   .web-snapshot container behavior
│   ├── web-snapshot.html        #   paste-in usage template
│   ├── package.json             #   Playwright dep + npm scripts
│   ├── previews/                #   generated: <name>.b64.txt (+ .meta.json)
│   └── WebSnapshot.md
│
├── sync/                        # Distribution scripts (PowerShell)
│   ├── _subscribers.ps1                   # helper dot-sourced by every sync script (reads subscribers.json)
│   ├── sync-all.ps1                       # umbrella runner
│   ├── sync-mindattic-com.ps1             # inlines bundles into mindattic.com/index.htm
│   ├── sync-streetsamurai.ps1             # rewrites StreetSamurai.Blazor wwwroot/*
│   ├── sync-claudia.ps1                   # splices markers into Claudia/build-html.js
│   ├── sync-chimesh.ps1                   # splices markers into ChiMesh/build-html.js
│   ├── bootstrap-textures.ps1             # one-shot: pull circuitboard PNGs from StreetSamurai
│   ├── bootstrap-streetsamurai-appcss.ps1 # one-shot: insert CYBERSPACE markers into app.css
│   └── sync.md
│
├── subscribers.json             # canonical map: which components flow to which subscribers + per-subscriber config
├── README.md                    # (this file)
├── CLAUDE.md                    # working-directory rules for the AI agent
└── .github/                     # PIPELINES.md + workflows/sync-subscribers.yml
```

---

## Delivery pipelines

See [`.github/PIPELINES.md`](.github/PIPELINES.md) for the full setup
(including the one-time PAT step) and CDN URL/tagging conventions.

| Pipeline | What it does | When it runs |
|---|---|---|
| **jsDelivr CDN** | Serves any file at `https://cdn.jsdelivr.net/gh/mindattic/MindAttic.Components@<ref>/<path>` — versioned, edge-cached, no infra to run | Continuously; cache-immutable for `@v*` tags |
| **GitHub Actions cross-repo sync** | On push to `main`, opens PRs against `mindattic/mindattic.com` and `mindattic/StreetSamurai` with refreshed marker blocks / wwwroot copies | Every push to `main` (workflow: [`.github/workflows/sync-subscribers.yml`](.github/workflows/sync-subscribers.yml)) |
| **PowerShell `sync/*.ps1`** | Local dev fallback — same logic as the Action, runs against your working copies | Manual (`/sync` slash command or `sync/sync-all.ps1`) |

| Subscriber | Runtime source | In-repo copy |
|---|---|---|
| `mindattic.com` | Inlined HTML+CSS+JS marker blocks in `index.htm` | Refreshed by GitHub Action / `sync-mindattic-com.ps1` |
| `StreetSamurai` (Blazor) | `wwwroot/js/*.js` + CSS marker blocks in `wwwroot/app.css` | Refreshed by GitHub Action / `sync-streetsamurai.ps1` |
| `Claudia` / `ChiMesh` | Generated `Claudia.htm` / `ChiMesh.htm` from `scripts/cli/build-html.js` | Marker blocks inside `build-html.js`, refreshed per push |

### GitHub Action PAT — `SUBSCRIBER_REPO_TOKEN`

The cross-repo sync workflow needs a fine-grained personal access token so
it can open PRs against subscriber repos. Stored as the repository secret
**`SUBSCRIBER_REPO_TOKEN`** at
[`Settings → Secrets and variables → Actions`](https://github.com/mindattic/MindAttic.Components/settings/secrets/actions).

Generate at
[github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new)
with:

| Field | Value |
|---|---|
| Resource owner | `mindattic` |
| Repository access | *All repositories owned by `mindattic`* — covers every current and future subscriber automatically |
| Expiration | ~1 year (rotate on calendar) |
| Permission: **Metadata** | Read-only *(auto-included on every fine-grained PAT)* |
| Permission: **Contents** | **Read and write** *(push the `auto/sync-components` branch)* |
| Permission: **Pull requests** | **Read and write** *(open/update the cross-repo PR)* |

Any other permission is unnecessary — leave Pages, Secrets, security
advisories, etc. unchecked. Full walkthrough including the one-time secret
upload step is in [`.github/PIPELINES.md`](.github/PIPELINES.md).

> **Never paste the PAT value into the repo, into chat, or into a commit
> message.** If you do, treat it as compromised — revoke it immediately on
> the PAT settings page and generate a fresh one before saving the new
> value into the GitHub secret.

**Local retrieval via [`MindAttic.Vault`](../MindAttic.Vault/README.md).** For
local tools that need to call the GitHub API on behalf of this repo, the
same PAT is mirrored into the family-wide token store at
`%APPDATA%\MindAttic\GitHub\tokens.json` under the key
`mindattic-components-pat`:

```csharp
using MindAttic.Vault.Credentials;

var pat = TokenStore.ForBucket("GitHub").Get("mindattic-components-pat");
```

The two stores (GitHub repo secret and Vault `tokens.json`) are *independent*
copies — rotating the PAT means updating both. Keep them in sync, or pick
one (the GitHub secret) as authoritative and rewrite the Vault entry from
it whenever the PAT changes.

---

## Subscribers config

**Canonical source of truth: [`subscribers.json`](subscribers.json)**.
It has two sections: a `components` registry (every shippable component
with its source files and marker name) and a `subscribers` map (one entry
per subscriber, declaring `target`, `syncScript`, and a `subscriptions`
array).

Per-subscription overrides — like AtticFont's `applyToSelector` — live on
the subscription entry. Override precedence: explicit subscription value >
component JSON default > no apply rule. Pass `null` on the subscription to
explicitly suppress (e.g. StreetSamurai opts out of AtticFont's auto-apply
rule).

```jsonc
"Claudia": {
  "kind":       "build-html-js",
  "target":     "D:/Projects/MindAttic/Claudia/scripts/cli/build-html.js",
  "syncScript": "sync-claudia.ps1",
  "subscriptions": [
    { "component": "OutfitFont" },
    { "component": "AtticFont",  "applyToSelector": "#claudia" },
    { "component": "BackHomeM"  }
  ]
}
```

Every sync script reads this file via the shared `_subscribers.ps1`
helper and iterates its subscriber's `subscriptions` array — no subscriber has
a hardcoded component list anymore. Adding `{ "component": "BackHomeM" }`
to a subscriber's subscriptions enrolls that subscriber in the component on
the next run; removing the line unenrolls it.

| Subscriber kind        | What "add a subscription" means |
|---|---|
| `build-html-js` (Claudia, ChiMesh) | Edit `subscribers.json` only. CSS marker pair must exist in `build-html.js` once (one-time hand-insert). |
| `html-inline` (mindattic.com)      | Edit `subscribers.json` only **if** the component's type already has a `switch` case in `sync-mindattic-com.ps1`. New types need a builder + dispatch case. HTML marker pair must exist in `index.htm` once. |
| `blazor-wwwroot` (StreetSamurai)    | Edit `subscribers.json` only **if** the component's type already has a `switch` case in `sync-streetsamurai.ps1`. CSS marker pairs in `app.css` are one-time hand-inserts (`bootstrap-streetsamurai-appcss.ps1` helps). |

---

## Marker contract

Every sync edit is bounded by a comment pair. HTML subscribers use
`<!-- BEGIN MINDATTIC.COMPONENTS:<MARKER> --> … <!-- END … -->`; CSS
subscribers (including the `<style>` literal inside `build-html.js`) use
`/* == BEGIN MINDATTIC.COMPONENTS:<MARKER>.CSS == */ … /* == END … == */`.
Anything outside the markers is left untouched, so subscriber projects can
hand-author the rest of the file without conflict.

The script-generated body always opens with a `Generated by …` comment
warning subscribers not to hand-edit, because the next sync will overwrite.

---

## Editing a component

Edit files in the component's folder (e.g. `Cyberspace/console-bg.js`).
Push to `main` and the GitHub Action delivers to every subscriber, or run
`sync/sync-all.ps1` (or the `/sync` slash command) locally for fast
iteration without round-tripping through GitHub.

```powershell
# from MindAttic.Components — push to all subscribers in one shot (local)
powershell -File sync/sync-all.ps1

# or invoke an individual target
powershell -File sync/sync-mindattic-com.ps1
powershell -File sync/sync-streetsamurai.ps1
```

Downstream copies are derived artifacts — never edit them directly; the
next sync overwrites whatever's between the marker pairs.

---

## Adding a new component

1. Create a folder at the repo root with the source files
   (`<name>.html`, `<name>.css`, optional `<name>.js`, optional
   `<name>.json` for config-driven components, and a `<FolderName>.md` doc).
2. Register it in `subscribers.json` under `components` with its `type`
   (`font-css`, `static-css`, or `html-bundle`), source-file paths, and a
   base marker name (without `.CSS` / `.HTML` suffix).
3. Subscribe subscribers to it: add `{ "component": "<Name>" }` to each
   subscriber's `subscriptions` array in `subscribers.json`.
4. For each subscribed project:
   - Insert the marker pair into the subscriber's target file (one-time
     hand-edit).
   - For `html-bundle` types on `html-inline` / `blazor-wwwroot` subscribers,
     add a builder function + `switch` case in the relevant sync script if
     the type doesn't already have one.
5. Run `sync/sync-all.ps1` and confirm a clean splice.

---

## Adding a new subscriber

1. Add an entry to `subscribers.json` under `subscribers` with `kind`,
   `target`, `syncScript`, and `subscriptions`.
2. Create `sync/sync-<subscriber>.ps1` that dot-sources `_subscribers.ps1`,
   reads its subscriber via `Get-Subscriber`, and iterates `$sub.subscriptions`.
3. Make it idempotent — running twice with no source changes produces no diff.
4. `sync-all.ps1` picks it up automatically (it discovers `sync-*.ps1` by glob).
5. If the subscriber also needs the GitHub Action delivery, mirror the logic in
   `.github/workflows/sync-subscribers.yml`.

---

## Keepout zones (Cyberspace)

`console-bg.js` ships a keepout system that prevents effects from spawning
behind page content. The placer (`bestPos` / `safePos`) weights overlap
with these rects 4× a normal window overlap, so it strongly prefers
spawning in the margins.

Baked-in selectors — any host gets these for free:
- `.cyberspace-keepout` — opt-in marker; add to any container you want protected.
- `main` — both subscribers use `<main>` for their content area.
- `.home-content` — StreetSamurai's Home wrapper.
- `.board-grid` — any tab/tile board.

Hosts can extend at runtime:

```js
window.__cyberspaceKeepoutSelectors = '.foo, .bar';
```

---

## Cyberspace effect catalog

Canonical names + definitions live in the registry header of
`console-bg.js`. Toggles (`FX_*`) and spawn rates (`RATE_*`) are clustered
near the top of the file — flip any `FX_*` to `false` to kill that effect.

### Top-level effects (tick-loop dispatch)

| Name        | Spawn fn                  | Toggle / Rate              | What it does |
|-------------|---------------------------|----------------------------|--------------|
| **TERMINAL**| `spawnWindow`             | `FX_WIN` / remainder       | Generic console window (the workhorse) |
| **CRASH**   | `spawnError`              | `FX_ERROR` / 1%            | Fatal-error popup |
| **TREMOR**  | `spawnWarning`            | `FX_WARN` / 1%             | Warning popup |
| **LEAK**    | `spawnMemo`               | `FX_MEMO` / 4%             | Leaked corporate memo, character-by-character erase |
| **SCHEMATIC**| `spawnGeoWindow`         | `FX_GEO` / 10%             | Geometric schematic window |
| **CASCADE** | `spawnCascade`            | `FX_CASCADE` / 3%          | Burst of 3–6 cascaded console windows |
| **ARTIFACT**| `spawnArtifact`           | `FX_ARTIFACT` / 12%        | Floating glyph cluster — 7 variants below |
| **FRAGMENT**| `spawnFrag`               | `FX_FRAG` / 40%            | Floating code fragments (most frequent effect) |
| **TRACE**   | `spawnNetConnect`         | `FX_NET` / 8%              | Tron-cycle network wire route |
| **PULSAR**  | `spawnMorseDot`           | `FX_MORSE` / 5%            | Morse-code glowing dot |
| **HEIST**   | `spawnFolderRip`          | `FX_FOLDER` / 4%           | Folder-rip file-extraction sequence |
| **PREDATOR**| `spawnArtifactPredator`   | `FX_PREDATOR` / 1.2%       | Rare artifact-hunting swarm |

### ARTIFACT — 7 behavior variants

| Variant       | Behavior |
|---------------|----------|
| **SCATTER**   | Random blob; all glyphs drift one direction |
| **LATTICE**   | Fibonacci grid; whole lattice drifts with corner-wave delay |
| **ANCHOR**    | Stationary grid; glitches in place; emits feelers |
| **SLUG**      | Single grid crawls + per-cell undulation |
| **CENTIPEDE** | Multi-segment chain; peristaltic wave + leader feelers |
| **PULSE**     | Concentric Fibonacci rings; lub-dub heartbeat radiating outward |
| **WANDERER**  | Small grid walks the screen, pauses to "look around" |

### PULSAR — 2 modes

| Mode      | Share | Behavior |
|-----------|-------|----------|
| **BLINK** | ~90%  | Classic on/off pulse |
| **SHIFT** | ~10%  | Slides cardinal directions, color-swaps each symbol |

### TRACE — 3 sub-behaviors

| Sub       | Behavior |
|-----------|----------|
| **ARC**   | Sharp-turn spark burst at ~30% of corners |
| **ACK**   | Three-blink success signal then synced fade-out |
| **SEVER** | Direction-aligned CONNECTION-LOST message on failure |

### HEIST — 3 sequential phases

| Phase         | Behavior |
|---------------|----------|
| **HIGHLIGHT** | Cyan selection glow on adjacent run of files |
| **EXTRACT**   | Slide-right exit with shimmer + per-file stagger |
| **DISSOLVE**  | Window fade-out tied to extract completion |

### PREDATOR — 5 sequential sub-behaviors

| Sub          | Behavior |
|--------------|----------|
| **STALK**    | Off-screen swarm origin, homes on prey |
| **SCAN**     | Prey detection cone (max forward, min behind) |
| **FLEE**     | Prey panic-redirect of crawl vector away from swarm |
| **DEVOUR**   | Cell consume-and-convert (cell adopts wasp glyph then dissolves) |
| **DISPERSE** | Wasps scatter and fade after kill |
