"""Tests for scripts/build_video.py helpers. Run with: python -m pytest tests/"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))

from build_video import Scene, SceneError, fit_box, scene_ends, t_chain, t_pills, validate  # noqa: E402


def test_fit_box_keeps_shape_inside_limits():
    assert fit_box(2000, 1000, 1000, 800) == (1000, 500)
    assert fit_box(1000, 2000, 1000, 800) == (400, 800)


def test_scene_ends_run_to_the_next_scene_and_the_video_end():
    assert scene_ends([0, 2.5, 6], 10) == [2.5, 6, 10]


def test_validate_accepts_a_simple_plan():
    validate([{"t": 0, "type": "words"}, {"t": 3, "type": "chain"}], 10)


def test_validate_rejects_common_mistakes():
    with pytest.raises(SceneError, match="start at t = 0"):
        validate([{"t": 1, "type": "words"}], 10)
    with pytest.raises(SceneError, match="unknown type 'gif'"):
        validate([{"t": 0, "type": "gif"}], 10)
    with pytest.raises(SceneError, match="must start after"):
        validate([{"t": 0, "type": "words"}, {"t": 0, "type": "words"}], 10)
    with pytest.raises(SceneError, match="only 10"):
        validate([{"t": 0, "type": "words"}, {"t": 12, "type": "words"}], 10)


def test_chain_scene_lights_each_node_on_its_cue():
    data = {"t": 5, "type": "chain", "label": "Sequence", "nodes": [["Crisis", 6.0], ["President out", 8.0]]}
    scene = Scene(3, data, 10)
    t_chain(scene, data, None)
    page = "".join(scene.html)
    assert 'id="s3n0"' in page and '<b class="gold">President out</b>' in page
    assert [5, "whoosh", -16] in scene.cues and [6.0, "tick", -11] in scene.cues and [8.0, "hit", -9] in scene.cues


def test_quiet_scene_adds_no_sound_cues():
    data = {"t": 0, "type": "pills", "quiet": True, "pills": [["One", 1.0], ["Two", 2.0]]}
    scene = Scene(0, data, 5)
    t_pills(scene, data, None)
    assert scene.cues == []


def test_icons_scene_inlines_icons_and_cues_each_tile():
    from build_video import t_icons

    data = {"t": 0, "type": "icons", "label": "Ban se aage", "join": "+",
            "tiles": [["banknote", "Corruption", 1.0], ["scale", "Governance", 2.0]]}
    scene = Scene(4, data, 6)
    t_icons(scene, data, None)
    page = "".join(scene.html)
    assert page.count("<svg") == 2 and "Corruption" in page and 'class="joiner tj"' in page
    assert [1.0, "pop", -11] in scene.cues and [2.0, "pop", -11] in scene.cues


def test_unknown_icon_is_reported():
    from build_video import icon_svg

    with pytest.raises(SceneError, match="no icon called 'unicorn'"):
        icon_svg("unicorn")


def test_collage_takes_two_to_four_pictures():
    from build_video import t_collage

    data = {"t": 0, "type": "collage", "imgs": [["a.jpg", 0.2]]}
    with pytest.raises(SceneError, match="2, 3 or 4"):
        t_collage(Scene(0, data, 5), data, None)
    data = {"t": 0, "type": "collage", "imgs": [["a.jpg", 0.2], ["b.jpg", 1.0]], "cap": ["Delhi", "Massive <b>movement</b>", 1.2]}
    scene = Scene(0, data, 5)
    t_collage(scene, data, None)
    assert scene.assets == {"a.jpg", "b.jpg"} and "Massive" in "".join(scene.html)


def test_timeline_marks_the_gold_event():
    from build_video import t_timeline

    data = {"t": 0, "type": "timeline", "events": [["16 May", "Founded", 1.0], ["October", "Protests", 2.0, True]]}
    scene = Scene(2, data, 6)
    t_timeline(scene, data, None)
    assert "".join(scene.html).count('class="tev hot"') == 1
    assert [2.0, "hit", -10] in scene.cues
