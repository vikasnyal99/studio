// Render war-tactics map shots with the War composition (src/war/War.tsx): terrain plate + army blocks of soldier
// sprites that march, clash and rout, attack arrows, forts, battle title, captions.
//
//   node scripts/war.mjs <spec.json> [more.json ...] [--still] [--deliver <video>]
//
// spec.json: {"end": 8, "bg": "doc/<video>/war_plain.png", "cam": [[0,1,50,50],...], "units": [...], ...} (types in War.tsx).
// Paths are public/ paths. One bundle for all specs given.
// Output: out/war/<spec name>.mp4 (silent, 1920x1080 30fps).
// --still: 4 frames per spec (20/45/70/95% of its length) -> out/war/<first spec name>_stills.jpg (look before rendering).
// --deliver <video>: also copy each mp4 to video-studio/videos/<video>/assets/<spec name>.mp4.
import fs from 'fs';
import path from 'path';
import {execFileSync} from 'child_process';
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';

const VIDEO_STUDIO = process.env.VIDEO_STUDIO || path.resolve('..', 'video-studio');
const args = process.argv.slice(2);
const still = args.includes('--still');
const di = args.indexOf('--deliver');
const video = di >= 0 ? args[di + 1] : null;
const specPaths = args.filter((a, i) => !a.startsWith('--') && (di < 0 || i !== di + 1));
if (!specPaths.length || (di >= 0 && !video)) {
  console.error('Usage: node scripts/war.mjs <spec.json> [more.json ...] [--still] [--deliver <video>]');
  process.exit(1);
}
const specs = specPaths.map((p) => ({name: path.basename(p, '.json'), spec: JSON.parse(fs.readFileSync(p, 'utf8'))}));
const missing = specs.flatMap(({spec}) => [spec.bg, ...spec.units.map((u) => u.sprite)]).filter((p) => p && !fs.existsSync(path.join('public', p)));
if (missing.length) { console.error('missing in public/:\n  ' + [...new Set(missing)].join('\n  ')); process.exit(1); }

const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});

// each bundle is a full copy of public/ (~2.5 GB); 70 left in /tmp filled the disk on 31 Oct 2026

process.on('exit', () => { try { fs.rmSync(serveUrl, {recursive: true, force: true}); } catch {} });
const outDir = path.join('out', 'war');
fs.mkdirSync(outDir, {recursive: true});

if (still) {
  const files = [];
  const labels = [];
  for (const {name, spec} of specs) {
    const inputProps = {spec};
    const composition = await selectComposition({serveUrl, id: 'War', inputProps});
    for (const k of [0.2, 0.45, 0.7, 0.95]) {
      const out = path.join(outDir, `_still_${files.length}.png`);
      await renderStill({composition, serveUrl, output: out, inputProps, frame: Math.min(composition.durationInFrames - 1, Math.round(spec.end * k * 30)), scale: 0.25});
      files.push(out);
      labels.push(`${name} ${(spec.end * k).toFixed(1)}s`);
    }
  }
  const cols = 4, W = 480, H = 270;
  const inputs = files.flatMap((p) => ['-i', p]);
  const cells = files.map((_, i) => `[${i}:v]drawtext=text='${labels[i]}':x=6:y=6:fontsize=16:fontcolor=yellow:box=1:boxcolor=black@0.7[c${i}]`);
  const layout = files.map((_, i) => `${(i % cols) * W}_${Math.floor(i / cols) * H}`).join('|');
  const sheet = path.join(outDir, `${specs[0].name}_stills.jpg`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', `${cells.join(';')};${files.map((_, i) => `[c${i}]`).join('')}xstack=inputs=${files.length}:layout=${layout}:fill=black[o]`, '-map', '[o]', '-frames:v', '1', sheet]);
  files.forEach((f) => fs.unlinkSync(f));
  console.log(`sheet ${sheet}`);
  process.exit(0);
}

for (const {name, spec} of specs) {
  const inputProps = {spec};
  const composition = await selectComposition({serveUrl, id: 'War', inputProps});
  const out = path.join(outDir, `${name}.mp4`);
  await renderMedia({composition, serveUrl, codec: 'h264', outputLocation: out, inputProps, muted: true, pixelFormat: 'yuv420p', crf: 18, concurrency: 3});
  console.log(`rendered ${out} (${spec.end}s)`);
  if (video) {
    const dest = path.join(VIDEO_STUDIO, 'videos', video, 'assets', `${name}.mp4`);
    if (!fs.existsSync(path.dirname(dest))) { console.error(`no ${path.dirname(dest)}`); process.exit(1); }
    fs.copyFileSync(out, dest);
    console.log(`delivered -> ${dest}`);
  }
}
