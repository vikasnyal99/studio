# Audio Studio — Regional Indian Folk × Modern / Rap

Folk songs in Garhwali, Kumaoni, Himachali (Pahari), Haryanvi, Rajasthani and Marathi,
blended with modern production (trap/drill drums, 808s, EDM drops, rap verses).

## Layout

```
_shared/
  templates/      song-brief + lyric/prompt templates (copy per song)
  samples/        royalty-free one-shots & loops (dhol, tumbi, algoza…)
  scripts/        helper scripts (new-song, stem split, master)
  references/     free-tools list, licensing notes
languages/<lang>/
  LANGUAGE.md     style sheet: instruments, rhythms, folk forms, vocab notes
  songs/<slug>/   one folder per song (created by _shared/scripts/new-song.sh)
```

## Pipeline (per song)

| # | Stage | Who / Tool | Output |
|---|-------|-----------|--------|
| 1 | Brief — theme, mood, BPM, folk form, fusion style | You + Claude | `brief.md` |
| 2 | Lyrics + hook + rap verse (Devanagari + Roman) | Claude drafts → **native speaker review** | `lyrics.md` |
| 3 | Style prompt + structure tags | Claude | `prompts.md` |
| 4 | Generate full song (vocals + music) | Suno / ACE-Step (Kaggle GPU) | `generations/*.mp3` |
| 5 | Split into stems | Demucs / UVR (local CPU OK) | `stems/` |
| 6 | Fix / replace parts — re-record vocals, layer real dhol samples, add 808s | Audacity / Reaper / BandLab | `mix/` |
| 7 | Master | Matchering (local, reference track) / BandLab Mastering | `master/*.wav` |
| 8 | Release | DistroKid / free distributors, YouTube | — |

See `_shared/references/free-tools.md` for each tool's cost and licensing.

## Start a new song

```bash
_shared/scripts/new-song.sh garhwali pahadi-trap-01
```
