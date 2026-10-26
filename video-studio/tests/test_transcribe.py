"""Tests for scripts/transcribe.py helpers. Run with: python -m pytest tests/"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))

from transcribe import (  # noqa: E402
    Segment,
    build_srt,
    build_transcript_text,
    format_srt_time,
    load_config,
    validate_input,
)


def test_format_srt_time_basic():
    assert format_srt_time(0) == "00:00:00,000"
    assert format_srt_time(1.5) == "00:00:01,500"


def test_format_srt_time_over_an_hour():
    assert format_srt_time(3723.25) == "01:02:03,250"


def test_format_srt_time_rejects_negative():
    with pytest.raises(ValueError):
        format_srt_time(-1)


def test_build_srt_numbers_blocks_and_skips_empty():
    segments = [
        Segment(0.0, 2.5, "  नमस्ते दुनिया  "),
        Segment(2.5, 3.0, "   "),  # empty text is skipped
        Segment(3.0, 5.0, "यह एक परीक्षा है।"),
    ]
    srt = build_srt(segments)
    expected = (
        "1\n00:00:00,000 --> 00:00:02,500\nनमस्ते दुनिया\n\n"
        "2\n00:00:03,000 --> 00:00:05,000\nयह एक परीक्षा है।\n"
    )
    assert srt == expected


def test_build_transcript_text_keeps_hindi_utf8():
    segments = [Segment(0, 1, "पहला वाक्य।"), Segment(1, 2, "दूसरा वाक्य।")]
    assert build_transcript_text(segments) == "पहला वाक्य।\nदूसरा वाक्य।\n"


def test_validate_input_missing_file(tmp_path):
    with pytest.raises(FileNotFoundError):
        validate_input(tmp_path / "nope.mp3")


def test_validate_input_rejects_wrong_extension(tmp_path):
    f = tmp_path / "voice.xyz"
    f.write_bytes(b"data")
    with pytest.raises(ValueError, match="unsupported format"):
        validate_input(f)


def test_validate_input_rejects_empty_file(tmp_path):
    f = tmp_path / "voice.mp3"
    f.write_bytes(b"")
    with pytest.raises(ValueError, match="empty"):
        validate_input(f)


def test_validate_input_accepts_mp3(tmp_path):
    f = tmp_path / "voice.MP3"  # uppercase extension should be accepted
    f.write_bytes(b"not-really-audio-but-non-empty")
    validate_input(f)  # no exception


def test_load_config_reads_transcription_section(tmp_path):
    cfg = tmp_path / "config.toml"
    cfg.write_text('[transcription]\nmodel_size = "base"\nlanguage = "hi"\n', encoding="utf-8")
    settings = load_config(cfg)
    assert settings == {"model_size": "base", "language": "hi"}


def test_load_config_missing_file(tmp_path):
    with pytest.raises(FileNotFoundError):
        load_config(tmp_path / "missing.toml")


def test_timeline_and_words_text_are_compact():
    from transcribe import build_timeline_text, build_words_text

    segments = [Segment(0.0, 2.0, " Saal 2022 ", ((" Saal", 0.0, 0.7), (" 2022", 0.7, 1.6)))]
    assert build_timeline_text(segments) == "0.0\tSaal 2022\n"
    assert build_words_text(segments) == "0.0:Saal 0.7:2022\n"


def test_find_gaps_reports_long_silent_stretches():
    from transcribe import find_gaps

    segments = [Segment(0.0, 5.0, "a"), Segment(12.0, 15.0, "b")]
    assert find_gaps(segments, 16.0) == [(5.0, 12.0)]
    assert find_gaps(segments, 30.0) == [(5.0, 12.0), (15.0, 30.0)]


def test_replace_window_swaps_only_segments_inside_it():
    from transcribe import replace_window

    old = [Segment(0.0, 5.0, "keep"), Segment(6.0, 9.0, "garbled"), Segment(20.0, 22.0, "keep too")]
    merged = replace_window(old, [Segment(6.5, 9.5, "fixed")], 5.5, 15.0)
    assert [s.text for s in merged] == ["keep", "fixed", "keep too"]
