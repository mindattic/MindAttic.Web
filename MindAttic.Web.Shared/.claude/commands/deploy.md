Publish **MindAttic.UiUx** and deploy everything linked to it, via **MindAttic.Deploy** (sibling repo at `D:\Projects\MindAttic\MindAttic.Deploy`).

MindAttic.UiUx is the shared jsDelivr asset package for ryandebraal.com, mindatticcares.com and mindattic.com. They are **permanently linked**: deploying the package deploys all four, and deploying any one of the sites does exactly the same thing.

Run this command and report the result:

```
powershell -NoProfile -ExecutionPolicy Bypass -Command "cd D:\Projects\MindAttic\MindAttic.Deploy; npm run deploy -- --uiux"
```

Add `--dry-run` to preview (nothing is tagged, pushed, written or uploaded) and `--with-tests` to also run `tests\` (`npm run test:local`) as a gate. The same flow in one picture:

1. **Preflight** — this repo must be a git repo on `main`, with a **clean working tree** (the deploy never auto-commits: commit your changes first), not behind `origin/main`, with `assets-manifest.json` current (`tools\build-asset-manifest.ps1 -Verify`).
2. **Publish** — if `HEAD` is ahead of the latest whole-number tag, tag `V<n+1>` (message lists the commits) and `git push origin main` + the tag. Tags are immutable: a tag that already exists on origin pointing elsewhere aborts the run. If `HEAD` already carries the latest tag, it is reused.
3. **Pin** — every `MindAttic.UiUx@V<n>` in the three sites' `index.htm` is rewritten to the release tag.
4. **Prepare** — the sites' preDeploy hooks run (mindattic.com's sync splices the CYBERSPACE block at the same tag).
5. **CDN gate** — every asset the sites use (literal URLs plus every file in `assets-manifest.json` under each site's domain folder) must be live on jsDelivr at that tag with the exact bytes. Anything missing aborts the run **before any FTP upload**.
6. **FTP** — ryandebraal.com -> mindatticcares.com -> mindattic.com. A failing site does not stop the others; the exit code is non-zero if any failed.

After running, summarize: the release tag, which pins changed, the CDN gate result, and the per-site upload table. Flag any failure. The site repos' own changes (pins, stamps) are **not** committed or pushed by the deploy — mention if `git status` shows them.

Notes:
- FTP credentials are centralized in `MindAttic.Deploy/secrets/ftp.json` (gitignored).
- Pushing `main` triggers this repo's `.github/workflows/sync-subscribers.yml` when the push touches the paths it watches; it opens review PRs in the subscriber repos (it does not merge anything).
- Design and rules: `MindAttic.Deploy/docs/AMENDMENTS.md` (DEP-A3) and `MindAttic.Deploy/src/linked.js`.
