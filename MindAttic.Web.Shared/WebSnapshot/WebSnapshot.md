# WebSnapshot

Capture a fresh screenshot of any web page (or download any direct image URL),
crop it to a fixed preview rectangle, save the result as a base64 data URI,
and render it on a page with a handheld-camera wobble.

Two halves work together:

1. **Engine + CLI** — Node.js + Playwright. Visits a URL, takes the shot,
   crops it by alignment, writes `previews/<name>.b64.txt` (plus an
   optional `<name>.meta.json` sidecar in handheld mode).
2. **Viewer** — browser JS+CSS that finds `.web-snapshot` elements,
   loads the b64 data URI into an `<img>`, scales/positions it inside the
   container, and animates a slow Perlin-noise pan with periodic human-like
   pauses. Math is ported from GridGame2026's `ActorThumbnail.cs`.

The engine always launches a fresh Chromium context, so every run captures
the live current version of the page — no cache reuse, no stale pixels.

---

## Layout

```
WebSnapshot/
├── web-snapshot.js          # capture engine (Node.js + Playwright)
├── snapshot.js              # CLI wrapper around the engine
├── snapshots.config.js      # declarative list of recurring targets
├── web-snapshot-viewer.js   # browser-side animation runtime
├── web-snapshot.css         # base styles for .web-snapshot containers
├── web-snapshot.html        # paste-in usage template
├── package.json             # Playwright dep + npm scripts
└── previews/                # generated; one .b64.txt + .meta.json per target
```

---

## Install

One-time, in the `WebSnapshot/` folder:

```powershell
npm install
```

The `postinstall` hook runs `playwright install chromium` automatically, so
the headless browser binary lands in the local cache without an extra step.

---

## CLI

All forms produce `previews/<name>.b64.txt` (overwriting any prior file).

| Form | Behavior |
|---|---|
| `node snapshot.js` | Refresh every target listed in `snapshots.config.js`. |
| `node snapshot.js <name>` | Refresh one configured target. |
| `node snapshot.js <url>` | Ad-hoc; name derived from URL basename or host. |
| `node snapshot.js <name> <url>` | Ad-hoc with an explicit name. |

Flags (apply in any form; override config and defaults):

| Flag | Default | What it does |
|---|---|---|
| `--align=<spec>` | `center-top` | Crop position. Accepts any combo of `left/center/right` and `top/middle/bottom` in either order: `top-center`, `center-top`, `top-left`, `right-bottom`, `center-middle`, etc. |
| `--size=WxH` | `150x225` | Output crop dimensions in CSS px. |
| `--viewport=WxH` | `1280x1600` | Browser viewport the page renders into. Crop is taken from inside this. |
| `--delay=<ms>` | `750` | Settle time after `load` before the screenshot fires. |
| `--wait=<event>` | `load` | Playwright `waitUntil`: `load`, `domcontentloaded`, `networkidle`. |
| `--handheld` | off | Capture the crop +10% so the saved pixels carry their own pan headroom. Writes a `.meta.json` sidecar. |
| `--handheld-overflow=<N>` | `0.10` | Override the +10% (e.g. `0.15` for +15%). |
| `--wobble=<N>` | (off) | Shorthand for `--handheld --handheld-overflow=<N>`. Accepts `15%`, `15`, or `0.15` (all = 15%). |

Examples:

```powershell
# default — uses snapshots.config.js (currently: ryandebraal with handheld)
npm run snapshot

# ad-hoc, full control
node snapshot.js ryandebraal https://ryandebraal.com/ --align=top-center --size=150x225 --handheld

# direct image URL — flags ignored, raw bytes saved
node snapshot.js logo https://www.place.com/picture.jpg
```

Direct image URLs (matched by extension or `Content-Type: image/*` on a HEAD
request) skip Playwright entirely. The bytes are downloaded as-is and written
as the data URI — no crop, no handheld math.

Output naming:

- `previews/<name>.b64.txt` — the full `data:image/png;base64,…` string.
- `previews/<name>.meta.json` — present only when `--handheld` was used.

---

## Handheld mode

Without handheld, the engine writes the exact requested crop (e.g. 150x225)
and the viewer scales the `<img>` to 110% via CSS so it has room to pan.

With `--handheld`, the engine instead:

1. Computes the inner crop (e.g. `(565, 0, 150, 225)` for center-top on a
   1280×1600 viewport).
2. Expands it symmetrically by `--handheld-overflow` (default 10%), centered
   on the inner crop's center.
3. Clamps the outer rect to the viewport. Edge-aligned crops (top/left/etc.)
   would otherwise stretch off-screen — the clamp shifts the rect back in.
4. Captures the outer rect as the saved image.
5. Writes a `.meta.json` sidecar recording the inner/outer dimensions and
   the offset of the inner crop inside the outer image:

   ```json
   {
     "mode": "handheld",
     "align": "top-center",
     "overflow": 0.10,
     "innerWidth": 150,
     "innerHeight": 225,
     "outerWidth": 165,
     "outerHeight": 248,
     "cropOffsetX": 7,
     "cropOffsetY": 0
   }
   ```

The viewer reads the sidecar, renders the image at native size (no CSS
scaling), parks it at the position that puts the inner crop visible in the
container, and wobbles within the actual excess. For edge-aligned crops the
wobble becomes asymmetric (e.g. top-aligned can only wobble downward) — the
clamp logic in the viewer keeps it inside bounds.

---

## Consuming on a page

Two ways to feed the viewer.

**Fetch mode** — the viewer pulls the data URI from disk and looks for a
sibling `.meta.json`.

```html
<link rel="stylesheet" href="path/to/WebSnapshot/web-snapshot.css">
<script src="path/to/WebSnapshot/web-snapshot-viewer.js" defer></script>

<div class="web-snapshot" style="display:inline-block;width:150px;height:225px;line-height:0"
     data-src="path/to/WebSnapshot/previews/ryandebraal.b64.txt">
  <img alt="ryandebraal.com preview">
</div>
```

**Inline mode** — no network. Set `<img src>` to a data URI you've already
inlined into the page (e.g., from a sync-time marker block) and pass the
meta as JSON via `data-meta`.

```html
<div class="web-snapshot" style="display:inline-block;width:150px;height:225px;line-height:0"
     data-meta='{"mode":"handheld","outerWidth":165,"outerHeight":248,"innerWidth":150,"innerHeight":225,"restX":0,"restY":11.5}'>
  <img src="data:image/png;base64,…">
</div>
```

The CSS only defines behavior (position + overflow); the host controls
container size. Mark any container with class `.web-snapshot` and the
viewer animates the `<img>` inside it.

Per-element overrides via data-attributes:

| Attribute | Default | What it does |
|---|---|---|
| `data-src` | (none) | URL to a `.b64.txt`. If omitted, the `<img>` keeps whatever `src` you set. |
| `data-overflow` | `0.10` | Scale-mode oversize fraction. Ignored in handheld mode. |
| `data-amplitude` | `0.7` | Wobble strength. `0` = static, `1` = fills the entire excess. |
| `data-pan-focus` | `0.25` | Noise advance rate. Higher = faster drift. |
| `data-paused` | `false` | `"true"` mounts the element without starting the animation. |

Public API on `window.WebSnapshot`:

```js
WebSnapshot.attach(el, opts?);   // manual attach (auto-init handles this)
WebSnapshot.refresh(el);         // re-fetch the .b64.txt (cache-busted)
WebSnapshot.start(el);
WebSnapshot.stop(el);
WebSnapshot.autoInit(root?);     // re-scan for .web-snapshot under root
```

---

## Animation math

Ported from `GridGame2026/Assets/Scripts/Instances/Actor/ActorThumbnail.cs`.
Each `.web-snapshot` element runs its own loop with independent X/Y seeds so
multiple previews on the same page don't synchronize.

**Pan** — two 1D Perlin-style noise streams (`noise01(t + seedX)` and
`noise01(t + seedY)`) provide smooth `centeredNoise ∈ [-0.5, 0.5]` samples.
Each frame the image is translated by
`centeredNoise * 2 * halfExcess * amplitude`, then clamped to the available
excess. `halfExcess` is measured per render mode:
- Scale mode: `overflow * 0.5 * containerSize`.
- Handheld mode: `(outerSize - containerSize) / 2`, with a rest offset
  computed from the meta sidecar so the inner crop sits where the user
  asked it to.

**Pause cycle** — the noise time advances by `dt * panFocus * multiplier`.
The multiplier follows a random cycle (`nextPauseInterval ∈ [3, 7]s`, ramp
down/up over `[0.25, 0.75]s`, pause over `[2, 5]s`, then a new cycle).
That's the "human correction" feel — the camera drifts, stops, lingers,
then starts drifting again.

---

## Adding a recurring target

Edit `snapshots.config.js`:

```js
module.exports = [
  { name: 'ryandebraal', url: 'https://ryandebraal.com',
    width: 150, height: 225, align: 'center-top',
    viewport: { width: 1280, height: 1600 }, handheld: true },
  // add more here…
];
```

Run `npm run snapshot` to refresh all, or `npm run snapshot <name>` for one.

---

## Sync delivery

`sync/sync-mindattic-com.ps1` inlines `web-snapshot.css` and
`web-snapshot-viewer.js` into `mindattic.com/index.htm` between
`<!-- BEGIN/END MINDATTIC.COMPONENTS:WEBSNAPSHOT -->` markers. The `.b64.txt`
payloads are *not* synced — each subscriber manages its own per-tile inline
base64 (mindattic.com keeps them in a `PORTFOLIO_IMAGES` map and the
matching `PORTFOLIO_META` map, applied at render time).

On mindattic.com, the portfolio tile builder adds `.web-snapshot` +
`data-meta` to any tile whose name appears in `PORTFOLIO_META`, then calls
`WebSnapshot.autoInit()` after `tabifyPortfolio()` builds the DOM so the
viewer attaches to the freshly-created containers.

---

## Programmatic use

```js
const { webSnapshot } = require('./web-snapshot');

await webSnapshot({
  url: 'https://ryandebraal.com',
  width: 150, height: 225, align: 'top-center',
  handheld: true,
  outputPath: '/abs/path/to/ryandebraal.b64.txt',
});
```

`webSnapshot()` returns `{ outputPath, mode, clip, meta, mimeType, byteLength, dataUri }`.
The same data URI is also returned in the result, so callers don't have to
re-read the file.
