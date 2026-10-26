// Cuts the Neeraj/Boxer pose sheet into transparent PNGs: public/fight/<pose>.png + poses.json
// Usage: node scripts/prep-fight.mjs
import sharp from 'sharp';
import fs from 'fs';

const SRC = 'assets/incoming/fight_sheet.png';
const OUT = 'public/fight';
fs.mkdirSync(OUT, {recursive: true});

// pose -> [x range (inclusive) and y range] on the 1536x1024 sheet; labels are excluded.
const POSES = {
  n_idle: [5, 275, 35, 500],
  n_windup: [285, 560, 35, 500],
  n_punch: [562, 950, 35, 500],
  n_follow: [886, 1285, 35, 500],
  n_stand: [1295, 1475, 35, 500],
  b_guard: [0, 160, 570, 940],
  b_surprise: [172, 333, 570, 940],
  b_counter: [334, 560, 570, 940],
  b_block: [561, 700, 570, 940],
  b_broken: [701, 935, 570, 940],
  b_grabbed: [945, 1100, 570, 940],
  b_jawhit: [1135, 1322, 570, 940],
  b_injured: [1323, 1515, 570, 940],
};

const {data, info} = await sharp(SRC).ensureAlpha().raw().toBuffer({resolveWithObject: true});
const w = info.width, h = info.height;
const bg = [data[0], data[1], data[2]];
const isFg = (p) => Math.hypot(data[p * 4] - bg[0], data[p * 4 + 1] - bg[1], data[p * 4 + 2] - bg[2]) > 38;
const meta = {};
const gl = new Int32Array(w * h); let gn = 0;
for (let s0 = 0; s0 < w * h; s0++) {
  if (gl[s0]) continue;
  const yy = (s0 / w) | 0;
  if (!isFg(s0) || (yy > 500 && yy < 545) || (yy > 940 && yy < 985)) continue;
  gn++; const st = [s0]; gl[s0] = gn;
  while (st.length) {
    const p = st.pop(); const x = p % w, y = (p / w) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const q = ny * w + nx; if (!gl[q] && isFg(q) && !((ny > 500 && ny < 545) || (ny > 940 && ny < 985))) { gl[q] = gn; st.push(q); }
    }
  }
}

for (const [name, [x0, x1, y0, y1]] of Object.entries(POSES)) {
  // foreground pixels in the box, keep only blobs that are big or sit near the main body
  const mask = new Uint8Array(w * h);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (isFg(y * w + x)) mask[y * w + x] = 1;
  const seen = new Uint8Array(w * h);
  const blobs = [];
  for (let s = 0; s < w * h; s++) {
    if (!mask[s] || seen[s]) continue;
    const st = [s]; seen[s] = 1; const px = [];
    while (st.length) {
      const p = st.pop(); px.push(p);
      const x = p % w, y = (p / w) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy; if (nx < x0 || nx > x1 || ny < y0 || ny > y1) continue;
        const q = ny * w + nx; if (mask[q] && !seen[q]) { seen[q] = 1; st.push(q); }
      }
    }
    blobs.push(px);
  }
  blobs.sort((a, b) => b.length - a.length);
  const main = gl[blobs[0][0]];
  const keep = blobs.filter((b) => b.length > 150 && gl[b[0]] === main);
  let bx0 = w, bx1 = 0, by0 = h, by1 = 0;
  for (const b of keep) for (const p of b) { const x = p % w, y = (p / w) | 0; bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); }
  const cw = bx1 - bx0 + 1, ch = by1 - by0 + 1;
  const buf = Buffer.alloc(cw * ch * 4);
  for (const b of keep) for (const p of b) {
    const x = (p % w) - bx0, y = ((p / w) | 0) - by0, i = (y * cw + x) * 4;
    buf[i] = data[p * 4]; buf[i + 1] = data[p * 4 + 1]; buf[i + 2] = data[p * 4 + 2]; buf[i + 3] = 255;
  }
  // fill pockets of background enclosed by the figure (e.g. between arm and body)
  await sharp(buf, {raw: {width: cw, height: ch, channels: 4}}).png().toFile(`${OUT}/${name}.png`);
  meta[name] = {w: cw, h: ch, sheetX: bx0, sheetBottom: by1};
}
fs.writeFileSync(`${OUT}/poses.json`, JSON.stringify(meta, null, 1));
console.log(meta);
