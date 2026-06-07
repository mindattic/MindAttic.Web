---
codex: 1
project: MindAttic Cares
code: MAC
layer: rfc
status: planned
updated: 2026-06-07
---

# RFC 0001 — Scaling beyond one event on one page

## Problem
Today the site is one `index.htm` with three pages (`home`, `childs-play`, `y2k`) and a single
19-section playbook. The README's "adding a new event" recipe (copy the section template, add an
`<h1>`, update the TOC) does not scale: a second and third event would bloat one file, make the
hash router ambiguous (`sec-*` anchors assume the Y2K page), and force every visitor to download
every event's base64 assets.

## Options compared
1. **Status quo — one page per event in one file.** Zero new tooling; honors MAC-LAW-1. But file
   size and TOC ambiguity grow linearly with events.
2. **One `<section class="page">` per event, shared playbook template.** Each event is its own page
   id (`y2k`, `next-event`, …) with its own `sec-*` namespace prefix (e.g. `y2k-budget`). Router
   keys the active page off the anchor prefix. Still one file; preserves MAC-LAW-1.
3. **Split into one file per event + a tiny index.** Breaks MAC-LAW-1 (multiple files, possible
   build/concat step). Best for very large catalogs; overkill now.

## Decision
**Defer.** With a single live event, option 1 is adequate. When a second event is committed, adopt
**option 2** (per-event page id + prefixed `sec-*` anchors), which keeps MAC-LAW-1 intact. Revisit
option 3 only if a single file exceeds a practical size/parse budget.

## What NOT to do
- Do not introduce a static-site generator, bundler, or CMS to "solve" multi-event (violates
  MAC-LAW-1, MAC-§3).
- Do not reuse bare `sec-*` anchors across events — namespace them per page (MAC-LAW-4).

## Phased plan (with risk)
1. When event #2 lands, add its page id and prefixed anchors; update the router's `pages[]` and
   anchor-prefix logic. *Risk: router regression — mitigated by MAC-US-D1 link checker.*
2. Add the MAC-US-D1 anchor/link checker first so the migration is verifiable.
3. Only if file size becomes a problem, evaluate option 3 in a follow-up RFC.

## Graduates into:
[BIBLE §4.2 / §4.3](../BIBLE.md#MAC-§4) (router + anchor model), [MAC-LAW-4](../BIBLE.md#MAC-LAW-4),
and stories [MAC-US-C2](../USER_STORIES.md), MAC-US-D1.
