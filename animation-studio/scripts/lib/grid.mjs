// Cut a 2x2 sheet (4 panels with thin white gutters, portrait or landscape) into 4 files.
// Panel order: 1 top-left, 2 top-right, 3 bottom-left, 4 bottom-right. White gutters are found automatically.
import sharp from 'sharp';

export async function cutGrid(src, outName) {
  const {data, info} = await sharp(src).removeAlpha().raw().toBuffer({resolveWithObject: true});
  const w = info.width, h = info.height;
  const white = (x, y) => { const i = (y * w + x) * 3; return data[i] > 235 && data[i + 1] > 235 && data[i + 2] > 235; };
  // gutter = the whitest column/row within the middle 30%
  let gx = 0, bx = -1, gy = 0, by = -1;
  for (let x = Math.floor(w * 0.35); x < w * 0.65; x++) { let c = 0; for (let y = 0; y < h; y += 3) if (white(x, y)) c++; if (c > bx) { bx = c; gx = x; } }
  for (let y = Math.floor(h * 0.35); y < h * 0.65; y++) { let c = 0; for (let x = 0; x < w; x += 3) if (white(x, y)) c++; if (c > by) { by = c; gy = y; } }
  // gutter width
  let gw = 1; while (gx + gw < w && Array.from({length: 40}, (_, k) => white(gx + gw, Math.floor(k * h / 40))).filter(Boolean).length > 30) gw++;
  let gh = 1; while (gy + gh < h && Array.from({length: 30}, (_, k) => white(Math.floor(k * w / 30), gy + gh)).filter(Boolean).length > 22) gh++;
  const m = 6;
  const xs = [[m, gx - m], [gx + gw + m, w - m]];
  const ys = [[m, gy - m], [gy + gh + m, h - m]];
  const out = [];
  let k = 0;
  for (const [y0, y1] of ys) for (const [x0, x1] of xs) {
    k++;
    const file = outName(k);
    await sharp(src).extract({left: x0, top: y0, width: x1 - x0, height: y1 - y0}).toFile(file);
    out.push(file);
  }
  return {gx, gw, gy, gh, out};
}
