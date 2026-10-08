# Delivery pipelines

MindAttic.Web.Shared is the source of truth for shared front-end content. It is the `MindAttic.Web.Shared/`
folder of the MindAttic.Web repo, next to the sites that consume it. Content reaches subscribers two ways:

1. **jsDelivr CDN** — every file is served at a versioned URL. The CDN consumers are the four sites (`mindattic.com`, `ryandebraal.com`, `mindatticcares.com`, `Hyperspace`), pinned to one whole-number tag by `MindAttic.Deploy`'s linked deploy. That's the default path for anything new.
2. **Marker-block sync** (GitHub Action + local PowerShell) — for subscribers that need build-time splice into hand-authored files: `mindattic.com/index.htm` (CYBERSPACE block only), the `MindAttic.Psst` legal pages, and Tutor (local only). Prose.Writer / Prose.Codex / Ideas are marked `retired` in `subscribers.json`.

If you are wiring up a new subscriber, prefer pipeline 1. Pipeline 2 is reserved for cases where the subscriber genuinely needs content inlined inside files it also hand-authors.

## Pipeline 1 — jsDelivr CDN (runtime)

Every file in this folder is served by [jsDelivr](https://www.jsdelivr.com/) at a versioned URL of the public MindAttic.Web repo — zero setup, global edge cache.

**URL shape:**

```
https://cdn.jsdelivr.net/gh/mindattic/MindAttic.Web@<ref>/MindAttic.Web.Shared/<path>
```

Where `<ref>` is any of:

| Ref form | Example | Behavior |
|---|---|---|
| Whole-number tag (required for prod) | `@V12` | Immutable; cached forever |
| Branch | `@main` | Cached ~7 days unless purged |
| Commit SHA | `@a1b2c3d` | Immutable; cached forever |

Tags on MindAttic.Web start at `V12`. Only `MindAttic.Web@V<n>` URLs are served; the former MindAttic.UiUx repository and its `V1` to `V11` URLs no longer exist.

Paths are case-sensitive on GitHub: the `MindAttic.Web.Shared/` prefix, component folders (`Cyberspace`, `SacredGeometry`, `Hyperspace`, `OutfitFont`, `AtticFont`, `PinFooter`, `BackHomeM`, `WebSnapshot`, `PageScrollbar`, `Textbox`, `Tooltip`, `UserLogin`, `UserCircle`, `UserTimeout`), theme folders (`Themes/Cyberspace`), and the asset folders (`fonts/`, `mindattic.com/`, `mindatticcares.com/`, `ryandebraal.com/` — lowercase).

**Examples:**

```html
<!-- pinned, production -->
<script src="https://cdn.jsdelivr.net/gh/mindattic/MindAttic.Web@V12/MindAttic.Web.Shared/Components/Cyberspace/console-bg.js"></script>
<link  rel="stylesheet" href="https://cdn.jsdelivr.net/gh/mindattic/MindAttic.Web@V12/MindAttic.Web.Shared/Components/Cyberspace/frontpage.css">

<!-- bleeding edge (dev only) -->
<script src="https://cdn.jsdelivr.net/gh/mindattic/MindAttic.Web@main/MindAttic.Web.Shared/Components/Cyberspace/console-bg.js"></script>
```

**Cutting a release:** you normally do not tag by hand. `MindAttic.Deploy`'s linked deploy (`npm run deploy -- --uiux`, or `--site` with any of the four sites) does it:

1. Preflight: MindAttic.Web is clean, on `main`, not behind origin, and `assets-manifest.json` is current.
2. Picks the next whole-number tag (`V12` is the first on MindAttic.Web).
3. Rewrites the pins in the four site pages to that tag, runs the sites' `preDeploy` hooks (the mindattic.com splice, `sync-mindattic-com.ps1 -CyberspaceCdnTag <tag>`) and stamps each page's Last Updated line.
4. Commits those changes as "Pin MindAttic.Web.Shared V<n>" and tags that commit.
5. Pushes `main` and the tag.
6. Verifies every asset the sites use on jsDelivr at that tag, byte for byte.
7. FTPs ryandebraal.com, mindatticcares.com, Hyperspace and mindattic.com, in that order.

When `HEAD` already carries the latest tag and the pins match it, that tag is reused. The repo is clean after a deploy: pins and stamps are committed. Runtime assets (fonts, logos, theme art) are documented in [`ASSETS.md`](ASSETS.md).

To tag by hand (from the MindAttic.Web root):

```bash
git tag -a V<n> -m "..."     # whole numbers only, never SemVer; never move a published tag
git push origin main V<n>
# jsDelivr serves the new tag within a minute
```

The four sites are the only CDN consumers; there is no other pin to bump.

**Purging the cache (rare, only needed for branch refs):**

`https://purge.jsdelivr.net/gh/mindattic/MindAttic.Web@main/MindAttic.Web.Shared/Components/Cyberspace/console-bg.js` — GET to purge.

## Pipeline 2 — GitHub Actions sync (pull requests)

`.github/workflows/sync-subscribers.yml`, at the MindAttic.Web root, runs on every push to `main` that touches a spliced component (`MindAttic.Web.Shared/Components/Cyberspace/**`, `MindAttic.Web.Shared/Components/OutfitFont/**`), `MindAttic.Web.Shared/subscribers.json`, `MindAttic.Web.Shared/sync/**`, or the workflow itself — unless the commit message contains `[skip ci]`. It can also be run by hand (`workflow_dispatch`).

It has one job per splice-in-place subscriber:

- **sync-mindattic-com** — mindattic.com is a folder of MindAttic.Web. The job checks out MindAttic.Web with full history and tags (so the default CDN tag can be derived), runs `sync-mindattic-com.ps1` and opens or updates a PR in MindAttic.Web on branch `auto/sync-mindattic-com` that changes only the CYBERSPACE marker block in `mindattic.com/index.htm` (scan-line divs, frontpage CSS, the small loader scripts and the deferred CDN `<script>` tags pinned to the latest tag). Fonts, logos and the engine itself load from jsDelivr.
- **sync-mindattic-psst** — checks out MindAttic.Web and mindattic/MindAttic.Psst, runs `sync-mindattic-psst.ps1` and opens or updates a PR in MindAttic.Psst on branch `auto/sync-components`. Only the OUTFITFONT marker block in `terms.htm` and `privacy.htm` changes; `index.htm` is NOT touched (it has no MINDATTIC.UIUX marker block).

The workflow never re-triggers itself: the sync PR and the linked deploy's "Pin MindAttic.Web.Shared V<n>" commit change only site folders, which are outside its paths filter.

## Tokens

The `sync-mindattic-com` job uses the built-in `GITHUB_TOKEN` (job permissions `contents: write`, `pull-requests: write`; the repo setting "Allow GitHub Actions to create and approve pull requests" is on). Only `sync-mindattic-psst` needs a personal access token, because it pushes to another repo. The secret `SUBSCRIBER_REPO_TOKEN` is set. To replace it with a narrowly scoped **fine-grained personal access token**:

1. Go to https://github.com/settings/personal-access-tokens/new
2. Repository access: **Only select repositories → MindAttic.Psst** (add any future cross-repo subscriber)
3. Repository permissions:
   - **Contents**: Read and write
   - **Pull requests**: Read and write
   - **Metadata**: Read-only (auto-included)
4. Expiration: pick whatever you're comfortable rotating (e.g. 1 year)
5. Generate token, copy the value

Then in MindAttic.Web:

1. Go to https://github.com/mindattic/MindAttic.Web/settings/secrets/actions
2. **New repository secret**
3. Name: `SUBSCRIBER_REPO_TOKEN`
4. Value: paste the PAT

The workflow will now succeed.

## Pipeline 3 — PowerShell `sync/*.ps1` (local dev fallback)

For fast iteration without pushing to GitHub, the `sync/sync-all.ps1` script does the same work locally against your working copies (retired subscribers are skipped with a notice). Targets in `subscribers.json` are relative to this folder: `../mindattic.com/index.htm` is the site folder in the same MindAttic.Web checkout, and `../../MindAttic.Psst`, `../../Tutor/Tutor.Blazor` are repos cloned next to MindAttic.Web. Run it after any edit under a component folder:

```powershell
powershell -File MindAttic.Web.Shared/sync/sync-all.ps1
```

`MindAttic.Deploy` also invokes `sync-mindattic-com.ps1` as a `preDeploy` hook (passing the release tag during a linked deploy) so the block is fresh before the pin commit and each FTPS upload. Its (disabled) Prose app lists `sync-prose.ps1`, which reports the Prose subscribers as retired and exits 0.

## Choosing a pipeline per subscriber

| Subscriber kind | Recommended runtime source | Why |
|---|---|---|
| `mindattic.com` | CYBERSPACE marker block (kept fresh by Action / `sync-mindattic-com.ps1`) + jsDelivr for fonts, logo and the engine | Small hand-authored page; heavy assets are cached once on the CDN and shared with the other sites |
| `ryandebraal.com`, `mindatticcares.com` | jsDelivr only (no splice) | Hand-authored pages that reference `fonts/` and their own `<domain>/` asset folder by tag-pinned URL |
| `Hyperspace` | jsDelivr only (no splice) | Loads `Components/Hyperspace/hyperspace.js` by tag-pinned URL, with a `../MindAttic.Web.Shared/` fallback when opened from disk |
| `MindAttic.Psst` legal pages | Inlined OUTFITFONT marker block in `terms.htm` + `privacy.htm` (kept fresh by Action / `sync-mindattic-psst.ps1`) | Small legal pages hand-authored around the block |
| Tutor (Blazor) | `app.css` marker blocks (local `sync-tutor.ps1` only) | Blazor build needs deterministic input |
| Prose.Writer / Prose.Codex / Ideas | — (retired) | Target projects do not exist; see `retired` in `subscribers.json` |
| Project pages (IdiotProof, Claudia, ChiMesh, …) | — (none) | Each repo's GitHub README is its project page; nothing is rendered from MindAttic.Web.Shared components |
| Anything new | jsDelivr CDN | Only fall back to pipeline 2 if the subscriber needs hand-authored content interleaved with the components |
