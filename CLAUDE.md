# Studio — root of all the user's content projects

This is Claude's entrypoint. Read `docs/PRODUCTION.md` for rules shared with Codex and `docs/ASSISTANTS.md` for the current Claude image/browser route. This file and each project's `CLAUDE.md` supply Claude-specific tool and command details. Shared production rules in `docs/PRODUCTION.md` supersede older examples below when they differ.

One monorepo, four projects that feed each other. Claude may be started here (root) or inside any
project folder. **From the root: route the request to the right project, read that project's
`CLAUDE.md` before touching it, and run its commands from inside its folder** (`cd video-studio && …`):
every script uses paths relative to its own project.

The user is a Hindi/Hinglish YouTube creator and video editor (3 channels, see idea-generator).
Explain in practical editor terms, not dev jargon. Keep replies short: what was made, where it is,
what the user must decide.

## The projects

| Folder | Does | Stack | Read first |
|---|---|---|---|
| `idea-generator/` | Channel analytics, strategy, idea banks, final scripts for the 3 channels | Markdown + yt-dlp | `idea-generator/CLAUDE.md` |
| `video-studio/` | Voice recording (+ script) → finished 1920x1080 explainer (maps, photos, screenshots, text, music, SFX) | Python `.venv`, HyperFrames, Node 22 | `video-studio/CLAUDE.md` |
| `animation-studio/` | Animated shots, AniDoc documentaries, close-up fight Shorts, proof graphics, Shorts cut from videos | Remotion (React/TS), ChatGPT art | `animation-studio/CLAUDE.md` |
| `audio-studio/` | Regional folk × modern/rap songs (Garhwali, Kumaoni, Himachali, Haryanvi, Rajasthani, Marathi) | Suno/ACE-Step, Demucs, Matchering | `audio-studio/CLAUDE.md` |

## Route the request

| The user says… | Go to | Skill |
|---|---|---|
| "idea do", "topics", "channel analysis", "kya banaun", "script likho" | idea-generator | — (see its CLAUDE.md) |
| "make a video", gives a recording, "inbox mein daala" | video-studio | `make-video` |
| separate phone recordings for Shorts | video-studio + animation-studio | individual 9:16 edit using the local VShort/recorded-Short composition |
| changes with timestamps on an existing video | video-studio | `revise-video` |
| "animate this", "animation chahiye", cartoon/fight/re-enactment | animation-studio | `animate-shot` (→ `closeup-shots` / `doc-animation`) |
| "documentary animation", "AniDoc jaisa", 2D insert | animation-studio | `doc-animation` |
| "debunk", "fact check", "proof dikhao", markings on an article | animation-studio (graphics) + video-studio (edit) | `proof-shots` |
| "shorts bana do", "reels from the video" | animation-studio | `shorts-from-video` |
| Animation art needed | animation-studio | `chatgpt-image-sheets` or an available Claude image tool, following `docs/ASSISTANTS.md` |
| song, lyrics, folk/rap track | audio-studio | — (`_shared/scripts/new-song.sh`) |
| idea → finished video → Shorts (end to end) | all | `studio-pipeline` |
| add a new studio/tool folder | root | `new-studio-project` |
| "what's in progress", "status", "sab theek hai?" | root | `scripts/studio.sh status` / `doctor` |

Skills live in each project's `.claude/skills/`. The root `.claude/skills/` links video-studio's skills
and holds the root skills; animation-studio's skills are linked globally in `~/.claude/skills/`
(re-link after moving folders: `scripts/studio.sh link-skills`).

Codex uses its own skills in `docs/codex-skills/`. After changing a shared workflow here, port the change to its Codex counterpart and record the reviewed pair with `python3 scripts/install_codex_skills.py --record-sync`. The checker reports later drift by content hash.

## Where files go (never leave files in the root)

| Thing | Location |
|---|---|
| A video (any channel) | `video-studio/videos/<YYYY-MM-DD-slug>/` (created by `scripts/new_video.py`) |
| User's raw recordings / scripts dropped in | `video-studio/inbox/` (never modify) |
| Animation job for that video | `animation-studio/jobs/<same video name>/` (+ `src/jobs/<name>/`, `public/doc/<name>/`) |
| ChatGPT images the user/Claude made | `animation-studio/assets/incoming/<video name>/` → approved sheets `assets/refs/` |
| Prompts | `animation-studio/prompts/characters/<name>.md`, `prompts/scenes/<set>.md` |
| Idea, analysis, plan | `idea-generator/channels/<channel>/…` or `idea-generator/strategy/<topic>-<date>.md` |
| Video script written from an idea | `idea-generator/channels/<channel>/scripts/<slug>/final_script.md` |
| Song | `audio-studio/languages/<lang>/songs/<slug>/` (via `new-song.sh`) |
| Studio-wide docs | `docs/` (root) |
| Studio-wide helper scripts | `scripts/` (root) |
| Scratch / temp files | the session scratchpad, never the repo |

**One name everywhere:** a piece of work is named `<YYYY-MM-DD>-<slug>` (date the video folder was
made). The same name is used for the video-studio folder, the animation-studio job, the
`public/doc/` art folder and in idea-generator notes. This is what links the projects; keep it identical.

## How the projects connect

Full contracts (who writes which file, which command does the handoff): `docs/LINKS.md`. In short:

```
idea-generator ──final_script.md──► video-studio/inbox/ ──make-video──► videos/<name>/
                                                     │                        │
             animation-studio ◄──brief / proofs.json / shorts.json──────────┘
                     │  npm run deliver · scripts/proof.mjs · scripts/shorts.mjs
                     └──silent MP4s into videos/<name>/assets/, Shorts into videos/<name>/output/shorts/
audio-studio ──master/*.wav (own songs, licence-free)──► video-studio/library/music/
```

- animation-studio reaches video-studio as the **sibling folder `../video-studio`** (bridge, proof, shorts
  scripts). Keep both folders side by side in this root.
- animation-studio borrows `../video-studio/.venv/bin/yt-dlp`; idea-generator uses the same yt-dlp.
- Never edit another project's `voice/`, `inbox/`, `timing/` or `raw/` files. Animation only *adds* to
  `videos/<name>/assets/` (via deliver) and `output/shorts/`.

## Rules that apply in every project

- Prefer local tools on this laptop (Linux, Intel iGPU, no CUDA, 15 GB RAM). The current paid ChatGPT image account is authorized for art; do not add another paid service or upload recordings without instruction.
- Never invent facts, names, dates, quotes or sources; anything on screen as fact needs a source.
- No agency photos (Getty/AFP/Reuters); only free-licence or user-supplied pictures, credited.
- The current ChatGPT account is paid. State the planned image count and respect live limits; `npm run -s quota` is only a generation log. Use the Claude image route in `docs/ASSISTANTS.md`.
- Renders: 1080p (4K crashes here). Run long renders in the background and wait.
- Report honestly: what was not checked, not found, not tested.

## Tokens (the user works daily)

- Scripts do the work; don't re-implement a step or read script source unless it fails.
- Don't open big generated files whole (`timing/*.json`, `words.txt`, `hf/index.html`, `library/`,
  `node_modules/`, `out/`, `data/*.jsonl`). `grep` for the line you need.
- Look at pictures as contact sheets, not one by one.
- Start a new session per video. For routine video work, starting Claude inside `video-studio/`
  uses its cheaper Sonnet default.

## Git

This root is the only git repo. `.gitignore` keeps media (video/audio/images), `.txt`, subtitles,
logs, models, venvs, `node_modules`, renders and scraped data out; code, configs, docs, skills,
prompts and small specs (`scenes.json`, `proofs.json`, briefs, lyrics) go in. Before committing,
`git status` must show no media; if a new generated folder appears, add it to `.gitignore`.
Commit only when the user asks.

## Memory

Each project keeps its own Claude memory (`~/.claude/projects/-home-vikas-Desktop-studio-<project>/memory/`).
When working on a project from the root, read that project's `MEMORY.md` for user preferences and
in-progress video status.
