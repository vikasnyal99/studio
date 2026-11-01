#!/usr/bin/env bash
# Studio-wide helper. Run from anywhere.
#
#   scripts/studio.sh status        what is in progress in every project (videos, animation jobs, songs, ideas)
#   scripts/studio.sh doctor        check venvs, Node, ffmpeg, sibling links, skill links, stale absolute paths
#   scripts/studio.sh link-skills   (re)create Claude and Codex skill discovery links
#   scripts/studio.sh where <name>  every file/folder for one video name across all projects
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ok()   { printf '  \033[32mok\033[0m    %s\n' "$*"; }
bad()  { printf '  \033[31mFAIL\033[0m  %s\n' "$*"; FAILS=$((FAILS+1)); }
warn() { printf '  \033[33mwarn\033[0m  %s\n' "$*"; }
FAILS=0

status() {
  echo "== video-studio/videos"
  for v in video-studio/videos/*/; do
    n=$(basename "$v"); [[ $n == _* ]] && continue
    st="setup"
    [ -f "$v/timing/timeline.txt" ] && st="transcribed"
    [ -f "$v/scenes.json" ] && st="storyboard"
    [ -f "$v/output/final.mp4" ] && st="RENDERED"
    extra=""
    [ -d "animation-studio/jobs/$n" ] && extra+=" +anim-job"
    [ -f "$v/proofs.json" ] && extra+=" +proofs"
    [ -d "$v/output/shorts" ] && extra+=" +shorts($(ls "$v/output/shorts" | grep -c '\.mp4$'))"
    idea=$(grep -rl --include='*.md' "$n" idea-generator 2>/dev/null | head -1)
    [ -n "$idea" ] && extra+=" idea:${idea#idea-generator/}"
    printf '  %-45s %-12s%s\n' "$n" "$st" "$extra"
  done
  echo "== animation-studio/jobs (no matching video folder)"
  for j in animation-studio/jobs/*/; do
    n=$(basename "$j"); [ -d "video-studio/videos/$n" ] || printf '  %-45s %s files\n' "$n" "$(ls "$j" | wc -l)"
  done
  echo "== video-studio/inbox"
  ls -1 video-studio/inbox 2>/dev/null | grep -v '^\.gitkeep$' | sed 's/^/  /'
  echo "== audio-studio songs"
  for s in audio-studio/languages/*/songs/*/; do
    [ -d "$s" ] || continue
    st="brief"; grep -q '[^[:space:]]' "$s/lyrics.md" 2>/dev/null && st="lyrics"
    ls "$s/generations" 2>/dev/null | grep -q . && st="generated"
    ls "$s/master" 2>/dev/null | grep -q . && st="MASTERED"
    printf '  %-45s %s\n' "${s#audio-studio/languages/}" "$st"
  done
  echo "== idea-generator (latest 8 notes)"
  find idea-generator -name '*.md' -printf '%TY-%Tm-%Td  %p\n' | sort -r | head -8 | sed 's/^/  /'
  echo "== image generation"
  echo "  Use the active assistant route in docs/ASSISTANTS.md; local quota data is a generation log."
}

doctor() {
  echo "== layout"
  for p in AGENTS.md CLAUDE.md docs/PRODUCTION.md docs/ASSISTANTS.md; do
    [ -f "$p" ] && ok "$p" || bad "$p missing"
  done
  for p in idea-generator video-studio animation-studio audio-studio; do
    [ -f "$p/CLAUDE.md" ] && ok "$p/CLAUDE.md" || bad "$p/CLAUDE.md missing"
    [ -f "$p/AGENTS.md" ] && ok "$p/AGENTS.md" || bad "$p/AGENTS.md missing"
  done
  [ -d animation-studio/../video-studio/videos ] && ok "animation-studio sees ../video-studio" || bad "../video-studio not a sibling"
  echo "== tools"
  video-studio/.venv/bin/python -c 'import faster_whisper' 2>/dev/null && ok "video-studio .venv (faster-whisper)" || bad "video-studio .venv broken: rebuild with python -m venv + pip install -r requirements.txt"
  video-studio/.venv/bin/yt-dlp --version >/dev/null 2>&1 && ok "yt-dlp $(video-studio/.venv/bin/yt-dlp --version)" || bad "yt-dlp missing in video-studio/.venv"
  [ -d video-studio/.venv-img ] && { video-studio/.venv-img/bin/python -c '' 2>/dev/null && ok "video-studio .venv-img" || bad "video-studio .venv-img broken"; }
  [ -d audio-studio/.venv ] && { audio-studio/.venv/bin/python -c '' 2>/dev/null && ok "audio-studio .venv" || bad "audio-studio .venv broken"; }
  [ -d animation-studio/node_modules/remotion ] && ok "animation-studio node_modules" || bad "run: cd animation-studio && npm install"
  command -v ffmpeg >/dev/null && ok "ffmpeg" || bad "ffmpeg not installed"
  ls ~/.nvm/versions/node 2>/dev/null | grep -q '^v22' && ok "Node 22 via nvm (HyperFrames)" || bad "nvm install 22"
  echo "== skills"
  for l in .claude/skills/* ~/.claude/skills/*; do
    [ -L "$l" ] || continue
    [ -f "$l/SKILL.md" ] && ok "skill $(basename "$l")" || bad "broken skill link $l -> $(readlink "$l") (run link-skills)"
  done
  if python3 scripts/install_codex_skills.py --check >/tmp/studio-codex-skill-check.$$ 2>&1; then
    ok "Codex skill links and Claude/Codex reviewed pairs"
  else
    bad "Codex skill links or reviewed pairs (see below)"
    cat /tmp/studio-codex-skill-check.$$
  fi
  rm -f /tmp/studio-codex-skill-check.$$
  echo "== stale absolute paths (outside build/output folders)"
  stale=$(grep -rIl --exclude-dir=node_modules --exclude-dir='.venv*' --exclude-dir=out --exclude-dir=hf \
          --exclude-dir=check --exclude-dir=output --exclude-dir=.git --exclude='*.log' --exclude=studio.sh \
          -E '/home/vikas/Desktop/(video-studio|animation-studio|audio-studio|idea-generator)' . 2>/dev/null)
  [ -z "$stale" ] && ok "none" || { while read -r f; do bad "old Desktop path in $f"; done <<<"$stale"; }
  echo "== git"
  if [ -d .git ]; then
    media=$(git ls-files --cached --others --exclude-standard | grep -iE '\.(mp4|mov|mkv|wav|mp3|m4a|png|jpe?g|webp|txt|srt)$' | grep -v requirements)
    [ -z "$media" ] && ok "no media/txt would be committed" || { bad "media not ignored:"; echo "$media" | head -20 | sed 's/^/        /'; }
  else warn "not a git repo yet (git init)"; fi
  echo; [ $FAILS -eq 0 ] && echo "All good." || echo "$FAILS problem(s)."
}

link_skills() {
  mkdir -p .claude/skills ~/.claude/skills
  # video-studio skills → root (relative links, committed with the repo)
  for s in video-studio/.claude/skills/*/; do
    n=$(basename "$s"); ln -sfn "../../video-studio/.claude/skills/$n" ".claude/skills/$n"; echo "root  : $n"
  done
  # animation-studio skills → global, so any project (and the root) can call them
  for s in animation-studio/.claude/skills/*/; do
    n=$(basename "$s"); ln -sfn "$ROOT/animation-studio/.claude/skills/$n" ~/.claude/skills/"$n"; echo "global: $n"
  done
  python3 scripts/install_codex_skills.py
}

where() {
  n="${1:?video name, e.g. 2026-10-23-quraishi-counter}"
  for d in "video-studio/videos/$n" "animation-studio/jobs/$n" "animation-studio/src/jobs/$n" \
           "animation-studio/public/doc/$n" "animation-studio/public/jobs/$n" "animation-studio/assets/incoming/$n" \
           "animation-studio/out/doc/$n" "animation-studio/out/jobs/$n"; do
    [ -e "$d" ] && echo "$d/"
  done
  grep -rl --include='*.md' --include='*.json' "$n" idea-generator animation-studio/prompts 2>/dev/null
}

case "${1:-status}" in
  status) status ;;
  doctor) doctor; exit $((FAILS > 0)) ;;
  link-skills) link_skills ;;
  where) shift; where "$@" ;;
  *) sed -n '2,8p' "$0"; exit 1 ;;
esac
