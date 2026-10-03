# Hyperspace

A single-page field guide to what a five-dimensional object would look like passing through our world: interactive hypercube slices and projections, then a walkable 3D gallery of 100 higher-dimensional exhibits.

![HTML](https://img.shields.io/badge/HTML-single%20file-E34F26) ![Three.js 0.160.0](https://img.shields.io/badge/Three.js-0.160.0-black) ![Status live](https://img.shields.io/badge/status-live-brightgreen)

![Hyperspace landing screen: What a 5-dimensional object looks like passing through our world, with an Enter the Gallery button](docs/images/hero.png)

Try it: [mindattic.com/hyperspace](https://mindattic.com/hyperspace/)

## Why

- Build real intuition for higher dimensions by climbing down before climbing up: a flat creature watching a sphere pass through its plane, then us watching a 4D and 5D cube pass through ours.
- See the actual cross-section, computed rather than faked: a rotated hypercube is intersected with 3D space and the exact solid is drawn.
- Watch a penteract's 32 vertices and 80 edges crowd into our space, and toggle its ten independent planes of rotation.
- Walk through 100 higher-dimensional objects in a 3D gallery, each with a plaque to read.
- Open one file in any browser: no build, no install, no account.

## Features

- Hero animation and a "ladder" that steps from 2D to 5D.
- Slice explorer: choose a tesseract (4D) or penteract (5D), turn rotation on or off, sweep the cube through our space, and drag sliders for the offset along the 4th and 5th axes. A readout shows the vertex and face count of the current cross-section and whether the object is present at all.
- Projection explorer: cube, tesseract or penteract wireframes cast into 3D, with chips for each plane of rotation.
- What you would actually witness: six short accounts (it blinks in from nowhere, morphs two ways at once, passes through itself, knots fall open, there is no inside, it never settles).
- The Hyperspace Gallery: a 10 x 10 hall of 100 exhibits, from the 5-cell, tesseract, 24-cell, 120-cell and 600-cell to prisms, duoprisms, curved manifolds, aperiodic order and 24-dimensional sphere packing. Each exhibit has a plaque with notes and references.
- Desktop controls with pointer lock, touch controls with two virtual sticks, a pause menu, and a boot progress bar while the gallery loads.

![The slice explorer: Tesseract 4D and Penteract 5D toggles, Rotation On and Sweep Through buttons above a purple cross-section solid](docs/images/hypercube-slice.png)

![Inside the Hyperspace Gallery: rows of glass display cases holding coloured wireframe polytopes, with the hint Click a plaque to read, Esc for menu and controls](docs/images/hyperspace-gallery.png)

## Quick start

Open the live page, or run it locally from a clone. Any static server works; this one uses Python:

```bash
git clone https://github.com/mindattic/Hyperspace.git
cd Hyperspace
python -m http.server 8000
```

Then open `http://localhost:8000/index.htm`. You should see the landing screen above; scroll down for the explorers, or click Enter the Gallery.

Gallery controls:

| Input | Action |
| --- | --- |
| W, A, S, D | Move |
| Shift | Sprint |
| Mouse | Look |
| Click | Read a plaque |
| Esc | Menu |
| Touch | Left stick moves, right stick looks |

## How it works

```text
index.htm  (the only artifact: HTML, CSS and JavaScript in one file)
  |-- Field guide: hero canvas, slice explorer, projection explorer, witness notes
  |-- Gallery: Three.js scene, pointer-lock controls (inlined), touch sticks
  |     `-- exhibits: 100 entries as data (geometry generator, name, tag, plaque text, references)
  `-- three.min.js 0.160.0 from jsDelivr; Google Fonts (Space Grotesk, Space Mono, Inter)
```

## Deployment

The page is published at [mindattic.com/hyperspace](https://mindattic.com/hyperspace/). `index.htm` is the whole site; there is no build step.

## Documentation

- [AGENTS.md](AGENTS.md): instructions for AI agents working in this repo

## License

This repo has no LICENSE file. All rights reserved.

Part of [MindAttic](https://mindattic.com) — see more projects at [github.com/mindattic](https://github.com/mindattic).
