---
codex: 1
project: ryandebraal.com
code: RDC
layer: amendments
status: living
updated: 2026-10-02
---

# ryandebraal.com — Amendments (append-only; amendment wins over the bible)

> Append only. Never rewrite an amendment — supersede it with a new one. Beyond ~25, fold into
> [BIBLE.md](BIBLE.md) and start a new epoch (note the git tag); history stays in git.

## RDC-A1 — Adopt the Codex documentation standard (supersedes —)

**What changed:** Installed the MindAttic Codex canonical-documentation layout for this repo:
`docs/BIBLE.md` (L0), `docs/AMENDMENTS.md` (L1), `docs/USER_STORIES.md` (L2), `docs/rfc/` (design
notes), `tools/codex.ps1` (doctor + digest), and a `SessionStart` hook injecting
`docs/BIBLE.digest.md`.

**Why:** Give the single-file site a real source of truth and the same documentation discipline as
the rest of MindAttic, without touching `index.htm` or any shipped content.

**Migration:** None — the repo had no prior canon docs (`docs/`, `ARCHITECTURE.md`, etc.). The
existing `README.md` (build/run) and project `CLAUDE.md` (work rules) are unchanged; `CLAUDE.md`
gains a Codex pointer section. The org-wide
[MindAttic.HouseRules.md](../../MindAttic.HouseRules.md) is inherited by reference, not copied.

**Domain decision:** Classed as `website`; per Codex Phase 2 no L5 `docs/data/*.json` was created —
the only structured content (the `D` resume object and `tooltips` map) lives in `index.htm`, and
extracting it would duplicate source and violate [RDC-LAW-1](BIBLE.md#RDC-LAW-1)/
[RDC-LAW-5](BIBLE.md#RDC-LAW-5).

## RDC-A2 — Codex full-sync: dark theme, export expansion, deploy drift (supersedes RDC-A1 §4 details)

**What changed (2026-06-07 inspection of `index.htm`):**

1. **Theme count: 15 → 16.** A `dark` theme (`[data-theme="dark"]`) was added to the toolbar and
   CSS since the initial Codex install. All docs now read "16 themes"; theme list updated to include
   `dark`. `startDark` FX function does not exist — the dark theme has no bespoke canvas animation
   (static CSS-only, like `light` and `noir`).

2. **Export function inventory expanded.** `index.htm` now exposes `exportHTML()` (self-contained
   HTML download) and four named `runPdfExport` wrappers (`exportPDF`, `exportPrintPage`,
   `exportPrintDocument`, `exportPrintCV`) beyond the original `exportMD`/`printResume`/
   `runPdfExport`. BIBLE §4.3 and the architecture diagram updated to reflect the full inventory.

3. **Line count: ~6.9K → ~6.5K.** The architecture diagram comment updated; `index.htm` is 6,532
   lines as of this sync.

4. **README deploy section corrected.** `README.md` cited the retired `.\deploy.ps1` +
   `settings.json` approach. Updated to reference the MindAttic.Deploy skill per
   [RDC-LAW-6](BIBLE.md#RDC-LAW-6); no new files created.

**Migration:** Docs-only. No `index.htm` or source changes.

## RDC-A3 — Static assets move to the jsDelivr CDN (supersedes RDC-LAW-1, refines RDC-LAW-2/RDC-LAW-3) {#RDC-A3}

**Decision (user, 2026-10-02):** the "one file, one request, no CDN, inline everything" philosophy is
retired. `index.htm` had grown to ~5.2 MB, ~95% of it base64 (theme background JPEGs, portrait and
moon PNGs, two woff2 fonts, the Neko sprites, and an 880 KB PDF library), which made first load slow.
Static assets are now real files served from a CDN that is always reachable.

**What changed:**

1. **[RDC-LAW-1](BIBLE.md#RDC-LAW-1) is superseded.** Assets (fonts, images, theme art, large
   libraries) are no longer inlined. They are separate files hosted in the **MindAttic.UiUx** repo and
   served by **jsDelivr** at an immutable, whole-number tag (currently `@V7`). `index.htm` stays the
   only hand-authored page; it references assets by URL. `<link rel="preconnect|preload">`,
   `loading="lazy"` and `decoding="async"` are allowed and used.
2. **Allowed external hosts (exhaustive):**
   - `https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@V7/...` — our own assets (Outfit fonts at
     `fonts/outfit/`; page art at `ryandebraal.com/`).
   - `https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.2/dist/html2pdf.bundle.min.js` — the PDF export
     library, loaded on demand the first time a PDF is exported (it was previously inlined; the CDN file
     is byte-equivalent apart from its header comment).
   Nothing else. No other host may be added without a new amendment.
3. **[RDC-LAW-2](BIBLE.md#RDC-LAW-2) refined:** still no package.json/bundler/transpiler/framework in
   the repo. Loading a pinned third-party file by URL is allowed; installing or building one is not.
4. **[RDC-LAW-3](BIBLE.md#RDC-LAW-3) refined:** the "no request other than fetching itself" clause is
   replaced by the host list above. Still forbidden: analytics, tracking pixels, telemetry, third-party
   fonts (Google Fonts etc.), and any script that phones home.
5. **Kept inline on purpose:** the 32 Neko sprite frames (~1 KB each; 32 requests would be slower than
   the ~32 KB they cost in the stylesheet) and the 864-byte link icon.
6. **Conventions** (see [BIBLE §10](BIBLE.md#RDC-§10)): tag-pinned URLs, kebab-case file names,
   `themes/<name>/<name>-NN.jpg`, whole-number UiUx tags, fonts at top-level `fonts/`.

**Why:** loading speed. The fonts, images and library are cacheable across visits and sites, the page
HTML drops from ~5.2 MB to ~0.45 MB, and only the theme background actually in use is downloaded.

**Trade-offs accepted:** the page needs the CDN to show Outfit, the portrait and theme art (system
fonts and plain backgrounds are the fallback); `exportHTML()` output now references CDN URLs instead of
being fully offline; PDF export needs a network connection the first time.

**Migration:** `index.htm` rewritten to reference CDN URLs (assets extracted byte-identically for
JPEGs/fonts, PNGs losslessly recompressed). BIBLE body text, README and USER_STORIES updated to match.
RDC-LAW-1 keeps its ID (history) and is marked superseded rather than deleted.

## RDC-A4 — Meta description, link-preview tags, 60-second theme rotation (refines RDC-A3) {#RDC-A4}
Decision (user, 2026-10-03): `<head>` gains a `meta description`, a canonical URL (`https://ryandebraal.com/`),
`theme-color`, and Open Graph (`og:type` = `profile`) / Twitter "summary" card tags; the preview image is
`ryandebraal.com/images/ryan-portrait.png` (400×400) from the MindAttic.UiUx package. The default theme
rotation (`theme_timeout`) changes from 30 to 60 seconds; a visitor who moved the "Seconds per Theme"
slider keeps their saved value, since only changed settings are stored in `resume-settings`.
