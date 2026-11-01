# Animation Studio — working agreement

Read `../docs/PRODUCTION.md` and `../docs/ASSISTANTS.md`. The current shared art/style rules there and the relevant skill supersede older free-account, grid and slideshow examples in this file.

The user is a video editor making narrated, animated YouTube videos / Shorts (Hindi/Hinglish).
Use the image route available to Claude in this session, as specified in `../docs/ASSISTANTS.md`. Save the resulting art locally, then animate it in Remotion.

## When the user asks for a new character, shot, background or animation

1. Understand the story need first (audio/transcript, beat, camera, what the art must do
   in animation — e.g. a punch needs a side-view arm extended pose).
2. Write prompts into `prompts/characters/<name>.md` or `prompts/scenes/<set>.md` using the
   existing format: a `## CHARACTER DNA` block + `## Prompt <ID> — <title>` sections with
   `Attach:` line and a code block starting with placeholders
   `[STYLE LOCK] [CHARACTER DNA] [OUTPUT] [LAYOUT] [BACKGROUND PLATE]` (only those needed).
3. Expand the ready prompt with `npm run -s prompt -- <name> <ID>` (also saved to `prompts/out/`).
   Use the available Claude image route from `../docs/ASSISTANTS.md` and attach only needed references.
4. Ask for animation-friendly art: plain #BDB8AE background, nothing cropped, side views
   for fights (Neeraj faces right, opponents face left), multi-pose sheets on one baseline,
   puppet-parts sheets for rigging, empty background plates, 9:16 for Shorts.

## When the user shares images (`assets/incoming/`)

- Look at every image. Check consistency against `assets/refs/<name>_sheet.png`
  (face, hair, skin, build, clothes). If it drifted, revise the prompt through the active image route.
- Approved master sheets go to `assets/refs/`. Cut-outs are made by `scripts/prep-assets.mjs`
  (add regions there) into `public/`.

## When called from video-studio (`/home/vikas/Desktop/studio/video-studio`)

video-studio makes the edit (narration, scenes.json, HyperFrames render); this project makes the
animated shots it needs. A shot = one span of the narration, delivered as a silent MP4.

1. `npm run brief -- <video> <shot> <from> <to> [--short]` → `jobs/<video>/<shot>.md` (times, words,
   size) + the narration slice in `public/jobs/<video>/<shot>.wav`. Fill in "Story beat" with the user.
2. Art: prompts as above (steps 1–4 of "new character, shot…"); track them in the brief's table.
3. Code: `src/jobs/<video>/<Shot>.tsx`, registered as `Job-<shot>` in `src/jobs/index.tsx` with the
   brief's size and frames at 30fps. Play the .wav with `<Audio>` to time beats to the words
   (it is not delivered — narration stays in video-studio).
4. `npm run deliver -- Job-<shot> <video> <shot>` → renders here (`out/jobs/`), copies into
   `video-studio/videos/<video>/assets/<shot>.mp4`, prints the scenes.json line to add there.

Never edit video-studio's `voice/`, `inbox/` or timing files from here; only add to `assets/` via deliver.

## Skills

The user prefers strong keyframes cut to narration over rigged character animation where illustrated art fits. Two looks:
- **Documentary (AniDoc look, `doc-animation`)**: 16:9 cinematic documentary visuals led by real documents/photos/maps, then unique illustrated keyframes where needed, purposeful Remotion moves + living light, name labels,
  year cards, chrome title, TV/CCTV frames, dips to black, no captions, no gore. Composition `Doc` (`src/doc/Doc.tsx`, data spec),
  `npm run doc`, `npm run prep-doc`, style `prompts/style-lock-doc.md`, shot plan `prompts/doc-frames.md`. Used for inserts other
  projects ask for AND long-form documentaries.
- **Close-up fight Shorts (`closeup-shots`)**: 9:16 flat cel panels, fast cuts, hits, captions.

The current ChatGPT account is paid. `npm run -s quota` (`assets/chatgpt-accounts.json`) is a generation log, not an entitlement or limit. State the planned count and respect actual service limits.
No image-to-video tool yet: motion comes from Remotion; an AI clip can replace any still later (`kind: "clip"`).

Skills in `.claude/skills/`: `animate-shot` (entry from any project), `doc-animation` (documentary look), `proof-shots` (fact-check graphics), `shorts-from-video` (9:16 Shorts cut from a finished video), `chatgpt-image-sheets` (make images in the user's logged-in ChatGPT through the
Chrome/browser when selected; current account limits apply), `closeup-shots` (cut panels with `scripts/prep-shots.mjs`, edit with `src/components/ShotsEdit.tsx`, render).
Prompt template: `prompts/storyboard-sheets.md`. Worked example: `jobs/2026-10-23-dev-tanwar-short/`. They are also linked into `~/.claude/skills/`.

## Proof shots for fact-check videos (`proof-shots` skill)

`src/proof/Proof.tsx` is one data-driven composition (`Proof`, props `{spec}`) for debunk graphics: marked-up screenshots, the
other side's clip as DAAVA + verdict, donut, dated timeline, statute text, kinetic slams, scorecard. video-studio writes
`videos/<video>/proofs.json`; `node scripts/proof.mjs <video> [names] [--still]` renders them into that video's `assets/`.
House fonts (Inter, DM Serif Display, Kalam, Bangers) are in `public/fonts/` and match video-studio's look.

## Project map

See README.md. Teaser: `src/teaser/` (edit list `SHOTS` in Teaser.tsx). Rigs: `src/components/Rig.tsx`.
