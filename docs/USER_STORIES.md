---
codex: 1
project: MindAttic.Web
code: M.WEB
layer: stories
status: living
updated: 2026-10-12
---
<!-- GENERATED from MindAttic.Tickets/data/Tickets.db by `tickets db render`. Do not edit: this file is rewritten from the database; change stories and tickets with the tickets CLI. -->

# MindAttic.Web — User Stories
> ✅ done (shipped & tested) · 🟡 partial · ⬜ planned. Every ✅ cites the test.

## Priority backlog
_Nothing recorded yet._

## Tickets
> Permanent log of every change and fix — this repo's ticket system. Rows are append-only: never
> delete or reword one; only move its Status (open → closed / wont-do) and fill in Ref. Status is
> a word, not a glyph, so tickets don't count toward the story index. Keep this section last.

| ID | Date | Type | Status | Summary | Ref |
|---|---|---|---|---|---|
| M.WEB-T1 | 2026-10-12 | docs | closed | Start the permanent ticket log in USER_STORIES.md | — |
| M.WEB-T2 | 2026-10-13 | feature | closed | ryandebraal.com rebuilt with the slower Sand theme; capture.ps1 launches the Browser's deploy.bat (launch.bat no longer exists) | ryandebraal.com/index.htm, capture.ps1 |
| M.WEB-T3 | 2026-10-13 | chore | closed | Pages rebuilt with the default-tag site build: stamp lines take the page's line endings, Cyberspace banner no longer mentions cdnTag | MindAttic.Components build-sites.mjs |
| M.WEB-T4 | 2026-10-13 | feature | open | ryandebraal.com: replace the toolbar buttons' native title tooltips with the MindAttic.Components Tooltip component | web/components/Tooltip |
| M.WEB-T5 | 2026-10-15 | chore | closed | Remove duplicate command copies (/quickload, /quicksave) from all four sites, now centralized at the user level (~/.claude/commands) | M.FLOW-T14 |
| M.WEB-T6 | 2026-10-16 | chore | closed | install.ps1 adds this repo's 15 .prose/commands stubs for the shared global commands, so any LLM client finds them | mindattic-agent-standard/install.ps1 run 2026-10-16 |
| M.WEB-T7 | 2026-10-16 | chore | closed | Bug hunt: run an exhaustive /bughunt over the whole repo and fix every real bug found (each fix under its own fix ticket), then hunt again; close this only when a full pass finds nothing | 47f4a9c83d718388388b22546534b7ce49a2f3ac |
| M.WEB-T8 | 2026-10-16 | chore | wont-do | Run the full unit test suite and fix every failure (each under its own fix ticket) until it passes; put the passing run in --ref. No test project: close this wont-do saying so | portfolio reset: repo-sweep test loop; tests live in MindAttic.Components |
| M.WEB-T9 | 2026-10-16 | chore | wont-do | Clean up code and docs: remove dead code, stale comments and outdated or duplicated docs, and simplify where behaviour doesn't change (/simplify); tests stay green | portfolio reset: generic cleanup, audit nice-to-have |
| M.WEB-T10 | 2026-10-16 | docs | closed | Bring README.md up to date with the code as it is now (what it is, setup, usage, commands, current state), following codex-standard/README-STYLE.md; README.htm regenerated if the repo has one | already done: README.md current (c9def19, 258fcca) |
| M.WEB-T11 | 2026-10-18 | docs | closed | Update USER_STORIES.md | — |
| M.WEB-T12 | 2026-10-19 | chore | wont-do | Convert tracked source files to LF line endings via .gitattributes, per HOUSE-LAW-13 (low priority) | — |
| M.WEB-T13 | 2026-10-20 | chore | open | ryandebraal.com: use the Tag component's tip script. After the next MindAttic.Components tag, rebuild (build-sites ryandebraal.com) so the TAG block carries tag.js, then replace the hand-written skill-tooltip placement in init() (lazy inject + flip below + clamp + --tt-arrow-x) with MindAtticTag.init({ selector: '.tag', tip: el => inner HTML of buildTooltip(el.dataset.skill), tipClass: 'tag-tooltip', onShow: the familiarity-bar lerp }); buildTooltip returns only the inner spans. Keep the mouseleave lerp cancel. (from M.COMP-T4) | — |
| M.WEB-T14 | 2026-10-20 | docs | closed | Publish MindAttic.Web docs to GitHub Pages via the shared Agency DocFX pipeline: run adopt-docs-site.ps1 (README.md as home page, docs/*.md as articles, API reference only where the code builds in CI), enable Pages with build_type=workflow, set the repo homepage URL, retire tools/build-readme.ps1 and README.htm, confirm the docs Actions run is green and https://mindattic.github.io/MindAttic.Web/ returns 200. Depends on MAT-T8. This is a static site: the Pages site is docs only and must not replace or clash with its real hosting (check MindAttic.Deploy first). | — |
| M.WEB-T15 | 2026-10-22 | docs | closed | Update USER_STORIES.md | — |
| M.WEB-T16 | 2026-10-24 | docs | closed | Update USER_STORIES.md | — |
| M.WEB-T17 | 2026-11-02 | docs | closed | Adopt MindAttic.Agency docs-site pipeline, publish README to GitHub Pages (HOUSE-LAW-14) | — |
| M.WEB-T18 | 2026-11-02 | fix | closed | Bughunt sweep, two passes: find and fix real bugs across tracked source (user request 2026-11-02) | — |
| M.WEB-T19 | 2026-11-02 | fix | closed | Fix the open items the 2026-11-02 bughunt left for decision (mindatticcares digest refresh, deploy.md $source pointers) | — |
| M.WEB-T20 | 2026-11-10 | chore | closed | Crash recovery: commit the command-catalog sync (.agent/commands/*.md) and regenerated docs/USER_STORIES.md left uncommitted by the session crash | — |
| M.WEB-T21 | 2026-11-10 | chore | closed | Adopt the shared docs-site pipeline: turn on GitHub Pages | — |
| M.WEB-T22 | 2026-11-17 | docs | closed | Update USER_STORIES.md | — |
| M.WEB-T23 | 2026-11-24 | fix | wont-do | Hunt the whole repo for real bugs with no time limit and fix every confirmed one | portfolio reset: open-ended bughunt with no concrete defect |
| M.WEB-T24 | 2026-11-24 | chore | closed | MindAttic.Web pages name the MindAttic.Media.Capture bridge in their capture-demo comments | children done |
| M.WEB-T25 | 2026-11-24 | chore | closed | MindAttic.Web: the capture-demo comment blocks in Hyperspace/index.htm (~1921), mindattic.com/index.htm (~232), mindatticcares.com/index.htm (~116) and ryandebraal.com/index.htm (~304) say MindAttic.Media.Capture; window.mindattic.capture unchanged | 47f4a9c |
| M.WEB-T26 | 2026-11-24 | docs | closed | capture.ps1 and README say output goes to R:\MindAttic\Media\Capture\<site> | 258fcca |
| M.WEB-T27 | 2026-11-27 | feature | open | ryandebraal.com drops its hand-written tooltip code for the shared Components widgets (portfolio reset, M.EXPT-T48) | — |
| M.WEB-T28 | 2026-11-27 | feature | open | Toolbar buttons use the Components Tooltip | — |
| M.WEB-T29 | 2026-11-27 | feature | open | Skill tags use the Components Tag tip script | — |
| M.WEB-T30 | 2026-11-27 | feature | open | All four sites ship from one Components tag (portfolio reset, M.EXPT-T48) | — |
| M.WEB-T31 | 2026-11-27 | feature | open | Every site redeployed and checked live | — |
| M.WEB-T32 | 2026-11-27 | chore | open | After M.WEB-T4 and M.WEB-T13, rebuild all four sites against one MindAttic.Components tag, deploy them, and verify mindattic.com, ryandebraal.com, mindatticcares.com and mindattic.com/hyperspace load with their fonts, backdrop and widgets | — |
