# How the studio projects link

Every handoff is a file in a known place plus one command. Names are always the video name
`<YYYY-MM-DD>-<slug>` (written `<video>` below). Paths are relative to the studio root.

## 1. idea-generator → video-studio (topic and script)

| Step | Who | File |
|---|---|---|
| Idea picked | idea-generator | `idea-generator/channels/<channel>/…` or `strategy/<topic>-<date>.md` |
| Script written | idea-generator | `idea-generator/channels/<channel>/scripts/<slug>/final_script.md` (+ `brief.md`) |
| User records it | user | drops the recording in `video-studio/inbox/` |
| Script handed over | active assistant | `cp idea-generator/…/final_script.md video-studio/inbox/<slug>.txt` (plain text) |
| Video made | video-studio | `make-video` → `video-studio/videos/<video>/` |

Write the video name back into the idea's markdown (`Video: <video>`) so `scripts/studio.sh status`
can show which idea became which video and for which channel.

## 2. video-studio ⇄ animation-studio (animated shots)

Run from `animation-studio/`. It reads `../video-studio/videos/<video>/` directly.

| Need | Command (in animation-studio) | Reads | Writes |
|---|---|---|---|
| Animated shot for a span | `npm run -s brief -- <video> <shot> <from> <to> [--short]` | `../video-studio/videos/<video>/timing/`, `voice/` | `jobs/<video>/<shot>.md`, `public/jobs/<video>/<shot>.wav` |
| Deliver a Remotion shot | `npm run -s deliver -- Job-<shot> <video> <shot>` | `src/jobs/<video>/` | `../video-studio/videos/<video>/assets/<shot>.mp4` + prints the `clip` scene line |
| Documentary insert | `npm run -s doc -- jobs/<video>/<shot>.json --deliver <video> <shot>` | `public/doc/<video>/` | same as deliver |
| Proof graphics | `node scripts/proof.mjs <video> [names] [--still]` | `../video-studio/videos/<video>/proofs.json` | `../video-studio/videos/<video>/assets/` |
| Shorts from a finished video | `node scripts/shorts.mjs <video> [names] [--still]` | `../video-studio/videos/<video>/shorts.json`, `output/final.mp4` | `../video-studio/videos/<video>/output/shorts/<name>.mp4` |

Then, back in video-studio: add the printed scene line to `videos/<video>/scenes.json` and render
(`revise-video`). Animation never edits `voice/`, `inbox/`, `timing/` or `raw/`.

## 3. Art → animation-studio

Prompts in `animation-studio/prompts/` → images (Codex imagegen or Claude's available image/ChatGPT route; see `docs/ASSISTANTS.md`) →
`animation-studio/assets/incoming/<video>/` → `npm run -s prep-doc -- <video>` / `scripts/prep-shots.mjs`
→ `public/…`. Log actual generations; the old quota tracker is not an account limit.

## 4. audio-studio → video-studio (own music)

A finished song master (`audio-studio/languages/<lang>/songs/<slug>/master/*.wav`) can be used as
video music: copy it to `video-studio/library/music/<slug>.wav` and add a line to
`video-studio/library/music/LICENCE.md` ("own composition, audio-studio/<lang>/<slug>"). Only songs
made on a commercial-licence tier (see `audio-studio/_shared/references/free-tools.md`).

## 5. Shared tools

| Tool | Lives in | Used by |
|---|---|---|
| yt-dlp | `video-studio/.venv/bin/yt-dlp` | all projects (audio downloads, channel stats) |
| Whisper transcription | `video-studio/scripts/transcribe.py` | video-studio, animation-studio (via a video folder) |
| Narration in parts → one file | `video-studio/scripts/join_parts.py` | video-studio |
| Voice clean-up (noise, EQ, loudness) | `audio-studio/_shared/scripts/clean_voice.py` | video-studio, animation-studio |
| House fonts | `animation-studio/public/fonts/`, `video-studio/library/fonts/` | both video projects (keep the same fonts) |

## Rules for links

- Projects find each other as **siblings** (`../video-studio`). Don't move one out of the root.
- Prefer relative paths in new scripts. If a doc needs an absolute path, use
  `/home/vikas/Desktop/studio/<project>`; `scripts/studio.sh doctor` flags any stale path.
- Each project stays runnable alone: start Claude or Codex inside it and its own `CLAUDE.md` or `AGENTS.md` applies. Both read `docs/PRODUCTION.md` and `docs/ASSISTANTS.md`.
