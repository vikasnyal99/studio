---
name: doc-animation
description: AniDoc-style 2D animated documentary (youtube @anidoc28 look) made in animation-studio — cinematic documentary visuals using real evidence and unique illustrated keyframes, slow 2.5D camera moves with living light (dust, smoke, rays, flicker, rain, sirens), name labels, date/year cards, chrome title, TV-news and CCTV frames, dips to black, warm/night grade. Two modes: a short 2D insert for another project's video (video-studio etc.), or a full 16:9 long-form documentary. Use for "documentary animation", "AniDoc jaisa", "2D animation documentary", "true story animated", "animated insert/scene for my video".
---

# AniDoc-style documentary animation (Remotion, in animation-studio)

Work in `/home/vikas/Desktop/studio/animation-studio`; read its `CLAUDE.md`. The look was studied from 4 AniDoc videos on 2026-10-25
(memory `anidoc-style-direction`): unique illustrated keyframes where real material is unavailable, framed documents/photos and animated maps, with cinematic pacing and hard cuts,
dips to black at chapter breaks, white italic name labels, year cards, a chrome title after the cold-open hook. No captions.
No gore: violence is implied only. No image-to-video tool yet: motion = Remotion 2.5D (`src/doc/Doc.tsx`); a clip from an
AI video tool can replace any still later (`kind: "clip"`).

## Pick the mode

| | Insert (called from another project) | Long-form documentary |
|---|---|---|
| Length | 10-90 s span of their narration | 10-20 min |
| Size | 1920x1080 (1080x1920 if they are making a Short: `"w":1080,"h":1920`) | 1920x1080 |
| Art | Plan unique keyframes by story need | Plan unique keyframes by story need |
| Audio | narration preview only, delivered silent | narration + music + SFX rendered in (`--with-audio`), or hand to video-studio |
| Files | `jobs/<video>/<shot>.md` brief + `jobs/<video>/<shot>.json` | `jobs/<video>/script.md`, `cast.md`, one `chNN.json` per chapter |

## Steps

1. **Story.** Insert: `npm run -s brief -- <video> <shot> <from> <to>` gives the words and the narration slice
   (`public/jobs/<video>/<shot>.wav`). Long-form: script first (hook pattern: date card → climax moment → 3-4 fast moments →
   title card → year card → story from the start; chapters of 1.5-3 min that each end on a question). Hindi/Hinglish narration is
   recorded or made in video-studio and transcribed there; confirm beats with the user (Whisper Hindi is unreliable).
2. **Shot list** against the word times: one shot per sentence or idea (6-10 s; 3-4 s in the hook), from the menu in
   `prompts/doc-frames.md`. Mark each shot as document/photo, map, text/card, clip or new illustrated keyframe. Do not reuse an image in the same video.
3. **Plan.** State the planned generation count and use the current account. The paid-plan tracker is a log, not an entitlement; respect live service limits.
4. **Cast.** Reuse `assets/refs/<name>_doc.png`; otherwise a CHARACTER DNA block in `prompts/characters/<name>.md` + a cast sheet
   (`prompts/style-lock-doc.md`). Real public figures: only from photos the user supplies; describe them, keep it factual and respectful;
   if the image tool declines a likeness, use a descriptive look and tell the user.
5. **Art.** Use the Claude art route in `<studio-root>/docs/ASSISTANTS.md`; log actual generations. Save into
   `assets/incoming/<video>/` as one full-quality `<name>.png` per keyframe. Then `npm run -s prep-doc -- <video>` →
   `public/doc/<video>/` (+ `_contact.jpg`; look at it once, check faces against the cast sheet, one-line fix prompts if drifted).
6. **Edit = data.** Write the spec (types at the top of `src/doc/Doc.tsx`; example `DOC_DEMO` at the bottom):
   ```json
   {"end": 42.5, "grade": "warm", "audio": "jobs/<video>/<shot>.wav",
    "sfx": [[12.3, "lib:sfx/whoosh.wav", 0.5]], "music": {"src": "lib:music/Interloper.mp3", "vol": 0.1},
    "shots": [
      {"t": 0, "kind": "card", "text": "15 April 2023"},
      {"t": 2.1, "in": "black", "img": "doc/<video>/hospital.png", "move": "push", "fx": ["sirens"], "grade": "night"},
      {"t": 8.4, "img": "doc/<video>/hospital_detail.png", "z": [1.9, 2.05], "focus": [62, 38], "label": {"text": "Atiq Ahmed", "sub": "Former MP"}},
      {"t": 13, "img": "doc/<video>/press_p2.png", "move": "left", "tv": {"line": "Prayagraj mein firing", "sub": "Breaking news"}},
      {"t": 19, "kind": "title", "text": "Atiq Ahmed", "sub": "THE REAL STORY", "in": "black"}
    ]}
   ```
   - `move`: push (default), pull, left, right, up, down, none; `z` [start, end] zoom and `focus` [x%, y%] for crops/close-ups.
   - `fx` (living light, pick 1-2): dust (interiors, light beams), flicker (lamps, bulbs), rays (window light), smoke, fog (night streets),
     rain, embers (fire, riots), sirens (police). `grade`: warm (default), night, cold, none. `cctv: true`, `tv: {line, sub}`.
   - `in`: cut (default), fade (12-frame crossfade, time jumps inside a scene), black (chapter break, dip to black).
   - `fg`: only a separately generated transparent foreground layer at the same size as `img`; never use automatic cut-out parallax.
   - Labels on the first appearance of every person and place; a year card at every jump in time.
7. **Check.** `npm run -s doc -- jobs/<video>/<shot>.json --still` → `out/doc/<shot>_stills.jpg` (one frame per shot): look at it once.
8. **Render.** Insert: `npm run -s doc -- jobs/<video>/<shot>.json --deliver <video> <shot>` (silent mp4 into video-studio
   `assets/`, prints the scenes.json line). Long-form: `npm run -s doc -- jobs/<video>/ch01.json --with-audio` per chapter
   (run long ones with `nohup`), then join the chapters with ffmpeg concat into `out/doc/<video>.mp4`.
9. **Report:** where the file is, any soft or mismatched image, what was not checked (you did not watch it playing), generations used and any live service limit encountered.

## Current user rules (Mihir Bhoj review, 31 Oct 2026)

- **Never repeat a picture.** Every keyframe appears once in the whole video (no re-crops of the same image either).
  Budget one new generation per shot; state the count and respect live limits.
- **One image per generation, full quality.** No 2x2 grids cut into panels (they came out soft). 1536x1024 each.
- **No slideshow.** A full-screen still with a slow zoom is not enough. Mix shot types: framed photos/documents with
  callouts, animated maps, war maps, kinetic text, art with camera moves + light fx, punches/flashes on hits.
- **Never use automatic cut-out parallax** (`scripts/parallax_layers.py`, `fg` from rembg): when the layers moved,
  people "cracked" — waists and limbs split from the body (user, 31 Oct 2026). Only use `fg` with a layer generated
  separately on a plain background, and check a still where the camera moves most.
  Real photos/documents go in a frame on a textured background with a magnifier/callout, not full screen.
- **Hook (first 45 s) must be exciting but match the video's tone**: something new every 2-3 s, real material
  (documents, photos, clips) mixed with art — never a run of AI stills. For history/serious topics keep it sombre:
  dark cinematic frames, serif type, documents, maps. No emoji, meme walls, glitch/RGB, bright tickers (user, 31 Oct:
  "too non serious, doesn't match the tone").
- **History videos**: lead with real documents/photos/maps; fights and invasions get war-tactics maps
  (`src/war/War.tsx`, `scripts/war.mjs`) with moving soldier sprites; art only where nothing real exists.
- **Maps**: show historical territory as animated spreading shapes, arrows, pulsing pins — never colour whole
  modern countries, never mark an empire with a red circle. Label approximate borders "approximate".

## Lessons / limits

- Earlier example: `jobs/sita-haran/` illustrates a Remotion spec and consistent cast in one art conversation. Its grids and repeated images predate the current unique-keyframe rule; do not copy that art plan.
- `focus` is the point brought to the centre when zoomed (clamped at the picture edges). Pick it from the frame: face crops
  z 1.7-2.0, feet/hands 1.9-2.1; use `--still` and adjust before the full render.
- No narration yet? Placeholder Hindi TTS for timing: `edge-tts --voice hi-IN-MadhurNeural --rate=-8%` (pip in a scratch venv),
  one file per line, joined with 0.7 s gaps; the line times become the shot times. Tell the user it is a placeholder.

- Keep moves slow (default zooms 1.04→1.16 over the shot); AniDoc never whips the camera.
For optional AI image-to-video services, verify current availability and licensing before suggesting one. Existing clips use `kind: "clip"`.
