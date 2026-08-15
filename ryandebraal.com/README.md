# ryandebraal.com

**A resume site as an engineering statement.** One file. No build step. No framework. No npm install. No CDN. No tracking. Just a developer who prefers working close to the platform.

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
- [Local development](#local-development)
- [Documentation (Codex canon)](#documentation-codex-canon)
- [Tooling — `tools/`](#tooling--tools)
- [Deploy](#deploy)
- [Claude Code project setup](#claude-code-project-setup)

---

## What it is

A single, hand-authored `index.htm` — pure HTML, CSS, and JavaScript — that renders a fully interactive, themeable, animated resume in any modern browser. Open the Network tab and filter by anything: you will see one request.

That's the whole product. There is no server, no API, no database, and no build output — the file you edit is byte-for-byte the file the browser runs.

## Why it exists

Modern web stacks make it easy to ship 30 MB of bundled JavaScript to render a paragraph of text. This project is the deliberate opposite — a demonstration that a polished, production-quality experience can be built without inheriting any of that complexity. Every line of logic, every animation frame, every export pipeline lives in the same file you can read end-to-end in an afternoon.

It's a resume that **is** the work sample.

## Features

- **16 themes** — Light, Dark, Spring, Summer, Autumn, Winter, Matrix, Neko, Ocean, Sunset, Forest, Cyberpunk, Noir, Sakura, Sand, Synthwave. Theme switching is CSS variables only; no JavaScript style mutations.
- **3 rendering profiles** — Classic, Pitch, and Complete views of the same underlying resume data, swapped with one click.
- **Custom canvas animations per theme** — Bees with a flower-claiming state machine, snow that accumulates into SVG drifts, ten roaming Neko cats with the full 1998 sprite state machine (all 32 frames embedded as base64), sandstorm physics, parallax forest silhouettes, perspective synthwave grids, neon-acid-rain cyberpunk skylines, and more. Written from scratch — no animation libraries. (`light`, `dark`, and `noir` are static CSS-only themes with no bespoke FX.)
- **~200 tech tooltips** — Hover any technology in the skills or experience sections for context.
- **Markdown, HTML, and PDF export** — Download the resume in any format from the toolbar.
- **The Outfit typeface, embedded** — Weights 100–900, inlined as base64 woff2. No font CDN request is ever made.
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
- Preferences persist in `localStorage` under the keys `resume-settings`, `resume-theme`, `resume-theme-rotation-paused`, `tag-familiarity`, and `neko-color`.

## File anatomy of `index.htm`

`index.htm` is a single file (~6,900 lines, ~5.3 MB on disk — the size is almost entirely the embedded Outfit woff2 font weights and the Neko sprite atlas, both base64-inlined). Structurally:

```
index.htm  (one file)
├── <!-- Last Updated: <UTC> -->     stamped by the deploy pipeline (MindAttic.Deploy)
├── <head>
│   ├── DevTools easter-egg banner (ASCII, shown via console.log)
│   └── <style>
│       ├── CSS custom properties per [data-theme]
│       ├── layout + toolbar rules
│       └── @font-face Outfit (base64 woff2, weights 100-900) + Neko 32-frame atlas
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

No `node_modules`. No `package.json`. No `webpack.config.js`. No `tsconfig.json`. No `.eslintrc`. No CI matrix. No Tailwind. No React. No Vite. No analytics SDK. No tracking pixels. No service worker. No polyfills. No minifier. No transpiler. No CDN links. No test suite, no compiler, no build command — see [docs/BIBLE.md §3 / §6](docs/BIBLE.md#RDC-§3).

The retired per-project `deploy.ps1`/`deploy.bat`/`settings.json` must not be reintroduced — deploy is centralized in the sibling MindAttic.Deploy repo ([RDC-LAW-6](docs/BIBLE.md#RDC-LAW-6)).

## Stack

`HTML5` · `CSS3` (custom properties, `color-mix`, `@media (orientation)`) · `Vanilla JavaScript` (ES2020+, IIFE-scoped, no modules) · `Canvas 2D` · `SVG`

## Directory layout

```
ryandebraal.com/
├── index.htm              The entire shipped product — one file, one network request
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

## Local development

```
# Open it.
start index.htm
```

That's it. There is no dev server, because there is nothing to compile.

## Documentation (Codex canon)

This repo follows the MindAttic **Codex** documentation standard. A fact lives in exactly one layer; deeper detail is linked by stable ID, never duplicated here:

- **[docs/BIBLE.md](docs/BIBLE.md)** (L0) — what the site IS, is NOT, the architecture (§4), and the project Laws `RDC-LAW-1` through `RDC-LAW-6` (one file/one request, zero dependencies, no tracking, CSS-variable themes, one data model, deploy owned by MindAttic.Deploy).
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

Deploy via the `/deploy` skill (`.claude/skills/deploy/SKILL.md`), which shells out to the sibling **MindAttic.Deploy** repo:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -Command "cd D:\Projects\MindAttic\MindAttic.Deploy; npm run deploy -- --site ryandebraal.com"
```

MindAttic.Deploy stamps the `<!-- Last Updated -->` comment in `index.htm` and FTPS-uploads it to the site root. This site's profile lives in `MindAttic.Deploy/projects.json` under `sites[]`; credentials are centralized in `MindAttic.Deploy/secrets/ftp.json`. The per-project `deploy.ps1`/`deploy.bat`/`settings.json` approach is retired and must not be reintroduced ([RDC-LAW-6](docs/BIBLE.md#RDC-LAW-6)).

## Claude Code project setup

This repo carries a `.claude/` directory with project-specific Claude Code configuration:

- **Commands** (`.claude/commands/`) — `checkpoint.md` (paper-transcript handoff across `/clear`), `commit.md`, `deploy.md`.
- **Skills** (`.claude/skills/`) — `commit/`, `deploy/`, `discard/`, `revert/`, `run/`, each a `SKILL.md`.
- **Hooks** (`.claude/hooks/`) — `inject-digest.ps1` (injects `docs/BIBLE.digest.md` at session start) and `restore-handoff.ps1` (re-ingests `.claude/checkpoint.md` on `/clear`, then deletes it — one-shot).
- **`.claude/statusline.ps1`** — live context-window usage gauge.
- Project rules live in [CLAUDE.md](CLAUDE.md): the Codex pointer above, a code-style rule (no underscore-prefixed private fields — `camelCase` without the prefix), and the `/commit` / `/revert` conventions.

---

Built and maintained by [Ryan DeBraal](https://ryandebraal.com).
