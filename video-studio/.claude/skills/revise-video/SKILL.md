---
name: revise-video
description: Change an existing video in this project from the user's notes (swap a picture, fix text, retime a cut, change music) and render it again. Use when the user gives feedback or timestamps on a video already made.
---

# Revise a video

`V` means `videos/<name>`. All edits happen in `V/scenes.json`.

1. Turn each note into scene edits. The user gives times as they appear in
   the video (m:ss); `t` values are seconds. Find the scene without reading
   the whole file:

   ```bash
   grep -n '"t": 43[0-9]' V/scenes.json        # scenes starting at 430 to 439 s
   ```

2. Edit only those lines. Formats are in `docs/SCENES.md`.
   - New photo: `scripts/find_photos.py V search ...` then `get`.
   - New screenshot: `scripts/capture_page.py V shot ...` then `crop`.
   - The user's own picture: copy it into `V/assets/` and add it to
     `V/research/sources.json` under `photos` with `"licence": "own work"`.
   - Music: change the `music` beds at the top of the file. Tracks are in
     `library/music/`.
   - Look and sizes for every video: `library/templates/doc.css`. Change it
     only if the user asks for a style change, and say that it affects all
     future videos.

3. Check only if a layout could have changed (new picture, longer text, a
   map move). Wording fixes do not need a check.

   ```bash
   .venv/bin/python scripts/make_video.py V check
   ```

   View only the sheet that holds the changed scenes (20 scenes per sheet,
   in order).

4. Render once, in the background, after all notes are applied:

   ```bash
   .venv/bin/python scripts/make_video.py V render
   ```

5. Reply with what changed, by timestamp, and anything you could not do.

If a note is about what the narration says (a wrong fact or attribution in
the recording), you cannot fix it in the edit: say so and suggest
re-recording that line.
