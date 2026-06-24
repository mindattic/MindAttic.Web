import { EXHIBITS } from './exhibits.js';
import { projectTo3D, rotate } from './nd.js';
let fail = 0;
for (const e of EXHIBITS) {
  try {
    const g = e.gen();
    if (!g || !Array.isArray(g.verts) || !Array.isArray(g.edges)) throw new Error('bad shape');
    if (g.verts.length === 0) throw new Error('no verts');
    for (const [a,b] of g.edges) if (a>=g.verts.length||b>=g.verts.length||a<0||b<0) throw new Error('edge OOB '+a+','+b);
    let V = g.verts;
    for (const [i,j] of e.rot) {
      if (i>=V[0].length || j>=V[0].length) throw new Error(`rot plane (${i},${j}) exceeds dim ${V[0].length}`);
      V = rotate(V, i, j, 0.3);
    }
    const P = projectTo3D(V);
    if (P[0].length !== 3) throw new Error('not 3D: '+P[0].length);
    for (const p of P) for (const x of p) if (!isFinite(x)) throw new Error('non-finite coord');
    console.log(`OK  ${e.row},${e.col}  ${e.name.padEnd(28)} dim=${e.dim} V=${String(g.verts.length).padStart(4)} E=${g.edges.length}`);
  } catch (err) {
    fail++;
    console.log(`FAIL ${e.name}: ${err.message}`);
  }
}
console.log(`\n${EXHIBITS.length} exhibits, ${fail} failures`);
if (fail) process.exit(1);
