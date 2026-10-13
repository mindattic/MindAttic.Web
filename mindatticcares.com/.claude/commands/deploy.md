Deploy mindatticcares.com via **MindAttic.Deploy** (sibling repo at `D:\Projects\MindAttic\MindAttic.Deploy`). One repo owns the whole FTP pipeline; this folder has no deploy script or FTP settings of its own.

**mindatticcares.com is permanently linked to ryandebraal.com, Hyperspace and mindattic.com, and to the MindAttic.Components asset package.** The four sites live in one git repo, MindAttic.Web (`D:\Projects\MindAttic\MindAttic.Web`); the package is the `web/` folder of its own repo, MindAttic.Components (`D:\Projects\MindAttic\MindAttic.Components`). Deploying any one site deploys every site. This site's fonts, logos and images are served from the MindAttic.Components jsDelivr package (`web/`), so its deploy must publish and verify that package first.

Run this command and report the result:

```
powershell -NoProfile -ExecutionPolicy Bypass -Command "cd D:\Projects\MindAttic\MindAttic.Deploy; npm run deploy -- --site mindatticcares.com"
```

Flags (append after `--site mindatticcares.com`): `--dry-run` previews everything (nothing is committed, tagged, pushed, written or uploaded); `--with-tests` also runs the `MindAttic.Components/web/tests/package` suite as a gate; `--no-link` is the **escape hatch** that deploys this site alone (loud warning: its pinned asset tag may then disagree with the other pages).

This site's profile lives in `MindAttic.Deploy/projects.json` under `sites[]` (group `mindattic-web` in `linkedGroups`). The run (`MindAttic.Deploy/src/linked.js`):

1. **Preflight** — MindAttic.Components and MindAttic.Web both on `main`, clean working trees, not behind origin, `MindAttic.Components/web/assets-manifest.json` current.
2. **Next tag** — the next whole-number tag on MindAttic.Components (`V<n+1>`; the series starts at `V1`).
3. **Pin and prepare** — every `MindAttic.Components@V<n>/web/` URL in this site's `index.htm` (and the other site pages) becomes the release tag; each site's preDeploy hook runs `MindAttic.Components/web/build/build-sites.ps1 -Site <site> -Tag V<n>`, re-splicing its `MINDATTIC.COMPONENTS:<X>` blocks (here: fonts, hash pages, video embed, capture demo); each page's `<!-- Last Updated: ... -->` comment is stamped.
4. **Commit, tag, push** — the changes are committed in MindAttic.Web as `Pin MindAttic.Components V<n>`, MindAttic.Components' `HEAD` is tagged `V<n>`, and both repos' `main` (plus the tag on MindAttic.Components) are pushed.
5. **CDN gate** — every asset (literal URLs plus everything under `assets/mindatticcares.com/` in `assets-manifest.json`) must be live on jsDelivr at that tag, byte-exact, or the run aborts **before any FTP upload**.
6. **FTP** — ryandebraal.com first, then this site (`index.htm` to `/mindatticcares.com/`), Hyperspace and mindattic.com.

If `HEAD` already carries the latest tag and every pin matches it, that tag is reused: nothing is committed, and the run resumes at the push, CDN gate and FTP.

After running, summarize the release tag, the pins that changed, the commit and tag, the CDN gate result and the per-site upload table, and flag any failure.

Notes:
- FTP credentials are centralized in `MindAttic.Deploy/secrets/ftp.json` (gitignored).
- The MindAttic.Deploy site profile's `sourceDir` is `../MindAttic.Web/mindatticcares.com`.
- Rules and rationale: `MindAttic.Deploy/docs/BIBLE.md`.
