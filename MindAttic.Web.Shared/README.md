# MindAttic.Shared

**Cyberpunk in a `<script>` tag.** Drop-in CSS+JS that turns any web page into a living terminal — console windows boot at the edges, artifact glyph swarms drift in formation, network tracers fork and ack across the grid, Morse pulsars blink in code, folder-rip heists exfiltrate files in real time, and a parallax circuit-board hums behind it all under static scan-lines. 17 named effects, content-aware spawning that stays out of your layout, zero build step.

Shared front-end assets for MindAttic web properties. Currently ships the **CBG (Console Background) cyberpunk effects** suite — powering the StreetSamurai home page background and now mindattic.com.

## Layout

```
cbg/
├── frontpage.html      # DOM scaffolding (3 fixed-position layer divs)
├── frontpage.css       # all CBG rules + scan-lines + neon flicker keyframes
├── console-bg.js       # the animation engine (17 effects)
├── home-bg.js          # torn-edge portrait compositor
├── tv-static.js        # navigation-transition TV-static overlay
├── pin-footer.js       # pin-when-short footer helper
├── loader.js           # tiny global loader show/hide helper
└── assets/             # parallax textures (circuitboard.00..02.png)

sync/
├── sync-all.ps1             # umbrella runner: invokes every sync-*.ps1
├── sync-mindattic-com.ps1   # inlines the bundle into mindattic.com/index.htm
├── sync-streetsamurai.ps1   # overwrites StreetSamurai wwwroot copies
└── bootstrap-textures.ps1   # one-shot: refresh cbg/assets/ from StreetSamurai source
```

## Consumers

| Site | Mechanism | Trigger |
|---|---|---|
| `mindattic.com` | Marker block in `index.htm`, all assets inlined as `<style>` + `<script>` | `deploy.ps1` runs sync first |
| `StreetSamurai` | Files copied into `wwwroot/js/` + marker block in `wwwroot/app.css` | manual `sync-streetsamurai.ps1` (or pre-build hook) |

The "no NuGet" rule applies: this is raw source distribution by file copy.
A NuGet/npm package may follow later.

## Editing the effects

Edit files in `cbg/` here. Then run `sync/sync-all.ps1` (or `/sync`) to push to
all consumers. Both consumers should produce **byte-identical** rendered output
for the effect bundle.

```powershell
# from MindAttic.Shared — push to all consumers in one shot
powershell -File sync/sync-all.ps1

# or invoke an individual target from the consumer side
powershell -File ../MindAttic.Shared/sync/sync-mindattic-com.ps1
powershell -File ../MindAttic.Shared/sync/sync-streetsamurai.ps1
```

## Keepout zones (shared)

`console-bg.js` ships a keepout system that prevents effects from spawning
behind your page content. The placer (`bestPos` / `safePos`) weights overlap
with these rects 4× a normal window overlap, so it strongly prefers spawning
in the margins around them.

Baked-in selectors — any host gets these for free:

- `.cbg-keepout` — opt-in marker. Add this class to any container you want
  protected.
- `main` — the top-level page-content element. Both StreetSamurai and
  mindattic.com use `<main>` for their content area.
- `.home-content` — StreetSamurai's Home-page wrapper.
- `.board-grid` — any tab/tile board.

Hosts can extend the list at runtime by setting
`window.__cbgKeepoutSelectors` to a CSS selector string (comma-separated)
before `console-bg.js` evaluates the keepout for a given placement.

## Effect catalog

Canonical names + definitions live in the registry header of
`console-bg.js`. Toggles (`FX_*`) and spawn rates (`RATE_*`) are around
`console-bg.js:6132–6182` — flip any `FX_*` to `false` to kill that effect
entirely.

### Top-level effects (tick-loop dispatch)

| Name        | Spawn fn                  | Toggle / Rate              | What it does |
|-------------|---------------------------|----------------------------|--------------|
| **TERMINAL**| `spawnWindow`             | `FX_WIN` / remainder       | Generic console window (the workhorse — most of what you see) |
| **CRASH**   | `spawnError`              | `FX_ERROR` / 1%            | Fatal-error popup |
| **TREMOR**  | `spawnWarning`            | `FX_WARN` / 1%             | Warning popup |
| **LEAK**    | `spawnMemo`               | `FX_MEMO` / 4%             | Leaked corporate memo, character-by-character erase |
| **SCHEMATIC**| `spawnGeoWindow`         | `FX_GEO` / 10%             | Geometric schematic window (polyhedra + element-report text) |
| **CASCADE** | `spawnCascade`            | `FX_CASCADE` / 3%          | Burst of 3–6 cascaded console windows (uses `cbg-cascade` class) |
| **ARTIFACT**| `spawnArtifact`           | `FX_ARTIFACT` / 12%        | Floating glyph cluster — see variants below |
| **FRAGMENT**| `spawnFrag`               | `FX_FRAG` / 40%            | Floating code fragments (most frequent effect) |
| **TRACE**   | `spawnNetConnect`         | `FX_NET` / 8%              | Tron-cycle network wire route — see sub-behaviors |
| **PULSAR**  | `spawnMorseDot`           | `FX_MORSE` / 5%            | Morse-code glowing dot — see modes |
| **HEIST**   | `spawnFolderRip`          | `FX_FOLDER` / 4%           | Folder-rip file-extraction sequence — see phases |
| **PREDATOR**| `spawnArtifactPredator`   | `FX_PREDATOR` / 1.2%       | Rare artifact-hunting swarm — see sub-behaviors |

### ARTIFACT — 7 behavior variants (rolled per spawn)

| Variant       | Behavior |
|---------------|----------|
| **SCATTER**   | Random blob; all glyphs drift one direction (original) |
| **LATTICE**   | Fibonacci grid; whole lattice drifts with corner-wave delay |
| **ANCHOR**    | Stationary grid; glitches in place; leading edge emits feelers |
| **SLUG**      | Single grid crawls + per-cell undulation |
| **CENTIPEDE** | Multi-segment chain; peristaltic wave + leader feelers |
| **PULSE**     | Concentric Fibonacci rings; lub-dub heartbeat radiating outward |
| **WANDERER**  | Small grid walks the screen, pauses to "look around" |

### PULSAR — 2 modes

| Mode      | Share | Behavior |
|-----------|-------|----------|
| **BLINK** | ~90%  | Classic on/off pulse |
| **SHIFT** | ~10%  | Slides cardinal directions, color-swaps each symbol |

### TRACE — 3 sub-behaviors that can fire mid-route

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

### Standalone (non-CBG) bundled effects

| File             | What it does |
|------------------|--------------|
| `loader.js`      | Small load-state helpers (tiny globals consumed by `console-bg.js`) |
| `tv-static.js`   | TV-static fade overlay during page transitions |
| `home-bg.js`     | Torn-edge portrait compositor — exposes `window.homeBg`, idle unless invoked |
| `console-bg.js` parallax | Slow-scrolling circuit-board texture layer. Hosts can override the source list via `window.__cbgCircuitboardSrcs` — mindattic.com inlines them as base64; StreetSamurai serves them via `/api/media/...`. |
| Scan-line CSS    | Static scan-line overlay defined in `cbg/frontpage.css` (no JS). |
