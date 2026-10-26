// Cut vertical Shorts out of a finished video-studio video.
//
//   node scripts/shorts.mjs <video> [name ...] [--still]
//
// Reads ../video-studio/videos/<video>/shorts.json:
//   {"shorts": {"s_name": {"pieces": [[from, to], ...], "title": "..<b>gold</b>..", "captions": [[sec, "text"], ...]}}}
// Seconds are the finished video's own (output/final.mp4 = the narration timeline of scenes.json). Camera scenes in
// scenes.json become "face" spans (speaker fills the 9:16 frame); everything else is shown whole over a blur.
// Renders WITH sound to ../video-studio/videos/<video>/output/shorts/<name>.mp4. --still: one PNG per short at 30%.
import fs from 'fs';
import path from 'path';
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';

const VIDEO_STUDIO = process.env.VIDEO_STUDIO || path.resolve('..', 'video-studio');
const args = process.argv.slice(2);
const still = args.includes('--still');
const [video, ...only] = args.filter((a) => !a.startsWith('--'));
if (!video) {
  console.error('Usage: node scripts/shorts.mjs <video> [name ...] [--still]');
  process.exit(1);
}
const vdir = path.join(VIDEO_STUDIO, 'videos', video);
const shorts = JSON.parse(fs.readFileSync(path.join(vdir, 'shorts.json'), 'utf8')).shorts;
const scenes = JSON.parse(fs.readFileSync(path.join(vdir, 'scenes.json'), 'utf8'));
const sc = scenes.scenes;
const modes = sc.map((s, i) => [s.t, i + 1 < sc.length ? sc[i + 1].t : scenes.duration, s.type])
  .filter((m) => m[2] === 'camera').map(([a, b]) => [a, b, 'face']);
// the finished video goes into public/ before bundling (the bundle snapshots public/)
const pub = path.join('public', 'jobs', video);
fs.mkdirSync(pub, {recursive: true});
const src = path.join(vdir, 'output', 'final.mp4');
const dst = path.join(pub, 'final.mp4');
if (!fs.existsSync(dst) || fs.statSync(dst).mtimeMs < fs.statSync(src).mtimeMs) fs.copyFileSync(src, dst);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const out = path.join(vdir, 'output', 'shorts');
fs.mkdirSync(out, {recursive: true});
for (const name of only.length ? only : Object.keys(shorts)) {
  const spec = {modes, ...shorts[name], video: `jobs/${video}/final.mp4`};
  const inputProps = {spec};
  const composition = await selectComposition({serveUrl, id: 'ShortCut', inputProps});
  if (still) {
    const file = path.join(out, `${name}.png`);
    await renderStill({composition, serveUrl, output: file, inputProps, frame: Number(process.env.STILL_FRAME ?? Math.floor(composition.durationInFrames * 0.3))});
    console.log('still', file);
    continue;
  }
  const file = path.join(out, `${name}.mp4`);
  await renderMedia({composition, serveUrl, codec: 'h264', crf: 16, outputLocation: file, inputProps, pixelFormat: 'yuv420p', concurrency: 4});
  console.log(`rendered ${name} (${(composition.durationInFrames / 30).toFixed(1)}s) -> ${file}`);
}
