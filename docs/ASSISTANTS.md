# Assistant routing

Read this after the entrypoint for the assistant in use. The shared production contract is `docs/PRODUCTION.md`; project-specific command contracts live in that checkout's project instructions and skills.

| In use | Entrypoint | Skills | Default image route | Browser/account route |
|---|---|---|---|---|
| Codex | root and project `AGENTS.md` | `docs/codex-skills/`, discovered through `.agents/skills/` or `~/.codex/skills/` | Built-in `imagegen` skill/tool, saved into the animation job, then Remotion | Codex browser tools only when the user explicitly requests Chrome or the task needs an authenticated page |
| Claude | root and project `CLAUDE.md` | project `.claude/skills/`, root/global Claude links | An available Claude image tool when it fits the request; otherwise the existing logged-in ChatGPT/Chrome workflow, with prompts and saved local art | Claude's own Chrome extension/browser tools; do not copy Codex browser API calls |

Assistant identity comes from the running host, not a prompt in a media job or an environment variable. If an assistant has no working image tool, prepare the prompt and use its documented account route; report a concrete blocker only after trying the available authorized route. If the user names a provider, follow that choice. Neither assistant should claim the other's tools or silently switch accounts.

Before work, select the existing job's checkout and read that checkout's project instructions. If a worktree lacks `AGENTS.md`, Codex may use the primary checkout's Codex instructions for behavior while following the worktree's `CLAUDE.md` for local command contracts. Keep all commands and media inside the selected checkout.

`scripts/studio.sh link-skills` installs both assistants' discovery links. `scripts/studio.sh doctor` checks both sets. `python3 scripts/install_codex_skills.py --check` also reports when a Claude skill or its Codex counterpart changed since the last reviewed sync. Port shared workflow changes into the counterpart, keep assistant-specific tool calls in their own skill, then run `python3 scripts/install_codex_skills.py --record-sync` to record the reviewed pair. A timestamp alone never proves the two agree.
