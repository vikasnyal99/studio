---
name: make-video
description: "Turn a recording into a finished Studio explainer video with researched visuals, narration, music and credits."
---

Instruction location: resolve this installed skill's symlink; its parent `docs/codex-skills/` belongs to the primary Studio instruction root (currently `/home/vikas/Desktop/studio`). Read that root's `docs/CODEX.md` and AGENTS.md. If the selected working checkout lacks the migrated docs or AGENTS.md, use those from the instruction root and its own project CLAUDE.md for command contracts. All media commands and `<studio-root>` placeholders refer to the selected working checkout.

Resolve `<studio-root>` from the current workspace: use the ancestor containing the four studio folders. When outside this repo, the installed source is `/home/vikas/Desktop/studio`. For an existing job, check `docs/CODEX.md` for the newer `news-look` worktree before choosing its files; do not mix checkouts.

Read `<studio-root>/AGENTS.md` and the relevant project's AGENTS.md. Run commands from `<studio-root>/video-studio`; replace placeholders with actual paths. Other skills are in `<studio-root>/docs/codex-skills/`.

Read [the workflow](references/workflow.md) to perform this task. Preserve source recordings. Use Codex tools available in the current session. Animation art defaults to the built-in `imagegen` skill/tool, then local Remotion animation; this supersedes older browser-art steps in the workflow reference. Use `chatgpt-image-sheets` only for explicit Chrome requests. Report only validation actually performed.
