// Does MindAttic.UiUx contain what the sites need, in the shape docs/ASSETS.md promises?
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { UIUX_ROOT, DOMAIN_ROOTS } from '../../lib/paths.mjs';
import { walk, posix } from '../../lib/walk.mjs';

const REQUIRED = [
  // shared web fonts + the TTF sources they were built from
  'fonts/outfit/outfit-latin.woff2', 'fonts/outfit/outfit-latin-ext.woff2',
  'fonts/attic/attic.woff2',
  // Cyberspace engine + styles + textures + SacredGeometry catalogue (loaded by every Cyberspace host)
  'Components/Cyberspace/console-bg.js', 'Components/Cyberspace/frontpage.css', 'Components/Cyberspace/frontpage.html',
  'Components/Cyberspace/loader.js', 'Components/Cyberspace/tv-static.js', 'Components/Cyberspace/home-bg.js',
  'Components/Cyberspace/assets/circuitboard.00.png', 'Components/Cyberspace/assets/circuitboard.01.png', 'Components/Cyberspace/assets/circuitboard.02.png',
  'Components/SacredGeometry/sacred-geometry.js',
  // mindattic.com
  'mindattic.com/logos/m-monogram.png', 'mindattic.com/logos/m-icon-16.png', 'mindattic.com/logos/favicon.ico',
  // ryandebraal.com
  'ryandebraal.com/images/ryan-avatar.png', 'ryandebraal.com/images/ryan-portrait.png', 'ryandebraal.com/themes/noir/noir-moon.png',
  ...[...Array(20)].flatMap((_, i) => { const n = String(i + 1).padStart(2, '0'); return [`ryandebraal.com/themes/sunset/sunset-${n}.jpg`, `ryandebraal.com/themes/sakura/sakura-${n}.jpg`]; }),
];

test.describe('package layout', () => {
  for (const rel of REQUIRED) {
    test(`has ${rel}`, () => {
      const abs = path.join(UIUX_ROOT, ...rel.split('/'));
      expect(fs.existsSync(abs), `${rel} is missing from the MindAttic.UiUx tree`).toBe(true);
      expect(fs.statSync(abs).size, `${rel} is empty`).toBeGreaterThan(0);
    });
  }

  test('every web font family keeps the TTF it was built from (fonts/<family>/*.ttf or fonts/<family>/src/*.ttf)', () => {
    const fontsDir = path.join(UIUX_ROOT, 'fonts');
    const missing = [];
    for (const fam of fs.readdirSync(fontsDir, { withFileTypes: true }).filter((e) => e.isDirectory())) {
      const files = walk(path.join(fontsDir, fam.name)).map((f) => path.basename(f));
      if (files.some((f) => f.endsWith('.woff2')) && !files.some((f) => f.endsWith('.ttf'))) missing.push(`fonts/${fam.name}/ has no .ttf source`);
    }
    expect(missing, 'woff2 families without their TTF source').toEqual([]);
  });

  test('every domain folder that the sites use has content in at least one category folder', () => {
    const empty = DOMAIN_ROOTS.filter((d) => walk(path.join(UIUX_ROOT, d)).length === 0);
    expect(empty, 'domain folder is empty: copy its assets in').toEqual([]);
  });

  test('domain folders have no assets/ level (assets live directly under <domain>/<category>/)', () => {
    const offenders = DOMAIN_ROOTS.filter((d) => fs.existsSync(path.join(UIUX_ROOT, d, 'assets')));
    expect(offenders, 'remove the assets/ level: ryandebraal.com/assets/x -> ryandebraal.com/x').toEqual([]);
  });

  test('every domain folder is split into category folders, not loose files', () => {
    const loose = [];
    for (const d of DOMAIN_ROOTS) {
      const dir = path.join(UIUX_ROOT, d);
      if (!fs.existsSync(dir)) continue;
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) if (e.isFile() && /\.(png|jpe?g|gif|ico|svg|woff2?)$/i.test(e.name)) loose.push(`${d}/${e.name}`);
    }
    expect(loose, 'assets must sit in a category folder (logos/, icons/, images/, themes/<name>/)').toEqual([]);
  });

  test('no stray junk files in the repo root or the asset folders', () => {
    const JUNK = [/^\.DS_Store$/i, /^Thumbs\.db$/i, /^desktop\.ini$/i, /\.(tmp|bak|orig|rej|swp)$/i, /~$/, /^_(test|harness)[^/]*\.html?$/i];
    const roots = [UIUX_ROOT, ...['fonts', 'Components/Cyberspace/assets', ...DOMAIN_ROOTS].map((r) => path.join(UIUX_ROOT, r))];
    const found = [];
    for (const r of roots) {
      const files = r === UIUX_ROOT ? fs.readdirSync(r, { withFileTypes: true }).filter((e) => e.isFile()).map((e) => path.join(r, e.name)) : walk(r);
      for (const f of files) if (JUNK.some((re) => re.test(path.basename(f)))) found.push(posix(path.relative(UIUX_ROOT, f)));
    }
    expect(found).toEqual([]);
  });
});
