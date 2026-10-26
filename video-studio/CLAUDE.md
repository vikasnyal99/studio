# Video Studio

Turns one voice recording (plus an optional script) into a finished 1920x1080
YouTube explainer: maps, photos, article screenshots, animated text, music and
sound effects. Hindi/Hinglish narration; on-screen text in Roman Hinglish.

**To make a video, use the `make-video` skill. To change one, use `revise-video`.**
They hold the exact steps; do not improvise a different flow.
Character/cartoon animation is made in `/home/vikas/Desktop/studio/animation-studio`:
use the `animate` skill.
Fact-check / debunk proof graphics (marked-up screenshots, claim-vs-verdict, scorecards) also come from there: `proof-shots` skill.
A talking-head recording with retakes, or where only the to-camera parts should show: `scripts/pick_takes.py` (see `make-video`).

## Rules that always apply

- Every tool is free and runs on this laptop (Linux, no NVIDIA GPU). Never
  add a paid service or upload the user's recording anywhere.
- Never change files in `voice/` or `inbox/`.
- Never invent facts, names, dates, quotes or sources. Anything shown on
  screen as fact needs a link in `research/sources.json`. If the narration
  names a source you cannot find, show what you did find and tell the user.
- Pictures the user supplies (in `library/custom-source/`) are fine to use: prepare them with `scripts/prep_image.py`, credit the source, and ask where they came from. Never use one the user said not to.
- Only free-licence photos (`scripts/find_photos.py` enforces this) and
  screenshots of published pages with the outlet named on screen. No Getty,
  AFP, Reuters or other agency photos. No picture of a person unless the
  identity is certain.
- Do not get round sites that block automated capture; use another outlet.
- Report honestly: say what was not checked, not found, or not tested.

## Spend tokens carefully (the user makes videos daily)

- Scripts do the work. Do not re-implement a step by hand, and do not read
  script source unless one fails.
- Never open these whole: `timing/segments_hi.json`, `timing/words.txt`,
  `hf/index.html`, `sound.json`, `docs/example_scenes.json`, anything in
  `library/`. Use `grep` for the one line you need.
- Read `timing/timeline.txt` once. Find exact cut times with
  `grep -oE "(^| )13[0-9]\.[0-9]:[^ ]*" timing/words.txt` (words from 130 to 139.9 s).
- Look at pictures only as sheets: `make_video.py ... assets` and
  `... check`. One grid image per page capture. No single-frame viewing
  unless a sheet shows a specific problem.
- Write `scenes.json` in one go. One check, fix, at most one more check,
  then one render. Run the render in the background and wait for it.
- Batch web searches (several in one turn); aim for under ten per video.
- Keep replies short: what was made, where it is, what the user must decide.

## Where things are

| Path | What |
|---|---|
| `inbox/` | The user drops recordings and scripts here |
| `videos/<name>/` | One folder per video (see `scripts/new_video.py`) |
| `scripts/` | The pipeline; each file's top comment is its manual |
| `library/` | Shared look (`templates/doc.css`), maps, music, sound effects |
| `docs/SCENES.md` | Every scene type with a copy-paste example |
| `docs/STYLE.md` | How the videos should look and read (opening, sound, pace) |
| `docs/example_scenes_casefile.json` | Finished crime-story storyboard to copy from |

Python is `.venv/bin/python`. HyperFrames needs Node 22, which
`scripts/make_video.py` selects by itself.
