"""Tests for the small command-line tools. Run with: .venv/bin/python -m pytest tests/"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))

from capture_page import CaptureError, looks_blocked, parse_crop  # noqa: E402
from find_photos import PhotoError, clean, credit_line, is_free, parse_picks  # noqa: E402
from make_video import check_times  # noqa: E402
from new_video import starter_plan, valid_name  # noqa: E402


def test_valid_name():
    assert valid_name("2026-10-14-farm-laws")
    assert not valid_name("Farm Laws") and not valid_name("x")


def test_starter_plan_has_voice_duration_and_one_music_bed():
    plan = starter_plan("videos/a/voice/original.mp3", 120.456)
    assert plan["duration"] == 120.46 and plan["scenes"] == []
    assert plan["music"][0]["to"] == 120.46


def test_parse_picks():
    assert parse_picks(["3:crowd", "12:bd_2"]) == [(3, "crowd"), (12, "bd_2")]
    with pytest.raises(PhotoError):
        parse_picks(["crowd"])
    with pytest.raises(PhotoError):
        parse_picks(["3:Bad Name"])


def test_licence_filter_and_credit():
    assert is_free("CC BY-SA 4.0") and is_free("Public domain") and is_free("GODL-India")
    assert not is_free("Fair use") and not is_free("")
    assert clean('<a href="x">Rayhan</a>\n Ahmed') == "Rayhan Ahmed"
    assert credit_line("Rayhan Ahmed", "CC BY-SA 4.0") == "Photo: Rayhan Ahmed / Wikimedia Commons · CC BY-SA 4.0"


def test_parse_crop():
    assert parse_crop("60,500,1660,1140") == (60, 500, 1660, 1140)
    with pytest.raises(CaptureError):
        parse_crop("60,500,1660")
    with pytest.raises(CaptureError, match="too small"):
        parse_crop("0,0,50,50")


def test_looks_blocked_flags_near_empty_pages():
    assert looks_blocked(22_000, 30)
    assert looks_blocked(900_000, 120)
    assert not looks_blocked(900_000, 4000)


def test_check_times_fall_inside_each_scene():
    assert check_times([0, 10, 12], 20) == [9.2, 11.75, 19.36]
