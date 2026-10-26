---
name: closeup-shots
description: Edit ChatGPT storyboard panels (far shots, close-ups, faces, impacts) into a 9:16 Short with the original narration, cuts, push-ins, hit flashes, shake and Roman Hinglish captions. The method the user liked most for animated fights and re-enactments.
---

# Close-up storyboard edit (Remotion, in animation-studio)

Claude is weak at drawing character animation, so do NOT rig/puppet characters (`src/jobs/.../Fight.tsx` was the weaker first attempt).
Make many strong pictures instead and cut them to the narration. Run everything from `/home/vikas/Desktop/studio/animation-studio`.

1. **Audio.** Use the narration as is. If the user wants parts removed, cut with ffmpeg (`atrim` + `concat`, 0.05-0.3 s fades) into
   `public/jobs/<video>/<shot>.wav`; never touch the source `voice/` or `inbox/`. Timing is in the EDITED audio: frame = seconds x 30.
   Get words with `grep -oE "(^| )6[0-9]\.[0-9]:[^ ]*" <video>/timing/words.txt`. Whisper Hindi is often garbled: build the story from the
   user's own description and label uncertain captions in your reply.
2. **Story and shot list.** Write ~16-20 beats against the timeline: alternate far / close-up / face / impact, one idea per shot (menu in `prompts/storyboard-sheets.md`).
3. **Art.** Follow the `chatgpt-image-sheets` skill: 4 storyboard sheets (2x2 each), characters from `assets/refs` or a pose sheet.
   Save as `assets/incoming/<prefix>_1.png` ... `_4.png`.
4. **Cut panels.** `node scripts/prep-shots.mjs <prefix>` -> `public/shots/<prefix>_sN_pM.png` (M: 1 top-left, 2 top-right, 3 bottom-left, 4 bottom-right).
   Look at ONE contact sheet of all 16 (sharp composite) before editing.
5. **Edit = data only.** Copy `src/jobs/2026-10-23-dev-tanwar-short/Shots.tsx`; it feeds `src/components/ShotsEdit.tsx` with:
   `shots` [{a, b, p: 'sheet_panel', z0, z1, pair}], `hits` (seconds: flash + shake), `big`, `captions` (Roman Hinglish, timed to words), `slams` (comic words).
   Register compositions in `src/jobs/index.tsx` (1080x1920, 30 fps, frames = seconds x 30; add ~2 s tail for the ending shot).
   Style A = full-screen cuts (the user's favourite). Style B = `split` two stacked panels (offer only if asked).
   Rhythm that worked: ~1 cut per 1.1 s, a flash + shake on every hit, quick alternating cuts for repeated punches (0.5 s), slow push-in on every shot, big shake on the finisher.
6. **Check.** `npx remotion still <id> --frame=N --scale=0.35` for 4-6 frames, join with sharp into one sheet, view it once. Fix, render:
   `npx remotion render <id> <video>/output/<name>.mp4 --crf=18` (writes straight into the video project's `output/`, audio included).
7. **Report** what was made and where, what was not checked (you did not watch it playing), caption lines that are guesses, and that panels are ~500x750 (soft when zoomed).

Known limits: no sound effects yet (offer to mix from video-studio `library/`); slam-text is thin outline text; panels are low resolution.
