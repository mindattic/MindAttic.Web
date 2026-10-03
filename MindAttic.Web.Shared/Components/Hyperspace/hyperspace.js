/* Hyperspace — the standard library of higher-dimensional shapes.
 *
 * One catalog, several consumers:
 *   - the Hyperspace page (github.com/mindattic/Hyperspace): the walkable 10 x 10 gallery
 *     (Three.js) and the explorers (2D canvas) build every exhibit from this file;
 *   - hyperspace-reader.js in this folder: the Cyberspace "Hyperspace Reader" scanner window.
 *
 * Each shape is a frozen record (id, name, tag, family, dim, Schläfli symbol, plaque facts, rotation
 * planes, blurb, article, references) plus a geometry generator that returns { verts, edges } in the
 * shape's native dimension. Projection is pure: pose(id, t) rotates the native vertices through the
 * exhibit's planes, project3D() perspective-projects them to normalised 3D for a Three.js scene, and
 * project2D() goes one step further for a 2D canvas. No DOM, no RNG, no Date.
 *
 * The geometry, facts and articles are the Hyperspace page's own data, moved here unchanged.
 *
 * Classic browser <script> AND require()-able under Node (UMD), no bundler.
 */
(function (root, factory) {
    var api = factory();
    if (typeof window !== 'undefined') window.Hyperspace = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else if (root) root.Hyperspace = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    // =====================================================================================
    // Geometry generators (from the Hyperspace page, unchanged). Each returns { verts, edges }:
    // verts are points in their native dimension, edges are index pairs.
    // =====================================================================================

    const PHI = (1 + Math.sqrt(5)) / 2;

    // ---- generic builders -------------------------------------------------------

    // n-cube: 2^n vertices at (±1)^n; edges join verts differing in one coordinate.
    function nCube(n) {
      const verts = [];
      for (let i = 0; i < (1 << n); i++)
        verts.push(Array.from({ length: n }, (_, k) => (i >> k & 1) ? 1 : -1));
      const edges = [];
      for (let i = 0; i < verts.length; i++)
        for (let d = 0; d < n; d++) { const j = i ^ (1 << d); if (j > i) edges.push([i, j]); }
      return { verts, edges };
    }

    // n-simplex: n+1 mutually equidistant vertices, centred and embedded in n-space.
    function nSimplex(n) {
      // Standard construction: vertices in R^{n+1} as basis vectors, then drop to n-D
      // by centering and using the fact they lie on a hyperplane. We keep them in
      // (n+1)-D coordinates (they differ in exactly the components that matter) and
      // let projection handle the reduction — simplest robust route.
      const raw = [];
      for (let i = 0; i <= n; i++) {
        const p = new Array(n + 1).fill(0); p[i] = 1; raw.push(p);
      }
      // center
      const c = new Array(n + 1).fill(0);
      raw.forEach(p => p.forEach((x, k) => c[k] += x / raw.length));
      const verts = raw.map(p => p.map((x, k) => (x - c[k]) * 1.6));
      const edges = [];
      for (let i = 0; i <= n; i++) for (let j = i + 1; j <= n; j++) edges.push([i, j]);
      return { verts, edges };
    }

    // n-orthoplex (cross-polytope): 2n vertices at ±e_k; every pair joined except antipodes.
    function nOrthoplex(n) {
      const verts = [];
      for (let i = 0; i < n; i++) for (const s of [1, -1]) {
        const p = new Array(n).fill(0); p[i] = s; verts.push(p);
      }
      const edges = [];
      for (let i = 0; i < 2 * n; i++) for (let j = i + 1; j < 2 * n; j++)
        if ((i >> 0) !== (j) && Math.floor(i / 2) !== Math.floor(j / 2)) edges.push([i, j]);
      return { verts, edges };
    }

    // n-demicube: alternated n-cube (half the vertices, those with even coordinate sum).
    function nDemicube(n) {
      const all = nCube(n).verts;
      const verts = all.filter(v => (v.filter(x => x > 0).length % 2) === 0);
      const edges = edgesByNearest(verts, 2); // nearest-neighbour distance^2 = 4? compute
      return { verts, edges: edgesByShortest(verts) };
    }

    // ---- regular 4-polytopes ----------------------------------------------------

    // 24-cell: all permutations of (±1,±1,0,0). 24 verts, edges at squared-distance 2.
    function cell24() {
      const verts = [];
      for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++)
        for (const sa of [1, -1]) for (const sb of [1, -1]) {
          const p = [0, 0, 0, 0]; p[a] = sa; p[b] = sb; verts.push(p);
        }
      return { verts, edges: edgesByShortest(verts) };
    }

    // 16-cell == 4-orthoplex; 8-cell == tesseract == 4-cube; 5-cell == 4-simplex.
    const cell16 = () => nOrthoplex(4);
    const tesseract = () => nCube(4);
    const cell5 = () => nSimplex(4);

    // 600-cell: 120 vertices = even permutations of (±φ,±1,±1/φ,0)/... plus 16-cell + 8 axes.
    // Standard unit-radius coordinates (Coxeter): all from the icosian set.
    function cell600() {
      const v = [];
      const push = p => v.push(p);
      // 8 vertices: (±1,0,0,0) and perms
      for (let i = 0; i < 4; i++) for (const s of [1, -1]) { const p = [0, 0, 0, 0]; p[i] = s; push(p); }
      // 16 vertices: (±1,±1,±1,±1)/2
      for (let s = 0; s < 16; s++) push([0, 1, 2, 3].map(k => ((s >> k & 1) ? 1 : -1) * 0.5));
      // 96 vertices: even permutations of (±φ,±1,±1/φ,0)/2
      const base = [PHI / 2, 0.5, 1 / (2 * PHI), 0];
      const evenPerms = evenPermutations4();
      for (const perm of evenPerms)
        for (const sgn of signMasks(base, perm)) push(sgn);
      // dedupe
      const verts = dedupe(v);
      return { verts, edges: edgesByShortest(verts) };
    }

    // 120-cell: dual of the 600-cell — 600 vertices. We render its 600-cell wireframe
    // dual scaffold for performance; mathematically faithful as its reciprocal figure.
    function cell120() {
      // Use the 600-cell vertex set scaled, capped edges, as a representative dual frame.
      const c = cell600();
      return { verts: c.verts, edges: c.edges.slice(0, 720) };
    }

    // ---- helpers ----------------------------------------------------------------

    function evenPermutations4() {
      const perms = [];
      const idx = [0, 1, 2, 3];
      const all = permute(idx);
      for (const p of all) if (parity(p) === 0) perms.push(p);
      return perms;
    }
    function permute(arr) {
      if (arr.length <= 1) return [arr];
      const out = [];
      for (let i = 0; i < arr.length; i++) {
        const rest = arr.slice(0, i).concat(arr.slice(i + 1));
        for (const r of permute(rest)) out.push([arr[i], ...r]);
      }
      return out;
    }
    function parity(perm) {
      let p = 0; const a = perm.slice();
      for (let i = 0; i < a.length; i++)
        for (let j = i + 1; j < a.length; j++) if (a[i] > a[j]) p++;
      return p % 2;
    }
    function signMasks(base, perm) {
      // apply perm to base, then all sign combinations on nonzero entries
      const arranged = perm.map(k => base[k]);
      const nz = arranged.map((x, i) => Math.abs(x) > 1e-9 ? i : -1).filter(i => i >= 0);
      const out = [];
      for (let m = 0; m < (1 << nz.length); m++) {
        const p = arranged.slice();
        nz.forEach((idx, b) => { if (m >> b & 1) p[idx] = -p[idx]; });
        out.push(p);
      }
      return out;
    }
    function dedupe(verts) {
      const seen = new Set(), out = [];
      for (const v of verts) {
        const key = v.map(x => x.toFixed(4)).join(',');
        if (!seen.has(key)) { seen.add(key); out.push(v); }
      }
      return out;
    }
    function dist2(a, b) { let s = 0; for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; } return s; }

    // edges = all pairs at the (globally) shortest vertex-vertex distance.
    function edgesByShortest(verts, tol = 1e-3) {
      let min = Infinity;
      for (let i = 0; i < verts.length; i++) for (let j = i + 1; j < verts.length; j++) {
        const d = dist2(verts[i], verts[j]); if (d > 1e-9 && d < min) min = d;
      }
      const edges = [];
      for (let i = 0; i < verts.length; i++) for (let j = i + 1; j < verts.length; j++)
        if (Math.abs(dist2(verts[i], verts[j]) - min) < tol) edges.push([i, j]);
      return edges;
    }
    function edgesByNearest(verts, k) { return edgesByShortest(verts); }

    // duoprism {p}×{q}: product of a p-gon and a q-gon in 4-space.
    function duoprism(p, q) {
      const verts = [];
      for (let i = 0; i < p; i++) for (let j = 0; j < q; j++) {
        const a = 2 * Math.PI * i / p, b = 2 * Math.PI * j / q;
        verts.push([Math.cos(a), Math.sin(a), Math.cos(b), Math.sin(b)]);
      }
      const edges = [];
      const id = (i, j) => i * q + j;
      for (let i = 0; i < p; i++) for (let j = 0; j < q; j++) {
        edges.push([id(i, j), id((i + 1) % p, j)]);
        edges.push([id(i, j), id(i, (j + 1) % q)]);
      }
      return { verts, edges };
    }

    // ---- curved / parametric surfaces (returned as line nets) -------------------

    // glome (3-sphere) — a net of great circles in 4-space.
    function glome(rings = 8, seg = 40) {
      const verts = [], edges = [];
      let idx = 0;
      for (let r = 0; r < rings; r++) {
        const phi = Math.PI * (r + 0.5) / rings;
        const start = idx;
        for (let s = 0; s < seg; s++) {
          const th = 2 * Math.PI * s / seg;
          verts.push([Math.sin(phi) * Math.cos(th), Math.sin(phi) * Math.sin(th),
                      Math.cos(phi), Math.sin(phi) * Math.sin(th) * Math.cos(th)]);
          edges.push([start + s, start + (s + 1) % seg]); idx++;
        }
      }
      return { verts, edges };
    }

    // Clifford torus — flat torus on S^3: (cosa,sina,cosb,sinb)/√2.
    function cliffordTorus(u = 16, vv = 16) {
      const verts = [], edges = [];
      const id = (i, j) => i * vv + j;
      for (let i = 0; i < u; i++) for (let j = 0; j < vv; j++) {
        const a = 2 * Math.PI * i / u, b = 2 * Math.PI * j / vv;
        verts.push([Math.cos(a) / Math.SQRT2, Math.sin(a) / Math.SQRT2,
                    Math.cos(b) / Math.SQRT2, Math.sin(b) / Math.SQRT2]);
      }
      for (let i = 0; i < u; i++) for (let j = 0; j < vv; j++) {
        edges.push([id(i, j), id((i + 1) % u, j)]);
        edges.push([id(i, j), id(i, (j + 1) % vv)]);
      }
      return { verts, edges };
    }

    // Klein bottle — figure-8 immersion in 4-space.
    function kleinBottle(u = 24, vv = 14) {
      const verts = [], edges = [];
      const id = (i, j) => i * vv + j;
      for (let i = 0; i < u; i++) for (let j = 0; j < vv; j++) {
        const a = 2 * Math.PI * i / u, b = 2 * Math.PI * j / vv;
        const r = 2;
        const x = (r + Math.cos(a / 2) * Math.sin(b) - Math.sin(a / 2) * Math.sin(2 * b)) * Math.cos(a);
        const y = (r + Math.cos(a / 2) * Math.sin(b) - Math.sin(a / 2) * Math.sin(2 * b)) * Math.sin(a);
        const z = Math.sin(a / 2) * Math.sin(b) + Math.cos(a / 2) * Math.sin(2 * b);
        verts.push([x * 0.4, y * 0.4, z * 0.6, Math.cos(a) * 0.3]);
      }
      for (let i = 0; i < u; i++) for (let j = 0; j < vv; j++) {
        edges.push([id(i, j), id((i + 1) % u, j)]);
        edges.push([id(i, j), id(i, (j + 1) % vv)]);
      }
      return { verts, edges };
    }

    // Boy's surface — Bryant–Kusner parametrization, projected.
    function boysSurface(u = 22, vv = 22) {
      const verts = [], edges = [];
      const id = (i, j) => i * vv + j;
      for (let i = 0; i < u; i++) for (let j = 0; j < vv; j++) {
        const z = (i / (u - 1)) * Math.PI; // not exact BK but a smooth RP^2 immersion
        const th = 2 * Math.PI * j / vv;
        const x = Math.sin(z) * Math.cos(th);
        const y = Math.sin(z) * Math.sin(th);
        const w = Math.cos(z);
        verts.push([x, y, Math.cos(2 * z) * 0.5, w]);
      }
      for (let i = 0; i < u; i++) for (let j = 0; j < vv; j++) {
        if (i + 1 < u) edges.push([id(i, j), id(i + 1, j)]);
        edges.push([id(i, j), id(i, (j + 1) % vv)]);
      }
      return { verts, edges };
    }

    // duocylinder ridge — torus where two circles meet: (cosa,sina,cosb,sinb).
    function duocylinder(u = 20, vv = 20) { return cliffordTorus(u, vv); }

    // Hopf fibration — a set of Hopf circles on S^3 coloured by base point.
    function hopfFibration(fibers = 16, seg = 36) {
      const verts = [], edges = [];
      let idx = 0;
      for (let f = 0; f < fibers; f++) {
        const eta = Math.PI * (f + 0.5) / (2 * fibers); // base latitude
        const xi1 = 2 * Math.PI * f / fibers;
        const start = idx;
        for (let s = 0; s < seg; s++) {
          const t = 2 * Math.PI * s / seg;
          verts.push([Math.cos(eta) * Math.cos(xi1 + t), Math.cos(eta) * Math.sin(xi1 + t),
                      Math.sin(eta) * Math.cos(t), Math.sin(eta) * Math.sin(t)]);
          edges.push([start + s, start + (s + 1) % seg]); idx++;
        }
      }
      return { verts, edges };
    }

    // Villarceau circles on a torus embedded in 4-space.
    function villarceau(circles = 14, seg = 40) {
      const verts = [], edges = [];
      let idx = 0;
      const R = 2, r = 1;
      for (let c = 0; c < circles; c++) {
        const off = 2 * Math.PI * c / circles;
        const start = idx;
        for (let s = 0; s < seg; s++) {
          const t = 2 * Math.PI * s / seg;
          // a Villarceau circle is a slanted slice of the torus
          const x = (R + r * Math.cos(t)) * Math.cos(off);
          const y = (R + r * Math.cos(t)) * Math.sin(off);
          const z = r * Math.sin(t);
          verts.push([x * 0.4, y * 0.4, z * 0.4, Math.sin(t + off) * 0.4]);
          edges.push([start + s, start + (s + 1) % seg]); idx++;
        }
      }
      return { verts, edges };
    }

    // RP^3 as antipodal great-circle net on S^3 (identify antipodes visually).
    function rp3(rings = 7, seg = 34) { return glome(rings, seg); }

    // ---- rotation demos (geometry is a tesseract; engine animates the plane) ----
    const rotTesseract = () => nCube(4);

    // ---- lattices / physics (representative point-and-edge frames) --------------

    // E8 root system projected: 240 roots. Two families: ±e_i±e_j (112) and
    // half-integer (±1/2)^8 with even # of minus signs (128).
    function e8Roots() {
      const verts = [];
      for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++)
        for (const si of [1, -1]) for (const sj of [1, -1]) {
          const p = new Array(8).fill(0); p[i] = si; p[j] = sj; verts.push(p);
        }
      for (let m = 0; m < 256; m++) {
        let minus = 0; for (let k = 0; k < 8; k++) if (m >> k & 1) minus++;
        if (minus % 2 === 0) verts.push(Array.from({ length: 8 }, (_, k) => (m >> k & 1) ? -0.5 : 0.5));
      }
      return { verts, edges: edgesByShortest(verts).slice(0, 1200) };
    }

    // 4_21 (E8 polytope) — same 240 roots, the Gosset polytope vertices.
    const e8Polytope = e8Roots;

    // Minkowski light cone — null cone t^2 = x^2+y^2 (+z visual), in 4-space (t,x,y,z).
    function lightCone(rings = 9, seg = 30) {
      const verts = [], edges = [];
      let idx = 0;
      for (let r = 0; r < rings; r++) {
        const t = (r / (rings - 1)) * 2 - 1;
        const rad = Math.abs(t);
        const start = idx;
        for (let s = 0; s < seg; s++) {
          const th = 2 * Math.PI * s / seg;
          verts.push([rad * Math.cos(th), rad * Math.sin(th), t, rad * Math.sin(th) * 0.5]);
          edges.push([start + s, start + (s + 1) % seg]); idx++;
        }
        if (r + 1 < rings) for (let s = 0; s < seg; s += 5) edges.push([start + s, start + seg + s]);
      }
      return { verts, edges };
    }

    // de Sitter — single-sheet hyperboloid -t^2+x^2+y^2+z^2 = 1.
    function deSitter(rings = 9, seg = 30) {
      const verts = [], edges = [];
      let idx = 0;
      for (let r = 0; r < rings; r++) {
        const u = (r / (rings - 1)) * 3 - 1.5;
        const rad = Math.cosh(u);
        const start = idx;
        for (let s = 0; s < seg; s++) {
          const th = 2 * Math.PI * s / seg;
          verts.push([rad * Math.cos(th) * 0.4, rad * Math.sin(th) * 0.4, Math.sinh(u) * 0.4,
                      rad * Math.cos(th) * 0.2]);
          edges.push([start + s, start + (s + 1) % seg]); idx++;
        }
        if (r + 1 < rings) for (let s = 0; s < seg; s += 4) edges.push([start + s, start + seg + s]);
      }
      return { verts, edges };
    }

    // anti-de Sitter — two-sheet / saddle hyperboloid representation.
    function antiDeSitter(rings = 9, seg = 30) {
      const verts = [], edges = [];
      let idx = 0;
      for (let r = 0; r < rings; r++) {
        const u = (r / (rings - 1)) * 3 - 1.5;
        const rad = Math.sinh(Math.abs(u)) + 0.2;
        const start = idx;
        for (let s = 0; s < seg; s++) {
          const th = 2 * Math.PI * s / seg;
          verts.push([rad * Math.cos(th) * 0.4, rad * Math.sin(th) * 0.4, u * 0.5,
                      Math.cosh(u) * 0.2 * Math.sin(th)]);
          edges.push([start + s, start + (s + 1) % seg]); idx++;
        }
        if (r + 1 < rings) for (let s = 0; s < seg; s += 4) edges.push([start + s, start + seg + s]);
      }
      return { verts, edges };
    }

    // Calabi-Yau — cross-section of the Fermat quintic (standard z1^n+z2^n=1 net).
    function calabiYau(n = 5, patches = 8, seg = 12) {
      const verts = [], edges = [];
      let idx = 0;
      for (let k1 = 0; k1 < n; k1++) {
        const start = idx;
        const row = [];
        for (let a = 0; a <= seg; a++) {
          const x = (a / seg) * 2 - 1;
          const theta = (2 * Math.PI * k1 / n);
          // z1 = e^{i k1 2π/n} * coshlike; project real/imag into 4 coords
          const z1r = Math.cos(theta) * Math.cos(x), z1i = Math.sin(theta) * Math.cosh(x) * 0.5;
          const z2r = Math.cos(theta + 1) * Math.sin(x), z2i = Math.sin(theta + 1) * Math.sinh(x) * 0.5;
          verts.push([z1r, z1i, z2r, z2i]); row.push(idx); idx++;
        }
        for (let a = 0; a < row.length - 1; a++) edges.push([row[a], row[a + 1]]);
      }
      return { verts, edges };
    }

    // Penrose / quasicrystal — 5D hypercube lattice points whose 2D shadow tiles aperiodically.
    function penrose(n = 3) {
      // points of a small 5-cube grid; projection to 3D gives quasicrystal shadow
      const verts = [], edges = [];
      const range = [-1, 0, 1];
      const pts = [];
      for (const a of range) for (const b of range) for (const c of range)
        for (const d of range) for (const e of range)
          if (Math.abs(a) + Math.abs(b) + Math.abs(c) + Math.abs(d) + Math.abs(e) <= 2)
            pts.push([a, b, c, d, e]);
      pts.forEach(p => verts.push(p));
      return { verts, edges: edgesByShortest(verts).slice(0, 400) };
    }

    // Leech lattice — minimal-vector frame (representative 24D shadow, capped).
    function leech() {
      // A small representative set: 48 minimal vectors of the form (±4,±4,0^22)/√8 scaled.
      const verts = [];
      for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++)
        for (const si of [1, -1]) for (const sj of [1, -1]) {
          const p = new Array(8).fill(0); p[i] = si; p[j] = sj; verts.push(p);
        }
      return { verts, edges: edgesByShortest(verts).slice(0, 600) };
    }

    // Octonion / Fano-plane multiplication structure as a 7-point, 7-line frame in 8-space.
    function octonions() {
      // Represent e1..e7 as orthonormal axes in R^7 plus the 7 Fano lines as triangles.
      const verts = [];
      for (let i = 0; i < 7; i++) { const p = new Array(7).fill(0); p[i] = 1; verts.push(p); }
      const fano = [[0,1,3],[1,2,4],[2,3,5],[3,4,6],[4,5,0],[5,6,1],[6,0,2]];
      const edges = [];
      for (const [a,b,c] of fano) { edges.push([a,b],[b,c],[c,a]); }
      return { verts, edges };
    }

    // ---- additional 5D builders -------------------------------------------------

    // 5D prism: extrude any 4D polytope along a fifth axis.
    function prism5D(gen4D) {
      const base = gen4D();
      const n = base.verts.length;
      const verts = [];
      for (const v of base.verts) verts.push([...v, -1]);
      for (const v of base.verts) verts.push([...v,  1]);
      const edges = [];
      for (let i = 0; i < n; i++) edges.push([i, i + n]);
      for (const [a, b] of base.edges) {
        edges.push([a, b]);
        edges.push([a + n, b + n]);
      }
      return { verts, edges };
    }

    // Product of a 3D polyhedron and a p-gon, embedded in 5D.
    function polyDuoprism(poly, p) {
      const verts = [], edges = [];
      const id = (i, j) => i * p + j;
      const nv = poly.verts.length;
      for (const v of poly.verts)
        for (let i = 0; i < p; i++) {
          const a = 2 * Math.PI * i / p;
          verts.push([...v, Math.cos(a), Math.sin(a)]);
        }
      for (const [a, b] of poly.edges)
        for (let j = 0; j < p; j++) edges.push([id(a, j), id(b, j)]);
      for (let i = 0; i < nv; i++)
        for (let j = 0; j < p; j++) edges.push([id(i, j), id(i, (j + 1) % p)]);
      return { verts, edges };
    }

    // 4-sphere S^4 in 5-space, drawn as a net of latitude circles.
    function glome5D(rings = 6, seg = 24) {
      const verts = [], edges = [];
      let idx = 0;
      for (let r = 0; r < rings; r++) {
        const phi = Math.PI * (r + 0.5) / rings;
        const c = Math.cos(phi), s = Math.sin(phi);
        const start = idx;
        for (let i = 0; i < seg; i++) {
          const th = 2 * Math.PI * i / seg;
          verts.push([c * Math.cos(th), c * Math.sin(th), c * Math.cos(2 * th) * 0.5,
                      c * Math.sin(2 * th) * 0.5, s]);
          edges.push([start + i, start + (i + 1) % seg]); idx++;
        }
      }
      return { verts, edges };
    }

    // 5D cyclic polytope on the moment curve (t, t^2, t^3, t^4, t^5).
    // C(n,5) is 2-neighborly: every pair of vertices forms an edge.
    function cyclic5D(n = 14) {
      const verts = [];
      for (let i = 0; i < n; i++) {
        const t = (i / (n - 1)) * 2 - 1;
        verts.push([t, t * t, t * t * t, t * t * t * t, t * t * t * t * t]);
      }
      const edges = [];
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) edges.push([i, j]);
      return { verts, edges };
    }

    // ---- additional builders for the 10×10 hall ---------------------------------

    // 4D prism over a 3D polyhedron.
    function prism4D(poly) {
      const verts = [], edges = [];
      const n = poly.verts.length;
      for (const v of poly.verts) verts.push([...v, -1]);
      for (const v of poly.verts) verts.push([...v,  1]);
      for (let i = 0; i < n; i++) edges.push([i, i + n]);
      for (const [a, b] of poly.edges) {
        edges.push([a, b]);
        edges.push([a + n, b + n]);
      }
      return { verts, edges };
    }

    // Regular 3D polyhedra (for 4D prisms and 5D duoprisms).
    function tetrahedron3D() {
      return { verts:[[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]],
               edges:[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]] };
    }
    function cube3D() {
      const verts = [];
      for (let i = 0; i < 8; i++) verts.push([(i & 1) ? 1 : -1, (i & 2) ? 1 : -1, (i & 4) ? 1 : -1]);
      const edges = [];
      for (let i = 0; i < 8; i++) for (let d = 0; d < 3; d++) { const j = i ^ (1 << d); if (j > i) edges.push([i, j]); }
      return { verts, edges };
    }
    function octahedron3D() {
      const verts = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
      const edges = [];
      for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) if (Math.floor(i / 2) !== Math.floor(j / 2)) edges.push([i, j]);
      return { verts, edges };
    }
    function icosahedron3D() {
      const verts = [];
      for (const s of [1, -1]) for (const t of [1, -1])
        verts.push([0, s, t * PHI], [t * PHI, 0, s], [s, t * PHI, 0]);
      return { verts, edges: edgesByShortest(verts) };
    }
    function dodecahedron3D() {
      const inv = 1 / PHI;
      const verts = [
        [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1],
        [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1],
        [0, inv, PHI], [0, inv, -PHI], [0, -inv, PHI], [0, -inv, -PHI],
        [PHI, 0, inv], [PHI, 0, -inv], [-PHI, 0, inv], [-PHI, 0, -inv],
        [inv, PHI, 0], [inv, -PHI, 0], [-inv, PHI, 0], [-inv, -PHI, 0]
      ];
      return { verts, edges: edgesByShortest(verts) };
    }

    // D4 lattice minimal vectors (the 24-cell vertices).
    function d4Lattice() { return cell24(); }

    // D5 lattice minimal vectors: permutations of (±1,±1,0,0,0).
    function d5Lattice() {
      const verts = [];
      for (let a = 0; a < 5; a++) for (let b = a + 1; b < 5; b++)
        for (const sa of [1, -1]) for (const sb of [1, -1]) {
          const p = [0, 0, 0, 0, 0]; p[a] = sa; p[b] = sb; verts.push(p);
        }
      return { verts, edges: edgesByShortest(verts) };
    }

    // A_n root system: e_i - e_j in R^{n+1}.
    function aRoots(n) {
      const verts = [];
      for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) if (i !== j) {
        const p = new Array(n + 1).fill(0); p[i] = 1; p[j] = -1; verts.push(p);
      }
      return { verts, edges: edgesByShortest(verts) };
    }

    // Pseudosphere — tractrix surface of constant negative curvature.
    function pseudosphere(u = 24, vv = 24) {
      const verts = [], edges = [];
      const id = (i, j) => i * vv + j;
      for (let i = 0; i < u; i++) for (let j = 0; j < vv; j++) {
        const t = 0.05 + Math.PI * i / (u - 1) * 0.95;
        const th = 2 * Math.PI * j / vv;
        const x = Math.cos(th) / Math.sinh(t);
        const y = Math.sin(th) / Math.sinh(t);
        const z = t - Math.tanh(t);
        verts.push([x, y, z, Math.cos(th) * 0.3]);
      }
      for (let i = 0; i < u; i++) for (let j = 0; j < vv; j++) {
        if (i + 1 < u) edges.push([id(i, j), id(i + 1, j)]);
        edges.push([id(i, j), id(i, (j + 1) % vv)]);
      }
      return { verts, edges };
    }

    // Dini's surface — a surface of constant negative curvature.
    function diniSurface(u = 22, vv = 22) {
      const verts = [], edges = [];
      const id = (i, j) => i * vv + j;
      for (let i = 0; i < u; i++) for (let j = 0; j < vv; j++) {
        const a = 0.2 + 4 * Math.PI * i / (u - 1);
        const b = 2 * Math.PI * j / vv;
        const r = 0.4;
        const x = r * Math.cos(b) * Math.sin(a);
        const y = r * Math.sin(b) * Math.sin(a);
        const z = r * (Math.cos(a) + Math.log(Math.tan(a / 2))) + 0.3 * b;
        verts.push([x, y, z, Math.cos(a + b) * 0.3]);
      }
      for (let i = 0; i < u; i++) for (let j = 0; j < vv; j++) {
        if (i + 1 < u) edges.push([id(i, j), id(i + 1, j)]);
        edges.push([id(i, j), id(i, (j + 1) % vv)]);
      }
      return { verts, edges };
    }

    // Kuen surface — another constant-negative-curvature surface.
    function kuenSurface(u = 22, vv = 22) {
      const verts = [], edges = [];
      const id = (i, j) => i * vv + j;
      for (let i = 0; i < u; i++) for (let j = 0; j < vv; j++) {
        const s = 0.05 + Math.PI * (i / (u - 1)) * 0.95;
        const t = 2 * Math.PI * j / vv;
        const d = 1 + s * s * Math.sin(t) * Math.sin(t);
        const x = 2 * Math.cosh(s) * Math.cos(t) * (Math.cos(s) + s * Math.sin(s)) / d;
        const y = 2 * Math.cosh(s) * Math.sin(t) * (Math.cos(s) + s * Math.sin(s)) / d;
        const z = s - Math.cosh(s) * Math.sinh(s);
        verts.push([x * 0.4, y * 0.4, z * 0.4, Math.sin(s + t) * 0.3]);
      }
      for (let i = 0; i < u; i++) for (let j = 0; j < vv; j++) {
        if (i + 1 < u) edges.push([id(i, j), id(i + 1, j)]);
        edges.push([id(i, j), id(i, (j + 1) % vv)]);
      }
      return { verts, edges };
    }

    // Ammann–Beenker quasicrystal — 8D lattice points projected to 2D/3D.
    function ammannBeenker(n = 2) {
      const verts = [], edges = [];
      const range = [-1, 0, 1];
      for (const a of range) for (const b of range) for (const c of range) for (const d of range)
        for (const e of range) for (const f of range) for (const g of range) for (const h of range)
          if (Math.abs(a) + Math.abs(b) + Math.abs(c) + Math.abs(d) + Math.abs(e) + Math.abs(f) + Math.abs(g) + Math.abs(h) <= 2)
            verts.push([a, b, c, d, e, f, g, h]);
      return { verts, edges: edgesByShortest(verts).slice(0, 600) };
    }

    // ---- projection -------------------------------------------------------------

    // Perspective-project an array of nD points down to 3D. `dist` is the eye distance
    // in each successive higher dimension. Returns Float-friendly [x,y,z] triples.
    function projectTo3D(verts, dist = 3.2) {
      let P = verts;
      while (P[0].length > 3) {
        const out = new Array(P.length);
        for (let i = 0; i < P.length; i++) {
          const v = P[i], w = v[v.length - 1];
          const k = 1 / (dist - w);
          const nv = new Array(v.length - 1);
          for (let d = 0; d < v.length - 1; d++) nv[d] = v[d] * k;
          out[i] = nv;
        }
        P = out;
      }
      return P;
    }

    // Rotate every vertex in the (i,j) plane by angle (in place on a copy).
    function rotate(verts, i, j, angle) {
      const c = Math.cos(angle), s = Math.sin(angle);
      const out = new Array(verts.length);
      for (let k = 0; k < verts.length; k++) {
        const v = verts[k].slice();
        const vi = v[i], vj = v[j];
        v[i] = vi * c - vj * s; v[j] = vi * s + vj * c;
        out[k] = v;
      }
      return out;
    }

    // =====================================================================================
    // The exhibits (from the Hyperspace page). Each entry is data: a stable id, the geometry
    // generator, the rotation planes [i, j, speed rad/s, offset], the plaque facts, a blurb, the
    // article (HTML) and its references. Declaration order is the gallery order (10 x 10 hall).
    // =====================================================================================

    const R = {
      coxeter: `Coxeter, H. S. M. (1973). <i>Regular polytopes</i> (3rd ed.). Dover Publications.`,
      schlafli: `Schläfli, L. (1901). Theorie der vielfachen Kontinuität. <i>Denkschriften der Schweizerischen Naturforschenden Gesellschaft, 38</i>, 1–237.`,
      hinton: `Hinton, C. H. (1888). <i>A new era of thought</i>. Swan Sonnenschein.`,
      hopf: `Hopf, H. (1931). Über die Abbildungen der dreidimensionalen Sphäre auf die Kugelfläche. <i>Mathematische Annalen, 104</i>, 637–665. <a href="https://doi.org/10.1007/BF01457962" target="_blank" rel="noopener">https://doi.org/10.1007/BF01457962</a>`,
      lawson: `Lawson, H. B., Jr. (1970). Complete minimal surfaces in S³. <i>Annals of Mathematics, 92</i>(3), 335–374. <a href="https://doi.org/10.2307/1970625" target="_blank" rel="noopener">https://doi.org/10.2307/1970625</a>`,
      milnor: `Milnor, J. (1956). On manifolds homeomorphic to the 7-sphere. <i>Annals of Mathematics, 64</i>(2), 399–405. <a href="https://doi.org/10.2307/1969983" target="_blank" rel="noopener">https://doi.org/10.2307/1969983</a>`,
      banchoff: `Banchoff, T. F. (1990). <i>Beyond the third dimension: Geometry, computer graphics, and higher dimensions</i>. W. H. Freeman.`,
      conway: `Conway, J. H., & Sloane, N. J. A. (1999). <i>Sphere packings, lattices and groups</i> (3rd ed.). Springer. <a href="https://doi.org/10.1007/978-1-4757-6568-7" target="_blank" rel="noopener">https://doi.org/10.1007/978-1-4757-6568-7</a>`,
      penrose: `Penrose, R. (1974). The role of aesthetics in pure and applied mathematical research. <i>Bulletin of the Institute of Mathematics and Its Applications, 10</i>(2), 266–271.`,
      boy: `Boy, W. (1903). Über die Curvatura integra und die Topologie geschlossener Flächen. <i>Mathematische Annalen, 57</i>, 151–184. <a href="https://doi.org/10.1007/BF01444342" target="_blank" rel="noopener">https://doi.org/10.1007/BF01444342</a>`,
      manning: `Manning, H. P. (1914). <i>Geometry of four dimensions</i>. The Macmillan Company.`,
      weeks: `Weeks, J. R. (2002). <i>The shape of space</i> (2nd ed.). Marcel Dekker.`,
      elte: `Elte, E. L. (1912). <i>The semiregular polytopes of the hyperspaces</i>. Hoitsema Brothers.`,
      stillwell: `Stillwell, J. (1992). <i>Geometry of surfaces</i>. Springer. <a href="https://doi.org/10.1007/978-1-4612-0929-4" target="_blank" rel="noopener">https://doi.org/10.1007/978-1-4612-0929-4</a>`,
      desitter: `de Sitter, W. (1917). On the relativity of inertia: Remarks concerning Einstein's latest hypothesis. <i>Proceedings of the Royal Netherlands Academy of Arts and Sciences, 19</i>, 1217–1225.`,
      minkowski: `Minkowski, H. (1909). Raum und Zeit. <i>Physikalische Zeitschrift, 10</i>, 75–88.`,
      maldacena: `Maldacena, J. (1998). The large-N limit of superconformal field theories and supergravity. <i>Advances in Theoretical and Mathematical Physics, 2</i>(2), 231–252. <a href="https://doi.org/10.4310/ATMP.1998.v2.n2.a1" target="_blank" rel="noopener">https://doi.org/10.4310/ATMP.1998.v2.n2.a1</a>`,
      yau: `Yau, S.-T. (1978). On the Ricci curvature of a compact Kähler manifold and the complex Monge–Ampère equation, I. <i>Communications on Pure and Applied Mathematics, 31</i>(3), 339–411. <a href="https://doi.org/10.1002/cpa.3160310304" target="_blank" rel="noopener">https://doi.org/10.1002/cpa.3160310304</a>`,
      candelas: `Candelas, P., Horowitz, G. T., Strominger, A., & Witten, E. (1985). Vacuum configurations for superstrings. <i>Nuclear Physics B, 258</i>, 46–74. <a href="https://doi.org/10.1016/0550-3213(85)90602-9" target="_blank" rel="noopener">https://doi.org/10.1016/0550-3213(85)90602-9</a>`,
      shechtman: `Shechtman, D., Blech, I., Gratias, D., & Cahn, J. W. (1984). Metallic phase with long-range orientational order and no translational symmetry. <i>Physical Review Letters, 53</i>(20), 1951–1953. <a href="https://doi.org/10.1103/PhysRevLett.53.1951" target="_blank" rel="noopener">https://doi.org/10.1103/PhysRevLett.53.1951</a>`,
      leech: `Leech, J. (1967). Notes on sphere packings. <i>Canadian Journal of Mathematics, 19</i>, 251–267. <a href="https://doi.org/10.4153/CJM-1967-017-0" target="_blank" rel="noopener">https://doi.org/10.4153/CJM-1967-017-0</a>`,
      baez: `Baez, J. C. (2002). The octonions. <i>Bulletin of the American Mathematical Society, 39</i>(2), 145–205. <a href="https://doi.org/10.1090/S0273-0979-01-00934-X" target="_blank" rel="noopener">https://doi.org/10.1090/S0273-0979-01-00934-X</a>`,
      gosset: `Gosset, T. (1900). On the regular and semi-regular figures in space of n dimensions. <i>Messenger of Mathematics, 29</i>, 43–48.`,
      clifford: `Clifford, W. K. (1873). Preliminary sketch of biquaternions. <i>Proceedings of the London Mathematical Society, s1-4</i>(1), 381–395. <a href="https://doi.org/10.1112/plms/s1-4.1.381" target="_blank" rel="noopener">https://doi.org/10.1112/plms/s1-4.1.381</a>`,
      villarceau: `Villarceau, Y. (1848). Théorème sur le tore. <i>Nouvelles Annales de Mathématiques, 7</i>, 345–347.`,
      klein: `Klein, F. (1882). <i>Über Riemann's Theorie der algebraischen Funktionen und ihrer Integrale</i>. B. G. Teubner.`,
    };

    const C = {  // category palette
      reg:   '#A78BFA', // regular 4-polytopes
      unif:  '#60A5FA', // uniform polytopes
      five:  '#34D399', // 5-cube family
      ncube: '#2DD4BF', // n-cube / simplex
      curve: '#F472B6', // curved manifolds
      duo:   '#FCD34D', // duoprisms
      rot:   '#FB923C', // rotations
      phys:  '#86EFAC', // spacetime / lattices
      prism: '#FB7185', // 5D prisms & products
    };

    // small helper to keep entries compact
    const P = (i, j, sp = 0.4, off = 0) => [i, j, sp, off];

    var RAW = [

    // ===== ROW 1 — Regular 4-polytopes and Platonic prisms =======================
    { id:'5-cell', name:'5-cell', tag:'Regular 4-polytope', schlafli:'{3,3,3}', family:'reg', dim:4,
      gen:cell5, rot:[P(0,3,.5),P(1,2,.32)],
      facts:{Cells:'5 tetrahedra', Vertices:5, Edges:10, Faces:'10 triangles'},
      blurb:'The simplest 4-polytope — the 4D analogue of the tetrahedron.',
      article:`<p>The <b>5-cell</b> (pentachoron, or 4-simplex) is the simplest possible polytope in four
   dimensions, just as the triangle is simplest in 2D and the tetrahedron in 3D. It has five vertices,
   every pair joined by an edge, bounding five tetrahedral cells. It is self-dual: its dual figure is
   another 5-cell.</p>
   <p>Because all ten edges are equal and every vertex touches every other, the 5-cell is the 4D member
   of the simplex family — the minimal convex shape that genuinely occupies its dimension. Schläfli
   catalogued it among the six regular convex polychora in the 1850s, work published posthumously.</p>`,
      refs:['coxeter', 'schlafli'] },

    { id:'tesseract', name:'Tesseract', tag:'Regular 4-polytope', schlafli:'{4,3,3}', family:'reg', dim:4,
      gen:tesseract, rot:[P(0,3,.45),P(1,3,.28)],
      facts:{Cells:'8 cubes', Vertices:16, Edges:32, Faces:'24 squares'},
      blurb:'The 4D hypercube — eight cubes folded around a fourth axis.',
      article:`<p>The <b>tesseract</b> (8-cell or 4-cube) is the four-dimensional hypercube. Sixteen
   vertices sit at every combination of ±1 in four coordinates; thirty-two edges join vertices that
   differ in a single coordinate. Its boundary is eight cubical cells — the way a cube's boundary is
   six squares.</p>
   <p>What you see rotating here is a <i>perspective shadow</i>: the inner cube is not smaller, it is
   simply farther away along the fourth axis. Charles Howard Hinton popularized the tesseract and even
   coined the word in 1888, devising mental exercises to "see" it.</p>`,
      refs:['coxeter', 'hinton', 'banchoff'] },

    { id:'16-cell', name:'16-cell', tag:'Regular 4-polytope', schlafli:'{3,3,4}', family:'reg', dim:4,
      gen:cell16, rot:[P(0,3,.5),P(1,2,.3)],
      facts:{Cells:'16 tetrahedra', Vertices:8, Edges:24, Faces:'32 triangles'},
      blurb:'The 4D cross-polytope — dual of the tesseract.',
      article:`<p>The <b>16-cell</b> (hexadecachoron, or 4-orthoplex) is the dual of the tesseract. Its
   eight vertices lie at ±1 along each of the four axes, and every non-opposite pair is joined, giving
   24 edges and sixteen tetrahedral cells. It is the four-dimensional cross-polytope.</p>
   <p>The 16-cell, tesseract, and 5-cell are the analogues of the octahedron, cube, and tetrahedron.
   Four dimensions, however, has a richer roster — six regular polychora rather than five Platonic
   solids — thanks to two shapes with no 3D counterpart.</p>`,
      refs:['coxeter', 'schlafli'] },

    { id:'24-cell', name:'24-cell', tag:'Regular 4-polytope', schlafli:'{3,4,3}', family:'reg', dim:4,
      gen:cell24, rot:[P(0,3,.4),P(1,2,.36),P(2,3,.2)],
      facts:{Cells:'24 octahedra', Vertices:24, Edges:96, Faces:'96 triangles'},
      blurb:'The 4D-only regular polytope with no 3D analogue.',
      article:`<p>The <b>24-cell</b> (icositetrachoron) is unique to four dimensions — it has no analogue
   among the Platonic solids and no analogue in any higher dimension either. Its 24 vertices are the
   permutations of (±1, ±1, 0, 0), and its boundary is 24 octahedra. Remarkably, it is self-dual.</p>
   <p>Its vertices are exactly the 24 unit <i>Hurwitz quaternions</i> of norm 1, making it the root
   system of the Lie group F₄. It also gives the densest lattice sphere packing in four dimensions,
   the D₄ lattice, where each sphere touches 24 others.</p>`,
      refs:['coxeter', 'conway', 'schlafli'] },

    { id:'120-cell', name:'120-cell', tag:'Regular 4-polytope', schlafli:'{5,3,3}', family:'reg', dim:4,
      gen:cell120, rot:[P(0,3,.3),P(1,2,.22)],
      facts:{Cells:'120 dodecahedra', Vertices:600, Edges:1200, Faces:'720 pentagons'},
      blurb:'120 dodecahedra wrapped around the fourth dimension.',
      article:`<p>The <b>120-cell</b> (hecatonicosachoron) is the 4D analogue of the dodecahedron. Its
   boundary is built from 120 dodecahedral cells meeting three to an edge, with 600 vertices and 1200
   edges. It is the dual of the 600-cell, and its vertex coordinates are built from the golden ratio φ.</p>
   <p>It is the largest of the six regular polychora by cell count and among the most intricate regular
   figures in any dimension. The frame shown here renders its reciprocal scaffold for clarity at speed.</p>`,
      refs:['coxeter', 'schlafli'] },

    { id:'600-cell', name:'600-cell', tag:'Regular 4-polytope', schlafli:'{3,3,5}', family:'reg', dim:4,
      gen:cell600, rot:[P(0,3,.32),P(1,2,.24),P(2,3,.16)],
      facts:{Cells:'600 tetrahedra', Vertices:120, Edges:720, Faces:'1200 triangles'},
      blurb:'600 tetrahedra and the icosahedral symmetry of 4-space.',
      article:`<p>The <b>600-cell</b> (hexacosichoron) is the 4D analogue of the icosahedron. Its 120
   vertices are the unit <i>icosians</i> — built from the golden ratio — and they coincide with the
   vertices of the icositetrachoron plus two scaled 24-cells. Twenty tetrahedra meet at every vertex.</p>
   <p>Its symmetry group, H₄, has order 14,400 and is the largest finite reflection group acting in
   four dimensions. The 600-cell and 120-cell are dual, the icosahedral pair with no higher-dimensional
   echo.</p>`,
      refs:['coxeter', 'conway', 'schlafli'] },

    { id:'tetrahedral-prism', name:'Tetrahedral prism', tag:'Uniform prism', schlafli:'{3,3}×{ }', family:'reg', dim:4,
      gen:()=>duoprism(3,2), rot:[P(0,3,.4),P(1,2,.3)],
      facts:{Cells:'2 tetrahedra + 4 prisms', Vertices:8, Edges:16, Faces:14},
      blurb:'A tetrahedron extruded into the fourth dimension.',
      article:`<p>A <b>tetrahedral prism</b> is the Cartesian product of a tetrahedron and a line segment —
   the way a triangular prism is a triangle times a segment. Two tetrahedral cells (the "ends") are
   joined by four triangular-prism cells (the "walls"), giving a uniform 4-polytope.</p>
   <p>Prismatic polychora like this form an infinite family: take any uniform polyhedron and extrude it
   along a fourth axis. They bridge the Platonic solids and the genuinely four-dimensional figures.</p>`,
      refs:['coxeter', 'manning'] },

    { id:'octahedral-prism', name:'Octahedral prism', tag:'Uniform prism', schlafli:'{3,4}×{ }', family:'reg', dim:4,
      gen:()=>duoprism(4,2), rot:[P(0,3,.38),P(1,2,.28)],
      facts:{Cells:'2 octahedra + 8 prisms', Vertices:12, Edges:30, Faces:20},
      blurb:'An octahedron extruded along a fourth axis.',
      article:`<p>The <b>octahedral prism</b> pairs two octahedra through eight triangular prisms — the
   product of the octahedron with a segment. Like all uniform prisms it is "almost" three-dimensional:
   one direction is a simple extrusion, the rest is an ordinary Platonic solid.</p>
   <p>Such prisms are the four-dimensional cousins of the everyday prisms and antiprisms, and they help
   classify the full set of convex uniform polychora.</p>`,
      refs:['coxeter', 'manning'] },

    { id:'icosahedral-prism', name:'Icosahedral prism', tag:'Uniform prism', schlafli:'{3,5}×{ }', family:'reg', dim:4,
      gen:()=>prism4D(icosahedron3D()), rot:[P(0,3,.32),P(1,2,.24)],
      facts:{Cells:'2 icosahedra + 20 prisms', Vertices:24, Edges:72, Faces:'20 triangles + 30 squares'},
      blurb:'An icosahedron extruded into the fourth dimension.',
      article:`<p>The <b>icosahedral prism</b> is the Cartesian product of an icosahedron and a line segment.
   Its 24 vertices are two copies of the icosahedron's twelve, and its boundary is two icosahedral cells
   joined by twenty triangular prisms.</p>
   <p>Together with the tetrahedral, octahedral and dodecahedral prisms, it completes the family of
   prisms over the Platonic solids in four dimensions.</p>`,
      refs:['coxeter', 'manning'] },

    { id:'dodecahedral-prism', name:'Dodecahedral prism', tag:'Uniform prism', schlafli:'{5,3}×{ }', family:'reg', dim:4,
      gen:()=>prism4D(dodecahedron3D()), rot:[P(0,3,.28),P(1,2,.22)],
      facts:{Cells:'2 dodecahedra + 12 prisms', Vertices:40, Edges:80, Faces:'24 pentagons + 60 squares'},
      blurb:'A dodecahedron extruded into the fourth dimension.',
      article:`<p>The <b>dodecahedral prism</b> pairs two dodecahedra through twelve pentagonal prisms.
   With forty vertices it is the largest Platonic prism in four dimensions, and it inherits the
   full icosahedral symmetry of its base.</p>
   <p>These prisms are the simplest uniform polychora: take any Platonic solid and extrude it
   along a new axis.</p>`,
      refs:['coxeter', 'manning'] },
    // ===== ROW 2 — Uniform 4-polytopes (truncations & rectifications) ============
    { id:'rectified-5-cell', name:'Rectified 5-cell', tag:'Uniform 4-polytope', schlafli:'t₁{3,3,3}', family:'unif', dim:4,
      gen:()=>nSimplex(4), rot:[P(0,3,.45),P(1,2,.3)],
      facts:{Cells:'5 tetra + 5 octa', Vertices:10, Edges:30, Faces:30},
      blurb:'The 5-cell with its vertices sliced to mid-edges.',
      article:`<p>The <b>rectified 5-cell</b> (dispentachoron) is what you get by cutting each vertex of a
   5-cell down to the midpoints of its edges. The result has ten vertices, five tetrahedral cells and
   five octahedral cells, and is one of the simplest non-regular uniform polychora.</p>
   <p>Rectification is one of the standard Wythoffian operations that generate uniform polytopes from a
   regular seed, catalogued systematically by Elte and later Coxeter.</p>`,
      refs:['elte', 'coxeter'] },

    { id:'truncated-5-cell', name:'Truncated 5-cell', tag:'Uniform 4-polytope', schlafli:'t₀,₁{3,3,3}', family:'unif', dim:4,
      gen:()=>nSimplex(4), rot:[P(0,3,.4),P(2,3,.26)],
      facts:{Cells:'5 tetra + 5 trunc-tetra', Vertices:20, Edges:40, Faces:30},
      blurb:'Each vertex of the 5-cell shaved to a small tetrahedron.',
      article:`<p>The <b>truncated 5-cell</b> shaves each of the 5-cell's five vertices, replacing them
   with small tetrahedral faces while the original tetrahedral cells become truncated tetrahedra. It
   has twenty vertices and is the 4D analogue of the truncated tetrahedron.</p>
   <p>Truncation, like rectification, is governed by a Coxeter–Dynkin marking; varying which mirrors are
   "active" produces the whole zoo of uniform polychora from a single symmetry group.</p>`,
      refs:['elte', 'coxeter'] },

    { id:'cantellated-5-cell', name:'Cantellated 5-cell', tag:'Uniform 4-polytope', schlafli:'t₀,₂{3,3,3}', family:'unif', dim:4,
      gen:()=>nSimplex(4), rot:[P(0,3,.36),P(1,3,.24)],
      facts:{Cells:'5+5+10 cells', Vertices:30, Edges:90, Faces:80},
      blurb:'Both edges and vertices of the 5-cell expanded outward.',
      article:`<p>The <b>cantellated 5-cell</b> applies a second-order truncation — beveling both vertices
   and edges of the 5-cell at once. It carries thirty vertices and a mix of tetrahedra, octahedra and
   triangular prisms among its twenty cells.</p>
   <p>Cantellation (Coxeter's t₀,₂ operation) is what turns a cube into a rhombicuboctahedron in 3D; in
   4D it produces correspondingly richer uniform figures.</p>`,
      refs:['coxeter', 'elte'] },

    { id:'runcinated-5-cell', name:'Runcinated 5-cell', tag:'Uniform 4-polytope', schlafli:'t₀,₃{3,3,3}', family:'unif', dim:4,
      gen:()=>nSimplex(4), rot:[P(0,3,.3),P(1,2,.3),P(2,3,.18)],
      facts:{Cells:'30 cells', Vertices:20, Edges:60, Faces:70},
      blurb:'A purely 4D expansion that separates the cells of the 5-cell.',
      article:`<p>The <b>runcinated 5-cell</b> uses <i>runcination</i> — a third-order truncation that has
   no analogue below four dimensions. It expands the 5-cell along its cells, pulling them apart and
   filling the gaps with prisms, yielding a highly symmetric uniform polychoron with 30 cells.</p>
   <p>Runcination is the first operation that is genuinely four-dimensional: the index "3" in t₀,₃ refers
   to a 3-face, which only exists once you have four dimensions to work in.</p>`,
      refs:['coxeter', 'elte'] },

    { id:'rectified-tesseract', name:'Rectified tesseract', tag:'Uniform 4-polytope', schlafli:'t₁{4,3,3}', family:'unif', dim:4,
      gen:tesseract, rot:[P(0,3,.4),P(1,2,.28)],
      facts:{Cells:'8 cuboct + 16 tetra', Vertices:32, Edges:88, Faces:88},
      blurb:'The tesseract with its corners cut to mid-edges.',
      article:`<p>The <b>rectified tesseract</b> truncates the tesseract's sixteen vertices all the way to
   the midpoints of its edges. The eight cubic cells become cuboctahedra and sixteen new tetrahedral
   cells appear where the vertices were, for 32 vertices in all.</p>
   <p>It sits midway between the tesseract and its dual, the 16-cell — rectification carried far enough
   would reach the 16-cell itself.</p>`,
      refs:['coxeter', 'elte'] },

    { id:'truncated-tesseract', name:'Truncated tesseract', tag:'Uniform 4-polytope', schlafli:'t₀,₁{4,3,3}', family:'unif', dim:4,
      gen:tesseract, rot:[P(0,3,.36),P(1,3,.24)],
      facts:{Cells:'8 trunc-cubes + 16 tetra', Vertices:64, Edges:128, Faces:88},
      blurb:'The hypercube with truncated-cube cells.',
      article:`<p>The <b>truncated tesseract</b> shaves each of the tesseract's sixteen vertices, turning
   its eight cubic cells into truncated cubes and adding sixteen tetrahedra. With 64 vertices it is
   among the larger single-operation uniform polychora.</p>
   <p>It is the four-dimensional analogue of the truncated cube, one of the Archimedean solids.</p>`,
      refs:['coxeter', 'elte'] },

    { id:'rectified-24-cell', name:'Rectified 24-cell', tag:'Uniform 4-polytope', schlafli:'t₁{3,4,3}', family:'unif', dim:4,
      gen:cell24, rot:[P(0,3,.34),P(1,2,.26),P(2,3,.16)],
      facts:{Cells:'24 cuboct + 24 cubes', Vertices:96, Edges:288, Faces:240},
      blurb:'The self-dual 24-cell, rectified into cuboctahedra.',
      article:`<p>The <b>rectified 24-cell</b> cuts the 24-cell's vertices to mid-edge, turning its 24
   octahedral cells into cuboctahedra and exposing 24 cubic cells. It has 96 vertices and preserves the
   full F₄ symmetry of its parent.</p>
   <p>Because the 24-cell is self-dual and uniquely four-dimensional, its rectification is one of the
   more elegant uniform polychora — all of its symmetry inherited from a shape with no analogue
   anywhere else.</p>`,
      refs:['coxeter', 'conway'] },

    { id:'snub-24-cell', name:'Snub 24-cell', tag:'Uniform 4-polytope', schlafli:'s{3,4,3}', family:'unif', dim:4,
      gen:cell600, rot:[P(0,3,.3),P(1,2,.22),P(2,3,.14)],
      facts:{Cells:'120 tetra + 24 icosa', Vertices:96, Edges:432, Faces:480},
      blurb:'A chiral polytope whose vertices form part of the 600-cell.',
      article:`<p>The <b>snub 24-cell</b> is a chiral (handed) uniform polychoron whose 96 vertices are a
   subset of the 600-cell's. Its cells are 24 icosahedra and 120 tetrahedra. It was discovered by
   Thorold Gosset and is sometimes called the semi-snub polyoctahedron.</p>
   <p>Like the snub cube and snub dodecahedron in 3D, it comes in left- and right-handed forms that are
   mirror images and cannot be rotated into one another.</p>`,
      refs:['gosset', 'coxeter'] },

    { id:'cantellated-tesseract', name:'Cantellated tesseract', tag:'Uniform 4-polytope', schlafli:'t₀,₂{4,3,3}', family:'unif', dim:4,
      gen:tesseract, rot:[P(0,3,.34),P(1,2,.26),P(2,3,.18)],
      facts:{Cells:'8 cuboct + 16 octa + 32 prisms', Vertices:96, Edges:288, Faces:248},
      blurb:'The tesseract with vertices and edges expanded outward.',
      article:`<p>The <b>cantellated tesseract</b> bevels both the vertices and edges of the tesseract
   simultaneously. Its cells include cuboctahedra, octahedra and triangular prisms, and it preserves
   the full hyperoctahedral symmetry of the parent.</p>
   <p>Cantellation is the operation that turns a cube into a rhombicuboctahedron; here it produces
   a correspondingly richer four-dimensional figure.</p>`,
      refs:['coxeter', 'elte'] },

    { id:'runcinated-tesseract', name:'Runcinated tesseract', tag:'Uniform 4-polytope', schlafli:'t₀,₃{4,3,3}', family:'unif', dim:4,
      gen:tesseract, rot:[P(0,3,.3),P(1,2,.24),P(2,3,.16)],
      facts:{Cells:'16 tetra + 32 prisms + 8 cubes', Vertices:64, Edges:192, Faces:208},
      blurb:`A 4D expansion that pulls the tesseract's cells apart.`,
      article:`<p>The <b>runcinated tesseract</b> applies runcination to the tesseract — a third-order
   truncation that separates its cells and fills the gaps with tetrahedra and prisms. It has sixty-four
   vertices and is one of the most symmetrically expanded forms of the 4-cube.</p>`,
      refs:['coxeter', 'elte'] },
    // ===== ROW 3 — The 5-cube (penteract) family =================================
    { id:'penteract', name:'Penteract', tag:'Regular 5-polytope', schlafli:'{4,3,3,3}', family:'five', dim:5,
      gen:()=>nCube(5), rot:[P(0,4,.4),P(1,3,.28),P(2,4,.18)],
      facts:{Dimension:'5D', Vertices:32, Edges:80, '4-faces':'10 tesseracts'},
      blurb:'The 5-dimensional hypercube — ten tesseracts on its boundary.',
      article:`<p>The <b>penteract</b> (5-cube) is the five-dimensional hypercube. Its 32 vertices are every
   combination of ±1 in five coordinates, joined by 80 edges. Its boundary consists of ten tesseracts,
   just as a tesseract is bounded by eight cubes and a cube by six squares.</p>
   <p>The doubling pattern is exact: an n-cube has 2ⁿ vertices, n·2ⁿ⁻¹ edges, and 2n cells of dimension
   n−1. What you see is a fivefold-nested perspective shadow flattened twice over.</p>`,
      refs:['coxeter', 'hinton'] },

    { id:'5-orthoplex', name:'5-orthoplex', tag:'Regular 5-polytope', schlafli:'{3,3,3,4}', family:'five', dim:5,
      gen:()=>nOrthoplex(5), rot:[P(0,4,.42),P(1,3,.3)],
      facts:{Dimension:'5D', Vertices:10, Edges:40, '4-faces':'32 5-cells'},
      blurb:'The 5D cross-polytope — dual of the penteract.',
      article:`<p>The <b>5-orthoplex</b> (pentacross) is the five-dimensional cross-polytope and the dual of
   the penteract. Its ten vertices sit at ±1 along each axis; every non-opposite pair is joined, giving
   40 edges and 32 four-dimensional 5-cell facets.</p>
   <p>The orthoplex family (square, octahedron, 16-cell, …) always has 2n vertices and 2ⁿ simplex
   facets — the most "spiky" of the regular polytopes.</p>`,
      refs:['coxeter', 'schlafli'] },

    { id:'5-simplex', name:'5-simplex', tag:'Regular 5-polytope', schlafli:'{3,3,3,3}', family:'five', dim:5,
      gen:()=>nSimplex(5), rot:[P(0,4,.4),P(1,3,.28)],
      facts:{Dimension:'5D', Vertices:6, Edges:15, '4-faces':'6 5-cells'},
      blurb:'Six mutually equidistant points — the simplest 5-polytope.',
      article:`<p>The <b>5-simplex</b> (hexateron) is the simplest 5-polytope: six vertices, every pair
   joined, bounding six 5-cell facets. It is self-dual and the five-dimensional member of the simplex
   family that runs triangle → tetrahedron → 5-cell → hexateron.</p>
   <p>A k-simplex always has k+1 vertices and the maximum symmetry of any polytope in its dimension —
   the full symmetric group on its vertices.</p>`,
      refs:['coxeter', 'schlafli'] },

    { id:'rectified-penteract', name:'Rectified penteract', tag:'Uniform 5-polytope', schlafli:'t₁{4,3,3,3}', family:'five', dim:5,
      gen:()=>nCube(5), rot:[P(0,4,.36),P(2,3,.24)],
      facts:{Dimension:'5D', Vertices:80, Edges:'480', Cells:'mixed'},
      blurb:'The penteract cut to its edge-midpoints.',
      article:`<p>The <b>rectified penteract</b> truncates the 5-cube's 32 vertices to the midpoints of its
   edges, producing 80 new vertices — one per original edge. Its facets are rectified tesseracts and
   5-cells.</p>
   <p>Rectification in five dimensions follows the same Wythoffian rule as in lower ones: mark the second
   node of the Coxeter diagram and read off the resulting uniform polytope.</p>`,
      refs:['coxeter', 'elte'] },

    { id:'truncated-penteract', name:'Truncated penteract', tag:'Uniform 5-polytope', schlafli:'t₀,₁{4,3,3,3}', family:'five', dim:5,
      gen:()=>nCube(5), rot:[P(0,4,.32),P(1,4,.22)],
      facts:{Dimension:'5D', Vertices:160, Edges:'400', Cells:'mixed'},
      blurb:'The 5-cube with shaved vertices.',
      article:`<p>The <b>truncated penteract</b> shaves each of the 5-cube's 32 vertices, replacing each
   with a small 5-cell facet while the tesseract cells become truncated tesseracts. It has 160 vertices.</p>
   <p>It is the five-dimensional analogue of the truncated cube and truncated tesseract — the same
   operation applied one dimension higher.</p>`,
      refs:['coxeter', 'elte'] },

    { id:'5-demicube', name:'5-demicube', tag:'Uniform 5-polytope', schlafli:'h{4,3,3,3}', family:'five', dim:5,
      gen:()=>nDemicube(5), rot:[P(0,4,.4),P(1,3,.26)],
      facts:{Dimension:'5D', Vertices:16, '4-faces':'16 5-cells + 10 16-cells', Symmetry:'D₅'},
      blurb:'The alternated penteract — half its vertices removed.',
      article:`<p>The <b>5-demicube</b> (demipenteract) is the penteract with alternate vertices deleted —
   keeping the sixteen whose coordinates have an even number of minus signs. Its facets are sixteen
   5-cells and ten 16-cells, and its symmetry group is D₅.</p>
   <p>Demicubes are the seed of the important Dₙ symmetry family; in five dimensions the demipenteract
   is the first to acquire the extra diagonal symmetry that makes that family special.</p>`,
      refs:['coxeter', 'elte'] },

    { id:'cantellated-penteract', name:'Cantellated penteract', tag:'Uniform 5-polytope', schlafli:'t₀,₂{4,3,3,3}', family:'five', dim:5,
      gen:()=>nCube(5), rot:[P(0,4,.3),P(2,4,.2),P(1,3,.16)],
      facts:{Dimension:'5D', Vertices:'480', Operation:'cantellation', Symmetry:'B₅'},
      blurb:'A second-order bevel of the 5-cube.',
      article:`<p>The <b>cantellated penteract</b> bevels both the vertices and edges of the 5-cube
   simultaneously (Coxeter's t₀,₂). The result mixes rhombicuboctahedral and prismatic cells across its
   boundary, with several hundred vertices.</p>
   <p>It belongs to the B₅ family of uniform 5-polytopes — the same hyperoctahedral symmetry that
   governs the penteract and 5-orthoplex.</p>`,
      refs:['coxeter', 'elte'] },

    { id:'omnitruncated-5-simplex', name:'Omnitruncated 5-simplex', tag:'Uniform 5-polytope', schlafli:'t₀,₁,₂,₃,₄{3,3,3,3}', family:'five', dim:5,
      gen:()=>nSimplex(5), rot:[P(0,4,.3),P(1,3,.22),P(2,4,.14)],
      facts:{Dimension:'5D', Vertices:720, Symmetry:'A₅', Note:'all mirrors active'},
      blurb:'Every mirror of the 5-simplex turned on at once.',
      article:`<p>The <b>omnitruncated 5-simplex</b> activates every node of the A₅ Coxeter diagram at
   once — the maximal truncation. It has exactly 720 vertices, one for each element of the symmetric
   group S₆, because an omnitruncated simplex is a <i>permutohedron</i>.</p>
   <p>Its vertices are the permutations of (1, 2, 3, 4, 5, 6), and it tiles 5-space — a beautiful link
   between combinatorics and geometry.</p>`,
      refs:['coxeter', 'elte'] },

    { id:'runcinated-penteract', name:'Runcinated penteract', tag:'Uniform 5-polytope', schlafli:'t₀,₃{4,3,3,3}', family:'five', dim:5,
      gen:()=>nCube(5), rot:[P(0,4,.32),P(1,3,.24),P(2,4,.16)],
      facts:{Dimension:'5D', Vertices:320, Operation:'runcination', Symmetry:'B₅'},
      blurb:'The 5-cube with its cells separated and prisms inserted.',
      article:`<p>The <b>runcinated penteract</b> expands the 5-cube along its 3-faces, pulling the tesseract
   cells apart and bridging the gaps with prisms and simplices. It is the five-dimensional analogue of
   the runcinated tesseract.</p>`,
      refs:['coxeter', 'elte'] },

    { id:'stericated-penteract', name:'Stericated penteract', tag:'Uniform 5-polytope', schlafli:'t₀,₄{4,3,3,3}', family:'five', dim:5,
      gen:()=>nCube(5), rot:[P(0,4,.3),P(1,3,.22),P(2,4,.14)],
      facts:{Dimension:'5D', Vertices:80, Operation:'sterication', Symmetry:'B₅'},
      blurb:'The 5-cube expanded along its 4-faces — its tesseract facets.',
      article:`<p>The <b>stericated penteract</b> is the 5-cube expanded along its 4-faces, the highest-order
   truncation possible in five dimensions. It has eighty vertices and mixes tesseracts and 5-cell
   facets across its boundary.</p>`,
      refs:['coxeter', 'elte'] },
    // ===== ROW 4 — Higher hypercubes, simplices, and the Gosset figure ===========
    { id:'6-cube', name:'6-cube', tag:'Regular 6-polytope', schlafli:'{4,3,3,3,3}', family:'ncube', dim:6,
      gen:()=>nCube(6), rot:[P(0,5,.36),P(1,4,.26),P(2,3,.18)],
      facts:{Dimension:'6D', Vertices:64, Edges:192, '5-faces':'12 penteracts'},
      blurb:'The hexeract — 64 vertices in six dimensions.',
      article:`<p>The <b>6-cube</b> (hexeract) is the six-dimensional hypercube, with 64 vertices, 192 edges,
   and twelve penteract facets. The hypercube family grows explosively: each new dimension doubles the
   vertex count.</p>
   <p>The flattened shadow you see has passed through three perspective divisions to reach 3D, so depth
   along three separate hidden axes is compressed into the same picture.</p>`,
      refs:['coxeter', 'hinton'] },

    { id:'7-cube', name:'7-cube', tag:'Regular 7-polytope', schlafli:'{4,3⁵}', family:'ncube', dim:7,
      gen:()=>nCube(7), rot:[P(0,6,.32),P(1,5,.24),P(2,4,.16)],
      facts:{Dimension:'7D', Vertices:128, Edges:448, '6-faces':'14 hexeracts'},
      blurb:'The hepteract — 128 vertices in seven dimensions.',
      article:`<p>The <b>7-cube</b> (hepteract) has 128 vertices and 448 edges. By now the wireframe is dense
   enough that the projection looks almost like a fog of points, yet the doubling structure is exactly
   the same as a humble square.</p>
   <p>Hypercube graphs Qₙ like this one are central in computer science as models of parallel networks,
   error-correcting codes, and Boolean logic.</p>`,
      refs:['coxeter'] },

    { id:'8-cube', name:'8-cube', tag:'Regular 8-polytope', schlafli:'{4,3⁶}', family:'ncube', dim:8,
      gen:()=>nCube(8), rot:[P(0,7,.3),P(1,6,.22),P(2,5,.15),P(3,4,.1)],
      facts:{Dimension:'8D', Vertices:256, Edges:1024, '7-faces':'16 hepteracts'},
      blurb:'The octeract — 256 vertices in eight dimensions.',
      article:`<p>The <b>8-cube</b> (octeract) carries 256 vertices and 1024 edges. Its vertex set is exactly
   the 256 bytes — every 8-bit string — which is why the 8-cube graph underlies the Hamming(8) code and
   much of digital communication theory.</p>
   <p>Eight dimensions is special: it is where the E₈ lattice and the octonions live, both of which you
   can visit elsewhere in this hall.</p>`,
      refs:['coxeter', 'conway'] },

    { id:'6-simplex', name:'6-simplex', tag:'Regular 6-polytope', schlafli:'{3⁵}', family:'ncube', dim:6,
      gen:()=>nSimplex(6), rot:[P(0,5,.36),P(1,4,.26)],
      facts:{Dimension:'6D', Vertices:7, Edges:21, Symmetry:'A₆'},
      blurb:'Seven mutually equidistant points in six dimensions.',
      article:`<p>The <b>6-simplex</b> (heptapeton) is seven points in six dimensions, every pair the same
   distance apart. It is self-dual with symmetry group S₇. The simplex is always the "tightest" polytope
   — the minimal convex hull that fills its dimension.</p>
   <p>Simplices are the building blocks of triangulation and of the simplex method in optimization; the
   higher-dimensional ones underpin finite-element meshes and topology.</p>`,
      refs:['coxeter', 'schlafli'] },

    { id:'7-simplex', name:'7-simplex', tag:'Regular 7-polytope', schlafli:'{3⁶}', family:'ncube', dim:7,
      gen:()=>nSimplex(7), rot:[P(0,6,.34),P(1,5,.24)],
      facts:{Dimension:'7D', Vertices:8, Edges:28, Symmetry:'A₇'},
      blurb:'Eight mutually equidistant points in seven dimensions.',
      article:`<p>The <b>7-simplex</b> (octaexon) has eight vertices, 28 edges, and the complete symmetry
   group S₈. Every vertex is connected to every other, so its edge graph is the complete graph K₈.</p>
   <p>The contrast with the 7-cube is instructive: both live in nearby dimensions, but the simplex is
   maximally connected and minimal in vertex count, while the cube is sparse and exponentially large.</p>`,
      refs:['coxeter', 'schlafli'] },

    { id:'6-orthoplex', name:'6-orthoplex', tag:'Regular 6-polytope', schlafli:'{3,3,3,3,4}', family:'ncube', dim:6,
      gen:()=>nOrthoplex(6), rot:[P(0,5,.36),P(1,4,.26)],
      facts:{Dimension:'6D', Vertices:12, Edges:60, '5-faces':'64 simplices'},
      blurb:'The 6D cross-polytope — dual of the hexeract.',
      article:`<p>The <b>6-orthoplex</b> (hexacross) is the six-dimensional cross-polytope: twelve vertices
   at ±1 along each axis, 60 edges, and 64 simplex facets. It is the dual of the 6-cube.</p>
   <p>Orthoplexes always realize the ℓ¹ unit ball, while their dual cubes realize the ℓ∞ ball — the two
   extremes that sandwich the round Euclidean sphere in every dimension.</p>`,
      refs:['coxeter', 'conway'] },

    { id:'7-orthoplex', name:'7-orthoplex', tag:'Regular 7-polytope', schlafli:'{3⁴,4}', family:'ncube', dim:7,
      gen:()=>nOrthoplex(7), rot:[P(0,6,.34),P(1,5,.24)],
      facts:{Dimension:'7D', Vertices:14, Edges:84, '6-faces':'128 simplices'},
      blurb:'The 7D cross-polytope — dual of the hepteract.',
      article:`<p>The <b>7-orthoplex</b> (heptacross) has fourteen vertices and 128 six-dimensional simplex
   facets. As the dual of the 7-cube, its facet count (2⁷ = 128) equals the 7-cube's vertex count, a
   duality that holds in every dimension.</p>
   <p>The dense criss-cross of edges you see is every pair of non-opposite vertices — the orthoplex is
   nearly the complete graph, missing only the antipodal links.</p>`,
      refs:['coxeter', 'conway'] },

    { id:'e8-polytope-421', name:'E₈ polytope (4₂₁)', tag:'Gosset polytope', schlafli:'4₂₁', family:'ncube', dim:8,
      gen:e8Polytope, rot:[P(0,7,.26),P(1,6,.2),P(2,5,.14),P(3,4,.1)],
      facts:{Dimension:'8D', Vertices:240, Edges:6720, Symmetry:'E₈ (order 696,729,600)'},
      blurb:'The 240 roots of E₈ — the most symmetric polytope in 8D.',
      article:`<p>The <b>4₂₁ polytope</b>, discovered by Thorold Gosset, has 240 vertices — exactly the
   roots of the exceptional Lie algebra E₈. Each vertex touches 56 others, and its symmetry group has
   696,729,600 elements, the largest of any 8-dimensional polytope.</p>
   <p>Its famous 2D shadow — a nested set of concentric 30-gons — is one of the most reproduced images
   in mathematics. E₈ appears in string theory, the densest 8D sphere packing, and (conjecturally) in
   the physics of certain magnetic materials.</p>`,
      refs:['gosset', 'coxeter', 'conway'] },

    { id:'9-cube', name:'9-cube', tag:'Regular 9-polytope', schlafli:'{4,3⁷}', family:'ncube', dim:9,
      gen:()=>nCube(9), rot:[P(0,8,.28),P(1,7,.2),P(2,6,.14),P(3,5,.1)],
      facts:{Dimension:'9D', Vertices:512, Edges:2304, '8-faces':'18 8-cubes'},
      blurb:'The enneract — 512 vertices in nine dimensions.',
      article:`<p>The <b>9-cube</b> (enneract) has 512 vertices and 2,304 edges. Each new dimension of the
   hypercube family doubles the vertex count, so the 9-cube is already a dense wireframe of points and
   edges.</p>`,
      refs:['coxeter'] },

    { id:'10-orthoplex', name:'10-orthoplex', tag:'Regular 10-polytope', schlafli:'{3⁸,4}', family:'ncube', dim:10,
      gen:()=>nOrthoplex(10), rot:[P(0,9,.3),P(1,8,.22)],
      facts:{Dimension:'10D', Vertices:20, Edges:180, '9-faces':'512 simplices'},
      blurb:'The 10D cross-polytope — twenty vertices joined by 180 edges.',
      article:`<p>The <b>10-orthoplex</b> (decacross) is the ten-dimensional cross-polytope. Its twenty vertices
   sit at ±1 along each axis, and every non-opposite pair is joined, giving 180 edges and 512 simplex
   facets.</p>`,
      refs:['coxeter', 'conway'] },
    // ===== ROW 5 — Curved manifolds and topological surfaces =====================
    { id:'glome-3-sphere', name:'Glome (3-sphere)', tag:'Curved 4-manifold', schlafli:'S³', family:'curve', dim:4,
      gen:()=>glome(8,40), rot:[P(0,3,.4),P(1,3,.24)],
      facts:{Dimension:'surface in 4D', Curvature:'positive, constant', Symmetry:'O(4)'},
      blurb:'The set of all points equidistant from a centre in 4-space.',
      article:`<p>A <b>glome</b>, or 3-sphere (S³), is the set of points at fixed distance from a centre in
   four-dimensional space — the direct analogue of an ordinary sphere. Its surface is three-dimensional:
   a creature living on it could move in three independent directions and never find an edge.</p>
   <p>The 3-sphere is the simplest closed 3-manifold and was central to the Poincaré conjecture, proved
   by Grigori Perelman in 2003. Here it is drawn as a net of great circles.</p>`,
      refs:['weeks', 'banchoff'] },

    { id:'clifford-torus', name:'Clifford torus', tag:'Flat surface in S³', schlafli:'T²⊂S³', family:'curve', dim:4,
      gen:()=>cliffordTorus(18,18), rot:[P(0,2,.4),P(1,3,.4)],
      facts:{Dimension:'2D surface in 4D', Curvature:'zero (intrinsically flat)', Lives_on:'the 3-sphere'},
      blurb:'A torus that is perfectly flat — only possible in 4D.',
      article:`<p>The <b>Clifford torus</b> is a torus that is intrinsically <i>flat</i>: it has zero
   Gaussian curvature everywhere, with no stretching anywhere on its surface. This is impossible for any
   doughnut in ordinary 3-space, but in four dimensions it sits comfortably inside the 3-sphere as the
   product of two equal circles.</p>
   <p>It divides S³ into two congruent solid tori and is the model for the Hopf fibration. Whether it is
   the area-minimizing torus in S³ — the Lawson conjecture — was proven by Simon Brendle in 2013.</p>`,
      refs:['clifford', 'lawson', 'banchoff'] },

    { id:'klein-bottle', name:'Klein bottle', tag:'Non-orientable surface', schlafli:'K²', family:'curve', dim:4,
      gen:()=>kleinBottle(26,14), rot:[P(0,3,.34),P(2,3,.24)],
      facts:{Dimension:'2D surface', Sides:'one (non-orientable)', Embeds_in:'4D without self-intersection'},
      blurb:'A one-sided surface that only embeds cleanly in 4D.',
      article:`<p>The <b>Klein bottle</b> is a closed surface with no inside or outside — a one-sided,
   non-orientable surface. Any model in 3-space must pass through itself, but in four dimensions it
   embeds perfectly cleanly, the self-intersection lifting apart along the fourth axis.</p>
   <p>It can be built by gluing two Möbius strips along their edges, and it is a foundational example in
   topology of how extra dimensions resolve apparent paradoxes of three-dimensional intuition.</p>`,
      refs:['klein', 'stillwell', 'weeks'] },

    { id:'boys-surface', name:"Boy's surface", tag:'Immersed RP²', schlafli:'RP²', family:'curve', dim:4,
      gen:()=>boysSurface(22,22), rot:[P(0,3,.3),P(1,3,.22)],
      facts:{Dimension:'2D surface', Models:'the real projective plane', Discovered:'Werner Boy, 1901'},
      blurb:'An immersion of the projective plane with no edges or creases.',
      article:`<p><b>Boy's surface</b> is a smooth immersion of the real projective plane RP² in
   three-dimensional space, found by Werner Boy in 1901 at David Hilbert's suggestion. Hilbert had
   expected RP² could not be immersed without singular points; Boy proved otherwise.</p>
   <p>It has threefold symmetry and a single triple point. Robert Bryant and Rob Kusner later gave an
   exact analytic parametrization. RP² embeds without self-intersection only in four dimensions or
   higher.</p>`,
      refs:['boy', 'stillwell'] },

    { id:'duocylinder', name:'Duocylinder', tag:'Curved 4-solid', schlafli:'D²×D²', family:'curve', dim:4,
      gen:()=>duocylinder(20,20), rot:[P(0,1,.4),P(2,3,.4)],
      facts:{Dimension:'4D solid', Surface:'two perpendicular tori', Bounded_by:'a flat ridge'},
      blurb:'The product of two disks — a 4D analogue of the cylinder.',
      article:`<p>The <b>duocylinder</b> is the Cartesian product of two flat disks, each in its own pair of
   dimensions. Its boundary is made of two curved cells, joined along a shared "ridge" that is itself a
   Clifford torus — a flat 2D surface where the two tubes meet at a right angle.</p>
   <p>A ball rolling in a duocylinder could spin smoothly in two completely independent circular
   directions at once, a freedom of motion that has no parallel in three dimensions.</p>`,
      refs:['manning', 'banchoff'] },

    { id:'hopf-fibration', name:'Hopf fibration', tag:'Fibered 3-sphere', schlafli:'S³→S²', family:'curve', dim:4,
      gen:()=>hopfFibration(18,36), rot:[P(0,2,.36),P(1,3,.28)],
      facts:{Maps:'S³ onto S²', Fibers:'linked great circles', Discovered:'Heinz Hopf, 1931'},
      blurb:'A way to fill the 3-sphere with linked circles.',
      article:`<p>The <b>Hopf fibration</b>, discovered by Heinz Hopf in 1931, decomposes the 3-sphere into
   a continuous family of circles, one for each point of an ordinary 2-sphere. Any two of these circles
   are linked exactly once — a configuration that cannot be undone.</p>
   <p>It was the first example of a topologically nontrivial fiber bundle and revolutionized topology.
   The Hopf map appears throughout physics, from the quantum states of a single qubit to magnetic
   monopoles and the structure of liquid crystals.</p>`,
      refs:['hopf', 'banchoff'] },

    { id:'villarceau-circles', name:'Villarceau circles', tag:'Circles on a torus', schlafli:'⊂ T²', family:'curve', dim:4,
      gen:()=>villarceau(14,40), rot:[P(0,3,.32),P(1,2,.24)],
      facts:{Lie_on:'an ordinary torus', Count:'a third family of circles', Found:'Yvon Villarceau, 1848'},
      blurb:'The hidden slanted circles inside every torus.',
      article:`<p>Beyond the obvious circles running around a torus the long way and the short way, there are
   two more families of perfect circles hidden inside it — the <b>Villarceau circles</b>, found by
   French astronomer Yvon Villarceau in 1848. Each is obtained by slicing the torus with a cleverly
   tilted plane that grazes it on both sides.</p>
   <p>Every point of a torus lies on exactly four circles: the two obvious ones and two Villarceau
   circles. They are a favorite motif in architecture and in the geometry of the Hopf fibration.</p>`,
      refs:['villarceau', 'banchoff'] },

    { id:'rp3-projective-3-space', name:'RP³ (projective 3-space)', tag:'Closed 3-manifold', schlafli:'RP³', family:'curve', dim:4,
      gen:()=>rp3(7,34), rot:[P(0,3,.34),P(1,2,.22)],
      facts:{Dimension:'3-manifold', Same_as:'SO(3), the rotation group', Model:'antipodal 3-sphere'},
      blurb:'The space of all 3D rotations — a sphere with antipodes glued.',
      article:`<p><b>Real projective 3-space</b> (RP³) is the 3-sphere with every pair of antipodal points
   identified. Remarkably, it is identical to SO(3), the space of all rotations of ordinary
   three-dimensional space — which is why a rotating object's orientations live on this manifold.</p>
   <p>Its nontrivial topology is the reason for the famous "plate trick" or "belt trick": a 360° rotation
   leaves a twist, while a 720° rotation can be undone. This is the geometric root of spin-½ in quantum
   mechanics.</p>`,
      refs:['weeks', 'stillwell'] },

    { id:'pseudosphere', name:'Pseudosphere', tag:'Surface of constant curvature', schlafli:'K = −1', family:'curve', dim:3,
      gen:()=>pseudosphere(22,22), rot:[P(0,3,.3),P(1,2,.22)],
      facts:{Curvature:'negative, constant', Models:'tractrix surface', Dimension:'2D surface'},
      blurb:'A surface with the same negative curvature everywhere.',
      article:`<p>The <b>pseudosphere</b> is a surface of constant negative curvature, the opposite of a
   sphere. It is formed by revolving a tractrix — the curve chased by a dog on a leash — around its axis.</p>
   <p>Locally it is a model of hyperbolic geometry, and it was one of the first surfaces whose
   geometry challenged Euclidean intuition.</p>`,
      refs:['stillwell', 'weeks'] },

    { id:'dini-surface', name:'Dini surface', tag:'Constant negative curvature', schlafli:'K = −1', family:'curve', dim:3,
      gen:()=>diniSurface(22,22), rot:[P(0,3,.28),P(1,2,.2)],
      facts:{Curvature:'negative, constant', Feature:'infinite spiral horn', Dimension:'2D surface'},
      blurb:'A twisting horn of constant negative curvature.',
      article:`<p>The <b>Dini surface</b> is another surface of constant negative curvature, shaped like an
   infinite twisting horn. Like the pseudosphere, it is built from the tractrix, but it spirals endlessly
   rather than closing into a finite shape.</p>`,
      refs:['stillwell', 'weeks'] },
    // ===== ROW 6 — Duoprisms (products of two polygons) ==========================
    { id:'3x3-duoprism', name:'{3}×{3} duoprism', tag:'Duoprism', schlafli:'{3}×{3}', family:'duo', dim:4,
      gen:()=>duoprism(3,3), rot:[P(0,2,.4),P(1,3,.4)],
      facts:{Dimension:'4D', Vertices:9, Cells:'6 triangular prisms', Symmetry:'[3,2,3]'},
      blurb:'The product of two triangles in 4-space.',
      article:`<p>The <b>{3}×{3} duoprism</b> (triangular duoprism) is the Cartesian product of two
   triangles, each spinning in its own pair of dimensions. It has nine vertices and six triangular-prism
   cells, three from each triangle.</p>
   <p>Duoprisms are the simplest genuinely four-dimensional figures that are neither hypercubes nor
   simplices — products of two lower polytopes that need all four axes to exist.</p>`,
      refs:['coxeter', 'manning'] },

    { id:'4x3-duoprism', name:'{4}×{3} duoprism', tag:'Duoprism', schlafli:'{4}×{3}', family:'duo', dim:4,
      gen:()=>duoprism(4,3), rot:[P(0,2,.4),P(1,3,.36)],
      facts:{Dimension:'4D', Vertices:12, Cells:'4 tri-prisms + 3 cubes', Symmetry:'[4,2,3]'},
      blurb:'A square times a triangle.',
      article:`<p>The <b>{4}×{3} duoprism</b> multiplies a square by a triangle. The square contributes three
   cubic cells, the triangle contributes four triangular prisms, for twelve vertices arranged on a flat
   torus in 4-space.</p>
   <p>Each duoprism's vertices lie on a Clifford torus — the same flat surface in S³ that appears
   throughout this row of the gallery — making them the polygonal skeletons of that torus.</p>`,
      refs:['coxeter', 'manning'] },

    { id:'5x3-duoprism', name:'{5}×{3} duoprism', tag:'Duoprism', schlafli:'{5}×{3}', family:'duo', dim:4,
      gen:()=>duoprism(5,3), rot:[P(0,2,.38),P(1,3,.34)],
      facts:{Dimension:'4D', Vertices:15, Cells:'5 tri-prisms + 3 pentagonal prisms', Symmetry:'[5,2,3]'},
      blurb:'A pentagon times a triangle.',
      article:`<p>The <b>{5}×{3} duoprism</b> is the product of a pentagon and a triangle: five triangular
   prisms and three pentagonal prisms enclose its fifteen vertices. Mixing a 5-fold with a 3-fold
   symmetry gives it a pleasingly irregular look as it rotates in two planes at once.</p>
   <p>The general {p}×{q} duoprism has p·q vertices and p+q prism cells, a clean formula that scales to
   any pair of polygons.</p>`,
      refs:['coxeter', 'manning'] },

    { id:'4x4-duoprism', name:'{4}×{4} duoprism', tag:'Duoprism', schlafli:'{4}×{4}', family:'duo', dim:4,
      gen:()=>duoprism(4,4), rot:[P(0,2,.4),P(1,3,.4)],
      facts:{Dimension:'4D', Vertices:16, Cells:'8 cubes', Same_as:'the tesseract'},
      blurb:'A square times a square — secretly the tesseract.',
      article:`<p>The <b>{4}×{4} duoprism</b> is the product of two squares — and that product is exactly the
   <i>tesseract</i>. Its sixteen vertices and eight cubic cells are the 4-cube seen through the lens of
   its two independent square cross-sections.</p>
   <p>This identity — that the hypercube is a duoprism of two squares — is the four-dimensional echo of
   the fact that a cube is a square prism, a "{4}×{ }" product.</p>`,
      refs:['coxeter', 'manning'] },

    { id:'5x5-duoprism', name:'{5}×{5} duoprism', tag:'Duoprism', schlafli:'{5}×{5}', family:'duo', dim:4,
      gen:()=>duoprism(5,5), rot:[P(0,2,.38),P(1,3,.38)],
      facts:{Dimension:'4D', Vertices:25, Cells:'10 pentagonal prisms', Symmetry:'[5,2,5]'},
      blurb:'Two pentagons multiplied together.',
      article:`<p>The <b>{5}×{5} duoprism</b> multiplies two pentagons, giving 25 vertices and ten
   pentagonal-prism cells in a doubly five-fold symmetric figure. Because both factors share the same
   symmetry, it has an extra "duoprismatic" symmetry that swaps the two pentagons.</p>
   <p>Equal-factor duoprisms like this are the most symmetric of their family and tile naturally onto the
   Clifford torus in equal squares.</p>`,
      refs:['coxeter', 'manning'] },

    { id:'6x6-duoprism', name:'{6}×{6} duoprism', tag:'Duoprism', schlafli:'{6}×{6}', family:'duo', dim:4,
      gen:()=>duoprism(6,6), rot:[P(0,2,.36),P(1,3,.36)],
      facts:{Dimension:'4D', Vertices:36, Cells:'12 hexagonal prisms', Symmetry:'[6,2,6]'},
      blurb:'Two hexagons multiplied together.',
      article:`<p>The <b>{6}×{6} duoprism</b> pairs two hexagons into a 36-vertex figure bounded by twelve
   hexagonal prisms. As the polygon order rises, the duoprism's projected shadow approaches the smooth
   surface of a <i>duocylinder</i> — the product of two disks.</p>
   <p>This limiting relationship makes duoprisms the natural polygonal approximations to the curved 4D
   solids elsewhere in the hall.</p>`,
      refs:['coxeter', 'manning'] },

    { id:'8x8-duoprism', name:'{8}×{8} duoprism', tag:'Duoprism', schlafli:'{8}×{8}', family:'duo', dim:4,
      gen:()=>duoprism(8,8), rot:[P(0,2,.34),P(1,3,.34)],
      facts:{Dimension:'4D', Vertices:64, Cells:'16 octagonal prisms', Symmetry:'[8,2,8]'},
      blurb:'Two octagons multiplied together.',
      article:`<p>The <b>{8}×{8} duoprism</b> has 64 vertices arranged from two octagons — coincidentally the
   same vertex count as the 6-cube, though arranged on a torus rather than a cube. Sixteen octagonal
   prisms form its boundary.</p>
   <p>Watch how its rotation, with two independent angular speeds, produces a hypnotic interference
   pattern: this is what a genuine double rotation looks like flattened to a screen.</p>`,
      refs:['coxeter', 'manning'] },

    { id:'10x10-duoprism', name:'{10}×{10} duoprism', tag:'Duoprism', schlafli:'{10}×{10}', family:'duo', dim:4,
      gen:()=>duoprism(10,10), rot:[P(0,2,.32),P(1,3,.32)],
      facts:{Dimension:'4D', Vertices:100, Cells:'20 decagonal prisms', Approaches:'the duocylinder'},
      blurb:'Two decagons — nearly a smooth duocylinder.',
      article:`<p>The <b>{10}×{10} duoprism</b> brings two ten-sided polygons together into a 100-vertex
   figure. With this many sides, its silhouette is almost indistinguishable from the smooth duocylinder,
   the product of two perfect disks.</p>
   <p>The progression {3}×{3} → {4}×{4} → … → {∞}×{∞} is the four-dimensional analogue of how regular
   polygons converge to a circle — here, two circles at once.</p>`,
      refs:['coxeter', 'manning'] },

    { id:'3x4-duoprism', name:'{3}×{4} duoprism', tag:'Duoprism', schlafli:'{3}×{4}', family:'duo', dim:4,
      gen:()=>duoprism(3,4), rot:[P(0,2,.4),P(1,3,.36)],
      facts:{Dimension:'4D', Vertices:12, Cells:'3 cubes + 4 tri-prisms', Symmetry:'[3,2,4]'},
      blurb:'A triangle times a square.',
      article:`<p>The <b>{3}×{4} duoprism</b> multiplies a triangle by a square. Its twelve vertices sit on a
   flat Clifford torus in 4-space, and its boundary is three cubes and four triangular prisms.</p>`,
      refs:['coxeter', 'manning'] },

    { id:'7x7-duoprism', name:'{7}×{7} duoprism', tag:'Duoprism', schlafli:'{7}×{7}', family:'duo', dim:4,
      gen:()=>duoprism(7,7), rot:[P(0,2,.34),P(1,3,.34)],
      facts:{Dimension:'4D', Vertices:49, Cells:'14 heptagonal prisms', Symmetry:'[7,2,7]'},
      blurb:'Two heptagons multiplied together.',
      article:`<p>The <b>{7}×{7} duoprism</b> pairs two heptagons into a 49-vertex figure bounded by fourteen
   heptagonal prisms. Its seven-fold symmetry gives the rotation a steady, seven-beat rhythm.</p>`,
      refs:['coxeter', 'manning'] },
    // ===== ROW 7 — Rotations and the topology of motion in 4D ====================
    { id:'left-isoclinic-rotation', name:'Left isoclinic rotation', tag:'Double rotation', schlafli:'SO(4) left', family:'rot', dim:4,
      gen:rotTesseract, rot:[P(0,1,.4,0),P(2,3,.4,0)],
      facts:{Type:'isoclinic (equal-angle)', Planes:'two, rotating equally', Handedness:'left'},
      blurb:'A 4D rotation that turns two planes at the same rate.',
      article:`<p>In four dimensions a rotation can spin in <i>two</i> independent planes at once. When both
   planes turn through the same angle, the motion is called <b>isoclinic</b>. A left-isoclinic rotation
   is one of two handed varieties, corresponding to multiplication by a unit quaternion on the left.</p>
   <p>Every point of the tesseract here moves along a great circle of the same radius, so the whole
   figure appears to tumble rigidly — a motion with no fixed axis at all, unlike any 3D rotation.</p>`,
      refs:['manning', 'coxeter'] },

    { id:'right-isoclinic-rotation', name:'Right isoclinic rotation', tag:'Double rotation', schlafli:'SO(4) right', family:'rot', dim:4,
      gen:rotTesseract, rot:[P(0,1,.4,0),P(2,3,-.4,0)],
      facts:{Type:'isoclinic (equal-angle)', Planes:'two, opposite sense', Handedness:'right'},
      blurb:'The mirror-handed partner of the left isoclinic rotation.',
      article:`<p>The <b>right isoclinic rotation</b> also turns two planes equally, but in the opposite
   relative sense — corresponding to quaternion multiplication on the right. Together, left and right
   isoclinic rotations generate all of SO(4), the group of 4D rotations.</p>
   <p>This left/right decomposition is special to four dimensions and is the geometric origin of the two
   chiralities of spinors in physics. No other rotation group splits so cleanly.</p>`,
      refs:['manning', 'coxeter'] },

    { id:'clifford-parallels', name:'Clifford parallels', tag:'Parallel great circles', schlafli:'S³', family:'rot', dim:4,
      gen:()=>hopfFibration(20,30), rot:[P(0,2,.4),P(1,3,.4)],
      facts:{Live_on:'the 3-sphere', Property:'equidistant everywhere', Named_for:'W. K. Clifford'},
      blurb:'Lines that stay the same distance apart — but are linked.',
      article:`<p><b>Clifford parallels</b> are great circles on the 3-sphere that remain exactly
   equidistant from one another everywhere — yet, unlike parallel lines in flat space, they are
   <i>linked</i> like rings of a chain. William Kingdon Clifford described them in 1873.</p>
   <p>They are precisely the fibers of the Hopf fibration, and an isoclinic rotation slides each circle
   along itself, carrying the whole family rigidly. They are the truest 4D analogue of parallel lines.</p>`,
      refs:['clifford', 'hopf'] },

    { id:'quaternion-rotation', name:'Quaternion rotation', tag:'Unit quaternions', schlafli:'S³≅SU(2)', family:'rot', dim:4,
      gen:()=>glome(8,40), rot:[P(0,3,.4),P(1,2,.4)],
      facts:{Unit_quaternions:'form a 3-sphere', Double_cover:'of SO(3)', Used_in:'graphics, robotics'},
      blurb:'How 4D unit quaternions encode every 3D rotation.',
      article:`<p>The unit <b>quaternions</b> form a 3-sphere in four-dimensional space, and each one encodes
   a rotation of ordinary 3D space. This is why quaternions are the standard tool for orientation in
   computer graphics, spacecraft attitude control, and robotics — they avoid gimbal lock and interpolate
   smoothly.</p>
   <p>Two antipodal quaternions give the same 3D rotation, so the quaternion sphere is a <i>double cover</i>
   of the rotation group SO(3). That two-to-one relationship is again the source of spin-½.</p>`,
      refs:['clifford', 'stillwell'] },

    { id:'hopf-link', name:'Hopf link', tag:'Linked circles', schlafli:'2-component link', family:'rot', dim:4,
      gen:()=>hopfFibration(2,48), rot:[P(0,2,.36),P(1,3,.28)],
      facts:{Components:'2 circles', Linking_number:1, Simplest:'nontrivial link'},
      blurb:'The two simplest linked circles — a single Hopf pair.',
      article:`<p>The <b>Hopf link</b> is the simplest nontrivial link: two circles passing through one
   another exactly once, with linking number one. It is what you get by taking any two fibers of the
   Hopf fibration.</p>
   <p>You cannot pull the two circles apart without cutting one, yet neither is knotted on its own. The
   Hopf link is foundational in knot theory and appears as the Borromean-ring's simpler cousin.</p>`,
      refs:['hopf', 'stillwell'] },

    { id:'trefoil-in-4d', name:'Trefoil in 4D', tag:'Unknotting in 4D', schlafli:'3₁ knot', family:'rot', dim:4,
      gen:()=>villarceau(3,48), rot:[P(0,3,.34),P(1,2,.26)],
      facts:{Knot:'trefoil (3 crossings)', In_3D:'cannot be undone', In_4D:'every knot unties'},
      blurb:'The simplest knot — and why 4D unties all knots.',
      article:`<p>The <b>trefoil</b> is the simplest nontrivial knot, with three crossings, and in three
   dimensions it can never be untied. But in four dimensions there is room to lift one strand "over" any
   crossing through the extra axis — so <i>every</i> knotted loop of string unties freely.</p>
   <p>This is why knots are a strictly three-dimensional phenomenon. In 4D the interesting objects are
   knotted <i>surfaces</i> (knotted spheres), not knotted loops.</p>`,
      refs:['stillwell', 'banchoff'] },

    { id:'double-rotation', name:'Double rotation', tag:'Generic SO(4) motion', schlafli:'two unequal angles', family:'rot', dim:4,
      gen:rotTesseract, rot:[P(0,1,.5),P(2,3,.22)],
      facts:{Planes:'two invariant planes', Angles:'generally unequal', Fixed_points:'only the centre'},
      blurb:'The most general rotation possible in four dimensions.',
      article:`<p>A generic <b>double rotation</b> in 4D spins through two perpendicular planes at two
   <i>different</i> rates. Only the single centre point stays fixed — there is no rotation axis at all,
   unlike every rotation in three dimensions, which always fixes a whole line.</p>
   <p>When the two rates happen to be equal you recover an isoclinic rotation; when one is zero you get a
   simple rotation. The double rotation is the full, generic case, and the tesseract here shows its
   characteristic two-speed tumble.</p>`,
      refs:['manning', 'coxeter'] },

    { id:'screw-motion-in-4d', name:'Screw motion in 4D', tag:'Rotation + translation', schlafli:'isometry of E⁴', family:'rot', dim:4,
      gen:()=>duoprism(6,4), rot:[P(0,1,.4),P(2,3,.24)],
      facts:{Combines:'rotation with translation', Lives_in:'flat 4-space', Generalizes:'the 3D screw'},
      blurb:'A spinning advance — the 4D version of a screw.',
      article:`<p>A <b>screw motion</b> couples rotation with translation along the rotation's axis. In four
   dimensions, where rotations act in two independent planes, a screw motion can twist in both planes
   while advancing — a far richer family of rigid motions than three dimensions allows.</p>
   <p>Chasles' theorem says every 3D rigid motion is a screw; its 4D generalization classifies the
   isometries of flat four-space, the backbone of crystallography in higher dimensions.</p>`,
      refs:['manning', 'coxeter'] },

    { id:'4d-rotation-group', name:'4D rotation group', tag:'SO(4) demo', schlafli:'SO(4)', family:'rot', dim:4,
      gen:rotTesseract, rot:[P(0,2,.4),P(1,3,.3),P(2,3,.2)],
      facts:{Group:'SO(4)', Decomposition:'left × right isoclinic', Dimension:'6D manifold'},
      blurb:'The six-dimensional space of all 4D rotations.',
      article:`<p>The rotation group <b>SO(4)</b> is six-dimensional: every 4D rotation is a combination of a
   left-isoclinic and a right-isoclinic rotation. This double decomposition is unique to four dimensions
   and underlies the two chiralities of spinors.</p>`,
      refs:['manning', 'coxeter'] },

    { id:'isoclinic-decomposition', name:'Isoclinic decomposition', tag:'SO(4) = S³×S³', schlafli:'left ⊕ right', family:'rot', dim:4,
      gen:rotTesseract, rot:[P(0,1,.35),P(2,3,.35),P(0,3,.2)],
      facts:{Planes:'two independent pairs', Result:'generic SO(4) motion', Decomposition:'isoclinic'},
      blurb:'A 4D rotation split into two paired-plane twists.',
      article:`<p>Any 4D rotation can be decomposed into two isoclinic rotations acting on separate pairs of
   axes. The tesseract here rotates in the (x,y) and (z,w) planes at once, illustrating how SO(4) is
   built from two 3-spheres of rotations.</p>`,
      refs:['manning', 'coxeter'] },
    // ===== ROW 8 — Spacetime, exotic geometry, and great lattices ================
    { id:'minkowski-spacetime', name:'Minkowski spacetime', tag:'Spacetime geometry', schlafli:'R^{1,3}', family:'phys', dim:4,
      gen:()=>lightCone(9,30), rot:[P(0,3,.3),P(1,2,.2)],
      facts:{Signature:'(−,+,+,+)', Defines:'the light cone', Author:'Hermann Minkowski, 1908'},
      blurb:'The four-dimensional stage of special relativity.',
      article:`<p><b>Minkowski spacetime</b> is the geometric arena of special relativity: three space
   dimensions and one time dimension, fused into a single four-dimensional continuum. Its "distance"
   uses a minus sign for time, which is why the geometry is hyperbolic rather than Euclidean.</p>
   <p>The cone you see is the <b>light cone</b> — the set of all light rays through an event. It divides
   spacetime into the causal past, the causal future, and the "elsewhere" no signal can reach. Hermann
   Minkowski unveiled this picture in 1908, giving Einstein's 1905 theory its geometric form.</p>`,
      refs:['minkowski', 'banchoff'] },

    { id:'de-sitter-space', name:'de Sitter space', tag:'Curved spacetime', schlafli:'dS₄', family:'phys', dim:4,
      gen:()=>deSitter(9,30), rot:[P(0,3,.28),P(1,2,.18)],
      facts:{Curvature:'positive, constant', Models:'an expanding universe', Author:'Willem de Sitter, 1917'},
      blurb:'A spacetime of constant positive curvature — an empty, expanding cosmos.',
      article:`<p><b>de Sitter space</b> is the maximally symmetric solution of Einstein's equations with a
   positive cosmological constant and no matter — a model empty universe that expands exponentially. It
   is a four-dimensional hyperboloid embedded in five-dimensional flat space.</p>
   <p>Willem de Sitter found it in 1917 in correspondence with Einstein. It is the best simple model for
   our universe's accelerating expansion, driven by dark energy, and for the inflationary epoch just
   after the Big Bang.</p>`,
      refs:['desitter', 'minkowski'] },

    { id:'anti-de-sitter-space', name:'Anti-de Sitter space', tag:'Curved spacetime', schlafli:'AdS', family:'phys', dim:4,
      gen:()=>antiDeSitter(9,30), rot:[P(0,3,.26),P(1,2,.18)],
      facts:{Curvature:'negative, constant', Famous_for:'the AdS/CFT correspondence', Year:1998},
      blurb:'Negatively curved spacetime — home of the holographic principle.',
      article:`<p><b>Anti-de Sitter space</b> is the constant-negative-curvature counterpart of de Sitter
   space — a saddle-shaped spacetime that, surprisingly, acts like a box: light can reach its boundary
   and return in finite time.</p>
   <p>It became central to physics in 1998 when Juan Maldacena conjectured the <b>AdS/CFT
   correspondence</b>, a duality stating that gravity in an anti-de Sitter interior is exactly equivalent
   to a quantum field theory living on its lower-dimensional boundary — the sharpest known realization of
   the holographic principle.</p>`,
      refs:['maldacena', 'desitter'] },

    { id:'calabi-yau-manifold', name:'Calabi–Yau manifold', tag:'String compactification', schlafli:'CY₃', family:'phys', dim:6,
      gen:()=>calabiYau(5,8,12), rot:[P(0,3,.3),P(1,2,.22),P(2,3,.14)],
      facts:{Real_dimension:6, Curvature:'Ricci-flat, Kähler', Role:'hides 6 of string theory\'s dimensions'},
      blurb:'The curled-up extra dimensions of string theory.',
      article:`<p>A <b>Calabi–Yau manifold</b> is a compact, Ricci-flat Kähler manifold. Eugenio Calabi
   conjectured their existence in the 1950s and Shing-Tung Yau proved it in 1978, winning the Fields
   Medal in part for this result.</p>
   <p>In string theory, the six dimensions beyond our familiar four are thought to be curled up into a
   tiny Calabi–Yau threefold at every point of spacetime. Its precise shape would determine the particle
   spectrum of our universe. The figure shows a 2D slice of the Fermat quintic, the standard visualization.</p>`,
      refs:['yau', 'candelas'] },

    { id:'penrose-quasicrystal', name:'Penrose quasicrystal', tag:'Aperiodic order', schlafli:'5D→2D cut', family:'phys', dim:5,
      gen:()=>penrose(3), rot:[P(0,4,.3),P(1,3,.2),P(2,4,.14)],
      facts:{Symmetry:'5-fold (forbidden for crystals)', Origin:'projection from 5D', Nobel:'Shechtman, 2011'},
      blurb:'A pattern with five-fold symmetry that never repeats.',
      article:`<p>A <b>quasicrystal</b> has long-range order but no repeating unit cell, and can display
   five-fold symmetry — impossible for an ordinary periodic crystal. Roger Penrose's famous aperiodic
   tiling is the two-dimensional model, and it arises naturally as the shadow of a periodic lattice in
   <i>five</i> dimensions projected down to the plane.</p>
   <p>Dan Shechtman discovered real quasicrystalline alloys in 1982, a finding so heretical it was first
   ridiculed; he received the 2011 Nobel Prize in Chemistry. The 5D point cloud here casts just such a
   quasiperiodic shadow.</p>`,
      refs:['penrose', 'shechtman'] },

    { id:'e8-root-system', name:'E₈ root system', tag:'Exceptional Lie algebra', schlafli:'240 roots', family:'phys', dim:8,
      gen:e8Roots, rot:[P(0,7,.24),P(1,6,.18),P(2,5,.12),P(3,4,.08)],
      facts:{Roots:240, Dimension:8, Symmetry_order:'696,729,600'},
      blurb:'The 240 roots of the largest exceptional symmetry.',
      article:`<p>The <b>E₈ root system</b> consists of 240 vectors in eight-dimensional space — the roots
   of the largest exceptional simple Lie algebra. They split into 112 integer roots (±eᵢ±eⱼ) and 128
   half-integer roots, all of equal length, and they generate the densest lattice packing in 8D.</p>
   <p>E₈ is one of the deepest structures in mathematics, surfacing in string theory's heterotic gauge
   group, in the 2007 computer-assisted mapping of its 453,060-dimensional character table, and in the
   measured excitation spectrum of a quantum magnetic chain.</p>`,
      refs:['gosset', 'conway', 'coxeter'] },

    { id:'leech-lattice', name:'Leech lattice', tag:'24D sphere packing', schlafli:'Λ₂₄', family:'phys', dim:8,
      gen:leech, rot:[P(0,7,.22),P(1,6,.16),P(2,5,.1)],
      facts:{Dimension:24, Kissing_number:'196,560', Discovered:'John Leech, 1967'},
      blurb:'The extraordinary 24-dimensional sphere packing.',
      article:`<p>The <b>Leech lattice</b> Λ₂₄ is a remarkable arrangement of points in twenty-four
   dimensions in which each sphere touches 196,560 others — and in 2016 Maryna Viazovska's methods
   confirmed it gives the densest possible sphere packing in 24D.</p>
   <p>Its symmetry group is the Conway group Co₀, with deep ties to the Monster group and "monstrous
   moonshine." Discovered by John Leech in 1967, it has no vectors shorter than length 2 and underlies
   some of the best error-correcting codes known. The frame shown is an 8D representative shadow.</p>`,
      refs:['leech', 'conway'] },

    { id:'octonion-structure', name:'Octonion structure', tag:'Eight-dimensional algebra', schlafli:'𝕆', family:'phys', dim:8,
      gen:octonions, rot:[P(0,4,.3),P(1,5,.22),P(2,6,.14)],
      facts:{Dimension:8, Property:'non-associative', Encoded_by:'the Fano plane'},
      blurb:'The largest normed division algebra — multiplication you can map on the Fano plane.',
      article:`<p>The <b>octonions</b> 𝕆 are the largest of the four normed division algebras (after the
   reals, complex numbers, and quaternions), with eight dimensions. They are <i>non-associative</i>:
   (ab)c need not equal a(bc), the price paid for going one step beyond the quaternions.</p>
   <p>Their multiplication rule is encoded by the <b>Fano plane</b> — seven points and seven lines, drawn
   here as a triangular frame. Octonions are tied to the exceptional Lie groups, to E₈, and to
   speculative descriptions of the three generations of fundamental particles.</p>`,
      refs:['baez', 'conway'] },

    { id:'d4-lattice', name:'D4 lattice', tag:'Sphere packing', schlafli:'D₄', family:'phys', dim:4,
      gen:d4Lattice, rot:[P(0,3,.34),P(1,2,.26),P(2,3,.18)],
      facts:{Minimal_vectors:24, Kissing_number:24, Densest:'in 4D'},
      blurb:'The densest lattice sphere packing in four dimensions.',
      article:`<p>The <b>D₄ lattice</b> is the densest lattice packing of spheres in four dimensions. Its
   24 minimal vectors are exactly the vertices of the 24-cell, and each sphere touches 24 others.</p>
   <p>D₄ appears in the theory of error-correcting codes, in the algebra of quaternions, and as the root
   lattice of the Lie group Spin(8).</p>`,
      refs:['conway', 'coxeter'] },

    { id:'d5-lattice', name:'D5 lattice', tag:'Sphere packing', schlafli:'D₅', family:'phys', dim:5,
      gen:d5Lattice, rot:[P(0,4,.32),P(1,3,.24),P(2,4,.16)],
      facts:{Minimal_vectors:40, Kissing_number:40, Dimension:5},
      blurb:'The five-dimensional D lattice — cousin of the 5-demicube.',
      article:`<p>The <b>D₅ lattice</b> is the five-dimensional member of the Dₙ family. Its 40 minimal
   vectors are the permutations of (±1,±1,0,0,0), and it is the root lattice of the Lie group Spin(10),
   important in grand-unified theories of particle physics.</p>`,
      refs:['conway', 'coxeter'] },
    // ===== ROW 9 — More 5D shapes (prisms, products, and the 4-sphere) ===========
    { id:'5-cell-prism', name:'5-cell prism', tag:'5D prism', schlafli:'{3,3,3}×{ }', family:'prism', dim:5,
      gen:()=>prism5D(cell5), rot:[P(0,4,.4),P(1,3,.3),P(2,4,.2)],
      facts:{Vertices:10, Edges:25, Cells:'2 5-cells + 5 tetra-prisms', Dimension:'5D'},
      blurb:'A 5-cell stretched into the fifth dimension.',
      article:`<p>The <b>5-cell prism</b> is the Cartesian product of the 5-cell with a line segment. It has
   ten vertices — two copies of the 5-cell's five — linked by five vertical edges and two copies of the
   original 5-cell edge skeleton. Its boundary is two 5-cell facets plus five tetrahedral prisms.</p>
   <p>Prisms are the simplest way to lift a lower-dimensional polytope into a higher one: extrude it along
   a new axis. The result is never regular, but it is always uniform when the base is uniform.</p>`,
      refs:['coxeter', 'manning'] },

    { id:'16-cell-prism', name:'16-cell prism', tag:'5D prism', schlafli:'{3,3,4}×{ }', family:'prism', dim:5,
      gen:()=>prism5D(cell16), rot:[P(0,4,.42),P(1,3,.3)],
      facts:{Vertices:16, Edges:56, Cells:'2 16-cells + 16 tetra-prisms', Dimension:'5D'},
      blurb:'The 4D cross-polytope extruded into 5-space.',
      article:`<p>The <b>16-cell prism</b> extrudes the 16-cell along a fifth axis. Its sixteen vertices form
   two parallel 16-cells, joined by sixteen vertical edges. The side walls are sixteen tetrahedral prisms,
   one for each tetrahedral cell of the base.</p>
   <p>Although it has the same vertex count as the tesseract, its structure is different: it is the prism
   over the cross-polytope rather than the 4-cube.</p>`,
      refs:['coxeter', 'manning'] },

    { id:'24-cell-prism', name:'24-cell prism', tag:'5D prism', schlafli:'{3,4,3}×{ }', family:'prism', dim:5,
      gen:()=>prism5D(cell24), rot:[P(0,4,.38),P(1,3,.28),P(2,4,.18)],
      facts:{Vertices:48, Edges:216, Cells:'2 24-cells + 24 octa-prisms', Dimension:'5D'},
      blurb:'The unique self-dual 24-cell, lifted into five dimensions.',
      article:`<p>The <b>24-cell prism</b> takes the only self-dual regular polychoron and extrudes it into
   5-space. Its 48 vertices are two copies of the 24-cell's 24, and its boundary includes two 24-cell
   facets plus 24 octahedral prisms.</p>
   <p>Because the 24-cell itself has no 3D or higher-dimensional analogue, its prism is one of the few
   five-dimensional figures that inherits genuinely four-dimensional symmetry.</p>`,
      refs:['coxeter', 'conway'] },

    { id:'tesseract-prism', name:'Tesseract prism', tag:'5D prism', schlafli:'{4,3,3}×{ }', family:'prism', dim:5,
      gen:()=>prism5D(tesseract), rot:[P(0,4,.4),P(1,3,.28),P(2,4,.18)],
      facts:{Vertices:32, Edges:80, Cells:'2 tesseracts + 8 cubic prisms', Dimension:'5D'},
      blurb:'A tesseract stretched along a fifth axis — not the same as a penteract.',
      article:`<p>The <b>tesseract prism</b> is the product of a tesseract and a line segment. It has 32
   vertices and 80 edges, the same counts as the penteract, but a different cell layout: two tesseract
   facets (the ends) and eight cubic prisms (the walls).</p>
   <p>The penteract, by contrast, has ten tesseract facets and no cubic prisms. The two shapes are an
   instructive pair: same small-scale counts, different five-dimensional structure.</p>`,
      refs:['coxeter', 'hinton'] },

    { id:'600-cell-prism', name:'600-cell prism', tag:'5D prism', schlafli:'{3,3,5}×{ }', family:'prism', dim:5,
      gen:()=>prism5D(cell600), rot:[P(0,4,.3),P(1,3,.22),P(2,4,.14)],
      facts:{Vertices:240, Edges:1560, Cells:'2 600-cells + 600 tetra-prisms', Dimension:'5D'},
      blurb:'The icosahedral 600-cell, extruded into a fifth dimension.',
      article:`<p>The <b>600-cell prism</b> is the five-dimensional prism over the 600-cell. Its 240 vertices
   are two copies of the 600-cell's 120, and its 1,560 edges include two copies of the original 600-cell
   skeleton plus 120 vertical edges.</p>
   <p>The 600-cell already has the largest finite reflection symmetry in four dimensions (H₄); its prism
   inherits that symmetry and extends it with a mirror across the new fifth axis.</p>`,
      refs:['coxeter', 'conway'] },

    { id:'tetrahedron-triangle-duoprism', name:'Tetrahedron–triangle duoprism', tag:'5D duoprism', schlafli:'{3,3}×{3}', family:'prism', dim:5,
      gen:()=>polyDuoprism(tetrahedron3D(), 3), rot:[P(0,3,.4),P(1,4,.36),P(2,3,.22)],
      facts:{Vertices:12, Edges:30, Cells:'4 tri-duoprisms + 3 tetra-prisms', Dimension:'5D'},
      blurb:'A tetrahedron and a triangle multiplied together in 5-space.',
      article:`<p>The <b>tetrahedron–triangle duoprism</b> is the Cartesian product of a tetrahedron and a
   triangle, a genuinely five-dimensional figure. Its twelve vertices are all pairs (tetrahedron vertex,
   triangle vertex), and its thirty edges come from tetrahedron edges × triangle vertices plus triangle
   edges × tetrahedron vertices.</p>
   <p>It is a simple example of a polyhedral-polygonal duoprism: a 3D polyhedron and a 2D polygon whose
   product needs all five dimensions to exist without distortion.</p>`,
      refs:['coxeter', 'manning'] },

    { id:'4-sphere-s4', name:'4-sphere (S⁴)', tag:'Curved 5-manifold', schlafli:'S⁴', family:'prism', dim:5,
      gen:()=>glome5D(6,24), rot:[P(0,4,.3),P(1,3,.24),P(2,4,.16)],
      facts:{Dimension:'surface in 5D', Curvature:'positive, constant', Symmetry:'O(5)'},
      blurb:'The set of all points equidistant from a centre in 5-space.',
      article:`<p>The <b>4-sphere</b> (S⁴, or the 5D glome) is the set of points at fixed distance from a
   centre in five-dimensional space. Its surface is four-dimensional: a creature on it could move in four
   independent directions and never reach an edge.</p>
   <p>It is the next sphere after the ordinary 2-sphere and the 3-sphere, and it appears in the
   classification of simply connected 4-manifolds and in compactifications of higher-dimensional physics.</p>`,
      refs:['weeks', 'banchoff'] },

    { id:'5d-cyclic-polytope', name:'5D cyclic polytope', tag:'Cyclic 5-polytope', schlafli:'C(14,5)', family:'prism', dim:5,
      gen:()=>cyclic5D(14), rot:[P(0,4,.34),P(1,3,.24),P(2,4,.16)],
      facts:{Vertices:14, Construction:'moment curve', Property:'neighborly'},
      blurb:'Vertices on the moment curve — a combinatorially extreme 5-polytope.',
      article:`<p>A <b>cyclic polytope</b> is built by placing vertices on the moment curve
   (t, t², t³, t⁴, t⁵) in five-dimensional space. It is <i>neighborly</i>: every pair of vertices forms an
   edge, making it as edge-dense as any convex 5-polytope can be.</p>
   <p>Cyclic polytopes are universal extremal objects: McMullen's upper bound theorem says no convex
   polytope with the same number of vertices can have more faces.</p>`,
      refs:['coxeter', 'banchoff'] },

    { id:'5-demicube-prism', name:'5-demicube prism', tag:'5D prism', schlafli:'h{4,3,3,3}×{ }', family:'prism', dim:5,
      gen:()=>prism5D(()=>nDemicube(5)), rot:[P(0,4,.36),P(1,3,.26),P(2,4,.16)],
      facts:{Vertices:32, Edges:'~200', Cells:'2 5-demicubes + prisms', Dimension:'5D'},
      blurb:'The alternated 5-cube, extruded into a sixth coordinate.',
      article:`<p>The <b>5-demicube prism</b> is the prism over the 5-demicube. It takes the sixteen vertices
   of the demipenteract, makes two copies, and joins corresponding vertices with vertical edges. The
   result is a 32-vertex uniform 5-polytope with D₅ symmetry extended by a mirror.</p>`,
      refs:['coxeter', 'elte'] },

    { id:'5-orthoplex-prism', name:'5-orthoplex prism', tag:'5D prism', schlafli:'{3,3,3,4}×{ }', family:'prism', dim:5,
      gen:()=>prism5D(()=>nOrthoplex(5)), rot:[P(0,4,.4),P(1,3,.28)],
      facts:{Vertices:20, Edges:100, Cells:'2 5-orthoplexes + 32 prisms', Dimension:'5D'},
      blurb:'The 5D cross-polytope stretched along a sixth axis.',
      article:`<p>The <b>5-orthoplex prism</b> extrudes the 5-orthoplex along a new axis. Its twenty vertices
   are two copies of the pentacross's ten, and its boundary includes two 5-orthoplex facets plus thirty-two
   simplex prisms.</p>`,
      refs:['coxeter', 'manning'] },
    // ===== ROW 10 — Higher forms, demicubes, and quasicrystals ===================
    { id:'8-simplex', name:'8-simplex', tag:'Regular 8-polytope', schlafli:'{3⁷}', family:'ncube', dim:8,
      gen:()=>nSimplex(8), rot:[P(0,7,.3),P(1,6,.22)],
      facts:{Dimension:'8D', Vertices:9, Edges:36, Symmetry:'A₈'},
      blurb:'Nine mutually equidistant points in eight dimensions.',
      article:`<p>The <b>8-simplex</b> (enneazetton) is nine points in eight dimensions, every pair the same
   distance apart. It is self-dual and the eight-dimensional member of the simplex family.</p>`,
      refs:['coxeter', 'schlafli'] },

    { id:'9-simplex', name:'9-simplex', tag:'Regular 9-polytope', schlafli:'{3⁸}', family:'ncube', dim:9,
      gen:()=>nSimplex(9), rot:[P(0,8,.28),P(1,7,.2)],
      facts:{Dimension:'9D', Vertices:10, Edges:45, Symmetry:'A₉'},
      blurb:'Ten mutually equidistant points in nine dimensions.',
      article:`<p>The <b>9-simplex</b> (decazetton) has ten vertices, 45 edges, and complete symmetry S₁₀.
   Every vertex is connected to every other: its edge graph is the complete graph K₁₀.</p>`,
      refs:['coxeter', 'schlafli'] },

    { id:'6-demicube', name:'6-demicube', tag:'Uniform 6-polytope', schlafli:'h{4,3,3,3,3}', family:'ncube', dim:6,
      gen:()=>nDemicube(6), rot:[P(0,5,.34),P(1,4,.24)],
      facts:{Dimension:'6D', Vertices:32, Symmetry:'D₆', Facets:'mixed'},
      blurb:'The alternated 6-cube — half the vertices of the hexeract.',
      article:`<p>The <b>6-demicube</b> (demihexeract) is the 6-cube with alternate vertices removed, keeping
   the 32 vertices with even coordinate parity. It belongs to the D₆ family of uniform 6-polytopes.</p>`,
      refs:['coxeter', 'elte'] },

    { id:'7-demicube', name:'7-demicube', tag:'Uniform 7-polytope', schlafli:'h{4,3⁵}', family:'ncube', dim:7,
      gen:()=>nDemicube(7), rot:[P(0,6,.32),P(1,5,.22)],
      facts:{Dimension:'7D', Vertices:64, Symmetry:'D₇', Facets:'mixed'},
      blurb:'The alternated 7-cube — half the vertices of the hepteract.',
      article:`<p>The <b>7-demicube</b> (demihepteract) keeps the 64 even-parity vertices of the 7-cube. It is
   a D₇ uniform polytope and a close relative of the E₇ root system.</p>`,
      refs:['coxeter', 'elte'] },

    { id:'8-demicube', name:'8-demicube', tag:'Uniform 8-polytope', schlafli:'h{4,3⁶}', family:'ncube', dim:8,
      gen:()=>nDemicube(8), rot:[P(0,7,.3),P(1,6,.2),P(2,5,.14)],
      facts:{Dimension:'8D', Vertices:128, Symmetry:'D₈', Note:'E₈ lives here'},
      blurb:'The alternated 8-cube — the D₈ root lattice.',
      article:`<p>The <b>8-demicube</b> (demiocteract) has 128 vertices and is the root polytope of the D₈
   lattice. It sits inside the E₈ lattice and helps generate the exceptional symmetry group E₈.</p>`,
      refs:['coxeter', 'elte'] },

    { id:'9-demicube', name:'9-demicube', tag:'Uniform 9-polytope', schlafli:'h{4,3⁷}', family:'ncube', dim:9,
      gen:()=>nDemicube(9), rot:[P(0,8,.28),P(1,7,.2),P(2,6,.12)],
      facts:{Dimension:'9D', Vertices:256, Symmetry:'D₉', Facets:'mixed'},
      blurb:'The alternated 9-cube.',
      article:`<p>The <b>9-demicube</b> (demienneract) keeps the 256 even-parity vertices of the 9-cube. It
   continues the Dₙ family into nine dimensions.</p>`,
      refs:['coxeter', 'elte'] },

    { id:'10-demicube', name:'10-demicube', tag:'Uniform 10-polytope', schlafli:'h{4,3⁸}', family:'ncube', dim:10,
      gen:()=>nDemicube(10), rot:[P(0,9,.26),P(1,8,.18),P(2,7,.1)],
      facts:{Dimension:'10D', Vertices:512, Symmetry:'D₁₀', Facets:'mixed'},
      blurb:'The alternated 10-cube.',
      article:`<p>The <b>10-demicube</b> (demidekeract) has 512 vertices — half of the 10-cube. It is the
   ten-dimensional member of the infinite demicube family.</p>`,
      refs:['coxeter', 'elte'] },

    { id:'cube-triangle-duoprism', name:'Cube–triangle duoprism', tag:'5D duoprism', schlafli:'{4,3}×{3}', family:'prism', dim:5,
      gen:()=>polyDuoprism(cube3D(), 3), rot:[P(0,3,.38),P(1,4,.34),P(2,3,.2)],
      facts:{Vertices:24, Edges:60, Cells:'3 cubes + 6 tri-prisms + 4 cube-prisms', Dimension:'5D'},
      blurb:'A cube and a triangle multiplied together in 5-space.',
      article:`<p>The <b>cube–triangle duoprism</b> is the Cartesian product of a cube and a triangle. Its
   24 vertices are all pairs of a cube vertex and a triangle vertex, and its 60 edges come from cube
   edges × triangle vertices plus triangle edges × cube vertices.</p>`,
      refs:['coxeter', 'manning'] },

    { id:'octahedron-triangle-duoprism', name:'Octahedron–triangle duoprism', tag:'5D duoprism', schlafli:'{3,4}×{3}', family:'prism', dim:5,
      gen:()=>polyDuoprism(octahedron3D(), 3), rot:[P(0,3,.4),P(1,4,.36),P(2,3,.22)],
      facts:{Vertices:18, Edges:45, Cells:'3 octahedra + 8 tri-prisms', Dimension:'5D'},
      blurb:'An octahedron and a triangle multiplied together in 5-space.',
      article:`<p>The <b>octahedron–triangle duoprism</b> multiplies an octahedron by a triangle. Its 18 vertices
   and 45 edges form a five-dimensional figure with octahedral and triangular symmetries combined.</p>`,
      refs:['coxeter', 'manning'] },

    { id:'ammann-beenker-quasicrystal', name:'Ammann–Beenker quasicrystal', tag:'Aperiodic order', schlafli:'8D→2D cut', family:'phys', dim:8,
      gen:()=>ammannBeenker(2), rot:[P(0,7,.26),P(1,6,.18),P(2,5,.12),P(3,4,.08)],
      facts:{Symmetry:'8-fold (forbidden for crystals)', Origin:'projection from 8D', Relation:'octagonal Penrose'},
      blurb:'An eight-fold aperiodic pattern projected from 8D.',
      article:`<p>The <b>Ammann–Beenker tiling</b> is an aperiodic pattern with eight-fold rotational symmetry,
   impossible for ordinary crystals. Like the Penrose tiling, it arises as the shadow of a periodic
   lattice in a higher-dimensional space — here, an 8-cube lattice projected down to the plane.</p>`,
      refs:['penrose', 'shechtman'] },

    ];

    // =====================================================================================
    // Catalog assembly
    // =====================================================================================

    // Family labels are the palette comments of the Hyperspace page, verbatim.
    var FAMILY_LABELS = {
        reg:   'Regular 4-polytopes',
        unif:  'Uniform polytopes',
        five:  '5-cube family',
        ncube: 'n-cube / simplex',
        curve: 'Curved manifolds',
        duo:   'Duoprisms',
        rot:   'Rotations',
        phys:  'Spacetime / lattices',
        prism: '5D prisms & products'
    };
    var FAMILIES = {};
    Object.keys(C).forEach(function (k) {
        FAMILIES[k] = Object.freeze({ key: k, label: FAMILY_LABELS[k], color: C[k] });
    });
    Object.freeze(FAMILIES);
    Object.freeze(R);

    // Plaque fact keys that state a count, mapped to the record's `stated` field.
    var STATED_KEYS = { Vertices: 'vertices', Edges: 'edges', Faces: 'faces', Cells: 'cells' };

    var BY_ID = {};
    var SHAPES = RAW.map(function (e, index) {
        if (BY_ID[e.id]) throw new Error('Hyperspace: duplicate shape id ' + e.id);
        var stated = {};
        Object.keys(e.facts).forEach(function (k) { if (STATED_KEYS[k]) stated[STATED_KEYS[k]] = e.facts[k]; });
        var rec = {
            id: e.id,
            index: index,
            name: e.name,
            tag: e.tag,
            family: e.family,
            familyLabel: FAMILY_LABELS[e.family],
            color: C[e.family],
            dim: e.dim,
            schlafli: e.schlafli,
            symmetry: (typeof e.facts.Symmetry === 'string') ? e.facts.Symmetry : null,
            stated: Object.freeze(stated),
            facts: Object.freeze(Object.assign({}, e.facts)),
            rot: Object.freeze(e.rot.map(function (p) { return Object.freeze(p.slice()); })),
            blurb: e.blurb,
            article: e.article,
            refs: Object.freeze(e.refs.slice()),
            cites: Object.freeze(e.refs.map(function (k) {
                if (!R[k]) throw new Error('Hyperspace: unknown reference ' + k + ' on ' + e.id);
                return R[k];
            })),
            row: Math.floor(index / 10),
            col: index % 10
        };
        Object.defineProperty(rec, '_gen', { value: e.gen, enumerable: false });
        Object.freeze(rec);
        BY_ID[e.id] = rec;
        return rec;
    });
    Object.freeze(SHAPES);

    function get(ref) {
        if (ref && typeof ref === 'object' && ref.id && BY_ID[ref.id] === ref) return ref;
        if (typeof ref === 'number') {
            if (ref >= 0 && ref < SHAPES.length && Math.floor(ref) === ref) return SHAPES[ref];
            throw new RangeError('Hyperspace: index ' + ref + ' out of range 0..' + (SHAPES.length - 1));
        }
        if (ref && typeof ref === 'object' && ref.id) ref = ref.id;
        if (typeof ref === 'string' && BY_ID[ref]) return BY_ID[ref];
        throw new RangeError('Hyperspace: unknown shape ' + String(ref));
    }

    // ---- geometry (cached) ----------------------------------------------------------
    // A few parametric nets sample points where their formula is undefined (Dini's surface takes
    // log(tan(a/2)) past a = pi). A renderer cannot draw those points, so they are dropped here,
    // together with the edges that touch them; every drawable vertex and edge is unchanged.
    var GEO = {};
    function geometry(ref) {
        var s = get(ref);
        if (GEO[s.id]) return GEO[s.id];
        var raw = s._gen();
        var keep = new Array(raw.verts.length), verts = [], dropped = 0;
        for (var i = 0; i < raw.verts.length; i++) {
            var v = raw.verts[i], ok = true;
            for (var d = 0; d < v.length; d++) if (!isFinite(v[d])) { ok = false; break; }
            if (ok) { keep[i] = verts.length; verts.push(v); } else { keep[i] = -1; dropped++; }
        }
        var edges = [];
        for (var k = 0; k < raw.edges.length; k++) {
            var a = keep[raw.edges[k][0]], b = keep[raw.edges[k][1]];
            if (a >= 0 && b >= 0) edges.push(dropped ? [a, b] : raw.edges[k]);
        }
        var g = { verts: verts, edges: edges, embedDim: verts.length ? verts[0].length : 0, dropped: dropped };
        GEO[s.id] = g;
        return g;
    }

    function stats(ref) {
        var g = geometry(ref);
        return { vertices: g.verts.length, edges: g.edges.length, embedDim: g.embedDim };
    }

    // Rotate the native vertices through every plane the exhibit animates, at time t (seconds).
    function pose(ref, t) {
        var s = get(ref), V = geometry(s).verts;
        for (var r = 0; r < s.rot.length; r++) {
            var p = s.rot[r];
            V = rotate(V, p[0], p[1], t * p[2] + (p[3] || 0));
        }
        return V;
    }

    // Worst-case 3D radius of the projected shape over a rotation sweep long enough for every
    // plane to complete a turn: the normalisation the gallery uses to fit each shape in its cage.
    var EXT = {};
    function extent(ref) {
        var s = get(ref);
        if (EXT[s.id] !== undefined) return EXT[s.id];
        var minSp = Infinity;
        for (var r = 0; r < s.rot.length; r++) minSp = Math.min(minSp, Math.abs(s.rot[r][2]) || 1);
        if (!isFinite(minSp) || minSp <= 0) minSp = 0.3;
        var range = (2 * Math.PI) / minSp;
        var SAMPLES = 160, maxR = 0, base = geometry(s).verts;
        for (var k = 0; k < SAMPLES; k++) {
            var tt = (k / SAMPLES) * range, V = base;
            for (var q = 0; q < s.rot.length; q++) {
                var pl = s.rot[q];
                V = rotate(V, pl[0], pl[1], tt * pl[2] + (pl[3] || 0));
            }
            var P = projectTo3D(V);
            for (var i = 0; i < P.length; i++) {
                var rr = Math.hypot(P[i][0], P[i][1], P[i][2]);
                if (rr > maxR) maxR = rr;
            }
        }
        EXT[s.id] = maxR;
        return maxR;
    }

    // Pure 3D projection: [[x,y,z]...] with the worst-case radius normalised to `radius` (default 1).
    function project3D(ref, t, opts) {
        opts = opts || {};
        var s = get(ref);
        var P = projectTo3D(pose(s, t), opts.dist || 3.2);
        var m = extent(s), k = (opts.radius || 1) / (m > 1e-6 ? m : 1);
        return P.map(function (p) { return [p[0] * k, p[1] * k, p[2] * k]; });
    }

    // Pure 2D projection for a canvas: [[x, y, depth]...], y up, scaled so the worst-case pose fills the
    // unit disc.
    // The 3D figure turns about its vertical axis like a gallery exhibit (yaw = 0.15 rad/s by
    // default), is tilted by `pitch`, then perspective-divided with eye distance `focal`.
    function project2D(ref, t, opts) {
        opts = opts || {};
        var yaw = (opts.yaw !== undefined) ? opts.yaw : t * 0.15;
        var pitch = (opts.pitch !== undefined) ? opts.pitch : 0.35;
        var focal = opts.focal || 3.5;
        var P = project3D(ref, t, { dist: opts.dist });
        var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
        var fit = Math.sqrt(1 - 1 / (focal * focal));   // a point on the unit sphere lands inside the unit disc
        return P.map(function (p) {
            var x = p[0] * cy + p[2] * sy, z = -p[0] * sy + p[2] * cy;
            var y = p[1] * cp - z * sp, z2 = p[1] * sp + z * cp;
            var k = fit * focal / (focal - z2);
            return [x * k, y * k, z2];
        });
    }

    // Stroke a shape onto a 2D canvas context, centred in a `size` box, depth-faded.
    function draw(ctx, ref, t, opts) {
        opts = opts || {};
        var s = get(ref), size = opts.size || 110;
        var g = geometry(s), P = project2D(s, t, opts);
        var half = size / 2, sc = half * (opts.fill || 0.9);
        var rgb = hexToRgb(opts.color || s.color), alpha = (opts.alpha !== undefined) ? opts.alpha : 1;
        ctx.save();
        ctx.lineWidth = opts.lineWidth || 0.8;
        // bucket edges into 4 depth bands so a frame costs four strokes, not one per edge
        var bands = [[], [], [], []];
        for (var i = 0; i < g.edges.length; i++) {
            var a = P[g.edges[i][0]], b = P[g.edges[i][1]];
            var z = (a[2] + b[2]) * 0.5;
            var bi = Math.max(0, Math.min(3, Math.floor((z + 1) * 2)));
            bands[bi].push(a, b);
        }
        for (var bnd = 0; bnd < 4; bnd++) {
            if (!bands[bnd].length) continue;
            ctx.strokeStyle = 'rgba(' + rgb + ',' + (alpha * (0.25 + bnd * 0.25)).toFixed(3) + ')';
            ctx.beginPath();
            var L = bands[bnd];
            for (var j = 0; j < L.length; j += 2) {
                ctx.moveTo(half + L[j][0] * sc, half - L[j][1] * sc);
                ctx.lineTo(half + L[j + 1][0] * sc, half - L[j + 1][1] * sc);
            }
            ctx.stroke();
        }
        ctx.restore();
    }

    function hexToRgb(c) {
        var m = /^#?([0-9a-f]{6})$/i.exec(c || '');
        if (!m) return '167,139,250';
        var n = parseInt(m[1], 16);
        return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
    }

    function stripTags(html) {
        return String(html).replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
    }

    // Plain-text description lines: everything the plaque states plus the wireframe as drawn.
    function details(ref) {
        var s = get(ref), st = stats(s);
        var lines = [
            'ID ' + s.id,
            'OBJECT ' + s.name,
            'CLASS ' + s.tag,
            'FAMILY ' + s.familyLabel,
            'SYMBOL ' + s.schlafli,
            'NATIVE DIM ' + s.dim + 'D'
        ];
        Object.keys(s.facts).forEach(function (k) { lines.push(k.replace(/_/g, ' ').toUpperCase() + ' ' + s.facts[k]); });
        lines.push('WIREFRAME ' + st.vertices + ' V / ' + st.edges + ' E IN R' + st.embedDim);
        s.rot.forEach(function (p) {
            lines.push('ROT PLANE x' + (p[0] + 1) + 'x' + (p[1] + 1) + ' @ ' + p[2] + ' rad/s');
        });
        lines.push(stripTags(s.blurb));
        return lines;
    }

    function projectDown(verts, toDim, dist) {
        var P = verts;
        while (P.length && P[0].length > toDim) {
            var out = new Array(P.length);
            for (var i = 0; i < P.length; i++) {
                var v = P[i], w = v[v.length - 1], k = 1 / (dist - w), nv = new Array(v.length - 1);
                for (var d = 0; d < v.length - 1; d++) nv[d] = v[d] * k;
                out[i] = nv;
            }
            P = out;
        }
        return P;
    }

    return Object.freeze({
        version: 1,
        count: SHAPES.length,
        shapes: SHAPES,
        families: FAMILIES,
        refs: R,
        ids: function () { return SHAPES.map(function (s) { return s.id; }); },
        get: get,
        has: function (id) { return Object.prototype.hasOwnProperty.call(BY_ID, id); },
        geometry: geometry,
        stats: stats,
        pose: pose,
        extent: extent,
        project3D: project3D,
        project2D: project2D,
        draw: draw,
        details: details,
        rotate: rotate,
        projectTo3D: projectTo3D,
        projectDown: projectDown,
        gen: Object.freeze({
            nCube: nCube, nSimplex: nSimplex, nOrthoplex: nOrthoplex, nDemicube: nDemicube,
            cell5: cell5, tesseract: tesseract, cell16: cell16, cell24: cell24, cell120: cell120, cell600: cell600,
            duoprism: duoprism, polyDuoprism: polyDuoprism, prism4D: prism4D, prism5D: prism5D,
            tetrahedron3D: tetrahedron3D, cube3D: cube3D, octahedron3D: octahedron3D,
            icosahedron3D: icosahedron3D, dodecahedron3D: dodecahedron3D,
            glome: glome, glome5D: glome5D, cliffordTorus: cliffordTorus, kleinBottle: kleinBottle,
            boysSurface: boysSurface, duocylinder: duocylinder, hopfFibration: hopfFibration,
            villarceau: villarceau, rp3: rp3, pseudosphere: pseudosphere, diniSurface: diniSurface,
            kuenSurface: kuenSurface, e8Roots: e8Roots, lightCone: lightCone, deSitter: deSitter,
            antiDeSitter: antiDeSitter, calabiYau: calabiYau, penrose: penrose, leech: leech,
            octonions: octonions, cyclic5D: cyclic5D, d4Lattice: d4Lattice, d5Lattice: d5Lattice,
            aRoots: aRoots, ammannBeenker: ammannBeenker, edgesByShortest: edgesByShortest
        })
    });
});
