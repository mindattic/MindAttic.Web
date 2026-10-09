# MindAttic.Web

The MindAttic web family in one repo: the shared asset package MindAttic.Web.Shared and the four static sites that load it from jsDelivr, deployed together by one tag.

[![HTML5](https://img.shields.io/badge/HTML5-hand--authored-e34f26)](mindattic.com/index.htm) [![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-f7df1e)](MindAttic.Web.Shared/Components) [![jsDelivr](https://img.shields.io/badge/CDN-jsDelivr-e84d3d)](#how-the-cdn-serves-the-shared-package) [![Tests](https://img.shields.io/badge/tests-Playwright-2ead33)](MindAttic.Web.Shared/tests/README.md) [![Status](https://img.shields.io/badge/status-live-2ea043)](https://mindattic.com)

![The mindattic.com home page: the MindAttic wordmark above three red-outlined buttons on the dark Cyberspace backdrop, all of it loaded from MindAttic.Web.Shared](mindattic.com/docs/images/home-cyberspace.png)

Try it: [mindattic.com](https://mindattic.com), [ryandebraal.com](https://ryandebraal.com), [mindatticcares.com](https://mindatticcares.com/), [mindattic.com/hyperspace](https://mindattic.com/hyperspace/)

## Why

- One change to a font, logo or effect reaches every site that uses it, with one release tag.
- Every page stays a single hand-authored HTML file with no build step; heavy assets are cached once on jsDelivr and shared.
- A published tag is immutable, so what a site loads today is exactly what it loads tomorrow.
- A deploy cannot ship a page that points at an asset the CDN does not serve: it checks every file, byte for byte, before any upload.
- The package and its consumers live side by side, so one commit and one test run cover a change end to end.

## Features

| Member | What it is | Live |
|---|---|---|
| [MindAttic.Web.Shared](MindAttic.Web.Shared/README.md) | The shared asset package: the Cyberspace console-background engine, SacredGeometry line art, the Hyperspace shape library and Hyperspace Reader, Outfit and Attic fonts, UI widgets, each site's logos and art | served by jsDelivr |
| [mindattic.com](mindattic.com/README.md) | Ryan DeBraal's front door: the MindAttic wordmark, three links and a tap-to-play Cyberspace backdrop | [mindattic.com](https://mindattic.com) |
| [ryandebraal.com](ryandebraal.com/README.md) | A resume that is its own work sample: 16 animated themes, 3 profiles, Markdown, HTML and PDF export | [ryandebraal.com](https://ryandebraal.com) |
| [mindatticcares.com](mindatticcares.com/README.md) | MindAttic Cares, the charity arm: open fundraising-event playbooks | [mindatticcares.com](https://mindatticcares.com/) |
| [Hyperspace](Hyperspace/README.md) | A field guide to five-dimensional objects: hypercube explorers and a 3D gallery of 159 exhibits | [mindattic.com/hyperspace](https://mindattic.com/hyperspace/) |

## Quick start

Prerequisites: Git, PowerShell, Node.js and Google Chrome (for the tests).

```powershell
git clone https://github.com/mindattic/MindAttic.Web.git
cd MindAttic.Web
start mindattic.com\index.htm          # any site opens straight from disk
cd MindAttic.Web.Shared\tests
npm ci
npm run test:local                     # package + all sites, CDN answered from this working tree
```

You should see the page with its backdrop and fonts, and the test run end with every test passed.

## Project layout

```text
MindAttic.Web/
  README.md  AGENTS.md  CLAUDE.md  .gitignore
  .github/workflows/sync-subscribers.yml   splices Shared components into marker blocks
  MindAttic.Web.Shared/                    the jsDelivr asset package (Components/, Themes/, fonts/,
                                           <domain>/ asset folders, sync/, tests/, tools/, docs/)
  mindattic.com/                           index.htm, idiotproof/ legal pages and dataset, docs/
  ryandebraal.com/                         index.htm, docs/
  mindatticcares.com/                      index.htm, docs/
  Hyperspace/                              index.htm, docs/
```

Each member keeps its own README, docs and tools. Paths between members are relative siblings, so
`MindAttic.Web.Shared/sync` finds `../mindattic.com/index.htm` and the Hyperspace page falls back to
`../MindAttic.Web.Shared/Components/Hyperspace/hyperspace.js` when opened from disk. Repos outside this
one (MindAttic.Psst, Tutor, MindAttic.Deploy) sit next to it at `../<Repo>`.

## How the CDN serves the shared package

jsDelivr serves any file of this public repo at a tag. The sites load only the `MindAttic.Web.Shared` folder:

```text
https://cdn.jsdelivr.net/gh/mindattic/MindAttic.Web@V<n>/MindAttic.Web.Shared/<path>
```

- Tags are whole numbers (`V12`, `V13`, ...), never SemVer, and never moved once published.
- Every site pins the same tag. The linked deploy writes it; nobody edits pins by hand.
- Fonts, logos, theme art, the Cyberspace engine and the Hyperspace library load from that URL. Only
  mindattic.com's small `MINDATTIC.UIUX:CYBERSPACE` block is spliced into its page, by
  `MindAttic.Web.Shared/sync/sync-mindattic-com.ps1`.
- `MindAttic.Web.Shared/assets-manifest.json` lists every asset with its size and SHA-256; the deploy and
  the tests check the CDN against it.

Details: [MindAttic.Web.Shared/docs/PIPELINES.md](MindAttic.Web.Shared/docs/PIPELINES.md) and
[MindAttic.Web.Shared/docs/ASSETS.md](MindAttic.Web.Shared/docs/ASSETS.md).

## Deployment

[MindAttic.Deploy](https://github.com/mindattic/MindAttic.Deploy) owns deployment. Its linked group
`mindattic-web` is this repo: deploying any site deploys all of them.

```powershell
cd ..\MindAttic.Deploy
npm run deploy -- --uiux --dry-run     # preview: changes nothing
npm run deploy -- --uiux               # or: --site mindattic.com (any member deploys the group)
```

A linked deploy:

1. Preflight: this repo is clean, on `main`, not behind origin, and the asset manifest is current.
2. Computes the next tag (`V12` is the first on this repo).
3. Rewrites the pins in the four site pages to that tag, runs the preDeploy hooks (the mindattic.com
   Cyberspace splice) and stamps each page's Last Updated line.
4. Commits those changes as "Pin MindAttic.Web.Shared V<n>".
5. Tags that commit.
6. Pushes `main` and the tag.
7. CDN gate: every asset the sites use must be live at that tag, byte-exact.
8. Uploads by FTPS in order: ryandebraal.com, mindatticcares.com, Hyperspace, mindattic.com.

If `HEAD` already carries the latest tag and the pins match it, that tag is reused. `--no-link` deploys
one site alone.

## Testing

The Playwright suite in [MindAttic.Web.Shared/tests](MindAttic.Web.Shared/tests/README.md) covers the
package and the sites: assets complete and well-formed, every page loads with no failed request, pins one
tag, stays inside its allowed hosts and keeps its layout; the Hyperspace library, the Hyperspace Reader and
the Hyperspace page. `npm run test:local` needs no network; `npm run test:live` checks the real sites and
the real CDN. Each member with Codex docs also runs `tools\codex.ps1 doctor`.

## Documentation

- [MindAttic.Web.Shared](MindAttic.Web.Shared/README.md): [BIBLE](MindAttic.Web.Shared/docs/BIBLE.md), [user stories](MindAttic.Web.Shared/docs/USER_STORIES.md), [assets](MindAttic.Web.Shared/docs/ASSETS.md), [pipelines](MindAttic.Web.Shared/docs/PIPELINES.md), [sync](MindAttic.Web.Shared/sync/sync.md)
- [mindattic.com](mindattic.com/README.md): [BIBLE](mindattic.com/docs/BIBLE.md), [user stories](mindattic.com/docs/USER_STORIES.md)
- [ryandebraal.com](ryandebraal.com/README.md): [BIBLE](ryandebraal.com/docs/BIBLE.md), [user stories](ryandebraal.com/docs/USER_STORIES.md)
- [mindatticcares.com](mindatticcares.com/README.md): [BIBLE](mindatticcares.com/docs/BIBLE.md), [user stories](mindatticcares.com/docs/USER_STORIES.md)
- [Hyperspace](Hyperspace/README.md)
- Agent instructions: [AGENTS.md](AGENTS.md)

## License

This repo has no LICENSE file. All rights reserved. MindAttic.Web.Shared bundles the Outfit typeface from Google Fonts.

Part of [MindAttic](https://mindattic.com) — see more projects at [github.com/mindattic](https://github.com/mindattic). Related: [MindAttic.Deploy](https://github.com/mindattic/MindAttic.Deploy), [MindAttic.Psst](https://github.com/mindattic/MindAttic.Psst).
