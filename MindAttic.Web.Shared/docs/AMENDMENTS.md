---
codex: 1
project: MindAttic.UiUx
code: MAU
layer: amendments
status: living
updated: 2026-06-07
---

# MindAttic.UiUx — Amendments (append-only; amendment wins over the bible)

> Append-only change log. Never rewrite an amendment; supersede it with a new one. Beyond ~25, fold into
> [BIBLE](BIBLE.md) and start a new epoch (note the git tag). History stays in git.

## MAU-A1 — Adopt the Codex documentation standard (supersedes —)
Installed the MindAttic Codex canonical-documentation layout in this repo: `docs/BIBLE.md` (L0),
`docs/AMENDMENTS.md` (L1), `docs/USER_STORIES.md` (L2), `docs/rfc/` (design notes), `docs/data/` (L5
canon-as-data), the generated `docs/BIBLE.digest.md`, `tools/codex.ps1` (doctor + digest), and the
`.claude/` SessionStart digest-injection hook. The BIBLE §5 Laws **inherit**
[`MindAttic.HouseRules.md`](../MindAttic.HouseRules.md) by reference and add the project-specific laws
MAU-LAW-1..6. No application/source code was changed. *Migration:* none required — there were no
pre-existing canon docs (`docs/`, `ARCHITECTURE.md`, etc.) to fold in; all content was authored fresh
from the repo's `README.md`, `CLAUDE.md`, and the actual `Components/`, `Themes/`, `sync/`, and `Ideas/`
trees.

## MAU-A2 — Record the broken `.idea` plugin build as verified state (supersedes —)
Captured the real, currently-failing `.idea` build in [BIBLE §6](BIBLE.md#MAU-§6) rather than asserting
"done". Verified 2026-06-07 against the sibling SDK at `../MindAttic.Ideas`: `Plugin.*` (6 projects) fail
with `CS0246: 'PluginBase' could not be found` (its `Bases.cs` has `ThemeBase`/`ControlBase`/`IdeaBase`
only); `Theme.Cyberspace` fails with `CS0117: 'ContentKind' does not contain a definition for 'Plugin'`;
`Control.Textbox` builds clean (`ControlBase`). The Abstractions API was refactored around the "Plugin"
concept (both base class and `ContentKind` enum). Tracked for resolution in
[RFC 0001](rfc/0001-pluginbase-sdk-drift.md). *No fix applied* (Codex install does not modify
application/source code).

## MAU-A3 — Six new components landed; `Ideas/` packaging subtree removed (supersedes MAU-A2 §build, §frontier) {#MAU-A3}
Full-sync 2026-06-07 against the actual repo tree revealed two material changes not yet captured in canon:

**New components (6).** The following component folders exist on disk and are now registered in
`docs/data/components.json` and referenced in [BIBLE §4.1](BIBLE.md#MAU-§4) and
[BIBLE §6](BIBLE.md#MAU-§6): `PageScrollbar` (css-js-razor overlay scrollbar), `Textbox` (css-only
Material-style outlined field), `Tooltip` (css-js-razor accessible tooltip), `UserLogin` (css-js-razor
login-form styling wrapper), `UserCircle` (css-js-razor authenticated avatar/menu), `UserTimeout`
(css-js-razor idle-timeout warning). Total catalog: 13 components. The auth-visual trio (UserLogin,
UserCircle, UserTimeout) is now authored and wired into `subscribers.json` for Prose, Ideas,
and Tutor subscribers — previous docs called them "not yet authored / intentional no-op". The component
schema (`docs/data/_schema/component.schema.json`) was extended with two new `type` values: `css-js-razor`
(CSS + JS + optional Razor wrapper) and `css-only`.

**`Ideas/` subtree removed.** The `Ideas/` directory (containing `MindAttic.Ideas.{Plugin|Theme|Control}.*`
RCL csproj files) is **absent** from the repo. All BIBLE references to the `Ideas/` tree, `idea.assets.json`,
`ma-idea`, `PluginBase`, and the `build.ps1 -Output idea` path have been updated to reflect removal.
Epic C stories MAU-US-C1 and MAU-US-C3 are downgraded from ⬜ to 🗑️. MAU-LAW-5 is reworded to govern
any future reinstatement. [RFC 0001](rfc/0001-pluginbase-sdk-drift.md) (PluginBase SDK drift) is
superseded by the removal and kept for historical reference only. *No fix applied to application code
(Codex sync-only).*
</content>

## MAU-A4 — UiUx is also the shared runtime asset package; assets are organised by domain (supersedes — ; refines MAU-LAW-5) {#MAU-A4}
Decision (user, 2026-10-02): the three MindAttic sites (`mindattic.com`, `ryandebraal.com`,
`mindatticcares.com`) no longer embed binary assets (base64 fonts, images, textures) in their HTML.
Every such asset is a plain static file in **this** repo and is loaded at runtime over jsDelivr from a
tag-pinned URL, so all sites share one cached, versioned asset backend.

- **Layout.** A top-level folder per domain holding category folders directly
  (`mindattic.com/`, `mindatticcares.com/`, `ryandebraal.com/`), and inside that
  category folders named for what the files are (`logos/`, `icons/`, `images/`, `themes/<name>/`).
  Web fonts used by more than one site live in a top-level `fonts/` folder (`fonts/outfit/`,
  `fonts/attic/`); component-owned runtime files stay with their component
  (`Components/Cyberspace/assets/` textures). Details and quality rules (lossy formats keep full
  resolution, lossless recompression only if pixel-identical, fonts validated) are in
  [ASSETS.md](ASSETS.md).
- **Manifest.** `assets-manifest.json` (generated by `tools/build-asset-manifest.ps1`) lists every served
  asset with its size and SHA-256 so a published tag can be verified byte-for-byte.
- **Fix found while migrating.** The base64 Outfit *Latin* font that `Components/OutfitFont/outfit-font.css`
  carried was corrupt (the browser silently fell back to a system font). It was replaced with the genuine
  Google Fonts file; the extracted, validated woff2 files now live under `fonts/`.
- **Sync change.** `subscribers.json` no longer enrolls `mindattic.com` in `OutfitFont`, `AtticFont`,
  `PinFooter` or `WebSnapshot` (the page now loads the fonts from the CDN and has no footer-pin or
  snapshot UI); it stays enrolled in `Cyberspace`. `sync/sync-mindattic-com.ps1` now emits the two
  CDN scripts with `defer`, preloads the three parallax textures at low priority, and defaults
  `-CyberspaceCdnTag` to `V7`.
- **Release.** Tag `V7` is the first tag that contains the `fonts/`, `mindattic.com/`, `mindatticcares.com/`
  and `ryandebraal.com/` asset trees and the losslessly recompressed Cyberspace textures.

*Migration:* sites replace embedded data URIs with `https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@V7/<path>`.
No existing `V1`–`V6` URL changes (MAU-LAW-6).
