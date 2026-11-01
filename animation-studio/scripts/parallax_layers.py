"""WARNING (31 Oct 2026): the user rejected the result — people looked cracked/split at the waist when the layers
moved. Do not use for character shots. Kept only for experiments.

Split a keyframe into two layers for real 2.5D parallax in the Doc composition.

For each picture: a cut-out of the main subject (rembg, free local model) -> <name>_fg.png (transparent, same size),
and the background with the subject painted out (OpenCV inpaint over a slightly grown mask) -> <name>_bg.jpg.
In a Doc shot use {"img": ".../<name>_bg.jpg", "fg": ".../<name>_fg.png"}: the subject then moves against the
background instead of the whole picture zooming as one flat slide.

    .venv-rembg/bin/python scripts/parallax_layers.py public/doc/<video>/<name>.png [more ...] [--model isnet-general-use]

The first run downloads the model (~170 MB) to ~/.u2net. Check the pair on a contact sheet: if the cut-out caught
the wrong thing (a crowd, a whole building) skip `fg` for that shot.
"""

import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from rembg import new_session, remove

args = [a for a in sys.argv[1:] if not a.startswith('--')]
model = sys.argv[sys.argv.index('--model') + 1] if '--model' in sys.argv else 'isnet-general-use'
if '--model' in sys.argv:
    args.remove(model)
if not args:
    print(__doc__)
    sys.exit(1)
session = new_session(model)
for p in map(Path, args):
    im = Image.open(p).convert('RGB')
    cut = remove(im, session=session, post_process_mask=True)  # RGBA
    rgba = np.array(cut)
    alpha = rgba[:, :, 3]
    # keep only the main subject: blobs at least 15% the size of the biggest (drops stray bits of flags, smoke...)
    n, lab, stats, _ = cv2.connectedComponentsWithStats((alpha > 128).astype(np.uint8), 8)
    if n > 1:
        big = stats[1:, cv2.CC_STAT_AREA].max()
        keep = np.isin(lab, [i for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] >= 0.15 * big])
        keep = cv2.dilate(keep.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
        alpha = np.where(keep, alpha, 0).astype(np.uint8)
        rgba[:, :, 3] = alpha
        cut = Image.fromarray(rgba)
    share = (alpha > 128).mean()
    fg = p.with_name(p.stem + '_fg.png')
    bg = p.with_name(p.stem + '_bg.jpg')
    cut.save(fg)
    mask = (alpha > 40).astype(np.uint8) * 255
    mask = cv2.dilate(mask, np.ones((25, 25), np.uint8))
    rgb = cv2.cvtColor(np.array(im), cv2.COLOR_RGB2BGR)
    # inpaint at half size (much faster, the background is soft anyway), then put back the untouched pixels
    small = cv2.inpaint(cv2.resize(rgb, None, fx=0.5, fy=0.5), cv2.resize(mask, None, fx=0.5, fy=0.5), 9, cv2.INPAINT_TELEA)
    filled = cv2.resize(small, (rgb.shape[1], rgb.shape[0]))
    out = np.where(mask[:, :, None] > 0, filled, rgb)
    cv2.imwrite(str(bg), cv2.GaussianBlur(out, (0, 0), 0.8), [cv2.IMWRITE_JPEG_QUALITY, 92])
    print(f'{p.name}: subject {share:.0%} of frame -> {fg.name}, {bg.name}' + ('  (large: check it)' if share > 0.55 else '  (tiny: check it)' if share < 0.03 else ''))
