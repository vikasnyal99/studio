"""Pick the good takes from a raw talking-head recording, then cut them into one recording.

For a video of the user speaking that has retakes, glances at notes and flat
stretches. Run it before the normal flow (transcribe, scenes.json, render).

Usage (from the project folder):

    # 0. put the untouched recording in V/raw/original.mp4, its sound in V/raw/raw.wav, and transcribe it:
    .venv/bin/python scripts/transcribe.py --input V/raw/raw.wav --output-dir V/raw/timing

    # 1. score every sentence: camera gaze, voice energy, movement; one labelled frame per sentence
    .venv/bin/python scripts/pick_takes.py V scan
    #    -> V/raw/takes.tsv   (n, start, end, cam %, loud dB, lively, score, text)
    #    -> V/raw/takes_1.jpg, takes_2.jpg ...  (frame from each sentence, labelled "#n cam% score")

    # 1b. 4K recordings: make a 1080p30 proxy once (one ~10 min pass); cut then reads it and takes minutes
    .venv/bin/python scripts/pick_takes.py V proxy        # -> V/raw/proxy.mkv

    # 1c. after the cut, before the final render: rebuild the picture from the 4K original (same cut, one encode)
    .venv/bin/python scripts/pick_takes.py V hqvideo      # -> V/assets/camera.mp4 at crf 12

    # 2. write V/raw/selects.json: {"keep": [[start, end], ...]} in raw seconds, in the order to play.
    #    A piece can also come from another file (e.g. the clip being answered, so its voice is heard):
    #    {"src": "raw/dhruv/13cr.mp4", "from": 2.0, "to": 9.5} (path relative to V). Its loudness is matched
    #    to the recording's. Every cut snaps to the quietest 20 ms within 0.2 s ("snap": false to stop that).
    #    Pick the last good take of a repeated line; drop sentences with cam% under ~60 (reading notes).
    #    Get exact word edges with grep on V/raw/timing/words.txt.
    .venv/bin/python scripts/pick_takes.py V cut
    #    -> V/voice/original.mp4 (1080p30, the selects with sound), V/voice/narration.wav,
    #       V/assets/camera.mp4 (silent copy for camera/split scenes), V/raw/cutmap.json (new -> raw seconds)

Then transcribe V/voice/narration.wav into V/timing as usual. The untouched
recording stays in V/raw/ (and inbox/).

Gaze: OpenCV YuNet face landmarks (library/models/face_detection_yunet_2023mar.onnx,
free, runs on the CPU). "cam" means a face is found and the nose sits between the
eyes (head turned less than about 15 degrees) and not tipped down to notes.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODEL = PROJECT_ROOT / "library" / "models" / "face_detection_yunet_2023mar.onnx"
FPS, W, H = 4, 640, 360          # analysis frames
FADE = 0.03                      # seconds of audio fade at every cut, so joins do not click


def frames(video: Path):
    """Yield (second, RGB array) at FPS frames per second, small."""
    cmd = ["ffmpeg", "-v", "error", "-i", str(video), "-vf", f"fps={FPS},scale={W}:{H}", "-f", "rawvideo",
           "-pix_fmt", "bgr24", "-"]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    i, size = 0, W * H * 3
    while True:
        buf = proc.stdout.read(size)
        if len(buf) < size:
            break
        yield i / FPS, np.frombuffer(buf, np.uint8).reshape(H, W, 3)
        i += 1
    proc.wait()


def loudness(wav: Path) -> np.ndarray:
    """dB per 1/FPS second."""
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(wav), "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    hop = 16000 // FPS
    n = len(a) // hop
    rms = np.sqrt((a[: n * hop].reshape(n, hop) ** 2).mean(1) + 1e-9)
    return 20 * np.log10(rms)


def scan(v: Path) -> None:
    import cv2

    raw = v / "raw"
    segs = json.loads((raw / "timing" / "segments_hi.json").read_text(encoding="utf-8"))
    det = cv2.FaceDetectorYN.create(str(MODEL), "", (W, H), 0.6)
    cam, motion, thumbs, prev = [], [], {}, None
    mids = {round((s["start"] + s["end"]) / 2 * FPS): k for k, s in enumerate(segs)}
    for sec, img in frames(raw / "original.mp4"):
        _, faces = det.detect(img)
        ok = 0.0
        if faces is not None and len(faces):
            f = max(faces, key=lambda r: r[2] * r[3])
            x, y, w, h = f[:4]
            rex, rey, lex, ley, nx, ny = f[4:10]
            eye_d = max(abs(lex - rex), 1)
            yaw = (nx - (rex + lex) / 2) / eye_d          # 0 when looking straight
            pitch = (ny - (rey + ley) / 2) / eye_d        # ~0.6-0.9 straight; larger = head down
            ok = float(abs(yaw) < 0.22 and pitch < 1.05)
            crop = cv2.cvtColor(img[max(0, int(y)):int(y + h), max(0, int(x)):int(x + w)], cv2.COLOR_BGR2GRAY)
            crop = cv2.resize(crop, (64, 64)) if crop.size else None
            motion.append(float(np.abs(crop.astype(float) - prev).mean()) if crop is not None and prev is not None else 0.0)
            prev = crop.astype(float) if crop is not None else prev
        else:
            motion.append(0.0)
        cam.append(ok)
        k = mids.get(round(sec * FPS))
        if k is not None:
            thumbs[k] = img[:, :, ::-1].copy()
    db = loudness(raw / "raw.wav")
    cam, motion = np.array(cam), np.array(motion)
    rows = []
    for k, s in enumerate(segs):
        a, b = int(s["start"] * FPS), max(int(s["end"] * FPS), int(s["start"] * FPS) + 1)
        c = float(cam[a:b].mean()) if b <= len(cam) else 0.0
        voiced = db[a:b][db[a:b] > -45]
        loud = float(voiced.mean()) if len(voiced) else -60.0
        spread = float(voiced.std()) if len(voiced) else 0.0
        lively = float(motion[a:b].mean()) if b <= len(motion) else 0.0
        score = round(100 * c * 0.5 + min(spread, 8) * 3 + min(lively, 12) * 1.5 + (loud + 30) * 0.5, 1)
        rows.append((k, s["start"], s["end"], round(100 * c), round(loud, 1), round(lively, 1), score, s["text"].strip()))
    with open(raw / "takes.tsv", "w", encoding="utf-8") as fh:
        fh.write("n\tstart\tend\tcam%\tloud_db\tlively\tscore\ttext\n")
        for r in rows:
            fh.write("\t".join(str(x) for x in r) + "\n")
    # contact sheets: 30 per sheet, 6 columns
    font = ImageFont.load_default(size=22)
    keys = sorted(thumbs)
    for p in range(0, len(keys), 30):
        sheet = Image.new("RGB", (6 * 320, 5 * 180), "black")
        for j, k in enumerate(keys[p:p + 30]):
            im = Image.fromarray(thumbs[k]).resize((320, 180))
            d = ImageDraw.Draw(im)
            r = rows[k]
            d.rectangle([0, 0, 320, 28], fill=(0, 0, 0))
            d.text((6, 2), f"#{k} {r[1]:.0f}s cam{r[3]} s{r[6]:.0f}", fill=(255, 220, 80), font=font)
            sheet.paste(im, ((j % 6) * 320, (j // 6) * 180))
        out = raw / f"takes_{p // 30 + 1}.jpg"
        sheet.save(out, quality=82)
        print(out.relative_to(PROJECT_ROOT))
    print((raw / "takes.tsv").relative_to(PROJECT_ROOT), f"{len(rows)} sentences")


def mean_db(path: Path, a: float | None = None, b: float | None = None) -> float:
    cmd = ["ffmpeg", "-v", "info", "-nostats"] + (["-ss", str(a), "-to", str(b)] if a is not None else []) + \
          ["-i", str(path), "-vn", "-af", "silenceremove=stop_periods=-1:stop_threshold=-45dB,volumedetect", "-f", "null", "-"]
    err = subprocess.run(cmd, capture_output=True, text=True).stderr
    return float(err.split("mean_volume:")[1].split("dB")[0]) if "mean_volume:" in err else -25.0


def pcm(path: Path) -> np.ndarray:
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-vn", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768


def snap(audio: np.ndarray, t: float, reach: float = 0.2) -> float:
    """Move a cut to the quietest 20 ms within reach seconds, so words are not clipped."""
    hop = 320
    a, b = max(0, int((t - reach) * 16000)), min(len(audio), int((t + reach) * 16000))
    if b - a < hop * 2:
        return t
    seg = audio[a:b][: (b - a) // hop * hop].reshape(-1, hop)
    rms = np.sqrt((seg ** 2).mean(1))
    centre = np.abs(np.arange(len(rms)) - len(rms) / 2) / len(rms)   # prefer the middle on ties
    return round((a + int(np.argmin(rms + centre * rms.mean() * 0.15)) * hop + hop / 2) / 16000, 3)


def cut(v: Path) -> None:
    raw = v / "raw"
    keep = json.loads((raw / "selects.json").read_text(encoding="utf-8"))["keep"]
    proxy = raw / "proxy.mkv"
    inputs, idx = [str(proxy if proxy.is_file() else raw / "original.mp4")], {}
    target = mean_db(raw / "raw.wav")
    pieces = raw / "pieces"
    pieces.mkdir(exist_ok=True)
    vlist, alist, cutmap, t, audio_cache = [], [], [], 0.0, {}
    for i, k in enumerate(keep):
        if isinstance(k, dict):
            src = str(v / k["src"])
            if src not in idx:
                idx[src] = len(inputs)
                inputs.append(src)
            n, a, b = idx[src], k["from"], k["to"]
            gain = k.get("gain_db", round(target - mean_db(Path(src), a, b), 1))
        else:
            n, (a, b), gain = 0, k, 0.0
        if not (isinstance(k, dict) and k.get("snap") is False):
            src_path = inputs[n]
            if src_path not in audio_cache:
                audio_cache[src_path] = pcm(Path(src_path))
            a, b = snap(audio_cache[src_path], a), snap(audio_cache[src_path], b)
        d = round((b - a) * 30) / 30          # whole frames, so picture and sound stay in step across joins
        piece = pieces / f"{i:03d}"
        af = (f"aresample=48000,aformat=channel_layouts=mono,volume={gain}dB,"
              f"afade=t=in:d={FADE},afade=t=out:st={d - FADE:.3f}:d={FADE}")
        vf = ("fps=30,scale=1920:1080:force_original_aspect_ratio=decrease:flags=lanczos,"
              "pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuv420p")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{a:.3f}", "-i", inputs[n], "-t", f"{d:.4f}",
                        "-map", "0:v:0", "-vf", vf, "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-g", "30",
                        f"{piece}.mp4", "-map", "0:a:0", "-t", f"{d:.4f}", "-af", af, "-c:a", "pcm_s16le", f"{piece}.wav"], check=True)
        vlist.append(f"file '{piece.name}.mp4'")
        alist.append(f"file '{piece.name}.wav'")
        cutmap.append({"new": round(t, 3), "src": "raw" if n == 0 else k["src"], "from": a, "len": round(d, 3)})
        t += d
    (pieces / "v.txt").write_text("\n".join(vlist) + "\n")
    (pieces / "a.txt").write_text("\n".join(alist) + "\n")
    (v / "voice").mkdir(exist_ok=True)
    (v / "assets").mkdir(exist_ok=True)
    cat = lambda lst, out, *codec: subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i",
                                                   str(pieces / lst), *codec, str(out)], check=True)
    cat("v.txt", v / "assets" / "camera.mp4", "-c", "copy")
    cat("a.txt", v / "voice" / "narration.wav", "-c:a", "pcm_s16le", "-ar", "48000")
    out = v / "voice" / "original.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(v / "assets" / "camera.mp4"), "-i", str(v / "voice" / "narration.wav"),
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", str(out)], check=True)
    (raw / "cutmap.json").write_text(json.dumps(cutmap, indent=1))
    print(f"{(v / 'voice' / 'original.mp4').relative_to(PROJECT_ROOT)}: {len(keep)} pieces, {t:.1f} s")


def make_proxy(v: Path) -> None:
    """1080p30 copy of a 4K recording (4K HEVC decodes at under real time on this laptop); cut uses it when present."""
    raw = v / "raw"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw / "original.mp4"), "-vf", "fps=30,scale=1920:1080:flags=bicubic",
                    "-c:v", "libx264", "-preset", "ultrafast", "-crf", "14", "-g", "30", "-c:a", "pcm_s16le", "-ar", "48000",
                    str(raw / "proxy.mkv")], check=True)
    print((raw / "proxy.mkv").relative_to(PROJECT_ROOT))


def hq_video(v: Path) -> None:
    """Rebuild assets/camera.mp4 from the untouched 4K original at crf 12, using raw/cutmap.json exactly (same frames,
    same times; the narration is not touched). The proxy cut loses detail through three encodes; run this before the
    final render when picture quality matters. 4K decodes at about 0.5x real time here, so it runs in the background."""
    raw = v / "raw"
    cutmap = json.loads((raw / "cutmap.json").read_text())
    hq = raw / "pieces_hq"
    hq.mkdir(exist_ok=True)
    vf = ("fps=30,scale=1920:1080:force_original_aspect_ratio=decrease:flags=lanczos,"
          "pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuv420p")
    names = []
    for i, c in enumerate(cutmap):
        src = raw / "original.mp4" if c["src"] == "raw" else v / c["src"]
        out = hq / f"{i:03d}.mp4"
        if not out.is_file():
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{c['from']:.3f}", "-i", str(src), "-t", f"{c['len']:.4f}",
                            "-map", "0:v:0", "-vf", vf, "-c:v", "libx264", "-preset", "medium", "-crf", "12", "-g", "30",
                            str(out)], check=True)
        names.append(f"file '{out.name}'")
    (hq / "v.txt").write_text("\n".join(names) + "\n")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(hq / "v.txt"), "-c", "copy",
                    str(v / "assets" / "camera.mp4")], check=True)
    print((v / "assets" / "camera.mp4").relative_to(PROJECT_ROOT), "rebuilt from the original at crf 12")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("video_dir", type=Path)
    ap.add_argument("mode", choices=["scan", "proxy", "cut", "hqvideo"])
    a = ap.parse_args(argv)
    v = a.video_dir if a.video_dir.is_absolute() else PROJECT_ROOT / a.video_dir
    {"scan": scan, "proxy": make_proxy, "cut": cut, "hqvideo": hq_video}[a.mode](v)
    return 0


if __name__ == "__main__":
    sys.exit(main())
