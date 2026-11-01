# Studio production contract

These rules apply whether the editor is Claude or Codex. The assistant-specific entrypoint (`CLAUDE.md` or `AGENTS.md`) selects tools; this document defines the shared result. Run project commands from that project's folder.

## Route and hand off

| Work | Project | Workflow |
|---|---|---|
| Ideas, channel review, scripts | `idea-generator/` | `studio-ideas` / project instructions |
| New recording to finished video | `video-studio/` | `make-video` |
| Timestamped video changes | `video-studio/` | `revise-video` |
| Join narration, remove retakes, clean voice | `video-studio/` + `audio-studio/` | `studio-audio` / `join_parts.py`, `clean_voice.py` |
| Animated insert, documentary, action | `animation-studio/` | `animate`, `doc-animation`, `animate-shot`, `closeup-shots` |
| Evidence or verdict graphics | `animation-studio/` | `proof-shots` |
| Shorts from a finished video | `animation-studio/` | `shorts-from-video` |
| Separately recorded Shorts | `video-studio/` + `animation-studio/` | individual 9:16 edit using the appropriate local composition |
| Song, stems, mastering | `audio-studio/` | `studio-music` / project instructions |
| Multiple stages or a new studio | root | `studio-pipeline`, `new-studio-project` |

Use `docs/LINKS.md` for exact handoff files and commands. Keep one `<YYYY-MM-DD>-<slug>` name across projects. Originals live in `video-studio/inbox/`; derived videos in `video-studio/videos/<name>/`; animation jobs in `animation-studio/jobs/<name>/`; incoming art in `animation-studio/assets/incoming/<name>/`. Songs live under `audio-studio/languages/<language>/songs/<slug>/`. Keep scratch in `/tmp` or the job's scratch directory.

The root checkout and `.claude/worktrees/news-look/` may contain different versions of a job. For an existing job, inspect both and use one coherent checkout. Do not mix scene specs, renderer versions, narration timing or derived media between them. Preserve uncommitted work.

## Editing rules

- Preserve source recordings and `inbox/`, `voice/`, `raw/` and timing data. Write revisions under new derived names and deliberately update references. Animation delivers assets; it does not edit source narration.
- The laptop has an Intel iGPU, no CUDA and about 15 GB RAM. Render at 1080p. Review a short sample and contact sheet before long exports; track the render and wait for it to finish.
- New, separately recorded Shorts become individual vertical edits. Crop the subject into 9:16, preserve the speaker and original voice, and use purposeful captions, animated inserts and split/shared-screen layouts. Never stretch landscape footage or leave it small in the frame.
- Hindi/Hinglish narration uses Roman Hinglish screen text. Shorts use timed captions. Documentary animation normally has no captions and keeps violence implied.
- Check narration for fumbles, repeated takes, wrong wording, abrupt joins, clicks and dead air before building visuals. Use the recording and script together; flag any line that needs re-recording. The detailed pass is in `make-video`.
- Verify on-screen facts and keep source URLs and photo licences with the job. User-supplied photos still need provenance. Do not use Getty/AFP/Reuters agency photos or the previously rejected `2.jpeg`.
- For history, lead with documents, real photos and maps. Use war-tactics maps for fights and invasions; use generated art where real material does not exist. Historical territory should spread as approximate shapes, arrows and pins, not whole modern countries coloured or an empire marked by a red circle.
- Do not repeat an image within one video. Avoid a run of full-screen stills: frame documents/photos with marks or callouts; animate maps and text; use drawn art with purposeful camera/light motion. Avoid automatic foreground cut-outs that split bodies. Use one full-quality generated image per documentary keyframe, rather than a 2×2 grid.
- A serious history hook changes visually about every 2–3 seconds during its first 45 seconds and keeps the subject's tone: documents, maps, restrained titles and selective art. Thumbnails for breakdowns and fact-checks should use the video's own frames with markings wherever they fit.
- Audition music under the real voice mix. The current long-video baseline is a 4 dB below-voice bed with about 6 dB ducking; adjust by listening. Keep source, licence and credit. The preferred speed from the latest long-video review was 1.1×, when a speed version is requested.
- Generated media stays out of Git. Commit only when asked. A successful render or media probe does not establish perceptual playback or audio quality; report what was actually reviewed.

## Image generation

The paid ChatGPT account was updated on 27 October 2026. Old free-account quotas are bookkeeping, not entitlement. State a planned image count, use the current account and respect actual service limits. Do not promise unlimited generation. Assistant-specific image routes are in `docs/ASSISTANTS.md`. Do not upload raw recordings to an external service without the user's instruction.
