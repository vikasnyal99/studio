"""Join a narration recorded in several audio parts into one recording, dropping retakes.

For a voice-only narration recorded in pieces (phone voice memos, one file per section,
retakes and false starts inside). Run it before the normal flow; the result is the
recording you give to new_video.py / transcribe.py.

Usage (from the project folder):

    # 1. transcribe each part to find the retakes (any scratch folder)
    .venv/bin/python scripts/transcribe.py --input <part.wav> --output-dir <scratch>/<part>

    # 2. write the cut list V/audio-edit/edl.json (times are seconds in each original file):
    #    {"parts": [{"file": "rec 1.m4a", "drop": [[a, b], ...], "cut": [[a, b], ...], "split": [[a, b]]}, ...]}
    #    parts in narration order; drop = remove every speech burst lying inside [a, b];
    #    cut = remove exactly [a, b] even in the middle of a burst (a stumble that runs on from a good line);
    #    split = remove a spoken title that runs into the first line (the burst restarts at b)

    # 3. join
    .venv/bin/python scripts/join_parts.py inbox/<folder> V/audio-edit/edl.json V/audio-edit/narration_edit_raw.wav

Writes the joined WAV (48 kHz float) and <out>_cuts.json (each kept piece: part, from, to, out_at).
Pauses inside a part are shortened to at most MAX_GAP, pauses between parts become SECTION_GAP;
all pauses are the real room tone so noise reduction afterwards stays even. Joins are 15 ms crossfades.
Clean the sound afterwards with audio-studio: _shared/scripts/clean_voice.py <out> <clean> --sections <out>_cuts.json
The originals are never changed.
"""

from __future__ import annotations

import json
import subprocess
import sys

import numpy as np

SR = 48000
MAX_GAP, SECTION_GAP, PRE, XF = 0.42, 0.85, 0.08, 0.015


def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def islands(x):
    """Speech bursts: 10 ms frames 14 dB above the noise floor, gaps under 0.3 s merged."""
    hop = SR // 100
    n = len(x) // hop
    e = 20 * np.log10(np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-9)
    on = e > np.percentile(e, 10) + 14
    m, i = [], 0
    while i < n:
        if on[i]:
            j = i
            while j < n and on[j]:
                j += 1
            if m and i / 100 - m[-1][1] < 0.3:
                m[-1][1] = j / 100
            else:
                m.append([i / 100, j / 100])
            i = j
        else:
            i += 1
    return [s for s in m if s[1] - s[0] >= 0.15]


def apply_cuts(isl, cuts):
    for a, b in cuts:
        out = []
        for s, t in isl:
            if t <= a or s >= b:
                out.append([s, t])
                continue
            if s < a:
                out.append([s, a])
            if t > b:
                out.append([b, t])
        isl = out
    return isl


def main(inbox, edl_path, out):
    edl = json.load(open(edl_path))
    pieces, log, t_out = [], [], 0.0
    parts = edl['parts']
    for k, part in enumerate(parts):
        x = load(f"{inbox}/{part['file']}")
        isl = islands(x)
        for a, b in part.get('split', []):
            isl = [[max(s[0], b), s[1]] if s[0] < b < s[1] else s for s in isl if not (s[1] <= b and s[0] >= a)]
        isl = apply_cuts(isl, part.get('cut', []))
        keep = [s for s in isl if not any(s[0] >= d0 and s[1] <= d1 for d0, d1 in part.get('drop', []))]
        dur = len(x) / SR
        for j, (a, b) in enumerate(keep):
            gap = keep[j + 1][0] - b if j + 1 < len(keep) else None
            s0 = a - ((SECTION_GAP / 2 if k else 0.3) if j == 0 else PRE)
            if gap is not None:
                e0 = b + min(gap, MAX_GAP) - PRE
            else:
                e0 = b + (SECTION_GAP / 2 if k + 1 < len(parts) else 0.6)
            e0 = max(e0, b + 0.05)
            s0, e0 = max(0.0, s0), min(dur, e0)
            pieces.append(x[int(s0 * SR):int(e0 * SR)].copy())
            log.append({'part': part['file'], 'from': round(s0, 2), 'to': round(e0, 2), 'out_at': round(t_out, 2)})
            t_out += (e0 - s0) - XF
    xf = int(XF * SR)
    ramp = np.linspace(0, 1, xf)
    y = pieces[0]
    for p in pieces[1:]:
        y = np.concatenate([y[:-xf], y[-xf:] * (1 - ramp) + p[:xf] * ramp, p[xf:]])
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f64le', '-ar', str(SR), '-ac', '1', '-i', '-',
                    '-c:a', 'pcm_f32le', out], input=y.tobytes(), check=True)
    json.dump(log, open(out.replace('.wav', '_cuts.json'), 'w'), indent=1)
    print(f'{out}: {len(y) / SR:.1f} s from {len(log)} pieces of {len(parts)} parts')


if __name__ == '__main__':
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    main(*sys.argv[1:4])
