// main.js — the gallery engine. Three.js scene, first-person controls, an 8×8
// hall of transparent columns, frustum-only animation of each higher-dimensional
// shape, plaque ray-picking, and the confirm-to-close article modal.

import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { EXHIBITS } from './exhibits.js';
import { projectTo3D, rotate, nCube } from './nd.js';

const SPACING = 11;       // distance between columns
const TARGET_R = 1.5;        // worst-case shape radius (fits inside the cage)
const CAGE_R = 1.75, CAGE_H = 5.2;   // cylindrical cage radius + height
const ANIM_DIST2 = 80 * 80; // only re-project shapes within this distance (perf)

let renderer, scene, camera, controls, clock;
let exhibits = [];        // runtime objects
const plaqueMeshes = [];  // for ray-picking
let raycaster, pointer = new THREE.Vector2(0, 0);

// movement state
const move = { f: 0, b: 0, l: 0, r: 0, fast: false };
const velocity = new THREE.Vector3();
const dir = new THREE.Vector3();

// touch / mobile state
const isTouch = matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window);
const touchMove = { x: 0, y: 0 };   // left stick  → strafe / forward
const touchLook = { x: 0, y: 0 };   // right stick → yaw / pitch
let yaw = Math.PI, pitch = 0;       // manual camera orientation on touch
let nearPlaque = -1;

// frustum reuse
const frustum = new THREE.Frustum();
const projScreen = new THREE.Matrix4();

let mode = 'menu';        // 'fps' | 'menu'
let modalOpen = false;
let currentExhibit = -1;
let inited = false, galleryActive = false, running = false;
let breached = false, breachAlpha = 0; // containment-breach state

// ---- DOM refs ---------------------------------------------------------------
const $ = id => document.getElementById(id);
const rootEl = $('galleryRoot'), startEl = $('start'), errEl = $('err');
const pauseEl = $('pause'), modalEl = $('modal'), confirmEl = $('confirm');
const crossEl = $('cross');
const hudName = $('hudName');
const breachEl = $('breach'), staticCv = $('staticNoise');
const touchUIEl = $('touchUI'), readBtnEl = $('readBtn'), menuFabEl = $('menuFab');
const bootEl = $('booting'), bootLabel = $('bootLabel'), barFill = $('barFill'),
      bootPct = $('bootPct'), enterBtn = $('enterBtn');

const nextFrame = () => new Promise(r => requestAnimationFrame(r));
function setBoot(label, pct) {
  bootLabel.textContent = label;
  barFill.style.width = pct + '%';
  bootPct.textContent = pct + '%';
}

// the loading spinner is a real rotating 5-cube (penteract), drawn on a 2D canvas
// with the same nD math the gallery uses — no WebGL needed before the engine boots.
function startBootSpinner() {
  const cv = document.getElementById('spinCanvas');
  if (!cv) return () => {};
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height, cx = W / 2, cy = H / 2;
  const { verts, edges } = nCube(5);
  let raf = 0, t = 0, running = true;
  function frame() {
    if (!running) return;
    t += 0.018;
    let V = verts;
    V = rotate(V, 0, 4, t * 0.9);
    V = rotate(V, 1, 3, t * 0.6);
    V = rotate(V, 2, 4, t * 0.4);
    const P = projectTo3D(V, 3.0);        // 5D → 3D
    let maxR = 0; for (const p of P) { const r = Math.hypot(p[0], p[1]); if (r > maxR) maxR = r; }
    const scale = (Math.min(W, H) * 0.36) / (maxR || 1);
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1.3;
    for (const [a, b] of edges) {
      const pa = P[a], pb = P[b];
      const depth = (pa[2] + pb[2]) * 0.5;       // -ish range, for fade
      const alpha = 0.35 + 0.5 * (1 / (1 + Math.exp(-depth)));
      ctx.strokeStyle = `rgba(167,139,250,${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(cx + pa[0] * scale, cy + pa[1] * scale);
      ctx.lineTo(cx + pb[0] * scale, cy + pb[1] * scale);
      ctx.stroke();
    }
    raf = requestAnimationFrame(frame);
  }
  frame();
  return () => { running = false; cancelAnimationFrame(raf); };
}

// expose entry/exit points for the document page's buttons
window.HyperGallery = { enter: enterGallery, quit: quitGallery };

function enterGallery() {
  rootEl.classList.add('active');
  document.body.classList.add('in-gallery');
  galleryActive = true;
  if (!inited) { inited = true; init(); }       // first time: build + start loop
  else { if (!running) { running = true; animate(); } showMenu(); }
}

function quitGallery() {
  hideMenu();
  modalEl.classList.remove('show'); modalOpen = false;
  galleryActive = false; running = false;       // stops the render loop next frame
  if (controls && controls.isLocked) controls.unlock();
  rootEl.classList.remove('active');
  document.body.classList.remove('in-gallery');
}

async function init() {
  const stopSpinner = startBootSpinner();
  try {
    setBoot('Starting WebGL renderer…', 4);
    setupRenderer();
    await nextFrame();
    setBoot('Building the hall…', 8);
    await buildWorldChunked();
    bindEvents();
    running = true;
    animate();
    setBoot('Ready', 100);
    await nextFrame();
    // swap the penteract spinner for the live Enter button
    stopSpinner();
    bootEl.hidden = true;
    enterBtn.hidden = false;
  } catch (e) {
    console.error(e);
    stopSpinner();
    startEl.classList.add('hide');
    errEl.classList.add('show');
  }
}

function setupRenderer() {
  const canvas = $('scene');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06061A);
  // linear "draw distance": fully clear up close, fading out toward the far wall
  scene.fog = new THREE.Fog(0x06061A, 16, 140);

  camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 400);
  camera.position.set(0, 1.6, -SPACING * 4 - 8);

  controls = new PointerLockControls(camera, renderer.domElement);
  scene.add(controls.getObject());
  // face +z (toward the hall)
  controls.getObject().rotation.y = Math.PI;

  clock = new THREE.Clock();
  raycaster = new THREE.Raycaster();
  raycaster.far = 16;

  // lighting — mostly self-lit wireframes, with a soft ambient + key
  scene.add(new THREE.AmbientLight(0x8888aa, 0.7));
  const key = new THREE.DirectionalLight(0xA78BFA, 0.5); key.position.set(5, 12, 2); scene.add(key);

  // floor
  const floorGeo = new THREE.PlaneGeometry(SPACING * 12, SPACING * 12);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x0A0A1E, roughness: 0.9, metalness: 0.1 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2; floor.position.y = 0; scene.add(floor);

  const grid = new THREE.GridHelper(SPACING * 12, 24, 0x2a2850, 0x16142e);
  grid.position.y = 0.01; scene.add(grid);
}

// ---- build the 8×8 hall (chunked, so the loader can show real progress) -----
async function buildWorldChunked() {
  const total = EXHIBITS.length;
  for (let i = 0; i < total; i++) {
    buildColumn(EXHIBITS[i]);
    if (i % 4 === 3 || i === total - 1) {
      const pct = 8 + Math.round(((i + 1) / total) * 90);
      setBoot(`Building the hall…  ${i + 1}/${total} exhibits`, pct);
      await nextFrame();
    }
  }
}

function buildColumn(data) {
  const x = (data.col - 3.5) * SPACING;
  const z = (data.row - 3.5) * SPACING;
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const col = new THREE.Color(data.color);

  // transparent cylindrical cage wall — depthWrite:false so it never occludes the shape
  const wallGeo = new THREE.CylinderGeometry(CAGE_R, CAGE_R, CAGE_H, 48, 1, true);
  const wallMat = new THREE.MeshBasicMaterial({
    color: col, transparent: true, opacity: 0.05, side: THREE.DoubleSide, depthWrite: false });
  const wall = new THREE.Mesh(wallGeo, wallMat);
  wall.position.y = CAGE_H / 2; wall.renderOrder = -1; group.add(wall);

  // glowing cage frame: top + bottom rings and vertical bars
  group.add(makeCageFrame(CAGE_R, CAGE_H, col));

  // pedestal — top radius EXACTLY matches the cage radius so it sits flush beneath it
  const ped = new THREE.Mesh(
    new THREE.CylinderGeometry(CAGE_R, CAGE_R + 0.12, 0.3, 48),
    new THREE.MeshStandardMaterial({ color: 0x14122e, roughness: 0.6 }));
  ped.position.y = 0.15; group.add(ped);
  // glowing lip ring at the cage base
  const lip = new THREE.Mesh(
    new THREE.CylinderGeometry(CAGE_R + 0.02, CAGE_R + 0.02, 0.06, 48),
    new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.4, roughness: 0.4 }));
  lip.position.y = 0.32; group.add(lip);

  // plaque — just outside the cage on the -z side, facing the approaching player
  const plaque = makePlaque(data);
  plaque.position.set(0, 1.25, -CAGE_R - 0.1);
  plaque.rotation.y = Math.PI;
  plaque.userData.exhibitIndex = data.row * 8 + data.col;
  group.add(plaque);
  plaqueMeshes.push(plaque);

  scene.add(group);

  const rt = {
    data, group,
    shapeGroup: new THREE.Group(),
    lines: null, baseVerts: null, edgeList: null, invScale: 1,
    built: false,
    center2d: { x, z },   // for containment-breach detection
    sphere: new THREE.Sphere(new THREE.Vector3(x, CAGE_H * 0.55, z), 5),
  };
  rt.shapeGroup.position.y = CAGE_H * 0.6;
  group.add(rt.shapeGroup);
  exhibits.push(rt);
}

function makeCageFrame(r, h, color) {
  const seg = 48, bars = 10, pts = [];
  for (const yy of [0.02, h]) {                       // top + bottom rings
    for (let i = 0; i < seg; i++) {
      const a0 = 2 * Math.PI * i / seg, a1 = 2 * Math.PI * (i + 1) / seg;
      pts.push(r * Math.cos(a0), yy, r * Math.sin(a0), r * Math.cos(a1), yy, r * Math.sin(a1));
    }
  }
  for (let i = 0; i < bars; i++) {                    // vertical bars
    const a = 2 * Math.PI * i / bars;
    pts.push(r * Math.cos(a), 0.02, r * Math.sin(a), r * Math.cos(a), h, r * Math.sin(a));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5 }));
}

function makePlaque(data) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256;
  const c = cv.getContext('2d');
  c.fillStyle = 'rgba(13,13,34,0.92)'; roundRect(c, 6, 6, 500, 244, 18); c.fill();
  c.lineWidth = 5; c.strokeStyle = data.color; roundRect(c, 6, 6, 500, 244, 18); c.stroke();
  c.fillStyle = data.color; c.font = '600 22px "Space Mono", monospace';
  c.fillText(data.tag.toUpperCase(), 30, 52);
  c.fillStyle = '#E8E6F5'; c.font = '700 34px "Space Grotesk", system-ui, sans-serif';
  wrapText(c, data.name, 30, 96, 452, 38);
  c.fillStyle = '#9D9BC4'; c.font = '400 19px "Inter", system-ui, sans-serif';
  wrapText(c, data.blurb, 30, 168, 452, 24);
  c.fillStyle = data.color; c.font = '700 20px "Space Mono", monospace';
  c.fillText('▶  CLICK TO READ', 30, 232);

  const tex = new THREE.CanvasTexture(cv); tex.anisotropy = 4;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.0), mat);
  mesh.userData.baseColor = data.color;
  return mesh;
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function wrapText(c, text, x, y, maxW, lh) {
  const words = text.split(' '); let line = '', yy = y;
  for (const w of words) {
    const test = line + w + ' ';
    if (c.measureText(test).width > maxW && line) { c.fillText(line.trim(), x, yy); line = w + ' '; yy += lh; }
    else line = test;
  }
  c.fillText(line.trim(), x, yy);
}

// ---- lazy geometry build ----------------------------------------------------
function ensureBuilt(rt) {
  if (rt.built) return;
  rt.built = true;
  const geo = rt.data.gen();
  rt.baseVerts = geo.verts;
  rt.edgeList = geo.edges;

  // An nD shape's PROJECTED size swells as it rotates, so a single-frame measurement
  // under-estimates its true extent. Sweep the rotation across a range long enough for
  // every plane to complete a full turn, take the worst-case 3D radius, and normalize
  // THAT to TARGET_R. Since horizontal (x,z) and vertical (y) reach are both ≤ the 3D
  // radius, this guarantees the shape never pokes through the cage on any axis.
  let minSp = Infinity;
  for (const [, , sp] of rt.data.rot) minSp = Math.min(minSp, Math.abs(sp) || 1);
  if (!isFinite(minSp) || minSp <= 0) minSp = 0.3;
  const range = (2 * Math.PI) / minSp;
  const SAMPLES = 160;
  let maxR = 0;
  for (let s = 0; s < SAMPLES; s++) {
    const tt = (s / SAMPLES) * range;
    let V = rt.baseVerts;
    for (const [i, j, sp, off] of rt.data.rot) V = rotate(V, i, j, tt * sp + (off || 0));
    const P = projectTo3D(V);
    for (const p of P) { const r = Math.hypot(p[0], p[1], p[2]); if (r > maxR) maxR = r; }
  }
  rt.invScale = maxR > 1e-6 ? TARGET_R / maxR : 1;

  const positions = new Float32Array(rt.edgeList.length * 2 * 3);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const m = new THREE.LineBasicMaterial({ color: new THREE.Color(rt.data.color) });
  rt.lines = new THREE.LineSegments(g, m);
  rt.shapeGroup.add(rt.lines);
  animateShape(rt, clock.elapsedTime); // populate first frame so distant shapes are visible
}

function animateShape(rt, t) {
  let V = rt.baseVerts;
  for (const [i, j, sp, off] of rt.data.rot) V = rotate(V, i, j, t * sp + (off || 0));
  const P = projectTo3D(V);
  const s = rt.invScale;
  const pos = rt.lines.geometry.attributes.position.array;
  let k = 0;
  for (const [a, b] of rt.edgeList) {
    const pa = P[a], pb = P[b];
    pos[k++] = pa[0] * s; pos[k++] = pa[1] * s; pos[k++] = pa[2] * s;
    pos[k++] = pb[0] * s; pos[k++] = pb[1] * s; pos[k++] = pb[2] * s;
  }
  rt.lines.geometry.attributes.position.needsUpdate = true;
  rt.shapeGroup.rotation.y = t * 0.15;
}

// ---- main loop --------------------------------------------------------------
function animate() {
  if (!running) return;            // quitting the gallery stops the loop
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  if (mode === 'fps') updateMovement(dt);

  // build frustum from current camera
  camera.updateMatrixWorld();
  projScreen.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  frustum.setFromProjectionMatrix(projScreen);

  const camPos = controls.getObject().position;
  for (const rt of exhibits) {
    if (!frustum.intersectsSphere(rt.sphere)) continue;
    ensureBuilt(rt);
    // animate only what's reasonably close; distant in-view shapes stay rendered (frozen)
    if (rt.lines && rt.sphere.center.distanceToSquared(camPos) < ANIM_DIST2)
      animateShape(rt, t);
  }

  updateBreach(camPos, dt);
  if (isTouch && mode === 'fps' && !modalOpen) updateReadPrompt();
  renderer.render(scene, camera);
}

// mobile: show a "tap to read" button only when a plaque is centred AND close enough
function updateReadPrompt() {
  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  const hit = raycaster.intersectObjects(plaqueMeshes, false)[0];
  if (hit && hit.distance < 8) {
    nearPlaque = hit.object.userData.exhibitIndex;
    if (readBtnEl) {
      readBtnEl.textContent = '⊙ Read · ' + EXHIBITS[nearPlaque].name;
      readBtnEl.classList.add('show');
    }
  } else {
    nearPlaque = -1;
    if (readBtnEl) readBtnEl.classList.remove('show');
  }
}

// ---- containment breach: triggered when the camera steps inside a cage ------
function updateBreach(camPos, dt) {
  let inside = false;
  for (const rt of exhibits) {
    const dx = camPos.x - rt.center2d.x, dz = camPos.z - rt.center2d.z;
    if (dx * dx + dz * dz < CAGE_R * CAGE_R) { inside = true; break; }
  }
  if (inside !== breached) {
    breached = inside;
    breachEl.classList.toggle('show', breached);
  }
  // ease the static intensity in/out
  const target = breached ? 1 : 0;
  breachAlpha += (target - breachAlpha) * Math.min(1, dt * 8);
  if (breachAlpha > 0.01) drawStatic(breachAlpha);
  else if (staticCv.dataset.cleared !== '1') {
    staticCv.getContext('2d').clearRect(0, 0, staticCv.width, staticCv.height);
    staticCv.dataset.cleared = '1';
  }
}

let staticSized = false;
function drawStatic(alpha) {
  const ctx = staticCv.getContext('2d');
  if (!staticSized || staticCv.width !== 256) { staticCv.width = 256; staticCv.height = 256; staticSized = true; }
  const W = staticCv.width, H = staticCv.height;
  const img = ctx.createImageData(W, H);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    d[i] = 90 + v * 0.6;        // reddish radiation tint
    d[i + 1] = v * 0.5;
    d[i + 2] = v * 0.5;
    d[i + 3] = (v * alpha) | 0;
  }
  ctx.putImageData(img, 0, 0);
  staticCv.style.opacity = (0.35 * alpha).toFixed(3);
  staticCv.dataset.cleared = '0';
}

function updateMovement(dt) {
  // damping is 10/s, so terminal speed ≈ accel/10 m/s.
  // mobile is slower (~7.5 m/s) to match the gentle stick-look feel; desktop ~15 walk / ~34 sprint.
  const speed = isTouch ? 75 : (move.fast ? 340 : 150);
  velocity.x -= velocity.x * 10 * dt;
  velocity.z -= velocity.z * 10 * dt;

  let fwd = move.f - move.b, strafe = move.r - move.l;
  if (isTouch) { fwd += -touchMove.y; strafe += touchMove.x; }  // analog left stick
  dir.set(strafe, 0, fwd);
  if (dir.lengthSq() > 1) dir.normalize();                       // clamp diagonal, keep analog magnitude
  velocity.z -= dir.z * speed * dt;
  velocity.x -= dir.x * speed * dt;
  controls.moveRight(-velocity.x * dt);
  controls.moveForward(-velocity.z * dt);

  // touch look (right stick) — manual yaw/pitch since there's no pointer lock on mobile
  if (isTouch && (touchLook.x || touchLook.y)) {
    const LOOK = 1.1;            // sensitivity (rad/s at full deflection) — gentle
    yaw -= touchLook.x * LOOK * dt;
    pitch -= touchLook.y * LOOK * dt;
    pitch = Math.max(-1.35, Math.min(1.35, pitch));
    controls.getObject().quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
  }

  const o = controls.getObject();
  o.position.y = 1.6;
  const lim = SPACING * 5.2;
  o.position.x = Math.max(-lim, Math.min(lim, o.position.x));
  o.position.z = Math.max(-lim, Math.min(lim, o.position.z));
}

// ---- interaction ------------------------------------------------------------
function bindEvents() {
  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  $('enterBtn').addEventListener('click', enterFPS);
  $('resumeBtn').addEventListener('click', enterFPS);
  $('quitBtn').addEventListener('click', quitGallery);

  controls.addEventListener('lock', () => {
    mode = 'fps';
    startEl.classList.add('hide'); hideMenu();
    crossEl.classList.add('show');
    hudName.textContent = 'Click a plaque to read  ·  Esc — menu & controls';
  });
  controls.addEventListener('unlock', () => {
    crossEl.classList.remove('show');
    if (!galleryActive || modalOpen) return;
    showMenu();                       // Esc out of first-person → main menu
  });

  // click: aim with the crosshair, click to read the plaque you're looking at
  renderer.domElement.addEventListener('click', onClick);

  // keyboard — only while the gallery overlay is active, so the document page
  // keeps normal Space-scroll / shortcuts when the gallery is closed.
  addEventListener('keydown', e => {
    if (!galleryActive) return;
    switch (e.code) {
      case 'KeyW': case 'ArrowUp': move.f = 1; break;
      case 'KeyS': case 'ArrowDown': move.b = 1; break;
      case 'KeyA': case 'ArrowLeft': move.l = 1; break;
      case 'KeyD': case 'ArrowRight': move.r = 1; break;
      case 'ShiftLeft': case 'ShiftRight': move.fast = true; break;   // sprint
      case 'Escape':
        if (modalOpen) { e.preventDefault(); requestClose(); }
        // (first-person Esc is handled by the pointer-unlock event → menu)
        break;
    }
  });
  addEventListener('keyup', e => {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp': move.f = 0; break;
      case 'KeyS': case 'ArrowDown': move.b = 0; break;
      case 'KeyA': case 'ArrowLeft': move.l = 0; break;
      case 'KeyD': case 'ArrowRight': move.r = 0; break;
      case 'ShiftLeft': case 'ShiftRight': move.fast = false; break;
    }
  });

  // modal buttons — the × button is a deliberate close; Escape (easy to hit by
  // accident) instead asks for confirmation.
  $('modalClose').addEventListener('click', closeModal);
  $('keepBtn').addEventListener('click', () => confirmEl.classList.remove('show'));
  $('leaveBtn').addEventListener('click', closeModal);

  // mobile: dual analog sticks + read button + menu fab
  if (isTouch) {
    setupStick($('stickL'), $('stickLknob'), touchMove);
    setupStick($('stickR'), $('stickRknob'), touchLook);
    if (readBtnEl) readBtnEl.addEventListener('click', () => { if (nearPlaque >= 0) openModal(nearPlaque); });
    if (menuFabEl) menuFabEl.addEventListener('click', showMenu);
  }
}

// a virtual analog stick: drives `out` ∈ [-1,1] from a base element + knob
function setupStick(base, knob, out) {
  if (!base || !knob) return;
  const R = 42;
  let id = null, cx = 0, cy = 0;
  const set = (dx, dy) => {
    const m = Math.hypot(dx, dy) || 1, c = Math.min(R, m);
    const nx = dx / m * c, ny = dy / m * c;
    knob.style.transform = `translate(${nx}px, ${ny}px)`;
    out.x = nx / R; out.y = ny / R;
  };
  const reset = () => { out.x = 0; out.y = 0; knob.style.transform = 'translate(0,0)'; };
  base.addEventListener('pointerdown', e => {
    id = e.pointerId; const r = base.getBoundingClientRect();
    cx = r.left + r.width / 2; cy = r.top + r.height / 2;
    base.setPointerCapture(id); set(e.clientX - cx, e.clientY - cy); e.preventDefault();
  });
  base.addEventListener('pointermove', e => { if (e.pointerId === id) set(e.clientX - cx, e.clientY - cy); });
  const end = e => { if (e.pointerId === id) { id = null; reset(); } };
  base.addEventListener('pointerup', end);
  base.addEventListener('pointercancel', end);
}

function enterFPS() {
  if (modalOpen) return;
  if (isTouch) { startTouchFPS(); return; }   // mobile has no pointer lock
  controls.lock();
}

function startTouchFPS() {
  mode = 'fps';
  startEl.classList.add('hide'); hideMenu();
  crossEl.classList.add('show');
  if (touchUIEl) touchUIEl.classList.add('show');
  if (menuFabEl) menuFabEl.classList.add('show');
  hudName.textContent = 'Left stick: move · Right stick: look · tap a nearby plaque';
}

function showMenu() {
  mode = 'menu';
  crossEl.classList.remove('show');
  if (touchUIEl) touchUIEl.classList.remove('show');
  if (menuFabEl) menuFabEl.classList.remove('show');
  if (readBtnEl) readBtnEl.classList.remove('show');
  pauseEl.classList.add('show');
  hudName.textContent = 'Paused';
}
function hideMenu() {
  pauseEl.classList.remove('show');
}

function onClick() {
  if (modalOpen || mode !== 'fps') return;
  // aim with the crosshair: read the plaque under the centre of the screen
  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  const hit = raycaster.intersectObjects(plaqueMeshes, false)[0];
  if (hit) openModal(hit.object.userData.exhibitIndex);
}

// ---- modal ------------------------------------------------------------------
function openModal(idx) {
  const d = EXHIBITS[idx];
  if (!d) return;
  currentExhibit = idx;
  modalOpen = true;
  if (controls.isLocked) controls.unlock();
  pauseEl.classList.remove('show');
  if (touchUIEl) touchUIEl.classList.remove('show');
  if (menuFabEl) menuFabEl.classList.remove('show');
  if (readBtnEl) readBtnEl.classList.remove('show');

  $('aTag').textContent = d.tag;
  $('aTag').style.color = d.color;
  $('aTitle').textContent = d.name;

  const meta = $('aMeta'); meta.innerHTML = '';
  if (d.schlafli) meta.appendChild(metaSpan('Symbol', d.schlafli));
  if (d.dim) meta.appendChild(metaSpan('Native dim', d.dim + 'D'));

  const facts = Object.entries(d.facts || {})
    .map(([k, v]) => `<div><b>${k.replace(/_/g, ' ')}</b><span>${v}</span></div>`).join('');
  const refs = (d.cites || []).map(c => `<li>${c}</li>`).join('');
  $('aBody').innerHTML =
    `<div class="facts">${facts}</div>${d.article}` +
    `<div class="refs"><h3>References</h3><ol>${refs}</ol></div>`;
  $('aBody').scrollTop = 0;

  confirmEl.classList.remove('show');
  modalEl.classList.add('show');
}

function metaSpan(label, val) {
  const s = document.createElement('span');
  s.innerHTML = `${label}: <b>${val}</b>`;
  return s;
}

// Escape (easy to hit by accident) asks for confirmation; the × / "Return to
// gallery" buttons close for real.
function requestClose() {
  confirmEl.classList.add('show');
}
function closeModal() {
  confirmEl.classList.remove('show');
  modalEl.classList.remove('show');
  modalOpen = false;
  currentExhibit = -1;
  if (isTouch) { startTouchFPS(); return; }   // mobile returns straight to first-person
  // show the menu as a safe fallback; if re-locking succeeds the 'lock' handler hides it
  showMenu();
  // we're inside a click handler (valid gesture), so try to drop back into first-person
  try { controls.lock(); } catch (_) {}
}
