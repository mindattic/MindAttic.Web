---
codex: 1
project: MindAttic Cares
code: MAC
layer: amendments
status: living
updated: 2026-06-07
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
