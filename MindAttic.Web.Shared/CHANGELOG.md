# Changelog

Whole-number release tags (`V1`, `V2`, …). A published tag is immutable ([MAU-LAW-6](docs/BIBLE.md#MAU-LAW-6));
jsDelivr serves any file at `https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@<tag>/<path>`.

## V7
- **Shared runtime asset package** ([MAU-A4](docs/AMENDMENTS.md#MAU-A4), [docs/ASSETS.md](docs/ASSETS.md)):
  global web fonts in `fonts/`; per-site assets in `mindattic.com/`, `mindatticcares.com/`, `ryandebraal.com/`;
  generated `assets-manifest.json` (path, bytes, SHA-256, size) via `tools/build-asset-manifest.ps1`.
- Cyberspace parallax textures losslessly recompressed: 6.2 MB → 1.7 MB, pixel-identical.
- **Fix:** the Outfit *Latin* font embedded in `Components/OutfitFont/outfit-font.css` was corrupt (browsers
  silently fell back to a system font); replaced with the genuine Google Fonts file.
- `sync-mindattic-com.ps1`: default `-CyberspaceCdnTag V7`, CDN scripts `defer`red, texture preloads emitted.
- `subscribers.json`: `mindattic.com` is now enrolled in `Cyberspace` only (fonts load from the CDN).
- Removed obsolete one-shot scripts `sync/bootstrap-textures.ps1` and `sync/bootstrap-streetsamurai-appcss.ps1`.
- Added a Playwright test suite in `tests/`.

## V6
- Cyberspace: host switches (`window.__cyberspaceFx`), keepout and comment updates; `console-bg.js` refresh.

## V5
- UserLogin / UserCircle / UserTimeout auth components; Ideas and Tutor subscribed.

## V4
- SacredGeometry harmonographs removed (still exactly 1024 shapes); whole-number version scheme.

## V3
- SacredGeometry component (1024 shapes); Cyberspace SCHEMATIC and `sacred-geometry.js` externalised to jsDelivr.

## V2
- Cyberspace `console-bg.js` and circuitboard textures via jsDelivr; component and sync fixes.

## V1
- Initial release (Cyberspace console-background bundle).
