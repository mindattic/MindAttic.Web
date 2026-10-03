Deploy mindatticcares.com via **MindAttic.Deploy** (sibling repo at `D:\Projects\MindAttic\MindAttic.Deploy`). One repo owns the whole FTP pipeline; this folder has no deploy script or FTP settings of its own.

**mindatticcares.com is permanently linked to MindAttic.Web.Shared, ryandebraal.com, Hyperspace and mindattic.com.** All five live in one git repo, MindAttic.Web (`D:\Projects\MindAttic\MindAttic.Web`). Deploying any one of them deploys every site. This site's fonts, logos and images are served from the MindAttic.Web.Shared jsDelivr package, so its deploy must publish and verify that package first.

Run this command and report the result:

```
powershell -NoProfile -ExecutionPolicy Bypass -Command "cd D:\Projects\MindAttic\MindAttic.Deploy; npm run deploy -- --site mindatticcares.com"
```

Flags (append after `--site mindatticcares.com`): `--dry-run` previews everything (nothing is committed, tagged, pushed, written or uploaded); `--with-tests` also runs the `MindAttic.Web.Shared/tests` suite as a gate; `--no-link` is the **escape hatch** that deploys this site alone (loud warning: its pinned asset tag may then disagree with the other pages).

This site's profile lives in `MindAttic.Deploy/projects.json` under `sites[]` (group `mindattic-web` in `linkedGroups`). The run (`MindAttic.Deploy/src/linked.js`):

1. **Preflight** — MindAttic.Web on `main`, clean working tree, not behind origin, `MindAttic.Web.Shared/assets-manifest.json` current.
2. **Next tag** — the next whole-number tag on MindAttic.Web (`V<n+1>`; the series starts at `V12`).
3. **Pin and prepare** — every `MindAttic.Web@V<n>/MindAttic.Web.Shared/` URL in this site's `index.htm` (and the other site pages) becomes the release tag; the sites' preDeploy hooks run (mindattic.com's Cyberspace sync); each page's `<!-- Last Updated: ... -->` comment is stamped.
4. **Commit, tag, push** — the changes are committed as `Pin MindAttic.Web.Shared V<n>`, that commit is tagged `V<n>`, and `main` plus the tag are pushed.
5. **CDN gate** — every asset (literal URLs plus everything under `mindatticcares.com/` in `assets-manifest.json`) must be live on jsDelivr at that tag, byte-exact, or the run aborts **before any FTP upload**.
6. **FTP** — ryandebraal.com first, then this site (`index.htm` to `/mindatticcares.com/`), Hyperspace and mindattic.com.

If `HEAD` already carries the latest tag and every pin matches it, that tag is reused: nothing is committed, and the run resumes at the push, CDN gate and FTP.

After running, summarize the release tag, the pins that changed, the commit and tag, the CDN gate result and the per-site upload table, and flag any failure.

Notes:
- FTP credentials are centralized in `MindAttic.Deploy/secrets/ftp.json` (gitignored).
- The MindAttic.Deploy site profile's `sourceDir` is `../MindAttic.Web/mindatticcares.com`.
- Rules and rationale: `MindAttic.Deploy/docs/BIBLE.md`.
