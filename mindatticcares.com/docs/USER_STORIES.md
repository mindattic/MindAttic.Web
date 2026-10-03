---
codex: 1
project: MindAttic Cares
code: MAC
layer: stories
status: living
updated: 2026-10-02
---

# MindAttic Cares — User Stories

> ✅ done (shipped & tested) · 🟡 partial · ⬜ planned · 🗑️ cut. Every ✅ cites the test.
>
> **Note on verification:** this repo has no automated test or build suite by design
> ([MAC-LAW-1](BIBLE.md#MAC-LAW-1) — no build step). Per [HOUSE-LAW-8], stories that
> cannot cite an automated test are held at 🟡 even when the behavior is present and manually
> observed. The only automated check in-repo is `tools/codex.ps1 doctor` (docs, not the site).

## Epic A — Visitor reading the site

- **MAC-US-A1 ✅** (verified by `MindAttic.UiUx/tests/specs/sites/mindatticcares.spec.mjs`) As a visitor, I can switch between the MindAttic Cares, Child's Play, and Y2K
  pages from the top nav, so I can find the content I want. *Given the loaded site, When I click a
  nav link, Then exactly that `.page` becomes `.active` and the URL hash updates.*
  *(test: MindAttic.UiUx `tests/specs/sites/mindatticcares.spec.mjs` — "navigation switches pages,
  updates the hash, and fetches that page's art on demand"; passed 2026-10-02.)*
- **MAC-US-A2 🟡** As a visitor on the Y2K page, I can jump to any of the 19 playbook sections via
  the in-page Table of Contents, so I can navigate the long playbook. *Given the Y2K page, When I
  click a TOC entry, Then the page scrolls to the matching `#sec-*` anchor.*
  *(19 `sec-*` anchors match the 19 TOC links — structural grep; TOC click and "Back to contents"
  (→ `#contents`) checked by hand in Chrome on 2026-10-02; no automated test, held 🟡.)*
- **MAC-US-A3 ✅** (verified by `MindAttic.UiUx/tests/specs/sites/mindatticcares.spec.mjs`) As a visitor, I can play the Child's Play intro video inline without it loading
  on page open, so the page stays light. *Given the poster, When I click/Enter it, Then a
  `youtube-nocookie` iframe replaces it (or YouTube opens in a new tab under `file://`).*
  *(test: MindAttic.UiUx `tests/specs/sites/mindatticcares.spec.mjs` — "the video is click-to-play: no
  YouTube request until the poster is clicked"; passed 2026-10-02.)*
- **MAC-US-A4 ✅** (verified by `MindAttic.UiUx/tests/specs/sites/mindatticcares.spec.mjs`) As a visitor opening a shared `#sec-budget`-style link, I land on the Y2K page at
  that section. *Given an in-page anchor hash, When the page loads, Then `fromHash()` selects the page
  that contains it and the anchor is scrolled into view.* *(test: MindAttic.UiUx
  `tests/specs/sites/mindatticcares.spec.mjs` — "deep links work: #y2k and an in-page anchor
  (#sec-budget) open the Y2K playbook"; passed 2026-10-02. The scroll position was checked by hand in
  Chrome. A hash after the bare forwarded domain does not reach the page — see README "Where it is
  served".)*
- **MAC-US-A5 ✅** (verified by `MindAttic.UiUx/tests/specs/sites/mindatticcares.spec.mjs`) As a visitor, I get the page text immediately while fonts and images stream in, so
  the site feels fast. *Given the page, When it loads, Then fonts/logos/photos are fetched from the
  pinned jsDelivr package ([MAC-A2](AMENDMENTS.md#MAC-A2)), below-the-fold images load lazily, and
  `index.htm` itself is ~60 KB.* *(tests: MindAttic.UiUx `tests/specs/sites/mindatticcares.spec.mjs` —
  "first paint (Home) fetches only the Home art, the icon, the background and the Outfit latin font";
  `common.spec.mjs` — "loads cleanly…" and "no embedded base64 blobs…"; live: `cdn.live.spec.mjs`;
  all passed 2026-10-02.)*

## Epic B — Charity forking a playbook

- **MAC-US-B1 🟡** As a sibling charity, I can fork `index.htm` and edit a copy in any text editor
  with no toolchain, so I can reuse the playbook. *Given the single page, When I open it in a
  browser, Then the whole site renders with no build step or database (fonts and images load from the
  pinned jsDelivr package).*
  *(MAC-LAW-1 + [MAC-A2](AMENDMENTS.md#MAC-A2) hold: no build step; the only external runtime dependency
  is the tag-pinned MindAttic.UiUx jsDelivr package, plus the click-to-load YouTube embed; no
  automated test, held 🟡.)*
- **MAC-US-B2 🟡** As a sibling charity, I can lift the 12-week timeline, budget worksheet,
  sponsorship pitch, and staffing model as templates. *Given the Y2K playbook, When I copy the
  relevant `sec-*` sections, Then I have a reusable event plan.*
  *(content present: `sec-timeline`, `sec-budget`, `sec-sponsorship`, `sec-staffing`; held 🟡.)*

## Epic C — Maintainer publishing

- **MAC-US-C1 ✅** (verified by `MindAttic.Deploy/test/linked.test.js`) As a maintainer, I can deploy the site with one command via MindAttic.Deploy, so
  the live site updates and gets a fresh Last-Updated stamp. *Given a change, When I run
  `npm run deploy -- --site mindatticcares.com`, Then the whole linked group deploys: the UiUx asset
  tag is published and verified on the CDN, and `index.htm` is stamped and FTPS-uploaded.*
  *(tests: MindAttic.Deploy `test/linked.test.js`; exercised for real on 2026-10-02 (`@V7`, 1 file
  uploaded, live page verified). See [MAC-A1](AMENDMENTS.md#MAC-A1), [MAC-A3](AMENDMENTS.md#MAC-A3).)*
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
