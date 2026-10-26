#!/usr/bin/env bash
# Usage: new-song.sh <language> <song-slug>
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LANG_DIR="$ROOT/languages/${1:?language}"
SLUG="${2:?song-slug}"
[ -d "$LANG_DIR" ] || { echo "Unknown language: $1 (see $ROOT/languages)"; exit 1; }
DEST="$LANG_DIR/songs/$SLUG"
[ -e "$DEST" ] && { echo "Exists: $DEST"; exit 1; }
mkdir -p "$DEST"/{generations,stems,vocals,midi,mix,master}
for f in brief lyrics prompts; do
  sed -e "s/{{TITLE}}/$SLUG/g" -e "s/{{LANG}}/$1/g" "$ROOT/_shared/templates/$f.md" > "$DEST/$f.md"
done
echo "Created $DEST"
