---
codex: 1
project: ryandebraal.com
code: RDC
layer: rfc
status: planned
updated: 2026-10-03
---

# RFC 0001 — Dependency-free in-browser smoke harness

## Problem

Every user story in [USER_STORIES.md](../USER_STORIES.md) is stuck at 🟡 because Codex reserves `✅`
for facts a test or build proves, and this project deliberately has neither
([BIBLE §6](../BIBLE.md#RDC-§6), [RDC-LAW-2](../BIBLE.md#RDC-LAW-2)). We want real regression
coverage — "all 16 themes mount, all 3 profiles render, export is non-empty, no request leaves the
[RDC-LAW-3](../BIBLE.md#RDC-LAW-3) allow-list" — without betraying the one-page / zero-dependency /
no-build promise. The MindAttic.Web.Shared Playwright suite (`MindAttic.Web.Shared/tests`, next to this folder in MindAttic.Web) already
covers asset loading, the host allow-list at page load, three themes, the lightbox and on-demand PDF
loading; it does not cover every theme, every profile or export output.

## Options compared

1. **Headless test runner (Playwright/Vitest + npm).** Mature, but introduces `package.json`,
   `node_modules`, and a toolchain — a direct violation of [RDC-LAW-2](../BIBLE.md#RDC-LAW-2). The
   harness would weigh more than the product. Rejected in this site's folder; acceptable outside it,
   which is where the MindAttic.Web.Shared suite lives.
2. **In-page self-test block (dev-only, behind `?selftest=1`).** A small inline IIFE that, when the
   query flag is present, drives `setTheme`/`setProfile`/`exportMD` and asserts invariants to the
   console / a results panel. Zero new files, zero dependencies, runs in any browser. Touches
   `index.htm`.
3. **Sibling harness in MindAttic.Deploy or the shared test suite.** Keeps this folder pristine; the
   deploy pipeline already loads the file and could assert on it. Outside the site folder, so it never affects
   the shipped artifact.

## Decision

Not yet decided. Lean toward **Option 3** — extend the MindAttic.Web.Shared Playwright suite to cover all
16 themes, all 3 profiles and export output — with Option 2 as the fallback.

## What NOT to do

- Do **not** add `package.json` / a bundler / a test framework to this site folder
  ([RDC-LAW-2](../BIBLE.md#RDC-LAW-2)).
- Do **not** ship the harness as a separate page or asset
  ([RDC-LAW-1](../BIBLE.md#RDC-LAW-1)); if in-page, it stays inside `index.htm` behind a dev flag.
- Do **not** let the harness make any third-party network call
  ([RDC-LAW-3](../BIBLE.md#RDC-LAW-3)).

## Phased plan (with risk)

1. **Define invariants** (low risk): enumerate the 16 themes and 3 profiles, the localStorage keys,
   and the host allow-list as machine-checkable assertions.
2. **Prototype Option 2 behind `?selftest=1`** (medium risk: editing the single file; keep it dead
   code unless the flag is set).
3. **Wire to a runner** (medium risk): either a one-line headless check in MindAttic.Deploy or a
   manual checklist, producing a pass/fail signal.
4. **Promote stories** (low risk): once green, flip the relevant 🟡 stories to ✅ citing the
   harness.

## Graduates into

- [BIBLE §6 — Verified state](../BIBLE.md#RDC-§6) (replaces inspection-only evidence with a test).
- [USER_STORIES.md](../USER_STORIES.md) backlog items **RDC-US-F1** and **RDC-US-F2**.
