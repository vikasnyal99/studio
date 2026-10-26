---
name: animate
description: Get a character/story animation (cartoon shot, fight, re-enactment, animated Short) made in the animation-studio project and put into this video. Use when the user says "animate this", "animation chahiye", wants a cartoon/character scene, or a beat has no real photo/footage and needs an illustrated, animated re-creation.
---

# Animated shot via animation-studio

**Default method (the user's favourite): close-up storyboard edit.** Many far/close-up/face/impact pictures made in ChatGPT
(via the Chrome extension, 4 sheets of 2x2 shots), cut to the narration with push-ins, hit flashes, shake and Roman Hinglish captions.
Do not rig or puppet-animate characters unless the user asks. The full steps are in animation-studio's skills:
`animate-shot` (entry), `chatgpt-image-sheets` (make the art), `closeup-shots` (edit and render). Read them from
`/home/vikas/Desktop/studio/animation-studio/.claude/skills/<name>/SKILL.md`. A whole Short with the original audio goes straight to this
project's `videos/<name>/output/`; a shot inside a longer video uses the `clip` flow below.

The older flow for a silent clip inside a video-studio video:

Animation is not made here. It is made in `/home/vikas/Desktop/studio/animation-studio`
(Remotion; the user generates the art in ChatGPT from prompts written there).
This project only receives a silent MP4 and places it with a `clip` scene.

1. Pick the span: the shot's start and end seconds in this video (grep
   `V/timing/words.txt`), and a short shot name, e.g. `punch`, `hotel-entry`.
2. Open the job (run from animation-studio):

   ```bash
   cd /home/vikas/Desktop/studio/animation-studio && npm run -s brief -- <video name> <shot> <from> <to>
   ```

   Add `--short` for a 9:16 Short.
3. Read `/home/vikas/Desktop/studio/animation-studio/CLAUDE.md` and follow it from there on:
   story beat → ChatGPT prompts → user brings images → shot code → `npm run deliver`.
   That project's rules (prompt format, art checks) apply while working in it.
4. `deliver` copies `V/assets/<shot>.mp4` in and prints the scene line, e.g.
   `{"t": 24.5, "type": "clip", "clip": "punch.mp4", "from": 0, "zoom": 1.0}`.
   Add it to `scenes.json` (`zoom` 1.0: the animation has its own camera; no `credit`, it is ours),
   then continue with `make-video` / `revise-video` as usual.

While the user is off making images, the rest of the video can go on; leave a
`card` placeholder at that time and swap it for the clip when it arrives.
