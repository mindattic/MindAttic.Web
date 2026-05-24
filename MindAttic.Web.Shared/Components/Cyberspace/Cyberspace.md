# Cyberspace

The cyberpunk console-background suite. CSS + JS that turns any page into a
living terminal: console windows boot at the edges, glyph swarms drift in
formation, network tracers fork and acknowledge across the grid, Morse
pulsars blink in code, folder-rip heists exfiltrate files in real time, and
a parallax circuit-board hums behind everything under static scan-lines.

17 named effects, content-aware spawning that stays out of your layout,
zero build step. Drops into any page with three `<div>`s, one `<link>`, and
one `<script>`.

---

## Layout

```
Cyberspace/
├── frontpage.html   # DOM scaffolding — three fixed-position layer divs
├── frontpage.css    # CYBERSPACE rules, scan-lines, neon-flicker keyframes
├── console-bg.js    # the engine (17 effects, keepout system, parallax)
├── home-bg.js       # torn-edge portrait compositor — exposes window.homeBg
├── tv-static.js     # navigation-transition TV-static overlay
├── loader.js        # tiny global loader show/hide helpers
├── index.htm        # ad-hoc test harness — opens the whole bundle locally
└── assets/          # parallax textures (circuitboard.00..02.png, lossless)
```

---

## Mounting

In a page's `<body>` (after the rest of your content so z-index 0 sits behind
it):

```html
<link  rel="stylesheet" href="frontpage.css">

<div class="cyberspace-sl-fine"   aria-hidden="true"></div>
<div class="cyberspace-sl-coarse" aria-hidden="true"></div>
<div class="console-bg-host"      aria-hidden="true"></div>

<script src="loader.js"></script>
<script src="tv-static.js"></script>
<script src="home-bg.js"></script>
<script src="console-bg.js"></script>
```

Production hosts pull the same files from jsDelivr instead of inlining:

```html
<script src="https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@v1.0.0/Components/Cyberspace/console-bg.js"></script>
<link  rel="stylesheet" href="https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@v1.0.0/Components/Cyberspace/frontpage.css">
```

---

## Keepout zones

`console-bg.js` weights overlap with content rects 4× a normal window
overlap, so effects strongly prefer the margins around your layout.

Baked-in selectors (free, no setup):

- `.cyberspace-keepout` — opt-in marker; add to any container you want
  protected.
- `main` — both subscribers (`StreetSamurai`, `mindattic.com`) use `<main>` for
  page content.
- `.home-content` — StreetSamurai's Home wrapper.
- `.board-grid` — any tab/tile board.

Add more at runtime:

```js
window.__cyberspaceKeepoutSelectors = '.foo, .bar';
```

---

## Texture override

The parallax background tiles three `circuitboard.0X.png` images. Hosts can
swap them by setting (before `console-bg.js` evaluates):

```js
window.__cyberspaceCircuitboardSrcs = [
  'data:image/png;base64,…',  // or any URL
  'data:image/png;base64,…',
  'data:image/png;base64,…',
];
```

mindattic.com inlines them as base64. StreetSamurai serves them via
`/api/media/…`. The `assets/` folder here is the lossless source — re-pull
with `sync/bootstrap-textures.ps1` if upstream changes.

---

## Effect catalog

Canonical names + definitions live in the registry header of
`console-bg.js`. Toggles (`FX_*`) and spawn rates (`RATE_*`) are clustered
near the top of the file — flip any `FX_*` to `false` to kill that effect
entirely.

See the top-level [`../README.md`](../README.md) for the full effect table
(TERMINAL, CRASH, TREMOR, LEAK, SCHEMATIC, CASCADE, ARTIFACT — including its
7 behavior variants — FRAGMENT, TRACE, PULSAR, HEIST, PREDATOR).

---

## Editing

Edit files here. Push to `main` and the GitHub Action delivers to both
subscribers, or run `sync/sync-all.ps1` (or the `/sync` slash command) locally
for fast iteration without round-tripping through GitHub. Downstream copies
are derived artifacts — never edit them directly.
