---
name: new-studio-project
description: Add a new media studio folder with both Claude and Codex instructions, skills, and cross-project handoffs.
---

# Add a studio project

1. **Name**: `<thing>-studio` or a plain noun, lowercase-hyphen. Create `studio/<name>/` (sibling of the others).
2. **Files** (keep them short, match the existing projects' tone):
   - `<name>/CLAUDE.md` and `<name>/AGENTS.md`: concise assistant-specific entrypoints that read
     `../docs/PRODUCTION.md` and `../docs/ASSISTANTS.md`, plus the project's command contract.
   - `<name>/README.md`: what it does, daily commands, folder table — written for the user, not a developer.
   - `<name>/.claude/skills/<skill>/SKILL.md` and a Codex counterpart in
     `docs/codex-skills/<skill>/` for each repeatable workflow. Keep provider tool calls separate.
   - Tool setup: Python → `<name>/.venv` + `requirements.txt` with pinned versions; Node → `package.json`.
3. **Ignore rules**: add a `# ── <name> ──` block to the root `.gitignore` for its generated, media and
   data folders. Check with `git status --short <name>/`: only code, docs, configs and small specs may show.
4. **Register** in the root:
   - `CLAUDE.md` and `AGENTS.md`: register the project and assistant-specific routing.
   - `docs/PRODUCTION.md`: register shared routing and handoffs.
   - `docs/LINKS.md`: a section with the handoff table (step, command, reads, writes).
   - `README.md`: a row in the projects table.
   - `scripts/studio.sh`: add its folder to `doctor`'s CLAUDE.md check, and a `status` block if it has work items.
5. **Skills reachable from the root**: add the project to `link_skills` in `scripts/studio.sh`, then run
   `scripts/studio.sh link-skills`. Review Claude/Codex counterparts and record their hashes with
   `python3 scripts/install_codex_skills.py --record-sync`.
6. Run `scripts/studio.sh doctor` and report the result.
