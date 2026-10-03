Publish **MindAttic.Web.Shared** and deploy everything linked to it, via **MindAttic.Deploy** (sibling repo of MindAttic.Web at `D:\Projects\MindAttic\MindAttic.Deploy`).

MindAttic.Web.Shared is the shared jsDelivr asset package for ryandebraal.com, mindatticcares.com, Hyperspace and mindattic.com, all folders of the one MindAttic.Web repo. They are **permanently linked**: deploying the package deploys all of them, and deploying any one of the sites does exactly the same thing.

Run this command and report the result:

```
powershell -NoProfile -ExecutionPolicy Bypass -Command "cd D:\Projects\MindAttic\MindAttic.Deploy; npm run deploy -- --uiux"
```

Add `--dry-run` to preview (nothing is committed, tagged, pushed, written or uploaded) and `--with-tests` to also run `MindAttic.Web.Shared\tests\` (`npm run test:local`) as a gate. The flow:

1. **Preflight** — MindAttic.Web must be on `main`, with a **clean working tree** (commit your own changes first), not behind `origin/main`, with `assets-manifest.json` current (`tools\build-asset-manifest.ps1 -Verify`).
2. **Next tag** — the next whole-number tag of MindAttic.Web (`V12` is the first). If `HEAD` already carries the latest tag and every site pins it, that tag is reused and steps 3 to 5 are skipped.
3. **Pin and prepare** — every `MindAttic.Web@V<n>/MindAttic.Web.Shared/` pin in the four sites' `index.htm` is rewritten to the release tag, the sites' preDeploy hooks run (mindattic.com's sync splices the CYBERSPACE block at the same tag) and each page's Last Updated stamp is written.
4. **Commit** — those changes are committed as "Pin MindAttic.Web.Shared V<n>".
5. **Tag** — that commit is tagged (message lists the commits). Tags are immutable: a tag that already exists on origin pointing elsewhere aborts the run.
6. **Push** — `main` and the tag.
7. **CDN gate** — every asset the sites use (literal URLs plus every file in `assets-manifest.json` under each site's domain folder) must be live on jsDelivr at that tag with the exact bytes. Anything missing aborts the run **before any FTP upload**.
8. **FTP** — ryandebraal.com -> mindatticcares.com -> Hyperspace (`/mindattic.com/hyperspace`) -> mindattic.com. A failing site does not stop the others; the exit code is non-zero if any failed.

After running, summarize: the release tag, which pins changed, the pin commit, the CDN gate result, and the per-site upload table. Flag any failure. The repo is clean and in sync with origin after a successful deploy.

Notes:
- FTP credentials are centralized in `MindAttic.Deploy/secrets/ftp.json` (gitignored).
- Pushing `main` triggers `.github/workflows/sync-subscribers.yml` (MindAttic.Web root) when the push touches the paths it watches; it opens review PRs (in MindAttic.Web for mindattic.com, and in MindAttic.Psst) and never merges anything.
- Design and rules: `MindAttic.Deploy/docs/BIBLE.md` and `MindAttic.Deploy/src/linked.js`.
