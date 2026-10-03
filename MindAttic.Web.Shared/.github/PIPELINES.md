# Delivery pipelines

MindAttic.UiUx is a source-of-truth repo. Content reaches subscribers two ways:

1. **jsDelivr CDN** — every file is served at a versioned URL. `MindAttic.Deploy` consumes the CDN for every catalog landing page (IdiotProof, GridGame2026, MindAttic.Legion, MediaButler, MindAttic.Vault, TaxRateCollector, ThinkTank, Tutor, MindAttic.Psst index) and the Claudia / ChiMesh long-form HTML builds. That's the default path for anything new.
2. **Marker-block sync** (GitHub Action + local PowerShell) — for subscribers that need build-time splice into hand-authored files: `mindattic.com/index.htm` (CYBERSPACE block only), the `MindAttic.Psst` legal pages, and Tutor (local only). Prose.Writer / Prose.Codex / Ideas are marked `retired` in `subscribers.json`.

If you are wiring up a new subscriber, prefer pipeline 1. Pipeline 2 is reserved for cases where the subscriber genuinely needs content inlined inside files it also hand-authors.

## Pipeline 1 — jsDelivr CDN (runtime)

Every file in this repo is served by [jsDelivr](https://www.jsdelivr.com/) at a versioned URL — zero setup, global edge cache.

**URL shape:**

```
https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@<ref>/<path>
```

Where `<ref>` is any of:

| Ref form | Example | Behavior |
|---|---|---|
| Whole-number tag (required for prod) | `@V7` | Immutable; cached forever |
| Branch | `@main` | Cached ~7 days unless purged |
| Commit SHA | `@a1b2c3d` | Immutable; cached forever |

Paths are case-sensitive on GitHub: component folders (`Cyberspace`, `SacredGeometry`, `OutfitFont`, `AtticFont`, `PinFooter`, `BackHomeM`, `WebSnapshot`, `PageScrollbar`, `Textbox`, `Tooltip`, `UserLogin`, `UserCircle`, `UserTimeout`), theme folders (`Themes/Cyberspace`), and the asset folders (`fonts/`, `mindattic.com/`, `mindatticcares.com/`, `ryandebraal.com/` — lowercase).

**Examples:**

```html
<!-- pinned, production -->
<script src="https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@V7/Components/Cyberspace/console-bg.js"></script>
<link  rel="stylesheet" href="https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@V7/Components/Cyberspace/frontpage.css">

<!-- bleeding edge (dev only) -->
<script src="https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@main/Components/Cyberspace/console-bg.js"></script>
```

**Cutting a release:**

```bash
git tag -a V8 -m "..."     # whole numbers only, never SemVer; never move a published tag
git push origin main V8
# jsDelivr serves the new tag within a minute
```

For the four linked properties (this package + `mindattic.com`, `ryandebraal.com`, `mindatticcares.com`) you
normally do not tag by hand: `MindAttic.Deploy`'s linked deploy (`npm run deploy -- --uiux`, or `--site` for
any of the three sites) tags the next `V<n>` when `HEAD` is ahead of the latest tag, pins it in the sites,
verifies every asset on the CDN, then FTPs the sites. Runtime assets (fonts, logos, theme art) are documented
in [`docs/ASSETS.md`](../docs/ASSETS.md).

To propagate a release to every `MindAttic.Deploy`-rendered subscriber, bump `componentsVersion` in `MindAttic.Deploy/projects.json` and run that repo's deploy.

**Purging the cache (rare, only needed for branch refs):**

`https://purge.jsdelivr.net/gh/mindattic/MindAttic.UiUx@main/Components/Cyberspace/console-bg.js` — GET to purge.

## Pipeline 2 — GitHub Actions cross-repo sync (in-repo copies)

`.github/workflows/sync-subscribers.yml` runs on every push to `main` that touches a spliced component (`Components/Cyberspace/**`, `Components/OutfitFont/**`), `subscribers.json`, `sync/**`, or the workflow itself — unless the commit message contains `[skip ci]`.

It targets the two splice-in-place subscribers that live in their own repos:

- **mindattic.com** — only the CYBERSPACE marker block in `index.htm` (scan-line divs, frontpage CSS, the small loader scripts and the deferred CDN `<script>` tags pinned to the latest tag). Fonts, logos and the engine itself load from jsDelivr.
- **MindAttic.Psst (terms.htm + privacy.htm)** — small legal pages that are hand-authored around the OutfitFont marker block; `index.htm` is NOT touched (it's rendered by `MindAttic.Deploy` from `MindAttic.Psst/README.md`).

For each subscriber it:

1. Checks out MindAttic.UiUx
2. Checks out the subscriber repo (using a fine-grained PAT)
3. Runs the matching `sync/sync-*.ps1` script with `-ContentRoot` and subscriber paths supplied
4. Opens (or updates) a PR titled "Sync from MindAttic.UiUx" on branch `auto/sync-components`

## One-time setup (PAT for cross-repo PRs)

The Action needs write access to the subscriber repos. Create a **fine-grained personal access token**:

1. Go to https://github.com/settings/personal-access-tokens/new
2. Repository access: **All repositories owned by `mindattic`** — covers every current and future subscriber automatically
3. Repository permissions:
   - **Contents**: Read and write
   - **Pull requests**: Read and write
   - **Metadata**: Read-only (auto-included)
4. Expiration: pick whatever you're comfortable rotating (e.g. 1 year)
5. Generate token, copy the value

Then in this repo (MindAttic.UiUx):

1. Go to https://github.com/mindattic/MindAttic.UiUx/settings/secrets/actions
2. **New repository secret**
3. Name: `SUBSCRIBER_REPO_TOKEN`
4. Value: paste the PAT

The workflow will now succeed.

## Pipeline 3 — PowerShell `sync/*.ps1` (local dev fallback)

For fast iteration without pushing to GitHub, the `sync/sync-all.ps1` script does the same work locally against your working copies of the subscriber repos (retired subscribers are skipped with a notice). Run it after any edit under a component folder:

```powershell
powershell -File sync/sync-all.ps1
```

`MindAttic.Deploy` also invokes `sync-mindattic-com.ps1` as a `preDeploy` hook (passing the release tag during a linked deploy) so the block is fresh before each FTPS upload. Its (disabled) Prose app still lists `sync-prose.ps1`, which now just reports the Prose subscribers as retired.

## Choosing a pipeline per subscriber

| Subscriber kind | Recommended runtime source | Why |
|---|---|---|
| `mindattic.com` | CYBERSPACE marker block (kept fresh by Action / `sync-mindattic-com.ps1`) + jsDelivr for fonts, logo and the engine | Small hand-authored page; heavy assets are cached once on the CDN and shared with the other sites |
| `ryandebraal.com`, `mindatticcares.com` | jsDelivr only (no splice) | Hand-authored pages that reference `fonts/` and their own `<domain>/` asset folder by tag-pinned URL |
| `MindAttic.Psst` legal pages | Inlined OUTFITFONT marker block in `terms.htm` + `privacy.htm` (kept fresh by Action / `sync-mindattic-psst.ps1`) | Small legal pages hand-authored around the block |
| Tutor (Blazor) | `app.css` marker blocks (local `sync-tutor.ps1` only) | Blazor build needs deterministic input |
| Prose.Writer / Prose.Codex / Ideas | — (retired) | Target projects no longer exist; see `retired` in `subscribers.json` |
| Any catalog landing page | jsDelivr CDN, pinned via `MindAttic.Deploy/projects.json:componentsVersion` | No PR overhead; `MindAttic.Deploy` renders these from each project's `README.md` and pulls fonts/effects from the CDN at runtime |
| Claudia / ChiMesh | jsDelivr CDN, same path as catalog landing pages | They render long-form READMEs with the Cyberspace theme + the parts-picker augmentation; CDN keeps each guide page small |
| Anything new | jsDelivr CDN | Only fall back to pipeline 2 if the subscriber needs hand-authored content interleaved with the components |
