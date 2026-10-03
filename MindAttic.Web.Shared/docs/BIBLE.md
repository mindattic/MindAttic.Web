---
codex: 1
project: MindAttic.UiUx
code: MAU
layer: bible
status: living
updated: 2026-10-03
---

# MindAttic.UiUx — Project Bible
> Single source of truth for what MindAttic.UiUx IS, is NOT, and the rules that keep it coherent.
> README says how to build/run; this says how to think about the system.

## 1. The one sentence {#MAU-§1}
MindAttic.UiUx is the org's **one-repo, every-front-end component library and shared runtime asset
package**: a catalog of self-contained CSS/JS/HTML bundles (fonts, effects, helpers) plus the fonts,
logos, theme art and parallax textures of every MindAttic site, organised by domain, delivered three
ways — jsDelivr CDN at a pinned whole-number tag, splice-in-place marker-block sync, and a cross-repo
GitHub Actions PR.

## 2. The product promise {#MAU-§2}
- **One source of truth, three delivery modes.** A component is authored once under `Components/`
  (or `Themes/`); the CDN, the sync scripts, and the GitHub Action all read that same source — nothing
  is duplicated in source control. See [§4](#MAU-§4).
- **Zero build step on the subscriber side.** No `npm install`, no peerdeps. Subscribers either pull a
  pinned CDN tag or receive a regenerated marker block.
- **Declarative subscribers.** `subscribers.json` is the canonical map of which component flows to which
  subscriber and with what per-subscription override; adding/removing a line enrolls/unenrolls on the
  next sync ([MAU-LAW-1](#MAU-LAW-1)).
- **Immutable, whole-number versioning on the CDN.** `@Vn` tags are edge-cached forever; `@main` tracks
  tip-of-tree. Subscribers pick their guarantee ([HOUSE-LAW-1](../MindAttic.HouseRules.md#HOUSE-LAW-1)).
- **Self-contained components.** Each folder ships its own source, usage HTML, markdown doc, and JSON
  config. No cross-component imports — a single component can be vendored without the rest
  ([MAU-LAW-3](#MAU-LAW-3)).
- **Marker-block contract.** Every splice is bounded by `BEGIN/END MINDATTIC.UIUX:<MARKER>` comments;
  only what is between the markers is regenerated ([MAU-LAW-2](#MAU-LAW-2)).
- **One shared asset backend.** The three sites (`mindattic.com`, `ryandebraal.com`, `mindatticcares.com`)
  embed no binary assets; each references fonts and art by tag-pinned jsDelivr URL, all pinned to the
  same tag (currently `V10`) by `MindAttic.Deploy`'s linked deploy ([MAU-LAW-7](#MAU-LAW-7)). Layout,
  naming and quality rules are in [ASSETS.md](ASSETS.md); the verified file list is `assets-manifest.json`.

## 3. What it is NOT {#MAU-§3}
- **NOT a deploying repo.** It owns no hosting. Its only CDN consumers are the three sites, whose tag
  pin, CDN check and upload are done by `MindAttic.Deploy`'s linked deploy. A project's page is its
  GitHub README; nothing renders project pages from UiUx components ([MAU-LAW-4](#MAU-LAW-4)).
- **NOT a place to hand-edit downstream copies.** Spliced/derived copies in subscriber repos are
  derived artifacts; the next sync overwrites whatever is between the marker pairs.
- **NOT a multi-component framework with shared runtime.** There is no shared bundle, no cross-component
  import graph, no dependency resolver beyond per-component declared assets.
- **NOT semantically versioned.** Tags are whole numbers (`V1`, `V2`, …) only — never SemVer
  ([HOUSE-LAW-1](../MindAttic.HouseRules.md#HOUSE-LAW-1)).
- **NOT a `.idea` package builder.** The repo has no `Ideas/` packaging subtree. `build.ps1` still
  expects one and therefore throws for every `-Output` ([§6](#MAU-§6)).

## 4. Architecture canon {#MAU-§4}

```
            Components/ + Themes/ + fonts/ + <domain>/     <-- single source of truth
                              |
        +---------------------+----------------------+
        |                     |                      |
   jsDelivr CDN          sync/*.ps1            .github Action
   @Vn / @main          (splice-in-place)     (cross-repo PRs)
        |                     |                      |
   the three sites    mindattic.com / Psst /  mindattic.com + Psst
   (tag pinned by     Tutor (local)           (PR on push to main)
    linked deploy)    via subscribers.json
```

### 4.1 Projects / top-level layout
- `Components/` — canonical component source. Each is self-contained: `<name>.{html,css,js}` +
  optional `<name>.json` config + `<FolderName>.md` doc. Catalog (13): Cyberspace, SacredGeometry,
  OutfitFont, AtticFont, PinFooter, BackHomeM, WebSnapshot, PageScrollbar, Textbox, Tooltip, UserLogin,
  UserCircle, UserTimeout (per-component table in `README.md` and `docs/data/components.json`).
- `Themes/` — composed bundles built from components (`Themes/Cyberspace/`: `theme.css`,
  `body-prelude.html`, `deps.json`). No current page loads it; it is served for any page that wants it.
- `fonts/` — web fonts shared by more than one site (`fonts/outfit/`, `fonts/attic/`).
- `<domain>/<category>/` — per-site runtime assets: `mindattic.com/logos/`,
  `mindatticcares.com/{logos,icons,images}/`, `ryandebraal.com/{themes/<name>,images}/`. See
  [ASSETS.md](ASSETS.md).
- `archive/` — files no site references (font TTF sources, brand masters, art a page keeps inline), at
  the relative path they would have in the package. In the repo, not served ([MAU-LAW-7](#MAU-LAW-7)).
- `assets-manifest.json` — generated by `tools/build-asset-manifest.ps1`: path, bytes, SHA-256 and pixel
  size of every served asset (60 files).
- `tests/` — the Playwright suite that validates this package and the three sites that consume it
  (`tests/README.md`).
- `sync/` — PowerShell splice scripts + `sync-all.ps1` umbrella, all dot-sourcing `_subscribers.ps1`.
- `subscribers.json` — canonical `components` registry + `subscribers` map ([§4.2](#MAU-§4)).
- `build.ps1` — build CLI for `Ideas/` packaging projects; non-functional without that subtree ([§6](#MAU-§6)).
- `.github/` — `.github/PIPELINES.md` + `.github/workflows/sync-subscribers.yml`.

### 4.2 Domain model (NOUNS)
- **Component** — a self-contained front-end bundle under `Components/<Name>/`. The atom of the catalog.
- **Theme** — a composed bundle under `Themes/<Name>/` referencing components via `deps.json`.
- **Asset** — a static runtime file (font, image, texture) served from this repo over jsDelivr; lives
  under the top-level `fonts/`, `<domain>/<category>/` or a component's own `assets/` folder.
- **Domain folder** — the top-level folder named for a site (`mindattic.com/`, …) that holds that site's
  own assets in category folders (`logos/`, `icons/`, `images/`, `themes/<name>/`).
- **Subscriber** — a consuming repo/property declared in `subscribers.json` (`kind` ∈
  `html-inline`, `blazor-wwwroot`, `html-inline-multi`). Current entries:

  | Subscriber | Kind | Subscriptions | Delivered by |
  |---|---|---|---|
  | `mindattic.com` | `html-inline` (`index.htm`) | Cyberspace | Action + `sync-mindattic-com.ps1` (also the site's linked-deploy `preDeploy` hook) |
  | `MindAttic.Psst.Legal` | `html-inline-multi` (`terms.htm`, `privacy.htm`) | OutfitFont | Action + `sync-mindattic-psst.ps1` |
  | `Tutor` | `blazor-wwwroot` | UserLogin, UserCircle, UserTimeout | `sync-tutor.ps1` (local only) |
  | `Prose.Writer`, `Prose.Codex`, `Ideas` | `blazor-wwwroot` | (retired) | `sync-prose.ps1`, `sync-ideas.ps1` report and exit 0 |

  `ryandebraal.com` and `mindatticcares.com` are not subscribers: they load from the CDN only.
- **Subscription** — one `{ component, …overrides }` entry on a subscriber (e.g. `applyToSelector`,
  `jsOnly`). Override precedence: subscription value > component JSON default > none.
- **Retired subscriber** — an entry carrying a `"retired"` string (why, and how to re-enroll: point
  `target` at the successor project, add the marker pairs, delete the field). Its target project does not
  exist; its script prints the note and exits 0.
- **Marker block** — the `BEGIN/END MINDATTIC.UIUX:<MARKER>` region in a subscriber file that a sync
  regenerates.

### 4.3 Key services (VERBS)
- **sync** (`sync/sync-*.ps1`, umbrella `sync-all.ps1`) — splice a component's bundle into a subscriber's
  marker block, idempotently, keeping the host file's line endings (`Get-DominantEol` / `ConvertTo-Eol`).
  `_subscribers.ps1`'s `Get-Subscriber` reads `subscribers.json`; `Test-SubscriberRetired` makes a retired
  subscriber's script print its note and exit 0, so `sync-all.ps1` stays green.
- **mindattic.com splice** (`sync/sync-mindattic-com.ps1`) — writes the CYBERSPACE block: the small
  Cyberspace scripts inline, `sacred-geometry.js` + `console-bg.js` as `defer` jsDelivr `<script>` tags,
  and low-priority preloads of the three parallax textures. `-CyberspaceCdnTag` defaults to the latest
  `V*` tag (`git describe`, fallback `V7` outside a git checkout); the linked deploy passes the release tag.
- **cross-repo sync** (`.github/workflows/sync-subscribers.yml`) — two jobs, `sync-mindattic-com` and
  `sync-mindattic-psst`. On a push to `main` touching `Components/Cyberspace/**`,
  `Components/OutfitFont/**`, `subscribers.json`, `sync/**` or the workflow (or on `workflow_dispatch`;
  not when the commit says `[skip ci]`), each checks out this repo (the mindattic.com job with
  `fetch-depth: 0` so the tag can be derived) and the subscriber repo, runs its sync script and opens or
  updates a PR on branch `auto/sync-components`, using the `SUBSCRIBER_REPO_TOKEN` PAT. There is no
  Tutor or Prose job.
- **CDN delivery** — implicit; jsDelivr serves any path at a pinned `@Vn` tag (no infra here).
- **release** — `MindAttic.Deploy`'s linked deploy (`npm run deploy -- --uiux`, or `--site` for any of the
  three sites) tags the next `V<n>` when `HEAD` is ahead of the latest tag, pins it in the three sites,
  runs the `preDeploy` hooks, verifies every used asset on jsDelivr, then uploads the sites.
- **asset manifest** (`tools/build-asset-manifest.ps1`, `-Verify` fails if stale) — regenerates
  `assets-manifest.json`.

## 5. The Laws {#MAU-§5}
This project **inherits the org-wide House Rules** verbatim — see
[`MindAttic.HouseRules.md`](../MindAttic.HouseRules.md): whole-number versioning
([HOUSE-LAW-1](../MindAttic.HouseRules.md#HOUSE-LAW-1)), soft-disable
([HOUSE-LAW-2](../MindAttic.HouseRules.md#HOUSE-LAW-2)), Vault-resolved credentials
([HOUSE-LAW-3](../MindAttic.HouseRules.md#HOUSE-LAW-3)), guarded-zip packaging lifecycle
([HOUSE-LAW-5](../MindAttic.HouseRules.md#HOUSE-LAW-5)), one-engine-many-front-doors
([HOUSE-LAW-6](../MindAttic.HouseRules.md#HOUSE-LAW-6)), verified-done
([HOUSE-LAW-8](../MindAttic.HouseRules.md#HOUSE-LAW-8)), and `psst`-only-on-request
([HOUSE-LAW-9](../MindAttic.HouseRules.md#HOUSE-LAW-9)). The following are the **project-specific** laws.

### MAU-LAW-1 — `subscribers.json` is the only enrollment list {#MAU-LAW-1}
No subscriber has a hardcoded component list. Which component flows to which subscriber, and every
per-subscription override, is declared in `subscribers.json`. Sync scripts iterate the subscriber's
`subscriptions` array via `Get-Subscriber`. Adding/removing a line is the entire enrollment action.

### MAU-LAW-2 — Only marker blocks are regenerated {#MAU-LAW-2}
Every splice is bounded by a comment pair (`<!-- BEGIN MINDATTIC.UIUX:<MARKER> -->` / CSS
`/* == BEGIN MINDATTIC.UIUX:<MARKER>.CSS == */`). Anything outside the markers is left untouched.
The generated body opens with a `Generated by …` warning. Downstream copies are derived artifacts and
are never hand-edited. Syncs must be idempotent (running twice with no source change yields no diff).

### MAU-LAW-3 — Components are self-contained {#MAU-LAW-3}
Each `Components/<Name>/` ships everything it needs and imports no other component at the source level
(runtime feeds like Cyberspace→SacredGeometry are explicit, optional, and resolved by the host). A single
component must be vendorable without dragging the rest.

### MAU-LAW-4 — This repo does not deploy {#MAU-LAW-4}
Hosting, tag pinning and uploads belong to `MindAttic.Deploy`. Do not add `landing-page`/`build-html-js`
kinds to `subscribers.json`, and do not add sync scripts that render project pages
(`sync-landing-page.ps1`, `sync-claudia.ps1`, `sync-chimesh.ps1`); a project's page is its GitHub README.

### MAU-LAW-5 — Nothing is copied twice {#MAU-LAW-5}
Raw source under `Components/` and `Themes/` and every served asset exist in exactly one place. The
package holds no byte-identical duplicate files (enforced by `tests/specs/assets/manifest.spec.mjs`). A
packaging project (such as an `Ideas/*` RCL) declares the canonical assets it needs in a manifest
(`idea.assets.json` or equivalent) and stages them at build time; it never commits copies.

### MAU-LAW-6 — Published CDN tags are immutable {#MAU-LAW-6}
Never mutate a published whole-number tag (`V1`, `V2`, …). Ship the next number alongside it; consumers
pin the exact one (the sites' `MindAttic.UiUx@V<n>` URLs set by the linked deploy, or
`sync-mindattic-com.ps1 -CyberspaceCdnTag`). This refines [HOUSE-LAW-1](../MindAttic.HouseRules.md#HOUSE-LAW-1).

### MAU-LAW-7 — Sites load assets from the package; only used files are served {#MAU-LAW-7}
A MindAttic site embeds no binary asset (base64 font, image, texture) in its HTML; it loads each from a
tag-pinned jsDelivr URL into this package. Placement: used by several sites → `fonts/`; used by one site →
`<domain>/<category>/`; needed by a component → that component's folder. Every served file is listed in
`assets-manifest.json`; a file no site references lives in `archive/` and is never linked. Lossy files keep
full resolution and bytes; lossless recompression must be pixel-identical; fonts are validated before
commit ([ASSETS.md](ASSETS.md)).

## 6. Verified state {#MAU-§6}
Status legend: ✅ done (verified) · 🟡 partial · ⬜ planned · living.

- ✅ **Shared asset package (`fonts/`, `<domain>/`, `Components/Cyberspace/assets/`).** 60 served files,
  matching `assets-manifest.json` byte-for-byte. Verified 2026-10-03: `npx playwright test --project=assets`
  in `tests/` — 91 passed (manifest exact, fonts and images decode, budgets, naming, layout, `archive/`
  kept out).
- ✅ **Sites consume the package at the pinned tag.** `tests/specs/sites/*.spec.mjs` checks each of the
  three sites for clean loads, allowed hosts, the expected tag (highest `V<n>`, override `UIUX_TAG`), no
  overflow at every viewport and view, and CDN-loaded fonts. Verified 2026-10-03: `npx playwright test`
  in `tests/` (local mode) — 162 passed, 5 skipped (the live-only CDN specs).
- 🟡 **Component catalog (`Components/`).** Thirteen self-contained components present with source + docs.
  No component-level tests; correctness is verified manually (harnesses `Components/Cyberspace/index.htm`,
  `Components/SacredGeometry/index.htm`) and through the sites suite (Cyberspace on mindattic.com).
- 🟡 **Distribution (`sync/`, Action).** `sync-mindattic-com.ps1` run against a copy of
  `mindattic.com/index.htm` is byte-identical (idempotent); `sync-prose.ps1` and `sync-ideas.ps1` report
  their retired subscribers and exit 0. No automated sync test; the Action's last run is not captured here.
- ⬜ **`build.ps1`.** Every output resolves an `Ideas/MindAttic.Ideas.{Plugin|Theme}.<Build>` project first
  and throws `No Ideas/ build-projects folder` because the repo has no `Ideas/` subtree (verified
  2026-10-03 with `-Output standalone`). `-Output blazor` is a stub warning.

## 7. Active frontier {#MAU-§7}
- Graduate the distribution stories to ✅ with an automated sync-idempotency check.
- Decide `build.ps1`'s fate: make `standalone` work from `Components/` directly, or remove the script.
- Epics and backlog: see [USER_STORIES.md](USER_STORIES.md).

## 8. Quality bar {#MAU-§8}
A feature is **done** (✅) only when:
1. It builds or runs clean where that applies — per [HOUSE-LAW-8](../MindAttic.HouseRules.md#HOUSE-LAW-8).
2. For a component change, the relevant `sync/sync-*.ps1` runs **idempotently** (a second run yields no
   diff) and a single component is independently vendorable ([MAU-LAW-3](#MAU-LAW-3)).
3. Canonical source is edited in `Components/`/`Themes/` only; no derived/downstream copy is hand-edited
   ([MAU-LAW-2](#MAU-LAW-2)); nothing is copied twice ([MAU-LAW-5](#MAU-LAW-5)).
4. An asset change regenerates `assets-manifest.json` and passes `tests/` (`npm run test:local`)
   ([MAU-LAW-7](#MAU-LAW-7)).
5. A shipped content change is published behind the **next whole-number tag**, never by mutating an
   existing one ([MAU-LAW-6](#MAU-LAW-6)).
6. The verifying evidence is named in the story (test token, or the command + observed result).

## 9. Glossary {#MAU-§9}
- **Component** — self-contained bundle under `Components/<Name>/`; the catalog atom.
- **Theme** — composed bundle under `Themes/<Name>/` (`deps.json` lists its component deps).
- **Subscriber** — consuming property declared in `subscribers.json`.
- **Subscription** — one component entry (with overrides) on a subscriber.
- **Retired subscriber** — a `subscribers.json` entry with a `"retired"` note; its sync reports and exits 0.
- **Marker block** — `BEGIN/END MINDATTIC.UIUX:<MARKER>` region a sync regenerates.
- **Splice-in-place** — delivery mode that rewrites only the marker block in a subscriber file.
- **jsDelivr CDN** — `cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@<ref>/<path>`, the runtime delivery.
- **`subscribers.json`** — canonical components-registry + subscriber map (L5 data).
- **`Vn` tag** — a whole-number release tag; immutable once published ([MAU-LAW-6](#MAU-LAW-6)).
- **Linked deploy** — `MindAttic.Deploy`'s release flow that tags this package and pins the tag in the
  three sites together.
- **Asset manifest** — `assets-manifest.json`; the generated, verifiable list of every served asset.
- **`archive/`** — kept-but-unserved files ([MAU-LAW-7](#MAU-LAW-7)).
