---
name: new-studio-project
description: Add a new project folder to the studio monorepo (e.g. thumbnail-studio, podcast-studio, a new tool) with the house conventions — its own CLAUDE.md, README, skills folder, ignore rules — and register it in the root docs so other projects can link to it. Use for "naya project banao", "add a new studio", "set up a folder for X".
---

# Add a studio project

1. **Name**: `<thing>-studio` or a plain noun, lowercase-hyphen. Create `studio/<name>/` (sibling of the others).
2. **Files** (keep them short, match the existing projects' tone):
   - `<name>/CLAUDE.md`: goal, rules (free tools, local, no paid services), "Where things are" table,
     how it links to other projects, token rules for its big files.
   - `<name>/README.md`: what it does, daily commands, folder table — written for the user, not a developer.
   - `<name>/.claude/skills/<skill>/SKILL.md` for each repeatable workflow (frontmatter `name`, `description`
     with the user's own trigger phrases, Hinglish ones too).
   - Tool setup: Python → `<name>/.venv` + `requirements.txt` with pinned versions; Node → `package.json`.
3. **Ignore rules**: add a `# ── <name> ──` block to the root `.gitignore` for its generated, media and
   data folders. Check with `git status --short <name>/`: only code, docs, configs and small specs may show.
4. **Register** in the root:
   - `CLAUDE.md`: a row in "The projects", rows in "Route the request" and "Where files go", and the link
     in the diagram if it hands files to another project.
   - `docs/LINKS.md`: a section with the handoff table (step, command, reads, writes).
   - `README.md`: a row in the projects table.
   - `scripts/studio.sh`: add its folder to `doctor`'s CLAUDE.md check, and a `status` block if it has work items.
5. **Skills reachable from the root**: add the project to `link_skills` in `scripts/studio.sh` (root link for
   project-only skills, global link for skills other projects call), then run `scripts/studio.sh link-skills`.
6. Run `scripts/studio.sh doctor` and report the result.
