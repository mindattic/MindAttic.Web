// Checks every site must pass: it loads cleanly, talks only to allowed hosts, pulls its assets from the pinned
// MindAttic.UiUx tag, and no longer carries embedded base64 or "all in one file" claims.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { SITES, SITES_ROOT, TEST_MODE, EXPECTED_TAG, ASSET_EXT, siteOrigin, siteUrl } from '../../lib/paths.mjs';
import { MAX_SINGLE_DATA_URI_CHARS, MAX_TOTAL_DATA_URI_CHARS } from '../../lib/budgets.mjs';
import { absOf, loadManifest } from '../../lib/walk.mjs';
import { openSite, loadSite, uiuxUrlsIn, commentsOf } from '../../lib/site-session.mjs';

// Phrases from the retired "everything in one file" philosophy (user decision, MAU-A4): they must not
// come back in comments. Sync-managed UiUx marker blocks are excluded (they belong to the component).
const RETIRED_CLAIMS = [
  /\bone file\b/i, /\bsingle[- ]file\b/i, /no external requests?/i, /base64[- ]inlined/i, /inlined as base64/i,
  /inlined (?:as )?base64/i, /zero (?:external )?dependenc/i, /\bno cdn\b/i, /one http request/i, /self-contained single/i,
];
const VIEWPORTS = [[320, 568], [390, 844], [768, 1024], [1366, 768], [1920, 1080]];
const manifest = loadManifest();

for (const [name, site] of Object.entries(SITES)) {
  test.describe(`${name}`, () => {
    let html = '';
    test.beforeAll(async () => {
      if (TEST_MODE === 'live') html = await (await fetch(site.liveUrl)).text();
      else html = fs.readFileSync(path.join(SITES_ROOT, site.dir, 'index.htm'), 'utf8');
    });

    test('is a well-formed page (doctype, lang, viewport meta, title)', () => {
      expect(html).toMatch(/<!doctype html>/i);
      expect(html).toMatch(/<html[^>]*\blang="[a-z-]+"/i);
      expect(html).toMatch(/<meta[^>]+name="viewport"[^>]+width=device-width/i);
      expect(html).toMatch(/<title>[^<]{2,}<\/title>/i);
    });

    test('loads cleanly: no failed or non-2xx requests, no console errors, no uncaught exceptions', async ({ browser }) => {
      const s = await openSite(browser, site);
      try {
        await loadSite(s);
        expect(s.rec.missingFromTree, 'BLOCKED: the page references UiUx files that are not in the working tree').toEqual([]);
        expect(s.rec.failures, 'network failures').toEqual([]);
        expect(s.rec.badStatus, 'non-2xx responses').toEqual([]);
        expect(s.rec.pageErrors, 'uncaught exceptions').toEqual([]);
        expect(s.rec.consoleErrors, 'console errors').toEqual([]);
      } finally { await s.context.close(); }
    });

    test(`only talks to its own origin and ${site.allowedHosts.join(', ')}`, async ({ browser }) => {
      const s = await openSite(browser, site);
      try {
        await loadSite(s);
        const allowed = new Set([new URL(siteOrigin(site)).host, ...site.allowedHosts]);
        const hosts = [...new Set(s.rec.requests.map((r) => r.host))];
        expect(hosts.filter((h) => !allowed.has(h)), 'requests to hosts outside the allow-list').toEqual([]);
        expect(s.rec.disallowed).toEqual([]);
      } finally { await s.context.close(); }
    });

    test(`pins the expected UiUx tag (${EXPECTED_TAG}) everywhere — never @main, no stale tag left behind`, () => {
      const urls = uiuxUrlsIn(html);
      expect(urls.length, 'BLOCKED/NOT CONVERTED: the page does not reference the MindAttic.UiUx package at all').toBeGreaterThan(0);
      const tags = [...new Set(urls.map((u) => u.tag))];
      expect(tags.filter((t) => !/^V\d+$/.test(t)), 'tags must be whole-number release tags').toEqual([]);
      expect(tags, `pin exactly ${EXPECTED_TAG}`).toEqual([EXPECTED_TAG]);
      expect(html).not.toMatch(/MindAttic\.UiUx@main/);
    });

    test('every UiUx file the HTML references exists in the package (and asset files are listed in the manifest)', () => {
      const urls = [...new Map(uiuxUrlsIn(html).map((u) => [u.path, u])).values()];
      const missing = []; const unlisted = [];
      const listed = new Set((manifest?.files ?? []).map((f) => f.path));
      for (const u of urls) {
        if (!fs.existsSync(absOf(u.path))) { missing.push(u.path); continue; }
        if (ASSET_EXT.has(path.extname(u.path).toLowerCase()) && !listed.has(u.path)) unlisted.push(u.path);
      }
      expect(missing, 'referenced but not in MindAttic.UiUx').toEqual([]);
      expect(unlisted, 'asset files missing from assets-manifest.json — regenerate it').toEqual([]);
    });

    test('opens the jsDelivr connection early (<link rel=preconnect>)', () => {
      expect(html).toMatch(/<link[^>]+rel="preconnect"[^>]+href="https:\/\/cdn\.jsdelivr\.net"/i);
    });

    test('no embedded base64 blobs: HTML size and data: URIs stay within budget', () => {
      expect(Buffer.byteLength(html), `HTML is ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`).toBeLessThanOrEqual(site.htmlBudgetBytes);
      const uris = html.match(/data:[a-z0-9.+/-]+(?:;[a-z0-9=.-]+)*,[A-Za-z0-9+/=%._~-]{200,}/gi) ?? [];
      const big = uris.filter((u) => u.length > MAX_SINGLE_DATA_URI_CHARS).map((u) => `${u.slice(0, 40)}… (${u.length} chars)`);
      expect(big, 'oversized data: URIs — move them to MindAttic.UiUx').toEqual([]);
      expect(uris.reduce((n, u) => n + u.length, 0), 'total data: URI characters').toBeLessThanOrEqual(MAX_TOTAL_DATA_URI_CHARS);
    });

    test('fonts load from the CDN: Outfit (latin) / Attic where used; latin-ext stays unfetched unless needed', async ({ browser }) => {
      const s = await openSite(browser, site);
      try {
        await loadSite(s);
        const faces = await s.page.evaluate(() => [...document.fonts].map((f) => ({ family: f.family.replace(/["']/g, ''), status: f.status, range: f.unicodeRange })));
        const outfitLatin = faces.find((f) => f.family === 'Outfit' && /^U\+0(?:-|000)/i.test(f.range));
        const outfitExt = faces.find((f) => f.family === 'Outfit' && /^U\+100/i.test(f.range));
        const attic = faces.find((f) => f.family === 'Attic');
        if (site.fonts.outfit) {
          expect(outfitLatin?.status, 'Outfit latin must be declared and loaded').toBe('loaded');
          expect(outfitExt?.status, 'Outfit latin-ext should not be downloaded unless a glyph needs it').not.toBe('loaded');
        }
        if (site.fonts.attic) expect(attic?.status, 'Attic must be declared and loaded').toBe('loaded');
        const fontFiles = s.rec.requests.filter((r) => /\.woff2?$/.test(new URL(r.url).pathname));
        expect(fontFiles.every((r) => r.host === 'cdn.jsdelivr.net'), 'fonts must come from the CDN, not be embedded or self-hosted').toBe(true);
        expect(fontFiles.every((r) => r.status === 200)).toBe(true);
      } finally { await s.context.close(); }
    });

    test('no horizontal scrollbar at common viewport sizes', async ({ browser }) => {
      // (ryandebraal.com used to overflow by 118px @320 / 48px @390 because a long skill tag was nowrap; fixed with a
      // narrow-screen wrap rule on .tag, so this now runs as a normal assertion for every site.)
      const s = await openSite(browser, site, { viewport: { width: VIEWPORTS[0][0], height: VIEWPORTS[0][1] } });
      try {
        await loadSite(s, { settleMs: 500 });
        const over = [];
        for (const [w, h] of VIEWPORTS) {
          await s.page.setViewportSize({ width: w, height: h });
          await s.page.waitForTimeout(250);
          const r = await s.page.evaluate(() => ({ doc: document.documentElement.scrollWidth - document.documentElement.clientWidth, body: document.body.scrollWidth - document.documentElement.clientWidth }));
          if (r.doc > 0 || r.body > 0) over.push(`${w}x${h}: documentElement overflows by ${r.doc}px, body by ${r.body}px`);
        }
        expect(over).toEqual([]);
      } finally { await s.context.close(); }
    });

    test('comments no longer make "all in one file / no external requests" claims', () => {
      const comments = commentsOf(html);
      const hits = RETIRED_CLAIMS.flatMap((re) => { const m = comments.match(new RegExp(`^.*${re.source}.*$`, 'gim')); return m ? m.map((l) => l.trim().slice(0, 140)) : []; });
      expect(hits, 'retired philosophy still stated in comments').toEqual([]);
    });
  });
}

// Keep unused-import linters quiet without hiding intent: siteUrl is exercised via openSite().
void siteUrl;
