---
name: studio-audio
description: Edit multipart Studio narration, remove retakes, reduce noise and enhance spoken audio for videos while preserving original recordings.
---

Instruction location: resolve this installed skill's symlink; its parent `docs/codex-skills/` belongs to the primary Studio instruction root (currently `/home/vikas/Desktop/studio`). Read that root's `docs/CODEX.md` and AGENTS.md. If the selected working checkout lacks the migrated docs or AGENTS.md, use those from the instruction root and its own project CLAUDE.md for command contracts. All media commands and `<studio-root>` placeholders refer to the selected working checkout.

Resolve the Studio root from the workspace (fallback `/home/vikas/Desktop/studio`) and read root, video-studio and audio-studio AGENTS.md. Choose the checkout containing the actual job. Music stems/mastering use `studio-music`.

For one recording, inspect duration, channels and levels with ffprobe/FFmpeg. Process to a new output filename. For multiple parts, transcribe each locally with video-studio's `.venv/bin/python scripts/transcribe.py --input <part> --output-dir <scratch>/<part-name>`. Compare with the script and requested cuts; do not infer a silent gap solely from missing Whisper words.

Write `video-studio/videos/<video>/audio-edit/edl.json`:

```json
{"parts": [{"file": "part1.m4a", "drop": [[3.0, 5.0]], "cut": [], "split": []}]}
```

Order parts in narration order. Times refer to each original file. `drop` removes speech bursts inside the interval; `cut` removes an exact interval; `split` removes a spoken heading and restarts the burst. Verify these intervals against the words; retain cut maps.

From video-studio:

```bash
.venv/bin/python scripts/join_parts.py inbox/<folder> videos/<video>/audio-edit/edl.json videos/<video>/audio-edit/narration_edit_raw.wav
```

It writes the WAV and `narration_edit_raw_cuts.json`. From audio-studio, first process a short representative sample to a new file:

```bash
.venv/bin/python _shared/scripts/clean_voice.py <input> <sample.wav> --sample 60 30 --nr 0.9 --bass 2 --treble 3
```

Choose sample times inside the recording. Do not combine `--sample` with a full-recording `--sections` map: the script does not offset section times for samples. For the full joined output:

```bash
.venv/bin/python _shared/scripts/clean_voice.py <joined.wav> <clean.wav> --sections <joined_cuts.json>
```

The chain repairs clipped peaks, cuts rumble, learns noise from pauses (per recorded part), applies EQ/de-essing/compression, and targets -14 LUFS / -1.5 dB true peak in 48 kHz 24-bit mono WAV. Reduce `--nr` if speech becomes watery. Do not promise recovery of lost clipped detail.

Verify output duration/sample rate/channels, loudness/peaks and joins. Offer the before/after audio for listening; distinguish objective measurements from listening checks. For a new video, pass the cleaned recording to `new_video.py`, then transcribe the resulting voice. For an existing edit, point scenes.json at the new derived recording; regenerate timings and adjust scene/insert/Short times if cuts changed duration. Never blindly reuse pre-cut timestamps.
