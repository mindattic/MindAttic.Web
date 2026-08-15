# MindAttic.UiUx

**One repo, every front-end. Drop-in CSS, JS, and HTML bundles, delivered three ways.**

A growing catalog of self-contained components — fonts, effects, helpers, auth-visual widgets —
that any subscriber can pull in via jsDelivr CDN at runtime, splice in via marker-block sync at
build time, or accept as a cross-repo PR from GitHub Actions. Zero build step on the subscriber
side, no `npm install`, no peerdeps.

Canonical docs (read these for architecture, laws, and verified state — this file is the practical
build/run/catalog tour and does not restate them):

- [`docs/BIBLE.md`](docs/BIBLE.md) — L0, what the system is/is not, architecture, the Laws (`MAU-LAW-1..6`)
- [`docs/AMENDMENTS.md`](docs/AMENDMENTS.md) — L1, append-only change log (`MAU-A<n>`)
- [`docs/USER_STORIES.md`](docs/USER_STORIES.md) — L2, stories with test/evidence citations
- [`docs/data/components.json`](docs/data/components.json) — L5, the component catalog as data
- [`docs/rfc/`](docs/rfc/) — design notes
- [`CLAUDE.md`](CLAUDE.md) — working rules for the AI agent in this repo

```html
<!-- pinned production -->
<script src="https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@V5/Components/Cyberspace/console-bg.js"></script>
<link  rel="stylesheet" href="https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@V5/Components/Cyberspace/frontpage.css">
```

**Why MindAttic.UiUx:**

- **Three delivery modes, one source of truth.** jsDelivr CDN for runtime, GitHub Actions for
  cross-repo PRs, PowerShell scripts for local dev — all reading the same
  [`subscribers.json`](subscribers.json).
- **Subscribers are declarative.** Add `{ "component": "AtticFont", "applyToSelector": ".site-name" }`
  to a subscriber's array. The next sync enrolls it. Remove the line, the next sync unenrolls. No
  hardcoded lists.
- **Versioned by tag, immutable on CDN.** `@V5` is edge-cached forever; `@main` always tracks
  tip-of-tree. Subscribers pick their guarantee. Tags are whole-number integers (`V1` … `V5`, current
  latest tag in this repo).
- **Self-contained components.** Each folder ships its own source, usage HTML, markdown doc, and
  JSON config. No cross-component imports — you can vendor a single component without dragging the
  rest.
- **Marker-block contract.** Every splice is bounded by `BEGIN/END MINDATTIC.UIUX:<MARKER>` comments.
  Subscribers hand-author the rest of the file without conflict; only what's between the markers is
  regenerated.

---

## What it is / is not

This repo **does not deploy** anything itself. It owns no hosting. Two other repos are its natural
neighbors:

- [`MindAttic.Deploy`](../MindAttic.Deploy/README.md) renders the catalog landing pages (IdiotProof,
  GridGame2026, MindAttic.Legion, MediaButler, MindAttic.Vault, TaxRateCollector, ThinkTank, Tutor's
  marketing page, MindAttic.Psst index) and the Claudia/ChiMesh long-form HTML guides — all of which
  pull components from the jsDelivr CDN at runtime, pinned via `MindAttic.Deploy/projects.json:componentsVersion`.
  Nothing in `subscribers.json` targets those pages, and `sync/` intentionally has no scripts for them
  (see `MAU-LAW-4` in the Bible).
- A handful of Blazor apps and hand-authored static pages instead receive **splice-in-place** updates:
  a PowerShell script (or a GitHub Action running the same script) rewrites only the content between
  `BEGIN/END MINDATTIC.UIUX:<MARKER>` comment pairs in a file that subscriber otherwise hand-authors.
  See [Subscribers & sync mechanism](#subscribers--sync-mechanism) below.

---

## Component catalog

Thirteen components live under `Components/`, each fully self-contained: source files, a usage
`.html` snippet, a `<FolderName>.md` doc (except Textbox, documented inline in its CSS header), and
any companion `.json` config. Verified against `docs/data/components.json` (updated 2026-06-07).

| Component | Type | What it does | Docs |
|---|---|---|---|
| **[Cyberspace](Components/Cyberspace/Cyberspace.md)** | HTML + CSS + JS bundle | Cyberpunk console-background effects engine — 12 named effects (TERMINAL, CRASH, TREMOR, LEAK, SCHEMATIC, CASCADE, ARTIFACT × 7 variants, FRAGMENT, TRACE, PULSAR, HEIST, PREDATOR), scan-line overlay, parallax circuit-board, keepout zones around content. SCHEMATIC pulls its shapes from SacredGeometry. | [Cyberspace.md](Components/Cyberspace/Cyberspace.md) |
| **[SacredGeometry](Components/SacredGeometry/SacredGeometry.md)** | JS (UMD) + SVG | Catalog of 1024 unique, animatable line-art shapes (polyhedra, parametric curves, knots, fractals). One pure renderer targets a live `<canvas>` or a static SVG string; a Node build (`build-previews.mjs`) emits a poster per shape and doubles as a smoke test. Feeds Cyberspace's SCHEMATIC effect. | [SacredGeometry.md](Components/SacredGeometry/SacredGeometry.md) |
| **[OutfitFont](Components/OutfitFont/OutfitFont.md)** | font + CSS | Outfit variable font (Google Fonts, weights 100–900) inlined as base64 woff2. Two `@font-face` declarations (Latin + Latin-Extended) plus `:root { --font-outfit: 'Outfit', system-ui, sans-serif; }`. | [OutfitFont.md](Components/OutfitFont/OutfitFont.md) |
| **[AtticFont](Components/AtticFont/AtticFont.md)** | font + CSS | Attic display face inlined as base64 woff2. Single `@font-face` plus `:root { --font-attic: 'Attic', serif; }`. Per-subscriber `applyToSelector` controls where Attic is auto-applied (`.site-name`, …). | [AtticFont.md](Components/AtticFont/AtticFont.md) |
| **[PinFooter](Components/PinFooter/PinFooter.md)** | CSS + JS | Pin-when-short footer. Toggles `position: fixed; bottom: 0` on any element with class `pin-when-short` while the document is shorter than the viewport; releases it when content overflows. | [PinFooter.md](Components/PinFooter/PinFooter.md) |
| **[BackHomeM](Components/BackHomeM/BackHomeM.md)** | CSS only | A capital "M" in AtticFont pinned to the upper-left, linking back to mindattic.com. Used on satellite sites (Claudia, ChiMesh) so a visitor can always get home. | [BackHomeM.md](Components/BackHomeM/BackHomeM.md) |
| **[WebSnapshot](Components/WebSnapshot/WebSnapshot.md)** | Node CLI + browser viewer | Capture a fresh screenshot of any URL with Playwright, scale + crop it to a preview rectangle (cover-fit + alignment crop), and inline the result as a base64 data URI inside any `.web-snapshot` container. | [WebSnapshot.md](Components/WebSnapshot/WebSnapshot.md) |
| **[PageScrollbar](Components/PageScrollbar/PageScrollbar.md)** | CSS + JS + optional Razor | Replaces the native page scrollbar with a themed, draggable overlay (track + thumb). Zero dependencies. Native scrollbar hidden only after the script adds `.ma-sb-active` to `<html>` (progressive enhancement for no-JS clients). Namespaced `.ma-scrollbar*` / `.ma-sb-*`. Optional Blazor `.razor` wrapper for flash-free SSR. | [PageScrollbar.md](Components/PageScrollbar/PageScrollbar.md) |
| **Textbox** | CSS only | Angular-Material-style outlined text field: the label centers at rest and floats up to overlap the top border on focus/when filled (Material "notch" effect). Theme-able via CSS vars; uses OutfitFont's `--font-outfit` token when present. No `.md` doc — documented in a header comment inside `textbox.css`. | [textbox.css](Components/Textbox/textbox.css) |
| **[Tooltip](Components/Tooltip/Tooltip.md)** | CSS + JS + optional Razor | Standalone, dependency-free, accessible tooltip driven by a `data-tooltip` attribute; one reused floating node; namespaced `.ma-tooltip*`; optional Blazor wrapper. | [Tooltip.md](Components/Tooltip/Tooltip.md) |
| **[UserLogin](Components/UserLogin/UserLogin.md)** | CSS + JS + Razor | Styling wrapper around the `MindAttic.Authentication` `MaLogin` static-SSR login form; scoped CSS under `.ul-card`; Blazor Razor wrapper. Does **not** implement authentication itself. | [UserLogin.md](Components/UserLogin/UserLogin.md) |
| **[UserCircle](Components/UserCircle/UserCircle.md)** | CSS + JS + Razor | Authenticated-only avatar/initials circle, upper-right; click opens a menu or signs out; reads `ClaimsPrincipal` via `AuthorizeView`; logout via native form + antiforgery token. | [UserCircle.md](Components/UserCircle/UserCircle.md) |
| **[UserTimeout](Components/UserTimeout/UserTimeout.md)** | CSS + JS + Razor | 30-minute idle-timeout warning with countdown modal + auto-logout; renders and arms only when authenticated; logout via native form + antiforgery token; static-SSR safe. | [UserTimeout.md](Components/UserTimeout/UserTimeout.md) |

UserLogin, UserCircle, and UserTimeout are the "auth-visual trio" — landed together and wired into
`subscribers.json` for the Blazor subscribers (Prose.Writer, Prose.Codex, Ideas, Tutor).

### Themes

`Themes/` composes components into a ready-to-use bundle rather than shipping a raw effect or
widget. Currently one theme:

| Theme | Composes | Consumed by |
|---|---|---|
| **[Cyberspace](Themes/Cyberspace/Cyberspace.md)** | `theme.css` (page chrome: `.hero`, `.readme`, `.btn`, layout) + `body-prelude.html` (the three Cyberspace fixed-position effect divs) + the Cyberspace, OutfitFont, AtticFont, and BackHomeM **components** (declared in `deps.json`) | `MindAttic.Deploy` catalog landing pages that declare `theme: "Cyberspace"` in `projects.json` — no splice markers, no per-project CSS overrides. Prose consumes the Cyberspace **component** directly from its own `wwwroot` instead of this theme (it wants the effects engine, not the page chrome). |

The former sister theme `Themes/Hardware/` (light/dark documentation aesthetic) was retired
2026-05-29; ChiMesh and Claudia now render on Cyberspace with `MindAttic.Deploy`'s parts-picker
augmentation.

---

## Layout

```
MindAttic.UiUx/
│
├── Components/                  # 13 self-contained components (catalog above)
│   ├── Cyberspace/               #   frontpage.{html,css}, console-bg.js, home-bg.js, tv-static.js,
│   │                             #   loader.js, index.htm (test harness), assets/ (parallax PNGs), Cyberspace.md
│   ├── SacredGeometry/           #   sacred-geometry.js (UMD), build-previews.mjs, package.json,
│   │                             #   previews/ (shape-0000..1023.svg), index.htm (QA grid), SacredGeometry.md
│   ├── OutfitFont/               #   outfit-font.{html,css,json}, OutfitFont.md
│   ├── AtticFont/                #   attic-font.{html,css,json}, AtticFont.md
│   ├── PinFooter/                #   pin-footer.{html,css,js}, PinFooter.md
│   ├── BackHomeM/                #   back-home-m.{html,css}, BackHomeM.md
│   ├── WebSnapshot/               #   web-snapshot.{css,html,js}, snapshot.js (CLI), snapshots.config.js,
│   │                             #   web-snapshot-viewer.js, package.json, previews/, WebSnapshot.md
│   ├── PageScrollbar/            #   page-scrollbar.{css,js}, PageScrollbar.razor, index.htm, PageScrollbar.md
│   ├── Textbox/                  #   textbox.css only (no .md — doc header lives in the CSS file)
│   ├── Tooltip/                  #   tooltip.{css,js}, Tooltip.razor, index.htm, Tooltip.md
│   ├── UserLogin/                #   user-login.{css,js}, UserLogin.razor, index.htm, UserLogin.md
│   ├── UserCircle/                #   user-circle.{css,js}, UserCircle.razor, index.htm, UserCircle.md
│   └── UserTimeout/               #   user-timeout.{css,js}, UserTimeout.razor, index.htm, UserTimeout.md
│
├── Themes/
│   └── Cyberspace/                # theme.css, body-prelude.html, deps.json, Cyberspace.md
│
├── sync/                         # PowerShell splice-in-place scripts (see below)
│   ├── _subscribers.ps1          #   shared helper: reads subscribers.json, marker-splice + EOL utilities
│   ├── sync-all.ps1              #   umbrella: glob-discovers and runs every sync-*.ps1
│   ├── sync-mindattic-com.ps1    #   inlines bundles into mindattic.com/index.htm
│   ├── sync-prose.ps1            #   splices into BOTH Prose.Writer and Prose.Codex wwwroot
│   ├── sync-mindattic-psst.ps1   #   splices terms.htm + privacy.htm in MindAttic.Psst
│   ├── sync-ideas.ps1            #   splices into MindAttic.Ideas.Web wwwroot (no-op: 0 subscriptions)
│   ├── sync-tutor.ps1            #   splices into Tutor.Blazor wwwroot (no-op: 0 subscriptions)
│   ├── bootstrap-textures.ps1    #   one-shot: pull circuitboard PNGs from Prose's media folder
│   ├── bootstrap-streetsamurai-appcss.ps1  # one-shot: insert marker pair into StreetSamurai.Blazor/wwwroot/app.css (see note below)
│   └── sync.md                   #   sync/ folder's own detailed reference doc
│
├── docs/                          # Codex canon: BIBLE.md, AMENDMENTS.md, USER_STORIES.md, rfc/, data/
├── tools/
│   ├── codex.ps1                 # Codex doctor/digest tool (docs canon validation)
│   └── build-readme.ps1          # thin wrapper -> shared engine at ../codex-standard/build-readme.ps1
├── subscribers.json               # canonical map: components registry + subscriber map + per-subscriber config
├── build.ps1                      # standalone-copy build CLI (idea/blazor outputs are stubs — see below)
├── README.md                      # (this file)
├── CLAUDE.md                       # working-directory rules for the AI agent
└── .github/                       # PIPELINES.md + workflows/sync-subscribers.yml
```

> **Naming note (verified, not fixed here):** `sync/bootstrap-streetsamurai-appcss.ps1` still targets
> `D:/Projects/MindAttic/StreetSamurai/v3/StreetSamurai.Blazor/wwwroot/app.css` — a leftover from
> before that project was renamed to `Prose`. `README.md`/`CLAUDE.md` prose elsewhere calls the
> equivalent one-shot script `bootstrap-prose-appcss.ps1`, but no file with that name exists on disk;
> the actual file is the `streetsamurai`-named one above. Left as-is per this task's scope (no source
> files touched).

---

## Subscribers & sync mechanism

**Canonical source of truth: [`subscribers.json`](subscribers.json)**. It has two sections:

- **`components`** — every shippable component: its `type`, marker name, and source-file paths
  (`cssFile`, `jsonFile`, `htmlFile`, `jsFiles[]`, `assetsDir`).
- **`subscribers`** — one entry per consuming property, each declaring `kind`, `target` (absolute
  local path), `syncScript`, and a `subscriptions` array of `{ component, ...overrides }`.

As verified on disk, the current subscriber map is:

| Subscriber | `kind` | Target | Sync script | Subscriptions |
|---|---|---|---|---|
| `mindattic.com` | `html-inline` | `mindattic.com/index.htm` | `sync-mindattic-com.ps1` | OutfitFont, AtticFont (`.site-name`), Cyberspace, PinFooter, WebSnapshot |
| `Prose.Writer` | `blazor-wwwroot` | `Prose/v3/Prose.Writer` | `sync-prose.ps1` | OutfitFont, AtticFont (no auto-apply), Cyberspace, PinFooter (`jsOnly`), UserLogin, UserCircle, UserTimeout |
| `Prose.Codex` | `blazor-wwwroot` | `Prose/v3/Prose.Codex` | `sync-prose.ps1` | same set as Prose.Writer |
| `MindAttic.Psst.Legal` | `html-inline-multi` | `MindAttic.Psst/{terms.htm, privacy.htm}` | `sync-mindattic-psst.ps1` | OutfitFont |
| `Ideas` (MindAttic.Ideas.Web) | `blazor-wwwroot` | `MindAttic.Ideas/src/MindAttic.Ideas.Web` | `sync-ideas.ps1` | UserLogin, UserCircle, UserTimeout |
| `Tutor` (Tutor.Blazor) | `blazor-wwwroot` | `Tutor/Tutor.Blazor` | `sync-tutor.ps1` | UserLogin, UserCircle, UserTimeout |

Everyone else in the MindAttic fleet — the `MindAttic.Deploy`-rendered catalog landing pages and the
Claudia/ChiMesh long-form builds — pulls components from the jsDelivr CDN at runtime instead, pinned
via `MindAttic.Deploy/projects.json:componentsVersion`; they are intentionally absent from
`subscribers.json` (`subscribers.json`'s own `$comment` field states this explicitly).

### How a sync script works

Every `sync-*.ps1` dot-sources the shared helper `sync/_subscribers.ps1`, which supplies:

- `Get-Subscriber` / `Get-ComponentDescriptor` — read the two sections of `subscribers.json`.
- `Build-FontCssBody` — assembles a `font-css` component's CSS plus its `applyToSelector` rule, with
  precedence **subscription override > component JSON default > no rule**.
- `Get-DominantEol` / `ConvertTo-Eol` — detect a host file's CRLF/LF convention before writing, so a
  splice never introduces a mixed-EOL diff (component sources are LF; most subscriber files are CRLF).

Each script then does the standard idempotent splice:

1. Read the subscriber's target file(s).
2. For each entry in that subscriber's `subscriptions` array, dispatch on the component name to a
   per-type builder (a `switch` inside the sync script — new component *types* need a new case).
3. Replace everything between that component's `<!-- BEGIN/END MINDATTIC.UIUX:<MARKER> -->` (HTML) or
   `/* == BEGIN/END MINDATTIC.UIUX:<MARKER>.CSS == */` (CSS) comment pair with the freshly-built block.
   Anything outside the markers is left untouched — subscribers hand-author the rest of the file.
4. Write the file back, normalized to its original line ending.

Running a script twice with no source change produces a byte-identical file — this is the
idempotency contract every `sync-*.ps1` must satisfy.

**Verified against current `subscribers.json`:** both `Ideas` and `Tutor` already list UserLogin,
UserCircle, and UserTimeout subscriptions, so `sync-ideas.ps1` and `sync-tutor.ps1` are *not* no-ops
as of this writing — each splices those three components into its target's `wwwroot`. The header
comments inside both scripts still say "no subscriptions yet -- nothing to sync" / "no-op until
subscribed," which predates the auth-visual trio landing (`docs/AMENDMENTS.md` `MAU-A3`). Trust
`subscribers.json` itself over those stale script comments.

### Enrolling / unenrolling a subscriber in a component

Add or remove one line in that subscriber's `subscriptions` array in `subscribers.json`:

```jsonc
"Prose.Writer": {
  "kind":       "blazor-wwwroot",
  "target":     "D:/Projects/MindAttic/Prose/v3/Prose.Writer",
  "syncScript": "sync-prose.ps1",
  "subscriptions": [
    { "component": "OutfitFont" },
    { "component": "AtticFont",  "applyToSelector": null },
    { "component": "Cyberspace" },
    { "component": "PinFooter",  "jsOnly": true },
    { "component": "UserLogin" },
    { "component": "UserCircle" },
    { "component": "UserTimeout" }
  ]
}
```

The next sync run enrolls/unenrolls automatically — no code change needed **unless** the component's
`type` doesn't already have a dispatch case in that subscriber's sync script, in which case add a
builder function + `switch` case first.

| Subscriber kind | What "add a subscription" means |
|---|---|
| `html-inline` (mindattic.com) | Edit `subscribers.json` only **if** the component's type already has a `switch` case in `sync-mindattic-com.ps1`. New types need a builder + dispatch case. The HTML marker pair must already exist once in `index.htm`. |
| `blazor-wwwroot` (Prose.Writer, Prose.Codex, Ideas, Tutor) | Edit `subscribers.json` only **if** the component's type already has a `switch` case in the matching sync script. CSS marker pairs in `app.css` are one-time hand-inserts. |
| `html-inline-multi` (MindAttic.Psst legal) | Same contract as `html-inline`, but `target` is a folder and `targets[]` lists the files (`terms.htm` + `privacy.htm`). |

---

## Delivery pipelines

Full walkthrough (including the one-time PAT setup) in
[`.github/PIPELINES.md`](.github/PIPELINES.md).

| Pipeline | What it does | When it runs |
|---|---|---|
| **jsDelivr CDN** | Serves any file at `https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@<ref>/<path>` — versioned, edge-cached, no infra to run. `<ref>` can be a whole-number tag (`@V5`, immutable), `@main` (tracks tip-of-tree, ~7-day cache), or a commit SHA (immutable). | Continuously. Consumed by `MindAttic.Deploy` for every catalog landing page and the Claudia/ChiMesh long-form builds. |
| **GitHub Actions cross-repo sync** | `.github/workflows/sync-subscribers.yml` opens PRs against `mindattic/mindattic.com`, `mindattic/Prose`, and `mindattic/MindAttic.Psst` with refreshed marker blocks / wwwroot copies, using the `SUBSCRIBER_REPO_TOKEN` PAT. | Every push to `main` that touches `Components/{AtticFont,Cyberspace,OutfitFont,PinFooter,WebSnapshot}/**`, `subscribers.json`, `sync/**`, or the workflow file itself; also `workflow_dispatch`. |
| **PowerShell `sync/*.ps1`** | Local dev fallback — same logic as the Action, runs against your working copies. Also invoked by `MindAttic.Deploy` as a `preDeploy` hook for `mindattic.com` and `Prose` so the bundle is fresh before FTPS upload. | Manual (`powershell -File sync/sync-all.ps1`). |

> **Verified drift, not fixed here:** the GitHub Action workflow (`sync-subscribers.yml`) still has a
> single `sync-prose` job that checks out `mindattic/Prose` and runs
> `sync-prose.ps1 -BlazorRoot "$PWD/prose/v3/Prose.Blazor"` — but `sync-prose.ps1` no longer declares a
> `-BlazorRoot` parameter (it now hardcodes both `Prose.Writer` and `Prose.Codex` by reading
> `subscribers.json`), and `subscribers.json` no longer has a `Prose` subscriber entry (it was split
> into `Prose.Writer` / `Prose.Codex`). The workflow also has no jobs at all for `Ideas` or `Tutor`.
> Local `sync-all.ps1` picks up all five scripts correctly; the GitHub Action is the piece that has not
> been updated for the Prose split or the two newer Blazor subscribers. Fixing the workflow is out of
> scope for this documentation pass.

### Tagging a release

```bash
git tag V6            # whole numbers only — never SemVer (V1..V5 exist today)
git push --tags
# jsDelivr serves the new tag immediately; purge a branch ref if needed:
# GET https://purge.jsdelivr.net/gh/mindattic/MindAttic.UiUx@main/Components/Cyberspace/console-bg.js
```

To propagate a release to every `MindAttic.Deploy`-rendered subscriber, bump `componentsVersion` in
`MindAttic.Deploy/projects.json` and run that repo's deploy. `sync-mindattic-com.ps1` separately pins
its own CDN tag for two externalized Cyberspace files (see below) via its `-CyberspaceCdnTag`
parameter (default `V4` as committed today) — bump that independently when `console-bg.js` or
`sacred-geometry.js` changes.

### Why Cyberspace's two biggest JS files are CDN-loaded, not inlined, for mindattic.com

`console-bg.js` is ~580 KB and `sacred-geometry.js` (the shape catalog it draws from) is ~60 KB.
`sync-mindattic-com.ps1` keeps the small Cyberspace scripts (`loader.js`, `tv-static.js`,
`home-bg.js`) and a circuit-board-texture override inline, but emits `sacred-geometry.js` and
`console-bg.js` as external `<script src="https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@<tag>/…">`
tags instead — so the browser can cache them separately across page loads. Script order is preserved
because non-async `<script>` tags execute in document order: the inline block (defines
`window.__cyberspaceCircuitboardSrcs`) runs first, then `sacred-geometry.js` (defines
`window.SacredGeometry`), then `console-bg.js` (reads both globals). Only `Prose` still copies all
Cyberspace + SacredGeometry JS into its own `wwwroot/js` byte-for-byte — `mindattic.com` is the only
subscriber that uses this CDN split.

### GitHub Action PAT — `SUBSCRIBER_REPO_TOKEN`

The cross-repo sync workflow needs a fine-grained personal access token so it can open PRs against
subscriber repos. Stored as the repository secret **`SUBSCRIBER_REPO_TOKEN`** at
[`Settings → Secrets and variables → Actions`](https://github.com/mindattic/MindAttic.UiUx/settings/secrets/actions).

Generate at [github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new) with:

| Field | Value |
|---|---|
| Resource owner | `mindattic` |
| Repository access | *All repositories owned by `mindattic`* — covers every current and future subscriber automatically |
| Expiration | ~1 year (rotate on calendar) |
| Permission: **Metadata** | Read-only *(auto-included on every fine-grained PAT)* |
| Permission: **Contents** | **Read and write** *(push the `auto/sync-components` branch)* |
| Permission: **Pull requests** | **Read and write** *(open/update the cross-repo PR)* |

Any other permission is unnecessary — leave Pages, Secrets, security advisories, etc. unchecked.

> **Never paste the PAT value into the repo, into chat, or into a commit message.** If you do, treat
> it as compromised — revoke it immediately on the PAT settings page and generate a fresh one before
> saving the new value into the GitHub secret.

**Local retrieval via [`MindAttic.Vault`](../MindAttic.Vault/README.md).** The same PAT is mirrored
into the family-wide token store at `%APPDATA%\MindAttic\GitHub\tokens.json` under the key
`mindattic-uiux-pat`:

```csharp
using MindAttic.Vault.Credentials;

var pat = TokenStore.ForBucket("GitHub").Get("mindattic-uiux-pat");
```

The two stores (GitHub repo secret and Vault `tokens.json`) are *independent* copies — rotating the
PAT means updating both, or picking one (the GitHub secret) as authoritative and rewriting the Vault
entry from it whenever the PAT changes.

---

## Marker contract

Every sync edit is bounded by a comment pair. HTML subscribers use
`<!-- BEGIN MINDATTIC.UIUX:<MARKER> --> … <!-- END … -->`; CSS subscribers use
`/* == BEGIN MINDATTIC.UIUX:<MARKER>.CSS == */ … /* == END … == */`. Anything outside the markers is
left untouched, so subscriber projects can hand-author the rest of the file without conflict.

The script-generated body always opens with a `Generated by …` comment warning subscribers not to
hand-edit, because the next sync will overwrite it.

---

## Build & run

There is **no automated test project** in this repo (per `docs/BIBLE.md` §6 — the nearest thing to a
smoke test is SacredGeometry's `build-previews.mjs`, which regenerates its 1024 shape posters).

### `build.ps1` — standalone / idea / blazor build CLI

```powershell
# Copy a component's raw canonical assets verbatim to dist/standalone
.\build.ps1 -Build OutfitFont -Output standalone

# .idea packaging (requires a sibling MindAttic.Ideas repo with the Abstractions SDK + ma-idea packer)
.\build.ps1 -Build Cyberspace -Output idea
```

`-Output idea` and `-Output blazor` are currently **stubs**: the `Ideas/` RCL packaging subtree
(`Ideas/MindAttic.Ideas.{Plugin|Theme|Control}.<Build>/`) that `-Output idea` depends on was removed
from this repo 2026-06-07 (`docs/AMENDMENTS.md` `MAU-A3`); `-Output blazor` was never implemented.
Only `-Output standalone` currently does real work.

### `sync/sync-all.ps1` — run every splice locally

```powershell
powershell -File sync/sync-all.ps1
```

Glob-discovers every `sync-*.ps1` in `sync/` (except itself), runs each in turn, and aggregates
failures. Or invoke one target directly:

```powershell
powershell -File sync/sync-mindattic-com.ps1
powershell -File sync/sync-prose.ps1
powershell -File sync/sync-mindattic-psst.ps1
powershell -File sync/sync-ideas.ps1
powershell -File sync/sync-tutor.ps1
```

Downstream copies are derived artifacts — never edit them directly; the next sync overwrites
whatever's between the marker pairs.

### `tools/codex.ps1` — documentation canon validator

```powershell
powershell -File tools/codex.ps1 digest   # regenerate docs/BIBLE.digest.md
powershell -File tools/codex.ps1 doctor   # validate IDs, links, front-matter, cited tests/paths
```

Run `doctor` after editing any file under `docs/`; it must exit 0.

### `tools/build-readme.ps1` — regenerate README.htm

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\build-readme.ps1
```

Thin wrapper around the shared engine at `../codex-standard/build-readme.ps1` (one engine, shared by
every MindAttic repo, so every `README.htm` looks and behaves identically). Do not duplicate that
logic here.

---

## Editing a component

Edit files in the component's folder (e.g. `Components/Cyberspace/console-bg.js`). Push to `main` and
the GitHub Action delivers to its (currently stale — see [Delivery pipelines](#delivery-pipelines))
subscriber jobs, or run `sync/sync-all.ps1` locally for fast, correct iteration across all five
scripts without round-tripping through GitHub.

To ship a component change to the CDN-loaded subscribers managed by
[`MindAttic.Deploy`](../MindAttic.Deploy/README.md), tag a new version of this repo (`git tag Vn &&
git push --tags`) and bump `componentsVersion` in `MindAttic.Deploy/projects.json`, then run that
repo's deploy.

## Adding a new component

1. Create a folder under `Components/` with the source files (`<name>.html`, `<name>.css`, optional
   `<name>.js`, optional `<name>.json` config, and a `<FolderName>.md` doc).
2. Register it in `subscribers.json` under `components` with its `type`, source-file paths, and a
   base marker name (without `.CSS`/`.HTML` suffix).
3. Add `{ "component": "<Name>" }` to each subscriber's `subscriptions` array that should receive it.
4. For each subscribed project: insert the marker pair into the target file once (hand-edit), and add
   a builder function + `switch` case to the relevant sync script if that component's type doesn't
   already have one.
5. Run `sync/sync-all.ps1` and confirm a clean splice.
6. Add the component to `docs/data/components.json` (schema at `docs/data/_schema/component.schema.json`)
   so it is tracked in the L5 canon.

## Adding a new subscriber

Before adding one here, make sure it doesn't belong in `MindAttic.Deploy` instead — a catalog landing
page or long-form HTML build that just pulls from CDN belongs in `MindAttic.Deploy/projects.json`,
not here. Only add a splice-in-place subscriber if it genuinely has hand-authored content
interleaved with the components (like `mindattic.com/index.htm` or the `MindAttic.Psst` legal pages).

1. Add an entry to `subscribers.json` under `subscribers` with `kind`, `target`, `syncScript`, and
   `subscriptions`.
2. Create `sync/sync-<subscriber>.ps1` that dot-sources `_subscribers.ps1`, reads its subscriber via
   `Get-Subscriber`, and iterates `$sub.subscriptions`.
3. Make it idempotent — running twice with no source changes produces no diff.
4. `sync-all.ps1` picks it up automatically (it discovers `sync-*.ps1` by glob).
5. If the subscriber also needs GitHub Action delivery, add a job mirroring the pattern in
   `.github/workflows/sync-subscribers.yml`.

---

## Keepout zones (Cyberspace)

`console-bg.js` ships a keepout system that prevents effects from spawning behind page content. The
placer (`bestPos` / `safePos`) weights overlap with these rects 4× a normal window overlap, so it
strongly prefers spawning in the margins.

Baked-in selectors — any host gets these for free:
- `.cyberspace-keepout` — opt-in marker; add to any container you want protected.
- `main` — both subscribers use `<main>` for their content area.
- `.home-content` — Prose's Home wrapper.
- `.board-grid` — any tab/tile board.

Hosts can extend at runtime:

```js
window.__cyberspaceKeepoutSelectors = '.foo, .bar';
```

---

## Cyberspace effect catalog

Canonical names + definitions live in the registry header of `console-bg.js`. Toggles (`FX_*`) and
spawn rates (`RATE_*`) are clustered near the top of the file — flip any `FX_*` to `false` to kill
that effect.

### Top-level effects (tick-loop dispatch)

| Name        | Spawn fn                  | Toggle / Rate              | What it does |
|-------------|---------------------------|----------------------------|--------------|
| **TERMINAL**| `spawnWindow`             | `FX_WIN` / remainder       | Generic console window (the workhorse) |
| **CRASH**   | `spawnError`              | `FX_ERROR` / 1%            | Fatal-error popup |
| **TREMOR**  | `spawnWarning`            | `FX_WARN` / 1%             | Warning popup |
| **LEAK**    | `spawnMemo`               | `FX_MEMO` / 4%             | Leaked corporate memo, character-by-character erase |
| **SCHEMATIC**| `spawnGeoWindow`         | `FX_GEO` / 10%             | Geometric schematic window (shape drawn from [SacredGeometry](Components/SacredGeometry/SacredGeometry.md)) |
| **CASCADE** | `spawnCascade`            | `FX_CASCADE` / 3%          | Burst of 3–6 cascaded console windows |
| **ARTIFACT**| `spawnArtifact`           | `FX_ARTIFACT` / 12%        | Floating glyph cluster — 7 variants below |
| **FRAGMENT**| `spawnFrag`               | `FX_FRAG` / 40%            | Floating code fragments (most frequent effect) |
| **TRACE**   | `spawnNetConnect`         | `FX_NET` / 8%              | Tron-cycle network wire route |
| **PULSAR**  | `spawnMorseDot`           | `FX_MORSE` / 5%            | Morse-code glowing dot |
| **HEIST**   | `spawnFolderRip`          | `FX_FOLDER` / 4%           | Folder-rip file-extraction sequence |
| **PREDATOR**| `spawnArtifactPredator`   | `FX_PREDATOR` / 1.2%       | Rare artifact-hunting swarm |

### ARTIFACT — 7 behavior variants

| Variant       | Behavior |
|---------------|----------|
| **SCATTER**   | Random blob; all glyphs drift one direction |
| **LATTICE**   | Fibonacci grid; whole lattice drifts with corner-wave delay |
| **ANCHOR**    | Stationary grid; glitches in place; emits feelers |
| **SLUG**      | Single grid crawls + per-cell undulation |
| **CENTIPEDE** | Multi-segment chain; peristaltic wave + leader feelers |
| **PULSE**     | Concentric Fibonacci rings; lub-dub heartbeat radiating outward |
| **WANDERER**  | Small grid walks the screen, pauses to "look around" |

### PULSAR — 2 modes

| Mode      | Share | Behavior |
|-----------|-------|----------|
| **BLINK** | ~90%  | Classic on/off pulse |
| **SHIFT** | ~10%  | Slides cardinal directions, color-swaps each symbol |

### TRACE — 3 sub-behaviors

| Sub       | Behavior |
|-----------|----------|
| **ARC**   | Sharp-turn spark burst at ~30% of corners |
| **ACK**   | Three-blink success signal then synced fade-out |
| **SEVER** | Direction-aligned CONNECTION-LOST message on failure |

### HEIST — 3 sequential phases

| Phase         | Behavior |
|---------------|----------|
| **HIGHLIGHT** | Cyan selection glow on adjacent run of files |
| **EXTRACT**   | Slide-right exit with shimmer + per-file stagger |
| **DISSOLVE**  | Window fade-out tied to extract completion |

### PREDATOR — 5 sequential sub-behaviors

| Sub          | Behavior |
|--------------|----------|
| **STALK**    | Off-screen swarm origin, homes on prey |
| **SCAN**     | Prey detection cone (max forward, min behind) |
| **FLEE**     | Prey panic-redirect of crawl vector away from swarm |
| **DEVOUR**   | Cell consume-and-convert (cell adopts wasp glyph then dissolves) |
| **DISPERSE** | Wasps scatter and fade after kill |
