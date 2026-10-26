// Hand-off between video-studio (the edit) and this project (the animation).
//
//   npm run brief -- <video> <shot> <from> <to> [--short]
//     Opens a job for one animated shot of ../video-studio/videos/<video>:
//     - public/jobs/<video>/<shot>.wav   the narration under the shot (staticFile('jobs/<video>/<shot>.wav'))
//     - jobs/<video>/<shot>.md           the brief: times, words, size, what the art must do (fill in "Story beat")
//     --short makes it 1080x1920 (Shorts); default is 1920x1080 like video-studio's render.
//
//   npm run deliver -- <CompositionId> <video> <shot>
//     Renders the composition silent (the narration stays in video-studio), puts it in
//     ../video-studio/videos/<video>/assets/<shot>.mp4 and prints the scenes.json line.
import fs from 'fs';
import path from 'path';
import {execFileSync} from 'child_process';

const VIDEO_STUDIO = process.env.VIDEO_STUDIO || path.resolve('..', 'video-studio');
const [cmd, ...args] = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith('--'));
const pos = args.filter((a) => !a.startsWith('--'));
const die = (msg) => {
  console.error(msg);
  process.exit(1);
};
const run = (bin, a) => execFileSync(bin, a, {stdio: ['ignore', 'pipe', 'inherit']}).toString().trim();

const videoDir = (video) => {
  const dir = path.join(VIDEO_STUDIO, 'videos', video);
  if (!fs.existsSync(dir)) die(`No video folder ${dir}`);
  return dir;
};

// Words between from and to, from video-studio's timing/words.txt ("12.3:word 12.6:word ...")
const wordsIn = (dir, from, to) => {
  const f = path.join(dir, 'timing', 'words.txt');
  if (!fs.existsSync(f)) return '(no timing/words.txt yet — transcribe first)';
  return fs.readFileSync(f, 'utf8').split(/\s+/).map((w) => w.match(/^([\d.]+):(.*)$/))
    .filter((m) => m && +m[1] >= from && +m[1] < to).map((m) => `${m[1]}:${m[2]}`).join(' ');
};

if (cmd === 'brief') {
  const [video, shot, a, b] = pos;
  const from = parseFloat(a);
  const to = parseFloat(b);
  if (!video || !shot || !(to > from)) die('Usage: npm run brief -- <video> <shot> <from-seconds> <to-seconds> [--short]');
  const dir = videoDir(video);
  const voice = path.join(dir, 'voice', 'narration.wav');
  const audio = path.join('public', 'jobs', video, `${shot}.wav`);
  fs.mkdirSync(path.dirname(audio), {recursive: true});
  if (fs.existsSync(voice)) {
    run('ffmpeg', ['-v', 'error', '-y', '-ss', `${from}`, '-to', `${to}`, '-i', voice, '-ac', '1', '-ar', '48000', audio]);
  }
  const short = flags.includes('--short');
  const frames = Math.round((to - from) * 30);
  const brief = path.join('jobs', video, `${shot}.md`);
  fs.mkdirSync(path.dirname(brief), {recursive: true});
  if (fs.existsSync(brief)) die(`${brief} already exists — edit it instead`);
  fs.writeFileSync(brief, `# ${video} / ${shot}

| | |
|---|---|
| In the edit | ${from}s → ${to}s (${(to - from).toFixed(2)}s, ${frames} frames @30fps) |
| Size | ${short ? '1080x1920 (Short)' : '1920x1080'} |
| Narration audio | \`${audio}\` → \`staticFile('jobs/${video}/${shot}.wav')\` (frame 0 = ${from}s) |
| Composition | \`Job-${shot}\` in \`src/jobs/${video}/\` |
| Deliver | \`npm run deliver -- Job-${shot} ${video} ${shot}\` |

## Narration (seconds in the edit)

${wordsIn(dir, from, to)}

## Story beat

(What happens on screen, camera, which characters/sets, what the art must do —
e.g. a punch needs a side-view arm-extended pose.)

## Art needed (ChatGPT prompts)

| Prompt | File | Status |
|---|---|---|
`);
  console.log(`Brief:  ${brief}\nAudio:  ${fs.existsSync(audio) ? audio : '(no voice/narration.wav found)'}\nFrames: ${frames} at 30fps`);
} else if (cmd === 'deliver') {
  const [id, video, shot] = pos;
  if (!id || !video || !shot) die('Usage: npm run deliver -- <CompositionId> <video> <shot>');
  const dir = videoDir(video);
  const out = path.join('out', 'jobs', video, `${shot}.mp4`);
  execFileSync('npx', ['remotion', 'render', id, out, '--muted', '--codec=h264', '--pixel-format=yuv420p'], {stdio: 'inherit'});
  const dest = path.join(dir, 'assets', `${shot}.mp4`);
  fs.mkdirSync(path.dirname(dest), {recursive: true});
  fs.copyFileSync(out, dest);
  const [w, h, dur] = run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration',
    '-of', 'csv=p=0:s=,', dest]).split(/[,\n]/);
  const brief = path.join('jobs', video, `${shot}.md`);
  const t = fs.existsSync(brief) ? fs.readFileSync(brief, 'utf8').match(/In the edit \| ([\d.]+)s/)?.[1] : null;
  console.log(`\nDelivered ${dest} (${w}x${h}, ${(+dur).toFixed(2)}s)\nscenes.json line:`);
  console.log(+w > +h
    ? `{"t": ${t ?? '<start>'}, "type": "clip", "clip": "${shot}.mp4", "from": 0, "zoom": 1.0}`
    : `{"t": ${t ?? '<start>'}, "type": "framed", "clip": "${shot}.mp4", "from": 0, "aspect": 1.7778, "width": 520}   (vertical; for a Short use the file as is)`);
} else {
  die('Commands: brief, deliver (see the top of scripts/bridge.mjs)');
}
