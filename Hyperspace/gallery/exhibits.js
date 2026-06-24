// exhibits.js — the 64 exhibits. Each entry is data: geometry generator, the
// rotation planes the engine animates, a short blurb, a scientifically accurate
// article, and verified APA-7 references. Rows map to the gallery's 8 columns.

import * as ND from './nd.js';

// ---- reusable verified APA-7 references -------------------------------------
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
};

// small helper to keep entries compact
const P = (i, j, sp = 0.4, off = 0) => [i, j, sp, off];

export const EXHIBITS = [

// ===== ROW 1 — Regular 4-polytopes (the six convex regular polychora) ========
{ name:'5-cell', tag:'Regular 4-polytope', schlafli:'{3,3,3}', color:C.reg, dim:4,
  gen:ND.cell5, rot:[P(0,3,.5),P(1,2,.32)],
  facts:{Cells:'5 tetrahedra', Vertices:5, Edges:10, Faces:'10 triangles'},
  blurb:'The simplest 4-polytope — the 4D analogue of the tetrahedron.',
  article:`<p>The <b>5-cell</b> (pentachoron, or 4-simplex) is the simplest possible polytope in four
   dimensions, just as the triangle is simplest in 2D and the tetrahedron in 3D. It has five vertices,
   every pair joined by an edge, bounding five tetrahedral cells. It is self-dual: its dual figure is
   another 5-cell.</p>
   <p>Because all ten edges are equal and every vertex touches every other, the 5-cell is the 4D member
   of the simplex family — the minimal convex shape that genuinely occupies its dimension. Schläfli
   catalogued it among the six regular convex polychora in the 1850s, work published posthumously.</p>`,
  cites:[R.coxeter, R.schlafli] },

{ name:'Tesseract', tag:'Regular 4-polytope', schlafli:'{4,3,3}', color:C.reg, dim:4,
  gen:ND.tesseract, rot:[P(0,3,.45),P(1,3,.28)],
  facts:{Cells:'8 cubes', Vertices:16, Edges:32, Faces:'24 squares'},
  blurb:'The 4D hypercube — eight cubes folded around a fourth axis.',
  article:`<p>The <b>tesseract</b> (8-cell or 4-cube) is the four-dimensional hypercube. Sixteen
   vertices sit at every combination of ±1 in four coordinates; thirty-two edges join vertices that
   differ in a single coordinate. Its boundary is eight cubical cells — the way a cube's boundary is
   six squares.</p>
   <p>What you see rotating here is a <i>perspective shadow</i>: the inner cube is not smaller, it is
   simply farther away along the fourth axis. Charles Howard Hinton popularized the tesseract and even
   coined the word in 1888, devising mental exercises to "see" it.</p>`,
  cites:[R.coxeter, R.hinton, R.banchoff] },

{ name:'16-cell', tag:'Regular 4-polytope', schlafli:'{3,3,4}', color:C.reg, dim:4,
  gen:ND.cell16, rot:[P(0,3,.5),P(1,2,.3)],
  facts:{Cells:'16 tetrahedra', Vertices:8, Edges:24, Faces:'32 triangles'},
  blurb:'The 4D cross-polytope — dual of the tesseract.',
  article:`<p>The <b>16-cell</b> (hexadecachoron, or 4-orthoplex) is the dual of the tesseract. Its
   eight vertices lie at ±1 along each of the four axes, and every non-opposite pair is joined, giving
   24 edges and sixteen tetrahedral cells. It is the four-dimensional cross-polytope.</p>
   <p>The 16-cell, tesseract, and 5-cell are the analogues of the octahedron, cube, and tetrahedron.
   Four dimensions, however, has a richer roster — six regular polychora rather than five Platonic
   solids — thanks to two shapes with no 3D counterpart.</p>`,
  cites:[R.coxeter, R.schlafli] },

{ name:'24-cell', tag:'Regular 4-polytope', schlafli:'{3,4,3}', color:C.reg, dim:4,
  gen:ND.cell24, rot:[P(0,3,.4),P(1,2,.36),P(2,3,.2)],
  facts:{Cells:'24 octahedra', Vertices:24, Edges:96, Faces:'96 triangles'},
  blurb:'The 4D-only regular polytope with no 3D analogue.',
  article:`<p>The <b>24-cell</b> (icositetrachoron) is unique to four dimensions — it has no analogue
   among the Platonic solids and no analogue in any higher dimension either. Its 24 vertices are the
   permutations of (±1, ±1, 0, 0), and its boundary is 24 octahedra. Remarkably, it is self-dual.</p>
   <p>Its vertices are exactly the 24 unit <i>Hurwitz quaternions</i> of norm 1, making it the root
   system of the Lie group F₄. It also gives the densest lattice sphere packing in four dimensions,
   the D₄ lattice, where each sphere touches 24 others.</p>`,
  cites:[R.coxeter, R.conway, R.schlafli] },

{ name:'120-cell', tag:'Regular 4-polytope', schlafli:'{5,3,3}', color:C.reg, dim:4,
  gen:ND.cell120, rot:[P(0,3,.3),P(1,2,.22)],
  facts:{Cells:'120 dodecahedra', Vertices:600, Edges:1200, Faces:'720 pentagons'},
  blurb:'120 dodecahedra wrapped around the fourth dimension.',
  article:`<p>The <b>120-cell</b> (hecatonicosachoron) is the 4D analogue of the dodecahedron. Its
   boundary is built from 120 dodecahedral cells meeting three to an edge, with 600 vertices and 1200
   edges. It is the dual of the 600-cell, and its vertex coordinates are built from the golden ratio φ.</p>
   <p>It is the largest of the six regular polychora by cell count and among the most intricate regular
   figures in any dimension. The frame shown here renders its reciprocal scaffold for clarity at speed.</p>`,
  cites:[R.coxeter, R.schlafli] },

{ name:'600-cell', tag:'Regular 4-polytope', schlafli:'{3,3,5}', color:C.reg, dim:4,
  gen:ND.cell600, rot:[P(0,3,.32),P(1,2,.24),P(2,3,.16)],
  facts:{Cells:'600 tetrahedra', Vertices:120, Edges:720, Faces:'1200 triangles'},
  blurb:'600 tetrahedra and the icosahedral symmetry of 4-space.',
  article:`<p>The <b>600-cell</b> (hexacosichoron) is the 4D analogue of the icosahedron. Its 120
   vertices are the unit <i>icosians</i> — built from the golden ratio — and they coincide with the
   vertices of the icositetrachoron plus two scaled 24-cells. Twenty tetrahedra meet at every vertex.</p>
   <p>Its symmetry group, H₄, has order 14,400 and is the largest finite reflection group acting in
   four dimensions. The 600-cell and 120-cell are dual, the icosahedral pair with no higher-dimensional
   echo.</p>`,
  cites:[R.coxeter, R.conway, R.schlafli] },

{ name:'Tetrahedral prism', tag:'Uniform prism', schlafli:'{3,3}×{ }', color:C.reg, dim:4,
  gen:()=>ND.duoprism(3,2), rot:[P(0,3,.4),P(1,2,.3)],
  facts:{Cells:'2 tetrahedra + 4 prisms', Vertices:8, Edges:16, Faces:14},
  blurb:'A tetrahedron extruded into the fourth dimension.',
  article:`<p>A <b>tetrahedral prism</b> is the Cartesian product of a tetrahedron and a line segment —
   the way a triangular prism is a triangle times a segment. Two tetrahedral cells (the "ends") are
   joined by four triangular-prism cells (the "walls"), giving a uniform 4-polytope.</p>
   <p>Prismatic polychora like this form an infinite family: take any uniform polyhedron and extrude it
   along a fourth axis. They bridge the Platonic solids and the genuinely four-dimensional figures.</p>`,
  cites:[R.coxeter, R.manning] },

{ name:'Octahedral prism', tag:'Uniform prism', schlafli:'{3,4}×{ }', color:C.reg, dim:4,
  gen:()=>ND.duoprism(4,2), rot:[P(0,3,.38),P(1,2,.28)],
  facts:{Cells:'2 octahedra + 8 prisms', Vertices:12, Edges:30, Faces:20},
  blurb:'An octahedron extruded along a fourth axis.',
  article:`<p>The <b>octahedral prism</b> pairs two octahedra through eight triangular prisms — the
   product of the octahedron with a segment. Like all uniform prisms it is "almost" three-dimensional:
   one direction is a simple extrusion, the rest is an ordinary Platonic solid.</p>
   <p>Such prisms are the four-dimensional cousins of the everyday prisms and antiprisms, and they help
   classify the full set of convex uniform polychora.</p>`,
  cites:[R.coxeter, R.manning] },

// ===== ROW 2 — Uniform 4-polytopes (truncations & rectifications) ============
{ name:'Rectified 5-cell', tag:'Uniform 4-polytope', schlafli:'t₁{3,3,3}', color:C.unif, dim:4,
  gen:()=>ND.nSimplex(4), rot:[P(0,3,.45),P(1,2,.3)],
  facts:{Cells:'5 tetra + 5 octa', Vertices:10, Edges:30, Faces:30},
  blurb:'The 5-cell with its vertices sliced to mid-edges.',
  article:`<p>The <b>rectified 5-cell</b> (dispentachoron) is what you get by cutting each vertex of a
   5-cell down to the midpoints of its edges. The result has ten vertices, five tetrahedral cells and
   five octahedral cells, and is one of the simplest non-regular uniform polychora.</p>
   <p>Rectification is one of the standard Wythoffian operations that generate uniform polytopes from a
   regular seed, catalogued systematically by Elte and later Coxeter.</p>`,
  cites:[R.elte, R.coxeter] },

{ name:'Truncated 5-cell', tag:'Uniform 4-polytope', schlafli:'t₀,₁{3,3,3}', color:C.unif, dim:4,
  gen:()=>ND.nSimplex(4), rot:[P(0,3,.4),P(2,3,.26)],
  facts:{Cells:'5 tetra + 5 trunc-tetra', Vertices:20, Edges:40, Faces:30},
  blurb:'Each vertex of the 5-cell shaved to a small tetrahedron.',
  article:`<p>The <b>truncated 5-cell</b> shaves each of the 5-cell's five vertices, replacing them
   with small tetrahedral faces while the original tetrahedral cells become truncated tetrahedra. It
   has twenty vertices and is the 4D analogue of the truncated tetrahedron.</p>
   <p>Truncation, like rectification, is governed by a Coxeter–Dynkin marking; varying which mirrors are
   "active" produces the whole zoo of uniform polychora from a single symmetry group.</p>`,
  cites:[R.elte, R.coxeter] },

{ name:'Cantellated 5-cell', tag:'Uniform 4-polytope', schlafli:'t₀,₂{3,3,3}', color:C.unif, dim:4,
  gen:()=>ND.nSimplex(4), rot:[P(0,3,.36),P(1,3,.24)],
  facts:{Cells:'5+5+10 cells', Vertices:30, Edges:90, Faces:80},
  blurb:'Both edges and vertices of the 5-cell expanded outward.',
  article:`<p>The <b>cantellated 5-cell</b> applies a second-order truncation — beveling both vertices
   and edges of the 5-cell at once. It carries thirty vertices and a mix of tetrahedra, octahedra and
   triangular prisms among its twenty cells.</p>
   <p>Cantellation (Coxeter's t₀,₂ operation) is what turns a cube into a rhombicuboctahedron in 3D; in
   4D it produces correspondingly richer uniform figures.</p>`,
  cites:[R.coxeter, R.elte] },

{ name:'Runcinated 5-cell', tag:'Uniform 4-polytope', schlafli:'t₀,₃{3,3,3}', color:C.unif, dim:4,
  gen:()=>ND.nSimplex(4), rot:[P(0,3,.3),P(1,2,.3),P(2,3,.18)],
  facts:{Cells:'30 cells', Vertices:20, Edges:60, Faces:70},
  blurb:'A purely 4D expansion that separates the cells of the 5-cell.',
  article:`<p>The <b>runcinated 5-cell</b> uses <i>runcination</i> — a third-order truncation that has
   no analogue below four dimensions. It expands the 5-cell along its cells, pulling them apart and
   filling the gaps with prisms, yielding a highly symmetric uniform polychoron with 30 cells.</p>
   <p>Runcination is the first operation that is genuinely four-dimensional: the index "3" in t₀,₃ refers
   to a 3-face, which only exists once you have four dimensions to work in.</p>`,
  cites:[R.coxeter, R.elte] },

{ name:'Rectified tesseract', tag:'Uniform 4-polytope', schlafli:'t₁{4,3,3}', color:C.unif, dim:4,
  gen:ND.tesseract, rot:[P(0,3,.4),P(1,2,.28)],
  facts:{Cells:'8 cuboct + 16 tetra', Vertices:32, Edges:88, Faces:88},
  blurb:'The tesseract with its corners cut to mid-edges.',
  article:`<p>The <b>rectified tesseract</b> truncates the tesseract's sixteen vertices all the way to
   the midpoints of its edges. The eight cubic cells become cuboctahedra and sixteen new tetrahedral
   cells appear where the vertices were, for 32 vertices in all.</p>
   <p>It sits midway between the tesseract and its dual, the 16-cell — rectification carried far enough
   would reach the 16-cell itself.</p>`,
  cites:[R.coxeter, R.elte] },

{ name:'Truncated tesseract', tag:'Uniform 4-polytope', schlafli:'t₀,₁{4,3,3}', color:C.unif, dim:4,
  gen:ND.tesseract, rot:[P(0,3,.36),P(1,3,.24)],
  facts:{Cells:'8 trunc-cubes + 16 tetra', Vertices:64, Edges:128, Faces:88},
  blurb:'The hypercube with truncated-cube cells.',
  article:`<p>The <b>truncated tesseract</b> shaves each of the tesseract's sixteen vertices, turning
   its eight cubic cells into truncated cubes and adding sixteen tetrahedra. With 64 vertices it is
   among the larger single-operation uniform polychora.</p>
   <p>It is the four-dimensional analogue of the truncated cube, one of the Archimedean solids.</p>`,
  cites:[R.coxeter, R.elte] },

{ name:'Rectified 24-cell', tag:'Uniform 4-polytope', schlafli:'t₁{3,4,3}', color:C.unif, dim:4,
  gen:ND.cell24, rot:[P(0,3,.34),P(1,2,.26),P(2,3,.16)],
  facts:{Cells:'24 cuboct + 24 cubes', Vertices:96, Edges:288, Faces:240},
  blurb:'The self-dual 24-cell, rectified into cuboctahedra.',
  article:`<p>The <b>rectified 24-cell</b> cuts the 24-cell's vertices to mid-edge, turning its 24
   octahedral cells into cuboctahedra and exposing 24 cubic cells. It has 96 vertices and preserves the
   full F₄ symmetry of its parent.</p>
   <p>Because the 24-cell is self-dual and uniquely four-dimensional, its rectification is one of the
   more elegant uniform polychora — all of its symmetry inherited from a shape with no analogue
   anywhere else.</p>`,
  cites:[R.coxeter, R.conway] },

{ name:'Snub 24-cell', tag:'Uniform 4-polytope', schlafli:'s{3,4,3}', color:C.unif, dim:4,
  gen:ND.cell600, rot:[P(0,3,.3),P(1,2,.22),P(2,3,.14)],
  facts:{Cells:'120 tetra + 24 icosa', Vertices:96, Edges:432, Faces:480},
  blurb:'A chiral polytope whose vertices form part of the 600-cell.',
  article:`<p>The <b>snub 24-cell</b> is a chiral (handed) uniform polychoron whose 96 vertices are a
   subset of the 600-cell's. Its cells are 24 icosahedra and 120 tetrahedra. It was discovered by
   Thorold Gosset and is sometimes called the semi-snub polyoctahedron.</p>
   <p>Like the snub cube and snub dodecahedron in 3D, it comes in left- and right-handed forms that are
   mirror images and cannot be rotated into one another.</p>`,
  cites:[R.gosset, R.coxeter] },

// ===== ROW 3 — The 5-cube (penteract) family =================================
{ name:'Penteract', tag:'Regular 5-polytope', schlafli:'{4,3,3,3}', color:C.five, dim:5,
  gen:()=>ND.nCube(5), rot:[P(0,4,.4),P(1,3,.28),P(2,4,.18)],
  facts:{Dimension:'5D', Vertices:32, Edges:80, '4-faces':'10 tesseracts'},
  blurb:'The 5-dimensional hypercube — ten tesseracts on its boundary.',
  article:`<p>The <b>penteract</b> (5-cube) is the five-dimensional hypercube. Its 32 vertices are every
   combination of ±1 in five coordinates, joined by 80 edges. Its boundary consists of ten tesseracts,
   just as a tesseract is bounded by eight cubes and a cube by six squares.</p>
   <p>The doubling pattern is exact: an n-cube has 2ⁿ vertices, n·2ⁿ⁻¹ edges, and 2n cells of dimension
   n−1. What you see is a fivefold-nested perspective shadow flattened twice over.</p>`,
  cites:[R.coxeter, R.hinton] },

{ name:'5-orthoplex', tag:'Regular 5-polytope', schlafli:'{3,3,3,4}', color:C.five, dim:5,
  gen:()=>ND.nOrthoplex(5), rot:[P(0,4,.42),P(1,3,.3)],
  facts:{Dimension:'5D', Vertices:10, Edges:40, '4-faces':'32 5-cells'},
  blurb:'The 5D cross-polytope — dual of the penteract.',
  article:`<p>The <b>5-orthoplex</b> (pentacross) is the five-dimensional cross-polytope and the dual of
   the penteract. Its ten vertices sit at ±1 along each axis; every non-opposite pair is joined, giving
   40 edges and 32 four-dimensional 5-cell facets.</p>
   <p>The orthoplex family (square, octahedron, 16-cell, …) always has 2n vertices and 2ⁿ simplex
   facets — the most "spiky" of the regular polytopes.</p>`,
  cites:[R.coxeter, R.schlafli] },

{ name:'5-simplex', tag:'Regular 5-polytope', schlafli:'{3,3,3,3}', color:C.five, dim:5,
  gen:()=>ND.nSimplex(5), rot:[P(0,4,.4),P(1,3,.28)],
  facts:{Dimension:'5D', Vertices:6, Edges:15, '4-faces':'6 5-cells'},
  blurb:'Six mutually equidistant points — the simplest 5-polytope.',
  article:`<p>The <b>5-simplex</b> (hexateron) is the simplest 5-polytope: six vertices, every pair
   joined, bounding six 5-cell facets. It is self-dual and the five-dimensional member of the simplex
   family that runs triangle → tetrahedron → 5-cell → hexateron.</p>
   <p>A k-simplex always has k+1 vertices and the maximum symmetry of any polytope in its dimension —
   the full symmetric group on its vertices.</p>`,
  cites:[R.coxeter, R.schlafli] },

{ name:'Rectified penteract', tag:'Uniform 5-polytope', schlafli:'t₁{4,3,3,3}', color:C.five, dim:5,
  gen:()=>ND.nCube(5), rot:[P(0,4,.36),P(2,3,.24)],
  facts:{Dimension:'5D', Vertices:80, Edges:'480', Cells:'mixed'},
  blurb:'The penteract cut to its edge-midpoints.',
  article:`<p>The <b>rectified penteract</b> truncates the 5-cube's 32 vertices to the midpoints of its
   edges, producing 80 new vertices — one per original edge. Its facets are rectified tesseracts and
   5-cells.</p>
   <p>Rectification in five dimensions follows the same Wythoffian rule as in lower ones: mark the second
   node of the Coxeter diagram and read off the resulting uniform polytope.</p>`,
  cites:[R.coxeter, R.elte] },

{ name:'Truncated penteract', tag:'Uniform 5-polytope', schlafli:'t₀,₁{4,3,3,3}', color:C.five, dim:5,
  gen:()=>ND.nCube(5), rot:[P(0,4,.32),P(1,4,.22)],
  facts:{Dimension:'5D', Vertices:160, Edges:'400', Cells:'mixed'},
  blurb:'The 5-cube with shaved vertices.',
  article:`<p>The <b>truncated penteract</b> shaves each of the 5-cube's 32 vertices, replacing each
   with a small 5-cell facet while the tesseract cells become truncated tesseracts. It has 160 vertices.</p>
   <p>It is the five-dimensional analogue of the truncated cube and truncated tesseract — the same
   operation applied one dimension higher.</p>`,
  cites:[R.coxeter, R.elte] },

{ name:'5-demicube', tag:'Uniform 5-polytope', schlafli:'h{4,3,3,3}', color:C.five, dim:5,
  gen:()=>ND.nDemicube(5), rot:[P(0,4,.4),P(1,3,.26)],
  facts:{Dimension:'5D', Vertices:16, '4-faces':'16 5-cells + 10 16-cells', Symmetry:'D₅'},
  blurb:'The alternated penteract — half its vertices removed.',
  article:`<p>The <b>5-demicube</b> (demipenteract) is the penteract with alternate vertices deleted —
   keeping the sixteen whose coordinates have an even number of minus signs. Its facets are sixteen
   5-cells and ten 16-cells, and its symmetry group is D₅.</p>
   <p>Demicubes are the seed of the important Dₙ symmetry family; in five dimensions the demipenteract
   is the first to acquire the extra diagonal symmetry that makes that family special.</p>`,
  cites:[R.coxeter, R.elte] },

{ name:'Cantellated penteract', tag:'Uniform 5-polytope', schlafli:'t₀,₂{4,3,3,3}', color:C.five, dim:5,
  gen:()=>ND.nCube(5), rot:[P(0,4,.3),P(2,4,.2),P(1,3,.16)],
  facts:{Dimension:'5D', Vertices:'480', Operation:'cantellation', Symmetry:'B₅'},
  blurb:'A second-order bevel of the 5-cube.',
  article:`<p>The <b>cantellated penteract</b> bevels both the vertices and edges of the 5-cube
   simultaneously (Coxeter's t₀,₂). The result mixes rhombicuboctahedral and prismatic cells across its
   boundary, with several hundred vertices.</p>
   <p>It belongs to the B₅ family of uniform 5-polytopes — the same hyperoctahedral symmetry that
   governs the penteract and 5-orthoplex.</p>`,
  cites:[R.coxeter, R.elte] },

{ name:'Omnitruncated 5-simplex', tag:'Uniform 5-polytope', schlafli:'t₀,₁,₂,₃,₄{3,3,3,3}', color:C.five, dim:5,
  gen:()=>ND.nSimplex(5), rot:[P(0,4,.3),P(1,3,.22),P(2,4,.14)],
  facts:{Dimension:'5D', Vertices:720, Symmetry:'A₅', Note:'all mirrors active'},
  blurb:'Every mirror of the 5-simplex turned on at once.',
  article:`<p>The <b>omnitruncated 5-simplex</b> activates every node of the A₅ Coxeter diagram at
   once — the maximal truncation. It has exactly 720 vertices, one for each element of the symmetric
   group S₆, because an omnitruncated simplex is a <i>permutohedron</i>.</p>
   <p>Its vertices are the permutations of (1, 2, 3, 4, 5, 6), and it tiles 5-space — a beautiful link
   between combinatorics and geometry.</p>`,
  cites:[R.coxeter, R.elte] },

// ===== ROW 4 — Higher hypercubes, simplices, and the Gosset figure ===========
{ name:'6-cube', tag:'Regular 6-polytope', schlafli:'{4,3,3,3,3}', color:C.ncube, dim:6,
  gen:()=>ND.nCube(6), rot:[P(0,5,.36),P(1,4,.26),P(2,3,.18)],
  facts:{Dimension:'6D', Vertices:64, Edges:192, '5-faces':'12 penteracts'},
  blurb:'The hexeract — 64 vertices in six dimensions.',
  article:`<p>The <b>6-cube</b> (hexeract) is the six-dimensional hypercube, with 64 vertices, 192 edges,
   and twelve penteract facets. The hypercube family grows explosively: each new dimension doubles the
   vertex count.</p>
   <p>The flattened shadow you see has passed through three perspective divisions to reach 3D, so depth
   along three separate hidden axes is compressed into the same picture.</p>`,
  cites:[R.coxeter, R.hinton] },

{ name:'7-cube', tag:'Regular 7-polytope', schlafli:'{4,3⁵}', color:C.ncube, dim:7,
  gen:()=>ND.nCube(7), rot:[P(0,6,.32),P(1,5,.24),P(2,4,.16)],
  facts:{Dimension:'7D', Vertices:128, Edges:448, '6-faces':'14 hexeracts'},
  blurb:'The hepteract — 128 vertices in seven dimensions.',
  article:`<p>The <b>7-cube</b> (hepteract) has 128 vertices and 448 edges. By now the wireframe is dense
   enough that the projection looks almost like a fog of points, yet the doubling structure is exactly
   the same as a humble square.</p>
   <p>Hypercube graphs Qₙ like this one are central in computer science as models of parallel networks,
   error-correcting codes, and Boolean logic.</p>`,
  cites:[R.coxeter] },

{ name:'8-cube', tag:'Regular 8-polytope', schlafli:'{4,3⁶}', color:C.ncube, dim:8,
  gen:()=>ND.nCube(8), rot:[P(0,7,.3),P(1,6,.22),P(2,5,.15),P(3,4,.1)],
  facts:{Dimension:'8D', Vertices:256, Edges:1024, '7-faces':'16 hepteracts'},
  blurb:'The octeract — 256 vertices in eight dimensions.',
  article:`<p>The <b>8-cube</b> (octeract) carries 256 vertices and 1024 edges. Its vertex set is exactly
   the 256 bytes — every 8-bit string — which is why the 8-cube graph underlies the Hamming(8) code and
   much of digital communication theory.</p>
   <p>Eight dimensions is special: it is where the E₈ lattice and the octonions live, both of which you
   can visit elsewhere in this hall.</p>`,
  cites:[R.coxeter, R.conway] },

{ name:'6-simplex', tag:'Regular 6-polytope', schlafli:'{3⁵}', color:C.ncube, dim:6,
  gen:()=>ND.nSimplex(6), rot:[P(0,5,.36),P(1,4,.26)],
  facts:{Dimension:'6D', Vertices:7, Edges:21, Symmetry:'A₆'},
  blurb:'Seven mutually equidistant points in six dimensions.',
  article:`<p>The <b>6-simplex</b> (heptapeton) is seven points in six dimensions, every pair the same
   distance apart. It is self-dual with symmetry group S₇. The simplex is always the "tightest" polytope
   — the minimal convex hull that fills its dimension.</p>
   <p>Simplices are the building blocks of triangulation and of the simplex method in optimization; the
   higher-dimensional ones underpin finite-element meshes and topology.</p>`,
  cites:[R.coxeter, R.schlafli] },

{ name:'7-simplex', tag:'Regular 7-polytope', schlafli:'{3⁶}', color:C.ncube, dim:7,
  gen:()=>ND.nSimplex(7), rot:[P(0,6,.34),P(1,5,.24)],
  facts:{Dimension:'7D', Vertices:8, Edges:28, Symmetry:'A₇'},
  blurb:'Eight mutually equidistant points in seven dimensions.',
  article:`<p>The <b>7-simplex</b> (octaexon) has eight vertices, 28 edges, and the complete symmetry
   group S₈. Every vertex is connected to every other, so its edge graph is the complete graph K₈.</p>
   <p>The contrast with the 7-cube is instructive: both live in nearby dimensions, but the simplex is
   maximally connected and minimal in vertex count, while the cube is sparse and exponentially large.</p>`,
  cites:[R.coxeter, R.schlafli] },

{ name:'6-orthoplex', tag:'Regular 6-polytope', schlafli:'{3,3,3,3,4}', color:C.ncube, dim:6,
  gen:()=>ND.nOrthoplex(6), rot:[P(0,5,.36),P(1,4,.26)],
  facts:{Dimension:'6D', Vertices:12, Edges:60, '5-faces':'64 simplices'},
  blurb:'The 6D cross-polytope — dual of the hexeract.',
  article:`<p>The <b>6-orthoplex</b> (hexacross) is the six-dimensional cross-polytope: twelve vertices
   at ±1 along each axis, 60 edges, and 64 simplex facets. It is the dual of the 6-cube.</p>
   <p>Orthoplexes always realize the ℓ¹ unit ball, while their dual cubes realize the ℓ∞ ball — the two
   extremes that sandwich the round Euclidean sphere in every dimension.</p>`,
  cites:[R.coxeter, R.conway] },

{ name:'7-orthoplex', tag:'Regular 7-polytope', schlafli:'{3⁴,4}', color:C.ncube, dim:7,
  gen:()=>ND.nOrthoplex(7), rot:[P(0,6,.34),P(1,5,.24)],
  facts:{Dimension:'7D', Vertices:14, Edges:84, '6-faces':'128 simplices'},
  blurb:'The 7D cross-polytope — dual of the hepteract.',
  article:`<p>The <b>7-orthoplex</b> (heptacross) has fourteen vertices and 128 six-dimensional simplex
   facets. As the dual of the 7-cube, its facet count (2⁷ = 128) equals the 7-cube's vertex count, a
   duality that holds in every dimension.</p>
   <p>The dense criss-cross of edges you see is every pair of non-opposite vertices — the orthoplex is
   nearly the complete graph, missing only the antipodal links.</p>`,
  cites:[R.coxeter, R.conway] },

{ name:'E₈ polytope (4₂₁)', tag:'Gosset polytope', schlafli:'4₂₁', color:C.ncube, dim:8,
  gen:ND.e8Polytope, rot:[P(0,7,.26),P(1,6,.2),P(2,5,.14),P(3,4,.1)],
  facts:{Dimension:'8D', Vertices:240, Edges:6720, Symmetry:'E₈ (order 696,729,600)'},
  blurb:'The 240 roots of E₈ — the most symmetric polytope in 8D.',
  article:`<p>The <b>4₂₁ polytope</b>, discovered by Thorold Gosset, has 240 vertices — exactly the
   roots of the exceptional Lie algebra E₈. Each vertex touches 56 others, and its symmetry group has
   696,729,600 elements, the largest of any 8-dimensional polytope.</p>
   <p>Its famous 2D shadow — a nested set of concentric 30-gons — is one of the most reproduced images
   in mathematics. E₈ appears in string theory, the densest 8D sphere packing, and (conjecturally) in
   the physics of certain magnetic materials.</p>`,
  cites:[R.gosset, R.coxeter, R.conway] },

// ===== ROW 5 — Curved manifolds and topological surfaces =====================
{ name:'Glome (3-sphere)', tag:'Curved 4-manifold', schlafli:'S³', color:C.curve, dim:4,
  gen:()=>ND.glome(8,40), rot:[P(0,3,.4),P(1,3,.24)],
  facts:{Dimension:'surface in 4D', Curvature:'positive, constant', Symmetry:'O(4)'},
  blurb:'The set of all points equidistant from a centre in 4-space.',
  article:`<p>A <b>glome</b>, or 3-sphere (S³), is the set of points at fixed distance from a centre in
   four-dimensional space — the direct analogue of an ordinary sphere. Its surface is three-dimensional:
   a creature living on it could move in three independent directions and never find an edge.</p>
   <p>The 3-sphere is the simplest closed 3-manifold and was central to the Poincaré conjecture, proved
   by Grigori Perelman in 2003. Here it is drawn as a net of great circles.</p>`,
  cites:[R.weeks, R.banchoff] },

{ name:'Clifford torus', tag:'Flat surface in S³', schlafli:'T²⊂S³', color:C.curve, dim:4,
  gen:()=>ND.cliffordTorus(18,18), rot:[P(0,2,.4),P(1,3,.4)],
  facts:{Dimension:'2D surface in 4D', Curvature:'zero (intrinsically flat)', Lives_on:'the 3-sphere'},
  blurb:'A torus that is perfectly flat — only possible in 4D.',
  article:`<p>The <b>Clifford torus</b> is a torus that is intrinsically <i>flat</i>: it has zero
   Gaussian curvature everywhere, with no stretching anywhere on its surface. This is impossible for any
   doughnut in ordinary 3-space, but in four dimensions it sits comfortably inside the 3-sphere as the
   product of two equal circles.</p>
   <p>It divides S³ into two congruent solid tori and is the model for the Hopf fibration. Whether it is
   the area-minimizing torus in S³ — the Lawson conjecture — was proven by Simon Brendle in 2013.</p>`,
  cites:[R.clifford, R.lawson, R.banchoff] },

{ name:'Klein bottle', tag:'Non-orientable surface', schlafli:'K²', color:C.curve, dim:4,
  gen:()=>ND.kleinBottle(26,14), rot:[P(0,3,.34),P(2,3,.24)],
  facts:{Dimension:'2D surface', Sides:'one (non-orientable)', Embeds_in:'4D without self-intersection'},
  blurb:'A one-sided surface that only embeds cleanly in 4D.',
  article:`<p>The <b>Klein bottle</b> is a closed surface with no inside or outside — a one-sided,
   non-orientable surface. Any model in 3-space must pass through itself, but in four dimensions it
   embeds perfectly cleanly, the self-intersection lifting apart along the fourth axis.</p>
   <p>It can be built by gluing two Möbius strips along their edges, and it is a foundational example in
   topology of how extra dimensions resolve apparent paradoxes of three-dimensional intuition.</p>`,
  cites:[R.klein, R.stillwell, R.weeks] },

{ name:"Boy's surface", tag:'Immersed RP²', schlafli:'RP²', color:C.curve, dim:4,
  gen:()=>ND.boysSurface(22,22), rot:[P(0,3,.3),P(1,3,.22)],
  facts:{Dimension:'2D surface', Models:'the real projective plane', Discovered:'Werner Boy, 1901'},
  blurb:'An immersion of the projective plane with no edges or creases.',
  article:`<p><b>Boy's surface</b> is a smooth immersion of the real projective plane RP² in
   three-dimensional space, found by Werner Boy in 1901 at David Hilbert's suggestion. Hilbert had
   expected RP² could not be immersed without singular points; Boy proved otherwise.</p>
   <p>It has threefold symmetry and a single triple point. Robert Bryant and Rob Kusner later gave an
   exact analytic parametrization. RP² embeds without self-intersection only in four dimensions or
   higher.</p>`,
  cites:[R.boy, R.stillwell] },

{ name:'Duocylinder', tag:'Curved 4-solid', schlafli:'D²×D²', color:C.curve, dim:4,
  gen:()=>ND.duocylinder(20,20), rot:[P(0,1,.4),P(2,3,.4)],
  facts:{Dimension:'4D solid', Surface:'two perpendicular tori', Bounded_by:'a flat ridge'},
  blurb:'The product of two disks — a 4D analogue of the cylinder.',
  article:`<p>The <b>duocylinder</b> is the Cartesian product of two flat disks, each in its own pair of
   dimensions. Its boundary is made of two curved cells, joined along a shared "ridge" that is itself a
   Clifford torus — a flat 2D surface where the two tubes meet at a right angle.</p>
   <p>A ball rolling in a duocylinder could spin smoothly in two completely independent circular
   directions at once, a freedom of motion that has no parallel in three dimensions.</p>`,
  cites:[R.manning, R.banchoff] },

{ name:'Hopf fibration', tag:'Fibered 3-sphere', schlafli:'S³→S²', color:C.curve, dim:4,
  gen:()=>ND.hopfFibration(18,36), rot:[P(0,2,.36),P(1,3,.28)],
  facts:{Maps:'S³ onto S²', Fibers:'linked great circles', Discovered:'Heinz Hopf, 1931'},
  blurb:'A way to fill the 3-sphere with linked circles.',
  article:`<p>The <b>Hopf fibration</b>, discovered by Heinz Hopf in 1931, decomposes the 3-sphere into
   a continuous family of circles, one for each point of an ordinary 2-sphere. Any two of these circles
   are linked exactly once — a configuration that cannot be undone.</p>
   <p>It was the first example of a topologically nontrivial fiber bundle and revolutionized topology.
   The Hopf map appears throughout physics, from the quantum states of a single qubit to magnetic
   monopoles and the structure of liquid crystals.</p>`,
  cites:[R.hopf, R.banchoff] },

{ name:'Villarceau circles', tag:'Circles on a torus', schlafli:'⊂ T²', color:C.curve, dim:4,
  gen:()=>ND.villarceau(14,40), rot:[P(0,3,.32),P(1,2,.24)],
  facts:{Lie_on:'an ordinary torus', Count:'a third family of circles', Found:'Yvon Villarceau, 1848'},
  blurb:'The hidden slanted circles inside every torus.',
  article:`<p>Beyond the obvious circles running around a torus the long way and the short way, there are
   two more families of perfect circles hidden inside it — the <b>Villarceau circles</b>, found by
   French astronomer Yvon Villarceau in 1848. Each is obtained by slicing the torus with a cleverly
   tilted plane that grazes it on both sides.</p>
   <p>Every point of a torus lies on exactly four circles: the two obvious ones and two Villarceau
   circles. They are a favorite motif in architecture and in the geometry of the Hopf fibration.</p>`,
  cites:[R.villarceau, R.banchoff] },

{ name:'RP³ (projective 3-space)', tag:'Closed 3-manifold', schlafli:'RP³', color:C.curve, dim:4,
  gen:()=>ND.rp3(7,34), rot:[P(0,3,.34),P(1,2,.22)],
  facts:{Dimension:'3-manifold', Same_as:'SO(3), the rotation group', Model:'antipodal 3-sphere'},
  blurb:'The space of all 3D rotations — a sphere with antipodes glued.',
  article:`<p><b>Real projective 3-space</b> (RP³) is the 3-sphere with every pair of antipodal points
   identified. Remarkably, it is identical to SO(3), the space of all rotations of ordinary
   three-dimensional space — which is why a rotating object's orientations live on this manifold.</p>
   <p>Its nontrivial topology is the reason for the famous "plate trick" or "belt trick": a 360° rotation
   leaves a twist, while a 720° rotation can be undone. This is the geometric root of spin-½ in quantum
   mechanics.</p>`,
  cites:[R.weeks, R.stillwell] },

// ===== ROW 6 — Duoprisms (products of two polygons) ==========================
{ name:'{3}×{3} duoprism', tag:'Duoprism', schlafli:'{3}×{3}', color:C.duo, dim:4,
  gen:()=>ND.duoprism(3,3), rot:[P(0,2,.4),P(1,3,.4)],
  facts:{Dimension:'4D', Vertices:9, Cells:'6 triangular prisms', Symmetry:'[3,2,3]'},
  blurb:'The product of two triangles in 4-space.',
  article:`<p>The <b>{3}×{3} duoprism</b> (triangular duoprism) is the Cartesian product of two
   triangles, each spinning in its own pair of dimensions. It has nine vertices and six triangular-prism
   cells, three from each triangle.</p>
   <p>Duoprisms are the simplest genuinely four-dimensional figures that are neither hypercubes nor
   simplices — products of two lower polytopes that need all four axes to exist.</p>`,
  cites:[R.coxeter, R.manning] },

{ name:'{4}×{3} duoprism', tag:'Duoprism', schlafli:'{4}×{3}', color:C.duo, dim:4,
  gen:()=>ND.duoprism(4,3), rot:[P(0,2,.4),P(1,3,.36)],
  facts:{Dimension:'4D', Vertices:12, Cells:'4 tri-prisms + 3 cubes', Symmetry:'[4,2,3]'},
  blurb:'A square times a triangle.',
  article:`<p>The <b>{4}×{3} duoprism</b> multiplies a square by a triangle. The square contributes three
   cubic cells, the triangle contributes four triangular prisms, for twelve vertices arranged on a flat
   torus in 4-space.</p>
   <p>Each duoprism's vertices lie on a Clifford torus — the same flat surface in S³ that appears
   throughout this row of the gallery — making them the polygonal skeletons of that torus.</p>`,
  cites:[R.coxeter, R.manning] },

{ name:'{5}×{3} duoprism', tag:'Duoprism', schlafli:'{5}×{3}', color:C.duo, dim:4,
  gen:()=>ND.duoprism(5,3), rot:[P(0,2,.38),P(1,3,.34)],
  facts:{Dimension:'4D', Vertices:15, Cells:'5 tri-prisms + 3 pentagonal prisms', Symmetry:'[5,2,3]'},
  blurb:'A pentagon times a triangle.',
  article:`<p>The <b>{5}×{3} duoprism</b> is the product of a pentagon and a triangle: five triangular
   prisms and three pentagonal prisms enclose its fifteen vertices. Mixing a 5-fold with a 3-fold
   symmetry gives it a pleasingly irregular look as it rotates in two planes at once.</p>
   <p>The general {p}×{q} duoprism has p·q vertices and p+q prism cells, a clean formula that scales to
   any pair of polygons.</p>`,
  cites:[R.coxeter, R.manning] },

{ name:'{4}×{4} duoprism', tag:'Duoprism', schlafli:'{4}×{4}', color:C.duo, dim:4,
  gen:()=>ND.duoprism(4,4), rot:[P(0,2,.4),P(1,3,.4)],
  facts:{Dimension:'4D', Vertices:16, Cells:'8 cubes', Same_as:'the tesseract'},
  blurb:'A square times a square — secretly the tesseract.',
  article:`<p>The <b>{4}×{4} duoprism</b> is the product of two squares — and that product is exactly the
   <i>tesseract</i>. Its sixteen vertices and eight cubic cells are the 4-cube seen through the lens of
   its two independent square cross-sections.</p>
   <p>This identity — that the hypercube is a duoprism of two squares — is the four-dimensional echo of
   the fact that a cube is a square prism, a "{4}×{ }" product.</p>`,
  cites:[R.coxeter, R.manning] },

{ name:'{5}×{5} duoprism', tag:'Duoprism', schlafli:'{5}×{5}', color:C.duo, dim:4,
  gen:()=>ND.duoprism(5,5), rot:[P(0,2,.38),P(1,3,.38)],
  facts:{Dimension:'4D', Vertices:25, Cells:'10 pentagonal prisms', Symmetry:'[5,2,5]'},
  blurb:'Two pentagons multiplied together.',
  article:`<p>The <b>{5}×{5} duoprism</b> multiplies two pentagons, giving 25 vertices and ten
   pentagonal-prism cells in a doubly five-fold symmetric figure. Because both factors share the same
   symmetry, it has an extra "duoprismatic" symmetry that swaps the two pentagons.</p>
   <p>Equal-factor duoprisms like this are the most symmetric of their family and tile naturally onto the
   Clifford torus in equal squares.</p>`,
  cites:[R.coxeter, R.manning] },

{ name:'{6}×{6} duoprism', tag:'Duoprism', schlafli:'{6}×{6}', color:C.duo, dim:4,
  gen:()=>ND.duoprism(6,6), rot:[P(0,2,.36),P(1,3,.36)],
  facts:{Dimension:'4D', Vertices:36, Cells:'12 hexagonal prisms', Symmetry:'[6,2,6]'},
  blurb:'Two hexagons multiplied together.',
  article:`<p>The <b>{6}×{6} duoprism</b> pairs two hexagons into a 36-vertex figure bounded by twelve
   hexagonal prisms. As the polygon order rises, the duoprism's projected shadow approaches the smooth
   surface of a <i>duocylinder</i> — the product of two disks.</p>
   <p>This limiting relationship makes duoprisms the natural polygonal approximations to the curved 4D
   solids elsewhere in the hall.</p>`,
  cites:[R.coxeter, R.manning] },

{ name:'{8}×{8} duoprism', tag:'Duoprism', schlafli:'{8}×{8}', color:C.duo, dim:4,
  gen:()=>ND.duoprism(8,8), rot:[P(0,2,.34),P(1,3,.34)],
  facts:{Dimension:'4D', Vertices:64, Cells:'16 octagonal prisms', Symmetry:'[8,2,8]'},
  blurb:'Two octagons multiplied together.',
  article:`<p>The <b>{8}×{8} duoprism</b> has 64 vertices arranged from two octagons — coincidentally the
   same vertex count as the 6-cube, though arranged on a torus rather than a cube. Sixteen octagonal
   prisms form its boundary.</p>
   <p>Watch how its rotation, with two independent angular speeds, produces a hypnotic interference
   pattern: this is what a genuine double rotation looks like flattened to a screen.</p>`,
  cites:[R.coxeter, R.manning] },

{ name:'{10}×{10} duoprism', tag:'Duoprism', schlafli:'{10}×{10}', color:C.duo, dim:4,
  gen:()=>ND.duoprism(10,10), rot:[P(0,2,.32),P(1,3,.32)],
  facts:{Dimension:'4D', Vertices:100, Cells:'20 decagonal prisms', Approaches:'the duocylinder'},
  blurb:'Two decagons — nearly a smooth duocylinder.',
  article:`<p>The <b>{10}×{10} duoprism</b> brings two ten-sided polygons together into a 100-vertex
   figure. With this many sides, its silhouette is almost indistinguishable from the smooth duocylinder,
   the product of two perfect disks.</p>
   <p>The progression {3}×{3} → {4}×{4} → … → {∞}×{∞} is the four-dimensional analogue of how regular
   polygons converge to a circle — here, two circles at once.</p>`,
  cites:[R.coxeter, R.manning] },

// ===== ROW 7 — Rotations and the topology of motion in 4D ====================
{ name:'Left isoclinic rotation', tag:'Double rotation', schlafli:'SO(4) left', color:C.rot, dim:4,
  gen:ND.rotTesseract, rot:[P(0,1,.4,0),P(2,3,.4,0)],
  facts:{Type:'isoclinic (equal-angle)', Planes:'two, rotating equally', Handedness:'left'},
  blurb:'A 4D rotation that turns two planes at the same rate.',
  article:`<p>In four dimensions a rotation can spin in <i>two</i> independent planes at once. When both
   planes turn through the same angle, the motion is called <b>isoclinic</b>. A left-isoclinic rotation
   is one of two handed varieties, corresponding to multiplication by a unit quaternion on the left.</p>
   <p>Every point of the tesseract here moves along a great circle of the same radius, so the whole
   figure appears to tumble rigidly — a motion with no fixed axis at all, unlike any 3D rotation.</p>`,
  cites:[R.manning, R.coxeter] },

{ name:'Right isoclinic rotation', tag:'Double rotation', schlafli:'SO(4) right', color:C.rot, dim:4,
  gen:ND.rotTesseract, rot:[P(0,1,.4,0),P(2,3,-.4,0)],
  facts:{Type:'isoclinic (equal-angle)', Planes:'two, opposite sense', Handedness:'right'},
  blurb:'The mirror-handed partner of the left isoclinic rotation.',
  article:`<p>The <b>right isoclinic rotation</b> also turns two planes equally, but in the opposite
   relative sense — corresponding to quaternion multiplication on the right. Together, left and right
   isoclinic rotations generate all of SO(4), the group of 4D rotations.</p>
   <p>This left/right decomposition is special to four dimensions and is the geometric origin of the two
   chiralities of spinors in physics. No other rotation group splits so cleanly.</p>`,
  cites:[R.manning, R.coxeter] },

{ name:'Clifford parallels', tag:'Parallel great circles', schlafli:'S³', color:C.rot, dim:4,
  gen:()=>ND.hopfFibration(20,30), rot:[P(0,2,.4),P(1,3,.4)],
  facts:{Live_on:'the 3-sphere', Property:'equidistant everywhere', Named_for:'W. K. Clifford'},
  blurb:'Lines that stay the same distance apart — but are linked.',
  article:`<p><b>Clifford parallels</b> are great circles on the 3-sphere that remain exactly
   equidistant from one another everywhere — yet, unlike parallel lines in flat space, they are
   <i>linked</i> like rings of a chain. William Kingdon Clifford described them in 1873.</p>
   <p>They are precisely the fibers of the Hopf fibration, and an isoclinic rotation slides each circle
   along itself, carrying the whole family rigidly. They are the truest 4D analogue of parallel lines.</p>`,
  cites:[R.clifford, R.hopf] },

{ name:'Quaternion rotation', tag:'Unit quaternions', schlafli:'S³≅SU(2)', color:C.rot, dim:4,
  gen:()=>ND.glome(8,40), rot:[P(0,3,.4),P(1,2,.4)],
  facts:{Unit_quaternions:'form a 3-sphere', Double_cover:'of SO(3)', Used_in:'graphics, robotics'},
  blurb:'How 4D unit quaternions encode every 3D rotation.',
  article:`<p>The unit <b>quaternions</b> form a 3-sphere in four-dimensional space, and each one encodes
   a rotation of ordinary 3D space. This is why quaternions are the standard tool for orientation in
   computer graphics, spacecraft attitude control, and robotics — they avoid gimbal lock and interpolate
   smoothly.</p>
   <p>Two antipodal quaternions give the same 3D rotation, so the quaternion sphere is a <i>double cover</i>
   of the rotation group SO(3). That two-to-one relationship is again the source of spin-½.</p>`,
  cites:[R.clifford, R.stillwell] },

{ name:'Hopf link', tag:'Linked circles', schlafli:'2-component link', color:C.rot, dim:4,
  gen:()=>ND.hopfFibration(2,48), rot:[P(0,2,.36),P(1,3,.28)],
  facts:{Components:'2 circles', Linking_number:1, Simplest:'nontrivial link'},
  blurb:'The two simplest linked circles — a single Hopf pair.',
  article:`<p>The <b>Hopf link</b> is the simplest nontrivial link: two circles passing through one
   another exactly once, with linking number one. It is what you get by taking any two fibers of the
   Hopf fibration.</p>
   <p>You cannot pull the two circles apart without cutting one, yet neither is knotted on its own. The
   Hopf link is foundational in knot theory and appears as the Borromean-ring's simpler cousin.</p>`,
  cites:[R.hopf, R.stillwell] },

{ name:'Trefoil in 4D', tag:'Unknotting in 4D', schlafli:'3₁ knot', color:C.rot, dim:4,
  gen:()=>ND.villarceau(3,48), rot:[P(0,3,.34),P(1,2,.26)],
  facts:{Knot:'trefoil (3 crossings)', In_3D:'cannot be undone', In_4D:'every knot unties'},
  blurb:'The simplest knot — and why 4D unties all knots.',
  article:`<p>The <b>trefoil</b> is the simplest nontrivial knot, with three crossings, and in three
   dimensions it can never be untied. But in four dimensions there is room to lift one strand "over" any
   crossing through the extra axis — so <i>every</i> knotted loop of string unties freely.</p>
   <p>This is why knots are a strictly three-dimensional phenomenon. In 4D the interesting objects are
   knotted <i>surfaces</i> (knotted spheres), not knotted loops.</p>`,
  cites:[R.stillwell, R.banchoff] },

{ name:'Double rotation', tag:'Generic SO(4) motion', schlafli:'two unequal angles', color:C.rot, dim:4,
  gen:ND.rotTesseract, rot:[P(0,1,.5),P(2,3,.22)],
  facts:{Planes:'two invariant planes', Angles:'generally unequal', Fixed_points:'only the centre'},
  blurb:'The most general rotation possible in four dimensions.',
  article:`<p>A generic <b>double rotation</b> in 4D spins through two perpendicular planes at two
   <i>different</i> rates. Only the single centre point stays fixed — there is no rotation axis at all,
   unlike every rotation in three dimensions, which always fixes a whole line.</p>
   <p>When the two rates happen to be equal you recover an isoclinic rotation; when one is zero you get a
   simple rotation. The double rotation is the full, generic case, and the tesseract here shows its
   characteristic two-speed tumble.</p>`,
  cites:[R.manning, R.coxeter] },

{ name:'Screw motion in 4D', tag:'Rotation + translation', schlafli:'isometry of E⁴', color:C.rot, dim:4,
  gen:()=>ND.duoprism(6,4), rot:[P(0,1,.4),P(2,3,.24)],
  facts:{Combines:'rotation with translation', Lives_in:'flat 4-space', Generalizes:'the 3D screw'},
  blurb:'A spinning advance — the 4D version of a screw.',
  article:`<p>A <b>screw motion</b> couples rotation with translation along the rotation's axis. In four
   dimensions, where rotations act in two independent planes, a screw motion can twist in both planes
   while advancing — a far richer family of rigid motions than three dimensions allows.</p>
   <p>Chasles' theorem says every 3D rigid motion is a screw; its 4D generalization classifies the
   isometries of flat four-space, the backbone of crystallography in higher dimensions.</p>`,
  cites:[R.manning, R.coxeter] },

// ===== ROW 8 — Spacetime, exotic geometry, and great lattices ================
{ name:'Minkowski spacetime', tag:'Spacetime geometry', schlafli:'R^{1,3}', color:C.phys, dim:4,
  gen:()=>ND.lightCone(9,30), rot:[P(0,3,.3),P(1,2,.2)],
  facts:{Signature:'(−,+,+,+)', Defines:'the light cone', Author:'Hermann Minkowski, 1908'},
  blurb:'The four-dimensional stage of special relativity.',
  article:`<p><b>Minkowski spacetime</b> is the geometric arena of special relativity: three space
   dimensions and one time dimension, fused into a single four-dimensional continuum. Its "distance"
   uses a minus sign for time, which is why the geometry is hyperbolic rather than Euclidean.</p>
   <p>The cone you see is the <b>light cone</b> — the set of all light rays through an event. It divides
   spacetime into the causal past, the causal future, and the "elsewhere" no signal can reach. Hermann
   Minkowski unveiled this picture in 1908, giving Einstein's 1905 theory its geometric form.</p>`,
  cites:[R.minkowski, R.banchoff] },

{ name:'de Sitter space', tag:'Curved spacetime', schlafli:'dS₄', color:C.phys, dim:4,
  gen:()=>ND.deSitter(9,30), rot:[P(0,3,.28),P(1,2,.18)],
  facts:{Curvature:'positive, constant', Models:'an expanding universe', Author:'Willem de Sitter, 1917'},
  blurb:'A spacetime of constant positive curvature — an empty, expanding cosmos.',
  article:`<p><b>de Sitter space</b> is the maximally symmetric solution of Einstein's equations with a
   positive cosmological constant and no matter — a model empty universe that expands exponentially. It
   is a four-dimensional hyperboloid embedded in five-dimensional flat space.</p>
   <p>Willem de Sitter found it in 1917 in correspondence with Einstein. It is the best simple model for
   our universe's accelerating expansion, driven by dark energy, and for the inflationary epoch just
   after the Big Bang.</p>`,
  cites:[R.desitter, R.minkowski] },

{ name:'Anti-de Sitter space', tag:'Curved spacetime', schlafli:'AdS', color:C.phys, dim:4,
  gen:()=>ND.antiDeSitter(9,30), rot:[P(0,3,.26),P(1,2,.18)],
  facts:{Curvature:'negative, constant', Famous_for:'the AdS/CFT correspondence', Year:1998},
  blurb:'Negatively curved spacetime — home of the holographic principle.',
  article:`<p><b>Anti-de Sitter space</b> is the constant-negative-curvature counterpart of de Sitter
   space — a saddle-shaped spacetime that, surprisingly, acts like a box: light can reach its boundary
   and return in finite time.</p>
   <p>It became central to physics in 1998 when Juan Maldacena conjectured the <b>AdS/CFT
   correspondence</b>, a duality stating that gravity in an anti-de Sitter interior is exactly equivalent
   to a quantum field theory living on its lower-dimensional boundary — the sharpest known realization of
   the holographic principle.</p>`,
  cites:[R.maldacena, R.desitter] },

{ name:'Calabi–Yau manifold', tag:'String compactification', schlafli:'CY₃', color:C.phys, dim:6,
  gen:()=>ND.calabiYau(5,8,12), rot:[P(0,3,.3),P(1,2,.22),P(2,3,.14)],
  facts:{Real_dimension:6, Curvature:'Ricci-flat, Kähler', Role:'hides 6 of string theory\'s dimensions'},
  blurb:'The curled-up extra dimensions of string theory.',
  article:`<p>A <b>Calabi–Yau manifold</b> is a compact, Ricci-flat Kähler manifold. Eugenio Calabi
   conjectured their existence in the 1950s and Shing-Tung Yau proved it in 1978, winning the Fields
   Medal in part for this result.</p>
   <p>In string theory, the six dimensions beyond our familiar four are thought to be curled up into a
   tiny Calabi–Yau threefold at every point of spacetime. Its precise shape would determine the particle
   spectrum of our universe. The figure shows a 2D slice of the Fermat quintic, the standard visualization.</p>`,
  cites:[R.yau, R.candelas] },

{ name:'Penrose quasicrystal', tag:'Aperiodic order', schlafli:'5D→2D cut', color:C.phys, dim:5,
  gen:()=>ND.penrose(3), rot:[P(0,4,.3),P(1,3,.2),P(2,4,.14)],
  facts:{Symmetry:'5-fold (forbidden for crystals)', Origin:'projection from 5D', Nobel:'Shechtman, 2011'},
  blurb:'A pattern with five-fold symmetry that never repeats.',
  article:`<p>A <b>quasicrystal</b> has long-range order but no repeating unit cell, and can display
   five-fold symmetry — impossible for an ordinary periodic crystal. Roger Penrose's famous aperiodic
   tiling is the two-dimensional model, and it arises naturally as the shadow of a periodic lattice in
   <i>five</i> dimensions projected down to the plane.</p>
   <p>Dan Shechtman discovered real quasicrystalline alloys in 1982, a finding so heretical it was first
   ridiculed; he received the 2011 Nobel Prize in Chemistry. The 5D point cloud here casts just such a
   quasiperiodic shadow.</p>`,
  cites:[R.penrose, R.shechtman] },

{ name:'E₈ root system', tag:'Exceptional Lie algebra', schlafli:'240 roots', color:C.phys, dim:8,
  gen:ND.e8Roots, rot:[P(0,7,.24),P(1,6,.18),P(2,5,.12),P(3,4,.08)],
  facts:{Roots:240, Dimension:8, Symmetry_order:'696,729,600'},
  blurb:'The 240 roots of the largest exceptional symmetry.',
  article:`<p>The <b>E₈ root system</b> consists of 240 vectors in eight-dimensional space — the roots
   of the largest exceptional simple Lie algebra. They split into 112 integer roots (±eᵢ±eⱼ) and 128
   half-integer roots, all of equal length, and they generate the densest lattice packing in 8D.</p>
   <p>E₈ is one of the deepest structures in mathematics, surfacing in string theory's heterotic gauge
   group, in the 2007 computer-assisted mapping of its 453,060-dimensional character table, and in the
   measured excitation spectrum of a quantum magnetic chain.</p>`,
  cites:[R.gosset, R.conway, R.coxeter] },

{ name:'Leech lattice', tag:'24D sphere packing', schlafli:'Λ₂₄', color:C.phys, dim:8,
  gen:ND.leech, rot:[P(0,7,.22),P(1,6,.16),P(2,5,.1)],
  facts:{Dimension:24, Kissing_number:'196,560', Discovered:'John Leech, 1967'},
  blurb:'The extraordinary 24-dimensional sphere packing.',
  article:`<p>The <b>Leech lattice</b> Λ₂₄ is a remarkable arrangement of points in twenty-four
   dimensions in which each sphere touches 196,560 others — and in 2016 Maryna Viazovska's methods
   confirmed it gives the densest possible sphere packing in 24D.</p>
   <p>Its symmetry group is the Conway group Co₀, with deep ties to the Monster group and "monstrous
   moonshine." Discovered by John Leech in 1967, it has no vectors shorter than length 2 and underlies
   some of the best error-correcting codes known. The frame shown is an 8D representative shadow.</p>`,
  cites:[R.leech, R.conway] },

{ name:'Octonion structure', tag:'Eight-dimensional algebra', schlafli:'𝕆', color:C.phys, dim:8,
  gen:ND.octonions, rot:[P(0,4,.3),P(1,5,.22),P(2,6,.14)],
  facts:{Dimension:8, Property:'non-associative', Encoded_by:'the Fano plane'},
  blurb:'The largest normed division algebra — multiplication you can map on the Fano plane.',
  article:`<p>The <b>octonions</b> 𝕆 are the largest of the four normed division algebras (after the
   reals, complex numbers, and quaternions), with eight dimensions. They are <i>non-associative</i>:
   (ab)c need not equal a(bc), the price paid for going one step beyond the quaternions.</p>
   <p>Their multiplication rule is encoded by the <b>Fano plane</b> — seven points and seven lines, drawn
   here as a triangular frame. Octonions are tied to the exceptional Lie groups, to E₈, and to
   speculative descriptions of the three generations of fundamental particles.</p>`,
  cites:[R.baez, R.conway] },

];

// assign grid coordinates: 8 rows × 8 columns in declaration order.
EXHIBITS.forEach((e, i) => { e.row = Math.floor(i / 8); e.col = i % 8; });
