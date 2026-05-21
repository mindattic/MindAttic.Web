# Delivery pipelines

MindAttic.Content is a source-of-truth repo. Consumers (mindattic.com, StreetSamurai) receive content through two complementary pipelines.

## Pipeline 1 — jsDelivr CDN (runtime)

Every file in this repo is served by [jsDelivr](https://www.jsdelivr.com/) at a versioned URL — zero setup, global edge cache.

**URL shape:**

```
https://cdn.jsdelivr.net/gh/mindattic/MindAttic.Content@<ref>/cbg/<file>
```

Where `<ref>` is any of:

| Ref form | Example | Behavior |
|---|---|---|
| Tag (recommended for prod) | `@v1.0.0` | Immutable; cached forever |
| Branch | `@main` | Cached ~7 days unless purged |
| Commit SHA | `@a1b2c3d` | Immutable; cached forever |

**Examples:**

```html
<!-- pinned, production -->
<script src="https://cdn.jsdelivr.net/gh/mindattic/MindAttic.Content@v1.0.0/cbg/console-bg.js"></script>
<link  rel="stylesheet" href="https://cdn.jsdelivr.net/gh/mindattic/MindAttic.Content@v1.0.0/cbg/frontpage.css">

<!-- bleeding edge (dev only) -->
<script src="https://cdn.jsdelivr.net/gh/mindattic/MindAttic.Content@main/cbg/console-bg.js"></script>
```

**Cutting a release:**

```bash
git tag v1.0.0
git push --tags
# jsDelivr serves the new tag immediately
```

**Purging the cache (rare, only needed for branch refs):**

`https://purge.jsdelivr.net/gh/mindattic/MindAttic.Content@main/cbg/console-bg.js` — GET to purge.

## Pipeline 2 — GitHub Actions cross-repo sync (in-repo copies)

`.github/workflows/sync-consumers.yml` runs on every push to `main` that touches `cbg/**`, `sync/**`, or the workflow itself.

For each consumer it:

1. Checks out MindAttic.Content
2. Checks out the consumer repo (using a fine-grained PAT)
3. Runs the matching `sync/sync-*.ps1` script with `-ContentRoot` and consumer paths supplied
4. Opens (or updates) a PR titled "Sync CBG bundle from MindAttic.Content" on branch `auto/sync-cbg`

This pipeline exists because some consumers benefit from carrying a local copy:

- **mindattic.com** — the marker block in `index.htm` is inlined for first-paint perf; CDN is optional fallback
- **StreetSamurai** — Blazor's `wwwroot/js/*` is part of the build output; carrying the JS locally keeps the offline dev loop fast

## One-time setup (PAT for cross-repo PRs)

The Action needs write access to mindattic.com and StreetSamurai. Create a **fine-grained personal access token**:

1. Go to https://github.com/settings/personal-access-tokens/new
2. Repository access: **Only select repositories** → pick `mindattic/mindattic.com` AND `mindattic/StreetSamurai`
3. Repository permissions:
   - **Contents**: Read and write
   - **Pull requests**: Read and write
   - **Metadata**: Read-only (auto-included)
4. Expiration: pick whatever you're comfortable rotating (e.g. 1 year)
5. Generate token, copy the value

Then in this repo (MindAttic.Content):

1. Go to https://github.com/mindattic/MindAttic.Content/settings/secrets/actions
2. **New repository secret**
3. Name: `CONSUMER_REPO_TOKEN`
4. Value: paste the PAT

The workflow will now succeed.

## Pipeline 3 — PowerShell `sync/*.ps1` (local dev fallback)

For fast iteration without pushing to GitHub, the `sync/sync-all.ps1` script does the same work locally against your working copies of the consumer repos. Run it after any edit under `cbg/`:

```powershell
powershell -File sync/sync-all.ps1
```

The `/sync` slash command wraps this.

## Choosing a pipeline per consumer

| Consumer | Recommended runtime source | Why |
|---|---|---|
| `mindattic.com` | Inlined marker block (kept fresh by Action) — fall back to CDN if first-paint perf matters less | Static HTML site; inlining = zero-RTT first paint |
| `StreetSamurai` | Local `wwwroot/js/*.js` (kept fresh by Action) — or CDN for cache-sharing across other sites | Blazor server-render; either works, local is offline-dev friendly |
| New consumer | jsDelivr CDN | No PR overhead; just pin a tag |
