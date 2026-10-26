// Cuts characters out of the reference sheet and writes transparent PNGs to public/.
// Usage: npm run prep
import sharp from 'sharp';

const SRC = 'neeraj_anim2.png';
const OUT = 'public';

// Regions on the 1536x1024 character sheet: [left, top, width, height]
const REGIONS = {
  neeraj_front: [12, 15, 300, 665],
  neeraj_side: [650, 25, 160, 650],
  face_angry: [1100, 280, 205, 200],
  face_determined: [1100, 60, 205, 200],
  face_smirk: [1320, 60, 205, 200],
};

// Flood-fill the flat sheet background from the crop border and make it transparent.
async function cutout(name, [left, top, width, height]) {
  const {data, info} = await sharp(SRC)
    .extract({left, top, width, height})
    .ensureAlpha()
    .raw()
    .toBuffer({resolveWithObject: true});
  const w = info.width;
  const h = info.height;
  const bg = [data[0], data[1], data[2]];
  const dist = (i) =>
    Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]);

  const visited = new Uint8Array(w * h);
  const fill = (seeds, minSize) => {
    const stack = [...seeds];
    const region = [];
    while (stack.length) {
      const p = stack.pop();
      if (visited[p]) continue;
      visited[p] = 1;
      if (dist(p * 4) > 30) continue;
      region.push(p);
      const x = p % w;
      const y = (p / w) | 0;
      if (x > 0) stack.push(p - 1);
      if (x < w - 1) stack.push(p + 1);
      if (y > 0) stack.push(p - w);
      if (y < h - 1) stack.push(p + w);
    }
    if (region.length >= minSize) for (const p of region) data[p * 4 + 3] = 0;
  };
  const border = [];
  for (let x = 0; x < w; x++) border.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) border.push(y * w, y * w + w - 1);
  fill(border, 0);
  // Enclosed background pockets (e.g. gap between arm and body)
  for (let p = 0; p < w * h; p++) {
    if (!visited[p] && dist(p * 4) < 6) fill([p], 150);
  }

  // Soften the 1px fringe left next to removed background
  const alpha = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) alpha[p] = data[p * 4 + 3];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      if (!alpha[p]) continue;
      const n = !alpha[p - 1] + !alpha[p + 1] + !alpha[p - w] + !alpha[p + w];
      if (n && dist(p * 4) < 60) data[p * 4 + 3] = 110;
    }
  }

  await sharp(data, {raw: {width: w, height: h, channels: 4}})
    .resize({width: w * 3, kernel: 'lanczos3'})
    .png()
    .toFile(`${OUT}/${name}.png`);
  console.log(`wrote ${OUT}/${name}.png`);
}

for (const [name, region] of Object.entries(REGIONS)) {
  await cutout(name, region);
}

await sharp('neeraj_anim1.png').resize(1254).jpeg({quality: 92}).toFile(`${OUT}/hero.jpg`);
await sharp('neeraj.jpeg').toFile(`${OUT}/neeraj_photo.jpg`);
console.log('done');
