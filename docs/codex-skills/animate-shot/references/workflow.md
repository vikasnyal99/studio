# Animate with animation-studio (from any project)

Pick the method first:
- **Story / documentary / explainer beats** (true events, people, places, history; 16:9 inserts or long-form) → `doc-animation`
  (AniDoc look: cinematic keyframes + slow 2.5D moves, labels, year cards). Its own steps replace 3-5 below.
- **Fights and fast action Shorts** → close-up storyboard edit (`closeup-shots`), which the user liked far more than rigged puppets.
Work in `<studio-root>/animation-studio`; read its `AGENTS.md` first.

1. **Get the audio** (the user keeps the original audio):
   - YouTube link: download audio only, locally, into a NEW folder: `<studio-root>/video-studio/.venv/bin/yt-dlp -x --audio-format wav --no-playlist -o "src.%(ext)s" <url>`
     (a "no JavaScript runtime" warning is harmless). Note the channel/title in your reply.
   - Local file: use it as is. Never modify the user's `voice/` or `inbox/`.
   - Make the video folder: `cd <studio-root>/video-studio && .venv/bin/python scripts/new_video.py <date>-<name> --media <wav>`, then
     `.venv/bin/python scripts/transcribe.py --input <voice path printed by new_video.py> --output-dir videos/<name>/timing` (takes minutes; read `timing/timeline.txt` once).
2. **Ask once (a concise clarification), only what you cannot decide:** which span (whole / from a time / one scene), who the characters are, 9:16 Short or 16:9.
   Ask the user to confirm the story beats in their own words: Whisper Hindi is unreliable. Honour requested audio cuts exactly.
3. **Characters:** reuse an existing sheet in `assets/refs/` or `prompts/characters/` (Neeraj exists); new people are generic designs written as a CHARACTER DNA block in `prompts/characters/<name>.md`. No real person's likeness unless the user supplied it.
4. **Art + edit:** `chatgpt-image-sheets` (paid plan: say the image count, then generate), then `closeup-shots` or `doc-animation`.
5. **Deliver:** the finished MP4 goes to `<video project>/videos/<name>/output/`. For a shot inside a longer video-studio video use
   `npm run -s brief -- <video> <shot> <from> <to>` and `npm run deliver` as described in animation-studio's `AGENTS.md` (silent clip + `clip` scene line).
6. Keep the reply short: file path, what is in it, what was not checked, decisions left for the user.
