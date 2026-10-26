"""Generate the starter sound-effect library (library/sfx/*.wav).

Usage:

    python scripts/make_sfx.py

Every sound is synthesised here from sine waves and filtered noise, so there
is nothing to license. Replace any file with a downloaded effect of the same
name if you prefer a recorded one.
"""

from __future__ import annotations

import sys
import wave
from pathlib import Path

import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = PROJECT_ROOT / "library" / "sfx"
RATE = 48000


def times(seconds: float) -> np.ndarray:
    return np.arange(int(RATE * seconds)) / RATE


def noise(seconds: float, seed: int) -> np.ndarray:
    return np.random.default_rng(seed).standard_normal(int(RATE * seconds))


def band(signal: np.ndarray, low: np.ndarray | float, high: np.ndarray | float) -> np.ndarray:
    """Band-pass with cut-offs that can change over time (simple one-pole filters)."""
    low = np.broadcast_to(np.asarray(low, dtype=float), signal.shape)
    high = np.broadcast_to(np.asarray(high, dtype=float), signal.shape)
    a_high = 1 - np.exp(-2 * np.pi * high / RATE)
    a_low = 1 - np.exp(-2 * np.pi * low / RATE)
    out = np.empty_like(signal)
    lp = hp = 0.0
    for i, sample in enumerate(signal):
        lp += a_high[i] * (sample - lp)
        hp += a_low[i] * (lp - hp)
        out[i] = lp - hp
    return out


def whoosh() -> np.ndarray:
    t = times(0.55)
    centre = 400 + 3600 * np.sin(np.pi * t / t[-1]) ** 2
    return band(noise(0.55, 1), centre * 0.5, centre * 1.6) * np.sin(np.pi * t / t[-1]) ** 2


def pop() -> np.ndarray:
    t = times(0.09)
    return np.sin(2 * np.pi * (520 * t - 1800 * t * t)) * np.exp(-t * 55)


def click() -> np.ndarray:
    t = times(0.035)
    return (np.sin(2 * np.pi * 2400 * t) + 0.5 * band(noise(0.035, 2), 2000, 9000)) * np.exp(-t * 220)


def tick() -> np.ndarray:
    t = times(0.05)
    return np.sin(2 * np.pi * 1500 * t) * np.exp(-t * 120)


def hit() -> np.ndarray:
    t = times(1.1)
    body = np.sin(2 * np.pi * (58 * t + 22 * np.exp(-t * 18) / 18)) * np.exp(-t * 4.2)
    thump = band(noise(1.1, 3), 30, 500) * np.exp(-t * 28)
    return body + 0.5 * thump


def riser() -> np.ndarray:
    t = times(1.4)
    p = t / t[-1]
    return band(noise(1.4, 4), 200 + 2500 * p ** 2, 900 + 8000 * p ** 2) * p ** 2.2


def typing() -> np.ndarray:
    out = np.zeros(int(RATE * 0.9))
    rng = np.random.default_rng(5)
    key = click() * 0.8
    at = 0.0
    while at < 0.8:
        start = int(at * RATE)
        out[start:start + len(key)] += key[: len(out) - start] * rng.uniform(0.6, 1.0)
        at += rng.uniform(0.045, 0.085)
    return out


def shutter() -> np.ndarray:
    out = np.zeros(int(RATE * 0.16))
    for start, level in ((0.0, 1.0), (0.07, 0.7)):
        t = times(0.05)
        burst = band(noise(0.05, 6), 900, 7000) * np.exp(-t * 90) * level
        i = int(start * RATE)
        out[i:i + len(burst)] += burst
    return out


def swell() -> np.ndarray:
    """Soft rumble for crowd shots: it suggests a mass of people without using a recording."""
    t = times(1.6)
    return band(noise(1.6, 7), 120, 900) * np.clip(np.sin(np.pi * t / t[-1]), 0, None) ** 1.5


def stamp() -> np.ndarray:
    t = times(0.4)
    return (np.sin(2 * np.pi * 95 * t) * np.exp(-t * 16) + band(noise(0.4, 8), 300, 4000) * np.exp(-t * 60))


def gunshot() -> np.ndarray:
    """Distant, muffled shot for reconstructions: a dull crack, a low boom and a short echo, never a sharp bang."""
    t = times(1.2)
    crack = band(noise(1.2, 9), 150, 2200) * np.exp(-t * 45)
    boom = np.sin(2 * np.pi * (70 * t + 30 * np.exp(-t * 25) / 25)) * np.exp(-t * 9)
    shot = crack + 0.8 * boom
    echo = np.zeros_like(shot)
    lag = int(0.18 * RATE)
    echo[lag:] = shot[:-lag] * 0.3
    return shot + echo


def drone() -> np.ndarray:
    """Low dark bed under tense passages (6 s, fades in and out)."""
    t = times(6.0)
    tone = np.sin(2 * np.pi * 55 * t) + 0.5 * np.sin(2 * np.pi * 82.4 * t + 0.6 * np.sin(2 * np.pi * 0.2 * t))
    air = band(noise(6.0, 10), 60, 400) * 0.6
    return (tone + air) * np.sin(np.pi * t / t[-1]) ** 1.2


def heartbeat() -> np.ndarray:
    t = times(0.25)
    thump = np.sin(2 * np.pi * (48 * t + 20 * np.exp(-t * 30) / 30)) * np.exp(-t * 22)
    out = np.zeros(int(RATE * 2.4))
    for beat in (0.0, 0.8, 1.6):
        for offset, level in ((0.0, 1.0), (0.22, 0.65)):
            i = int((beat + offset) * RATE)
            out[i:i + len(thump)] += thump * level
    return out


def static() -> np.ndarray:
    """Radio static / bad phone line."""
    t = times(0.8)
    crackle = band(noise(0.8, 11), 800, 6000) * (0.5 + 0.5 * (np.random.default_rng(12).random(len(t)) > 0.97))
    return crackle * np.sin(np.pi * t / t[-1]) ** 0.5


def buzz() -> np.ndarray:
    """Phone vibrating: two short pulses."""
    out = np.zeros(int(RATE * 0.9))
    t = times(0.3)
    pulse = np.sin(2 * np.pi * 165 * t) * (np.sin(2 * np.pi * 330 * t) > 0) * np.sin(np.pi * t / t[-1]) ** 0.3
    for start in (0.0, 0.5):
        i = int(start * RATE)
        out[i:i + len(pulse)] += pulse[: len(out) - i]
    return out


SOUNDS = {"whoosh": whoosh, "pop": pop, "click": click, "tick": tick, "hit": hit, "riser": riser,
          "typing": typing, "shutter": shutter, "swell": swell, "stamp": stamp,
          "gunshot": gunshot, "drone": drone, "heartbeat": heartbeat, "static": static, "buzz": buzz}


def save(name: str, signal: np.ndarray) -> Path:
    signal = signal / (np.max(np.abs(signal)) or 1) * 0.89  # every file peaks at -1 dB
    pcm = (signal * 32767).astype("<i2")
    path = OUTPUT_DIR / f"{name}.wav"
    with wave.open(str(path), "wb") as fh:
        fh.setnchannels(1)
        fh.setsampwidth(2)
        fh.setframerate(RATE)
        fh.writeframes(pcm.tobytes())
    return path


def main() -> int:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, make in SOUNDS.items():
        print(f"wrote {save(name, make())}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
