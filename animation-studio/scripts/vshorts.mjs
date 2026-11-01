// Edit a talking-head phone recording into a finished vertical Short (composition VShort, src/vshorts/VShort.tsx).
//
//   node scripts/vshorts.mjs <video> [--still 3,12,30] [--pieces] [--thumb]
//
// Reads jobs/<video>/vshort.json. Media in public/vshorts/<video>/: cam.mp4 (1080x1920 30fps, silent), voice.wav
// (cleaned with audio-studio/_shared/scripts/clean_voice.py). "pieces": "auto" cuts every pause longer than
// `gap` (default 0.3 s) out of the recording, keeping `pad` (0.09 s) around speech; "cut": [[a, b], ...] removes
// retakes on top. --pieces prints the pieces only. --still renders PNGs at those OUTPUT seconds.
// Output: ../video-studio/videos/<video>/output/short.mp4 (+ still_<sec>.png). --thumb: the "thumb" spec
// {img, face: recording sec, text, stamp} -> output/thumbnail.png/.jpg (composition VThumb).
import fs from 'fs';
import path from 'path';
import {execFileSync} from 'child_process';
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';

const VIDEO_STUDIO = process.env.VIDEO_STUDIO || path.resolve('..', 'video-studio');
const args = process.argv.slice(2);
const video = args.find((a) => !a.startsWith('--') && !/^[\d.,]+$/.test(a));
if (!video) {
  console.error('Usage: node scripts/vshorts.mjs <video> [--still 3,12,30] [--pieces]');
  process.exit(1);
}
const spec = JSON.parse(fs.readFileSync(path.join('jobs', video, 'vshort.json'), 'utf8'));

const autoPieces = () => {
  const wav = path.join('public', spec.voice);
  const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav]).toString());
  const gap = spec.gap ?? 0.3, pad = spec.pad ?? 0.09;
  // RMS in 20 ms windows; a pause = `gap` seconds under `noise` dB (the cleaned voice's room tone sits near -35)
  const pcm = execFileSync('ffmpeg', ['-v', 'error', '-i', wav, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], {maxBuffer: 1 << 30});
  const x = new Float32Array(pcm.buffer, pcm.byteOffset, pcm.length / 4);
  const W = 320, th = spec.noise ?? -30;
  const quiet = [];
  for (let i = 0; i + W <= x.length; i += W) {
    let e = 0;
    for (let j = i; j < i + W; j++) e += x[j] * x[j];
    quiet.push(10 * Math.log10(e / W + 1e-12) < th);
  }
  const sil = [];
  for (let i = 0; i < quiet.length;) {
    if (!quiet[i]) { i++; continue; }
    let j = i;
    while (j < quiet.length && quiet[j]) j++;
    if ((j - i) * 0.02 >= gap) sil.push([i * 0.02, j * 0.02]);
    i = j;
  }
  let pieces = [];
  let t = 0;
  for (const [a, b] of sil) {
    const end = Math.min(dur, a + pad);
    if (end > t + 0.05) pieces.push([t, end]);
    t = Math.max(t, b - pad);
  }
  if (t < dur - 0.05) pieces.push([t, dur]);
  for (const [ca, cb] of spec.cut ?? []) {
    pieces = pieces.flatMap(([a, b]) => (cb <= a || ca >= b ? [[a, b]] : [[a, Math.min(b, ca)], [Math.max(a, cb), b]].filter(([x, y]) => y - x > 0.05)));
  }
  if (spec.trimEnd) pieces = pieces.filter(([a]) => a < spec.trimEnd).map(([a, b]) => [a, Math.min(b, spec.trimEnd)]);
  return pieces.map(([a, b]) => [Math.round(a * 1000) / 1000, Math.round(b * 1000) / 1000]);
};

if (args.includes('--thumb')) {
  // face still from the recording, then one PNG + a <2 MB JPG for YouTube
  const t = spec.thumb;
  const face = path.join('public', 'vshorts', video, 'face.jpg');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(t.face), '-i', path.join('public', spec.cam), '-frames:v', '1', '-q:v', '2', face]);
  const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
  // each bundle is a full copy of public/ (~2.5 GB); 70 left in /tmp filled the disk on 31 Oct 2026
  process.on('exit', () => { try { fs.rmSync(serveUrl, {recursive: true, force: true}); } catch {} });
  const inputProps = {spec: {...t, face: `vshorts/${video}/face.jpg`, kicker: t.kicker ?? spec.kicker, accent: spec.accent}};
  const composition = await selectComposition({serveUrl, id: 'VThumb', inputProps});
  const out = path.join(VIDEO_STUDIO, 'videos', video, 'output', 'thumbnail.png');
  await renderStill({composition, serveUrl, output: out, inputProps});
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', out, '-q:v', '3', out.replace('.png', '.jpg')]);
  console.log('thumb', out.replace('.png', '.jpg'));
  process.exit(0);
}
if (spec.pieces === 'auto' || !spec.pieces) spec.pieces = autoPieces();
const kept = spec.pieces.reduce((a, [x, y]) => a + y - x, 0);
console.log(`${video}: ${spec.pieces.length} pieces, ${kept.toFixed(1)} s kept`);
if (args.includes('--pieces')) { console.log(JSON.stringify(spec.pieces)); process.exit(0); }

const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const out = path.join(VIDEO_STUDIO, 'videos', video, 'output');
fs.mkdirSync(out, {recursive: true});
const inputProps = {spec};
const composition = await selectComposition({serveUrl, id: 'VShort', inputProps});
const si = args.indexOf('--still');
if (si >= 0) {
  for (const sec of args[si + 1].split(',').map(Number)) {
    const file = path.join(out, `still_${sec}.png`);
    await renderStill({composition, serveUrl, output: file, inputProps, frame: Math.min(composition.durationInFrames - 1, Math.round(sec * 30)), scale: 0.4});
    console.log('still', file);
  }
  process.exit(0);
}
const file = path.join(out, 'short.mp4');
await renderMedia({composition, serveUrl, codec: 'h264', crf: 17, outputLocation: file, inputProps, pixelFormat: 'yuv420p', concurrency: Number(process.env.CONCURRENCY ?? 2),
  audioBitrate: '256k'});
console.log(`rendered ${video} (${(composition.durationInFrames / 30).toFixed(1)}s) -> ${file}`);
