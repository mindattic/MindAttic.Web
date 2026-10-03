// Hyperspace component: the shape library, the Hyperspace Reader, and the Hyperspace page that builds its
// gallery from the library.
//
// The page lives in the sibling Hyperspace repo (SITES_ROOT/Hyperspace) and is opened as a local file, the way
// its README says it must keep working. Its pinned jsDelivr URL for hyperspace.js is answered from this working
// tree (so the test passes before the tag is published); three.js is fetched from its CDN because the gallery
// needs it and this repo does not carry a copy; Google Fonts are blocked (the page falls back to system fonts).
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { UIUX_ROOT, SITES_ROOT } from '../../lib/paths.mjs';

const require = createRequire(import.meta.url);
const COMPONENT = path.join(UIUX_ROOT, 'Components', 'Hyperspace');
const LIB = path.join(COMPONENT, 'hyperspace.js');
const HARNESS = pathToFileURL(path.join(COMPONENT, 'index.htm')).href;
const PAGE_DIR = path.join(SITES_ROOT, 'Hyperspace');
const PAGE = path.join(PAGE_DIR, 'index.htm');

// The gallery is WebGL; make sure headless Chrome has a software GL to give it.
test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'], args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] } });

function trackErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  return errors;
}

test.describe('shape library', () => {
  const H = require(LIB);

  test('loads every shape with a complete record and a unique stable id', () => {
    expect(H.count).toBe(100);
    expect(H.shapes).toHaveLength(100);
    const ids = H.ids();
    expect(new Set(ids).size).toBe(100);
    for (const s of H.shapes) {
      expect(s.id, s.name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(H.get(s.id)).toBe(s);
      expect(H.get(s.index)).toBe(s);
      expect(Object.isFrozen(s)).toBe(true);
      for (const k of ['name', 'tag', 'family', 'familyLabel', 'color', 'schlafli', 'blurb', 'article']) {
        expect(typeof s[k], `${s.id}.${k}`).toBe('string');
        expect(s[k].length, `${s.id}.${k}`).toBeGreaterThan(0);
      }
      expect(Number.isInteger(s.dim) && s.dim >= 3, `${s.id}.dim`).toBe(true);
      expect(s.rot.length, `${s.id}.rot`).toBeGreaterThan(0);
      expect(s.cites.length, `${s.id}.cites`).toBe(s.refs.length);
      expect(H.families[s.family].color).toBe(s.color);
      expect(s.row * 10 + s.col).toBe(s.index);
    }
    expect(() => H.get('no-such-shape')).toThrow(RangeError);
    expect(() => H.get(100)).toThrow(RangeError);
  });

  test('every shape has geometry and projects to finite 2D and 3D coordinates', () => {
    // collect problems and assert once: an expect() per coordinate would be tens of thousands of calls
    const problems = [];
    for (const s of H.shapes) {
      const g = H.geometry(s.id);
      if (!g.verts.length || !g.edges.length) problems.push(`${s.id}: empty geometry`);
      if (g.edges.some(([a, b]) => !(a < g.verts.length && b < g.verts.length))) problems.push(`${s.id}: edge index out of range`);
      const m = H.extent(s.id);
      if (!(Number.isFinite(m) && m > 0)) problems.push(`${s.id}: extent ${m}`);
      for (const t of [0, 1.7, 13.3, 250]) {
        const p2 = H.project2D(s.id, t);
        const p3 = H.project3D(s.id, t);
        if (p2.length !== g.verts.length || p3.length !== g.verts.length) problems.push(`${s.id} @${t}: point count`);
        if (!p2.every((p) => p.every(Number.isFinite))) problems.push(`${s.id} @${t}: non-finite 2D coordinate`);
        if (!p3.every((p) => p.every(Number.isFinite))) problems.push(`${s.id} @${t}: non-finite 3D coordinate`);
        // extent() samples the rotation sweep, so a pose between samples can reach a few percent further
        if (p2.some(([x, y]) => Math.hypot(x, y) > 1.1)) problems.push(`${s.id} @${t}: 2D point outside the unit disc`);
        if (p3.some((p) => Math.hypot(...p) > 1.1)) problems.push(`${s.id} @${t}: 3D point beyond the normalised radius`);
      }
    }
    expect(problems).toEqual([]);
  });

  test('loads in a browser and draws every shape onto a canvas', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto(HARNESS);
    const res = await page.evaluate(() => {
      const H = window.Hyperspace, c = document.createElement('canvas');
      c.width = c.height = 64;
      const ctx = c.getContext('2d'), blank = [];
      for (const s of H.shapes) {
        ctx.clearRect(0, 0, 64, 64);
        H.draw(ctx, s.id, 3.1, { size: 64 });
        const d = ctx.getImageData(0, 0, 64, 64).data;
        let lit = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) lit++;
        if (!lit) blank.push(s.id);
      }
      return { count: H.count, blank };
    });
    expect(res.count).toBe(100);
    expect(res.blank).toEqual([]);
    expect(errors).toEqual([]);
  });
});

test.describe('Hyperspace Reader', () => {
  test('opens, animates the threshold bar, scrolls the details and closes with its DOM removed', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto(HARNESS);
    await page.evaluate(() => { window.__h = window.HyperspaceReader.show({ x: 40, y: 120, shape: 'tesseract' }); });
    const win = page.locator('.hsr');
    await expect(win).toHaveCount(1);
    await expect(win).toHaveAttribute('data-shape', 'tesseract');
    await expect(page.locator('#hsr-style')).toHaveCount(1);
    await expect(win).toHaveAttribute('data-state', 'live', { timeout: 3000 });

    // threshold bar: labelled, filled, and moving
    await expect(win.locator('.hsr-thresh-head')).toContainText('DIMENSIONAL THRESHOLD');
    const sample = () => page.evaluate(() => {
      const w = document.querySelector('.hsr');
      return {
        threshold: Number(w.dataset.threshold),
        clip: w.querySelector('.hsr-bar-fill').style.clipPath,
        scroll: w.querySelector('.hsr-details-inner').style.transform,
        text: w.querySelector('.hsr-details-inner').textContent,
        values: [...w.querySelectorAll('.hsr-ro-v')].map((e) => e.textContent).join('|'),
      };
    });
    await page.waitForTimeout(1200);
    const a = await sample();
    await page.waitForTimeout(700);
    const b = await sample();
    expect(a.threshold).toBeGreaterThan(0);
    expect(a.clip).toMatch(/^inset\(/);
    expect(b.threshold).not.toBe(a.threshold);
    expect(b.values).not.toBe(a.values);

    // details: a span of text that scrolls and advances, printing the shape's own details
    expect(await win.locator('span.hsr-details-inner').count()).toBe(1);
    expect(b.scroll).toMatch(/^translateY\(/);
    expect(b.text).not.toBe(a.text);
    await page.waitForTimeout(1500);
    const c = await sample();
    expect(a.text + b.text + c.text).toMatch(/Tesseract|tesseract|\{4,3,3\}/);

    // readouts and flags
    await expect(win.locator('.hsr-ro')).toHaveCount(5);
    await expect(win.locator('.hsr-flag').first()).toHaveText('UNRESOLVED');

    // the scope canvas has something drawn on it
    const lit = await page.evaluate(() => {
      const cv = document.querySelector('.hsr canvas'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
      let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++; return n;
    });
    expect(lit).toBeGreaterThan(200);

    // shutdown: freezes, prints the power-down line, folds away, removes itself
    // (sampled inside the page, so test-runner latency cannot outlast the 1.1 s shutdown)
    const shutdown = await page.evaluate(async () => {
      const w = document.querySelector('.hsr'), vals = () => [...w.querySelectorAll('.hsr-ro-v')].map((e) => e.textContent);
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      window.__closing = window.__h.close();
      const at0 = { state: w.dataset.state, status: w.querySelector('.hsr-status').textContent, values: vals() };
      await sleep(200);
      const at200 = { values: vals() };
      await sleep(500);
      const at700 = { state: w.dataset.state, foot: w.querySelector('.hsr-foot').textContent, attached: w.isConnected };
      return { at0, at200, at700 };
    });
    expect(shutdown.at0.state).toBe('closing');
    expect(shutdown.at0.status).toBe('SHUTDOWN');
    expect(shutdown.at200.values).toEqual(shutdown.at0.values);          // readouts frozen
    expect(shutdown.at700.foot).toContain('POWERING DOWN');               // power-down line printed
    expect(shutdown.at700.state).toBe('off');                             // folding away
    await page.evaluate(() => window.__closing);
    await expect(page.locator('.hsr')).toHaveCount(0);
    expect(await page.evaluate(() => [window.HyperspaceReader.active(), window.__h.closed])).toEqual([0, true]);
    expect(errors).toEqual([]);
  });

  test('ttl closes it on its own, and closeAll() clears several', async ({ page }) => {
    await page.goto(HARNESS);
    await page.evaluate(() => { window.HyperspaceReader.show({ shape: 0, ttl: 600 }); });
    await expect(page.locator('.hsr')).toHaveCount(1);
    await expect(page.locator('.hsr')).toHaveCount(0, { timeout: 8000 });
    await page.evaluate(() => { for (const s of ['24-cell', 'hopf-fibration', 'e8-root-system']) window.HyperspaceReader.show({ shape: s }); });
    await expect(page.locator('.hsr')).toHaveCount(3);
    await page.evaluate(() => window.HyperspaceReader.closeAll());
    await expect(page.locator('.hsr')).toHaveCount(0);
  });

  test('honours prefers-reduced-motion: no scrolling, no jitter, plain fade', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    const errors = trackErrors(page);
    await page.goto(HARNESS);
    await page.evaluate(() => { window.__h = window.HyperspaceReader.show({ shape: 'penteract' }); });
    const win = page.locator('.hsr');
    await expect(win).toHaveClass(/hsr--reduced/);
    await expect(win).toHaveAttribute('data-state', 'live', { timeout: 3000 });
    await page.waitForTimeout(600);
    const t1 = await win.getAttribute('data-threshold');
    await page.waitForTimeout(500);
    expect(await win.getAttribute('data-threshold')).toBe(t1);
    expect(await win.locator('.hsr-details-inner').evaluate((e) => e.style.transform)).toBe('');
    await page.evaluate(() => window.__h.close());
    await expect(page.locator('.hsr')).toHaveCount(0);
    expect(errors).toEqual([]);
    await ctx.close();
  });

  test('returns null without the library', async ({ page }) => {
    await page.setContent('<!doctype html><body></body>');
    await page.addScriptTag({ path: path.join(COMPONENT, 'hyperspace-reader.js') });
    expect(await page.evaluate(() => window.HyperspaceReader.show({}))).toBeNull();
  });
});

test.describe('Hyperspace page', () => {
  test.skip(!fs.existsSync(PAGE), `Hyperspace page not found at ${PAGE}`);

  async function openPage(browser, { cdn }) {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    await ctx.route('**/*', (route) => {
      const url = new URL(route.request().url());
      if (url.protocol === 'file:' || url.protocol === 'data:' || url.protocol === 'blob:') return route.continue();
      const m = url.pathname.match(/^\/gh\/mindattic\/MindAttic\.UiUx@V\d+\/(.+)$/);
      if (url.host === 'cdn.jsdelivr.net' && m) {
        const abs = path.join(UIUX_ROOT, decodeURIComponent(m[1]));
        if (cdn && fs.existsSync(abs)) return route.fulfill({ status: 200, body: fs.readFileSync(abs), headers: { 'content-type': 'text/javascript; charset=utf-8', 'access-control-allow-origin': '*' } });
        return route.fulfill({ status: 404, body: 'not published' });
      }
      if (url.host === 'cdn.jsdelivr.net' && url.pathname.startsWith('/npm/three@')) return route.continue();
      return route.abort('blockedbyclient');
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(PAGE).href, { waitUntil: 'load' });
    return { ctx, page, errors };
  }

  test('pins the library to a whole-number UiUx tag that exists in this tree', () => {
    const html = fs.readFileSync(PAGE, 'utf8');
    const pins = [...html.matchAll(/cdn\.jsdelivr\.net\/gh\/mindattic\/MindAttic\.UiUx@([^/"']+)\/([^"']+)/g)];
    expect(pins.length).toBeGreaterThan(0);
    for (const [, tag, file] of pins) {
      expect(tag).toMatch(/^V\d+$/);
      expect(fs.existsSync(path.join(UIUX_ROOT, file)), file).toBe(true);
    }
    expect(html).not.toMatch(/const EXHIBITS = \[/);   // the exhibits are not copied back into the page
  });

  for (const cdn of [true, false]) {
    test(`renders its explorers and gallery from the library (${cdn ? 'pinned CDN file' : 'local sibling fallback'})`, async ({ browser }) => {
      test.setTimeout(120_000);
      const { ctx, page, errors } = await openPage(browser, { cdn });
      expect(await page.evaluate(() => [window.Hyperspace && window.Hyperspace.count, typeof window.HyperGallery])).toEqual([100, 'object']);

      // the field-guide canvases draw
      for (const id of ['heroCanvas', 'sliceCanvas', 'projCanvas', 'ladder2']) {
        const lit = await page.evaluate((id) => {
          const cv = document.getElementById(id), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
          let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n;
        }, id);
        expect(lit, id).toBeGreaterThan(50);
      }
      expect(await page.locator('#pVtx').textContent()).toBe('32');

      // the gallery boots: all 100 exhibits built, then the Enter button
      await page.evaluate(() => window.HyperGallery.enter());
      await expect(page.locator('#enterBtn')).toBeVisible({ timeout: 90_000 });
      await expect(page.locator('#bootLabel')).toHaveText('Ready');
      expect(errors).toEqual([]);
      await ctx.close();
    });
  }
});
