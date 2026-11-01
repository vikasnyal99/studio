---
name: studio-pipeline
description: Run a piece of work across the studio projects end to end — idea → script → recorded video → animation inserts / proof graphics → Shorts (and own music). Use from the studio root when a request spans projects ("is idea pe video banao", "idea se shorts tak", "full pipeline"), or when unsure which project a request belongs to.
---

# Studio pipeline (from the root)

Each stage belongs to one project. Read that project's `CLAUDE.md` before its stage, run its commands
from inside its folder (`cd <project> && …`), and use its own skill. Handoffs: `docs/LINKS.md`.
Stop at any stage the user did not ask for.

## 0. Name it

Video name = `<today YYYY-MM-DD>-<2-3 word slug>`. Use it unchanged in every project.
`scripts/studio.sh where <name>` lists everything already made under that name.

## 1. Idea and script — `idea-generator/`

- Pick the channel by its lane (`idea-generator/CLAUDE.md`). Refresh stats with yt-dlp before suggesting.
- Script → `idea-generator/channels/<channel>/scripts/<slug>/final_script.md` (Hinglish, the user records it).
- Add `Video: <name>` to the idea note.

## 2. Recording → video — `video-studio/` (skill `make-video`)

- The user records and drops the file in `video-studio/inbox/`. Copy the script there as plain text:
  `cp idea-generator/channels/<channel>/scripts/<slug>/final_script.md video-studio/inbox/<slug>.txt`.
- Follow `make-video` exactly. It decides where animation, proofs or photos go.

## 3. Animation and graphics — `animation-studio/`

| The beat needs | Skill |
|---|---|
| true-story / documentary re-creation (16:9 insert) | `doc-animation` |
| fight, fast action, animated Short | `animate-shot` → `closeup-shots` |
| debunk / fact-check proof | `proof-shots` (video-studio writes `proofs.json`) |
| new art | Claude image route in `docs/ASSISTANTS.md`; state the planned count and respect live limits |

Deliveries land in `video-studio/videos/<name>/assets/`; add the printed scene lines to `scenes.json`
and re-render with `revise-video`. While art is pending, the edit continues with a `card` placeholder.

## 4. Shorts — `animation-studio/` (skill `shorts-from-video`)

After `video-studio/videos/<name>/output/final.mp4` exists. Output: `output/shorts/`.

## 5. Own music (optional) — `audio-studio/`

Only a mastered song with a commercial licence: copy to `video-studio/library/music/` and note it in
`LICENCE.md` (see `docs/LINKS.md` §4).

## Finish

`scripts/studio.sh status` and reply in a few lines: what exists now (paths), what is waiting on the
user (recording, images, approval), what was not checked.
