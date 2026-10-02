// mindatticcares.com: a three-page single-page site (Home / Child's Play / Y2K playbook). Logos, photos and the
// Outfit font come from the MindAttic.UiUx package; art for the pages the visitor has not opened yet is lazy,
// and the YouTube player is click-to-play (no third-party request until then).
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { SITES, SITES_ROOT, TEST_MODE } from '../../lib/paths.mjs';
import { openSite, loadSite } from '../../lib/site-session.mjs';

const site = SITES['mindatticcares.com'];
const html = TEST_MODE === 'live' ? null : fs.readFileSync(path.join(SITES_ROOT, site.dir, 'index.htm'), 'utf8');
const uiuxReqs = (s) => s.rec.requests.filter((r) => r.url.startsWith('https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@'));
const relOf = (url) => url.replace(/^.*MindAttic\.UiUx@[^/]+\//, '');

test.describe('mindatticcares.com — static analysis', () => {
  test.skip(!html, 'reads the HTML from the working tree (local mode)');

  test('every <img> declares width and height (no layout shift) and alt text, and below-the-fold images are lazy', () => {
    const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
    expect(imgs.length).toBeGreaterThan(3);
    const problems = [];
    for (const tag of imgs) {
      const src = tag.match(/\ssrc="([^"]+)"/)?.[1] ?? '?';
      if (!/\swidth="\d+"/.test(tag) || !/\sheight="\d+"/.test(tag)) problems.push(`${src}: missing width/height`);
      if (!/\salt="/.test(tag)) problems.push(`${src}: missing alt`);
    }
    expect(problems).toEqual([]);
    const lazyNeeded = ['childs-play-logo.png', 'childs-play-video-poster.jpg', 'y2k-end-of-the-world-party-960.jpg'];
    for (const f of lazyNeeded) expect(imgs.find((t) => t.includes(f)), `${f} should be loading="lazy"`).toMatch(/loading="lazy"/);
  });

  test('the hero logo is fetched with high priority and the browser/touch icons come from the package', () => {
    expect(html).toMatch(/<img[^>]+m-cares-black-red-transparent-720\.png[^>]+fetchpriority="high"/);
    expect(html).toMatch(/<link rel="icon"[^>]+UiUx@V\d+\/mindatticcares\.com\/icons\/m-cares-icon-96\.png/);
    expect(html).toMatch(/<link rel="apple-touch-icon"[^>]+UiUx@V\d+\/mindatticcares\.com\/icons\//);
  });

  test('external links open safely (target=_blank + rel=noopener)', () => {
    const external = [...html.matchAll(/<a\b[^>]*href="https?:\/\/(?!cdn\.jsdelivr)[^"]+"[^>]*>/g)].map((m) => m[0]);
    expect(external.length).toBeGreaterThan(0);
    for (const a of external) { expect(a).toContain('target="_blank"'); expect(a).toMatch(/rel="[^"]*noopener/); }
  });
});

test.describe('mindatticcares.com — runtime asset loading', () => {
  test('first paint (Home) fetches only the Home art, the icon, the background and the Outfit latin font', async ({ browser }) => {
    const s = await openSite(browser, site);
    try {
      await loadSite(s, { settleMs: 800 });
      const files = new Set(uiuxReqs(s).map((r) => relOf(r.url)));
      const allowedAtLoad = new Set([
        'fonts/outfit/outfit-latin.woff2',
        'mindatticcares.com/icons/m-cares-icon-96.png',
        'mindatticcares.com/images/background-abstract-light-1500x500.png',
        'mindatticcares.com/logos/m-cares-black-red-transparent-300.png',
        'mindatticcares.com/logos/m-cares-black-red-transparent-720.png',
      ]);
      expect([...files].filter((f) => !allowedAtLoad.has(f)), 'art for pages the visitor has not opened must stay lazy').toEqual([]);
      for (const need of ['fonts/outfit/outfit-latin.woff2', 'mindatticcares.com/logos/m-cares-black-red-transparent-720.png']) expect(files.has(need), `${need} should load on first paint`).toBe(true);
      expect(uiuxReqs(s).every((r) => r.status === 200)).toBe(true);
    } finally { await s.context.close(); }
  });

  test('navigation switches pages, updates the hash, and fetches that page\'s art on demand', async ({ browser }) => {
    const s = await openSite(browser, site);
    try {
      await loadSite(s, { settleMs: 500 });
      await expect(s.page.locator('#home')).toHaveClass(/active/);

      const before = uiuxReqs(s).length;
      await s.page.locator('header nav a[data-page="childs-play"]').click();
      await expect(s.page.locator('#childs-play')).toHaveClass(/active/);
      expect(new URL(s.page.url()).hash).toBe('#childs-play');
      await expect.poll(() => uiuxReqs(s).slice(before).map((r) => relOf(r.url)), { timeout: 10_000 })
        .toEqual(expect.arrayContaining(['mindatticcares.com/logos/childs-play-logo.png', 'mindatticcares.com/images/childs-play-video-poster.jpg']));

      const before2 = uiuxReqs(s).length;
      await s.page.locator('header nav a[data-page="y2k"]').click();
      await expect(s.page.locator('#y2k')).toHaveClass(/active/);
      await expect.poll(() => uiuxReqs(s).slice(before2).some((r) => /y2k-end-of-the-world-party(-960)?\.jpg$/.test(r.url) && r.status === 200), { timeout: 10_000 }).toBe(true);

      await s.page.locator('header nav a[data-page="home"]').click();
      await expect(s.page.locator('#home')).toHaveClass(/active/);
      expect(s.rec.badStatus).toEqual([]);
      expect(s.rec.pageErrors).toEqual([]);
    } finally { await s.context.close(); }
  });

  test('deep links work: #y2k and an in-page anchor (#sec-budget) open the Y2K playbook', async ({ browser }) => {
    for (const hash of ['#y2k', '#sec-budget']) {
      const s = await openSite(browser, site);
      try {
        await s.page.goto(`${s.url}${hash}`, { waitUntil: 'load' });
        await s.page.evaluate(() => document.fonts.ready);
        await expect(s.page.locator('#y2k')).toHaveClass(/active/);
        expect(s.rec.pageErrors).toEqual([]);
      } finally { await s.context.close(); }
    }
  });

  test('the video is click-to-play: no YouTube request until the poster is clicked', async ({ browser }) => {
    const s = await openSite(browser, site);
    try {
      // The player iframe is the one thing allowed to leave the allow-list, and only after a click. Stub it.
      await s.page.route('https://www.youtube-nocookie.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><p>video stub</p>' }));
      await loadSite(s, { settleMs: 500 });
      await s.page.locator('header nav a[data-page="childs-play"]').click();
      expect(s.rec.requests.filter((r) => /youtube/.test(r.host)), 'YouTube must not be contacted before the click').toEqual([]);
      await s.page.locator('.video[data-yt]').click();
      const src = await s.page.locator('.video iframe').getAttribute('src');
      expect(src).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/NG4IISU4-iQ\?/);
      expect(src).toContain('autoplay=1');
    } finally { await s.context.close(); }
  });
});
