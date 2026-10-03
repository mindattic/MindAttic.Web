// Where things live, and which files count as "assets". Kept in one place so tests, the baseline
// tool and tools/build-asset-manifest.ps1 (which must use the same roots + extensions) stay aligned.
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/** The MindAttic.UiUx working tree (this repo). */
export const UIUX_ROOT = path.resolve(here, '..', '..');
/** Directory that contains the sibling site repos (mindattic.com, ryandebraal.com, mindatticcares.com). */
export const SITES_ROOT = process.env.SITES_ROOT ? path.resolve(process.env.SITES_ROOT) : path.resolve(UIUX_ROOT, '..');

export const TEST_MODE = process.env.TEST_MODE === 'live' ? 'live' : 'local';
/**
 * The release tag every site is expected to pin: UIUX_TAG if set, otherwise the highest whole-number `V<n>` tag
 * in this repo (numeric, so V10 > V9) — the same rule MindAttic.Deploy's linked deploy uses when it pins the
 * sites — so the expectation never goes stale after a release. Falls back to 'V7' only when git or the tags
 * are unavailable (e.g. a shallow, tagless CI checkout — use `fetch-depth: 0` or set UIUX_TAG there).
 */
function latestWholeNumberTag() {
  try {
    const out = execFileSync('git', ['-C', UIUX_ROOT, 'tag', '--list', 'V*'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const nums = out.split(/\r?\n/).map((t) => t.trim().match(/^V(\d+)$/)).filter(Boolean).map((m) => Number(m[1]));
    return nums.length ? `V${Math.max(...nums)}` : null;
  } catch { return null; }
}
export const EXPECTED_TAG = process.env.UIUX_TAG || latestWholeNumberTag() || 'V7';

export const CDN_HOST = 'cdn.jsdelivr.net';
export const CDN_BASE = (tag) => `https://${CDN_HOST}/gh/mindattic/MindAttic.UiUx@${tag}/`;
/** Matches a UiUx file URL anywhere in a page's source. Groups: 1 = tag, 2 = path. */
export const UIUX_URL_RE = /https:\/\/cdn\.jsdelivr\.net\/gh\/mindattic\/MindAttic\.UiUx@([^/"'\s)<>]+)\/([^"'\s)<>?#]+)/g;

/**
 * Asset roots, relative to UIUX_ROOT. A domain's own folder IS its asset root (there is no assets/ level);
 * fonts/ holds web fonts shared by several sites; Components/Cyberspace/assets/ holds the component-owned
 * parallax textures. Non-asset files that may sit in these folders are ignored via ASSET_EXT.
 */
export const DOMAIN_ROOTS = ['mindattic.com', 'mindatticcares.com', 'ryandebraal.com'];
export const ASSET_ROOTS = [...DOMAIN_ROOTS, 'fonts', 'Components/Cyberspace/assets'];
export const ASSET_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.ico', '.svg',
  '.woff2', '.woff', '.ttf', '.otf', '.mp3', '.ogg', '.mp4', '.webm', '.json',
]);

export const SITES = {
  'mindattic.com': {
    dir: 'mindattic.com',
    liveUrl: 'https://mindattic.com/',
    // Hosts the page itself may request. (Links the user clicks are not page requests.)
    allowedHosts: [CDN_HOST],
    htmlBudgetBytes: 120 * 1024,
    fonts: { outfit: true, attic: true },
  },
  'ryandebraal.com': {
    dir: 'ryandebraal.com',
    liveUrl: 'https://ryandebraal.com/',
    allowedHosts: [CDN_HOST],
    htmlBudgetBytes: 560 * 1024,
    fonts: { outfit: true, attic: false },
  },
  'mindatticcares.com': {
    dir: 'mindatticcares.com',
    // mindatticcares.com is a registrar 'masked forward' (a frameset) to this URL, so the real page lives here:
    liveUrl: 'https://ryandebraal.com/mindatticcares.com/',
    allowedHosts: [CDN_HOST],
    htmlBudgetBytes: 120 * 1024,
    fonts: { outfit: true, attic: false },
  },
};

export const LOCAL_ORIGIN = 'http://127.0.0.1:4173';
export const siteUrl = (site) => (TEST_MODE === 'live' ? site.liveUrl : `${LOCAL_ORIGIN}/${site.dir}/index.htm`);
export const siteOrigin = (site) => new URL(siteUrl(site)).origin;
