# Shorts from a finished video (Remotion, in animation-studio)

Composition `ShortCut` (`src/shorts/ShortCut.tsx`); renderer `scripts/shorts.mjs`. First used on
`video-studio/videos/2026-10-23-quraishi-counter/shorts.json` (6 Shorts, 29–57 s) — copy its format.

1. Pick 4–6 segments of the finished video (`output/final.mp4`; its seconds = scenes.json `t`), each one complete idea:
   a hook line or claim at the start, a payoff (verdict, number, question) at the end, 25–58 s. A segment may be several
   `pieces` back to back if a middle part is slow (cut on sentence ends; check the word times).
2. Title: a 2-line question in Roman Hinglish, gold `<b>` on the key word ("13 crore voters<br/><b>illegally</b> delete?").
3. Captions: `[source second, "2–5 words"]`, one per phrase, from `timing/words.txt` times; write clean Roman Hinglish
   (never Whisper's Devanagari), quotes of the other side in "quote marks", gold `<b>` on numbers and verdict words.
   Where `words.txt` is garbled, map times from the raw transcript through `raw/cutmap.json`.
4. `node scripts/shorts.mjs <video> --still` → one PNG per Short in video-studio `output/shorts/`; look at them side by side,
   then `nohup node scripts/shorts.mjs <video>` (with sound, crf 16; ~6 Shorts ≈ 15 min).
5. Camera scenes in scenes.json automatically become full-frame speaker shots (`facePos` if the face is off-centre);
   graphics stay uncropped so outlet/date chips remain visible — do not crop them to fill.
6. Context first (user, 24 Oct 2026): a Short that opens straight on "agla daava" loses cold viewers. Prepend a
   5–7 s piece of the speaker saying what this is about (e.g. "Dhruv Rathee ka naya podcast… Dr. S.Y. Quraishi") and set
   `badge` (red pill under the title, whole Short, e.g. "FACT CHECK · Dhruv Rathee × Quraishi podcast"). Keep the total under 60 s.
7. Give the user a title, short description and hashtags per Short (`output/shorts/shorts_upload.txt`).
