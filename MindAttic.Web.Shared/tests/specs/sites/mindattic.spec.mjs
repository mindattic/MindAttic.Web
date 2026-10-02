// mindattic.com: centered wordmark + three equal-width link buttons whose combined width equals the wordmark's,
// no scrollbar at any size/aspect ratio, a fixed footer, and tap-anywhere-spawns-a-Cyberspace-effect.
import { test, expect } from '@playwright/test';
import { SITES } from '../../lib/paths.mjs';
import { openSite, loadSite } from '../../lib/site-session.mjs';

const site = SITES['mindattic.com'];
const VIEWPORTS = [[320, 568], [390, 844], [568, 320], [768, 1024], [1366, 768], [1920, 1080], [3440, 1440], [1920, 300], [400, 1920], [120, 600]]
  .map(([width, height]) => ({ width, height }));
const LINKS = [
  { text: 'Résumé', href: 'https://ryandebraal.com' },
  { text: 'GitHub', href: 'https://github.com/mindattic' },
  { text: 'MindAttic Cares', href: 'https://mindatticcares.com' },
];

const measure = () => {
  const btns = [...document.querySelectorAll('.link-btn')].map((b) => b.getBoundingClientRect());
  const rg = document.createRange(); rg.selectNodeContents(document.getElementById('site-name'));
  const word = rg.getBoundingClientRect();
  const lock = document.querySelector('.lockup').getBoundingClientRect();
  const de = document.documentElement; const bd = document.body;
  const foot = document.getElementById('site-footer'); const fr = foot.getBoundingClientRect();
  return {
    w: window.innerWidth, h: window.innerHeight, n: btns.length,
    widths: btns.map((b) => b.width), left: btns[0]?.left, right: btns[btns.length - 1]?.right, wordWidth: word.width,
    lock: { l: lock.left, r: lock.right, t: lock.top, b: lock.bottom },
    scroll: { docX: de.scrollWidth - de.clientWidth, docY: de.scrollHeight - de.clientHeight, bodyX: bd.scrollWidth - bd.clientWidth, bodyY: bd.scrollHeight - bd.clientHeight, gutter: window.innerWidth - de.clientWidth },
    footer: { position: getComputedStyle(foot).position, bottomGap: window.innerHeight - fr.bottom, text: foot.innerText.replace(/\s+/g, ' ').trim() },
  };
};

test.describe('mindattic.com — structure', () => {
  test('main landmark is a <div role=main> (a <main> would become a full-screen Cyberspace keepout); the lockup is the keepout', async ({ browser }) => {
    const s = await openSite(browser, site);
    try {
      await loadSite(s, { settleMs: 300 });
      const r = await s.page.evaluate(() => ({
        mains: document.querySelectorAll('main').length,
        landmark: document.querySelector('#content')?.getAttribute('role'),
        landmarkTag: document.querySelector('#content')?.tagName,
        keepout: document.querySelectorAll('.lockup.cyberspace-keepout').length,
      }));
      expect(r).toEqual({ mains: 0, landmark: 'main', landmarkTag: 'DIV', keepout: 1 });
    } finally { await s.context.close(); }
  });

  test('the three links: correct labels, hrefs, target=_blank and rel=noopener', async ({ browser }) => {
    const s = await openSite(browser, site);
    try {
      await loadSite(s, { settleMs: 300 });
      const links = await s.page.evaluate(() => [...document.querySelectorAll('.link-btn')].map((a) => ({ text: a.textContent.trim(), href: a.getAttribute('href'), target: a.getAttribute('target'), rel: a.getAttribute('rel') })));
      expect(links.map((l) => l.text)).toEqual(LINKS.map((l) => l.text));
      links.forEach((l, i) => { expect(l.href).toBe(LINKS[i].href); expect(l.target).toBe('_blank'); expect(l.rel).toMatch(/noopener/); });
    } finally { await s.context.close(); }
  });

  test('the Cyberspace engine scripts are deferred (they must never block the first paint)', async ({ browser }) => {
    const s = await openSite(browser, site);
    try {
      await loadSite(s, { settleMs: 300 });
      const d = await s.page.evaluate(() => ['mindattic-components-cyberspace-console-bg-js', 'mindattic-components-cyberspace-sacred-geometry-js'].map((id) => { const e = document.getElementById(id); return e ? e.defer : null; }));
      expect(d).toEqual([true, true]);
    } finally { await s.context.close(); }
  });

  test('parallax textures and both fonts are preloaded', async ({ browser }) => {
    const s = await openSite(browser, site);
    try {
      await loadSite(s, { settleMs: 300 });
      const pre = await s.page.evaluate(() => [...document.querySelectorAll('link[rel=preload]')].map((l) => ({ as: l.as, href: l.href, prio: l.getAttribute('fetchpriority'), cors: l.crossOrigin })));
      expect(pre.filter((p) => p.as === 'image' && /circuitboard\.0[012]\.png$/.test(p.href) && p.prio === 'low').length).toBe(3);
      expect(pre.some((p) => p.as === 'font' && /attic\.woff2$/.test(p.href) && p.cors !== null)).toBe(true);
      expect(pre.some((p) => p.as === 'font' && /outfit-latin\.woff2$/.test(p.href) && p.cors !== null)).toBe(true);
    } finally { await s.context.close(); }
  });
});

test.describe('mindattic.com — layout is exact at every size and aspect ratio', () => {
  let s;
  test.beforeAll(async ({ browser }) => {
    s = await openSite(browser, site, { viewport: VIEWPORTS[4] });
    await loadSite(s, { settleMs: 500 });
  });
  test.afterAll(async () => { await s?.context.close(); });

  for (const vp of VIEWPORTS) {
    test(`${vp.width}x${vp.height}`, async () => {
      await s.page.setViewportSize(vp);
      await s.page.evaluate(() => document.fonts.ready);
      await s.page.waitForTimeout(200);
      const m = await s.page.evaluate(measure);
      expect(m.n, 'three link buttons').toBe(3);
      // equal-width buttons
      expect(Math.max(...m.widths) - Math.min(...m.widths), `button widths ${m.widths.map((x) => x.toFixed(2))}`).toBeLessThanOrEqual(0.5);
      // combined width == wordmark text width
      expect(Math.abs((m.right - m.left) - m.wordWidth), `buttons ${(m.right - m.left).toFixed(2)}px vs wordmark ${m.wordWidth.toFixed(2)}px`).toBeLessThanOrEqual(0.5);
      // lockup fully on-screen
      expect(m.lock.l).toBeGreaterThanOrEqual(-0.5); expect(m.lock.t).toBeGreaterThanOrEqual(-0.5);
      expect(m.lock.r).toBeLessThanOrEqual(m.w + 0.5); expect(m.lock.b).toBeLessThanOrEqual(m.h + 0.5);
      // and centered both ways
      expect(Math.abs((m.lock.l + m.lock.r) / 2 - m.w / 2), 'horizontal centering').toBeLessThanOrEqual(1);
      expect(Math.abs((m.lock.t + m.lock.b) / 2 - m.h / 2), 'vertical centering').toBeLessThanOrEqual(1);
      // no scrollbars at all
      expect(m.scroll, 'scroll overflow').toEqual({ docX: 0, docY: 0, bodyX: 0, bodyY: 0, gutter: 0 });
      // footer fixed to the bottom edge
      expect(m.footer.position).toBe('fixed');
      expect(Math.abs(m.footer.bottomGap)).toBeLessThanOrEqual(1);
      expect(m.footer.text).toMatch(/© \d{4} MindAttic LLC/);
    });
  }

  test('typography: wordmark in Attic, buttons in Outfit, button text white at rest and on hover', async () => {
    await s.page.setViewportSize({ width: 1366, height: 768 });
    const fam = await s.page.evaluate(() => ({ word: getComputedStyle(document.getElementById('site-name')).fontFamily, btn: getComputedStyle(document.querySelector('.link-btn')).fontFamily, colors: [...document.querySelectorAll('.link-btn')].map((b) => getComputedStyle(b).color) }));
    expect(fam.word).toMatch(/^"?Attic"?/);
    expect(fam.btn).toMatch(/^"?Outfit"?/);
    expect(fam.colors).toEqual(['rgb(255, 255, 255)', 'rgb(255, 255, 255)', 'rgb(255, 255, 255)']);
    for (let i = 0; i < 3; i++) {
      await s.page.locator('.link-btn').nth(i).hover();
      await s.page.waitForTimeout(350); // let the hover transition finish
      expect(await s.page.locator('.link-btn').nth(i).evaluate((e) => getComputedStyle(e).color), `hover colour of link ${i}`).toBe('rgb(255, 255, 255)');
    }
  });
});

test.describe('mindattic.com — Cyberspace', () => {
  test('the engine exposes every effect the tap handler uses', async ({ browser }) => {
    const s = await openSite(browser, site);
    try {
      await loadSite(s);
      const missing = await s.page.evaluate(() => {
        const fx = window.consoleBg && window.consoleBg._demo;
        const need = ['spawnError', 'spawnWarning', 'spawnWindow', 'spawnMemo', 'spawnFrag', 'spawnArtifact', 'spawnGeoWindow', 'spawnNetConnect', 'spawnMorseDot', 'spawnFolderRip', 'spawnCascade', 'spawnArtifactPredator', 'setAutoSpawn'];
        return fx ? need.filter((n) => typeof fx[n] !== 'function') : ['window.consoleBg._demo'];
      });
      expect(missing).toEqual([]);
      expect(await s.page.locator('.console-bg-host').count(), 'Cyberspace host layer').toBe(1);
      expect(await s.page.locator('canvas.cyberspace-tex').count(), 'parallax texture canvas').toBe(1);
    } finally { await s.context.close(); }
  });

  test('tapping empty space spawns an effect (most taps), without help from the auto-spawner', async ({ browser }) => {
    const s = await openSite(browser, site, { viewport: { width: 1000, height: 700 } });
    try {
      await loadSite(s);
      await s.page.evaluate(() => {
        window.consoleBg._demo.setAutoSpawn(false);
        window.__added = 0;
        new MutationObserver((ml) => { for (const m of ml) window.__added += m.addedNodes.length; }).observe(document.querySelector('.console-bg-host'), { childList: true }); // direct children only: one per spawned effect (lines typed inside an existing window do not count)
      });
      await s.page.waitForTimeout(1500); // let anything already scheduled finish
      const lock = await s.page.evaluate(() => { const r = document.querySelector('.lockup').getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom }; });
      const taps = [];
      for (let i = 0; taps.length < 15; i++) {
        const x = 40 + ((i * 197) % 920); const y = 40 + ((i * 131) % 560);
        if (!(x > lock.l - 20 && x < lock.r + 20 && y > lock.t - 20 && y < lock.b + 20)) taps.push([x, y]);
      }
      let hits = 0;
      for (const [x, y] of taps) {
        const before = await s.page.evaluate(() => window.__added);
        await s.page.mouse.click(x, y);
        await s.page.waitForTimeout(250);
        if ((await s.page.evaluate(() => window.__added)) > before) hits++;
      }
      expect(hits, `${hits}/15 taps spawned an effect`).toBeGreaterThanOrEqual(12);
      expect(s.rec.pageErrors).toEqual([]);
    } finally { await s.context.close(); }
  });

  test('tapping a link opens that site in a new window and spawns no effect', async ({ browser }) => {
    const s = await openSite(browser, site, { viewport: { width: 1000, height: 700 } });
    try {
      await loadSite(s);
      await s.page.evaluate(() => {
        window.consoleBg._demo.setAutoSpawn(false);
        window.__added = 0;
        new MutationObserver((ml) => { for (const m of ml) window.__added += m.addedNodes.length; }).observe(document.querySelector('.console-bg-host'), { childList: true }); // direct children only: one per spawned effect (lines typed inside an existing window do not count)
      });
      await s.page.waitForTimeout(1500);
      for (let i = 0; i < LINKS.length; i++) {
        const [popup] = await Promise.all([s.context.waitForEvent('page'), s.page.locator('.link-btn').nth(i).click()]);
        await popup.waitForLoadState('domcontentloaded');
        expect(popup.url().replace(/\/$/, ''), `link ${i} (${LINKS[i].text})`).toBe(LINKS[i].href);
        await popup.close();
      }
      await s.page.waitForTimeout(500);
      expect(await s.page.evaluate(() => window.__added), 'link taps must not spawn effects').toBe(0);
      expect(s.rec.navigations.map((u) => u.replace(/\/$/, '')).sort(), 'every external navigation was intercepted').toEqual(LINKS.map((l) => l.href).sort());
    } finally { await s.context.close(); }
  });
});
