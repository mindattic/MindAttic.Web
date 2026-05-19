# MindAttic.Shared

Shared front-end assets used across MindAttic web properties.

Currently ships the **CBG (Console Background) cyberpunk effects** — the animated console windows, scan-line overlays, artifact glyph swarms, error popups, network tracers, Morse pulsars, folder-rip heists, and friends that paint the StreetSamurai home page background and now mindattic.com.

## Layout

```
frontpage/
├── frontpage.html      # DOM scaffolding (3 fixed-position layer divs)
├── frontpage.css       # all CBG rules + scan-lines + neon flicker keyframes
├── console-bg.js       # the animation engine (17 effects)
├── home-bg.js          # torn-edge portrait compositor
├── scan-glitch.js      # ambient drifting unicode-glyph spawner
├── tv-static.js        # navigation-transition TV-static overlay
└── loader.js           # tiny global loader show/hide helper

sync/
├── sync-mindattic-com.ps1   # inlines the bundle into mindattic.com/index.htm
└── sync-streetsamurai.ps1   # overwrites StreetSamurai wwwroot copies
```

## Consumers

| Site | Mechanism | Trigger |
|---|---|---|
| `mindattic.com` | Marker block in `index.htm`, all assets inlined as `<style>` + `<script>` | `deploy.ps1` runs sync first |
| `StreetSamurai` | Files copied into `wwwroot/js/` + marker block in `wwwroot/app.css` | manual `sync-streetsamurai.ps1` (or pre-build hook) |

The "no NuGet" rule applies: this is raw source distribution by file copy.
A NuGet/npm package may follow later.

## Editing the effects

Edit files in `frontpage/` here. Then in each consumer repo, run the sync
script. Both consumers should produce **byte-identical** rendered output for
the effect bundle.

```powershell
# from mindattic.com
powershell -File ../MindAttic.Shared/sync/sync-mindattic-com.ps1

# from StreetSamurai
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

The full list of named effects (see `console-bg.js` header for canonical
definitions):

**Tick-driven (`console-bg.js`):** CRASH, TREMOR, LEAK, SCHEMATIC, CASCADE,
ARTIFACT, FRAGMENT, TRACE, PULSAR, HEIST, PREDATOR, TERMINAL.

**Standalone:** torn-edge portrait composite (`home-bg.js`), drifting glyph
boxes (`scan-glitch.js`), navigation TV static (`tv-static.js`), tiny global
loader (`loader.js`), plus the static scan-line overlays in CSS.
