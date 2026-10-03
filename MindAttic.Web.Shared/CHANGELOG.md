# Changelog

Whole-number release tags (`V1`, `V2`, …). A published tag is immutable ([MAU-LAW-6](docs/BIBLE.md#MAU-LAW-6));
jsDelivr serves any file at `https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@<tag>/<path>`.

## Next tag (V12, not yet published)
- **Hyperspace component** (`Components/Hyperspace/`): `hyperspace.js`, the standard library of the 100
  Hyperspace exhibits (stable ids, plaque metadata, geometry, pure projection for Three.js and 2D canvas),
  and `hyperspace-reader.js`, the Hyperspace Reader scanner window. The Hyperspace page pins this tag.
- Tests: new `components` project (`tests/specs/components/hyperspace.spec.mjs`).

## V10
- README rewritten as full documentation and project page.
- Docs, theme and component headers describe the three sites as the only CDN consumers (each repo's GitHub
  README is its project page; nothing renders project pages from UiUx components).

## V9
- Unused files moved out of the package into `archive/` (kept in the repo, same relative paths): font TTF
  sources, the MindAttic Interactive wordmark and transparent monogram, the 1024px M-Cares master, and
  ryandebraal.com's 32 Neko frames + link icon. The package now serves 60 files (was 99)
  ([MAU-LAW-7](docs/BIBLE.md#MAU-LAW-7)).
- Stray tool-markup lines removed from four docs.
- Tests: TTF sources are expected in `archive/fonts/<family>/`; new check that `archive/` is never in the
  manifest or linked from a site; cares spec follows the removal of the "Back to contents" links.

## V8
- Retired the Prose.Writer, Prose.Codex and Ideas subscribers (targets no longer exist); their sync scripts now
  report and exit 0, so `sync-all.ps1` is green again.
- `sync-subscribers.yml`: removed the dead Prose job, trimmed the paths filter to spliced components, full-history
  checkout for tag derivation.
- Cyberspace test harness (`Components/Cyberspace/index.htm`) no longer throws on load.
- Tests: tag expectation follows the latest tag; classic scrollbars; overflow checked in every view; 100vw guard;
  cares anchor routing; `PW_OUTPUT_DIR`; live CDN spec expands base-prefix URLs and checks the framed cares page.
- Docs brought in line with the tree (README, sync.md, PIPELINES.md, BIBLE, script headers).

## V7
- **Shared runtime asset package** ([MAU-LAW-7](docs/BIBLE.md#MAU-LAW-7), [docs/ASSETS.md](docs/ASSETS.md)):
  global web fonts in `fonts/`; per-site assets in `mindattic.com/`, `mindatticcares.com/`, `ryandebraal.com/`;
  generated `assets-manifest.json` (path, bytes, SHA-256, size) via `tools/build-asset-manifest.ps1`.
- Cyberspace parallax textures losslessly recompressed: 6.2 MB → 1.7 MB, pixel-identical.
- **Fix:** the Outfit *Latin* font embedded in `Components/OutfitFont/outfit-font.css` was corrupt (browsers
  silently fell back to a system font); replaced with the genuine Google Fonts file.
- `sync-mindattic-com.ps1`: `-CyberspaceCdnTag` defaults to the latest `V*` tag (`git describe`), CDN scripts
  `defer`red, texture preloads emitted.
- `subscribers.json`: `mindattic.com` is now enrolled in `Cyberspace` only (fonts load from the CDN).
- Removed obsolete one-shot scripts `sync/bootstrap-textures.ps1` and `sync/bootstrap-streetsamurai-appcss.ps1`.
- Added a Playwright test suite in `tests/`.
- Added the linked-deploy `/deploy` command (`.claude/commands/deploy.md`).

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
