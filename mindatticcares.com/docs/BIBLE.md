---
codex: 1
project: MindAttic Cares
code: MAC
layer: bible
status: living
updated: 2026-10-03
---

# MindAttic Cares — Project Bible

> Single source of truth for what MindAttic Cares IS, is NOT, and the rules that keep it coherent.
> README says how to build/run; this says how to think about the system.

## 1. The one sentence {#MAC-§1}

MindAttic Cares is a **single hand-authored `index.htm`** (inline CSS/JS, no framework, no build step, assets pinned on a CDN) that publishes MindAttic's charity
event playbooks — flagship being the Y2K: End of the World Party fundraiser for Child's Play —
in full public detail so any sibling charity can fork and reuse them.

## 2. The product promise {#MAC-§2}

- **Public-by-default planning.** Every event's full playbook lives on the public site: timeline,
  venue, permits, equipment, floor plan, staffing, run-of-show, budget, sponsorship, marketing,
  compliance, décor, post-event wrap. No proprietary checklists behind a paywall.
- **100% pass-through giving.** Funds raised go to a named partner charity directly
  ([childsplaycharity.org](https://childsplaycharity.org)); MindAttic LLC covers operations so
  donors do not pay overhead.
- **One page, no CMS.** The whole site is `index.htm` — inline CSS and JS. Fonts and images are
  static files served from the shared MindAttic.UiUx package on jsDelivr, pinned to a release tag
  ([MAC-LAW-1](#MAC-LAW-1)). No database, no static-site generator, no analytics. Fork it,
  edit in a text editor, host your own copy.
- **Reusable templates.** The 12-week timeline, budget worksheet, sponsorship pitch, and
  volunteer staffing model are designed for a sibling charity to drop into their own event.

## 3. What it is NOT {#MAC-§3}

- **NOT a web application.** No accounts, no server-side code, no database, no API. It is a static
  document with a thin client-side navigation/lightbox script.
- **NOT a build pipeline.** No `npm install`, no bundler, no SSG. There is no build step; the
  deliverable file IS the source. (Its assets are separate static files in MindAttic.UiUx — they
  are served, not built.)
- **NOT a donation processor.** It links out to the partner charity; it does not collect money.
- **NOT self-deploying.** Deployment is owned by the central **MindAttic.Deploy** pipeline (sibling
  repo), not by per-project scripts in this folder. (See [§4](#MAC-§4), [MAC-LAW-5](#MAC-LAW-5).)
- **NOT a CMS-driven blog.** New events are authored by copying the existing section template
  directly in `index.htm`.

## 4. Architecture canon {#MAC-§4}

```
                 ┌─────────────────────────────────────────────┐
                 │                 index.htm                     │
                 │  ┌─────────┐  ┌──────────┐  ┌──────────────┐  │
                 │  │ <style> │  │  <main>  │  │   <script>   │  │
                 │  │ inline  │  │  3 .page │  │ hash router  │  │
                 │  │  CSS +  │  │ sections │  │ + lite-YT    │  │
                 │  │ @font-  │  │ + in-page│  │   embed      │  │
                 │  │  face   │  │   TOC    │  │              │  │
                 │  └─────────┘  └──────────┘  └──────────────┘  │
                 └───────────────────────┬─────────────────────┘
                                         │ FTPS upload of index.htm
                                         ▼
                 ┌─────────────────────────────────────────────┐
                 │   MindAttic.Deploy  (sibling repo, central)   │
                 │   projects.json → sites[] → mindatticcares.com│
                 │   stamps <!-- Last Updated --> then FTPS PUT  │
                 └───────────────────────┬─────────────────────┘
                                         ▼
        FTP /mindatticcares.com → https://ryandebraal.com/mindatticcares.com/
        (mindatticcares.com is a registrar masked forward: a frameset → that URL,
         so a hash after the bare domain never reaches the page)
                                         │ at runtime, the browser fetches
                                         ▼ fonts / logos / photos
                 ┌─────────────────────────────────────────────┐
                 │ jsDelivr CDN → MindAttic.UiUx @V10 (pinned) │
                 │ fonts/outfit · mindatticcares.com/...       │
                 └─────────────────────────────────────────────┘
```

### 4.1 Projects / files
- **`index.htm`** — the entire deliverable: `<head>` (meta description, canonical URL
  `https://mindatticcares.com/`, Open Graph / Twitter "summary" card tags whose image is the M-Cares
  logo from the UiUx package, resource hints, `@font-face` rules pointing at CDN woff2 files,
  `<style>`), `<header class="topbar">` nav, `<main>` with three
  `<section class="page">` blocks, and a single trailing `<script>`. (~60 KB; fonts and images are
  referenced by URL, not embedded.)
- **Assets (external, not in this repo)** — `MindAttic.UiUx/fonts/outfit/` and
  `MindAttic.UiUx/mindatticcares.com/{logos,icons,images}/`, served by jsDelivr at
  `https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@<tag>/…` ([MAC-LAW-1](#MAC-LAW-1)); the
  page currently pins `@V10`.
- **`README.md`** — how to build/run/deploy and edit.
- **`docs/`** — this Codex canon (BIBLE, AMENDMENTS, USER_STORIES, rfc).
- **`tools/codex.ps1`** — the doctor + digest CLI.
- **`.claude/`** — the deploy command, project skills, and the SessionStart digest hook.
- There is no deploy script or FTP settings file in this repo; the FTP pipeline lives in
  **MindAttic.Deploy** (see [`.claude/commands/deploy.md`](../.claude/commands/deploy.md),
  [MAC-LAW-5](#MAC-LAW-5)).

### 4.2 Domain model (NOUNS)
- **Page** — a top-level `<section class="page" id="...">`; one of `home`, `childs-play`, `y2k`.
  Exactly one is `.active` at a time.
- **Playbook section** — an `<h2 id="sec-..." class="sec">` block inside the Y2K page (19 sections:
  `sec-overview` … `sec-appendix`).
- **TOC** — the `<nav class="toc" id="contents">` ordered list of links to the `sec-*` anchors;
  `#contents` deep-links to it. Playbook sections carry no per-section "back to contents" links.
- **Last-Updated stamp** — the leading `<!-- Last Updated: <ISO8601 UTC> -->` comment, rewritten by
  the deploy pipeline on each upload.
- **Lite-YT box** — a `.video[data-yt]` element that swaps to a YouTube iframe on click.

### 4.3 Key services (VERBS)
- **`show(name)`** — toggles `.active` on the matching `.page` and the matching `header nav a`,
  scrolls to top. Falls back to `home` for unknown names.
- **`fromHash()`** — routes from `window.location.hash`: bare page names select that page; any other
  anchor (`#sec-budget`, `#contents`) opens the page that contains it and scrolls it into view.
- **lite-YT `play()`** — replaces the poster with a `youtube-nocookie` iframe (or opens YouTube in a
  new tab under the `file:` protocol).
- **deploy** (external) — MindAttic.Deploy's permanently linked group `mindattic-web` (UiUx +
  ryandebraal.com + this site + mindattic.com): deploying any one deploys all four — publish the UiUx
  tag, pin it in every site, verify every asset on jsDelivr byte-exact, then stamp the Last-Updated
  comment and FTPS-upload `index.htm` to `/mindatticcares.com/`. `--no-link` deploys this site alone.

## 5. The Laws {#MAC-§5}

This project **inherits the org-wide House Rules** in
[`MindAttic.HouseRules.md`](../../MindAttic.HouseRules.md) by reference — they are not restated here.
Relevant inherited laws:
- **[HOUSE-LAW-1]** — whole-number versioning.
- **[HOUSE-LAW-3]** — credentials never committed (FTP secrets live in `MindAttic.Deploy/secrets/`).
- **[HOUSE-LAW-8]** — definition of done is verified, not asserted (see [§8](#MAC-§8)).
- **[HOUSE-LAW-9]** — `psst` only on explicit request.

Project-specific laws:

### MAC-LAW-1 — One file, no build step; assets from the pinned UiUx package {#MAC-LAW-1}
The entire site ships as a single `index.htm` with inline CSS and JS. No database, no bundler, no SSG,
no framework, no `npm install`. The file you edit is the file you deploy.

Fonts and images are not embedded: they are static files in the shared **MindAttic.UiUx** repo,
loaded at runtime from jsDelivr pinned to a whole-number release tag:

```
https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@V10/mindatticcares.com/<category>/<file>
https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@V10/fonts/outfit/<file>
```

`<category>` is `logos`, `icons` or `images`; file names are lowercase kebab-case (pixel-width suffix
for resized variants, e.g. `-720.png`). A tag is immutable, so changing an asset means cutting a new
tag (via the linked deploy) and re-pinning `index.htm`. Lossy files stay byte-identical at full
resolution; PNGs may only be recompressed losslessly. The page uses `preconnect`/`preload` hints and
lazy-loads below-the-fold images.

**Allowed external hosts (the full list):**
- `cdn.jsdelivr.net` — static assets from MindAttic.UiUx only, pinned to a tag.
- `www.youtube-nocookie.com` — only after the visitor clicks the Child's Play video poster
  (`www.youtube.com` is used only for the `file://` open-in-new-tab fallback).
- Plain outbound links (e.g. childsplaycharity.org) are navigation, not dependencies.

Forbidden: analytics, tracking pixels, third-party font services (e.g. Google Fonts), front-end
frameworks, a bundler/build step, a CMS.

### MAC-LAW-2 — 100% pass-through giving {#MAC-LAW-2}
Funds raised at an event go to the named partner charity directly. Operational cost is covered
separately by MindAttic LLC. The site never collects or processes donations itself.

### MAC-LAW-3 — Public-by-default playbooks {#MAC-LAW-3}
Every event's full playbook (timeline → venue → equipment → run-of-show → budget → sponsorship →
post-event) is published verbatim on the public page. Nothing operational is kept private.

### MAC-LAW-4 — Stable section IDs drive navigation {#MAC-LAW-4}
Pages use `<section class="page" id="...">`, playbook sections use `<h2 id="sec-..." class="sec">`,
and the contents list is `<nav class="toc" id="contents">`. The hash router opens whichever page
contains a requested anchor, and the in-page TOC keys off these IDs; renaming an ID is
a breaking change to navigation and must update every reference.

### MAC-LAW-5 — Deployment is centralized {#MAC-LAW-5}
Deployment is owned by **MindAttic.Deploy**, not by per-project scripts. This folder has no
`deploy.ps1`/`deploy.bat`/`settings.json`; do not introduce a local FTP pipeline. The site's profile
lives in `MindAttic.Deploy/projects.json` under `sites[]`; FTP credentials live in
`MindAttic.Deploy/secrets/ftp.json` (gitignored).

## 6. Verified state {#MAC-§6}

Domain class: **website** (static single-page site). There is **no automated test or build suite**
in this repo — by design (MAC-LAW-1, no build step). Verification is manual/structural.

Evidence:
- ✅ `index.htm` is well-formed: one `<head>`/`<style>`, three `<section class="page">` (`home`,
  `childs-play`, `y2k`), a 19-item TOC, and one trailing `<script>`. (structural grep)
- ✅ Hash router (`show`/`fromHash`) and lite-YT embed present and self-consistent with the page IDs.
- ✅ 19 playbook `sec-*` anchors exist and match the 19 TOC links.
- ✅ Centralized deploy wired: `.claude/commands/deploy.md` targets `MindAttic.Deploy --site
  mindatticcares.com`.
- ✅ `index.htm` is ~63 KB with no embedded base64 assets (MindAttic.UiUx `tests/specs/sites/common.spec.mjs`).
- ✅ Every UiUx file the live page at `https://ryandebraal.com/mindatticcares.com/` references is
  served byte-exact at the pinned tag (MindAttic.UiUx `tests/specs/cdn/cdn.live.spec.mjs`, live mode).
- ✅ Automated browser tests for this site live in the shared suite `MindAttic.UiUx/tests`
  (`specs/sites/mindatticcares.spec.mjs` + `common.spec.mjs`): first-paint requests, navigation, deep
  links, click-to-play video, image dimensions/alt/lazy, allowed hosts, no console errors, no
  horizontal scrollbar, pinned tag.
- 🟡 Any in-page anchor (including `#contents`) opens its own page and scrolls into view; on screens
  ≤ 360 px the budget tables use tighter padding so the widest fit a 320 px phone (checked by hand in
  Chrome: 0 px horizontal overflow at 300/320/390 px).
- ⬜ No linter, no HTML validator, no link-checker is run in CI (none configured).

Build command: **none** (`MAC-LAW-1`). This repo carries one automated check of its own,
`tools/codex.ps1 doctor` (it validates the Codex docs, not the site); the site itself is tested by the
shared Playwright suite in `MindAttic.UiUx/tests` (`npm run test:local`, `TEST_MODE=live npx playwright test`).

## 7. Active frontier {#MAC-§7}

- See [`docs/rfc/`](rfc/) for open design notes — currently [RFC 0001](rfc/0001-multi-event-playbooks.md)
  (scaling beyond one event on one page).
- See [USER_STORIES.md](USER_STORIES.md) epics: **A — Visitor reading the site**, **B — Charity
  forking a playbook**, **C — Maintainer publishing**.

## 8. Quality bar {#MAC-§8}

A change to MindAttic Cares is "done" when:
1. `index.htm` still opens correctly from `file://` and over HTTP (the three pages switch; the TOC
   anchors jump; the lite-YT box plays).
2. Every `sec-*` anchor referenced by the TOC still exists
   (no dangling in-page links).
3. No new external runtime dependency (beyond the pinned MindAttic.UiUx jsDelivr package and the
   click-to-load YouTube embed), build step, or CMS was introduced ([MAC-LAW-1](#MAC-LAW-1)). No analytics
   or third-party fonts.
4. New events follow the existing section template and update the in-page TOC.
5. `tools/codex.ps1 doctor` passes for the docs.
6. Per [HOUSE-LAW-8], status is downgraded to 🟡/⬜ for anything not actually observed working.

## 9. Glossary {#MAC-§9}

- **Page** — a top-level `<section class="page">`; one of `home` / `childs-play` / `y2k`.
- **Playbook** — the full set of 19 `sec-*` sections under the Y2K page; the reusable event template.
- **Playbook section** — one `<h2 id="sec-..." class="sec">` block (e.g. `sec-budget`).
- **TOC** — in-page `<nav class="toc">` linking to the `sec-*` anchors.
- **Hash router** — the client-side `fromHash`/`show` logic that selects a page from the URL hash.
- **Lite-YT** — click-to-load YouTube poster (`.video[data-yt]`) that defers the iframe until clicked.
- **Last-Updated stamp** — leading HTML comment rewritten by the deploy pipeline on upload.
- **Child's Play** — [childsplaycharity.org](https://childsplaycharity.org), the partner charity
  receiving Y2K proceeds.
- **MindAttic.Deploy** — the central sibling repo that owns the FTPS deploy pipeline (MAC-LAW-5).
- **Pass-through giving** — donations route entirely to the partner charity (MAC-LAW-2).
- **MindAttic.UiUx package** — the shared repo that holds MindAttic's runtime assets (fonts, logos,
  photos, effects) organised by domain and served by jsDelivr; sites load from it at runtime (MAC-LAW-1).
- **Asset URL** — `https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@<tag>/mindatticcares.com/<category>/<file>`;
  `<tag>` is a whole-number release tag (currently `V10`), lowercase kebab-case file names.
