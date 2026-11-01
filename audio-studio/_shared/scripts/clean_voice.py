"""Clean up a spoken narration (phone/room recording) for YouTube.

Usage: .venv/bin/python _shared/scripts/clean_voice.py <in.wav|m4a|mp3> <out.wav> [--sample 60 30] [--nr 0.9] [--bass 2] [--treble 3]

Chain: de-clip -> rumble cut (75 Hz) -> noise reduction learned from the pauses (noisereduce)
-> EQ (bass warmth, less mud, presence, treble air) -> de-ess -> gentle compression
-> loudness -14 LUFS, true peak -1.5 dB. Output: 48 kHz 24-bit mono WAV. The input is never changed.
--sample A B   process only B seconds from A (quick before/after test)
--nr           how much noise to remove, 0-1 (higher = cleaner but can sound watery)
--bass/--treble  shelf boosts in dB
--sections C   for a narration joined from several recordings: the *_cuts.json listing where each part starts
"""
import argparse
import json
import subprocess
import sys

import numpy as np
import noisereduce as nr

SR = 48000


def ff(args, data=None):
    return subprocess.run(['ffmpeg', '-v', 'error', '-y', *args], input=data, capture_output=True, check=True).stdout


def read(path, extra=()):
    return np.frombuffer(ff(['-i', path, *extra, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-']), np.float32).copy()


def filt(x, chain):
    return np.frombuffer(ff(['-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', chain, '-f', 'f32le', '-'],
                            x.astype(np.float32).tobytes()), np.float32).copy()


def frames_db(x, hop=480):
    n = len(x) // hop
    return 20 * np.log10(np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-9), hop


def denoise(x, amount):
    # noise profile = the quietest 5% of 10 ms frames (pauses / breaths between words)
    e, hop = frames_db(x)
    quiet = np.flatnonzero(e < np.percentile(e, 5))
    noise = np.concatenate([x[i * hop:(i + 1) * hop] for i in quiet]) if quiet.size else x[:SR]
    return nr.reduce_noise(y=x, sr=SR, y_noise=noise, stationary=True, prop_decrease=amount,
                           n_fft=2048, freq_mask_smooth_hz=250, time_mask_smooth_ms=50).astype(np.float32)


def denoise_sections(x, edges, amount, pad=SR // 2, xf=SR // 50):
    # each section is cleaned with half a second of context either side, then joined with 20 ms crossfades
    out = np.zeros_like(x)
    for s, e in zip(edges[:-1], edges[1:]):
        a, b = max(0, s - pad), min(len(x), e + pad)
        y = denoise(x[a:b], amount)[s - a:s - a + (e - s) + (xf if e < len(x) else 0)]
        if s > 0:
            ramp = np.linspace(0, 1, xf, dtype=np.float32)
            out[s:s + xf] = out[s:s + xf] * (1 - ramp) + y[:xf] * ramp
            out[s + xf:s + len(y)] = y[xf:]
        else:
            out[s:s + len(y)] = y
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('inp'); ap.add_argument('out')
    ap.add_argument('--sample', nargs=2, type=float)
    ap.add_argument('--nr', type=float, default=0.9)
    ap.add_argument('--bass', type=float, default=2.0)
    ap.add_argument('--treble', type=float, default=3.0)
    ap.add_argument('--sections', help='*_cuts.json from a joined edit: learn the noise separately for each part')
    a = ap.parse_args()

    extra = ['-ss', str(a.sample[0]), '-t', str(a.sample[1])] if a.sample else []
    x = read(a.inp, extra)

    # 1. repair clipped peaks, cut rumble
    x = filt(x, 'adeclip=w=55:o=75:a=8:t=10:n=1000,highpass=f=75:p=2')

    # 2. noise reduction, one noise profile per recorded part (each take has its own room noise)
    bounds = [0.0]
    if a.sections:
        starts = {}
        for c in json.load(open(a.sections)):
            starts.setdefault(c['part'], c['out_at'])
        bounds = sorted(starts.values())
    x = denoise_sections(x, [int(t * SR) for t in bounds] + [len(x)], a.nr)

    # 3. tone + dynamics
    chain = ','.join([
        f'bass=g={a.bass}:f=110:w=0.7',               # warmth
        'equalizer=f=320:t=q:w=1.2:g=-2',             # less boxy / muddy
        'equalizer=f=3500:t=q:w=1.0:g=2.5',           # presence: words cut through music
        f'treble=g={a.treble}:f=8000:w=0.6',          # air / crispness
        'deesser=i=0.3:m=0.5:f=0.5',                  # tame harsh "s"
        'acompressor=threshold=-22dB:ratio=2.5:attack=10:release=150:makeup=1.5:knee=4',
    ])
    x = filt(x, chain)

    # 4. loudness, two-pass
    raw = x.astype(np.float32).tobytes()
    meas = subprocess.run(['ffmpeg', '-hide_banner', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af',
                           'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
                          input=raw, capture_output=True).stderr.decode()
    m = json.loads(meas[meas.rindex('{'):meas.rindex('}') + 1])
    ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    ff(['-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', ln + ',alimiter=limit=0.84:level=false',
        '-ar', str(SR), '-c:a', 'pcm_s24le', a.out], raw)
    print(f'wrote {a.out}')


if __name__ == '__main__':
    sys.exit(main())
