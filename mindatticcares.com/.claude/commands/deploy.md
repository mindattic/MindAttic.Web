Deploy mindatticcares.com via **MindAttic.Deploy** (sibling repo at `D:\Projects\MindAttic\MindAttic.Deploy`). One repo owns the whole FTP pipeline; this folder has no deploy script or FTP settings of its own.

**mindatticcares.com is permanently linked to MindAttic.UiUx, ryandebraal.com and mindattic.com.** Deploying any one of them deploys all four. This site's fonts, logos and images are served from the MindAttic.UiUx jsDelivr package, so its deploy must publish and verify that package first.

Run this command and report the result:

```
powershell -NoProfile -ExecutionPolicy Bypass -Command "cd D:\Projects\MindAttic\MindAttic.Deploy; npm run deploy -- --site mindatticcares.com"
```

Flags (append after `--site mindatticcares.com`): `--dry-run` previews everything (nothing is tagged, pushed, written or uploaded); `--with-tests` also runs the MindAttic.UiUx test suite as a gate; `--no-link` is the **escape hatch** that deploys this site alone (loud warning: its pinned asset tag may then disagree with the other pages).

This site's profile lives in `MindAttic.Deploy/projects.json` under `sites[]` (group `mindattic-web` in `linkedGroups`). The run:

1. **Preflight** — `MindAttic.UiUx` on `main`, clean working tree (never auto-committed), not behind origin, manifest current.
2. **Publish** — tag the package `V<n+1>` if `HEAD` is ahead of the latest tag; push `main` + the tag.
3. **Pin** — every `MindAttic.UiUx@V<n>` in this site's `index.htm` (and the other sites') becomes the release tag.
4. **CDN gate** — every asset (literal URLs plus everything under `mindatticcares.com/` in `assets-manifest.json`) must be live on jsDelivr at that tag, byte-exact, or the run aborts **before any FTP upload**.
5. **FTP** — ryandebraal.com first, then this site (stamp `index.htm` with `<!-- Last Updated: ... -->`, upload it to `/mindatticcares.com/`), then mindattic.com.

After running, summarize the release tag, the pins that changed, the CDN gate result and the per-site upload table, and flag any failure. The deploy does not commit or push this repo — mention any uncommitted changes `git status` shows.

Notes:
- FTP credentials are centralized in `MindAttic.Deploy/secrets/ftp.json` (gitignored).
- The MindAttic.Deploy site profile's `sourceDir` is `../mindatticcares.com`.
- Rules and rationale: `MindAttic.Deploy/docs/BIBLE.md`.
