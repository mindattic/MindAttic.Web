// WebSnapshot viewer — applies a handheld-camera wobble to any
// `.web-snapshot > img` element. Math ported from GridGame2026's
// ActorThumbnail.cs (Perlin pan + pause cycle).
//
// Two ways to feed an element:
//   A) Fetch mode  — set `data-src` to a .b64.txt URL. The viewer fetches
//      the data URI, looks for a sibling .meta.json, and configures itself.
//   B) Inline mode — leave `data-src` off. Set `<img src>` yourself (e.g.,
//      inline base64) and pass meta via `data-meta` as JSON. No network.
//
// Two render modes (chosen by meta.mode):
//   * handheld — image is already +10% larger than container. Viewer renders
//                at natural size, parks at `restX/restY`, wobbles within the
//                actual excess.
//   * scale    — no meta (or meta.mode != 'handheld'). Viewer stretches the
//                `<img>` to (1 + overflow) * container so it has room to pan.
//
// Markup (either form):
//   <div class="web-snapshot" style="width:150px;height:225px"
//        data-src="path/to/ryandebraal.b64.txt">
//     <img alt="ryandebraal.com">
//   </div>
//
//   <div class="web-snapshot" style="width:150px;height:225px"
//        data-meta='{"mode":"handheld","outerWidth":165,"outerHeight":248,
//                    "innerWidth":150,"innerHeight":225,"restX":0,"restY":11.5}'>
//     <img src="data:image/png;base64,...">
//   </div>
//
// Public API:
//   WebSnapshot.attach(el, opts?)
//   WebSnapshot.refresh(el)
//   WebSnapshot.start(el) / .stop(el)
//   WebSnapshot.autoInit(root?)  — rescan; call after DOM mutations

(function (global) {
  const DEFAULTS = {
    overflow: 0.10,
    amplitude: 0.7,
    panFocus: 0.25,
    pause: { intervalMin: 3, intervalMax: 7, durationMin: 2, durationMax: 5, rampMin: 0.25, rampMax: 0.75 },
  };

  function hash1(i) {
    let h = (i | 0) ^ 0x9e3779b9;
    h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    h ^= h >>> 16;
    return (h >>> 0) / 0xffffffff;
  }
  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function noise01(x) {
    const xi = Math.floor(x);
    const xf = x - xi;
    return lerp(hash1(xi), hash1(xi + 1), fade(xf));
  }
  function rand(min, max) { return min + Math.random() * (max - min); }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  function readOpts(el) {
    const d = el.dataset;
    let meta = null;
    if (d.meta) {
      try { meta = JSON.parse(d.meta); }
      catch (e) { console.warn('[WebSnapshot] bad data-meta JSON:', e, d.meta); }
    }
    return {
      src:       d.src || null,
      meta:      meta,
      overflow:  d.overflow  !== undefined ? parseFloat(d.overflow)  : DEFAULTS.overflow,
      amplitude: d.amplitude !== undefined ? parseFloat(d.amplitude) : DEFAULTS.amplitude,
      panFocus:  d.panFocus  !== undefined ? parseFloat(d.panFocus)  : DEFAULTS.panFocus,
      paused:    d.paused === 'true',
    };
  }

  function resetCycle(state) {
    const p = DEFAULTS.pause;
    state.nextPauseInterval = rand(p.intervalMin, p.intervalMax);
    state.pauseDuration     = rand(p.durationMin, p.durationMax);
    state.pauseRampDuration = rand(p.rampMin, p.rampMax);
    state.cyclePeriod       = state.nextPauseInterval + state.pauseDuration + 2 * state.pauseRampDuration;
    state.cycleTime         = 0;
  }

  function evaluatePauseMultiplier(state, t) {
    const rampDownStart = state.nextPauseInterval - state.pauseRampDuration;
    const pauseStart    = state.nextPauseInterval;
    const pauseEnd      = state.nextPauseInterval + state.pauseDuration;
    const rampUpEnd     = pauseEnd + state.pauseRampDuration;
    if (t < rampDownStart) return 1;
    if (t < pauseStart)    return lerp(1, 0, (t - rampDownStart) / state.pauseRampDuration);
    if (t < pauseEnd)      return 0;
    if (t < rampUpEnd)     return lerp(0, 1, (t - pauseEnd) / state.pauseRampDuration);
    return 1;
  }

  function applyScaleModeSize(img, overflow) {
    const pct = (1 + overflow) * 100;
    img.style.width  = pct + '%';
    img.style.height = pct + '%';
  }

  function applyHandheldSize(img) {
    img.style.width  = 'auto';
    img.style.height = 'auto';
    img.style.maxWidth = 'none';
    img.style.maxHeight = 'none';
  }

  function applyRenderMode(state) {
    if (state.meta && state.meta.mode === 'handheld') {
      applyHandheldSize(state.img);
    } else {
      applyScaleModeSize(state.img, state.opts.overflow);
    }
  }

  function waitForImage(img) {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise(resolve => {
      const done = () => {
        img.removeEventListener('load', done);
        img.removeEventListener('error', done);
        resolve();
      };
      img.addEventListener('load', done);
      img.addEventListener('error', done);
    });
  }

  function attach(el, opts) {
    if (!el || el.__webSnapshotState) return el && el.__webSnapshotState;

    const merged = Object.assign({}, readOpts(el), opts || {});
    let img = el.querySelector('img');
    if (!img) {
      img = document.createElement('img');
      el.appendChild(img);
    }

    const state = {
      el, img, opts: merged,
      meta: merged.meta || null,
      seedX: Math.random() * 100,
      seedY: Math.random() * 100,
      effectiveNoiseTime: 0,
      lastTs: 0,
      rafId: 0,
      running: false,
      restX: 0,
      restY: 0,
      halfExcessX: 0,
      halfExcessY: 0,
    };
    resetCycle(state);
    el.__webSnapshotState = state;

    applyRenderMode(state);

    if (merged.src) {
      refresh(el).catch(err => console.warn('[WebSnapshot] refresh failed:', err));
    } else {
      waitForImage(img).then(() => {
        applyRenderMode(state);
        measureExcess(state);
      });
    }

    if (!merged.paused) start(el);
    return state;
  }

  function metaUrlFor(src) {
    return src.replace(/\.b64\.txt(\?.*)?$/i, '.meta.json$1');
  }

  async function refresh(el) {
    const state = el && el.__webSnapshotState;
    if (!state) throw new Error('WebSnapshot.refresh: element not attached');
    const src = state.opts.src;
    if (!src) return;

    const bust = '_t=' + Date.now();
    const sep = (u) => (u.includes('?') ? '&' : '?') + bust;

    const [imgRes, metaRes] = await Promise.all([
      fetch(src + sep(src), { cache: 'no-store' }),
      fetch(metaUrlFor(src) + sep(src), { cache: 'no-store' }).catch(() => null),
    ]);
    if (!imgRes.ok) throw new Error(`Fetch ${src} failed: ${imgRes.status}`);

    const text = (await imgRes.text()).trim();
    state.meta = (metaRes && metaRes.ok) ? await metaRes.json().catch(() => null) : null;

    applyRenderMode(state);
    state.img.src = text;
    await waitForImage(state.img);
    measureExcess(state);
  }

  function measureExcess(state) {
    const rect = state.el.getBoundingClientRect();
    const cw = rect.width, ch = rect.height;
    const meta = state.meta;

    if (meta && meta.mode === 'handheld') {
      const ow = meta.outerWidth  || state.img.naturalWidth  || cw;
      const oh = meta.outerHeight || state.img.naturalHeight || ch;

      state.halfExcessX = Math.max(0, (ow - cw) / 2);
      state.halfExcessY = Math.max(0, (oh - ch) / 2);

      if (typeof meta.restX === 'number' && typeof meta.restY === 'number') {
        state.restX = meta.restX;
        state.restY = meta.restY;
      } else {
        const iw = meta.innerWidth || cw;
        const ih = meta.innerHeight || ch;
        state.restX = state.halfExcessX - (meta.cropOffsetX || 0) - (iw - cw) / 2;
        state.restY = state.halfExcessY - (meta.cropOffsetY || 0) - (ih - ch) / 2;
      }
    } else {
      state.halfExcessX = state.opts.overflow * 0.5 * cw;
      state.halfExcessY = state.opts.overflow * 0.5 * ch;
      state.restX = 0;
      state.restY = 0;
    }
  }

  function tick(state, ts) {
    if (!state.running) return;
    if (!state.lastTs) state.lastTs = ts;
    const dt = Math.min(0.1, (ts - state.lastTs) / 1000);
    state.lastTs = ts;

    state.cycleTime += dt;
    if (state.cycleTime >= state.cyclePeriod) resetCycle(state);

    const m = evaluatePauseMultiplier(state, state.cycleTime);
    state.effectiveNoiseTime += dt * m * state.opts.panFocus;

    const nX = noise01(state.effectiveNoiseTime + state.seedX);
    const nY = noise01(state.effectiveNoiseTime + state.seedY);
    const cX = nX - 0.5;
    const cY = nY - 0.5;

    const wobX = cX * 2 * state.halfExcessX * state.opts.amplitude;
    const wobY = cY * 2 * state.halfExcessY * state.opts.amplitude;

    const tx = clamp(state.restX + wobX, -state.halfExcessX, state.halfExcessX);
    const ty = clamp(state.restY + wobY, -state.halfExcessY, state.halfExcessY);

    state.img.style.transform = `translate(calc(-50% + ${tx.toFixed(2)}px), calc(-50% + ${ty.toFixed(2)}px))`;

    state.rafId = requestAnimationFrame(t => tick(state, t));
  }

  function start(el) {
    const state = el && el.__webSnapshotState;
    if (!state || state.running) return;
    state.running = true;
    state.lastTs = 0;
    state.rafId = requestAnimationFrame(t => tick(state, t));
  }

  function stop(el) {
    const state = el && el.__webSnapshotState;
    if (!state) return;
    state.running = false;
    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.rafId = 0;
  }

  function autoInit(root) {
    (root || document).querySelectorAll('.web-snapshot').forEach(el => attach(el));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => autoInit(), { once: true });
  } else {
    autoInit();
  }

  global.WebSnapshot = { attach, refresh, start, stop, autoInit };
})(window);
