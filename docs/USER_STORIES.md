---
codex: 1
project: MindAttic.Web
code: M.WEB
layer: stories
status: living
updated: 2026-10-12
---
<!-- GENERATED from MindAttic.Workflow/data/workflow.db by `workflow db render`. Do not edit: this file is rewritten from the database; change stories and tickets with the workflow CLI. -->

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
| M.WEB-T7 | 2026-10-16 | chore | open | Bug hunt: run an exhaustive /bughunt over the whole repo and fix every real bug found (each fix under its own fix ticket), then hunt again; close this only when a full pass finds nothing | user request 2026-10-16: approved repo sweep |
| M.WEB-T8 | 2026-10-16 | chore | open | Run the full unit test suite and fix every failure (each under its own fix ticket) until it passes; put the passing run in --ref. No test project: close this wont-do saying so | user request 2026-10-16: approved repo sweep |
| M.WEB-T9 | 2026-10-16 | chore | open | Clean up code and docs: remove dead code, stale comments and outdated or duplicated docs, and simplify where behaviour doesn't change (/simplify); tests stay green | user request 2026-10-16: approved repo sweep |
| M.WEB-T10 | 2026-10-16 | docs | open | Bring README.md up to date with the code as it is now (what it is, setup, usage, commands, current state), following codex-standard/README-STYLE.md; README.htm regenerated if the repo has one | user request 2026-10-16: approved repo sweep |
| M.WEB-T11 | 2026-10-18 | docs | closed | Update USER_STORIES.md | — |
