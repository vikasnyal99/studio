"""Master a mix to match a reference track's loudness/EQ using Matchering.

Usage: .venv/bin/python _shared/scripts/master.py <mix.wav> <reference.wav|mp3> <out-dir>
The reference is any professionally mastered song in a similar style (used for analysis only).
"""
import sys
from pathlib import Path

import matchering as mg

if len(sys.argv) != 4:
    sys.exit(__doc__)

mix, ref, out_dir = sys.argv[1], sys.argv[2], Path(sys.argv[3])
out_dir.mkdir(parents=True, exist_ok=True)
stem = Path(mix).stem
mg.process(
    target=mix,
    reference=ref,
    results=[
        mg.pcm24(str(out_dir / f"{stem}_master_24bit.wav")),
        mg.pcm16(str(out_dir / f"{stem}_master_16bit.wav")),
    ],
)
print(f"Masters written to {out_dir}")
