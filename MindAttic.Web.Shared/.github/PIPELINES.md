# Delivery pipelines

MindAttic.Components is a source-of-truth repo. Subscribers (mindattic.com, StreetSamurai, Claudia, ChiMesh) receive content through two complementary pipelines.

## Pipeline 1 — jsDelivr CDN (runtime)

Every file in this repo is served by [jsDelivr](https://www.jsdelivr.com/) at a versioned URL — zero setup, global edge cache.

**URL shape:**

```
https://cdn.jsdelivr.net/gh/mindattic/MindAttic.Components@<ref>/<ComponentFolder>/<file>
```

Where `<ref>` is any of:

| Ref form | Example | Behavior |
|---|---|---|
| Tag (recommended for prod) | `@v1.0.0` | Immutable; cached forever |
| Branch | `@main` | Cached ~7 days unless purged |
| Commit SHA | `@a1b2c3d` | Immutable; cached forever |

Component folder names are case-sensitive on GitHub (`Cyberspace`, `OutfitFont`, `AtticFont`, `PinFooter`, `BackHomeM`, `WebSnapshot`).

**Examples:**

```html
<!-- pinned, production -->
<script src="https://cdn.jsdelivr.net/gh/mindattic/MindAttic.Components@v1.0.0/Cyberspace/console-bg.js"></script>
<link  rel="stylesheet" href="https://cdn.jsdelivr.net/gh/mindattic/MindAttic.Components@v1.0.0/Cyberspace/frontpage.css">

<!-- bleeding edge (dev only) -->
<script src="https://cdn.jsdelivr.net/gh/mindattic/MindAttic.Components@main/Cyberspace/console-bg.js"></script>
```

**Cutting a release:**

```bash
git tag v1.0.0
git push --tags
# jsDelivr serves the new tag immediately
```

**Purging the cache (rare, only needed for branch refs):**

`https://purge.jsdelivr.net/gh/mindattic/MindAttic.Components@main/Cyberspace/console-bg.js` — GET to purge.

## Pipeline 2 — GitHub Actions cross-repo sync (in-repo copies)

`.github/workflows/sync-subscribers.yml` runs on every push to `main` that touches any component folder (`AtticFont/**`, `BackHomeM/**`, `Cyberspace/**`, `OutfitFont/**`, `PinFooter/**`, `WebSnapshot/**`), `subscribers.json`, `sync/**`, or the workflow itself.

For each subscriber it:

1. Checks out MindAttic.Components
2. Checks out the subscriber repo (using a fine-grained PAT)
3. Runs the matching `sync/sync-*.ps1` script with `-ContentRoot` and subscriber paths supplied
4. Opens (or updates) a PR titled "Sync from MindAttic.Components" on branch `auto/sync-components`

This pipeline exists because every subscriber carries a local copy of its rendered markers:

- **mindattic.com** — marker blocks in `index.htm` are inlined for first-paint perf; CDN is optional fallback.
- **StreetSamurai** — Blazor's `wwwroot/js/*` is part of the build output; carrying the JS locally keeps the offline dev loop fast.
- **Claudia / ChiMesh** — marker blocks live inside the `<style>` template literal in `scripts/cli/build-html.js`, so the generated HTML is fully self-contained at build time.

## One-time setup (PAT for cross-repo PRs)

The Action needs write access to every subscriber repo. Create a **fine-grained personal access token**:

1. Go to https://github.com/settings/personal-access-tokens/new
2. Repository access: **All repositories owned by `mindattic`** — covers every current and future subscriber automatically
3. Repository permissions:
   - **Contents**: Read and write
   - **Pull requests**: Read and write
   - **Metadata**: Read-only (auto-included)
4. Expiration: pick whatever you're comfortable rotating (e.g. 1 year)
5. Generate token, copy the value

Then in this repo (MindAttic.Components):

1. Go to https://github.com/mindattic/MindAttic.Components/settings/secrets/actions
2. **New repository secret**
3. Name: `SUBSCRIBER_REPO_TOKEN`
4. Value: paste the PAT

The workflow will now succeed.

## Pipeline 3 — PowerShell `sync/*.ps1` (local dev fallback)

For fast iteration without pushing to GitHub, the `sync/sync-all.ps1` script does the same work locally against your working copies of the subscriber repos. Run it after any edit under a component folder:

```powershell
powershell -File sync/sync-all.ps1
```

The `/sync` slash command wraps this.

## Choosing a pipeline per subscriber

| Subscriber | Recommended runtime source | Why |
|---|---|---|
| `mindattic.com` | Inlined marker block (kept fresh by Action) — fall back to CDN if first-paint perf matters less | Static HTML site; inlining = zero-RTT first paint |
| `StreetSamurai` | Local `wwwroot/js/*.js` (kept fresh by Action) — or CDN for cache-sharing across other sites | Blazor server-render; either works, local is offline-dev friendly |
| `Claudia` / `ChiMesh` | Marker blocks inside `build-html.js` (kept fresh by Action); regenerated HTML inherits at next build | Markdown-to-HTML pipelines; the rendered output is shipped, so fonts must be embedded at build time |
| New subscriber | jsDelivr CDN | No PR overhead; just pin a tag |
