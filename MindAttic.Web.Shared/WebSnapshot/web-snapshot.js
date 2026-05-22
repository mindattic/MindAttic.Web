// WebSnapshot — capture a fresh snapshot of a URL and write it to disk as a
// base64 data URI. Two source modes:
//   * page   — navigate via Playwright, screenshot the entire viewport,
//              then cover-fit scale + alignment-crop down to the requested
//              output dimensions. The whole page is preserved (just scaled);
//              alignment decides which side to trim when aspect ratios differ.
//   * image  — the URL is already an image; download it as-is, no resize.
// Mode is auto-detected from URL extension / Content-Type.
//
// Optional `handheld` (page mode only): scales to a 10% larger output
// (e.g. 165x247 for a 150x225 request) so the saved image carries its own
// wobble headroom. A sidecar <name>.meta.json records the rest position the
// viewer should park the image at.
//
// The post-load `delayMs` defaults to 5000 so animations, font swaps, and
// async hydration have a chance to settle before the camera fires.

const fs = require('fs/promises');
const path = require('path');

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif|svg|bmp|ico)(\?|#|$)/i;

const HORIZONTAL = { left: 0, center: 0.5, right: 1 };
const VERTICAL   = { top: 0, middle: 0.5, bottom: 1 };

function resolveAlign(align) {
  const parts = String(align || 'center-top').toLowerCase().split('-');
  const h = parts.find(p => p in HORIZONTAL) || 'center';
  const v = parts.find(p => p in VERTICAL)   || 'top';
  return { hRatio: HORIZONTAL[h], vRatio: VERTICAL[v] };
}

async function detectMode(url) {
  if (IMAGE_EXT.test(url)) return 'image';
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (ct.startsWith('image/')) return 'image';
  } catch { /* fall through to page */ }
  return 'page';
}

function metaPathFor(outputPath) {
  return outputPath.replace(/\.b64\.txt$/i, '.meta.json');
}

async function writeMeta(outputPath, meta) {
  await fs.writeFile(metaPathFor(outputPath), JSON.stringify(meta, null, 2), 'utf8');
}

async function clearMeta(outputPath) {
  try { await fs.unlink(metaPathFor(outputPath)); } catch { /* not present */ }
}

async function captureDirectImage({ url, outputPath }) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Direct-image fetch failed (${res.status}): ${url}`);
  const ct = (res.headers.get('content-type') || 'application/octet-stream').split(';')[0].trim();
  const buf = Buffer.from(await res.arrayBuffer());
  const dataUri = `data:${ct};base64,${buf.toString('base64')}`;
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, dataUri, 'utf8');
  await clearMeta(outputPath);
  return { outputPath, mode: 'image', mimeType: ct, byteLength: buf.length, dataUri };
}

async function resizeAndCropInPage(page, { fullDataUri, mimeType, targetW, targetH, hRatio, vRatio }) {
  return page.evaluate(async (args) => {
    const { dataUri, mimeType, targetW, targetH, hRatio, vRatio } = args;
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = () => rej(new Error('decode failed'));
      img.src = dataUri;
    });
    const scale = Math.max(targetW / img.naturalWidth, targetH / img.naturalHeight);
    const scaledW = img.naturalWidth  * scale;
    const scaledH = img.naturalHeight * scale;
    const sx = (scaledW - targetW) * hRatio;
    const sy = (scaledH - targetH) * vRatio;
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, -sx, -sy, scaledW, scaledH);
    return canvas.toDataURL(mimeType, 0.95);
  }, { dataUri: fullDataUri, mimeType, targetW, targetH, hRatio, vRatio });
}

async function capturePageScreenshot(options) {
  const {
    url, outputPath,
    width = 150, height = 225,
    inputWidth, inputHeight,
    align = 'center-top',
    viewport = { width: 1280, height: 1600 },
    waitUntil = 'load',
    delayMs = 5000,
    deviceScaleFactor = 1,
    mimeType = 'image/png',
    handheld = false,
    handheldOverflow = 0.10,
    fullPage = false,
  } = options;

  const { hRatio, vRatio } = resolveAlign(align);
  const inW = inputWidth  ? Math.min(inputWidth,  viewport.width)  : viewport.width;
  const inH = inputHeight ? Math.min(inputHeight, viewport.height) : viewport.height;

  let sourceClip = null;
  if (inW !== viewport.width || inH !== viewport.height) {
    const x = Math.max(0, Math.min(viewport.width  - inW, Math.round((viewport.width  - inW) * hRatio)));
    const y = Math.max(0, Math.min(viewport.height - inH, Math.round((viewport.height - inH) * vRatio)));
    sourceClip = { x, y, width: inW, height: inH };
  }

  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport, deviceScaleFactor, bypassCSP: true });
    const page = await context.newPage();
    await page.goto(url, { waitUntil });
    if (delayMs > 0) await page.waitForTimeout(delayMs);

    const fullBuffer = await page.screenshot({
      type: mimeType === 'image/jpeg' ? 'jpeg' : 'png',
      fullPage,
      ...(sourceClip ? { clip: sourceClip } : {}),
    });

    const targetW = handheld ? Math.round(width  * (1 + handheldOverflow)) : width;
    const targetH = handheld ? Math.round(height * (1 + handheldOverflow)) : height;

    const fullDataUri = `data:${mimeType};base64,${fullBuffer.toString('base64')}`;
    const resizedDataUri = await resizeAndCropInPage(page, {
      fullDataUri, mimeType, targetW, targetH, hRatio, vRatio,
    });

    const buffer = Buffer.from(resizedDataUri.split(',')[1], 'base64');

    let meta = null;
    if (handheld) {
      const halfExcessX = (targetW - width)  / 2;
      const halfExcessY = (targetH - height) / 2;
      meta = {
        mode: 'handheld',
        align,
        overflow: handheldOverflow,
        innerWidth:  width,
        innerHeight: height,
        outerWidth:  targetW,
        outerHeight: targetH,
        restX: -(hRatio - 0.5) * 2 * halfExcessX,
        restY: -(vRatio - 0.5) * 2 * halfExcessY,
        inputWidth:  inW,
        inputHeight: inH,
      };
    }

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, resizedDataUri, 'utf8');
    if (meta) await writeMeta(outputPath, meta);
    else       await clearMeta(outputPath);

    return {
      outputPath, mode: 'page', meta,
      mimeType, byteLength: buffer.length, dataUri: resizedDataUri,
      outputWidth: targetW, outputHeight: targetH,
      inputWidth: inW, inputHeight: inH,
      sourceWidth: viewport.width, sourceHeight: viewport.height,
    };
  } finally {
    await browser.close();
  }
}

async function webSnapshot(options = {}) {
  const { url, outputPath, mode } = options;
  if (!url) throw new Error('webSnapshot: `url` is required');
  if (!outputPath) throw new Error('webSnapshot: `outputPath` is required');

  const resolvedMode = mode || await detectMode(url);
  return resolvedMode === 'image'
    ? captureDirectImage({ url, outputPath })
    : capturePageScreenshot(options);
}

function deriveName(url) {
  try {
    const u = new URL(url);
    const last = u.pathname.split('/').filter(Boolean).pop();
    if (last && /\.[a-z0-9]{2,5}$/i.test(last)) {
      return last.replace(/\.[a-z0-9]{2,5}$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    return (u.hostname || 'snapshot').replace(/^www\./, '').replace(/[^a-z0-9]+/g, '-');
  } catch {
    return 'snapshot';
  }
}

module.exports = { webSnapshot, resolveAlign, detectMode, deriveName };
