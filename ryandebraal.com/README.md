# ryandebraal.com

**A resume site as an engineering statement.** One file. No build step. No framework. No npm install. No CDN. No tracking. Just a developer who prefers working close to the platform.

[ryandebraal.com](https://ryandebraal.com)

---

## What it is

A single, hand-authored `index.htm` — pure HTML, CSS, and JavaScript — that renders a fully interactive, themeable, animated resume in any modern browser. Open the Network tab and filter by anything: you will see one request.

That's the whole product.

## Why it exists

Modern web stacks make it easy to ship 30 MB of bundled JavaScript to render a paragraph of text. This project is the deliberate opposite — a demonstration that a polished, production-quality experience can be built without inheriting any of that complexity. Every line of logic, every animation frame, every export pipeline lives in the same file you can read end-to-end in an afternoon.

It's a resume that **is** the work sample.

## Features

- **15 themes** — Light, Spring, Summer, Autumn, Winter, Matrix, Neko, Ocean, Sunset, Forest, Cyberpunk, Noir, Sakura, Sand, Synthwave. Theme switching is CSS variables only; no JavaScript style mutations.
- **3 rendering profiles** — Classic, Pitch, and Complete views of the same underlying resume data, swapped with one click.
- **Custom canvas animations per theme** — Bees with a flower-claiming state machine, snow that accumulates into SVG drifts, ten roaming Neko cats with the full 1998 sprite state machine (all 32 frames embedded as base64), sandstorm physics, parallax forest silhouettes, perspective synthwave grids, neon-acid-rain cyberpunk skylines, and more. Written from scratch — no animation libraries.
- **~200 tech tooltips** — Hover any technology in the skills or experience sections for context.
- **Markdown and HTML export** — Download the resume in either format from the toolbar.
- **The Outfit typeface, embedded** — Weights 100–900, inlined as base64 woff2. No font CDN request is ever made.
- **Preferences persist** — Theme, profile, and font choice survive page reloads via localStorage.
- **Mobile-first toolbar** — Adapts cleanly between desktop and portrait orientations.

## What's *not* in this repo

No `node_modules`. No `package.json`. No `webpack.config.js`. No `tsconfig.json`. No `.eslintrc`. No CI matrix. No Tailwind. No React. No Vite. No analytics SDK. No tracking pixels. No service worker. No polyfills. No minifier. No transpiler. No CDN links.

The deploy script is a PowerShell file that uploads the HTML via FTPS.

## Stack

`HTML5` · `CSS3` (custom properties, `color-mix`, `@media (orientation)`) · `Vanilla JavaScript` (ES2020+, IIFE-scoped, no modules) · `Canvas 2D` · `SVG`

## Local development

```
# Open it.
start index.htm
```

That's it. There is no dev server, because there is nothing to compile.

## Deploy

Deploy via the `/deploy` skill (MindAttic.Deploy, sibling repo). The per-project `deploy.ps1`
and `settings.json` are retired; credentials and upload logic live in MindAttic.Deploy.

---

Built and maintained by [Ryan DeBraal](https://ryandebraal.com).
