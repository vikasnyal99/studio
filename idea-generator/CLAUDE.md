# Idea Generator

Ideas, channel analysis, strategy and scripts for the user's 3 YouTube channels. Output is Markdown
the user reads, plus final scripts that video-studio turns into videos (`../docs/LINKS.md` §1).

## Channels and their lanes (no overlap)

| Channel | Lane | Never |
|---|---|---|
| **Udit Naagar** (@UditNaagar, 18.8K) | NCR / Haryana / West UP + Gurjar stories: legends, villages, money, debates | pan-India politics, film reviews |
| **Curious Tail** (@curioustail8838, user's own account) | Real stories behind movies, Indian history, mythology (43% female audience) | politics, protests, crime gossip |
| **Movies Fanatic** (@moviesfanatic4616) | Films explained in Hindi: endings, hidden details, Korean originals | real-history deep dives |

Current plan: `strategy/30-day-revival-plan-2026-10-24.md` (Oct 24 – Nov 22, 2026). A shared event
(e.g. Ramayana) can go on two channels, each from its own angle.

## Rules

- Re-fetch stats before suggesting: `../video-studio/.venv/bin/yt-dlp` (flat playlist JSON into
  `channels/<channel>/data/`). YouTube Studio analytics go through the Chrome extension (all 3 Google
  accounts are logged in; switch via avatar → Switch account; click the analytics tabs, direct URLs render blank).
- Facts in ideas are "as reported" until verified; mark unverified ones. Never invent numbers.
- Titles and thumbnail text in Hinglish (Roman script).

## Where things are

| Path | What |
|---|---|
| `channels/<channel>/analysis-<date>.md` | channel analysis |
| `channels/<channel>/data/` | scraped stats (not committed) |
| `channels/<channel>/scripts/<slug>/` | `brief.md` + `final_script.md` for a video |
| `strategy/<topic>-<date>.md` | cross-channel plans, idea banks |
| `research/benchmarks/` | big-channel comparisons (Think School, Dhruv Rathee) |
| `research/counter-videos/<youtube id>/` | material for reply / fact-check videos |

When an idea becomes a video, add `Video: <YYYY-MM-DD-slug>` (the video-studio folder name) to its note.
Don't open `data/*.jsonl` whole; use `grep` or `python -c` to pull fields.
