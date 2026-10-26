---
name: proof-shots
description: Make fact-check / debunk proof graphics for a video-studio video in Remotion — marked-up article screenshots (camera push, marker highlight, hand-drawn circle/underline/box/arrow, handwritten note, verdict stamp), the other side's clip framed as "DAAVA" with its quote and a verdict, donut breakdowns, dated timelines with the claim struck out, statute text with highlighted words, kinetic hook slams and a scorecard. Use for "debunk", "counter video", "fact check", "proof dikhao", "markings/highlight on the article", or a hook that needs slams.
---

# Proof shots (Remotion, in animation-studio)

One data-driven composition, `Proof` (`src/proof/Proof.tsx`), draws every kind; a JSON spec per shot picks the look.
First used on `video-studio/videos/2026-10-23-quraishi-counter` (Dhruv Rathee x Quraishi fact-check, 43 shots) — copy its
`proofs.json` rather than starting blank.

## Steps

1. In video-studio, capture and crop the evidence pages first (`scripts/capture_page.py ... shot` then `crop`), so the
   pictures are `videos/<video>/assets/shot_*.png`. Copy any clip of the other side into that `assets/` too.
2. Write `videos/<video>/proofs.json`: `{"shots": {"p_name": {spec}, ...}}`. All times are seconds from the shot's own start;
   rects are `[left, top, width, height]` in % of the picture (read them off the capture grid: page px minus the crop origin,
   divided by the crop size). Give `w`/`h` (picture pixels) on every `doc` — a few lines of Python with PIL fill them in.
3. `node scripts/proof.mjs <video> --still` → `out/jobs/<video>/stills/_sheet.jpg`, one frame per shot at 80% of its length.
   Look at the one sheet; fix crops/zooms; then `node scripts/proof.mjs <video>` renders all (or name shots to redo some).
   Each lands in video-studio `assets/<name>.mp4`; use it as `{"t": .., "type": "clip", "clip": "p_name.mp4", "from": 0, "zoom": 1.0}`.
   Make every shot at least as long as its slot in scenes.json (a short clip leaves a frozen/black tail).
4. Run long renders with `nohup` (43 shots ≈ 20 min); the session can end mid-render. `proof.mjs` skips nothing, so pass
   only the names still missing when resuming.

## Kinds (see the type definitions at the top of Proof.tsx)

| kind | what it shows | key fields |
|---|---|---|
| `doc` | screenshot on the desk; camera moves; marks draw on | `img, w, h, chip, cam: [[at, x%, y%, zoom]], marks: [{k, r, at, c, note, side}], stamp` |
| `claim` | the other side's clip (muted) tilted in a frame, red DAAVA tag, quote typing in, optional verdict stamp | `clip, from, who, quote, quoteAt, verdict` |
| `donut` | a total split into parts | `title, total, sub, slices: [{label, v, c, at}], credit` |
| `dates` | dated timeline, then the claim struck through and the real figure stamped | `title, items: [{date, text, at}], claim, result` |
| `law` | statute text on paper; `[[phrase]]` gets a marker sweep at `marks[i]` | `head, text, marks, credit` |
| `kinetic` | big words slamming in with shake/flash (hooks, verdict beats) | `lines: [{text, at, size, c, hit}], stamp, bg` |
| `score` | scorecard rows with verdicts | `title, rows: [{claim, verdict, c, at}]` |
| `side` | the speaker in a 700 px column (lips in sync) beside any other kind scaled into the rest | `cam` (a cut of video-studio `assets/camera.mp4` starting at the scene's second), `camFrom, camPos, side, inner: {spec}` |

Mark kinds: `hl` yellow marker, `ul` wobbly underline, `strike`, `circle` hand-drawn ellipse, `box`, `arrow`; `note` writes
in handwriting beside it (`side`: above/below/left/right). Colours: `red`, `green`, `amber`, `gold` or any CSS colour.

## Lessons (Quraishi video, 24 Oct 2026)

- Wide headline crops: keep doc zoom at 1.0–1.35 or the text runs off both edges; tall crops (whole article) can go to ~1.8–2.2
  to read one paragraph. Point `cam` at the mark's centre.
- Hold a mark ~0.3 s before the narration says the words; stamps land on the verdict word.
- The bundle snapshots `public/` when built — `proof.mjs` copies assets before bundling; keep it that way.
- For a clip that is cut into pieces in the narration, make one `claim` shot per piece with its own `from`, so lips stay in sync.
- Put the other side's actual audio in the narration (video-studio `scripts/pick_takes.py cut`, `src` pieces) and show the
  matching `claim` shot over it; their clip scenes are always silent in video-studio.
- Verdict words used: GALAT, ADHA SACH, ADHOORA, BINA SABOOT, SIRF RAAY, KHAARIJ, BADHA-CHADHA, KHUD MAANA (gold, for an own goal).
