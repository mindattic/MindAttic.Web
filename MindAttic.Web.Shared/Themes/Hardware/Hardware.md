# Hardware theme

Clean light/dark documentation aesthetic for hardware / maker landing pages. Used by Claudia, ChiMesh, and any future hardware-themed landing page declaring `theme: "Hardware"` in `MindAttic.Catalog/projects.json`.

A consumer declares the theme and inherits the composition. The aesthetic mirrors what Claudia + ChiMesh have on their existing detailed `/claudia/` and `/chimesh/` pages, distilled into a reusable theme bundle.

## What this theme includes

| Layer | Source |
|---|---|
| Page chrome (hero, readme panel, buttons, light/dark tokens, code blocks, tables) | `theme.css` (this folder) |
| Body prelude (empty — no background effects) | `body-prelude.html` (this folder) |
| Outfit + Attic typography | `Components/OutfitFont/`, `Components/AtticFont/` |
| Back-to-mindattic.com glyph | `Components/BackHomeM/` |

## What this theme deliberately does NOT include

- The **Cyberspace** Component (effects engine). Hardware pages are calm; if you want the animated cyberpunk background, declare `theme: "Cyberspace"` instead.
- A theme-toggle widget. The color scheme follows `prefers-color-scheme`; Catalog-generated landing pages have no toggle UI.

## Layout the theme expects

Same as `Themes/Cyberspace/` — both themes are drop-in compatible with the `MindAttic.Catalog` template:

```html
<body>
  <a class="back-home-m" href="https://mindattic.com/"></a>
  <div class="page">
    <header class="hero">
      <h1 class="project-name" id="<slug>">Title</h1>
      <p class="tagline">One-line tagline</p>
      <div class="btn-row">
        <a class="btn btn-primary">Open</a>
        <a class="btn btn-secondary">GitHub</a>
      </div>
    </header>
    <article class="readme">
      <!-- rendered README HTML -->
    </article>
  </div>
</body>
```

A project can switch themes (`Cyberspace` <-> `Hardware`) by changing one field in `projects.json` and redeploying. No other code changes.

## Related

- Sister theme: [`Themes/Cyberspace/`](../Cyberspace/Cyberspace.md) — animated dark cyberpunk variant for software projects.
