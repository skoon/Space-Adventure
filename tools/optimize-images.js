#!/usr/bin/env node
/**
 * Offline image optimizer for the viewscreen. Never runs at page load.
 *
 * Reads assets/portraits/<name>.jpg and emits, into assets/images/<folder>/:
 *   <name>.webp        512x512 q80  - viewscreen source
 *   <name>.jpg         512x512 q78  - <picture> fallback
 *   <name>-thumb.webp  128x128 q75  - inline portrait chips
 *
 * Usage: npm run optimize-images
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'assets', 'portraits');
const OUT_DIR = path.join(ROOT, 'assets', 'images');

/** Which subject folder each source image belongs to. Anything unlisted is skipped. */
const SUBJECTS = {
  captain_vance: 'npcs',
  dr_lyra: 'npcs',
  apex: 'npcs',
  merchant: 'npcs',
  xenobot: 'enemies',
  mutated_crewmate: 'enemies',
  eldritch_shade: 'enemies',
  void_stalker: 'enemies',
  cryo_drake: 'enemies',
  magma_elemental: 'enemies',
  corsair_raider: 'enemies',
  plasmavore: 'enemies',
  sand_worm: 'enemies',
  void_sentinel: 'enemies'
};

const FULL_SIZE = 512;
const THUMB_SIZE = 128;
const BUDGET_FULL = 60 * 1024;
const BUDGET_THUMB = 12 * 1024;
const MIN_QUALITY = 45;
const QUALITY_STEP = 5;

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

/**
 * Encode at the requested quality, then step quality down until the file fits
 * the byte budget. The budget is the hard target; quality is the starting point.
 */
async function emit(srcPath, outPath, size, encode, quality, budget) {
  let q = quality;
  let bytes = Infinity;
  while (true) {
    const pipeline = sharp(srcPath).resize(size, size, { fit: 'cover', position: 'attention' });
    await encode(pipeline, q).toFile(outPath);
    bytes = fs.statSync(outPath).size;
    if (bytes <= budget || q <= MIN_QUALITY) break;
    q -= QUALITY_STEP;
  }
  return bytes;
}

async function main() {
  let srcTotal = 0;
  let outTotal = 0;
  const overBudget = [];

  for (const [name, folder] of Object.entries(SUBJECTS)) {
    const srcPath = path.join(SRC_DIR, `${name}.jpg`);
    if (!fs.existsSync(srcPath)) {
      throw new Error(`Missing source image: ${srcPath}`);
    }
    const destDir = path.join(OUT_DIR, folder);
    fs.mkdirSync(destDir, { recursive: true });
    srcTotal += fs.statSync(srcPath).size;

    const webp = await emit(srcPath, path.join(destDir, `${name}.webp`), FULL_SIZE,
      (p, q) => p.webp({ quality: q }), 80, BUDGET_FULL);
    const jpg = await emit(srcPath, path.join(destDir, `${name}.jpg`), FULL_SIZE,
      (p, q) => p.jpeg({ quality: q, mozjpeg: true }), 78, BUDGET_FULL);
    const thumb = await emit(srcPath, path.join(destDir, `${name}-thumb.webp`), THUMB_SIZE,
      (p, q) => p.webp({ quality: q }), 75, BUDGET_THUMB);

    outTotal += webp + jpg + thumb;
    if (webp > BUDGET_FULL) overBudget.push(`${name}.webp ${kb(webp)}`);
    if (jpg > BUDGET_FULL) overBudget.push(`${name}.jpg ${kb(jpg)}`);
    if (thumb > BUDGET_THUMB) overBudget.push(`${name}-thumb.webp ${kb(thumb)}`);

    console.log(`${folder}/${name}: webp ${kb(webp)}, jpg ${kb(jpg)}, thumb ${kb(thumb)}`);
  }

  console.log(`\nsources: ${kb(srcTotal)}  outputs: ${kb(outTotal)}`);
  if (overBudget.length) {
    console.error(`\nOver budget:\n  ${overBudget.join('\n  ')}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
