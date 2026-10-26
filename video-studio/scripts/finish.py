"""Add sound to a rendered (silent) video: voice, music bed and sound effects.

Usage (from the project folder, with the venv active):

    .venv/bin/python scripts/finish.py --video videos/<name>/hf/renders/video.mp4 \\
        --sound videos/<name>/sound.json --output videos/<name>/output/final.mp4

Normally run for you by scripts/make_video.py.

The sound file lists the voice recording (and which part of it to use), the
music track, and one cue per sound effect: [second, effect name, level in dB].
The mix is levelled to -14 LUFS, the loudness YouTube plays at. Input files
are never modified.
"""

from __future__ import annotations

import argparse
import json
import logging
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RATE = 48000

log = logging.getLogger("finish")


class SoundError(ValueError):
    """The sound file has a mistake the user can fix."""


# ---------------------------------------------------------------------------
# Pure helpers (unit-tested directly)
# ---------------------------------------------------------------------------


def db_to_gain(db: float) -> float:
    return 10 ** (db / 20)


def rms_db(signal: np.ndarray) -> float:
    """Average level of the parts that are not silence, in dB."""
    mono = signal.mean(axis=1) if signal.ndim == 2 else signal
    loud = mono[np.abs(mono) > 1e-3]
    if loud.size == 0:
        return -120.0
    return float(20 * np.log10(np.sqrt(np.mean(loud ** 2))))


def add_at(mix: np.ndarray, sound: np.ndarray, second: float, gain: float) -> None:
    """Add a sound into the mix starting at `second`; whatever runs past the end is dropped."""
    start = int(round(second * RATE))
    if start >= len(mix) or start < 0:
        return
    piece = sound[: len(mix) - start]
    if piece.ndim == 1:
        piece = piece[:, None]
    mix[start:start + len(piece)] += piece * gain


def fade(signal: np.ndarray, fade_in: float, fade_out: float) -> np.ndarray:
    out = signal.copy()
    n_in, n_out = int(fade_in * RATE), int(fade_out * RATE)
    if n_in:
        out[:n_in] *= np.linspace(0, 1, n_in)[:, None]
    if n_out:
        out[-n_out:] *= np.linspace(1, 0, n_out)[:, None]
    return out


def loop_to(signal: np.ndarray, length: int) -> np.ndarray:
    """Repeat a track until it is `length` samples long, then cut it there."""
    if len(signal) >= length:
        return signal[:length]
    repeats = -(-length // len(signal))
    return np.concatenate([signal] * repeats)[:length]


def load_sound_plan(path: Path, root: Path) -> dict:
    if not path.exists():
        raise FileNotFoundError(f"sound file not found: {path}")
    plan = json.loads(path.read_text(encoding="utf-8"))
    if "voice" not in plan:
        raise SoundError("the sound file needs a 'voice' entry")
    voice = plan["voice"]
    if voice.get("end", 0) <= voice.get("start", 0):
        raise SoundError("voice: 'end' must be after 'start'")
    if isinstance(plan.get("music"), dict):  # one bed for the whole video
        plan["music"] = [plan["music"]]
    for item in [voice] + plan.get("music", []):
        if not (root / item["file"]).is_file():
            raise FileNotFoundError(f"sound file not found: {root / item['file']}")
    sfx_dir = root / plan.get("sfx_dir", "library/sfx")
    for i, cue in enumerate(plan.get("cues", []), 1):
        if len(cue) != 3:
            raise SoundError(f"cue #{i} must be [second, effect name, level in dB], got {cue}")
        if not (sfx_dir / f"{cue[1]}.wav").is_file():
            raise SoundError(f"cue #{i}: no effect called '{cue[1]}' in {sfx_dir}")
    return plan


# ---------------------------------------------------------------------------
# Audio in and out
# ---------------------------------------------------------------------------


def decode(path: Path, start: float, seconds: float) -> np.ndarray:
    """Read part of any audio file as stereo float samples at 48 kHz."""
    cmd = ["ffmpeg", "-v", "error", "-ss", f"{start:.4f}", "-t", f"{seconds:.4f}", "-i", str(path),
           "-f", "f32le", "-ac", "2", "-ar", str(RATE), "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype="<f4").reshape(-1, 2).astype(np.float64)


def read_wav(path: Path) -> np.ndarray:
    with wave.open(str(path), "rb") as fh:
        if fh.getframerate() != RATE or fh.getsampwidth() != 2:
            raise SoundError(f"{path.name}: effects must be 48 kHz 16-bit WAV (run scripts/make_sfx.py)")
        data = np.frombuffer(fh.readframes(fh.getnframes()), dtype="<i2").astype(np.float64) / 32768
        return data.reshape(-1, fh.getnchannels()).mean(axis=1)


def build_mix(plan: dict, root: Path) -> np.ndarray:
    voice_info = plan["voice"]
    seconds = voice_info["end"] - voice_info["start"]
    total = int(round(seconds * RATE))
    mix = np.zeros((total, 2))

    voice = decode(root / voice_info["file"], voice_info["start"], seconds)[:total]
    voice *= db_to_gain(-18 - rms_db(voice))  # bring speech to a standard working level
    mix[: len(voice)] += fade(voice, 0.01, 0.05)

    for info in plan.get("music", []):
        # each bed plays from "from" to "to" (seconds of the video), looping if the track is shorter
        begin, finish = info.get("from", 0.0), min(info.get("to", seconds), seconds)
        length = int(round((finish - begin) * RATE))
        if length <= 0:
            continue
        music = decode(root / info["file"], info.get("start", 0), finish - begin)
        if len(music) == 0:
            raise SoundError(f"could not read any sound from {info['file']}")
        music = loop_to(music, length)
        music *= db_to_gain(-18 - info.get("below_voice_db", 18) - rms_db(music))
        add_at(mix, fade(music, info.get("fade_in", 1.0), info.get("fade_out", 2.0)), begin, 1.0)

    sfx_dir = root / plan.get("sfx_dir", "library/sfx")
    cache: dict[str, np.ndarray] = {}
    for second, name, level in plan.get("cues", []):
        if name not in cache:
            cache[name] = read_wav(sfx_dir / f"{name}.wav")
        # effect files peak near full scale, so `level` is roughly dB below the loudest speech peaks
        add_at(mix, cache[name], second, db_to_gain(level - 6))
    return mix


def run(args: argparse.Namespace) -> dict:
    if not args.video.is_file():
        raise FileNotFoundError(f"video not found: {args.video}")
    plan = load_sound_plan(args.sound, PROJECT_ROOT)
    mix = build_mix(plan, PROJECT_ROOT)
    log.info("mixed %.1fs of sound: voice%s, %d effect cue(s)", len(mix) / RATE,
             f" + {len(plan['music'])} music bed(s)" if plan.get("music") else "", len(plan.get("cues", [])))

    args.output.parent.mkdir(parents=True, exist_ok=True)
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", str(args.video),
           "-f", "f32le", "-ac", "2", "-ar", str(RATE), "-channel_layout", "stereo", "-i", "-",
           "-map", "0:v", "-map", "1:a", "-c:v", "copy",
           "-af", f"loudnorm=I=-14:TP=-1.5:LRA=11,aformat=sample_rates={RATE}:channel_layouts=stereo", "-c:a", "aac", "-b:a", "192k",
           "-movflags", "+faststart", "-shortest", str(args.output)]
    subprocess.run(cmd, input=np.clip(mix, -4, 4).astype("<f4").tobytes(), check=True)
    log.info("wrote %s", args.output)
    return {"video": str(args.output), "seconds": round(len(mix) / RATE, 2)}


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Add voice, music and sound effects to a rendered video.")
    parser.add_argument("--video", required=True, type=Path, help="the silent video rendered by HyperFrames")
    parser.add_argument("--sound", required=True, type=Path, help="the sound plan (JSON)")
    parser.add_argument("--output", required=True, type=Path, help="where to write the finished MP4")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    try:
        result = run(parse_args(argv))
    except (FileNotFoundError, SoundError) as exc:
        log.error("%s", exc)
        return 1
    except subprocess.CalledProcessError as exc:
        log.error("FFmpeg step failed (exit code %s); see the error above", exc.returncode)
        return 1
    log.info("done: %s", result)
    return 0


if __name__ == "__main__":
    sys.exit(main())
