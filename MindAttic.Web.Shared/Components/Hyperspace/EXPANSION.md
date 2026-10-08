# Hyperspace EXPANSION

A phased plan for growing the Hyperspace Gallery from its current 100 exhibits toward the 58
well-defined candidates identified in review, without breaking the engine, the page, or the tests
along the way.

Read [Hyperspace.md](Hyperspace.md) first — this plan assumes its data model, editing rules (ids are
stable, never copy the library back into the page, ship through the next whole-number tag) and test
suite.

---

## Current state (baseline)

- **100 shapes**, 9 families (`reg`, `unif`, `five`, `ncube`, `curve`, `duo`, `rot`, `phys`, `prism`),
  laid out `row: Math.floor(index / 10), col: index % 10` — a grid that is 10 columns wide and grows
  taller as shapes are appended; nothing caps it at 10 rows.
- `hyperspace.spec.mjs` hardcodes `100` in four assertions (`H.count`, `H.shapes.length`, unique id
  count, `H.get(100)` throwing). Every phase below that changes the total must update these.
- `index.htm`, `README.md` and `Hyperspace.md` all state the count and "10 x 10" in prose; these are
  copy, not data, and need a manual edit each time the total changes.
- One already-built, already-tested, **zero-cost** addition exists today: `kuenSurface` is a fully
  implemented generator (`hyperspace.js:637`) that no shape entry uses. It belongs in Phase 1 for free.

## Infrastructure prerequisites (Phase 0 — do this before adding content)

These are engine changes, not new shapes. They make every later phase a pure data exercise.

1. **Hall sizing.** `index.htm`'s floor (`PlaneGeometry(SPACING*12, SPACING*12)`) and `GridHelper` are
   sized for roughly today's row count. Replace the fixed `12` with a formula derived from
   `Math.ceil(Hyperspace.count / 10)` so the hall grows automatically as rows are added. Needed before
   the row count passes ~11 (i.e. before Phase 1 ships), or exhibits in the new rows render outside the
   visible floor/grid.
2. **`exhibitIndex` check.** `buildColumn()` sets `plaque.userData.exhibitIndex = data.row * 8 + data.col`
   — an 8-wide formula against a 10-wide `row`/`col`, so it does not reconstruct the real index except
   by coincidence for the first few rows. Confirm what reads `exhibitIndex` (plaque click → article
   lookup) and whether it actually depends on this value being correct. Fix or remove before relying on
   plaque interaction for any new row.
3. **Copy audit checklist.** A short list (kept in this file, see "Per-phase checklist" below) of every
   hardcoded count/description to touch: `index.htm` boot copy ("100 higher-dimensional objects"),
   `Hyperspace/README.md` ("100 exhibits", "10 x 10 hall"), `Hyperspace.md` ("100", "index 0 to 99",
   "10 x 10 hall").
4. **New family palette slots.** Two new categories are introduced in this plan (star polychora,
   honeycombs — see Phases 3 and 7). Reserve two new keys in `FAMILY_LABELS` and the `C` palette
   (`hyperspace.js:735` and `:1825`) now, with placeholder colors consistent with the existing palette
   (run the `dataviz` skill's palette check when picking the final hex values).

## Per-phase checklist (apply to every phase that ships)

- [ ] Add shape records to `hyperspace.js`, each with a `// ===== ROW n` comment matching the existing
      style, keeping declaration order = gallery order.
- [ ] Update the 4 hardcoded counts in `hyperspace.spec.mjs` (`H.count`/`shapes.length`/unique-id-count/
      `H.get(<new count>)`).
- [ ] Update prose counts in `index.htm`, `Hyperspace/README.md`, `Hyperspace.md`.
- [ ] Run `npm run test:local` in `MindAttic.Web.Shared/tests`.
- [ ] Open `Hyperspace/index.htm` locally and confirm the new rows render, fit the hall, and their
      plaques read correctly.
- [ ] Ship through the next whole-number MindAttic.Web tag; repin the Hyperspace page
      (`npm run deploy -- --site hyperspace` from `MindAttic.Deploy`).

---

## Phase 1 — Pattern completions + free generator (5 shapes, 100 → 105)

No new geometry code. Pure data entries using generators that already exist and are already proven
(`nCube`, `nSimplex`, `nOrthoplex`, `kuenSurface`).

| Shape | Family | Generator |
|---|---|---|
| 10-cube | `ncube` | `nCube(10)` |
| 10-simplex | `ncube` | `nSimplex(10)` |
| 8-orthoplex | `ncube` | `nOrthoplex(8)` |
| 9-orthoplex | `ncube` | `nOrthoplex(9)` |
| Kuen surface | `curve` | `kuenSurface` (already written, unused) |

**Risk: none.** This is the right phase to validate the Phase 0 hall-resize work.

## Phase 2 — Uniform 4-polytope completions + the one outlier (16 shapes, 105 → 121)

Reuses the existing Wythoff-truncation machinery already used for the rectified/truncated/cantellated/
runcinated entries in families `unif` and `five`. Same parent vertex sets, deeper truncation orders.

- Bitruncated 5-cell, Cantitruncated 5-cell, Runcitruncated 5-cell, Omnitruncated 5-cell
- Bitruncated tesseract, Cantitruncated tesseract, Runcitruncated tesseract, Omnitruncated tesseract
- Truncated 24-cell, Bitruncated 24-cell, Cantitruncated 24-cell, Runcitruncated 24-cell, Omnitruncated 24-cell
- Grand antiprism (the one convex uniform 4-polytope that is neither Wythoffian nor a duoprism — new
  vertex construction, moderate effort)
- Pentagonal antiprismatic prism, Square antiprismatic prism (two representatives of an open-ended
  family; reuses the antiprism + prism pattern already proven by the Platonic-solid prisms)

**Risk: low**, except the Grand antiprism, which needs its own vertex/edge derivation (100 vertices,
non-Wythoffian) — budget it as a standalone research task inside the phase.

## Phase 3 — Regular star polychora (10 shapes, 121 → 131)

The 10 Schläfli–Hess regular star polychora. Several of these **share a vertex set with the 120-cell or
600-cell already in the gallery** (the existing 120-cell entry already reuses the 600-cell's scaffold per
`Hyperspace.md`), so the wireframe geometry may be near-zero marginal cost — only the facts/schläfli/
blurb/article differ. Confirm vertex-sharing per shape before assuming free geometry.

Icosahedral 120-cell, Small stellated 120-cell, Great 120-cell, Grand 120-cell, Great stellated 120-cell,
Grand stellated 120-cell, Great grand 120-cell, Great icosahedral 120-cell, Grand 600-cell, Great grand
stellated 120-cell.

New family: `star` (needs a palette color — see Phase 0 item 4).

**Risk: low-to-moderate** — mostly research/verification (matching each star form to the right shared
vertex set), not new geometry code.

## Phase 4 — Lattices & Gosset/E-series polytopes (11 shapes, 131 → 142)

Root-system-based constructions. `aRoots` (an A-series root generator) and `edgesByShortest` (derives
edges from nearest-neighbor distance, already used elsewhere in the file) both already exist and
significantly de-risk this phase — new shapes likely need only the correct root vectors, not new
edge-finding logic.

- 2₂₁ polytope, 1₂₂ polytope (6D, E₆)
- 3₂₁ polytope, 2₃₁ polytope, 1₃₂ polytope (7D, E₇)
- 2₄₁ polytope, 1₄₂ polytope (8D, E₈ family, alongside the existing 4₂₁)
- E₆ lattice, E₇ lattice (pairs with the existing D4/D5/Leech lattice entries)
- Barnes–Wall lattice (16D — first exhibit past 10 native dimensions; confirm `projectTo3D`/
  `projectDown` behave correctly at this dimension, they're written generically so this should be a
  verification task, not new code)
- Coxeter–Todd lattice K₁₂ (12D)

**Risk: moderate-to-high.** This is the first phase that needs real research sourcing (correct root
vectors / generator matrices for E₆, E₇, Barnes–Wall, K₁₂) rather than reusing an established pattern.

## Phase 5 — Quasicrystals & higher Hopf fibrations (4 shapes, 142 → 146)

- Elser–Sloane quasicrystal (4D, cut-and-project from E₈) — extends the existing `penrose`/
  `ammannBeenker` cut-and-project generators, and pairs naturally with the existing `e8Roots`/
  `e8-root-system` entry.
- Icosahedral quasicrystal (6D → 3D cut) — same generator family, different source lattice/projection.
- Quaternionic Hopf fibration (S⁷ → S⁴) and Octonionic Hopf fibration (S¹⁵ → S⁸) — genuinely new
  parametrizations (the existing `hopfFibration` generator is specific to S³ → S²); pairs with the
  existing `octonion-structure` entry.

**Risk: moderate** for the quasicrystals (extending a proven pattern), **high** for the octonionic Hopf
fibration specifically (native dimension 15 is the highest in the whole library — verify the rendering
and rotation-plane UI scale sensibly before committing to it, or hold it back).

## Phase 6 — 4D topology/knot demos & exotic manifolds (6 shapes, 146 → 152)

- Simple rotation in 4D (single fixed plane — a direct, low-risk complement to the existing isoclinic
  entries in family `rot`)
- Spun trefoil, Spun figure-eight knot (extend the existing `trefoil-in-4d` entry's technique with the
  actual "spin a 3D knot into a 4D 2-sphere" construction)
- Seifert surface demo (`rot` or `curve`)
- Roman surface (reuses the `boysSurface`-style immersed-RP² parametrization pattern)
- Complex projective plane CP² (no natural polytope/edge skeleton — needs a point-cloud or representative
  skeleton approach; this is the hardest single item in the whole plan)

**Risk: low** for the first four, **high** for CP² — consider shipping this phase without it and
revisiting CP² as its own research spike.

## Phase 7 — Honeycombs, higher-multiplicity prisms & hyperspheres (7 shapes, 152 → 159*)

- Tesseractic honeycomb, 16-cell honeycomb, 24-cell honeycomb — the engine currently draws single finite
  polytopes, not periodic tilings. These need a new "finite cluster" generator paradigm (e.g. a 2×2×2×2
  block of cells) — the largest *engine* change in this plan, bigger than any single shape's math.
- p×q×r triaprism (6D), p×q×r×s tetraprism (8D) — straightforward extension of the existing `duoprism`/
  `polyDuoprism` generators to 3 and 4 factors.
- 5-sphere S⁵, 6-sphere S⁶ — straightforward extension of the existing `glome`/`glome5D` pattern.

New family: `comb` (honeycombs) — needs a palette color.

*Count shown assumes 2 representative hyperspheres and one representative pair of triaprism/tetraprism;
both families are open-ended and can be extended indefinitely after this phase if desired.

**Risk: high** for the honeycomb generator paradigm specifically; **low** for the prisms and hyperspheres.

---

## Suggested stopping points

Everything above is additive and independently shippable — this is a menu, not a commitment to all 58.
Natural pause points, by confidence:

- **Safe bet:** Phases 0–3 (100 → 131 shapes). Pure data + one moderate new construction (Grand
  antiprism), no new engine paradigms, no unsourced research.
- **Solid stretch:** add Phase 4 (→ 142) once root-vector sourcing is done.
- **Research-gated:** Phases 5–6 (→ 152, minus CP² if deferred) depend on one-off math derivations
  (higher Hopf fibrations, CP², spun knots) best budgeted as individual spikes.
- **Engine-gated:** Phase 7's honeycombs require a new rendering paradigm and should be scoped as a
  separate mini-project, not bundled with a content phase.

## Explicitly out of scope for this plan

The open-ended families noted in the original review — more duoprism/triaprism pairs, more
antiprismatic prisms, more honeycombs, more Niemeier lattices, more dimensions of n-cube/simplex/
orthoplex past 10D — have no natural finite count. EXPANSION covers one representative pass through
each; further growth from these families is a future "EXPANSION 2" decision, not part of this plan.
