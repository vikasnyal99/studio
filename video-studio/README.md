# Video Studio

Give a voice recording (and a script if you have one); get back a finished
1920x1080 YouTube explainer with maps, photos, article screenshots, animated
text, music and sound effects. Everything is free and runs on this laptop.

## Making a video

1. Put the recording and the script in `inbox/`.
   - Recording: mp3, wav, m4a, or a video of you speaking (mp4, mov).
   - Script: a plain text file. Optional, but it makes on-screen wording exact.
2. Open a terminal in this folder and start Claude Code:

       cd ~/Desktop/studio/video-studio
       claude

3. Say: **make a video from inbox/myfile.mp3 with script inbox/script.txt**
4. Claude transcribes, researches, builds the scenes, checks them and
   renders. A 10-minute video takes roughly 40 minutes, mostly unattended.
5. The result is in `videos/<name>/output/`:
   - `final.mp4`: the video
   - `description_credits.txt`: paste into the YouTube description (the
     photo and music licences require it)
   - `../timing/subtitles_hi.srt`: upload as captions if you like

## Changing a video

Tell Claude what to change, with times: "at 2:10 use a different photo, at
5:40 the text should say ...". It edits `videos/<name>/scenes.json` and
renders again (about 12 minutes for a 10-minute video).

You can also edit `scenes.json` yourself (one line per scene, explained in
`docs/SCENES.md`) and run:

    .venv/bin/python scripts/make_video.py videos/<name> render

## Keeping the cost down

This project is set up to use few tokens:

- It defaults to the **Sonnet** model (set in `.claude/settings.json`),
  which is much cheaper than Opus and enough for this routine work. To use
  a stronger model for a difficult video, type `/model` in Claude Code.
- Scripts do the heavy work (transcribing, finding photos, capturing pages,
  building, rendering), so Claude mostly writes one storyboard file.
- Claude reviews pictures as a few combined sheets, not one by one.
- Start a **new Claude session for each video** (`/clear` or reopen), so
  earlier videos are not carried along.
- A script makes it cheaper and better: Claude does not have to work out
  wording from the transcript.
- Ask for all your changes in one message, so there is one re-render.

## What it cannot do yet

- Put your own video footage on screen. A video recording is used for its
  sound only.
- Capture pages from sites that block automated browsers (CNN, Al Jazeera,
  Reuters and others). Claude uses another outlet, or you can drop your own
  screenshot into `videos/<name>/assets/`.
- Hear the result. Check the music and effect levels yourself.

## Folders

| Folder | What |
|---|---|
| `inbox/` | Drop recordings and scripts here |
| `videos/` | One folder per video |
| `library/` | The shared look, maps, music and sound effects |
| `scripts/` | The pipeline |
| `docs/` | Scene reference, style guide, a full example |
| `.claude/skills/` | The steps Claude follows (`make-video`, `revise-video`) |

## If something breaks

    .venv/bin/python -m pytest tests/ -q            # the scripts' own tests
    .venv/bin/pip install -r requirements.txt       # reinstall the Python packages

Rendering needs Node.js 22 (installed through nvm; `nvm install 22` restores
it) and FFmpeg. The first transcription on a new machine downloads the
Whisper model (about 1.5 GB).

Music: tracks by Kevin MacLeod, CC BY 4.0; see `library/music/LICENCE.md`.
To add your own, put the file in `library/music/` and name it in a video's
`scenes.json`.
