Deploy mindattic.com via **MindAttic.Deploy** (sibling repo at `D:\Projects\MindAttic\MindAttic.Deploy`). One repo owns the whole FTP pipeline; this folder has no deploy script or FTP settings of its own.

**mindattic.com is permanently linked to MindAttic.Web.Shared, ryandebraal.com, mindatticcares.com and Hyperspace.** All five live in one git repo, MindAttic.Web (`D:\Projects\MindAttic\MindAttic.Web`). Deploying any one of them publishes the shared package and deploys all four sites together.

Run this command and report the result:

```
powershell -NoProfile -ExecutionPolicy Bypass -Command "cd D:\Projects\MindAttic\MindAttic.Deploy; npm run deploy -- --site mindattic.com"
```

Flags (append after `--site mindattic.com`): `--dry-run` previews everything (nothing is committed, tagged, pushed, written or uploaded); `--with-tests` also runs the `MindAttic.Web.Shared/tests` suite as a gate; `--no-link` is the **escape hatch** that deploys mindattic.com alone (it prints a loud warning because the other pages may then pin a different asset tag).

The linked flow (`MindAttic.Deploy/src/linked.js`):

1. **Preflight** — MindAttic.Web must be on `main` with a clean working tree, not behind origin, with `MindAttic.Web.Shared/assets-manifest.json` current.
2. **Next tag** — the next whole-number tag on MindAttic.Web (`V<n+1>`; the series starts at `V12`).
3. **Pin and prepare** — every `MindAttic.Web@V<n>/MindAttic.Web.Shared/` URL in the four site pages is rewritten to that tag; this site's hooks run (`package-pull` is skipped in linked mode, then `MindAttic.Web.Shared/sync/sync-mindattic-com.ps1 -CyberspaceCdnTag <tag>` splices **only the CYBERSPACE block**; the fonts, logo and effects engine load from jsDelivr); each page's `<!-- Last Updated: ... -->` comment is stamped.
4. **Commit** — those changes are committed as `Pin MindAttic.Web.Shared V<n>`.
5. **Tag** — that commit is tagged `V<n>`.
6. **Push** — `main` and the tag are pushed to origin.
7. **CDN gate** — every asset the pages use must be live on jsDelivr at that tag, byte-exact, or the run aborts **before any FTP upload**.
8. **FTP** — ryandebraal.com (`/`), mindatticcares.com (`/mindatticcares.com/`), Hyperspace (`/mindattic.com/hyperspace/`), then this site (`index.htm` only -> `/mindattic.com/`).

If `HEAD` already carries the latest tag and every pin matches it, that tag is reused: nothing is committed, and the run resumes at the push, CDN gate and FTP.

After running, summarize the release tag, the pins that changed, the commit and tag, the CDN gate result and the per-site upload table, and flag any failure.

Notes:
- FTP credentials are centralized in `MindAttic.Deploy/secrets/ftp.json` (gitignored).
- Only `index.htm` is uploaded to `/mindattic.com/`. Each MindAttic repo's project page is its GitHub README (`https://github.com/mindattic/<Repo>`); the server's `.htaccess` 301-redirects `/<slug>.htm` URLs there.
- Rules and rationale: `MindAttic.Deploy/docs/BIBLE.md`.
