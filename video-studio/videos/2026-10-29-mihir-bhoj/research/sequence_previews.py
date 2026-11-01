"""Audio previews of 5 possible sequences: the final narration cut into blocks at sentence starts and re-joined.
Block bounds are written in OLD-narration seconds (v2 transcript) and converted with build_storyboard_v3.T().
Run from video-studio/: python3 videos/2026-10-29-mihir-bhoj/research/sequence_previews.py
"""
import importlib.util, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
VD = HERE.parent
src = (HERE / 'build_storyboard_v3.py').read_text()
ns = {'__file__': str(HERE / 'build_storyboard_v3.py')}
exec(src[:src.index('# ======================= HOOK')], ns)  # only the T() time converter and constants
T, END = ns['T'], ns['END']

B = {  # name: (start, end) in old-narration seconds
    '1': (0.0, 50.1), '2': (50.1, 78.2), '3': (78.2, 96.7), '4': (96.7, 157.7),
    '5a': (157.7, 241.4), '5b': (241.4, 270.2), '6': (270.2, 308.9), '6core': (281.0, 304.0),
    '6restA': (270.2, 281.0), '6restB': (304.0, 308.9), '7': (308.9, 348.8), '7a': (308.9, 336.2), '7b': (342.7, 348.8),
    '8': (348.8, 454.2), '9': (454.2, 497.9), '10': (497.9, 537.3), '11': (537.3, 582.4),
    '11sul': (543.3, 558.7), '11restA': (537.3, 543.3), '11restB': (558.7, 582.4), '12': (582.4, 1e9), '1outro': (0.0, 47.5),
}
OPTIONS = {
    '1_invasion_cold_open': ['5b', '|', '3', '|', '1', '2', '4', '5a', '6', '7a', '7b', '8', '9', '10', '11', '12'],
    '2_enemy_of_islam_cold_open': ['11sul', '|', '3', '|', '1', '2', '4', '5a', '5b', '6', '7a', '7b', '8', '9', '10', '11restA', '11restB', '12'],
    '3_nagabhata_battle_cold_open': ['6core', '|', '3', '|', '1', '2', '4', '5a', '5b', '6restA', '6restB', '7a', '7b', '8', '9', '10', '11', '12'],
    '4_chronological_social_media_outro': ['5a', '5b', '6', '2', '3', '4', '7', '8', '9', '10', '11', '12', '|', '1outro'],
    '5_current_order_tightened': ['3', '|', '1', '2', '4', '5a', '5b', '6', '7a', '7b', '8', '9', '10', '11', '12'],
}
wav = VD / 'audio-edit' / 'narration_v3.wav'
out = VD / 'output' / 'sequence_previews'
out.mkdir(exist_ok=True)
tmp = Path('/tmp/claude-1001/-home-vikas-Desktop-studio/2f1ab1f2-6c79-4731-9fb2-dbc7d185fe93/scratchpad/seq')
tmp.mkdir(exist_ok=True)
for name, seq in OPTIONS.items():
    parts = []
    for k, item in enumerate(seq):
        if item == '|':
            parts.append(('gap', 1.1))
            continue
        a, b = B[item]
        a3, b3 = max(0.0, T(a) - 0.12), (END if b > 1e8 else T(b) - 0.12)
        parts.append(('cut', a3, b3))
        nxt = seq[k + 1] if k + 1 < len(seq) else None
        if nxt and nxt != '|':  # 0.35 s breath between blocks that were not neighbours in the recording
            if B[nxt][0] != b:
                parts.append(('gap', 0.35))
    files = []
    for i, p in enumerate(parts):
        f = tmp / f'{name}_{i:02d}.wav'
        if p[0] == 'gap':
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono', '-t', str(p[1]), str(f)], check=True)
        else:
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{p[1]:.2f}', '-to', f'{p[2]:.2f}', '-i', str(wav), '-ac', '1', '-ar', '48000',
                            '-af', 'afade=t=in:d=0.02,areverse,afade=t=in:d=0.04,areverse', str(f)], check=True)
        files.append(f)
    lst = tmp / f'{name}.txt'
    lst.write_text(''.join(f"file '{f}'\n" for f in files))
    dst = out / f'option_{name}.mp3'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', str(lst), '-c:a', 'libmp3lame', '-q:a', '2', str(dst)], check=True)
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(dst)], capture_output=True, text=True).stdout)
    print(f'{dst.name}: {int(dur // 60)}:{int(dur % 60):02d}')
