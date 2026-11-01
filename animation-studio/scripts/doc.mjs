// Render an AniDoc-style documentary spec with the Doc composition (src/doc/Doc.tsx).
//
//   node scripts/doc.mjs <spec.json> [--still] [--with-audio] [--deliver <video> <shot>]
//
// spec.json: {"end": 42, "grade": "warm", "shots": [{"t": 0, "img": "doc/<video>/s01.png", ...}], ...} (types in Doc.tsx).
// Paths are public/ paths; "lib:sfx/hit.wav" / "lib:music/x.mp3" come from video-studio/library (copied into public/lib/).
// Output: out/doc/<spec name>.mp4, silent unless --with-audio (narration + music + sfx in the spec).
// --still: one frame from the middle of every shot -> out/doc/<spec name>_stills.jpg (look at it before rendering).
// --deliver <video> <shot>: also copy the (silent) mp4 to video-studio/videos/<video>/assets/<shot>.mp4 and print the scenes.json line.
import fs from 'fs';
import path from 'path';
import {execFileSync} from 'child_process';
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';

const VIDEO_STUDIO = process.env.VIDEO_STUDIO || path.resolve('..', 'video-studio');
const args = process.argv.slice(2);
const still = args.includes('--still');
const withAudio = args.includes('--with-audio');
const di = args.indexOf('--deliver');
const deliver = di >= 0 ? {video: args[di + 1], shot: args[di + 2]} : null;
const specPath = args.find((a, i) => !a.startsWith('--') && (di < 0 || (i !== di + 1 && i !== di + 2)));
if (!specPath || (deliver && !deliver.shot)) {
  console.error('Usage: node scripts/doc.mjs <spec.json> [--still] [--with-audio] [--deliver <video> <shot>]');
  process.exit(1);
}
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const name = path.basename(specPath, '.json');

// lib: paths -> copy from video-studio/library into public/lib (before bundling: the bundle snapshots public/)
const lib = (p) => {
  if (!p || !p.startsWith('lib:')) return p;
  const rel = p.slice(4);
  const from = path.join(VIDEO_STUDIO, 'library', rel), to = path.join('public', 'lib', rel);
  if (!fs.existsSync(from)) throw new Error(`${from} not found`);
  fs.mkdirSync(path.dirname(to), {recursive: true});
  if (!fs.existsSync(to)) fs.copyFileSync(from, to);
  return `lib/${rel}`;
};
if (spec.music) spec.music.src = lib(spec.music.src);
spec.sfx = (spec.sfx ?? []).map(([t, s, v]) => [t, lib(s), v]);
const missing = [spec.audio, spec.music?.src, ...spec.sfx.map((x) => x[1]), ...spec.shots.flatMap((s) => [s.img, s.fg])]
  .filter((p) => p && !fs.existsSync(path.join('public', p)));
if (missing.length) { console.error('missing in public/:\n  ' + missing.join('\n  ')); process.exit(1); }
if (!withAudio) { delete spec.audio; delete spec.music; spec.sfx = []; }

const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});

// each bundle is a full copy of public/ (~2.5 GB); 70 left in /tmp filled the disk on 31 Oct 2026

process.on('exit', () => { try { fs.rmSync(serveUrl, {recursive: true, force: true}); } catch {} });
const inputProps = {spec};
const composition = await selectComposition({serveUrl, id: 'Doc', inputProps});
const outDir = path.join('out', 'doc');
fs.mkdirSync(outDir, {recursive: true});

if (still) {
  const files = [];
  for (const [i, s] of spec.shots.entries()) {
    const a = s.t, b = spec.shots[i + 1]?.t ?? spec.end;
    const out = path.join(outDir, `_still_${name}_${String(i).padStart(3, '0')}.png`);
    await renderStill({composition, serveUrl, output: out, inputProps, frame: Math.round((a + b) / 2 * 30), scale: 0.25});
    files.push(out);
  }
  const cols = 4;
  const inputs = files.flatMap((p) => ['-i', p]);
  const W = composition.width / 4, H = composition.height / 4;
  const cells = files.map((_, i) => `[${i}:v]drawtext=text='${i} @${spec.shots[i].t}s':x=6:y=6:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.7[c${i}]`);
  const layout = files.map((_, i) => `${(i % cols) * W}_${Math.floor(i / cols) * H}`).join('|');
  const stack = files.length === 1 ? '[c0]copy[o]' : `${files.map((_, i) => `[c${i}]`).join('')}xstack=inputs=${files.length}:layout=${layout}:fill=black[o]`;
  const sheet = path.join(outDir, `${name}_stills.jpg`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', `${cells.join(';')};${stack}`, '-map', '[o]', '-frames:v', '1', sheet]);
  files.forEach((f) => fs.unlinkSync(f));
  console.log(`sheet ${sheet}`);
  process.exit(0);
}

const out = path.join(outDir, `${name}.mp4`);
let shown = -1;
await renderMedia({composition, serveUrl, codec: 'h264', outputLocation: out, inputProps, muted: !withAudio, pixelFormat: 'yuv420p', crf: 18, concurrency: 4,
  onProgress: ({progress}) => { const p = Math.floor(progress * 10) * 10; if (p !== shown) { shown = p; process.stdout.write(`${p}% `); } }});
console.log(`\nrendered ${out} (${spec.end}s, ${composition.width}x${composition.height}${withAudio ? ', with audio' : ', silent'})`);
if (deliver) {
  const dest = path.join(VIDEO_STUDIO, 'videos', deliver.video, 'assets', `${deliver.shot}.mp4`);
  if (!fs.existsSync(path.dirname(dest))) { console.error(`no ${path.dirname(dest)}`); process.exit(1); }
  fs.copyFileSync(out, dest);
  console.log(`delivered -> ${dest}\nscenes.json: {"t": <start>, "type": "clip", "clip": "${deliver.shot}.mp4", "from": 0}`);
}
