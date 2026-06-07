---
codex: 1
project: ryandebraal.com
code: RDC
layer: bible
status: living
updated: 2026-06-07
---

# ryandebraal.com — Project Bible

> Single source of truth for what ryandebraal.com IS, is NOT, and the rules that keep it coherent.
> [README.md](../README.md) says how to build/run; this says how to think about the system.

## 1. The one sentence {#RDC-§1}

ryandebraal.com is a single hand-authored `index.htm` — pure HTML, CSS, and vanilla
JavaScript with **zero external dependencies and no build step** — that renders Ryan DeBraal's
fully interactive, themeable, animated resume in any modern browser from one network request.

## 2. The product promise {#RDC-§2}

- **One file, one request.** The entire site is `index.htm`. Fonts (The Outfit, weights 100–900),
  the Neko sprite atlas (32 frames), and every asset are inlined as base64. Open DevTools → Network
  and you see a single document fetch.
- **The resume is the work sample.** The medium proves the message: a polished, production-quality
  experience built without a framework, bundler, CDN, package manager, or tracking.
- **It is themeable and expressive.** 16 themes ([§4.2](#RDC-§4)), each with a bespoke from-scratch
  Canvas 2D animation; 3 resume rendering profiles (classic / pitch / complete) over one data model.
- **It respects the reader.** Preferences (theme, profile, font, skill-familiarity tags) persist in
  `localStorage`. No analytics, no third-party scripts, no tracking pixels, no service worker.
- **It is exportable.** The reader can download the resume as Markdown or print/export it, honoring
  the current profile.

## 3. What it is NOT {#RDC-§3}

- **NOT a framework app.** No React/Angular/Vue, no `node_modules`, no `package.json`,
  no webpack/vite/rollup, no TypeScript, no transpiler, no minifier, no polyfills.
- **NOT a multi-file site.** No separate `.css`/`.js` assets, no images-as-files, no font CDN,
  no service worker, no SPA router. Everything is in `index.htm`.
- **NOT instrumented.** No analytics SDK, no tracking pixels, no third-party scripts of any kind.
- **NOT a CMS / not data-driven from a backend.** Resume content is an in-file JS object literal
  (`D`); there is no server, database, or API behind the page.
- **NOT a generic template.** It is one person's resume; the themes/animations are bespoke, not a
  reusable theming library.

## 4. Architecture canon {#RDC-§4}

```
                         index.htm  (one file, ~6.5K lines)
   ┌──────────────────────────────────────────────────────────────────────┐
   │  <!-- Last Updated: <UTC> -->   (stamped by the deploy pipeline)        │
   │  <head>                                                                │
   │    DevTools easter-egg banner (ASCII)                                  │
   │    <style>  CSS variables per [data-theme]  ·  layout  ·  toolbar      │
   │             @font-face Outfit (base64 woff2)  ·  Neko 32-frame atlas   │
   │  <body data-theme=… data-profile=…>                                    │
   │    resume DOM mount  +  toolbar  +  per-theme <canvas> FX layers       │
   │    <script> (single IIFE-scoped global block):                         │
   │       § DATA       const D = {…}            (NOUNS)                     │
   │       § TOOLTIPS   const tooltips = {…}      (~200 tech entries)        │
   │       § RENDER     secHTML/expHTML/…/render  (pure string builders)    │
   │       § STATE      theme · profile · skill-familiarity · localStorage  │
   │       § FX ENGINE  per-theme Canvas 2D animations + rAF loops          │
   │       § EXPORT     exportMD · exportHTML · exportPDF variants ·         │
   │                   printResume · runPdfExport                            │
   └──────────────────────────────────────────────────────────────────────┘
        deploy:  MindAttic.Deploy (sibling repo) stamps + FTPS-uploads index.htm
```

### 4.1 "Projects" (the single deliverable)
There is exactly one artifact: **`index.htm`**. There is no build output, no compilation unit, and
no auxiliary file shipped to the browser. The only sibling tooling is the **MindAttic.Deploy** repo
(out of tree) which stamps the `<!-- Last Updated -->` comment and FTPS-uploads the file.

### 4.2 Domain model (NOUNS)
All resume content is the in-file object literal **`D`** (`index.htm`). Its catalog keys:
- `summary`, `pitchSummary` — prose blurbs (full vs. pitch tone).
- `skillsCore`, `skillsComplete` — grouped skill lists (label + items[]).
- `experience[]` — `{title, company, location, dates, tech[], bullets[]}`.
- `projects[]` — `{name, desc}` (the MindAttic portfolio: Tutor, IdiotProof, ThinkTank,
  MindAttic.Legion, TaxRateCollector, FractionsOfAPenny, GridGame2026, StreetSamurai,
  Ciao-ChatGpt-Bonjour-Claude, mindattic.com).
- `education[]`, `patents[]`, `corporate[]` — degrees, US patents, registered entities.
- `tooltips` — a separate `{ tech-name → description }` map (~200 entries) powering hover context.

**Themes (16):** light, dark, spring, summer, autumn, winter, matrix, neko, ocean, sunset, forest,
cyberpunk, noir, sakura, sand, synthwave — selected via `[data-theme]` on `<html>`.
**Profiles (3):** classic, pitch, complete — selected via `[data-profile]`.

### 4.3 Key services (VERBS) — functions in `index.htm`
- **Render:** `render()` orchestrates per-section builders (`expHTML`, `projHTML`, `eduHTML`,
  `patHTML`, `corpHTML`, `skillsHTML`, `secHTML`, `tag`, `buildTooltip`).
- **State / preferences:** `setTheme`, `setProfile`, `cycleTheme`/`pickTheme`, `cycleProfile`,
  `filterSkills`, `cycleTagLevel`/`saveSkillFam`, `resetDefaults`, theme-rotation
  (`startThemeRotation`/`stopThemeRotation`/`toggleThemeRotation`) — persisted to `localStorage`
  keys `resume-settings`, `resume-theme`, `resume-theme-rotation-paused`, `tag-familiarity`,
  `neko-color`.
- **FX engine:** one `start<Theme>` initializer per animated theme (`startSpring`, `startSummer`,
  `startSakura`, `startAutumn`, `startWinter`, `startMatrix`, `startForest`, `startOcean`,
  `startCyberpunk`, `startSynthwave`, `startSand`, `startNekoTheme`, …) driving `<canvas>` layers
  via `requestAnimationFrame`; `resizeCanvas`/`stopFX` manage lifecycle.
- **Export:** `exportMD()` (Markdown download), `exportHTML()` (self-contained HTML download),
  `runPdfExport(opts)` (shared print/PDF engine) with named wrappers `exportPDF()`,
  `exportPrintPage()`, `exportPrintDocument()`, `exportPrintCV()`; `printResume()` for simple
  print; `toggleExportMenu`/`toggleMoreMenu` for the toolbar.

## 5. The Laws {#RDC-§5}

This project **inherits the org-wide house rules** in
[MindAttic.HouseRules.md](../../MindAttic.HouseRules.md) by reference — do not restate them here.
Most relevant inherited laws: whole-number versioning [see HOUSE-LAW-1], credentials never in
code/commits [see HOUSE-LAW-3], and "done is verified, not asserted" [see HOUSE-LAW-8].
Project-specific laws below.

### {#RDC-LAW-1} One file, one request
The shipped product is a single `index.htm`. No asset (font, image, script, style, sprite) may be
split into a separate file or loaded from a CDN/third party. New assets are inlined (base64 / data
URI). If you cannot inline it, it does not ship.

### {#RDC-LAW-2} Zero dependencies, zero build step
No `package.json`, bundler, transpiler, minifier, framework, or polyfill enters the repo. The source
the author writes is byte-for-byte the source the browser runs. "Open it" is the only build.

### {#RDC-LAW-3} No tracking, no third-party calls at runtime
The page makes no network request other than fetching itself. No analytics, tracking pixels,
telemetry, or third-party scripts — ever.

### {#RDC-LAW-4} Themes are CSS-variable swaps, not JS style mutation
A theme is a `[data-theme]` value resolving to CSS custom properties. JavaScript sets the attribute
and drives the bespoke Canvas FX; it does not mutate element styles to "paint" a theme.

### {#RDC-LAW-5} One data model, many views
Resume facts live once in the `D` object literal. The three profiles (classic/pitch/complete) and
both export formats (Markdown/PDF) are pure projections of `D` — never a second copy of the content.

### {#RDC-LAW-6} Deploy is owned by MindAttic.Deploy
Publishing is centralized in the sibling **MindAttic.Deploy** repo (stamp + FTPS-upload). The
retired per-project `deploy.ps1`/`deploy.bat`/`settings.json` must not be reintroduced.

## 6. Verified state {#RDC-§6}

**Build/test commands:** none exist by design — there is no compiler and no test suite
(see [§3](#RDC-§3), [RDC-LAW-2](#RDC-LAW-2)). The "build" is opening `index.htm`; verification is
manual in-browser inspection. Therefore no story below is marked `✅` (which Codex reserves for
test- or build-proven facts); shipped-and-manually-confirmed work is marked `🟡`.

Confirmed by direct inspection of `index.htm` (2026-06-07):
- 🟡 Single-file delivery — only `index.htm` is served; fonts and Neko atlas are inlined base64.
- 🟡 16 themes present as `[data-theme]` blocks (added `dark` theme, 2026-06-07); 3 profiles via `[data-profile]`.
- 🟡 Render engine, FX engine, export functions present (function inventory in [§4.3](#RDC-§4)).
- 🟡 `localStorage` persistence wired for theme/profile/font/skill-familiarity/neko-color.
- 🟡 Deploy delegated to MindAttic.Deploy (per `.claude/skills/deploy/SKILL.md`).

There is no automated evidence (no green test run) backing any item; all are inspection-level only.

## 7. Active frontier {#RDC-§7}

- Design notes live under [docs/rfc/](rfc/). Current: [RFC 0001 — Lightweight in-browser smoke
  harness](rfc/0001-in-browser-smoke-harness.md) (how to make `✅` reachable without a build step).
- Backlog and shipped capabilities: [docs/USER_STORIES.md](USER_STORIES.md).

## 8. Quality bar {#RDC-§8}

A change is done when:
- It lives entirely in `index.htm` (or docs/tooling), adding no new shipped file and no dependency
  ([RDC-LAW-1](#RDC-LAW-1), [RDC-LAW-2](#RDC-LAW-2)).
- Opening `index.htm` in a current Chromium/Firefox/Safari shows the change with no console errors
  and a single network request.
- All 16 themes still render and switch; all 3 profiles still render from `D`; export still works.
- Preferences still round-trip through `localStorage` across reload.
- No third-party/runtime network call was introduced ([RDC-LAW-3](#RDC-LAW-3)).
- Private fields use `camelCase` without an underscore prefix (project CLAUDE.md).

## 9. Glossary {#RDC-§9}

- **`D`** — the in-file resume data object literal (the single home for all resume facts).
- **Profile** — a rendering mode (`classic`, `pitch`, `complete`) selected via `[data-profile]`.
- **Theme** — a visual identity (`[data-theme]`) resolving to CSS custom properties + a bespoke
  Canvas FX animation.
- **FX engine** — the collection of `start<Theme>` Canvas 2D animators driven by
  `requestAnimationFrame`.
- **Tooltip map** — the `tooltips` object mapping a technology name to its hover description.
- **Profile / render projection** — read-only views derived from `D`; never a second content copy.
- **MindAttic.Deploy** — the sibling repo that stamps and FTPS-uploads `index.htm`.
- **Skill familiarity** — per-tag familiarity level the reader can cycle; persisted in
  `localStorage` (`tag-familiarity`).
