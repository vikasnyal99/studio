// Usage: node scripts/prep-doc.mjs <video>
// Takes every picture in assets/incoming/<video>/ and makes it ready for the Doc composition in public/doc/<video>/:
//   <name>_grid.png  -> 2x2 sheet, cut into <name>_p1..p4.png (1 top-left, 2 top-right, 3 bottom-left, 4 bottom-right)
//   <name>.png       -> one keyframe, copied as is
// Everything is upscaled (lanczos) to at least 1920 px wide so slow push-ins stay sharp enough at 1080p.
// Writes public/doc/<video>/_contact.jpg (all frames, labelled) to look at once.
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import {execFileSync} from 'child_process';
import {cutGrid} from './lib/grid.mjs';

const video = process.argv[2];
if (!video) { console.error('Usage: node scripts/prep-doc.mjs <video>'); process.exit(1); }
const src = path.join('assets', 'incoming', video);
const out = path.join('public', 'doc', video);
fs.mkdirSync(out, {recursive: true});
const MIN_W = 1920;
const upscale = async (file) => {
  const {width, height} = await sharp(file).metadata();
  if (width >= MIN_W) return;
  const buf = await sharp(file).resize(MIN_W, Math.round(height * MIN_W / width), {kernel: 'lanczos3'}).sharpen({sigma: 0.6}).png().toBuffer();
  fs.writeFileSync(file, buf);
};
const made = [];
for (const f of fs.readdirSync(src).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort()) {
  const name = f.replace(/\.[^.]+$/, '');
  if (name.endsWith('_grid')) {
    const base = name.slice(0, -5);
    const {out: files} = await cutGrid(path.join(src, f), (k) => path.join(out, `${base}_p${k}.png`));
    made.push(...files);
  } else {
    const to = path.join(out, `${name}.png`);
    await sharp(path.join(src, f)).png().toFile(to);
    made.push(to);
  }
}
for (const m of made) await upscale(m);
if (made.length) {
  const inputs = made.flatMap((p) => ['-i', p]);
  const cells = made.map((p, i) => `[${i}:v]scale=480:270:force_original_aspect_ratio=decrease,pad=480:270:(ow-iw)/2:(oh-ih)/2,drawtext=text='${path.basename(p, '.png')}':x=8:y=8:fontsize=20:fontcolor=yellow:box=1:boxcolor=black@0.7[c${i}]`);
  const layout = made.map((_, i) => `${(i % 4) * 480}_${Math.floor(i / 4) * 270}`).join('|');
  const stack = made.length === 1 ? '[c0]copy[o]' : `${made.map((_, i) => `[c${i}]`).join('')}xstack=inputs=${made.length}:layout=${layout}:fill=black[o]`;
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', `${cells.join(';')};${stack}`, '-map', '[o]', '-frames:v', '1', path.join(out, '_contact.jpg')]);
}
console.log(`${made.length} frames in ${out}/ (contact sheet: ${out}/_contact.jpg); use them as "doc/${video}/<name>.png"`);
