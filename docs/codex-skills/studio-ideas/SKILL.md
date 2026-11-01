---
name: studio-ideas
description: Research ideas, analyze the creator's three YouTube channels and write Hindi/Hinglish video scripts with Studio handoffs.
---

Instruction location: resolve this installed skill's symlink; its parent `docs/codex-skills/` belongs to the primary Studio instruction root (currently `/home/vikas/Desktop/studio`). Read that root's `docs/CODEX.md` and AGENTS.md. If the selected working checkout lacks the migrated docs or AGENTS.md, use those from the instruction root and its own project CLAUDE.md for command contracts. All media commands and `<studio-root>` placeholders refer to the selected working checkout.

Resolve the Studio workspace (fallback `/home/vikas/Desktop/studio`) and read root and idea-generator AGENTS.md. Work from idea-generator. Read the channel's latest analysis and applicable strategy notes; historical subscriber counts and plans are not current analytics.

Choose the channel by lane: Udit Naagar (@UditNaagar) for regional/Gurjar stories; Curious Tail (@curioustail8838) for real stories behind movies, history and mythology; Movies Fanatic (@moviesfanatic4616) for Hindi movie explanations. A cross-channel event needs different angles.

Refresh relevant public metadata with sibling video-studio's `.venv/bin/yt-dlp --flat-playlist --dump-json <channel-videos-url>`, saving it under `channels/<channel>/data/`. For private analytics, use available Codex browser tools to select the correct logged-in YouTube Studio account and date range. Read live browser documentation; click Analytics tabs if direct URLs fail. Do not post, alter channel settings or infer analytics from unavailable fields.

Separate observed numbers, sourced facts and hypotheses. Verify story claims with primary sources where possible, preserve URLs, and mark unresolved claims. Write concise ideas with channel fit, hook, Roman Hinglish title/thumbnail wording and evidence needs. Save analyses as `channels/<channel>/analysis-<date>.md` or cross-channel plans in `strategy/`.

For an approved topic, create `channels/<channel>/scripts/<slug>/brief.md` and `final_script.md`. Match narration to the user's requested Hindi/Hinglish style. When moving into production, use the same `<YYYY-MM-DD-slug>` job name, add `Video: <name>` to the note, and follow docs/LINKS.md and `make-video`. Do not invent a recording or begin unrelated production stages.
