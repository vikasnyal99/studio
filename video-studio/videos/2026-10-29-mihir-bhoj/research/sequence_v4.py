"""Narration v4 = option 1 (user's pick, 31 Oct): invasion cold open -> teaser -> social media hook -> story.
Cuts narration_v3.wav into blocks (bounds in OLD-narration seconds, converted with build_storyboard_v3.T) and
writes audio-edit/narration_v4.wav plus audio-edit/narration_v4_map.json: [{v3_from, v3_to, out_at}] so the
storyboard can move every shot to its new time.
Run from video-studio/: python3 videos/2026-10-29-mihir-bhoj/research/sequence_v4.py
"""
import json, subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
VD = HERE.parent
src = (HERE / 'build_storyboard_v3.py').read_text()
ns = {'__file__': str(HERE / 'build_storyboard_v3.py')}
exec(src[:src.index('# ======================= HOOK')], ns)
T, END = ns['T'], ns['END']
B = {'1': (0.0, 50.1), '2': (50.1, 78.2), '3': (78.2, 96.7), '4': (96.7, 157.7), '5a': (157.7, 241.4), '5b': (241.4, 270.2),
     '6': (270.2, 308.9), '7a': (308.9, 336.2), '7b': (342.7, 348.8), '8': (348.8, 454.2), '9': (454.2, 497.9),
     '10': (497.9, 537.3), '11': (537.3, 582.4), '12': (582.4, 1e9)}
SEQ = ['5b', '|', '3', '|', '1', '2', '4', '5a', '6', '7a', '7b', '8', '9', '10', '11', '12']
wav = VD / 'audio-edit' / 'narration_v3.wav'
tmp = Path('/tmp/claude-1001/-home-vikas-Desktop-studio/2f1ab1f2-6c79-4731-9fb2-dbc7d185fe93/scratchpad/seq4')
tmp.mkdir(exist_ok=True)
files, mp, at = [], [], 0.0
for k, item in enumerate(SEQ):
    if item == '|':
        gap = 1.1
    else:
        a, b = B[item]
        a3, b3 = max(0.0, T(a) - 0.12), (END if b > 1e8 else T(b) - 0.12)
        f = tmp / f'{k:02d}.wav'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{a3:.3f}', '-to', f'{b3:.3f}', '-i', str(wav), '-ac', '1', '-ar', '48000',
                        '-af', 'afade=t=in:d=0.02,areverse,afade=t=in:d=0.04,areverse', str(f)], check=True)
        d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(f)], capture_output=True, text=True).stdout)
        mp.append({'block': item, 'v3_from': round(a3, 3), 'v3_to': round(a3 + d, 3), 'out_at': round(at, 3)})
        files.append(f)
        at += d
        nxt = SEQ[k + 1] if k + 1 < len(SEQ) else None
        gap = 0.35 if nxt and nxt != '|' and B[nxt][0] != b else 0
    if gap:
        f = tmp / f'{k:02d}_gap.wav'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono', '-t', str(gap), str(f)], check=True)
        files.append(f)
        at += gap
(tmp / 'list.txt').write_text(''.join(f"file '{f}'\n" for f in files))
out = VD / 'audio-edit' / 'narration_v4.wav'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', str(tmp / 'list.txt'), '-c:a', 'pcm_s16le', str(out)], check=True)
(VD / 'audio-edit' / 'narration_v4_map.json').write_text(json.dumps(mp, indent=1))
print(out.name, round(at, 2), 's;', len(mp), 'blocks')
