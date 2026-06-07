---
codex: 1
project: ryandebraal.com
code: RDC
layer: amendments
status: living
updated: 2026-06-07
---

# ryandebraal.com — Amendments (append-only; amendment wins over the bible)

> Append only. Never rewrite an amendment — supersede it with a new one. Beyond ~25, fold into
> [BIBLE.md](BIBLE.md) and start a new epoch (note the git tag); history stays in git.

## RDC-A1 — Adopt the Codex documentation standard (supersedes —)

**What changed:** Installed the MindAttic Codex canonical-documentation layout for this repo:
`docs/BIBLE.md` (L0), `docs/AMENDMENTS.md` (L1), `docs/USER_STORIES.md` (L2), `docs/rfc/` (design
notes), `tools/codex.ps1` (doctor + digest), and a `SessionStart` hook injecting
`docs/BIBLE.digest.md`.

**Why:** Give the single-file site a real source of truth and the same documentation discipline as
the rest of MindAttic, without touching `index.htm` or any shipped content.

**Migration:** None — the repo had no prior canon docs (`docs/`, `ARCHITECTURE.md`, etc.). The
existing `README.md` (build/run) and project `CLAUDE.md` (work rules) are unchanged; `CLAUDE.md`
gains a Codex pointer section. The org-wide
[MindAttic.HouseRules.md](../../MindAttic.HouseRules.md) is inherited by reference, not copied.

**Domain decision:** Classed as `website`; per Codex Phase 2 no L5 `docs/data/*.json` was created —
the only structured content (the `D` resume object and `tooltips` map) lives in `index.htm`, and
extracting it would duplicate source and violate [RDC-LAW-1](BIBLE.md#RDC-LAW-1)/
[RDC-LAW-5](BIBLE.md#RDC-LAW-5).

## RDC-A2 — Codex full-sync: dark theme, export expansion, deploy drift (supersedes RDC-A1 §4 details)

**What changed (2026-06-07 inspection of `index.htm`):**

1. **Theme count: 15 → 16.** A `dark` theme (`[data-theme="dark"]`) was added to the toolbar and
   CSS since the initial Codex install. All docs now read "16 themes"; theme list updated to include
   `dark`. `startDark` FX function does not exist — the dark theme has no bespoke canvas animation
   (static CSS-only, like `light` and `noir`).

2. **Export function inventory expanded.** `index.htm` now exposes `exportHTML()` (self-contained
   HTML download) and four named `runPdfExport` wrappers (`exportPDF`, `exportPrintPage`,
   `exportPrintDocument`, `exportPrintCV`) beyond the original `exportMD`/`printResume`/
   `runPdfExport`. BIBLE §4.3 and the architecture diagram updated to reflect the full inventory.

3. **Line count: ~6.9K → ~6.5K.** The architecture diagram comment updated; `index.htm` is 6,532
   lines as of this sync.

4. **README deploy section corrected.** `README.md` cited the retired `.\deploy.ps1` +
   `settings.json` approach. Updated to reference the MindAttic.Deploy skill per
   [RDC-LAW-6](BIBLE.md#RDC-LAW-6); no new files created.

**Migration:** Docs-only. No `index.htm` or source changes.
