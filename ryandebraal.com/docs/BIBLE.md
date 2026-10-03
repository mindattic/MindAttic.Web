---
codex: 1
project: ryandebraal.com
code: RDC
layer: bible
status: living
updated: 2026-10-03
---

# ryandebraal.com — Project Bible

> Single source of truth for what ryandebraal.com IS, is NOT, and the rules that keep it coherent.
> [README.md](../README.md) says how to build/run; this says how to think about the system.

## 1. The one sentence {#RDC-§1}

ryandebraal.com is a single hand-authored `index.htm` — pure HTML, CSS, and vanilla
JavaScript with **no build step and no framework** — that renders Ryan DeBraal's fully
interactive, themeable, animated resume in any modern browser. Its static assets (fonts, images,
theme art) are served from the jsDelivr CDN at a pinned MindAttic.UiUx tag ([RDC-LAW-1](#RDC-LAW-1)).

## 2. The product promise {#RDC-§2}

- **One hand-authored page, fast static assets.** The entire site logic is `index.htm` (~0.45 MB).
  Fonts (Outfit, weights 100–900), the portrait, the theme background art and the PDF library are
  separate files on the jsDelivr CDN at pinned tags; only what the current theme needs is downloaded.
  The 32 Neko sprite frames stay inline as tiny CSS classes.
- **The resume is the work sample.** The medium proves the message: a polished, production-quality
  experience built without a framework, bundler, package manager, or tracking.
- **It is themeable and expressive.** 16 themes ([§4.2](#RDC-§4)), each with a bespoke from-scratch
  Canvas 2D animation; 3 resume rendering profiles (classic / pitch / complete) over one data model.
- **It respects the reader.** Preferences (theme, profile, font, skill-familiarity tags) persist in
  `localStorage`. No analytics, no third-party scripts, no tracking pixels, no service worker.
- **It is exportable.** The reader can download the resume as Markdown or print/export it, honoring
  the current profile.

## 3. What it is NOT {#RDC-§3}

- **NOT a framework app.** No React/Angular/Vue, no `node_modules`, no `package.json`,
  no webpack/vite/rollup, no TypeScript, no transpiler, no minifier, no polyfills.
- **NOT a multi-page site.** One hand-authored `index.htm`: no separate `.css`/`.js` source files,
  no service worker, no SPA router. Static assets (fonts, images, one library) are files hosted in
  MindAttic.UiUx and loaded by URL ([RDC-LAW-1](#RDC-LAW-1)).
- **NOT instrumented.** No analytics SDK, no tracking pixels, no telemetry, no third-party fonts.
  The only external hosts are the two jsDelivr paths listed in [RDC-LAW-3](#RDC-LAW-3).
- **NOT a CMS / not data-driven from a backend.** Resume content is an in-file JS object literal
  (`D`); there is no server, database, or API behind the page.
- **NOT a generic template.** It is one person's resume; the themes/animations are bespoke, not a
  reusable theming library.

## 4. Architecture canon {#RDC-§4}

```
                         index.htm  (one page, ~7K lines, ~0.45 MB)
   ┌──────────────────────────────────────────────────────────────────────┐
   │  <!-- Last Updated: <UTC> -->   (stamped by the deploy pipeline)        │
   │  <head>   meta description · canonical · theme-color · OG/Twitter card │
   │    DevTools easter-egg banner (ASCII)                                  │
   │    <style>  CSS variables per [data-theme]  ·  layout  ·  toolbar      │
   │             @font-face Outfit (CDN woff2)  ·  Neko 32 inline frames    │
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
  (`startThemeRotation`/`stopThemeRotation`/`toggleThemeRotation`; the pause state is per visit,
  not persisted) — persisted to `localStorage` keys `resume-settings`, `resume-theme`,
  `tag-familiarity`, `neko-color` and `fx-quality-level`.
- **FX engine:** one `start<Theme>` initializer per animated theme (`startSpring`, `startSummer`,
  `startSakura`, `startAutumn`, `startWinter`, `startMatrix`, `startForest`, `startOcean`,
  `startCyberpunk`, `startSynthwave`, `startSand`, `startNekoTheme`, …) driving `<canvas>` layers
  via `requestAnimationFrame`; `resizeCanvas`/`stopFX` manage lifecycle.
- **Export:** `exportMD()` (Markdown download), `exportHTML()` (static HTML download; references CDN URLs for fonts/images),
  `runPdfExport(opts)` (shared print/PDF engine; lazy-loads html2pdf.js from the CDN on first use) with named wrappers `exportPDF()`,
  `exportPrintPage()`, `exportPrintDocument()`, `exportPrintCV()`; `printResume()` for simple
  print; `toggleExportMenu`/`toggleMoreMenu` for the toolbar.

## 5. The Laws {#RDC-§5}

This project **inherits the org-wide house rules** in
[MindAttic.HouseRules.md](../../MindAttic.HouseRules.md) by reference — do not restate them here.
Most relevant inherited laws: whole-number versioning [see HOUSE-LAW-1], credentials never in
code/commits [see HOUSE-LAW-3], and "done is verified, not asserted" [see HOUSE-LAW-8].
Project-specific laws below.

### {#RDC-LAW-1} One hand-authored page; static assets by pinned CDN URL
`index.htm` is the only hand-authored page. Static assets (fonts, images, theme art, large libraries)
are real files hosted in **MindAttic.UiUx** and served by **jsDelivr** at an immutable whole-number tag
(currently `@V10`), referenced by URL. Do not inline large assets. Tiny assets stay inline on purpose:
the 32 Neko sprite frames (~1 KB each) and the 864-byte link icon. `<link rel="preconnect|preload">`,
`loading="lazy"` and `decoding="async"` are allowed and used. Trade-offs accepted: without the CDN the
page falls back to system fonts and plain backgrounds; `exportHTML()` output references CDN URLs; PDF
export needs a network connection the first time.

### {#RDC-LAW-2} Zero dependencies, zero build step
No `package.json`, bundler, transpiler, minifier, framework, or polyfill enters the repo. The source
the author writes is byte-for-byte the source the browser runs. "Open it" is the only build.
Loading a pinned third-party file by URL from an allowed host ([RDC-LAW-3](#RDC-LAW-3)) is allowed;
installing or building one is not.

### {#RDC-LAW-3} No tracking; external hosts are an allow-list
No analytics, tracking pixels, telemetry, third-party fonts (Google Fonts etc.), or phoning-home
scripts — ever. The page may request static assets only from this exhaustive list:
- `https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@V10/...` — our own assets (Outfit fonts at
  `fonts/outfit/`; page art at `ryandebraal.com/`).
- `https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.2/dist/html2pdf.bundle.min.js` — the PDF export
  library, loaded on demand the first time a PDF is exported.

Adding any other host is a decision recorded in this law first.

### {#RDC-LAW-4} Themes are CSS-variable swaps, not JS style mutation
A theme is a `[data-theme]` value resolving to CSS custom properties. JavaScript sets the attribute
and drives the bespoke Canvas FX; it does not mutate element styles to "paint" a theme.

### {#RDC-LAW-5} One data model, many views
Resume facts live once in the `D` object literal. The three profiles (classic/pitch/complete) and
both export formats (Markdown/PDF) are pure projections of `D` — never a second copy of the content.

### {#RDC-LAW-6} Deploy is owned by MindAttic.Deploy
Publishing is centralized in the sibling **MindAttic.Deploy** repo (stamp + FTPS-upload). This repo
carries no deploy script or FTP settings of its own (no `deploy.ps1`/`deploy.bat`/`settings.json`).

## 6. Verified state {#RDC-§6}

**Build/test commands:** none exist by design — there is no compiler and no test suite
(see [§3](#RDC-§3), [RDC-LAW-2](#RDC-LAW-2)). The "build" is opening `index.htm`; verification is
manual in-browser inspection. Therefore no story below is marked `✅` (which Codex reserves for
test- or build-proven facts); shipped-and-manually-confirmed work is marked `🟡`.

Confirmed by direct inspection of `index.htm`:
- 🟡 Asset delivery — `index.htm` (~7K lines, ~0.47 MB) references fonts, images and theme art on the jsDelivr CDN (`@V10`); Neko frames stay inline base64 ([RDC-LAW-1](#RDC-LAW-1)). The live site's asset loading is checked by the MindAttic.UiUx Playwright suite in local and live mode (`MindAttic.UiUx/tests`, `specs/sites/ryandebraal.spec.mjs` + `specs/sites/common.spec.mjs` + `specs/cdn/cdn.live.spec.mjs`).
- 🟡 16 themes present as `[data-theme]` blocks (`light`, `dark` and `noir` are CSS-only, with no bespoke canvas animation); 3 profiles via `[data-profile]`.
- 🟡 `<head>` carries a meta description, canonical URL (`https://ryandebraal.com/`), `theme-color`, and Open Graph (`og:type` = `profile`) / Twitter "summary" card tags; the preview image is `ryandebraal.com/images/ryan-portrait.png` (400×400) from the UiUx package.
- 🟡 Render engine, FX engine, export functions present (function inventory in [§4.3](#RDC-§4)).
- 🟡 `localStorage` persistence wired for settings (incl. font size and theme timeout), theme, skill familiarity, Neko colour and FX quality. Theme rotation defaults to 60 seconds per theme (`theme_timeout`); only settings the visitor changed are stored in `resume-settings`, so a saved slider value wins over the default.
- 🟡 Deploy delegated to MindAttic.Deploy as part of the linked `mindattic-web` group (per `.claude/commands/deploy.md`).

Automated evidence exists outside this repo: the MindAttic.UiUx Playwright suite (`MindAttic.UiUx/tests`) loads this page in Chrome locally and live and checks asset loading, the host allow-list, theme switching (sunset, sakura, noir), the lightbox, on-demand PDF loading and horizontal overflow. Items it does not cover remain inspection-level.

## 7. Active frontier {#RDC-§7}

- Design notes live under [docs/rfc/](rfc/). Current: [RFC 0001 — Lightweight in-browser smoke
  harness](rfc/0001-in-browser-smoke-harness.md) (how to make `✅` reachable without a build step).
- Backlog and shipped capabilities: [docs/USER_STORIES.md](USER_STORIES.md).

## 8. Quality bar {#RDC-§8}

A change is done when:
- Page changes live in `index.htm` (or docs/tooling); new static assets go to MindAttic.UiUx under the
  conventions in [§10](#RDC-§10), and no package/build dependency is added
  ([RDC-LAW-2](#RDC-LAW-2)).
- Opening `index.htm` in a current Chromium/Firefox/Safari shows the change with no console errors
  and every CDN asset returning 200.
- All 16 themes still render and switch; all 3 profiles still render from `D`; export still works.
- Preferences still round-trip through `localStorage` across reload.
- No host outside the [RDC-LAW-3](#RDC-LAW-3) allow-list was introduced.
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
- **MindAttic.UiUx** — the sibling repo that hosts this site's static assets (and the shared Outfit/Attic fonts); served by jsDelivr at whole-number tags (currently `V10`).
- **Skill familiarity** — per-tag familiarity level the reader can cycle; persisted in
  `localStorage` (`tag-familiarity`).

## 10. Conventions {#RDC-§10}

- **Asset URL pattern:** `https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@V10/ryandebraal.com/<category>/<file>` — always tag-pinned (`@V10`), never `@latest` or a branch.
- **Shared fonts** live at the UiUx top level: `https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@V10/fonts/outfit/outfit-latin.woff2` (and `outfit-latin-ext.woff2`; Attic at `fonts/attic/attic.woff2`).
- **Categories under `ryandebraal.com/`:** `themes/<theme-name>/` (per-theme art), `images/` (portrait, avatar), `icons/` (small UI icons, Neko frames), `logos/` if any.
- **File names:** lowercase kebab-case; numbered series are zero-padded and 1-based — `themes/sakura/sakura-01.jpg` … `sakura-20.jpg`, `themes/sunset/sunset-01.jpg` … `sunset-20.jpg`. The page builds these URLs with `bgSet(theme, count)`; adding a background means adding the file and bumping the count.
- **Lossy art is never re-encoded** between the original and the CDN file; PNGs may only be recompressed losslessly.
- **Releasing assets:** copy the files into MindAttic.UiUx, regenerate `assets-manifest.json`, commit, then run the linked deploy (`.claude/commands/deploy.md`): it creates and pushes the next whole-number tag, rewrites the `@V<n>` pins in `index.htm`, verifies the CDN and uploads. Old tags stay valid.
- **Preloads:** only above-the-fold assets are preloaded (latin font, toolbar avatar); backgrounds and the lightbox portrait load on demand.
