# MindAttic Cares

**Charity work, in public, with the receipts attached.**

MindAttic Cares is the philanthropic arm of MindAttic LLC — the place where we organize, document, and execute the events and giving campaigns we run for causes we believe in. The site at **[mindatticcares.com](https://mindatticcares.com/)** is one self-contained HTML file: every initiative on it is fully drafted in public, complete with timelines, budgets, vendor lists, and post-event wrap-ups, so anyone can copy what worked and skip what didn't.

The flagship initiative is the **Child's Play** track — running an annual fundraising event that goes 100% to [childsplaycharity.org](https://childsplaycharity.org/), the gaming community's children's-hospital charity. The first event in that track is **Y2K: End of the World Party**, a 12-week-planned, 1999-themed dance event for the millennial demographic, with the full event playbook (timeline → venue → equipment → run-of-show → budget → sponsorship → post-event) published on the site.

**Why MindAttic Cares:**

- **Public-by-default planning.** Every event has its full playbook on the public site — venue selection, permits, equipment sourcing, floor plan, staffing, run-of-show, budget, sponsorship pitch deck, marketing, compliance, decor plan. No proprietary checklists kept behind a paywall.
- **100% pass-through giving.** Funds raised at every event go to a named partner charity directly. Operational costs are covered separately by MindAttic LLC; donors are not paying for our overhead.
- **One file, no CMS.** The entire site is `index.htm` — inlined CSS, inlined JS, base64-inlined images. No CDN, no database, no static-site generator. Anyone can fork it, edit a copy in a text editor, and host their own version of an event playbook.
- **Reusable templates.** The 12-week planning timeline, the budget worksheet, the sponsorship pitch structure, the volunteer staffing model — all designed as templates a sibling charity can drop into their own event.

---

## Table of Contents

- [What's on the site](#whats-on-the-site)
- [Stack](#stack)
- [Repository layout](#repository-layout)
- [Deploying](#deploying)
- [Editing the site](#editing-the-site)
- [Related](#related)

---

## What's on the site

| Section | Content |
|---|---|
| MindAttic Cares (intro) | Who we are and why we run these events. |
| Child's Play | The pass-through giving track. Why this charity, how funds flow, partnership details. |
| Y2K: End of the World Party | Full 19-section event playbook for the inaugural fundraiser — overview & goals, how to use this playbook, planning timeline, venue & permits, equipment, floor plan, staffing, the show, run-of-show, budget, sponsorship, marketing, compliance, decor, cultural brief, show assets, post-event wrap, master checklists, appendices. |

Each subsequent event will be drafted on the same page in the same structure so the audience (and any sibling charity looking for a template) gets a consistent read.

## Stack

| Layer | Technology |
|---|---|
| **Front-end** | Single self-contained `index.htm` — inlined CSS, inlined JavaScript, base64-inlined PNG favicon and graphics |
| **Hosting** | Static hosting at [mindatticcares.com](https://mindatticcares.com/) (no server-side code, no database) |
| **Deploy** | Centralized via **MindAttic.Deploy** (sibling repo) — see [Deploying](#deploying) |

No build step. No `npm install`. No CMS. Open the file in any modern browser and you have the whole site.

## Repository layout

```
mindatticcares.com/
├── index.htm           # The entire site — one self-contained HTML file
├── docs/               # Codex canon (BIBLE, AMENDMENTS, USER_STORIES, rfc/)
├── tools/              # codex.ps1 doctor + digest CLI
├── .claude/            # Deploy command, project skills, SessionStart hook
└── README.md           # ← you are here
```

> `deploy.ps1` / `deploy.bat` / `settings.json` are **retired**. The FTP pipeline now lives in
> **MindAttic.Deploy** (see [MAC-A1](docs/AMENDMENTS.md#MAC-A1) and [Deploying](#deploying)).

## Deploying

> **Per-project deploy scripts are retired.** `deploy.bat`, `deploy.ps1`, and `settings.json` no
> longer exist in this folder. See [MAC-A1](docs/AMENDMENTS.md#MAC-A1) for the migration history.

Deployment is owned by the central **MindAttic.Deploy** sibling repo. Use the `/deploy` Claude
command, or run:

```powershell
cd D:\Projects\MindAttic\MindAttic.Deploy
npm run deploy -- --site mindatticcares.com
```

The pipeline stamps `index.htm` with a fresh `<!-- Last Updated: <ISO8601 UTC> -->` comment and
FTPS-uploads it. FTP credentials live in `MindAttic.Deploy/secrets/` (gitignored there).

## Editing the site

Open `index.htm` in any editor. Sections are demarcated by `<h2 id="sec-*" class="sec">` headers (e.g. `sec-overview`, `sec-timeline`, `sec-budget`) — the in-page TOC and scroll-spy are wired to those IDs. The CSS palette and event-playbook layout live at the top of the `<style>` block; the in-page JavaScript is small and lives in a single `<script>` block near the bottom.

When adding a new event:

1. Add a new `<h1>` block at the relevant insertion point.
2. Copy the section template (`<h2 id="sec-...">` cards) from the existing playbook.
3. Update the in-page TOC / scroll-spy list.
4. Deploy via MindAttic.Deploy (see [Deploying](#deploying)).

## Related

- **Child's Play** — [childsplaycharity.org](https://childsplaycharity.org/) — the children's-hospital charity that receives our Y2K event proceeds.
- **MindAttic LLC** — [mindattic.com](https://mindattic.com/) — the parent organization that funds the operational side so 100% of donations pass through to the partner charity.
