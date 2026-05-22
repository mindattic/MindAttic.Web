# AtticFont

The **Attic** display face, inlined as a base64 woff2. Single `@font-face`,
weight normal, style normal, `font-display: swap`. No network request — the
font ships with the document, so first paint is one HTTP request.

Used for headings and the wordmark across MindAttic web properties.

---

## Layout

```
AtticFont/
├── attic-font.html   # marker comment + usage note
└── attic-font.css    # the @font-face declaration (base64 woff2 inline)
```

---

## Usage

```html
<link rel="stylesheet" href="attic-font.css">

<style>
  /* Two equivalent ways to activate Attic on an element: */
  h1, .title { font-family: 'Attic', serif; }      /* explicit stack */
  h1, .title { font-family: var(--font-attic); }   /* same thing, via the CSS variable the file exposes */
</style>
```

**Gotcha** — bare `font-family: Attic;` (no quotes, no fallback) fails
silently in some browsers / CSS contexts. Always use the quoted form with a
generic fallback (`'Attic', serif`) or the `var(--font-attic)` shorthand
the CSS file exposes.

**Per-subscriber apply rule** — most subscribers want Attic on a specific
element (e.g. `.site-name`, `#claudia`, `#chimesh`). That mapping lives in
`subscribers.json` as the `applyToSelector` field on each subscription, so
the sync pipeline emits the right rule automatically. The component's
`attic-font.json` deliberately has no default `applyToSelector` — each
subscriber declares its own.

Or via jsDelivr:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/mindattic/MindAttic.Components@v1.0.0/AtticFont/attic-font.css">
```

---

## Sync delivery

Two subscribers receive Attic via the sync pipelines:

- `mindattic.com/index.htm` — inlined between
  `<!-- BEGIN MINDATTIC.COMPONENTS:ATTICFONT --> … <!-- END … -->` markers by
  `sync/sync-mindattic-com.ps1`.
- `StreetSamurai/wwwroot/app.css` — rewritten between
  `/* == BEGIN MINDATTIC.COMPONENTS:ATTICFONT.CSS == */` markers by
  `sync/sync-streetsamurai.ps1`.
- `ChiMesh` and `Claudia` — `sync-chimesh.ps1` / `sync-claudia.ps1` splice
  the `@font-face` block into each project's `scripts/cli/build-html.js`
  template literal.

Edit here only. Downstream copies are derived artifacts.
