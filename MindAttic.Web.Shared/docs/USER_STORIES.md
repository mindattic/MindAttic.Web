---
codex: 1
project: MindAttic.UiUx
code: MAU
layer: stories
status: living
updated: 2026-10-03
---

# MindAttic.UiUx — User Stories
> ✅ done (shipped & tested) · 🟡 partial · ⬜ planned. Every ✅ cites the test.
>
> Tests live in `tests/` (Playwright; see [BIBLE §6](BIBLE.md#MAU-§6)). Capabilities that exist but are only
> manually verified are 🟡, with the command that demonstrates them noted as *evidence*.

## Epic A — Authoring & catalog
- **MAU-US-A1 🟡** As a component author, I can add a self-contained component under `Components/<Name>/`
  (source + `.json` config + `.md` doc) without touching any other component, so the catalog grows by
  addition. *Given a new folder, When I register it in `subscribers.json` `components`, Then it is
  shippable.* *(13 components present; no component-level test — manual.)*
- **MAU-US-A2 🟡** As an author, I can compose a Theme under `Themes/<Name>/` that references components
  via `deps.json`, so a property can adopt a whole look at once. *(Present: `Themes/Cyberspace/`; manual.)*
- **MAU-US-A3 🟡** As an author, I can regenerate SacredGeometry shape posters with
  `build-previews.mjs`, which doubles as a smoke test, so the 1024-shape catalog is self-checking.
  *(Script present; not run this session.)*

## Epic B — Distribution
- **MAU-US-B1 🟡** As a subscriber maintainer, I can enroll/unenroll a property in a component by editing
  one `subscriptions` line in `subscribers.json`, so enrollment is declarative
  ([MAU-LAW-1](BIBLE.md#MAU-LAW-1)). *Given a line added, When the next sync runs, Then the marker block
  appears/disappears.* *(Manual — no automated assertion in-repo.)*
- **MAU-US-B2 🟡** As a maintainer, I can run `sync/sync-all.ps1` locally and have only the
  `BEGIN/END MINDATTIC.UIUX` marker blocks change, idempotently, with retired subscribers reporting and
  exiting 0 ([MAU-LAW-2](BIBLE.md#MAU-LAW-2)). *(Evidence: `sync-mindattic-com.ps1` against a copy of
  `index.htm` is byte-identical; no automated test.)*
- **MAU-US-B3 ✅** As a site maintainer, I can load any package file from `cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@<Vn>/...` pinned to an immutable tag that every site shares ([MAU-LAW-6](BIBLE.md#MAU-LAW-6)). *(verified by `pins the expected UiUx tag`.)*
- **MAU-US-B4 🟡** As a maintainer, on push to `main` touching a spliced component, `subscribers.json`,
  `sync/**` or the workflow, the GitHub Action opens cross-repo PRs into `mindattic.com` and
  `MindAttic.Psst`. *(Workflow committed; not exercised this session.)*

## Epic C — Shared asset package
- **MAU-US-C1 ✅** As a site maintainer, I get every served asset listed in `assets-manifest.json` with its exact size and SHA-256, so a tag can be verified byte-for-byte ([MAU-LAW-7](BIBLE.md#MAU-LAW-7)). *(verified by `byte size and SHA-256 of every file match the manifest`.)*
- **MAU-US-C2 ✅** As a visitor, every font and image the sites load decodes cleanly, so no browser falls back silently. *(verified by `every raster asset decodes cleanly`.)*
- **MAU-US-C3 ✅** As a maintainer, files no site uses stay in `archive/` and are never served or linked. *(verified by `archive/ is kept out of the package`.)*
- **MAU-US-C4 ✅** As a visitor, each of the three sites loads with no failed requests or console errors and no horizontal scrollbar at any viewport. *(verified by `no horizontal scrollbar at common viewport sizes`.)*

## Epic D — Packaging
- **MAU-US-D1 ✅** As a consumer, I can run `build.ps1 -Build <Name> -Output standalone` to copy a component's (or, with `-Kind Theme`, a theme's) raw canonical files verbatim, so I can vendor without packaging. *(verified by `copies a component folder verbatim`.)*

## Priority backlog
1. Add an in-repo sync-idempotency check so Epic B stories can graduate to ✅ with a named test.
