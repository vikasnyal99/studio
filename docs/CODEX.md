# Studio in Codex

Open `/home/vikas/Desktop/studio` in Codex and ask in normal Hindi/Hinglish or English. Root and per-project AGENTS.md files route work to the correct studio; `docs/PRODUCTION.md` is shared with Claude and `docs/ASSISTANTS.md` selects assistant-specific tools. Maintained Codex skills live in `docs/codex-skills/`; their discovery links are installed with:

```bash
python3 scripts/install_codex_skills.py
python3 scripts/install_codex_skills.py --check
```

The installer links skills into `.agents/skills/` in this repo and `$CODEX_HOME/skills` (default `~/.codex/skills`), preserves conflicting skills, and can be rerun. Codex lists a skill once when both links point to the same folder. `--check` compares content hashes against `docs/skill-sync.json` and reports either side that changed after the last reviewed pair; port shared changes while keeping tool calls provider-specific, then run `--record-sync`. `scripts/studio.sh link-skills` installs both assistants' links and `scripts/studio.sh doctor` checks them. Start a fresh Codex chat if newly installed skills do not appear in the current skill picker.

## What is here

| Area | Existing capabilities | Codex skills |
|---|---|---|
| video-studio | Whisper transcription, retake selection, multipart narration, licensed photos, article crops, maps, HyperFrames edits, music/SFX and credits | make-video, revise-video, animate, studio-audio |
| animation-studio | Remotion animated inserts, cinematic documentary keyframes, action-panel Shorts, proof graphics, vertical cuts, prompt expansion and image preparation | animate-shot, doc-animation, closeup-shots, proof-shots, shorts-from-video, chatgpt-image-sheets |
| audio-studio | Spoken voice enhancement, six regional song styles, song templates, Demucs stems and Matchering masters | studio-audio, studio-music |
| idea-generator | Three channel lanes, analytics notes, topic strategy and scripts | studio-ideas |
| root | Cross-project handoffs, status/doctor/where helpers | studio-pipeline, new-studio-project |

All 11 unique project Claude skills have Codex counterparts. Three skills were added for workflows previously stored only in project instructions: studio-audio, studio-music and studio-ideas. Shared rules are in `docs/PRODUCTION.md`; tool-specific procedures remain in each assistant's skills.

Examples:

- “Inbox ki recordings jod kar retakes hatao aur voice clean karo.”
- “Is recording se video banao.”
- “0:50–1:15 ke liye ChatGPT images se documentary animation banao.”
- “Is final video se 4 Shorts nikalo.”
- “Curious Tail ke liye researched ideas aur script banao.”
- “Haryanvi folk rap ka brief, lyrics aur prompts banao.”

## Browser and image workflow

**28 October update:** the user prefers image generation directly inside Codex. Use the built-in imagegen skill/tool, save the art into the job and animate it with Remotion. Chrome is retained only for explicit browser requests. New separately recorded Shorts should receive individual edits with suitable fun animation and split/shared-screen layouts.

Codex's browser inventory successfully detected the connected Chrome profile and existing ChatGPT/YouTube Studio tabs. The migrated skill uses Codex computer-use APIs and their live documentation. Claude-in-Chrome tools and its injected download code are not used. Generation, reference upload and download were not exercised during this migration; they remain task-time checks.

The newer Claude notes record the paid ChatGPT upgrade on 27 October. The old free-account caps are no longer production limits; actual service limits always apply. Generate needed keyframes, state the planned count and log saved files. Keep the current account; do not promise unlimited images. Native Codex image generation is another route when requested, using the existing imagegen skill/tool.

## Important checkout differences

`.claude/worktrees/news-look/` is a separate existing Git worktree. It contains newer Ramayana full-video work, Remotion compositions, revised narration timing and Shorts. Its recent history includes `11fdcb0` (parts rendering), `d6289a8` (nine Shorts) and `2b5ce74` (Short 1 scene start). Some assets and dependencies are symlinks to shared/root locations. Inspect their targets before editing.

The primary checkout contains local additions including `join_parts.py` and `clean_voice.py` and uncommitted user work. Neither checkout was merged, reset or replaced. For existing Ramayana production, inspect and work from the checkout with the intended latest job. Do not copy newer scenes into an older renderer or mix original and revised narration times.

Codex instructions and skill sources belong to the primary checkout even when commands run in the worktree. Here, **instruction root** means the directory containing this guide; **working Studio root** means the chosen coherent checkout containing the four studio folders. Read main AGENTS.md for Codex behavior and the selected worktree's CLAUDE.md files for its local command contracts. The migrated browser and paid-account guidance supersedes old Claude-specific tooling and quotas.

## Review and verification

Reviewed root/project instructions, all unique project skills, the newer worktree variants, project handoffs, runtime/package manifests, script interfaces, composition and prompt inventory, relevant Claude memory and global skill inventory. Generated media and dependency trees were inventoried rather than read frame-by-frame or treated as source. This was a workflow migration, not a review of every video/audio frame.

Claude's unrelated synced global skills include document/spreadsheet/presentation/PDF tools, browser/computer tools, research, writing-style and memory utilities. Codex already provides relevant artifact and browser tools; those Claude-specific implementations were not duplicated as Studio skills.

- Existing `scripts/studio.sh doctor`: passed.
- Audio imports (numpy, noisereduce, matchering, demucs): passed.
- Existing video test suite: 37 passed, 1 pre-existing failure. `test_chain_scene_lights_each_node_on_its_cue` expects an opening whoosh absent from the current renderer. No media code was changed to force this unrelated test to pass.
- All 14 skills passed the skill-creator validator. Installer creation, repeat runs, read-only checks and conflict preservation passed in an isolated directory. All 14 global links were installed and verified. `git diff --check` passed.
- No full media export, remote song generation or paid-account image batch was performed for this setup task.

Skill structure follows [OpenAI's skill documentation](https://learn.chatgpt.com/docs/build-skills).
