---
codex: 1
project: ryandebraal.com
code: RDC
layer: stories
status: living
updated: 2026-06-07
---

# ryandebraal.com — User Stories

> ✅ done (shipped & tested) · 🟡 partial · ⬜ planned · 🗑️ cut. Every ✅ cites the test.
>
> **This project ships no automated test suite and has no build step**
> ([BIBLE §6](BIBLE.md#RDC-§6), [RDC-LAW-2](BIBLE.md#RDC-LAW-2)). Per the status legend, `✅`
> requires a test or build to prove it; nothing here qualifies. Capabilities that are shipped and
> confirmed by manual in-browser inspection are therefore marked **🟡 (shipped; verified manually,
> no automated test)**. See [RFC 0001](rfc/0001-in-browser-smoke-harness.md) for a path to make
> `✅` reachable.

## Epic A — Single-file delivery

- **RDC-US-A1 🟡** As a reader, I can open the resume from a single `index.htm` with no install,
  build, or server, so it loads instantly anywhere. *Given a modern browser, When I open
  `index.htm`, Then the resume renders and the Network tab shows one document request.*
  *(shipped; verified manually — no automated test.)*
- **RDC-US-A2 🟡** As a skeptical engineer, I can open DevTools and confirm zero third-party
  requests and an inlined font/sprite atlas. *Given DevTools open, When I filter Network by any
  type, Then no CDN/analytics/font request appears.* *(shipped; verified manually — no automated
  test; enforced by [RDC-LAW-1](BIBLE.md#RDC-LAW-1)/[RDC-LAW-3](BIBLE.md#RDC-LAW-3).)*

## Epic B — Themes & animation

- **RDC-US-B1 🟡** As a reader, I can switch between 16 themes and the page restyles via CSS
  variables with a bespoke Canvas animation per theme. *Given the toolbar, When I cycle/pick a
  theme, Then `[data-theme]` updates and the matching `start<Theme>` FX runs.* *(shipped; verified
  manually — no automated test; functions in [BIBLE §4.3](BIBLE.md#RDC-§4).)*
- **RDC-US-B2 🟡** As a reader, I can let themes auto-rotate and pause/resume rotation. *Given
  rotation enabled, When time elapses, Then the theme advances; When I toggle pause, Then it stops
  and the choice persists.* *(shipped; verified manually — `startThemeRotation`/
  `toggleThemeRotation`, persisted to `resume-theme-rotation-paused`.)*

## Epic C — Resume profiles & content

- **RDC-US-C1 🟡** As a reader, I can switch between classic / pitch / complete profiles and the
  same underlying data re-renders for that audience. *Given the toolbar, When I cycle profile,
  Then `[data-profile]` updates and `render()` reprojects `D`.* *(shipped; verified manually —
  one data model, many views, [RDC-LAW-5](BIBLE.md#RDC-LAW-5).)*
- **RDC-US-C2 🟡** As a reader, I can hover any technology to see contextual tooltip detail.
  *Given a skill/experience tech token, When I hover, Then its `tooltips` entry shows.* *(shipped;
  verified manually — `buildTooltip` over the `tooltips` map.)*
- **RDC-US-C3 🟡** As a reader, I can mark my familiarity with a skill and have it remembered.
  *Given a skill tag, When I cycle its level, Then it persists via `tag-familiarity` localStorage.*
  *(shipped; verified manually — `cycleTagLevel`/`saveSkillFam`.)*

## Epic D — Persistence & export

- **RDC-US-D1 🟡** As a returning reader, I find my theme, profile, font, and skill tags preserved
  across reloads. *Given chosen preferences, When I reload, Then they are restored from
  `localStorage`.* *(shipped; verified manually — keys `resume-settings`/`resume-theme`/… .)*
- **RDC-US-D2 🟡** As a reader, I can export the resume as Markdown (and print/PDF) honoring the
  current profile. *Given a profile, When I export, Then output reflects that profile.* *(shipped;
  verified manually — `exportMD`/`printResume`/`runPdfExport`.)*

## Epic E — Delivery

- **RDC-US-E1 🟡** As the author, I can deploy by stamping and FTPS-uploading `index.htm` through
  the shared pipeline. *Given a change, When I run the deploy skill, Then MindAttic.Deploy stamps
  `<!-- Last Updated -->` and uploads the file.* *(shipped; verified manually — see
  `.claude/skills/deploy/SKILL.md`, [RDC-LAW-6](BIBLE.md#RDC-LAW-6).)*

## Priority backlog

1. **RDC-US-F1 ⬜** As a maintainer, I can run a dependency-free in-browser smoke harness that
   asserts all 15 themes mount, all 3 profiles render, and export produces non-empty output — so a
   regression turns a 🟡 into a real `✅`. *(blocked on [RFC 0001](rfc/0001-in-browser-smoke-harness.md).)*
2. **RDC-US-F2 ⬜** As a maintainer, I can assert in that harness that no runtime network request
   other than the document fetch occurs, codifying [RDC-LAW-3](BIBLE.md#RDC-LAW-3).

### Audit log

No stories have been changed from an original spec yet. When a story's intent changes, preserve the
original ask verbatim here, marked "(original spec — audit log)".
