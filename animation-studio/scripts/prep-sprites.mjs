// Cut every figure out of a ChatGPT sprite sheet (figures on a flat #BDB8AE-like background) into its own
// transparent PNG, in reading order (rows top to bottom, left to right).
//
//   node scripts/prep-sprites.mjs <sheet.png> <out dir under public/> name1 name2 ...
//
// The background colour is sampled from the sheet's corners and flood-filled from the border; blobs smaller than
// 0.2% of the sheet are ignored (specks). Each sprite is trimmed with a small margin. Prints the boxes it found.
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const [sheet, outDir, ...names] = process.argv.slice(2);
if (!sheet || !outDir || !names.length) {
  console.error('Usage: node scripts/prep-sprites.mjs <sheet.png> <out dir under public/> name1 name2 ...');
  process.exit(1);
}
const {data, info} = await sharp(sheet).ensureAlpha().raw().toBuffer({resolveWithObject: true});
const w = info.width, h = info.height;
const at = (p) => [data[p * 4], data[p * 4 + 1], data[p * 4 + 2]];
const corners = [0, w - 1, (h - 1) * w, h * w - 1].map(at);
const bg = [0, 1, 2].map((c) => corners.reduce((s, k) => s + k[c], 0) / 4);
const dist = (p) => Math.hypot(data[p * 4] - bg[0], data[p * 4 + 1] - bg[1], data[p * 4 + 2] - bg[2]);

// background = flood fill from the border + any large near-exact background pocket
const isBg = new Uint8Array(w * h);
const fill = (seeds, tol) => {
  const stack = [...seeds];
  while (stack.length) {
    const p = stack.pop();
    if (isBg[p] || dist(p) > tol) continue;
    isBg[p] = 1;
    const x = p % w, y = (p / w) | 0;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - w);
    if (y < h - 1) stack.push(p + w);
  }
};
const border = [];
for (let x = 0; x < w; x++) border.push(x, (h - 1) * w + x);
for (let y = 0; y < h; y++) border.push(y * w, y * w + w - 1);
fill(border, 34);
for (let p = 0; p < w * h; p++) if (!isBg[p] && dist(p) < 8) fill([p], 20);
for (let p = 0; p < w * h; p++) if (isBg[p]) data[p * 4 + 3] = 0;

// connected foreground blobs
const label = new Int32Array(w * h).fill(-1);
const boxes = [];
for (let p = 0; p < w * h; p++) {
  if (isBg[p] || label[p] >= 0) continue;
  const id = boxes.length;
  let x0 = w, y0 = h, x1 = 0, y1 = 0, n = 0;
  const stack = [p];
  label[p] = id;
  while (stack.length) {
    const q = stack.pop();
    n++;
    const x = q % w, y = (q / w) | 0;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    for (const r of [x > 0 ? q - 1 : -1, x < w - 1 ? q + 1 : -1, y > 0 ? q - w : -1, y < h - 1 ? q + w : -1]) {
      if (r >= 0 && !isBg[r] && label[r] < 0) { label[r] = id; stack.push(r); }
    }
  }
  boxes.push({x0, y0, x1, y1, n});
}
// keep big blobs; merge blobs whose boxes overlap (a banner or spear tip detached from the figure)
let big = boxes.filter((b) => b.n > w * h * 0.002);
let merged = true;
while (merged) {
  merged = false;
  for (let i = 0; i < big.length && !merged; i++) for (let j = i + 1; j < big.length && !merged; j++) {
    const a = big[i], b = big[j];
    if (a.x0 <= b.x1 + 6 && b.x0 <= a.x1 + 6 && a.y0 <= b.y1 + 6 && b.y0 <= a.y1 + 6) {
      big[i] = {x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1), n: a.n + b.n};
      big.splice(j, 1);
      merged = true;
    }
  }
}
// reading order: group into rows by vertical centre
big.sort((a, b) => (a.y0 + a.y1) - (b.y0 + b.y1));
const rows = [];
for (const b of big) {
  const cy = (b.y0 + b.y1) / 2;
  const row = rows.find((r) => Math.abs(r.cy - cy) < h * 0.15);
  if (row) row.items.push(b); else rows.push({cy, items: [b]});
}
const ordered = rows.flatMap((r) => r.items.sort((a, b) => a.x0 - b.x0));
console.log(`found ${ordered.length} figures (asked for ${names.length})`);
const dest = path.join('public', outDir);
fs.mkdirSync(dest, {recursive: true});
const rgba = await sharp(data, {raw: {width: w, height: h, channels: 4}}).png().toBuffer();
for (const [i, b] of ordered.entries()) {
  const name = names[i] ?? `extra_${i}`;
  const m = 4;
  const left = Math.max(0, b.x0 - m), top = Math.max(0, b.y0 - m);
  const width = Math.min(w - left, b.x1 - b.x0 + 2 * m), height = Math.min(h - top, b.y1 - b.y0 + 2 * m);
  await sharp(rgba).extract({left, top, width, height}).png().toFile(path.join(dest, `${name}.png`));
  console.log(`${name}: ${left},${top} ${width}x${height}`);
}
