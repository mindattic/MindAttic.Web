---
codex: 1
project: MindAttic Cares
code: MAC
layer: bible
status: living
updated: 2026-06-07
---

# MindAttic Cares — Project Bible

> Single source of truth for what MindAttic Cares IS, is NOT, and the rules that keep it coherent.
> README says how to build/run; this says how to think about the system.

## 1. The one sentence {#MAC-§1}

MindAttic Cares is a **single self-contained `index.htm`** that publishes MindAttic's charity
event playbooks — flagship being the Y2K: End of the World Party fundraiser for Child's Play —
in full public detail so any sibling charity can fork and reuse them.

## 2. The product promise {#MAC-§2}

- **Public-by-default planning.** Every event's full playbook lives on the public site: timeline,
  venue, permits, equipment, floor plan, staffing, run-of-show, budget, sponsorship, marketing,
  compliance, décor, post-event wrap. No proprietary checklists behind a paywall.
- **100% pass-through giving.** Funds raised go to a named partner charity directly
  ([childsplaycharity.org](https://childsplaycharity.org)); MindAttic LLC covers operations so
  donors do not pay overhead.
- **One file, no CMS.** The entire site is `index.htm` — inlined CSS, inlined JS, base64-inlined
  fonts/graphics. No CDN, no database, no static-site generator. Fork it, edit in a text editor,
  host your own copy.
- **Reusable templates.** The 12-week timeline, budget worksheet, sponsorship pitch, and
  volunteer staffing model are designed for a sibling charity to drop into their own event.

## 3. What it is NOT {#MAC-§3}

- **NOT a web application.** No accounts, no server-side code, no database, no API. It is a static
  document with a thin client-side navigation/lightbox script.
- **NOT a multi-file build.** No `npm install`, no bundler, no SSG. There is no build step; the
  deliverable file IS the source.
- **NOT a donation processor.** It links out to the partner charity; it does not collect money.
- **NOT self-deploying.** Deployment is owned by the central **MindAttic.Deploy** pipeline (sibling
  repo), not by per-project scripts in this folder. (See [§4](#MAC-§4), [MAC-A1](AMENDMENTS.md#MAC-A1).)
- **NOT a CMS-driven blog.** New events are authored by copying the existing section template
  directly in `index.htm`.

## 4. Architecture canon {#MAC-§4}

```
                 ┌─────────────────────────────────────────────┐
                 │              index.htm  (one file)            │
                 │  ┌─────────┐  ┌──────────┐  ┌──────────────┐  │
                 │  │ <style> │  │  <main>  │  │   <script>   │  │
                 │  │ inlined │  │  3 .page │  │ hash router  │  │
                 │  │  CSS +  │  │ sections │  │ + lite-YT    │  │
                 │  │ base64  │  │ + in-page│  │   embed      │  │
                 │  │  fonts  │  │   TOC    │  │              │  │
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
                          static hosting @ mindatticcares.com
```

### 4.1 Projects / files
- **`index.htm`** — the entire deliverable: `<head>` (inlined `@font-face` base64 woff2 + `<style>`),
  `<header class="topbar">` nav, `<main>` with three `<section class="page">` blocks, and a single
  trailing `<script>`. (~681 KB, dominated by base64 font/image data.)
- **`README.md`** — how to build/run/deploy and edit.
- **`docs/`** — this Codex canon (BIBLE, AMENDMENTS, USER_STORIES, rfc).
- **`tools/codex.ps1`** — the doctor + digest CLI.
- **`.claude/`** — the deploy command, project skills, and the SessionStart digest hook.
- Deployment scripts (`deploy.ps1`/`deploy.bat`/`settings.json`) referenced in the README are
  **retired**; the FTP pipeline now lives in **MindAttic.Deploy**
  (see [`.claude/commands/deploy.md`](../.claude/commands/deploy.md), [MAC-A1](AMENDMENTS.md#MAC-A1)).

### 4.2 Domain model (NOUNS)
- **Page** — a top-level `<section class="page" id="...">`; one of `home`, `childs-play`, `y2k`.
  Exactly one is `.active` at a time.
- **Playbook section** — an `<h2 id="sec-..." class="sec">` block inside the Y2K page (19 sections:
  `sec-overview` … `sec-appendix`).
- **TOC** — the `<nav class="toc">` ordered list of links to the `sec-*` anchors.
- **Last-Updated stamp** — the leading `<!-- Last Updated: <ISO8601 UTC> -->` comment, rewritten by
  the deploy pipeline on each upload.
- **Lite-YT box** — a `.video[data-yt]` element that swaps to a YouTube iframe on click.

### 4.3 Key services (VERBS)
- **`show(name)`** — toggles `.active` on the matching `.page` and the matching `header nav a`,
  scrolls to top. Falls back to `home` for unknown names.
- **`fromHash()`** — routes from `window.location.hash`: `sec-*` anchors belong to the `y2k` page;
  bare page names select that page.
- **lite-YT `play()`** — replaces the poster with a `youtube-nocookie` iframe (or opens YouTube in a
  new tab under the `file:` protocol).
- **deploy** (external) — MindAttic.Deploy stamps the Last-Updated comment and FTPS-uploads
  `index.htm` to `/mindatticcares.com/`.

## 5. The Laws {#MAC-§5}

This project **inherits the org-wide House Rules** in
[`MindAttic.HouseRules.md`](../../MindAttic.HouseRules.md) by reference — they are not restated here.
Relevant inherited laws:
- **[HOUSE-LAW-1]** — whole-number versioning.
- **[HOUSE-LAW-3]** — credentials never committed (the retired `settings.json` is gitignored; FTP
  secrets live in `MindAttic.Deploy/secrets/`).
- **[HOUSE-LAW-8]** — definition of done is verified, not asserted (see [§8](#MAC-§8)).
- **[HOUSE-LAW-9]** — `psst` only on explicit request.

Project-specific laws:

### MAC-LAW-1 — One file, no build step {#MAC-LAW-1}
The entire site ships as a single `index.htm` with inlined CSS, JS, fonts, and images. No CDN,
no database, no bundler, no SSG, no `npm install`. The file you edit is the file you deploy.

### MAC-LAW-2 — 100% pass-through giving {#MAC-LAW-2}
Funds raised at an event go to the named partner charity directly. Operational cost is covered
separately by MindAttic LLC. The site never collects or processes donations itself.

### MAC-LAW-3 — Public-by-default playbooks {#MAC-LAW-3}
Every event's full playbook (timeline → venue → equipment → run-of-show → budget → sponsorship →
post-event) is published verbatim on the public page. Nothing operational is kept private.

### MAC-LAW-4 — Stable section IDs drive navigation {#MAC-LAW-4}
Pages use `<section class="page" id="...">` and playbook sections use `<h2 id="sec-..." class="sec">`.
The hash router, in-page TOC, and "back to contents" links all key off these IDs; renaming an ID is
a breaking change to navigation and must update every reference.

### MAC-LAW-5 — Deployment is centralized {#MAC-LAW-5}
Deployment is owned by **MindAttic.Deploy**, not by per-project scripts. The per-folder
`deploy.ps1`/`deploy.bat`/`settings.json` are retired; do not re-introduce a local FTP pipeline.

## 6. Verified state {#MAC-§6}

Domain class: **website** (static single-file site). There is **no automated test or build suite**
in this repo — by design (MAC-LAW-1, no build step). Verification is manual/structural.

Evidence gathered 2026-06-07:
- ✅ `index.htm` is well-formed: one `<head>`/`<style>`, three `<section class="page">` (`home`,
  `childs-play`, `y2k`), a 19-item TOC, and one trailing `<script>`. (structural grep)
- ✅ Hash router (`show`/`fromHash`) and lite-YT embed present and self-consistent with the page IDs.
- ✅ 19 playbook `sec-*` anchors exist and match the 19 TOC links.
- ✅ Centralized deploy wired: `.claude/commands/deploy.md` targets `MindAttic.Deploy --site
  mindatticcares.com`.
- 🟡 Live deploy / browser render **not** re-verified in this pass (no headless harness in-repo).
- ⬜ No linter, no HTML validator, no link-checker is run in CI (none configured).

Build/test command: **none** (`MAC-LAW-1`). Doctor (`tools/codex.ps1 doctor`) is the only
automated check this repo carries; it validates the Codex docs, not the site.

## 7. Active frontier {#MAC-§7}

- See [`docs/rfc/`](rfc/) for open design notes — currently [RFC 0001](rfc/0001-multi-event-playbooks.md)
  (scaling beyond one event on one page).
- See [USER_STORIES.md](USER_STORIES.md) epics: **A — Visitor reading the site**, **B — Charity
  forking a playbook**, **C — Maintainer publishing**.

## 8. Quality bar {#MAC-§8}

A change to MindAttic Cares is "done" when:
1. `index.htm` still opens correctly from `file://` and over HTTP (the three pages switch; the TOC
   anchors jump; the lite-YT box plays).
2. Every `sec-*` anchor referenced by the TOC or a "back to contents" link still exists
   (no dangling in-page links).
3. No new external runtime dependency, build step, or CMS was introduced (MAC-LAW-1).
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
