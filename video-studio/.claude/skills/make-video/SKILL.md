---
name: make-video
description: Make a finished YouTube explainer video from a voice recording (and optional script) in this project. Use when the user gives an audio or video file, says "make the video", "new video", or drops files in inbox/.
---

# Make a video

Follow these steps in order. Each step is one command or one file. Read
`CLAUDE.md` for the token rules; they matter as much as the steps.

All commands run from the project folder. `V` below means `videos/<name>`.

## 0. Inputs

The user gives a recording (audio, or a video of them speaking) and usually
a script. If they did not say where, look in `inbox/`. Pick a name:
today's date plus two or three words, e.g. `2026-10-14-farm-laws`.

Ask nothing unless the recording is missing. Defaults: style from
`docs/STYLE.md`, music Interloper and Crypto alternating by section.

## 1. Set up and transcribe

```bash
.venv/bin/python scripts/new_video.py <name> --media inbox/<file> --script inbox/<script>
.venv/bin/python scripts/transcribe.py --input <voice path it printed> --output-dir V/timing
```

Transcription takes about 0.6x the recording's length; run it in the
background and wait for it. If it warns "no words between A and B", or a
stretch of `timeline.txt` is nonsense, redo that stretch:

```bash
.venv/bin/python scripts/transcribe.py --input <voice> --output-dir V/timing --window A B
```

## 2. Read and plan

Read `V/timing/timeline.txt` once (and `V/script.txt` if present: it gives
the correct wording and spellings; the timeline gives the times). The user
follows the script about 90%, so where they differ the recording wins.

Split the video into sections. For each section decide the visuals, best
first: real photo or collage, article screenshot, map, animation (see
`docs/STYLE.md`). A character re-creation (cartoon
shot, fight, story moment with no footage) comes from animation-studio via the
`animate` skill. On-screen text is headings of two to four words only;
never a sentence. Aim for one scene every 3 to 8 seconds.

List every factual claim that will appear on screen (dates, numbers, who
did what, any "according to X").

## 3. Research and assets

Check the claims with web search, several searches in one turn. Record each
in `V/research/sources.json` under `facts` as
`{"claim": ..., "status": "verified" | "not found" | ..., "sources": [urls]}`.

Photos (free licences only, logged automatically):

```bash
.venv/bin/python scripts/find_photos.py V search "Bangladesh quota protest 2024"
.venv/bin/python scripts/find_photos.py V get 1:bd_crowd 4:bd_placard
.venv/bin/python scripts/find_photos.py V wiki "Sheikh Hasina" hasina      # portraits
```

Keep the credit line each download prints; it goes in the scene's `credit`.

Many people in news stories (gang members, militants, victims) have no free photo.
Say so, show a `?` card, and ask the user to download pictures into
`library/custom-source/` named after the person. Then, for each one: look at a contact
sheet, crop off watermarks and bars, upscale small ones, and log it:

```bash
.venv/bin/python scripts/prep_image.py V library/custom-source/<file> <name> --crop l,t,r,b --scale 2
```

Use them on `board` nodes, `case` `photo`, `person`. Credit a named outlet if the picture
carried its watermark; otherwise ask the user for the source before they publish. Never
use `library/custom-source/` files the user has told you not to use (they once ruled out `2.jpeg`).
A cartoon they supply can be cut out with `--cutout`, but check which animation they prefer.

Article screenshots:

```bash
.venv/bin/python scripts/capture_page.py V shot <url> <short_name>
```

If it says the capture looks blocked, try another outlet for the same story
(Wikipedia, regional and smaller outlets usually load; CNN, Al Jazeera,
Reuters, Axios, The Week, The Wire, ThePrint usually do not). Otherwise view
`V/research/shots/<short_name>_grid.jpg` once, read the crop off the grid:

```bash
.venv/bin/python scripts/capture_page.py V crop <short_name> left,top,width,height --outlet "Name" --date 2026-10-07 --url <url>
```

Then look at everything in one go:

```bash
.venv/bin/python scripts/make_video.py V assets     # view the sheets it prints
```

## 4. Write scenes.json

Open `docs/SCENES.md` for the formats. Write the whole `scenes` list into
`V/scenes.json` in one edit, one scene per line, keeping the `voice`,
`duration` and `map` that `new_video.py` wrote. Adjust `music` beds to the
section breaks.

Get exact cut times from the word timings without reading the whole file:

```bash
grep -oE "(^| )13[0-9]\.[0-9]:[^ ]*" V/timing/words.txt    # every word between 130 and 139.9 s
```

## 5. Check, then render

```bash
.venv/bin/python scripts/make_video.py V check
```

View the sheets it prints (one frame per scene, labelled `#index t=second
type`). Look for: text cut off or overlapping, a label on top of a caption,
a wrong or badly cropped picture, a map camera looking at the wrong place.
Fix `scenes.json` and check once more if you changed more than a couple of
scenes.

```bash
.venv/bin/python scripts/make_video.py V render      # background; about 1.2x the video length
```

## 6. Hand over

Tell the user, briefly:

- the file: `V/output/final.mp4`, its length;
- that `V/output/description_credits.txt` must go in the YouTube description
  and `V/timing/subtitles_hi.srt` can be uploaded as captions;
- every claim that was not verified or whose named source was not found,
  and what the screen shows instead;
- anything you could not judge (you cannot hear the mix or watch playback);
- which stretches lean on icon animations because no photo or source
  was found, as the place to add material.

Do not open the video or re-render unless asked.

## Talking-head recording: keep the good takes (`scripts/pick_takes.py`)

When the recording is a video of the user speaking and they want only the strong on-camera parts, or it has retakes:

1. Put it in `V/raw/original.mp4` (copy; `inbox/` stays untouched), its sound in `V/raw/raw.wav`, and transcribe into
   `V/raw/timing`. Whisper's VAD can silently drop whole stretches (it did twice on 24 Oct): if `timeline.txt` jumps
   10+ s with loud audio in between, re-transcribe that window with `vad_filter=False` before deciding it is a gap.
2. `pick_takes.py V scan` scores every sentence (camera gaze from YuNet face landmarks, voice energy, movement) and prints
   `takes_N.jpg` sheets. The gaze score only sees head angle: eyes drifting to notes still score 100, so judge eyes on the sheets.
3. 4K recordings: `pick_takes.py V proxy` once (1080p30, ~6 min for 7 min of 4K HEVC); cutting straight from 4K ran at 0.2x.
4. Write `V/raw/selects.json` (`keep` list, play order; may reorder for a hook and may splice in `src` pieces of the video being
   answered so their real voice is heard). `pick_takes.py V cut` → `voice/original.mp4`, `voice/narration.wav`,
   `assets/camera.mp4`, `raw/cutmap.json` (new second ↔ raw second; map script word times through it). Then transcribe
   `voice/narration.wav` into `V/timing` as usual. `new_video.py` is not used for these.
5. Show the speaker (`camera`, `split`) only where they look into the lens and are lively; cover the rest with proof.

## Fact-check / debunk videos

- Proof graphics come from animation-studio (`proof-shots` skill): write `V/proofs.json`, run
  `node scripts/proof.mjs <video> --still` there, check the one sheet, then render; each becomes a `clip` scene.
- Pattern per claim: speaker says "agla daava" → the other side's own voice (spliced) over a `claim` shot →
  rebuttal over marked-up `doc` shots → verdict `kinetic` stamp. End with a `score` scorecard.
- Hook: their two most quotable lines (real audio) → the user's "ek bhi counter-question nahi" → slams with FACT CHECK.
- Check the user's narration against the source too: on the Quraishi video they swapped two numbers (150/350) in a quote;
  cut it and let the original speaker's clip say it. Cut any claim the narration raises but never answers.

## Quality and sound (user notes, 24 Oct 2026)

- Picture: after a proxy cut, run `pick_takes.py V hqvideo` before the final render (camera re-cut once from the 4K
  original at crf 12; same frames, narration untouched). Set `"crf": 12` in scenes.json for a sharper render (~2x size).
  A small file at crf 16 is normal for dark, mostly still graphics; the visible loss was the camera's repeated encodes.
- For YouTube, also upload a 4K upscale of final.mp4 (`scale=3840:2160:flags=lanczos`, crf 16): YouTube then uses its
  higher-bitrate encoder even for 1080p viewers. A native 4K HyperFrames render crashed after ~4 h; the upscale takes minutes.
- Energetic voice ("make it punchy / amplify"): process the narration into `V/raw/narration_punch.wav` and point
  scenes.json `voice` at it; the mix is still levelled to -14 LUFS (louder masters are turned down by YouTube anyway):
  `highpass=f=80,equalizer=f=250:t=q:w=1.2:g=-2,equalizer=f=3200:t=q:w=1.0:g=3.5,treble=g=2:f=9000,acompressor=threshold=-24dB:ratio=3.5:attack=5:release=110:makeup=5,alimiter=limit=0.93:level=disabled`.
  Music at `below_voice_db` 10 felt more energetic than 13 under a compressed voice.
- Side-by-side narration over a proof shot: animation-studio `proof-shots` kind `side` (speaker column + any proof kind),
  fed a short cut of `assets/camera.mp4` from the scene's start second. Only where the face sheet shows eyes on the lens.
- Shorts for retention: animation-studio `shorts-from-video` skill (`V/shorts.json` → `output/shorts/*.mp4`).
- Credits: screenshots used inside `proofs.json` are credited automatically; put other on-screen sources (numbers,
  statutes, quoted clips) as ready lines in `research/sources.json` `credits_extra` so re-renders keep them.
- Never `pkill -f`/`pgrep -f` a pattern that also appears in your own command line: it kills your own shell. Anchor it
  (`pgrep -f "^ffmpeg.*pieces_hq"`) or kill by PID.

## Lessons from the first full run (Bishnoi video, 17 to 18 Oct 2026)

- Render at 1080p (the script uses crf 16). Never set `"resolution": "4k"` here: it ran 4 h and crashed.
- Before the full render, make a 10 to 15 s sample of anything new (a new animation, the opening) in a throw-away
  `videos/_sample_*` folder (symlink `assets/`, cut the voice with ffmpeg) and show it first; delete the folder after.
- Where editing is slow (a scene over about 6 s, or a plain speaker shot), use `split` (speaker beside a picture); the user likes it.
- The opening must have something new every 2 to 3 s (see `docs/STYLE.md`, Opening).
- Whoosh only at big moments; music about 13 dB under the voice (`docs/STYLE.md`, Sound).
- Wait for a render with `wait` on its PID or by reading its log; `pgrep -f` inside a watcher matches itself and never ends.
- `docs/example_scenes_casefile.json` is the finished crime-story storyboard (comic opener, boards, case files, forensic, recon).
