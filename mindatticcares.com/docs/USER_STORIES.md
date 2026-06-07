---
codex: 1
project: MindAttic Cares
code: MAC
layer: stories
status: living
updated: 2026-06-07
---

# MindAttic Cares — User Stories

> ✅ done (shipped & tested) · 🟡 partial · ⬜ planned · 🗑️ cut. Every ✅ cites the test.
>
> **Note on verification:** this repo has no automated test or build suite by design
> ([MAC-LAW-1](BIBLE.md#MAC-LAW-1) — one file, no build step). Per [HOUSE-LAW-8], stories that
> cannot cite an automated test are held at 🟡 even when the behavior is present and manually
> observed. The only automated check in-repo is `tools/codex.ps1 doctor` (docs, not the site).

## Epic A — Visitor reading the site

- **MAC-US-A1 🟡** As a visitor, I can switch between the MindAttic Cares, Child's Play, and Y2K
  pages from the top nav, so I can find the content I want. *Given the loaded site, When I click a
  nav link, Then exactly that `.page` becomes `.active` and the URL hash updates.*
  *(behavior present: `show()`/`fromHash()` hash router in `index.htm` `<script>`; no automated UI
  test in-repo, held 🟡 per HOUSE-LAW-8.)*
- **MAC-US-A2 🟡** As a visitor on the Y2K page, I can jump to any of the 19 playbook sections via
  the in-page Table of Contents, so I can navigate the long playbook. *Given the Y2K page, When I
  click a TOC entry, Then the page scrolls to the matching `#sec-*` anchor.*
  *(19 `sec-*` anchors match the 19 TOC links — structural grep; no automated test, held 🟡.)*
- **MAC-US-A3 🟡** As a visitor, I can play the Child's Play intro video inline without it loading
  on page open, so the page stays light. *Given the poster, When I click/Enter it, Then a
  `youtube-nocookie` iframe replaces it (or YouTube opens in a new tab under `file://`).*
  *(lite-YT `play()` present in `<script>`; no automated test, held 🟡.)*
- **MAC-US-A4 🟡** As a visitor opening a shared `#sec-budget`-style link, I land on the Y2K page at
  that section. *Given a `#sec-*` hash, When the page loads, Then `fromHash()` selects the `y2k`
  page.* *(routing logic present in `fromHash`; no automated test, held 🟡.)*

## Epic B — Charity forking a playbook

- **MAC-US-B1 🟡** As a sibling charity, I can fork `index.htm` and edit a copy in any text editor
  with no toolchain, so I can reuse the playbook. *Given the single file, When I open it in a
  browser, Then the whole site renders with no build/CDN/database.*
  *(MAC-LAW-1 holds: zero external runtime deps beyond fonts inlined as base64; no automated test,
  held 🟡.)*
- **MAC-US-B2 🟡** As a sibling charity, I can lift the 12-week timeline, budget worksheet,
  sponsorship pitch, and staffing model as templates. *Given the Y2K playbook, When I copy the
  relevant `sec-*` sections, Then I have a reusable event plan.*
  *(content present: `sec-timeline`, `sec-budget`, `sec-sponsorship`, `sec-staffing`; held 🟡.)*

## Epic C — Maintainer publishing

- **MAC-US-C1 🟡** As a maintainer, I can deploy the site with one command via MindAttic.Deploy, so
  the live site updates and gets a fresh Last-Updated stamp. *Given a change, When I run
  `npm run deploy -- --site mindatticcares.com`, Then `index.htm` is stamped and FTPS-uploaded.*
  *(wired in `.claude/commands/deploy.md`; see [MAC-A1](AMENDMENTS.md#MAC-A1). External pipeline,
  not exercised in this repo's pass, held 🟡.)*
- **MAC-US-C2 🟡** As a maintainer, I can add a new event by copying the section template and
  updating the TOC, so each event reads consistently. *Given the existing playbook, When I add a
  new `<h1>`/`sec-*` block and update the TOC, Then navigation stays consistent (MAC-LAW-4).*
  *(documented in README "Editing the site"; held 🟡.)*

## Priority backlog

1. **MAC-US-A1 / A2** — solidify navigation correctness; this is the site's core interaction.
2. **MAC-US-C2** — multi-event authoring ergonomics → see [RFC 0001](rfc/0001-multi-event-playbooks.md).
3. ⬜ **MAC-US-D1** — automated link/anchor checker (verify every TOC/`back-top` link resolves)
   so navigation stories can graduate from 🟡 to ✅ with a citable check.
4. ⬜ **MAC-US-D2** — HTML validation / a11y pass in CI.

### Audit log

No stories have been changed since creation; nothing to preserve here yet. (When a story's ask
changes, record the original verbatim here marked "(original spec — audit log)".)
