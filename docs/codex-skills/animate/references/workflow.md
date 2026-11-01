# Animated shot via animation-studio

**For action Shorts: close-up storyboard edit. For documentary/story inserts: use `doc-animation`.** Many far/close-up/face/impact pictures made in ChatGPT
(via Codex browser tools, typically 4 sheets of 2x2 shots), cut to the narration with push-ins, hit flashes, shake and Roman Hinglish captions.
Do not rig or puppet-animate characters unless the user asks. The full steps are in animation-studio's skills:
`animate-shot` (entry), `chatgpt-image-sheets` (make the art), `closeup-shots` (edit and render). Read them from
`<studio-root>/docs/codex-skills/<name>/SKILL.md`. A whole Short with the original audio goes straight to this
project's `videos/<name>/output/`; a shot inside a longer video uses the `clip` flow below.

The older flow for a silent clip inside a video-studio video:

Animation is not made here. It is made in `<studio-root>/animation-studio`
(Remotion; generate art using `chatgpt-image-sheets` or use supplied images).
This project only receives a silent MP4 and places it with a `clip` scene.

1. Pick the span: the shot's start and end seconds in this video (grep
   `V/timing/words.txt`), and a short shot name, e.g. `punch`, `hotel-entry`.
2. Open the job (run from animation-studio):

   ```bash
   cd <studio-root>/animation-studio && npm run -s brief -- <video name> <shot> <from> <to>
   ```

   Add `--short` for a 9:16 Short.
3. Read `<studio-root>/animation-studio/AGENTS.md` and follow it from there on:
   story beat → ChatGPT prompts → generated or supplied images → shot code → `npm run deliver`.
   That project's rules (prompt format, art checks) apply while working in it.
4. `deliver` copies `V/assets/<shot>.mp4` in and prints the scene line, e.g.
   `{"t": 24.5, "type": "clip", "clip": "punch.mp4", "from": 0, "zoom": 1.0}`.
   Add it to `scenes.json` (`zoom` 1.0: the animation has its own camera; no `credit`, it is ours),
   then continue with `make-video` / `revise-video` as usual.

While images are pending, the rest of the video can go on; leave a
`card` placeholder at that time and swap it for the clip when it arrives.
