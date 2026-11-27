---
layer: release
status: living
---
# MindAttic.Web — Release charter

> The one finish line this repo is working toward. Every open ticket in this repo sits under one of the epics
> below, and every epic is part of the milestone. Work that does not fit is out of scope until this milestone is
> reached (owner, 2026-11-27, MAT-T319).
>
> This repo's bible is [`mindattic.com/docs/BIBLE.md`](../mindattic.com/docs/BIBLE.md); each other site keeps its
> own `<site>/docs/BIBLE.md`.

## 1. What this is
The four hand-authored static MindAttic sites (mindattic.com, ryandebraal.com, mindatticcares.com, Hyperspace),
loading their shared fonts, logos, effects and widgets from MindAttic.Components on jsDelivr.

## 2. The milestone: all four sites on shared components {#milestone}
- **Milestone:** MS-80, "MindAttic.Web: all four sites on shared components"
- **Published means:** live at https://mindattic.com, https://ryandebraal.com, https://mindatticcares.com and
  https://mindattic.com/hyperspace/.
- **The natural stopping point:** the shared package moved to MindAttic.Components; ryandebraal.com still has
  hand-written tooltip code where Components now has a Tooltip and a Tag tip script. Switching it over and
  redeploying all four sites from one tag finishes the migration.

## 3. Done when (acceptance checks)
1. exists — https://mindattic.com is live.
2. exists — https://ryandebraal.com is live.
3. signoff — the owner hovers ryandebraal.com toolbar buttons and skill tags and sees the shared tooltips.

## 4. Epics, in priority order
| Priority | Epic (ticket) | What it delivers | Features |
|---|---|---|---|
| 900 | M.WEB-T27 ryandebraal.com shared widgets | Hand-written tooltips replaced by Components | M.WEB-T28 Toolbar tooltips (990: M.WEB-T4), M.WEB-T29 Skill tag tips (980: M.WEB-T13) |
| 800 | M.WEB-T30 Release | All four sites from one Components tag | M.WEB-T31 Deploy and verify (890: M.WEB-T32) |

## 5. Out of scope (not before this milestone)
- New sites, new ryandebraal.com themes or profiles, more Hyperspace exhibits.
- Tests in this repo (they live in MindAttic.Components), generic cleanups, bughunts.

## 6. Current verified state
- All four sites live; capture.ps1 drives the Browser's Release deploy (c9def19).
- ryandebraal.com bughunt fixes: 11e4c53. README current (c9def19).

## 7. Decision record
- 2026-11-27 — charter drafted from README, site bibles, git log and tickets; Legion vote: **Approve**, 9/9 voters,
  plurality quorum reached, consensus 1.0, no dissent.
- Triage: 6 open → done 1 (T10), duplicate 0, wont-do 3 (T8, T9, T23), kept 2 (T4, T13), new tasks 1 (T32).
