# Runtime assets — the shared jsDelivr package

`MindAttic.UiUx` is also the **shared runtime asset package** for every MindAttic site. Fonts,
images, brand art, theme art and the Cyberspace effect textures live here once, as plain static
files, and every site loads them over jsDelivr instead of embedding them in its HTML. See
[MAU-A4](AMENDMENTS.md#MAU-A4) for the decision.

## URL pattern

```
https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@<tag>/<path>
```

`<tag>` is a whole-number release tag (`V7`, …) and **tags are immutable** ([MAU-LAW-6](BIBLE.md#MAU-LAW-6)),
so a pinned URL returns the same bytes forever and is cached by browsers and by the CDN edge
indefinitely. Never point a production page at `@main`.

## Layout

Global assets live at the repo root; a site's own assets live in a folder named for its domain.

```
MindAttic.UiUx/
├── fonts/                         global: web fonts used by more than one site
│   ├── outfit/                    outfit-latin.woff2, outfit-latin-ext.woff2, outfit.ttf
│   └── attic/                     attic.woff2, attic.ttf
├── mindattic.com/                 site-specific: one folder per domain
│   └── logos/                     m-monogram.png, m-icon-16.png, favicon.ico, wordmark PNGs
├── mindatticcares.com/
│   ├── logos/  icons/  images/
├── ryandebraal.com/
│   ├── themes/<theme>/            sunset, sakura, noir (one folder per theme)
│   └── icons/  images/
├── Components/<Name>/             component-owned runtime files (CSS/JS and what they cannot work without)
│   └── Cyberspace/assets/         circuitboard.00-02.png parallax textures
└── assets-manifest.json           generated: path, bytes, SHA-256, pixel size of every asset
```

Rule of thumb: **used by several sites → top-level folder (`fonts/`); used by one site →
`<domain>/<category>/`; a file a component cannot work without stays with the component.** Category
folders are named for what the files are (`logos`, `icons`, `images`, `themes/<name>`), not for the
page that uses them. Nothing is ever copied into two places ([MAU-LAW-5](BIBLE.md#MAU-LAW-5)).

The `.ttf` next to each web font is the original the woff2 was made from, kept so the web font can be
regenerated. Browsers never request it.

## Quality rules

- **Lossy formats keep their full resolution.** A JPEG/WebP is committed byte-for-byte as received;
  it is never downscaled or re-encoded to save space.
- **Lossless recompression is welcome, but must be verified.** A PNG may be re-encoded (for example to
  an 8-bit palette) only if the decoded pixels are identical — the Cyberspace textures went from
  6.2 MB to 1.7 MB this way, pixel-for-pixel identical.
- **Validate fonts before committing them.** Load every woff2 with `fontTools` (or in a browser) —
  a browser silently falls back to a system font when a woff2 is corrupt, which hides the bug.
- **Names:** lowercase kebab-case, descriptive, no spaces; put the variant last
  (`m-monogram-transparent.png`).

## Adding or changing an asset

1. Put the file in the right domain folder (or `fonts/`), using the naming rules above.
2. `powershell -NoProfile -ExecutionPolicy Bypass -File tools\build-asset-manifest.ps1`
3. Commit the asset(s) and `assets-manifest.json` together.
4. Tag the next whole-number release (`V8`, …) and push the tag. **Never move or reuse a tag.**
5. Bump the tag in each site that wants the change (search the site for `MindAttic.UiUx@V`).

`tools\build-asset-manifest.ps1 -Verify` fails if the manifest is stale — use it in CI.

## How a site consumes the package

```html
<!-- in <head>: open the connection early, start the fonts the first paint needs -->
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="preload" as="font" type="font/woff2" crossorigin
      href="https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@V7/fonts/outfit/outfit-latin.woff2">

<style>
@font-face { font-family: 'Outfit'; font-weight: 100 900; font-display: swap;
  src: url('https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@V7/fonts/outfit/outfit-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122; }
</style>
```

- Fonts need `crossorigin` on the `<link rel=preload>`, otherwise the browser fetches them twice.
- Use `fetchpriority="low"` on preloads of decorative images so they never compete with the first paint.
- Add `loading="lazy" decoding="async"` to below-the-fold `<img>` tags.
- Load heavy scripts with `defer` so they never block the first paint.

## Verifying a release

After pushing a tag, check that jsDelivr serves every file at its committed size, for example:

```
curl -sI https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@V7/fonts/attic/attic.woff2
```

and compare against `assets-manifest.json` (`bytes` / `sha256`). If a brand-new tag 404s for a
minute, retry; `https://purge.jsdelivr.net/gh/mindattic/MindAttic.UiUx@V7/<path>` forces a refresh.

## Testing

`tests/` holds a Playwright suite that validates this package and the three sites that consume it (see
[`tests/README.md`](../tests/README.md)): the manifest matches the tree, fonts and images decode, lossy files keep their
full resolution and bytes, size budgets hold, every UiUx URL a site references exists, and each site loads with no failed
requests, no console errors and the right layout at every viewport — in every view a visitor can reach (hash pages,
themes), with desktop-style scrollbars so overflow a Windows visitor would see is caught. The expected tag follows the
highest `V<n>` tag automatically (override with `UIUX_TAG`). `npm run test:local` (in `tests/`) runs it against the
working tree before a tag is published; `npm run test:live` / `npm run test:cdn` verify what jsDelivr actually serves.
