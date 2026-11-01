# Audio Studio for Codex

Read root AGENTS.md. Use `studio-audio` for spoken narration cleanup and retakes; use `studio-music` for regional folk/rap songs, stem separation and reference mastering. Commands run here with `.venv/bin/python`.

`_shared/scripts/clean_voice.py` handles de-clipping, section-aware noise reduction, EQ, de-essing, compression and -14 LUFS output. Preserve source files, compare a short sample, and do not describe measured levels as proof of perceived quality.

For songs: `_shared/scripts/new-song.sh <lang> <slug>`, then brief → lyrics → prompts. Read `languages/<lang>/LANGUAGE.md` and `_shared/references/free-tools.md`. Lyrics need Devanagari, Roman transliteration and English meaning; flag uncertain dialect and recommend native review. No real artist names in generation prompts and no real singer voice cloning without consent. GPU generation belongs on an explicitly authorized remote service; this laptop has no CUDA. Verify current commercial licensing before using generated music in a release.
