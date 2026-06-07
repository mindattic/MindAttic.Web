---
codex: 1
project: ryandebraal.com
code: RDC
layer: rfc
status: planned
updated: 2026-06-07
---

# RFC 0001 — Dependency-free in-browser smoke harness

## Problem

Every user story in [USER_STORIES.md](../USER_STORIES.md) is stuck at 🟡 because Codex reserves `✅`
for facts a test or build proves, and this project deliberately has neither
([BIBLE §6](../BIBLE.md#RDC-§6), [RDC-LAW-2](../BIBLE.md#RDC-LAW-2)). We want real regression
coverage — "all 15 themes mount, all 3 profiles render, export is non-empty, only one network
request" — without betraying the one-file / zero-dependency / no-build promise.

## Options compared

1. **Headless test runner (Playwright/Vitest + npm).** Mature, but introduces `package.json`,
   `node_modules`, and a toolchain — a direct violation of [RDC-LAW-2](../BIBLE.md#RDC-LAW-2). The
   harness would weigh more than the product. Rejected for shipping; acceptable only as an
   out-of-tree, never-committed dev convenience.
2. **In-page self-test block (dev-only, behind `?selftest=1`).** A small inline IIFE that, when the
   query flag is present, drives `setTheme`/`setProfile`/`exportMD` and asserts invariants to the
   console / a results panel. Zero new files, zero dependencies, runs in any browser. Touches
   `index.htm` (currently out of scope for this Codex pass).
3. **Sibling harness in MindAttic.Deploy or a separate dev repo.** Keeps this repo pristine; the
   deploy pipeline already loads the file and could assert on it. Out of tree, so it never affects
   the shipped artifact.

## Decision

Deferred. Document the intent now; implement later as **Option 2 or 3**. No code change is made in
this RFC. The Codex pass that introduced this RFC must not modify `index.htm`.

## What NOT to do

- Do **not** add `package.json` / a bundler / a test framework to this repo
  ([RDC-LAW-2](../BIBLE.md#RDC-LAW-2)).
- Do **not** split the harness into a separate shipped file
  ([RDC-LAW-1](../BIBLE.md#RDC-LAW-1)); if in-page, it stays inside `index.htm` behind a dev flag.
- Do **not** let the harness make any third-party network call
  ([RDC-LAW-3](../BIBLE.md#RDC-LAW-3)).

## Phased plan (with risk)

1. **Define invariants** (low risk): enumerate the 15 themes and 3 profiles, the localStorage keys,
   and "single request" as machine-checkable assertions.
2. **Prototype Option 2 behind `?selftest=1`** (medium risk: editing the single file; keep it dead
   code unless the flag is set).
3. **Wire to a runner** (medium risk): either a one-line headless check in MindAttic.Deploy or a
   manual checklist, producing a pass/fail signal.
4. **Promote stories** (low risk): once green, flip the relevant 🟡 stories to ✅ citing the
   harness.

## Graduates into

- [BIBLE §6 — Verified state](../BIBLE.md#RDC-§6) (replaces inspection-only evidence with a test).
- [USER_STORIES.md](../USER_STORIES.md) backlog items **RDC-US-F1** and **RDC-US-F2**.
