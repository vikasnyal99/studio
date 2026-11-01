# Studio for Codex

This is a Hindi/Hinglish creator's connected media workspace. Explain outcomes in practical editor terms. Run each project's commands from that project's folder.

Read `docs/PRODUCTION.md` for rules shared with Claude and `docs/ASSISTANTS.md` for assistant-specific tool routing. This file and each project `AGENTS.md` are Codex entrypoints. Keep provider-specific commands in Codex skills; do not run Claude browser or account instructions as Codex commands.

## Routing

| Request | Project | Skill |
|---|---|---|
| Ideas, channel analysis, scripts | idea-generator | studio-ideas |
| Recording to edited explainer | video-studio | make-video |
| Separately recorded vertical Shorts | video-studio + animation-studio | individual 9:16 edit; use the local VShort/recorded-Short composition |
| Timestamped changes | video-studio | revise-video |
| Join audio parts, remove retakes, enhance voice | video-studio + audio-studio | studio-audio |
| Animated insert into an edit | video-studio + animation-studio | animate |
| Animated story or Short | animation-studio | animate-shot |
| Cinematic documentary keyframes | animation-studio | doc-animation |
| Action storyboard panels | animation-studio | closeup-shots |
| Generate animation art directly in Codex | animation-studio | imagegen |
| Explicitly requested Chrome image workflow | animation-studio | chatgpt-image-sheets |
| Evidence and verdict graphics | animation-studio | proof-shots |
| Vertical clips from a finished video | animation-studio | shorts-from-video |
| Folk/rap song, stems, mastering | audio-studio | studio-music |
| Multiple production stages | root | studio-pipeline |
| Add a studio | root | new-studio-project |

Skills are maintained in `docs/codex-skills/<name>/SKILL.md`, with discovery links in `.agents/skills/` and `~/.codex/skills/` installed by `scripts/install_codex_skills.py`. If a skill is not in the session catalog, read its file directly. Read the target project's AGENTS.md before work. `docs/LINKS.md` defines file handoffs. `docs/CODEX.md` records setup, verification and checkout differences.

## Existing work and naming

The root checkout and `.claude/worktrees/news-look/` contain different versions of some projects. Newer Ramayana edits, Remotion pieces and video renderer features live in `news-look`. Inspect both when continuing that video; use one coherent checkout. Do not merge branches, overwrite edits, or choose an older duplicate merely because it is under the root. When entering the old worktree, also read its project CLAUDE.md for local script contracts; the Codex browser and account guidance here supersedes obsolete Claude-specific instructions.

Use `<YYYY-MM-DD>-<slug>` consistently across video folders, animation jobs and idea notes. Originals go in `video-studio/inbox/`; videos in `video-studio/videos/<name>/`; animation jobs in `animation-studio/jobs/<name>/`; generated art in `animation-studio/assets/incoming/<name>/`; songs in `audio-studio/languages/<language>/songs/<slug>/`. Studio docs and maintained Codex skills go in `docs/`; helpers go in `scripts/`; scratch work goes in `/tmp` or a job-specific scratch directory.

## Production conventions

- Preserve original recordings and existing `inbox/`, `voice/`, `raw/` and timing data. Existing pipeline commands may create their intended derived outputs during setup; revisions use new names and update references deliberately. Animation delivers assets, not edits to source recordings.
- Linux laptop, Intel iGPU, no CUDA, about 15 GB RAM. Render at 1080p; inspect short samples and contact sheets before full renders. Keep long renders observable with logs and a tracked process/session; wait for completion.
- Use existing scripts and local virtual environments. Read script manuals or relevant implementation when needed to resolve a mismatch. Avoid dumping large transcripts, generated HTML, media indexes or dependencies.
- Prefer free local tools. The existing paid ChatGPT subscription is authorized for the project's image workflow; do not add paid services or upload recordings without the user's instruction.
- The 27 October 2026 paid-account update supersedes old free-account quotas. State planned image counts, use the current account, respect actual service limits, and never promise unlimited generation. The old quota script is bookkeeping, not authoritative entitlement.
- User preference updated 28 October 2026: generate animation art directly in Codex using the built-in imagegen skill/tool. Save selected images into the animation job and animate them with Remotion. Chrome image generation is only for an explicit browser request; older skill references to chatgpt-image-sheets do not override this default.
- For new separately recorded Shorts, default to individual vertical edits, preserving the speaker and original voice, with purposeful fun edits, generated-art inserts and split/shared-screen layouts. Do not assume these are excerpts from an existing long-form video. Use fresh Remotion compositions when the existing finished-video Shorts renderer does not fit.
- Verify on-screen facts and log sources. Preserve photo licences and credits; user-provided does not imply ownership. No Getty/AFP/Reuters agency photos under the existing project rules. Do not use the previously rejected `2.jpeg`.
- Keep Hindi/Hinglish narration and Roman Hinglish screen text. Documentary animations default to no captions and implied violence; Shorts use timed captions. Prefer strong illustrated keyframes over puppet rigs unless requested otherwise.
- History videos lead with documents, real photos and maps; fights get war-tactics maps; painted art only where nothing real exists (user, 30–31 October 2026). Full rules are in `doc-animation` and `make-video`.
- Thumbnails show what the video does (decode, compare, debunk): build breakdown and fact-check thumbnails from the video's own frames with markings, using generated art only where no real footage fits.
- Vertical Shorts are real vertical edits: crop to the subject, never stretch landscape footage or place it small inside the 9:16 frame.
- Keep generated media out of Git. Commit only when asked. Report checks honestly; a rendered file alone does not establish playback or audio quality.

Use `scripts/studio.sh status`, `doctor`, or `where <name>` for project helpers. Use `python3 scripts/install_codex_skills.py --check` for skill link health and reviewed-pair drift.
