# Studio

All my content projects in one place: ideas → videos → animation → Shorts → music.
Each folder is its own project with its own `CLAUDE.md` and skills; this root ties them together.

| Project | What it makes |
|---|---|
| [`idea-generator/`](idea-generator/CLAUDE.md) | Channel analysis, idea banks, scripts for Udit Naagar, Curious Tail, Movies Fanatic |
| [`video-studio/`](video-studio/README.md) | Voice recording → finished 1080p YouTube explainer |
| [`animation-studio/`](animation-studio/README.md) | Animated shots, AniDoc-style documentaries, fight Shorts, proof graphics, Shorts from videos (Remotion) |
| [`audio-studio/`](audio-studio/README.md) | Regional folk × modern / rap songs |

How they hand work to each other: [`docs/LINKS.md`](docs/LINKS.md).

## Working with Claude

```bash
cd ~/Desktop/studio && claude                 # anything; Claude routes to the right project
cd ~/Desktop/studio/video-studio && claude    # routine video work (cheaper Sonnet default)
```

Things to say at the root:

- "Udit Naagar ke liye 5 ideas do" → idea-generator
- "make a video from inbox/x.mp3" → video-studio (`make-video`)
- "is span ko animate karo" → animation-studio (`animate-shot`)
- "shorts bana do 2026-10-23-quraishi-counter se" → `shorts-from-video`
- "idea se video tak, full pipeline" → `studio-pipeline`
- "status" → `scripts/studio.sh status`

## Helper

```bash
scripts/studio.sh status        # what's in progress everywhere
scripts/studio.sh doctor        # check venvs, Node, ffmpeg, skill links, paths, git ignores
scripts/studio.sh where <video> # every file for one video across projects
scripts/studio.sh link-skills   # fix skill links after moving folders
```

## Git

One repo for everything. Only code, configs, docs, skills, prompts and small project files are
committed. Videos, audio, pictures, `.txt` files, subtitles, renders, models, venvs and
`node_modules` are ignored (`.gitignore`). Media stays on this laptop. Back it up separately.

## Setup on a new machine

```bash
cd video-studio && python3.12 -m venv .venv && .venv/bin/pip install -r requirements.txt yt-dlp
cd ../animation-studio && npm install
nvm install 22            # HyperFrames rendering
sudo apt install ffmpeg
cd .. && scripts/studio.sh link-skills && scripts/studio.sh doctor
```
