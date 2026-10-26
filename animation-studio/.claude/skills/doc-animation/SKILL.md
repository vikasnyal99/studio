---
name: doc-animation
description: AniDoc-style 2D animated documentary (youtube @anidoc28 look) made in animation-studio — cinematic graphic-novel keyframes from the user's free ChatGPT accounts, slow 2.5D camera moves with living light (dust, smoke, rays, flicker, rain, sirens), name labels, date/year cards, chrome title, TV-news and CCTV frames, dips to black, warm/night grade. Two modes: a short 2D insert for another project's video (video-studio etc.), or a full 16:9 long-form documentary. Use for "documentary animation", "AniDoc jaisa", "2D animation documentary", "true story animated", "animated insert/scene for my video".
---

# AniDoc-style documentary animation (Remotion, in animation-studio)

Work in `/home/vikas/Desktop/studio/animation-studio`; read its `CLAUDE.md`. The look was studied from 4 AniDoc videos on 2026-10-25
(memory `anidoc-style-direction`): one illustrated keyframe per beat, slow and cinematic (a cut every ~6-12 s), hard cuts,
dips to black at chapter breaks, white italic name labels, year cards, a chrome title after the cold-open hook. No captions.
No gore: violence is implied only. No image-to-video tool yet: motion = Remotion 2.5D (`src/doc/Doc.tsx`); a clip from an
AI video tool can replace any still later (`kind: "clip"`).

## Pick the mode

| | Insert (called from another project) | Long-form documentary |
|---|---|---|
| Length | 10-90 s span of their narration | 10-20 min |
| Size | 1920x1080 (1080x1920 if they are making a Short: `"w":1080,"h":1920`) | 1920x1080 |
| Art | 2-5 generations | 40-55 generations over several accounts/days |
| Audio | narration preview only, delivered silent | narration + music + SFX rendered in (`--with-audio`), or hand to video-studio |
| Files | `jobs/<video>/<shot>.md` brief + `jobs/<video>/<shot>.json` | `jobs/<video>/script.md`, `cast.md`, one `chNN.json` per chapter |

## Steps

1. **Story.** Insert: `npm run -s brief -- <video> <shot> <from> <to>` gives the words and the narration slice
   (`public/jobs/<video>/<shot>.wav`). Long-form: script first (hook pattern: date card → climax moment → 3-4 fast moments →
   title card → year card → story from the start; chapters of 1.5-3 min that each end on a question). Hindi/Hinglish narration is
   recorded or made in video-studio and transcribed there; confirm beats with the user (Whisper Hindi is unreliable).
2. **Shot list** against the word times: one shot per sentence or idea (6-10 s; 3-4 s in the hook), from the menu in
   `prompts/doc-frames.md`. Mark which shots need a new picture and which reuse one (crop / pan of a keyframe, plate, card, title).
3. **Budget.** `npm run -s quota` → tell the user the plan ("7 generations: 2 cast sheets, 4 keyframes, 1 grid; acc1 has 3 left,
   acc2 has 4") before generating. If not enough, make the hook / most important shots first.
4. **Cast.** Reuse `assets/refs/<name>_doc.png`; otherwise a CHARACTER DNA block in `prompts/characters/<name>.md` + a cast sheet
   (`prompts/style-lock-doc.md`). Real public figures: only from photos the user supplies; describe them, keep it factual and respectful;
   if ChatGPT declines a likeness, use a descriptive look and tell the user.
5. **Art.** `chatgpt-image-sheets` skill (log every generation with `npm run -s quota -- use <acc> 1 "<what>"`). Save into
   `assets/incoming/<video>/` as `<name>.png` (keyframe) or `<name>_grid.png` (2x2). Then `npm run -s prep-doc -- <video>` →
   `public/doc/<video>/` (+ `_contact.jpg`; look at it once, check faces against the cast sheet, one-line fix prompts if drifted).
6. **Edit = data.** Write the spec (types at the top of `src/doc/Doc.tsx`; example `DOC_DEMO` at the bottom):
   ```json
   {"end": 42.5, "grade": "warm", "audio": "jobs/<video>/<shot>.wav",
    "sfx": [[12.3, "lib:sfx/whoosh.wav", 0.5]], "music": {"src": "lib:music/Interloper.mp3", "vol": 0.1},
    "shots": [
      {"t": 0, "kind": "card", "text": "15 April 2023"},
      {"t": 2.1, "in": "black", "img": "doc/<video>/hospital.png", "move": "push", "fx": ["sirens"], "grade": "night"},
      {"t": 8.4, "img": "doc/<video>/hospital.png", "z": [1.9, 2.05], "focus": [62, 38], "label": {"text": "Atiq Ahmed", "sub": "Former MP"}},
      {"t": 13, "img": "doc/<video>/press_p2.png", "move": "left", "tv": {"line": "Prayagraj mein firing", "sub": "Breaking news"}},
      {"t": 19, "kind": "title", "text": "Atiq Ahmed", "sub": "THE REAL STORY", "in": "black"}
    ]}
   ```
   - `move`: push (default), pull, left, right, up, down, none; `z` [start, end] zoom and `focus` [x%, y%] for crops/close-ups.
   - `fx` (living light, pick 1-2): dust (interiors, light beams), flicker (lamps, bulbs), rays (window light), smoke, fog (night streets),
     rain, embers (fire, riots), sirens (police). `grade`: warm (default), night, cold, none. `cctv: true`, `tv: {line, sub}`.
   - `in`: cut (default), fade (12-frame crossfade, time jumps inside a scene), black (chapter break, dip to black).
   - `fg`: a transparent cut-out of the person at the same size as `img` → real parallax (ask ChatGPT for the empty plate + the person on #BDB8AE).
   - Labels on the first appearance of every person and place; a year card at every jump in time.
7. **Check.** `npm run -s doc -- jobs/<video>/<shot>.json --still` → `out/doc/<shot>_stills.jpg` (one frame per shot): look at it once.
8. **Render.** Insert: `npm run -s doc -- jobs/<video>/<shot>.json --deliver <video> <shot>` (silent mp4 into video-studio
   `assets/`, prints the scenes.json line). Long-form: `npm run -s doc -- jobs/<video>/ch01.json --with-audio` per chapter
   (run long ones with `nohup`), then join the chapters with ffmpeg concat into `out/doc/<video>.mp4`.
9. **Report:** where the file is, shots that reuse/crop a picture (softer), what was not checked (you did not watch it playing), generations used and left.

## Lessons / limits

- Worked example: `jobs/sita-haran/` (script.md, sita-haran.json; prompts `prompts/scenes/sita-haran.md`): 5 generations
  (cast sheet, 2 grids, 2 keyframes) → 18 shots, 99 s; render 5 min. Everything in ONE chat kept faces identical.
- `focus` is the point brought to the centre when zoomed (clamped at the picture edges). Pick it from the frame: face crops
  z 1.7-2.0, feet/hands 1.9-2.1; use `--still` and adjust before the full render.
- No narration yet? Placeholder Hindi TTS for timing: `edge-tts --voice hi-IN-MadhurNeural --rate=-8%` (pip in a scratch venv),
  one file per line, joined with 0.7 s gaps; the line times become the shot times. Tell the user it is a placeholder.

- Grid panels are ~760x506 before upscale: fine for 4-6 s wides, soft for close crops. Faces deserve single keyframes.
- Keep moves slow (default zooms 1.04→1.16 over the shot); AniDoc never whips the camera.
- Free AI image-to-video (checked 2026-10-25): no reliable no-watermark free tool; candidates to test when the user wants: Meta AI,
  Dreamina/CapCut (Seedance), fal.ai Grok Imagine (5/day), Kling (watermark), Hailuo. Downloaded clips go in `public/doc/<video>/` and use `kind: "clip"`.
