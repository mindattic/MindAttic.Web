---
codex: 1
project: MindAttic Cares
code: MAC
layer: amendments
status: living
updated: 2026-10-02
---

# MindAttic Cares — Amendments (append-only; amendment wins over the bible)

> Append-only change log. Never rewrite an amendment; supersede it with a new one. Beyond ~25,
> fold into the bible and start a new epoch (note the git tag).

## MAC-A1 — Deployment centralized into MindAttic.Deploy (supersedes README "Deploying") {#MAC-A1}

**What changed.** The README documents a per-project FTPS pipeline (`deploy.bat` → `deploy.ps1`
reading `settings.json`). That pipeline is **retired**. Deployment now runs through the central
sibling repo **MindAttic.Deploy**:

```
cd D:\Projects\MindAttic\MindAttic.Deploy
npm run deploy -- --site mindatticcares.com
```

The site's profile lives in `MindAttic.Deploy/projects.json` under `sites[]`; FTP credentials are
centralized in `MindAttic.Deploy/secrets/ftp.json` (gitignored). The per-folder `deploy.ps1`,
`deploy.bat`, and `settings.json` are no longer present in the working tree and are no longer read.

**Why.** One repo owns the whole FTP pipeline (single source of credentials and upload logic) — see
[`.claude/commands/deploy.md`](../.claude/commands/deploy.md). The repo was also renamed
`MindAtticCares` → `mindatticcares.com` (GitHub remote and local folder).

**Migration.** Use the command above (or the `/deploy` Claude command). Do not re-create a local
deploy script (codified as [MAC-LAW-5](BIBLE.md#MAC-LAW-5)). The README's "Deploying" / "settings.json
shape" sections are superseded by this amendment.

## MAC-A2 — Static assets come from the MindAttic.UiUx jsDelivr package (refines MAC-LAW-1) {#MAC-A2}

**What changed.** The site no longer embeds fonts and images as base64 inside `index.htm`. All binary
assets now live in the shared **MindAttic.UiUx** repo, organised by domain, and are loaded at runtime
from jsDelivr, pinned to a whole-number release tag:

```
https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@V7/mindatticcares.com/<category>/<file>
https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@V7/fonts/outfit/<file>
```

`<category>` is `logos`, `icons`, or `images`; file names are lowercase kebab-case. `index.htm`
shrank from ~681 KB to ~60 KB, the fonts and images are cached by the browser and shared across all
MindAttic sites, and the page adds `preconnect`/`preload` hints and lazy-loads below-the-fold images.

**User decision.** External static assets from jsDelivr (MindAttic.UiUx, tag-pinned) are allowed.

**Allowed external hosts (the full list).**
- `cdn.jsdelivr.net` — static assets from MindAttic.UiUx only, pinned to a tag.
- `www.youtube-nocookie.com` — only after the visitor clicks the Child's Play video poster (existing
  lite-YouTube embed; `www.youtube.com` is used only for the `file://` open-in-new-tab fallback).
- Plain outbound links (e.g. childsplaycharity.org) are navigation, not dependencies.

**Still forbidden.** Analytics, tracking pixels, third-party font services (e.g. Google Fonts
requests), front-end frameworks, a bundler/build step, a CMS.

**Supersedes / refines.** [MAC-LAW-1](BIBLE.md#MAC-LAW-1): the "inlined CSS, JS, fonts, and images /
no CDN" parts no longer apply; "no build step, no bundler, no SSG, no `npm install`, the file you edit
is the file you deploy" still holds. Also the matching wording in BIBLE §1–§4 and the README, which
has been updated.

**Conventions.** Asset URL pattern above; lowercase kebab-case names (pixel width suffix for resized
variants, e.g. `-720.png`); whole-number UiUx tags (HOUSE-LAW-1) — a tag is immutable, so changing an
asset means cutting a new tag and bumping it in `index.htm`; lossy files stay byte-identical at full
resolution, PNGs may be recompressed only losslessly.
