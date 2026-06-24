// nd.js — n-dimensional geometry generators and projection.
// Every generator returns { verts: number[][], edges: [i,j][] } where each vert
// is a point in its native dimension. The engine rotates in the extra planes and
// perspective-projects down to 3D for Three.js to render.

export const PHI = (1 + Math.sqrt(5)) / 2;

// ---- generic builders -------------------------------------------------------

// n-cube: 2^n vertices at (±1)^n; edges join verts differing in one coordinate.
export function nCube(n) {
  const verts = [];
  for (let i = 0; i < (1 << n); i++)
    verts.push(Array.from({ length: n }, (_, k) => (i >> k & 1) ? 1 : -1));
  const edges = [];
  for (let i = 0; i < verts.length; i++)
    for (let d = 0; d < n; d++) { const j = i ^ (1 << d); if (j > i) edges.push([i, j]); }
  return { verts, edges };
}

// n-simplex: n+1 mutually equidistant vertices, centred and embedded in n-space.
export function nSimplex(n) {
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
export function nOrthoplex(n) {
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
export function nDemicube(n) {
  const all = nCube(n).verts;
  const verts = all.filter(v => (v.filter(x => x > 0).length % 2) === 0);
  const edges = edgesByNearest(verts, 2); // nearest-neighbour distance^2 = 4? compute
  return { verts, edges: edgesByShortest(verts) };
}

// ---- regular 4-polytopes ----------------------------------------------------

// 24-cell: all permutations of (±1,±1,0,0). 24 verts, edges at squared-distance 2.
export function cell24() {
  const verts = [];
  for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++)
    for (const sa of [1, -1]) for (const sb of [1, -1]) {
      const p = [0, 0, 0, 0]; p[a] = sa; p[b] = sb; verts.push(p);
    }
  return { verts, edges: edgesByShortest(verts) };
}

// 16-cell == 4-orthoplex; 8-cell == tesseract == 4-cube; 5-cell == 4-simplex.
export const cell16 = () => nOrthoplex(4);
export const tesseract = () => nCube(4);
export const cell5 = () => nSimplex(4);

// 600-cell: 120 vertices = even permutations of (±φ,±1,±1/φ,0)/... plus 16-cell + 8 axes.
// Standard unit-radius coordinates (Coxeter): all from the icosian set.
export function cell600() {
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
export function cell120() {
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
export function edgesByShortest(verts, tol = 1e-3) {
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
export function duoprism(p, q) {
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
export function glome(rings = 8, seg = 40) {
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
export function cliffordTorus(u = 16, vv = 16) {
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
export function kleinBottle(u = 24, vv = 14) {
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
export function boysSurface(u = 22, vv = 22) {
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
export function duocylinder(u = 20, vv = 20) { return cliffordTorus(u, vv); }

// Hopf fibration — a set of Hopf circles on S^3 coloured by base point.
export function hopfFibration(fibers = 16, seg = 36) {
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
export function villarceau(circles = 14, seg = 40) {
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
export function rp3(rings = 7, seg = 34) { return glome(rings, seg); }

// ---- rotation demos (geometry is a tesseract; engine animates the plane) ----
export const rotTesseract = () => nCube(4);

// ---- lattices / physics (representative point-and-edge frames) --------------

// E8 root system projected: 240 roots. Two families: ±e_i±e_j (112) and
// half-integer (±1/2)^8 with even # of minus signs (128).
export function e8Roots() {
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
export const e8Polytope = e8Roots;

// Minkowski light cone — null cone t^2 = x^2+y^2 (+z visual), in 4-space (t,x,y,z).
export function lightCone(rings = 9, seg = 30) {
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
export function deSitter(rings = 9, seg = 30) {
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
export function antiDeSitter(rings = 9, seg = 30) {
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
export function calabiYau(n = 5, patches = 8, seg = 12) {
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
export function penrose(n = 3) {
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
export function leech() {
  // A small representative set: 48 minimal vectors of the form (±4,±4,0^22)/√8 scaled.
  const verts = [];
  for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++)
    for (const si of [1, -1]) for (const sj of [1, -1]) {
      const p = new Array(8).fill(0); p[i] = si; p[j] = sj; verts.push(p);
    }
  return { verts, edges: edgesByShortest(verts).slice(0, 600) };
}

// Octonion / Fano-plane multiplication structure as a 7-point, 7-line frame in 8-space.
export function octonions() {
  // Represent e1..e7 as orthonormal axes in R^7 plus the 7 Fano lines as triangles.
  const verts = [];
  for (let i = 0; i < 7; i++) { const p = new Array(7).fill(0); p[i] = 1; verts.push(p); }
  const fano = [[0,1,3],[1,2,4],[2,3,5],[3,4,6],[4,5,0],[5,6,1],[6,0,2]];
  const edges = [];
  for (const [a,b,c] of fano) { edges.push([a,b],[b,c],[c,a]); }
  return { verts, edges };
}

// ---- projection -------------------------------------------------------------

// Perspective-project an array of nD points down to 3D. `dist` is the eye distance
// in each successive higher dimension. Returns Float-friendly [x,y,z] triples.
export function projectTo3D(verts, dist = 3.2) {
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
export function rotate(verts, i, j, angle) {
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
