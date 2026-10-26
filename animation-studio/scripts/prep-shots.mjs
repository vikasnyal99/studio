// Usage: node scripts/prep-shots.mjs [prefix]   (default prefix: shots)
// Cuts each 2x2 storyboard sheet <prefix>_N.png (N=1..4, in assets/incoming/) into 4 panels: public/shots/<prefix>_sN_pM.png
// M: 1 top-left, 2 top-right, 3 bottom-left, 4 bottom-right. White gutters are found automatically.
import {cutGrid} from './lib/grid.mjs';
const PREFIX = process.argv[2] ?? 'shots'; // reads assets/incoming/<PREFIX>_N.png, writes public/shots/<PREFIX>_sN_pM.png
for (const n of [1, 2, 3, 4]) {
  const {gx, gw, gy, gh} = await cutGrid(`assets/incoming/${PREFIX}_${n}.png`, (k) => `public/shots/${PREFIX}_s${n}_p${k}.png`);
  console.log(n, {gx, gw, gy, gh});
}
