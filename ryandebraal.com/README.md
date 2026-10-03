# ryandebraal.com

**A resume site as an engineering statement.** One hand-authored page. No build step. No framework. No npm install. No tracking. Static assets from a pinned CDN. Just a developer who prefers working close to the platform.

[ryandebraal.com](https://ryandebraal.com)

---

## Table of contents

- [What it is](#what-it-is)
- [Why it exists](#why-it-exists)
- [Features](#features)
- [Content model — the `D` object](#content-model--the-d-object)
- [Themes and profiles](#themes-and-profiles)
- [File anatomy of `index.htm`](#file-anatomy-of-indexhtm)
- [What's *not* in this repo](#whats-not-in-this-repo)
- [Stack](#stack)
- [Directory layout](#directory-layout)
- [Assets and CDN](#assets-and-cdn)
- [Local development](#local-development)
- [Documentation (Codex canon)](#documentation-codex-canon)
- [Tooling — `tools/`](#tooling--tools)
- [Deploy](#deploy)
- [Claude Code project setup](#claude-code-project-setup)

---

## What it is

A single, hand-authored `index.htm` — pure HTML, CSS, and JavaScript — that renders a fully interactive, themeable, animated resume in any modern browser. Open the Network tab: you will see the page itself plus its fonts, images and theme art from `cdn.jsdelivr.net` (and, only when you export a PDF, html2pdf.js) — nothing else, and no analytics.

That's the whole product. There is no server, no API, no database, and no build output — the file you edit is byte-for-byte the file the browser runs.

## Why it exists

Modern web stacks make it easy to ship 30 MB of bundled JavaScript to render a paragraph of text. This project is the deliberate opposite — a demonstration that a polished, production-quality experience can be built without inheriting any of that complexity. Every line of logic, every animation frame, every export pipeline lives in the same file you can read end-to-end in an afternoon.

It's a resume that **is** the work sample.

## Features

- **16 themes** — Light, Dark, Spring, Summer, Autumn, Winter, Matrix, Neko, Ocean, Sunset, Forest, Cyberpunk, Noir, Sakura, Sand, Synthwave. Theme switching is CSS variables only; no JavaScript style mutations.
- **3 rendering profiles** — Classic, Pitch, and Complete views of the same underlying resume data, swapped with one click.
- **Custom canvas animations per theme** — Bees with a flower-claiming state machine, snow that accumulates into SVG drifts, ten roaming Neko cats with the full 1998 sprite state machine (all 32 frames kept inline as tiny base64 CSS classes), sandstorm physics, parallax forest silhouettes, perspective synthwave grids, neon-acid-rain cyberpunk skylines, and more. Written from scratch — no animation libraries. (`light`, `dark`, and `noir` are static CSS-only themes with no bespoke FX.)
- **~200 tech tooltips** — Hover any technology in the skills or experience sections for context.
- **Markdown, HTML, and PDF export** — Download the resume in any format from the toolbar.
- **The Outfit typeface, from the CDN** — Weights 100–900 as two woff2 subsets (latin + latin-ext) hosted in MindAttic.UiUx and served by jsDelivr at a pinned tag; the latin file is preloaded. No Google Fonts request.
- **Preferences persist** — Theme, profile, font choice, and per-skill familiarity survive page reloads via `localStorage`.
- **Mobile-first toolbar** — Adapts cleanly between desktop and portrait orientations.

## Content model — the `D` object

All resume content lives once, as a single in-file JavaScript object literal named `D` (`index.htm`, near line 1528). Every profile and export format is a read-only projection of this one object — there is never a second copy of the content. Its keys:

| Key | What it holds |
| --- | --- |
| `summary`, `pitchSummary` | Prose blurbs (full vs. pitch tone) |
| `skillsCore`, `skillsComplete` | Grouped skill lists (label + `items[]`) |
| `experience[]` | `{ title, company, location, dates, tech[], bullets[] }` |
| `projects[]` | `{ name, desc }` — the MindAttic portfolio (Tutor, IdiotProof, ThinkTank, MindAttic.Legion, TaxRateCollector, FractionsOfAPenny, GridGame2026, StreetSamurai, Ciao-ChatGpt-Bonjour-Claude, mindattic.com) |
| `education[]` | Degrees |
| `patents[]` | US patents |
| `corporate[]` | Registered entities |

A sibling object, `tooltips` (`index.htm`, near line 913), maps ~200 technology names to hover-context descriptions, powering the tech tooltips feature.

## Themes and profiles

- **Themes (16)** — `light`, `dark`, `spring`, `summer`, `autumn`, `winter`, `matrix`, `neko`, `ocean`, `sunset`, `forest`, `cyberpunk`, `noir`, `sakura`, `sand`, `synthwave`. Selected via the `[data-theme]` attribute on `<html>`; every theme is a block of CSS custom properties, never a JavaScript style mutation ([RDC-LAW-4](docs/BIBLE.md#RDC-LAW-4)).
- **Profiles (3)** — `classic`, `pitch`, `complete`. Selected via `[data-profile]` on `<body>`; `render()` reprojects the same `D` object for the chosen audience ([RDC-LAW-5](docs/BIBLE.md#RDC-LAW-5)).
- Preferences persist in `localStorage` under the keys `resume-settings` (all Settings-panel values, including theme timeout and transition), `resume-theme`, `tag-familiarity`, `neko-color` and `fx-quality-level` (the adaptive FX quality step). Theme-rotation pause is per visit and is not persisted.

## File anatomy of `index.htm`

`index.htm` is a single hand-authored page (~7,000 lines, ~0.45 MB on disk). Fonts, the portrait, the theme backgrounds and the PDF library are no longer embedded; they load from jsDelivr ([RDC-A3](docs/AMENDMENTS.md#RDC-A3)), which is why it dropped from ~5.3 MB. Structurally:

```
index.htm  (one page)
├── <!-- Last Updated: <UTC> -->     stamped by the deploy pipeline (MindAttic.Deploy)
├── <head>
│   ├── DevTools easter-egg banner (ASCII, shown via console.log)
│   └── <style>
│       ├── CSS custom properties per [data-theme]
│       ├── layout + toolbar rules
│       └── @font-face Outfit (CDN woff2, weights 100-900) + Neko 32 inline frames
├── <body data-theme=… data-profile=…>
│   ├── resume DOM mount + toolbar
│   ├── per-theme <canvas> FX layers
│   └── <script>                      one IIFE-scoped global block
│       ├── § DATA        const D = {…}              (the resume content — see above)
│       ├── § TOOLTIPS    const tooltips = {…}        (~200 tech entries)
│       ├── § RENDER      secHTML / expHTML / projHTML / eduHTML / patHTML / corpHTML /
│       │                 skillsHTML / tag / buildTooltip / render()  — pure string builders
│       ├── § STATE       setTheme / setProfile / cycleTheme / pickTheme / cycleProfile /
│       │                 filterSkills / cycleTagLevel / saveSkillFam / resetDefaults /
│       │                 startThemeRotation / stopThemeRotation / toggleThemeRotation
│       ├── § FX ENGINE   one start<Theme>() Canvas 2D initializer per animated theme,
│       │                 driven by requestAnimationFrame; resizeCanvas / stopFX manage lifecycle
│       └── § EXPORT      exportMD() · exportHTML() · runPdfExport(opts) with named wrappers
│                         exportPDF() / exportPrintPage() / exportPrintDocument() /
│                         exportPrintCV() · printResume() · toggleExportMenu / toggleMoreMenu
```

This mirrors [docs/BIBLE.md §4](docs/BIBLE.md#RDC-§4), which is the canonical version of this diagram — update that file first if the architecture changes, then this section.

## What's *not* in this repo

No `node_modules`. No `package.json`. No `webpack.config.js`. No `tsconfig.json`. No `.eslintrc`. No CI matrix. No Tailwind. No React. No Vite. No analytics SDK. No tracking pixels. No service worker. No polyfills. No minifier. No transpiler. No third-party fonts. Assets come only from the pinned jsDelivr paths allowed by [RDC-A3](docs/AMENDMENTS.md#RDC-A3). No test suite, no compiler, no build command — see [docs/BIBLE.md §3 / §6](docs/BIBLE.md#RDC-§3).

The retired per-project `deploy.ps1`/`deploy.bat`/`settings.json` must not be reintroduced — deploy is centralized in the sibling MindAttic.Deploy repo ([RDC-LAW-6](docs/BIBLE.md#RDC-LAW-6)).

## Stack

`HTML5` · `CSS3` (custom properties, `color-mix`, `@media (orientation)`) · `Vanilla JavaScript` (ES2020+, IIFE-scoped, no modules) · `Canvas 2D` · `SVG`

## Directory layout

```
ryandebraal.com/
├── index.htm              The entire hand-authored page (assets are hosted in MindAttic.UiUx)
├── README.md               This file
├── CLAUDE.md               Claude Code project rules (Codex pointer, code style, /commit, /revert)
├── .gitignore
├── docs/                   Codex canonical documentation (see below)
│   ├── BIBLE.md            L0 — what the site IS / is NOT, architecture, the Laws (RDC-LAW-n)
│   ├── AMENDMENTS.md        L1 — append-only change log (RDC-A<n>); an amendment wins over the bible
│   ├── USER_STORIES.md      L2 — capabilities + status (RDC-US-<Epic><n>)
│   ├── BIBLE.digest.md      GENERATED by tools/codex.ps1 digest — never hand-edit
│   └── rfc/
│       └── 0001-in-browser-smoke-harness.md   Design note: path to a dependency-free test harness
├── tools/
│   ├── codex.ps1            Codex doctor + digest tool (validates/regenerates docs/ canon)
│   └── build-readme.ps1      Regenerates README.htm from this file (thin wrapper — see below)
└── .claude/                 Claude Code project config
    ├── settings.json / settings.local.json
    ├── launch.json
    ├── statusline.ps1
    ├── commands/            checkpoint.md, commit.md, deploy.md
    ├── hooks/               inject-digest.ps1, restore-handoff.ps1
    └── skills/              commit/, deploy/, discard/, revert/, run/  (each a SKILL.md)
```

## Assets and CDN

Static assets live in the sibling **MindAttic.UiUx** repo and are served by jsDelivr at a whole-number tag:

- Page art: `https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@V7/ryandebraal.com/<category>/<file>` (`themes/<name>/<name>-NN.jpg`, `images/`, `icons/`)
- Shared fonts: `https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@V7/fonts/outfit/outfit-latin.woff2` (+ `outfit-latin-ext.woff2`)
- PDF export: html2pdf.js 0.10.2 from jsDelivr npm, loaded on first export

Names are lowercase kebab-case; JPEGs are never re-encoded. To add or change an asset, put it in MindAttic.UiUx (`ryandebraal.com/<category>/`), regenerate its `assets-manifest.json` (`toolsuild-asset-manifest.ps1`), commit it, then run the linked `/deploy`: it tags the next whole-number release, pushes it, rewrites the `@V<n>` pins in `index.htm` and checks the CDN before uploading. Full conventions: [docs/BIBLE.md §10](docs/BIBLE.md#RDC-§10).

## Local development

```
# Open it.
start index.htm
```

That's it. There is no dev server, because there is nothing to compile.

## Documentation (Codex canon)

This repo follows the MindAttic **Codex** documentation standard. A fact lives in exactly one layer; deeper detail is linked by stable ID, never duplicated here:

- **[docs/BIBLE.md](docs/BIBLE.md)** (L0) — what the site IS, is NOT, the architecture (§4), and the project Laws `RDC-LAW-1` through `RDC-LAW-6` (RDC-LAW-1 one-file/one-request — superseded by amendment RDC-A3; no build/package dependencies; no tracking and a host allow-list; CSS-variable themes, one data model, deploy owned by MindAttic.Deploy).
- **[docs/AMENDMENTS.md](docs/AMENDMENTS.md)** (L1) — append-only change log (`RDC-A1` adopted Codex; `RDC-A2` recorded the dark-theme addition, export-function expansion, and a README deploy-section correction). An amendment wins over the bible; it is never rewritten, only superseded.
- **[docs/USER_STORIES.md](docs/USER_STORIES.md)** (L2) — capabilities by epic (`RDC-US-A1`…`RDC-US-F2`), each marked `🟡` (shipped, manually verified) because this project ships no automated test suite and no build step by design — see [RDC-LAW-2](docs/BIBLE.md#RDC-LAW-2). Nothing here is marked `✅`, since Codex reserves that status for test- or build-proven facts.
- **[docs/rfc/](docs/rfc/)** — design notes that graduate into the bible + stories once decided. Currently one: [RFC 0001 — in-browser smoke harness](docs/rfc/0001-in-browser-smoke-harness.md), which proposes how to make `✅` reachable (an in-page `?selftest=1` self-test block, or a sibling harness in MindAttic.Deploy) without adding a build step to this repo.
- **[docs/BIBLE.digest.md](docs/BIBLE.digest.md)** — GENERATED by `tools/codex.ps1 digest`. Never hand-edit; regenerate after any change to BIBLE §1/§3/§5/§9 or the latest amendment.
- **Org-wide laws** — [`../MindAttic.HouseRules.md`](../MindAttic.HouseRules.md), inherited by reference from BIBLE §5 (not restated here). Most relevant: whole-number versioning, credentials never in code/commits, "done is verified, not asserted."

After editing anything under `docs/`, run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/codex.ps1 doctor
```

It validates front-matter, section/law IDs, cross-references, cited tests/paths, and digest freshness, and must exit 0. Regenerate the digest with:

```powershell
powershell -ExecutionPolicy Bypass -File tools/codex.ps1 digest
```

## Tooling — `tools/`

| Script | Purpose |
| --- | --- |
| `tools/codex.ps1` | Codex CLI for this repo. `doctor` validates the `docs/` canon (front-matter, IDs, cross-refs, cited tests/paths, digest freshness) and exits non-zero on any hard error; `digest` regenerates `docs/BIBLE.digest.md` from BIBLE §1/3/5/9 plus a status index and the latest amendment head. Pure Windows PowerShell 5.1, no external modules. |
| `tools/build-readme.ps1` | Thin wrapper that regenerates this repo's `README.htm` from `README.md` by delegating to the single shared rendering engine at `../codex-standard/build-readme.ps1` (workspace root, outside this repo). Every MindAttic repo carries an identical wrapper so all `README.htm` files share one engine and look/behave identically; the engine is never copied into this repo. Run it with `powershell -NoProfile -ExecutionPolicy Bypass -File tools\build-readme.ps1`. |

`README.htm` is a generated artifact (dark-themed, sidebar-TOC HTML rendering of this file) and is **not** the site's `index.htm` — the two are unrelated. `index.htm` is the shipped product; `README.htm` is developer-facing documentation output.

## Deploy

Deploy via the `/deploy` command (`.claude/commands/deploy.md`), which shells out to the sibling **MindAttic.Deploy** repo. This site is part of the permanently **linked group** `mindattic-web` (MindAttic.UiUx + ryandebraal.com + mindatticcares.com + mindattic.com): deploying any one of them deploys all four, in one run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -Command "cd D:\Projects\MindAttic\MindAttic.Deploy; npm run deploy -- --site ryandebraal.com"
```

The run publishes the MindAttic.UiUx package first (tags the next `V<n>` if it has unreleased commits, pushes the tag), pins that tag in every site's `index.htm`, verifies every asset is live on jsDelivr byte-for-byte, and only then stamps the `<!-- Last Updated -->` comment and FTPS-uploads `index.htm` to the site root (`/`), followed by mindatticcares.com and mindattic.com. `--dry-run` previews the whole run without changing anything; `--no-link` deploys this site alone. The deploy never commits or pushes this repo. This site's profile lives in `MindAttic.Deploy/projects.json` under `sites[]`; credentials are centralized in `MindAttic.Deploy/secrets/ftp.json`. The per-project `deploy.ps1`/`deploy.bat`/`settings.json` approach is retired and must not be reintroduced ([RDC-LAW-6](docs/BIBLE.md#RDC-LAW-6)).

## Claude Code project setup

This repo carries a `.claude/` directory with project-specific Claude Code configuration:

- **Commands** (`.claude/commands/`) — `deploy.md` (the linked 4-in-1 deploy above), `quicksave.md` (prints the current discussion to a paper transcript so it survives `/clear`) and `quickload.md` (restores the last quicksave).
- **Skills** (`.claude/skills/`) — `commit/` (`SKILL.md`: stage, commit, push and print the hash).
- **Hooks** (`.claude/hooks/`) — `inject-digest.ps1` (SessionStart: injects `docs/BIBLE.digest.md`) and `quickload-on-do.ps1` (UserPromptSubmit: restores a quicksave when you reply `do`).
- **`.claude/statusline.ps1`** — live context-window usage gauge.
- **Agent rules** — `CLAUDE.md` is a provider forwarder: it points at the workspace-wide `D:\Projects\MindAttic\MINDATTIC_AGENT.md` and `mindattic-agent-standard\AGENTS.md`, and `AGENTS.md` is this project's agent entrypoint. Neither duplicates workflow.
---

Built and maintained by [Ryan DeBraal](https://ryandebraal.com).
