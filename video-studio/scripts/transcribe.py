"""Transcribe a narration into timed text.

Usage (from the project folder):

    .venv/bin/python scripts/transcribe.py --input videos/<name>/voice/narration.wav \
        --output-dir videos/<name>/timing

    # redo one stretch that came out missing or garbled (seconds), keeping the rest:
    .venv/bin/python scripts/transcribe.py --input ... --output-dir ... --window 134 157

Outputs (never touches the input file):

    timeline.txt        one line per sentence: start second, tab, text. Read this to plan scenes.
    words.txt           the same sentences with a start second on every word. Search it for exact cut points.
    segments_hi.json    everything, for scripts
    subtitles_hi.srt    subtitles to upload to YouTube
    transcript_hi.txt   plain text

It also warns about any stretch longer than 3 seconds with no words, which
usually means Whisper lost that part and it should be redone with --window.
"""

from __future__ import annotations

import argparse
import json
import logging
import subprocess
import sys
import tempfile
import tomllib
from dataclasses import dataclass, field
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SUPPORTED_EXTENSIONS = {".mp3", ".wav", ".m4a", ".flac", ".ogg"}

log = logging.getLogger("transcribe")


@dataclass(frozen=True)
class Segment:
    start: float  # seconds
    end: float  # seconds
    text: str
    words: tuple = field(default=())  # ((word, start, end), ...) when word timestamps are on


# ---------------------------------------------------------------------------
# Pure helpers (no model needed, so they are unit-tested directly)
# ---------------------------------------------------------------------------


def format_srt_time(seconds: float) -> str:
    """Format seconds as an SRT timestamp, HH:MM:SS,mmm."""
    if seconds < 0:
        raise ValueError(f"negative timestamp: {seconds}")
    total_ms = round(seconds * 1000)
    hours, rest = divmod(total_ms, 3_600_000)
    minutes, rest = divmod(rest, 60_000)
    secs, ms = divmod(rest, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{ms:03d}"


def build_srt(segments: list[Segment]) -> str:
    """Build SRT subtitle text from transcript segments."""
    blocks = []
    index = 0
    for seg in segments:
        text = seg.text.strip()
        if not text:
            continue
        index += 1
        blocks.append(
            f"{index}\n"
            f"{format_srt_time(seg.start)} --> {format_srt_time(seg.end)}\n"
            f"{text}\n"
        )
    return "\n".join(blocks)


def build_transcript_text(segments: list[Segment]) -> str:
    """Plain Hindi text, one line per segment, UTF-8."""
    lines = [seg.text.strip() for seg in segments if seg.text.strip()]
    return "\n".join(lines) + "\n"


def build_segments_json(segments: list[Segment]) -> str:
    """Segments with per-word timings as JSON, for the video edit steps."""
    data = [
        {
            "start": round(seg.start, 3),
            "end": round(seg.end, 3),
            "text": seg.text.strip(),
            "words": [
                {"word": w.strip(), "start": round(s, 3), "end": round(e, 3)}
                for w, s, e in seg.words
            ],
        }
        for seg in segments
        if seg.text.strip()
    ]
    return json.dumps(data, ensure_ascii=False, indent=1) + "\n"


def build_timeline_text(segments: list[Segment]) -> str:
    """Compact transcript for planning scenes: 'start<TAB>text' per segment."""
    return "".join(f"{seg.start:.1f}\t{seg.text.strip()}\n" for seg in segments if seg.text.strip())


def build_words_text(segments: list[Segment]) -> str:
    """Every word with its start second, one segment per line, for finding exact cut points."""
    lines = []
    for seg in segments:
        if seg.words:
            lines.append(" ".join(f"{start:.1f}:{word.strip()}" for word, start, _ in seg.words))
    return "\n".join(lines) + "\n"


def find_gaps(segments: list[Segment], total: float, longest: float = 3.0) -> list[tuple[float, float]]:
    """Stretches with no words that are longer than `longest` seconds."""
    gaps, cursor = [], 0.0
    for seg in sorted(segments, key=lambda s: s.start):
        if seg.start - cursor > longest:
            gaps.append((round(cursor, 1), round(seg.start, 1)))
        cursor = max(cursor, seg.end)
    if total - cursor > longest:
        gaps.append((round(cursor, 1), round(total, 1)))
    return gaps


def replace_window(old: list[Segment], new: list[Segment], start: float, end: float) -> list[Segment]:
    """Swap the segments that start inside [start, end) for freshly transcribed ones."""
    kept = [seg for seg in old if not (start <= seg.start < end)]
    return sorted(kept + new, key=lambda s: s.start)


def segments_from_json(text: str) -> list[Segment]:
    return [Segment(d["start"], d["end"], d["text"], tuple((w["word"], w["start"], w["end"]) for w in d.get("words", [])))
            for d in json.loads(text)]


def validate_input(path: Path) -> None:
    """Raise a clear error if the input file is unusable."""
    if not path.exists():
        raise FileNotFoundError(f"input file not found: {path}")
    if not path.is_file():
        raise ValueError(f"input is not a file: {path}")
    if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            f"unsupported format '{path.suffix}'. Use one of: "
            f"{', '.join(sorted(SUPPORTED_EXTENSIONS))}"
        )
    if path.stat().st_size == 0:
        raise ValueError(f"input file is empty: {path}")


def load_config(config_path: Path) -> dict:
    """Load config.toml and return the transcription section."""
    if not config_path.exists():
        raise FileNotFoundError(f"config file not found: {config_path}")
    with config_path.open("rb") as fh:
        config = tomllib.load(fh)
    return config.get("transcription", {})


# ---------------------------------------------------------------------------
# Model step
# ---------------------------------------------------------------------------


def media_seconds(path: Path) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         capture_output=True, text=True, check=True).stdout
    return float(out.strip())


def transcribe_window(input_path: Path, settings: dict, start: float, end: float) -> list[Segment]:
    """Transcribe only [start, end) of the file and return segments on the full file's clock."""
    with tempfile.TemporaryDirectory() as tmp:
        piece = Path(tmp) / "piece.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(start), "-t", str(end - start), "-i", str(input_path),
                        "-ac", "1", "-ar", "16000", str(piece)], check=True)
        # a short piece has no silence worth filtering, and the filter is what loses speech
        segments, _, _ = transcribe_file(piece, {**settings, "vad_filter": False})
    return [Segment(s.start + start, s.end + start, s.text, tuple((w, a + start, b + start) for w, a, b in s.words))
            for s in segments]


def transcribe_file(input_path: Path, settings: dict) -> tuple[list[Segment], str, float]:
    """Run faster-whisper and return (segments, detected_language, probability)."""
    # Imported here so the helpers above can be tested without the package installed.
    from faster_whisper import WhisperModel

    model_size = settings.get("model_size", "small")
    log.info("loading model '%s' (first run downloads it; needs internet)", model_size)
    model = WhisperModel(
        model_size,
        device=settings.get("device", "cpu"),
        compute_type=settings.get("compute_type", "int8"),
    )

    language = settings.get("language", "hi")
    log.info("transcribing %s (language=%s, vad_filter=%s)",
             input_path.name, language, settings.get("vad_filter", True))
    raw_segments, info = model.transcribe(
        str(input_path),
        language=language,
        vad_filter=settings.get("vad_filter", True),
        beam_size=settings.get("beam_size", 5),
        initial_prompt=settings.get("initial_prompt") or None,
        word_timestamps=settings.get("word_timestamps", False),
        condition_on_previous_text=settings.get("condition_on_previous_text", True),
    )

    segments = [
        Segment(s.start, s.end, s.text,
                tuple((w.word, w.start, w.end) for w in (s.words or ())))
        for s in raw_segments
    ]
    return segments, info.language, info.language_probability


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------


def setup_logging(log_file: Path) -> None:
    log_file.parent.mkdir(parents=True, exist_ok=True)
    handlers = [logging.StreamHandler(sys.stdout), logging.FileHandler(log_file, encoding="utf-8")]
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        handlers=handlers,
    )


def run(input_path: Path, output_dir: Path, config_path: Path, model_size: str | None = None,
        window: tuple[float, float] | None = None) -> dict:
    settings = load_config(config_path)

    if model_size:
        settings["model_size"] = model_size
    validate_input(input_path)
    detected_lang = settings.get("language", "hi")

    if window:
        existing = output_dir / "segments_hi.json"
        if not existing.exists():
            raise FileNotFoundError(f"nothing to patch: {existing} not found; run without --window first")
        fresh = transcribe_window(input_path, settings, *window)
        segments = replace_window(segments_from_json(existing.read_text(encoding="utf-8")), fresh, *window)
        log.info("re-transcribed %.1fs to %.1fs: %d segment(s)", window[0], window[1], len(fresh))
    else:
        segments, detected_lang, probability = transcribe_file(input_path, settings)
        log.info("detected language: %s (probability %.2f)", detected_lang, probability)
        expected = settings.get("language", "hi")
        if detected_lang != expected:
            log.warning("detected language '%s' differs from expected '%s'; check the transcript",
                        detected_lang, expected)

    if not segments:
        raise RuntimeError("no speech detected; check the recording")

    output_dir.mkdir(parents=True, exist_ok=True)
    txt_path = output_dir / "transcript_hi.txt"
    srt_path = output_dir / "subtitles_hi.srt"
    txt_path.write_text(build_transcript_text(segments), encoding="utf-8")
    srt_path.write_text(build_srt(segments), encoding="utf-8")
    json_path = output_dir / "segments_hi.json"
    json_path.write_text(build_segments_json(segments), encoding="utf-8")
    (output_dir / "timeline.txt").write_text(build_timeline_text(segments), encoding="utf-8")
    (output_dir / "words.txt").write_text(build_words_text(segments), encoding="utf-8")
    gaps = find_gaps(segments, media_seconds(input_path))
    for gap_start, gap_end in gaps:
        log.warning("no words between %.1fs and %.1fs; if there is speech there, rerun with --window %.0f %.0f",
                    gap_start, gap_end, max(gap_start - 1, 0), gap_end + 1)

    log.info("wrote %s (%d segments)", txt_path, len(segments))
    log.info("wrote %s", srt_path)
    log.info("wrote %s", json_path)
    return {
        "segments": len(segments),
        "language": detected_lang,
        "transcript": str(txt_path),
        "subtitles": str(srt_path),
        "gaps": gaps,
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Transcribe Hindi narration to text and SRT.")
    parser.add_argument("--model-size", choices=["tiny", "base", "small", "medium", "large-v3"],
                        help="override model_size from config.toml")
    parser.add_argument("--input", required=True, type=Path,
                        help="path to .mp3 or .wav narration (not modified)")
    parser.add_argument("--window", type=float, nargs=2, metavar=("START", "END"),
                        help="redo only this stretch (seconds) and merge it into the existing transcript")
    parser.add_argument("--output-dir", type=Path, default=PROJECT_ROOT / "output",
                        help="where to write transcript and subtitles")
    parser.add_argument("--config", type=Path, default=PROJECT_ROOT / "config.toml",
                        help="path to config.toml")
    parser.add_argument("--log-file", type=Path, default=PROJECT_ROOT / "logs" / "transcribe.log",
                        help="log file path")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    setup_logging(args.log_file)
    try:
        result = run(args.input.expanduser().resolve(), args.output_dir, args.config, model_size=args.model_size,
                     window=tuple(args.window) if args.window else None)
    except subprocess.CalledProcessError as exc:
        log.error("FFmpeg could not read the audio (exit code %s)", exc.returncode)
        return 1
    except (FileNotFoundError, ValueError, RuntimeError) as exc:
        log.error("%s", exc)
        return 1
    except Exception:
        log.exception("unexpected error during transcription")
        return 2
    log.info("done: %s", result)
    return 0


if __name__ == "__main__":
    sys.exit(main())
