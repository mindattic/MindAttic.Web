---
codex: 1
project: MindAttic Cares
code: MAC
layer: digest
status: living
updated: 2026-10-03
generatedFrom: MAC-bible
---

AUTHORITATIVE - full detail in docs/BIBLE.md

# MindAttic Cares - Bible Digest (generated)
> Do not hand-edit. Regenerate with: tools/codex.ps1 digest

## 1. The one sentence {#MAC-§1}

MindAttic Cares is a **single hand-authored `index.htm`** (inline CSS/JS, no framework, no build step, assets pinned on a CDN) that publishes MindAttic's charity
event playbooks — flagship being the Y2K: End of the World Party fundraiser for Child's Play —
in full public detail so any sibling charity can fork and reuse them.


## 3. What it is NOT {#MAC-§3}

- **NOT a web application.** No accounts, no server-side code, no database, no API. It is a static
  document with a thin client-side navigation/lightbox script.
- **NOT a build pipeline.** No `npm install`, no bundler, no SSG. There is no build step; the
  deliverable file IS the source. (Its assets are separate static files in MindAttic.Web.Shared — they
  are served, not built.)
- **NOT a donation processor.** It links out to the partner charity; it does not collect money.
- **NOT self-deploying.** Deployment is owned by the central **MindAttic.Deploy** pipeline (sibling
  repo), not by per-project scripts in this folder. (See [§4](#MAC-§4), [MAC-LAW-5](#MAC-LAW-5).)
- **NOT a CMS-driven blog.** New events are authored by copying the existing section template
  directly in `index.htm`.


## 5. The Laws {#MAC-§5}

This project **inherits the org-wide House Rules** in
[`MindAttic.HouseRules.md`](../../../MindAttic.HouseRules.md) by reference — they are not restated here.
Relevant inherited laws:
- **[HOUSE-LAW-1]** — whole-number versioning.
- **[HOUSE-LAW-3]** — credentials never committed (FTP secrets live in `MindAttic.Deploy/secrets/`).
- **[HOUSE-LAW-8]** — definition of done is verified, not asserted (see [§8](#MAC-§8)).
- **[HOUSE-LAW-9]** — `psst` only on explicit request.

Project-specific laws:

### MAC-LAW-1 — One file, no build step; assets from the pinned MindAttic.Web.Shared package {#MAC-LAW-1}
The entire site ships as a single `index.htm` with inline CSS and JS. No database, no bundler, no SSG,
no framework, no `npm install`. The file you edit is the file you deploy.

Fonts and images are not embedded: they are static files in the shared **MindAttic.Web.Shared** package (a folder of the MindAttic.Web repo),
loaded at runtime from jsDelivr pinned to a whole-number release tag:

```
https://cdn.jsdelivr.net/gh/mindattic/MindAttic.Web@V<n>/MindAttic.Web.Shared/mindatticcares.com/<category>/<file>
https://cdn.jsdelivr.net/gh/mindattic/MindAttic.Web@V<n>/MindAttic.Web.Shared/fonts/outfit/<file>
```

`<category>` is `logos`, `icons` or `images`; file names are lowercase kebab-case (pixel-width suffix
for resized variants, e.g. `-720.png`). A tag is immutable, so changing an asset means cutting a new
tag (via the linked deploy) and re-pinning `index.htm`. Lossy files stay byte-identical at full
resolution; PNGs may only be recompressed losslessly. The page uses `preconnect`/`preload` hints and
lazy-loads below-the-fold images.

**Allowed external hosts (the full list):**
- `cdn.jsdelivr.net` — static assets from MindAttic.Web.Shared only, pinned to a tag.
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
- **MindAttic.Web.Shared package** — the shared folder of the MindAttic.Web repo that holds MindAttic's runtime assets (fonts, logos,
  photos, effects) organised by domain and served by jsDelivr; sites load from it at runtime (MAC-LAW-1).
- **Asset URL** — `https://cdn.jsdelivr.net/gh/mindattic/MindAttic.Web@<tag>/MindAttic.Web.Shared/mindatticcares.com/<category>/<file>`;
  `<tag>` is a whole-number release tag of MindAttic.Web, lowercase kebab-case file names.


## Status index (USER_STORIES)
- done: 5   partial: 4   planned: 2

