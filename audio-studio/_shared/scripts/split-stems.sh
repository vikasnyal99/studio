#!/usr/bin/env bash
# Split a generated song into vocals / drums / bass / other with Demucs (CPU).
# Usage: split-stems.sh <song-dir> <audio-file>
#   e.g. split-stems.sh languages/haryanvi/songs/chhora-desi-01 languages/haryanvi/songs/chhora-desi-01/generations/take3.mp3
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SONG_DIR="${1:?song-dir}"; IN="${2:?audio-file}"
"$ROOT/.venv/bin/python" -m demucs -n htdemucs -j 2 -o "$SONG_DIR/stems" "$IN"
echo "Stems in $SONG_DIR/stems/htdemucs/$(basename "${IN%.*}")/"
