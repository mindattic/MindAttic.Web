Deploy ryandebraal.com via **MindAttic.Deploy** (sibling repo at `D:\Projects\MindAttic\MindAttic.Deploy`). One repo owns the whole FTP pipeline; this folder has no deploy script or FTP settings of its own.

**ryandebraal.com is permanently linked to MindAttic.UiUx, mindatticcares.com and mindattic.com.** Deploying any one of them deploys all four. This site's fonts, theme images, portrait and icons are served from the MindAttic.UiUx jsDelivr package, so its deploy must publish and verify that package first.

Run this command and report the result:

```
powershell -NoProfile -ExecutionPolicy Bypass -Command "cd D:\Projects\MindAttic\MindAttic.Deploy; npm run deploy -- --site ryandebraal.com"
```

Flags (append after `--site ryandebraal.com`): `--dry-run` previews everything (nothing is tagged, pushed, written or uploaded); `--with-tests` also runs the MindAttic.UiUx test suite as a gate; `--no-link` is the **escape hatch** that deploys this site alone (loud warning: its pinned asset tag may then disagree with the other pages).

This site's profile lives in `MindAttic.Deploy/projects.json` under `sites[]` (group `mindattic-web` in `linkedGroups`). The run:

1. **Preflight** — `MindAttic.UiUx` on `main`, clean working tree (never auto-committed), not behind origin, manifest current.
2. **Publish** — tag the package `V<n+1>` if `HEAD` is ahead of the latest tag; push `main` + the tag.
3. **Pin** — every `MindAttic.UiUx@V<n>` in this site's `index.htm` (and the other sites') becomes the release tag. The theme images are built at runtime from `ASSET_BASE + 'themes/<theme>/<theme>-NN.jpg'`; the CDN gate covers them through `assets-manifest.json`.
4. **CDN gate** — every asset must be live on jsDelivr at that tag, byte-exact, or the run aborts **before any FTP upload**.
5. **FTP** — this site first (stamp `index.htm` with `<!-- Last Updated: ... -->`, upload it to the FTP root `/`), then mindatticcares.com, then mindattic.com.

After running, summarize the release tag, the pins that changed, the CDN gate result and the per-site upload table, and flag any failure. The deploy does not commit or push this repo — mention any uncommitted changes `git status` shows.

Notes:
- FTP credentials are centralized in `MindAttic.Deploy/secrets/ftp.json` (gitignored).
- Rules and rationale: `MindAttic.Deploy/docs/BIBLE.md`.
