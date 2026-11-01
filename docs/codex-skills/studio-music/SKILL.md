---
name: studio-music
description: Create regional Indian folk and rap song briefs, lyrics and generation prompts, then separate stems or master local mixes in audio-studio.
---

Instruction location: resolve this installed skill's symlink; its parent `docs/codex-skills/` belongs to the primary Studio instruction root (currently `/home/vikas/Desktop/studio`). Read that root's `docs/CODEX.md` and AGENTS.md. If the selected working checkout lacks the migrated docs or AGENTS.md, use those from the instruction root and its own project CLAUDE.md for command contracts. All media commands and `<studio-root>` placeholders refer to the selected working checkout.

Resolve the Studio workspace (fallback `/home/vikas/Desktop/studio`) and read root and audio-studio AGENTS.md. Run from audio-studio. Spoken voice cleanup uses `studio-audio`.

Read `languages/<lang>/LANGUAGE.md` for Garhwali, Kumaoni, Himachali, Haryanvi, Rajasthani or Marathi. Start with `_shared/scripts/new-song.sh <lang> <slug>`; this refuses to overwrite an existing song. Fill brief.md → lyrics.md → prompts.md using the generated templates. Provide Devanagari, Roman transliteration and English meaning, flag uncertain dialect, and recommend native-speaker review. Describe musical qualities instead of naming artists in generation prompts.

`_shared/references/free-tools.md` records earlier tool research. Verify present pricing/licences before recommending a generation service or commercial release. Use existing local media when supplied; remote generation/upload must be within the user's authorized scope. No CUDA is available locally. Never describe a free generated track as commercially cleared without evidence.

Separate stems:

```bash
_shared/scripts/split-stems.sh languages/<lang>/songs/<slug> languages/<lang>/songs/<slug>/generations/<take>.mp3
```

This runs Demucs through `.venv/bin/python` and writes vocals/drums/bass/other under `stems/htdemucs/`. First use may need a model download. Keep originals and stems distinct; edits/mixes go in `mix/`, recorded vocals in `vocals/`.

Master a supplied mix against a style reference:

```bash
.venv/bin/python _shared/scripts/master.py <mix.wav> <reference.wav> languages/<lang>/songs/<slug>/master
```

Matchering writes 24-bit and 16-bit WAVs. The reference is analyzed, not included in the output. Check duration, clipping/peaks and levels; compare by listening if available and report limits honestly. Only copy a licensed final master into sibling video-studio/library/music/ when requested for a video, recording provenance/licence in LICENCE.md as described in docs/LINKS.md. Do not publish or distribute merely because a master is finished.
