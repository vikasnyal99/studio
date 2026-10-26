// Render the "proof" shots a video-studio video asks for (fact-check graphics: marked-up
// screenshots, claim-vs-verdict, charts, dated timelines, statute text, scorecards, hook slams).
//
//   node scripts/proof.mjs <video> [name ...] [--still]
//
// Reads ../video-studio/videos/<video>/proofs.json:
//   {"shots": {"p_asdd": {"kind": "doc", "dur": 5.2, "img": "shot_hindu_asdd.png", ...}, ...}}
// (spec format: src/proof/Proof.tsx). Picture/clip paths are file names in that video's assets/;
// they are copied to public/jobs/<video>/ for Remotion. Each shot renders silent at 1920x1080 30fps
// to out/jobs/<video>/<name>.mp4 and is copied to video-studio's assets/<name>.mp4, ready for a
// scenes.json line {"t": .., "type": "clip", "clip": "<name>.mp4", "from": 0}.
// Give names to render only those. --still writes one PNG per shot at 80% of its length
// (out/jobs/<video>/stills/) and a contact sheet, instead of rendering video.
import fs from 'fs';
import path from 'path';
import {execFileSync} from 'child_process';
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';

const VIDEO_STUDIO = process.env.VIDEO_STUDIO || path.resolve('..', 'video-studio');
const args = process.argv.slice(2);
const still = args.includes('--still');
const [video, ...only] = args.filter((a) => !a.startsWith('--'));
if (!video) {
  console.error('Usage: node scripts/proof.mjs <video> [name ...] [--still]');
  process.exit(1);
}
const vdir = path.join(VIDEO_STUDIO, 'videos', video);
const specs = JSON.parse(fs.readFileSync(path.join(vdir, 'proofs.json'), 'utf8')).shots;
const names = only.length ? only : Object.keys(specs);
const pub = path.join('public', 'jobs', video);
fs.mkdirSync(pub, {recursive: true});

// copy referenced assets into public/ and point the spec at them
const localise = (spec) => {
  const s = JSON.parse(JSON.stringify(spec));
  if (s.inner) s.inner = localise(s.inner);
  for (const key of ['img', 'clip', 'bg', 'cam']) {
    if (!s[key] || /^https?:/.test(s[key])) continue;
    const from = path.join(vdir, 'assets', s[key]);
    if (!fs.existsSync(from)) throw new Error(`${s[key]} not in ${vdir}/assets`);
    const to = path.join(pub, path.basename(s[key]));
    if (!fs.existsSync(to) || fs.statSync(to).mtimeMs < fs.statSync(from).mtimeMs) fs.copyFileSync(from, to);
    s[key] = `jobs/${video}/${path.basename(s[key])}`;
  }
  return s;
};

// copy assets first: the bundle snapshots public/ when it is built
const local = Object.fromEntries(names.map((n) => {
  if (!specs[n]) throw new Error(`no shot "${n}" in proofs.json`);
  return [n, localise(specs[n])];
}));
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const outDir = path.join('out', 'jobs', video);
fs.mkdirSync(path.join(outDir, 'stills'), {recursive: true});
const stills = [];
for (const name of names) {
  const inputProps = {spec: local[name]};
  const composition = await selectComposition({serveUrl, id: 'Proof', inputProps});
  if (still) {
    const out = path.join(outDir, 'stills', `${name}.png`);
    await renderStill({composition, serveUrl, output: out, inputProps, frame: Math.floor(composition.durationInFrames * 0.8)});
    stills.push(out);
    console.log('still', out);
    continue;
  }
  const out = path.join(outDir, `${name}.mp4`);
  await renderMedia({composition, serveUrl, codec: 'h264', outputLocation: out, inputProps, muted: true, pixelFormat: 'yuv420p', concurrency: 4});
  fs.copyFileSync(out, path.join(vdir, 'assets', `${name}.mp4`));
  console.log(`rendered ${name} (${specs[name].dur}s) -> assets/${name}.mp4`);
}
if (still && stills.length) {
  // contact sheet, 4 across, labelled with the shot name
  const sheet = path.join(outDir, 'stills', '_sheet.jpg');
  const inputs = stills.flatMap((p) => ['-i', p]);
  const cells = stills.map((p, i) => `[${i}:v]scale=480:270,drawtext=text='${path.basename(p, '.png')}':x=8:y=8:fontsize=22:fontcolor=yellow:box=1:boxcolor=black@0.7[c${i}]`);
  const cols = 4, rows = Math.ceil(stills.length / cols);
  const layout = stills.map((_, i) => `${(i % cols) * 480}_${Math.floor(i / cols) * 270}`).join('|');
  const pad = stills.length === 1 ? `[c0]copy[o]` : `${stills.map((_, i) => `[c${i}]`).join('')}xstack=inputs=${stills.length}:layout=${layout}:fill=black[o]`;
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', `${cells.join(';')};${pad}`, '-map', '[o]', '-frames:v', '1', sheet]);
  console.log(`sheet ${sheet} (${rows} rows)`);
}
