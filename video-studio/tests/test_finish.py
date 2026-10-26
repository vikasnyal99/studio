"""Tests for scripts/finish.py helpers. Run with: python -m pytest tests/"""

import json
import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))

from finish import RATE, SoundError, add_at, db_to_gain, fade, load_sound_plan, rms_db  # noqa: E402


def test_db_to_gain():
    assert db_to_gain(0) == 1
    assert db_to_gain(-20) == pytest.approx(0.1)


def test_rms_db_ignores_silence():
    tone = np.concatenate([np.zeros(RATE), np.full(RATE, 0.5)])
    assert rms_db(tone) == pytest.approx(-6.02, abs=0.01)
    assert rms_db(np.zeros(100)) == -120.0


def test_add_at_places_sound_and_drops_overrun():
    mix = np.zeros((RATE, 2))
    add_at(mix, np.ones(RATE), 0.5, 0.5)
    assert mix[RATE // 2 - 1, 0] == 0
    assert mix[RATE // 2, 0] == 0.5 and mix[-1, 1] == 0.5
    add_at(mix, np.ones(10), 5.0, 1.0)  # starts after the end: ignored


def test_fade_ramps_both_ends():
    out = fade(np.ones((RATE, 2)), 0.1, 0.1)
    assert out[0, 0] == 0 and out[-1, 0] == 0
    assert out[RATE // 2, 0] == 1


def make_plan(tmp_path, **changes):
    (tmp_path / "voice.mp3").write_bytes(b"x")
    (tmp_path / "sfx").mkdir(exist_ok=True)
    (tmp_path / "sfx" / "pop.wav").write_bytes(b"x")
    plan = {"voice": {"file": "voice.mp3", "start": 0, "end": 10}, "sfx_dir": "sfx", "cues": [[1.0, "pop", -10]]}
    plan.update(changes)
    path = tmp_path / "sound.json"
    path.write_text(json.dumps(plan), encoding="utf-8")
    return path


def test_load_sound_plan_accepts_a_valid_plan(tmp_path):
    plan = load_sound_plan(make_plan(tmp_path), tmp_path)
    assert plan["cues"] == [[1.0, "pop", -10]]


def test_load_sound_plan_rejects_unknown_effect(tmp_path):
    with pytest.raises(SoundError, match="no effect called 'boom'"):
        load_sound_plan(make_plan(tmp_path, cues=[[1.0, "boom", -10]]), tmp_path)


def test_load_sound_plan_rejects_backwards_voice_range(tmp_path):
    with pytest.raises(SoundError, match="'end' must be after 'start'"):
        load_sound_plan(make_plan(tmp_path, voice={"file": "voice.mp3", "start": 5, "end": 2}), tmp_path)
