# MindAttic Cares

**Charity work, in public, with the receipts attached.**

MindAttic Cares is the philanthropic arm of MindAttic LLC — the place where we organize, document, and execute the events and giving campaigns we run for causes we believe in. The site at **[mindatticcares.com](https://mindatticcares.com/)** is one self-contained HTML file: every initiative on it is fully drafted in public, complete with timelines, budgets, vendor lists, and post-event wrap-ups, so anyone can copy what worked and skip what didn't.

The flagship initiative is the **Child's Play** track — running an annual fundraising event that goes 100% to [childsplaycharity.org](https://childsplaycharity.org/), the gaming community's children's-hospital charity. The first event in that track is **Y2K: End of the World Party**, a 12-week-planned, 1999-themed dance event for the millennial demographic, with the full event playbook (timeline → venue → equipment → run-of-show → budget → sponsorship → post-event) published on the site.

**Why MindAttic Cares:**

- **Public-by-default planning.** Every event has its full playbook on the public site — venue selection, permits, equipment sourcing, floor plan, staffing, run-of-show, budget, sponsorship pitch deck, marketing, compliance, decor plan. No proprietary checklists kept behind a paywall.
- **100% pass-through giving.** Funds raised at every event go to a named partner charity directly. Operational costs are covered separately by MindAttic LLC; donors are not paying for our overhead.
- **One file, no CMS.** The entire site is `index.htm` — inlined CSS, inlined JS, base64-inlined fonts and images. No CDN, no database, no static-site generator. Anyone can fork it, edit a copy in a text editor, and host their own version of an event playbook.
- **Reusable templates.** The 12-week planning timeline, the budget worksheet, the sponsorship pitch structure, the volunteer staffing model — all designed as templates a sibling charity can drop into their own event.

---

## Table of Contents

- [Canonical documentation (Codex)](#canonical-documentation-codex)
- [What's on the site](#whats-on-the-site)
- [Stack](#stack)
- [Repository layout](#repository-layout)
- [How index.htm works](#how-indexhtm-works)
- [Tooling](#tooling)
- [Deploying](#deploying)
- [Editing the site](#editing-the-site)
- [Claude Code project setup](#claude-code-project-setup)
- [Related](#related)

---

## Canonical documentation (Codex)

This repo follows the MindAttic "Codex" documentation standard: a layered set of docs under
`docs/` is the source of truth for what the project IS and the rules that govern it. This README is
the "how to work here" layer; it links to canon rather than duplicating it.

| Layer | File | What it holds |
|---|---|---|
| L0 — Bible | [docs/BIBLE.md](docs/BIBLE.md) | What MindAttic Cares IS / is NOT, architecture, the Laws (`MAC-LAW-*`), verified state, glossary. Section IDs `{#MAC-§N}`. |
| L1 — Amendments | [docs/AMENDMENTS.md](docs/AMENDMENTS.md) | Append-only change log (`MAC-A<n>`); an amendment **wins** over the bible. Currently one entry: [MAC-A1](docs/AMENDMENTS.md#MAC-A1), retiring the per-project deploy pipeline in favor of MindAttic.Deploy. |
| L2 — User stories | [docs/USER_STORIES.md](docs/USER_STORIES.md) | Stories `MAC-US-<Epic><n>` across three epics (Visitor reading the site / Charity forking a playbook / Maintainer publishing). All currently 🟡 — see below. |
| rfc | [docs/rfc/](docs/rfc/) | Design notes; graduate into the bible + stories once decided. Currently [RFC 0001](docs/rfc/0001-multi-event-playbooks.md) — how to scale past one event on one page. |
| GENERATED | [docs/BIBLE.digest.md](docs/BIBLE.digest.md) | Produced by `tools/codex.ps1 digest`; injected at Claude Code session start via `.claude/hooks/inject-digest.ps1`. Never hand-edit. |
| Org laws | [`MindAttic.HouseRules.md`](../MindAttic.HouseRules.md) | Inherited by reference from BIBLE §5 (whole-number versioning, credential handling, verified-done, `psst` policy). |

**Why every story is held at 🟡 instead of ✅:** this repo has **no automated test or build suite by
design** ([MAC-LAW-1](docs/BIBLE.md#MAC-LAW-1) — one file, no build step). Per the inherited
HOUSE-LAW-8 ("verified done, not asserted"), a story can only be marked ✅ once it cites an
automated test — and the only automated check in this repo is `tools/codex.ps1 doctor`, which
validates the *documentation*, not the site itself. So behavior that is present and manually
observable (the hash router, the TOC, the lite-YouTube embed, the deploy wiring) is still held at
🟡 until something automated proves it. See [docs/USER_STORIES.md](docs/USER_STORIES.md) for the
full list and the priority backlog (an anchor/link checker and an HTML/a11y CI pass are both
queued but not built).

## What's on the site

| Section | Content |
|---|---|
| MindAttic Cares (intro) | Who we are and why we run these events. |
| Child's Play | The pass-through giving track. Why this charity, how funds flow, partnership details, an inline "lite" YouTube intro video. |
| Y2K: End of the World Party | Full 19-section event playbook for the inaugural fundraiser — overview & goals, how to use this playbook, 12-week planning timeline, venue/permits/insurance, equipment & vendors, floor plan & power, staffing & volunteers, the show (countdown & blackout), event-day run of show, budget & cost estimates, sponsorship & fundraising, marketing & comms, compliance & risk, experience design & décor, "The World of 1999" cultural brief, show assets & scripts, post-event wrap, master checklists, appendices. |

Each subsequent event will be drafted on the same page in the same structure so the audience (and
any sibling charity looking for a template) gets a consistent read. See
[RFC 0001](docs/rfc/0001-multi-event-playbooks.md) for the plan on how a second event will be added
without breaking the current single-file, single-page-per-event model.

## Stack

| Layer | Technology |
|---|---|
| **Front-end** | Single self-contained `index.htm` (~681 KB) — inlined `<style>` CSS, inlined `<script>` JavaScript, base64-inlined `@font-face` webfonts. No external images referenced at time of writing; the video section uses a click-to-load ("lite") YouTube embed rather than an inline asset. |
| **Hosting** | Static hosting at [mindatticcares.com](https://mindatticcares.com/) (no server-side code, no database) |
| **Deploy** | Centralized via **MindAttic.Deploy** (sibling repo) — see [Deploying](#deploying) |
| **Docs tooling** | `tools/codex.ps1` (PowerShell 5.1, no external deps) — validates and regenerates the Codex docs only; does not touch `index.htm` |

No build step. No `npm install`. No CMS. Open the file in any modern browser and you have the
whole site.

## Repository layout

```
mindatticcares.com/
├── index.htm              # The entire site — one self-contained HTML file (~681 KB)
├── README.md               # ← you are here
├── README.htm              # Generated from README.md via tools/build-readme.ps1 (shared engine)
├── docs/
│   ├── BIBLE.md            # L0 canon — what the project IS, architecture, the Laws
│   ├── AMENDMENTS.md        # L1 canon — append-only change log (MAC-A<n>)
│   ├── USER_STORIES.md     # L2 canon — stories MAC-US-<Epic><n>
│   ├── BIBLE.digest.md     # GENERATED digest of BIBLE.md — never hand-edit
│   └── rfc/
│       └── 0001-multi-event-playbooks.md
├── tools/
│   ├── codex.ps1           # doctor + digest CLI for the Codex docs
│   └── build-readme.ps1    # Thin wrapper -> shared codex-standard/build-readme.ps1 engine
└── .claude/
    ├── settings.json       # Statusline + SessionStart hooks (digest inject, checkpoint restore)
    ├── statusline.ps1      # Context-window usage gauge shown in the Claude Code status line
    ├── commands/
    │   ├── checkpoint.md   # /checkpoint — snapshot the live discussion for /clear handoff
    │   └── deploy.md       # /deploy — invoke MindAttic.Deploy for this site
    ├── hooks/
    │   ├── inject-digest.ps1     # SessionStart: injects docs/BIBLE.digest.md into context
    │   └── restore-handoff.ps1   # SessionStart (matcher: clear): re-ingests checkpoint.md, then deletes it
    └── skills/
        ├── commit/         # Project skill: stage/commit/push working-tree changes
        ├── discard/        # Project skill: discard working-tree changes
        ├── revert/         # Project skill: revert a prior commit
        └── run/             # Project skill: run/preview the site
```

> `deploy.ps1` / `deploy.bat` / a per-folder `settings.json` are **retired**. The FTP pipeline now
> lives in **MindAttic.Deploy** (see [MAC-A1](docs/AMENDMENTS.md#MAC-A1) and
> [Deploying](#deploying)).

## How index.htm works

The full architectural writeup lives in [BIBLE §4](docs/BIBLE.md#MAC-§4); the short version:

- **Three pages, one file.** `<main>` holds three `<section class="page" id="...">` blocks —
  `home`, `childs-play`, `y2k` — and exactly one carries the `.active` class at a time.
- **Hash router.** A single trailing `<script>` block implements `show(name)` (toggles `.active` on
  the matching page and nav link, scrolls to top) and `fromHash()` (routes from
  `window.location.hash`: bare page names like `#childs-play` select that page directly; anchors
  prefixed `sec-` — e.g. `#sec-budget` — are treated as belonging to the `y2k` playbook and select
  that page before the browser's own anchor scroll takes over).
- **In-page TOC.** The Y2K page carries a `<nav class="toc">` linking to all 19 `<h2 id="sec-*"
  class="sec">` playbook sections; each section also has a "↑ Back to contents" link
  (`class="back-top" data-page="y2k"`) back to the top of the playbook.
- **Lite-YouTube embed.** The Child's Play intro video is a `.video[data-yt="<id>"]` poster that,
  on click/Enter, swaps itself for a `youtube-nocookie.com` iframe — or, if the page is opened over
  `file://` (where the iframe would be blocked), opens the video in a new tab instead.
- **Last-Updated stamp.** The file's first line is `<!-- Last Updated: <ISO8601 UTC> -->`, rewritten
  by the MindAttic.Deploy pipeline on every deploy — not by hand.

Per [MAC-LAW-4](docs/BIBLE.md#MAC-LAW-4), the `id="..."` values on pages and `sec-*` headers are
load-bearing: the router, the TOC, and every "back to contents" link key off them, so renaming one
is a breaking navigation change that must update every reference.

## Tooling

`tools/` holds two independent PowerShell scripts. Neither has an npm/build dependency; both run
directly with Windows PowerShell 5.1 or PowerShell 7+.

| Script | Purpose |
|---|---|
| `tools/codex.ps1` | Codex documentation CLI. `doctor` validates `docs/` (front-matter, stable IDs, cross-references, cited tests/paths, digest freshness) and exits non-zero on any hard error. `digest` regenerates `docs/BIBLE.digest.md` from BIBLE §1/§3/§5/§9 plus a user-story status index and the latest amendment head. |
| `tools/build-readme.ps1` | Thin wrapper that regenerates `README.htm` from `README.md`. The actual Markdown → HTML translation logic lives once, workspace-wide, in the sibling `codex-standard/build-readme.ps1` engine — every MindAttic repo's wrapper calls the same shared engine so all `README.htm` output looks and behaves identically. This repo's copy contains no rendering logic of its own; edit the shared engine to change output, not this wrapper. |

```powershell
# Validate the Codex docs (exit 0 required before committing doc changes)
powershell -NoProfile -ExecutionPolicy Bypass -File tools\codex.ps1 doctor

# Regenerate docs/BIBLE.digest.md after editing BIBLE §1/§3/§5/§9 or adding an amendment
powershell -NoProfile -ExecutionPolicy Bypass -File tools\codex.ps1 digest

# Regenerate README.htm from README.md
powershell -NoProfile -ExecutionPolicy Bypass -File tools\build-readme.ps1
```

`README.htm` and `index.htm` are separate, unrelated files: `index.htm` is the deployed site;
`README.htm` is a local, generated rendering of this README for convenient viewing and is not part
of the deployed site.

## Deploying

> **Per-project deploy scripts are retired.** `deploy.bat`, `deploy.ps1`, and a per-folder
> `settings.json` no longer exist in this folder. See [MAC-A1](docs/AMENDMENTS.md#MAC-A1) for the
> migration history.

Deployment is owned by the central **MindAttic.Deploy** sibling repo. Use the `/deploy` Claude
command, or run:

```powershell
cd D:\Projects\MindAttic\MindAttic.Deploy
npm run deploy -- --site mindatticcares.com
```

This site is registered as a verbatim root-site FTP upload in `MindAttic.Deploy/projects.json` under
`sites[]`, with `sourceDir: "../mindatticcares.com"`, `ftpRemotePath: "/mindatticcares.com"`, and
`files: ["index.htm"]`. The pipeline stamps `index.htm` with a fresh
`<!-- Last Updated: <ISO8601 UTC> -->` comment and FTPS-uploads it. FTP credentials are centralized
in `MindAttic.Deploy/secrets/` (gitignored there, not read from this repo).

## Editing the site

Open `index.htm` in any editor. Sections are demarcated by `<h2 id="sec-*" class="sec">` headers
(e.g. `sec-overview`, `sec-timeline`, `sec-budget`) — the in-page TOC and hash router are wired to
those IDs. The CSS palette and event-playbook layout live in the `<style>` block near the top of the
file; the client-side JavaScript is small and lives in the single `<script>` block at the very
bottom (see [How index.htm works](#how-indexhtm-works)).

When adding a new event:

1. Add a new `<section class="page" id="...">` / `<h1>` block at the relevant insertion point.
2. Copy the section template (`<h2 id="sec-...">` cards) from the existing Y2K playbook.
3. Update the in-page TOC (`<nav class="toc">`) and the top nav (`<header class="topbar"><nav>`).
4. Namespace new `sec-*` IDs per event to avoid anchor collisions with the existing Y2K playbook
   (see [RFC 0001](docs/rfc/0001-multi-event-playbooks.md) for the agreed approach once a second
   event lands).
5. Deploy via MindAttic.Deploy (see [Deploying](#deploying)).

## Claude Code project setup

This repo carries a `.claude/` directory used by Claude Code sessions working in it:

- **`settings.json`** wires a statusline (`statusline.ps1`, a context-window usage gauge) and two
  `SessionStart` hooks: `inject-digest.ps1` (always — injects `docs/BIBLE.digest.md`) and
  `restore-handoff.ps1` (only on `/clear` — re-ingests a `checkpoint.md` transcript written by
  `/checkpoint`, then deletes it so later `/clear`s stay clean).
- **`commands/`** holds two slash commands: `/checkpoint` (snapshot the live discussion before a
  `/clear`) and `/deploy` (invoke MindAttic.Deploy for this site, see [Deploying](#deploying)).
- **`skills/`** holds four project-scoped skills: `commit`, `discard`, `revert`, and `run`.

None of this affects the deployed site — it only shapes how an AI coding session behaves inside the
repo.

## Related

- **Child's Play** — [childsplaycharity.org](https://childsplaycharity.org/) — the children's-hospital charity that receives our Y2K event proceeds.
- **MindAttic LLC** — [mindattic.com](https://mindattic.com/) — the parent organization that funds the operational side so 100% of donations pass through to the partner charity.
- **MindAttic.Deploy** (sibling repo) — owns the FTPS deploy pipeline for this and other MindAttic sites.
