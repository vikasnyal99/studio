"""Build a HyperFrames project and a sound plan from a video's scenes.json.

Usage (from the project folder, with the venv active):

    .venv/bin/python scripts/build_video.py videos/<name>

Reads   videos/<name>/scenes.json        the storyboard: one entry per scene
Writes  videos/<name>/hf/index.html      the animated scenes (render with HyperFrames)
        videos/<name>/hf/assets/...      copies of the pictures, fonts and map it uses
        videos/<name>/sound.json         voice, music and one cue per sound effect

Each scene has "t" (the narration second it starts; it runs until the next
scene) and "type". The scene types and their options are listed in
docs/SCENES.md. Text values may use <b>...</b> for the gold accent.
"""

from __future__ import annotations

import argparse
import html
import json
import logging
import math
import shutil
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
LIBRARY = PROJECT_ROOT / "library"
GOLD, RED, BLUE = "#e8b34b", "#b8493f", "#4a7fb5"
COLOURS = {"gold": GOLD, "red": RED, "blue": BLUE}

log = logging.getLogger("build")


class SceneError(ValueError):
    """scenes.json has a mistake the user can fix."""


class Scene:
    """Collects the HTML, the animation steps and the sound cues of one scene."""

    def __init__(self, index: int, data: dict, end: float):
        self.id = f"s{index}"
        self.data, self.start, self.end = data, float(data["t"]), end
        self.html: list[str] = []
        self.css: list[str] = []
        self.js: list[str] = []
        self.cues: list[list] = []
        self.assets: set[str] = set()
        self.blurs: set[str] = set()

    def where(self) -> str:
        return f"scene at t={self.start} ({self.data.get('type')})"

    soft = 0

    def cue(self, at: float, name: str, level: float) -> None:
        if self.data.get("quiet"):
            return
        # a whoosh on every picture gets tiring: keep it for big moments (titles, maps, reconstructions, the opening,
        # or a scene marked "loud") and give other scenes a quieter pop/tick/click on every second cue instead
        major = self.data.get("type") in ("title", "map", "recon") or self.data.get("loud") or (self.data.get("type") == "comic" and at < 0.5)
        if name == "whoosh" and not major:
            self.soft += 1
            if self.soft % 2:
                return
            name, level = ("pop", "tick", "click")[(self.soft // 2) % 3], -25
        self.cues.append([round(at, 3), name, level])

    def img(self, name: str) -> str:
        self.assets.add(name)
        return f"assets/{name}"

    def backdrop(self) -> str:
        """Blurred, darkened picture behind text scenes."""
        name = self.data.get("bg", "protest_crowd.jpg")
        self.blurs.add(name)
        return f'<img class="fill" src="assets/blur_{Path(name).stem}.jpg" />'

    def caption(self, cap: list | None, extra_class: str = "", suffix: str = "") -> None:
        if not cap:
            return
        label, line, at = cap[0], cap[1], cap[2]
        cid = f"{self.id}cap{suffix}"
        self.html.append(f'<div class="caption {extra_class}" id="{cid}"><div class="label">{label}</div>'
                         f'<div class="line">{line}</div></div>')
        self.js.append(f'D.rise(tl, "#{cid}", {at});')
        if len(cap) > 3:
            self.js.append(f'tl.to("#{cid}", {{ opacity: 0, duration: 0.2 }}, {cap[3]});')

    def stamp(self, style: str = "") -> None:
        if not self.data.get("stamp"):
            return
        text, sub, at = self.data["stamp"]
        self.html.append(f'<div class="stamp" id="{self.id}st" style="{style}">{text}<small>{sub}</small></div>')
        self.js.append(f'tl.fromTo("#{self.id}st", {{ opacity: 0, scale: 1.7 }}, {{ opacity: 1, scale: 1, duration: 0.22, ease: "power4.in" }}, {at});')
        self.cue(at + 0.2, "stamp", -7)

    def credit(self) -> None:
        if self.data.get("credit"):
            self.html.append(f'<div class="credit">{self.data["credit"]}</div>')


# ---------------------------------------------------------------------------
# Pure helpers (unit-tested directly)
# ---------------------------------------------------------------------------


def fit_box(width: int, height: int, max_w: float, max_h: float) -> tuple[int, int]:
    """Largest size with the picture's shape that fits inside max_w x max_h."""
    scale = min(max_w / width, max_h / height)
    return round(width * scale), round(height * scale)


def scene_ends(starts: list[float], total: float) -> list[float]:
    return starts[1:] + [total]


def validate(scenes: list[dict], total: float) -> None:
    if not scenes:
        raise SceneError("scenes.json has no scenes")
    if scenes[0].get("t") != 0:
        raise SceneError("the first scene must start at t = 0")
    last = -1.0
    for i, scene in enumerate(scenes, 1):
        if "t" not in scene or "type" not in scene:
            raise SceneError(f"scene #{i} needs both 't' and 'type'")
        if scene["type"] not in TEMPLATES:
            raise SceneError(f"scene #{i} (t={scene['t']}): unknown type '{scene['type']}'. "
                             f"Use one of: {', '.join(sorted(TEMPLATES))}")
        if scene["t"] <= last:
            raise SceneError(f"scene #{i} (t={scene['t']}) must start after the scene before it (t={last})")
        last = scene["t"]
    if last >= total:
        raise SceneError(f"the last scene starts at {last}s but the video is only {total}s long")


# ---------------------------------------------------------------------------
# Scene templates
# ---------------------------------------------------------------------------


def t_photo(s: Scene, d: dict, sizes) -> None:
    grow = d.get("move", "in") == "in"
    s.html.append(f'<img class="fill grade" id="{s.id}p" src="{s.img(d["img"])}" '
                  f'style="object-position: {d.get("pos", "center")}" /><div class="shade"></div>')
    s.js.append(f'D.drift(tl, "#{s.id}p", {s.start}, {s.end}, {1.0 if grow else 1.12}, {1.1 if grow else 1.0});')
    s.caption(d.get("cap"))
    s.stamp()
    s.credit()
    if d.get("sfx") is None and s.end - s.start > 2.5:
        s.cue(s.start, "shutter", -13)


def t_art(s: Scene, d: dict, sizes) -> None:
    """An illustration (not a photo) pushing in slowly with a drifting sway; always labelled as an illustration."""
    s.html.append(f'<img class="fill grade" id="{s.id}p" src="{s.img(d["img"])}" style="object-position: {d.get("pos", "50% 30%")}" /><div class="shade"></div>')
    s.js.append(f'D.drift(tl, "#{s.id}p", {s.start}, {s.end}, 1.0, 1.14);')
    s.js.append(f'tl.fromTo("#{s.id}p", {{ rotation: -0.6 }}, {{ rotation: 0.6, duration: {s.end - s.start:.2f}, ease: "sine.inOut", force3D: true }}, {s.start});')
    s.html.append(f'<div class="chip" style="left: 70px; top: 70px">{d.get("chip", "Illustration · not a real photo")}</div>')
    s.caption(d.get("cap"))
    s.stamp()
    for at in d.get("shots", []):
        s.cue(at, "gunshot", -14)


def t_toon(s: Scene, d: dict, sizes) -> None:
    """A 2D cartoon story animation (library/templates/toon.js): phone, crowd, travel, lift, fight or candle."""
    spec = {k: v for k, v in d.items() if k not in ("t", "type", "say", "cap", "credit", "sfx")}
    spec["id"] = s.id
    s.html.append(f'<svg class="over" viewBox="0 0 1920 1080" id="{s.id}t"></svg>')
    s.js.append(f'Toon.run(tl, document.querySelector("#{s.id}t"), {json.dumps(spec)}, {s.start}, {s.end});')
    for at, name, level in d.get("sfx", []):
        s.cue(at, name, level)
    s.caption(d.get("cap"))
    s.stamp()
    s.credit()


def t_clip(s: Scene, d: dict, sizes) -> None:
    """A short video clip (assets/<clip>) full screen, slow push, with a caption and a credit."""
    name = d["clip"]
    s.assets.add(name)
    s.html.append(f'<div class="camwrap" id="{s.id}w"><video class="fill grade" id="{s.id}v" src="assets/{name}" muted playsinline data-start="{s.start}" '
                  f'data-duration="{s.end - s.start:.3f}" data-media-start="{d.get("from", 0)}" style="object-position: {d.get("pos", "center")}"></video></div><div class="shade"></div>')
    s.js.append(f'tl.fromTo("#{s.id}v", {{ scale: 1.0 }}, {{ scale: {d.get("zoom", 1.08)}, duration: {s.end - s.start:.2f}, ease: "sine.inOut", force3D: true }}, {s.start});')
    s.caption(d.get("cap"))
    s.stamp()
    s.credit()
    for at, name2, level in d.get("sfx", []):
        s.cue(at, name2, level)


def t_framed(s: Scene, d: dict, sizes) -> None:
    """A low-resolution clip shown smaller inside an animated gold frame over a blurred copy of itself."""
    name = d["clip"]
    s.assets.add(name)
    fw = d.get("width", 1080)
    fh = int(fw * d.get("aspect", 9 / 16))
    left, top = (1920 - fw) // 2, d.get("top", 130)
    dur = s.end - s.start
    vid = lambda vid_id, style: (f'<video class="fill" id="{s.id}{vid_id}" src="assets/{name}" muted playsinline data-start="{s.start}" '
                                 f'data-duration="{dur:.3f}" data-media-start="{d.get("from", 0)}" style="{style}"></video>')
    s.html.append(f'<div class="camwrap" id="{s.id}w">{vid("b", "filter: blur(36px) brightness(0.42) saturate(1.15); transform: scale(1.25)")}</div>')
    corners = "".join(f'<i class="fc" style="{pos}"></i>' for pos in ("left:-18px;top:-18px;border-width:6px 0 0 6px", "right:-18px;top:-18px;border-width:6px 6px 0 0",
                                                                      "left:-18px;bottom:-18px;border-width:0 0 6px 6px", "right:-18px;bottom:-18px;border-width:0 6px 6px 0"))
    s.html.append(f'<div id="{s.id}f" style="position:absolute;left:{left}px;top:{top}px;width:{fw}px;height:{fh}px;border:4px solid #e8b34b;'
                  f'box-shadow:0 30px 90px rgba(0,0,0,0.65);background:#000;opacity:0">'
                  f'<div style="position:absolute;inset:0;overflow:hidden">{vid("v", "object-fit: cover")}</div>{corners}</div>'
                  '<style>.fc{position:absolute;width:64px;height:64px;border-style:solid;border-color:#e8b34b}</style>')
    if d.get("tag"):
        s.html.append(f'<div class="chip" id="{s.id}g" style="left:{left}px;top:{top - 52}px;color:#e8b34b;opacity:0">{d["tag"]}</div>')
        s.js.append(f'tl.to("#{s.id}g", {{ opacity: 1, duration: 0.3 }}, {s.start + 0.5:.2f});')
    s.js.append(f'tl.fromTo("#{s.id}f", {{ opacity: 0, scale: 0.86, rotation: -1.5 }}, {{ opacity: 1, scale: 1, rotation: 0, duration: 0.5, ease: "back.out(1.4)", force3D: true }}, {s.start + 0.05:.2f});')
    s.js.append(f'tl.fromTo("#{s.id}f", {{ scale: 1 }}, {{ scale: 1.035, duration: {max(dur - 0.6, 0.1):.2f}, ease: "sine.inOut", force3D: true }}, {s.start + 0.6:.2f});')
    s.caption(d.get("cap"))
    s.stamp()
    s.credit()
    for at, name2, level in d.get("sfx", []):
        s.cue(at, name2, level)
    s.cue(s.start + 0.05, "pop", -14)


def t_card(s: Scene, d: dict, sizes) -> None:
    width, height = sizes(d["img"])
    side = bool(d.get("cap"))
    w, h = fit_box(width, height, 1020 if side else 1240, 800)
    left = 1810 - w if side else (1920 - w) // 2
    top = (1080 - h) // 2 + (0 if side else 10)
    s.html.append(s.backdrop())
    if d.get("chip"):
        s.html.append(f'<div class="chip" style="left: {left}px; top: {top - 46}px">{d["chip"]}</div>')
    marks = ""
    for i, (ml, mt, mw, mh, at) in enumerate(d.get("marks", [])):
        marks += f'<div class="mark" id="{s.id}m{i}" style="left: {ml}%; top: {mt}%; width: {mw}%; height: {mh}%"></div>'
        s.js.append(f'D.mark(tl, "#{s.id}m{i}", {at});')
        s.cue(at, "click", -10)
    fit = "contain" if d.get("contain") else "cover"
    s.html.append(f'<div class="card" id="{s.id}c" style="left: {left}px; top: {top}px; width: {w}px; height: {h}px">'
                  f'<img src="{s.img(d["img"])}" style="object-fit: {fit}" />{marks}</div>')
    s.js.append(f'tl.fromTo("#{s.id}c", {{ y: 60, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.35, ease: "power3.out" }}, {s.start});')
    s.js.append(f'tl.fromTo("#{s.id}c", {{ scale: 1 }}, {{ scale: 1.045, duration: {max(s.end - s.start - 0.4, 0.1):.2f}, ease: "none" }}, {s.start + 0.36:.2f});')
    s.caption(d.get("cap"), "mid")
    s.credit()
    s.cue(s.start, "whoosh", -17)


def t_list(s: Scene, d: dict, sizes) -> None:
    s.html.append(s.backdrop())
    items = "".join(f'<div class="item" id="{s.id}i{i}">{text}</div>' for i, (text, _) in enumerate(d["items"]))
    s.html.append(f'<div class="list"><div class="label" style="margin-bottom: 40px">{d.get("label", "")}</div>{items}</div>')
    for i, (_, at) in enumerate(d["items"]):
        s.js.append(f'D.rise(tl, "#{s.id}i{i}", {at}, 0.25);')
        s.cue(at, "pop", -10)
    cards = d.get("cards", [])
    for i, card in enumerate(cards):
        img, chip, at = card[0], card[1], card[2]
        kind = "photo" if len(card) > 3 and card[3] == "photo" else ""
        s.html.append(f'<div class="card side {kind}" id="{s.id}k{i}"><img src="{s.img(img)}" /></div>'
                      f'<div class="chip sidechip" id="{s.id}h{i}">{chip}</div>')
        s.js.append(f'tl.set(["#{s.id}k{i}", "#{s.id}h{i}"], {{ opacity: 1 }}, {at});')
        s.js.append(f'tl.fromTo("#{s.id}k{i}", {{ scale: 1.05 }}, {{ scale: 1, duration: 0.3, ease: "power2.out" }}, {at});')
        if i + 1 < len(cards):
            s.js.append(f'tl.set(["#{s.id}k{i}", "#{s.id}h{i}"], {{ opacity: 0 }}, {cards[i + 1][2]});')


def t_number(s: Scene, d: dict, sizes) -> None:
    dur = d.get("dur", min(1.0, s.end - s.start - 0.4))
    s.html.append(
        f'<svg class="over" viewBox="0 0 1920 1080"><path id="{s.id}r" pathLength="1" d="M110 900 C 500 880, 760 840, 1000 720 '
        f'S 1500 380, 1810 170" fill="none" stroke="rgba(232,179,75,0.35)" stroke-width="4" stroke-linecap="round" /></svg>'
        f'<div class="center"><div class="label">{d.get("label", "")}</div>'
        f'<div class="serif bignum" id="{s.id}n">0</div>'
        f'<div class="line" style="font-size: 38px; margin-top: 6px">{d.get("line", "")}</div></div>')
    s.js.append(f'D.draw(tl, "#{s.id}r", {s.start}, {dur + 0.15:.2f}, "power2.in");')
    s.js.append(f'D.counter(tl, "#{s.id}n", {s.start + 0.05:.2f}, {dur}, {d["to"]}, {d.get("dec", 0)}, '
                f'{json.dumps(d.get("suffix", ""))}, {json.dumps(d.get("prefix", ""))});')
    s.credit()
    s.cue(s.start, "riser", -15)
    s.cue(s.start + dur + 0.05, "tick", -12)


def t_title(s: Scene, d: dict, sizes) -> None:
    narrow = False
    if d.get("img"):
        iw, ih = sizes(d["img"])
        narrow = iw / ih < 1.45 and not d.get("cover")
    if narrow:
        # square/portrait photo: whole picture (face intact) on the right over a blurred copy of itself, text on the left
        s.html.append(f'<img class="fill" src="{s.img(d["img"])}" style="filter: blur(46px) brightness(0.55) saturate(1.1); transform: scale(1.25)" /><div class="dimmer" style="opacity: 0.35"></div>'
                      f'<img id="{s.id}p" src="{s.img(d["img"])}" style="position: absolute; right: 110px; top: 50px; height: 980px; width: auto; border-radius: 6px; box-shadow: 0 30px 80px rgba(0,0,0,0.6)" />')
        s.js.append(f'D.drift(tl, "#{s.id}p", {s.start}, {s.end}, 1.0, 1.04);')
    elif d.get("img"):
        s.html.append(f'<img class="fill grade" id="{s.id}p" src="{s.img(d["img"])}" /><div class="dimmer"></div>')
        s.js.append(f'D.drift(tl, "#{s.id}p", {s.start}, {s.end}, 1.0, 1.1);')
    else:
        s.html.append(s.backdrop())
    type_at = d.get("at", s.start + 0.4)
    size = d.get("size", 170)
    if narrow:
        size = min(size, 120)
    s.html.append(f'<div class="center"' + (' style="inset: 0 auto 0 0; width: 1000px; padding: 0 60px"' if narrow else '') + f'><div class="label" id="{s.id}l">{d.get("label", "")}</div>'
                  f'<div class="serif" id="{s.id}t" style="font-size: {size}px; line-height: 1.1; max-width: {880 if narrow else 1600}px">{d["title"]}</div>'
                  + (f'<div class="line" id="{s.id}u" style="font-size: 40px; font-weight: 500; opacity: 0">{d["sub"][0]}</div>' if d.get("sub") else "")
                  + "</div>")
    s.js.append(f'D.rise(tl, "#{s.id}l", {s.start + 0.15:.2f});')
    if d.get("pop"):
        s.js.append(f'tl.fromTo("#{s.id}t", {{ opacity: 0, scale: 1.12 }}, {{ opacity: 1, scale: 1, duration: 0.3, ease: "power3.out" }}, {type_at});')
        s.cue(type_at, "hit", -10)
    else:
        s.js.append(f'D.typeOn(tl, "#{s.id}t", {type_at}, {d.get("dur", 0.8)});')
        s.cue(type_at, "typing", -15)
    if d.get("sub"):
        s.js.append(f'D.rise(tl, "#{s.id}u", {d["sub"][1]});')
        s.cue(d["sub"][1], "tick", -12)
    s.credit()
    s.cue(s.start, "whoosh", -16)


def t_pills(s: Scene, d: dict, sizes) -> None:
    s.html.append(s.backdrop())
    joiner = d.get("join", "")
    parts = []
    for i, (text, at) in enumerate(d["pills"]):
        if i and joiner:
            parts.append(f'<div class="joiner" id="{s.id}j{i}">{joiner}</div>')
            s.js.append(f'tl.to("#{s.id}j{i}", {{ opacity: 1, duration: 0.2 }}, {at - 0.15:.2f});')
        parts.append(f'<div class="pill" id="{s.id}b{i}">{text}</div>')
        s.js.append(f'D.popIn(tl, "#{s.id}b{i}", {at});')
        s.cue(at, "pop", -11)
    s.html.append(f'<div class="center"><div class="label" id="{s.id}l" style="margin-bottom: 44px">{d.get("label", "")}</div>'
                  f'<div class="pillrow" style="max-width: {d.get("width", 1700)}px">{"".join(parts)}</div>'
                  + (f'<div class="line under" id="{s.id}u">{d["under"][0]}</div>' if d.get("under") else "") + "</div>")
    s.js.append(f'D.rise(tl, "#{s.id}l", {s.start + 0.1:.2f});')
    if d.get("under"):
        s.js.append(f'D.rise(tl, "#{s.id}u", {d["under"][1]});')


def t_person(s: Scene, d: dict, sizes) -> None:
    at = d.get("at", s.start + 0.3)
    s.html.append(s.backdrop())
    s.html.append(f'<div class="card portrait" id="{s.id}c"><img id="{s.id}p" src="{s.img(d["img"])}" '
                  f'style="object-position: {d.get("pos", "center top")}" /></div>'
                  f'<div class="name" id="{s.id}n"><div class="who">{d["name"]}</div><div class="role">{d.get("role", "")}</div></div>')
    s.js.append(f'tl.fromTo("#{s.id}c", {{ opacity: 0, x: 60 }}, {{ opacity: 1, x: 0, duration: 0.4, ease: "power3.out" }}, {at});')
    s.js.append(f'D.drift(tl, "#{s.id}p", {at}, {s.end}, 1.0, 1.07);')
    s.js.append(f'D.rise(tl, "#{s.id}n", {at + 0.3:.2f});')
    s.caption(d.get("cap"), "mid")
    s.stamp("left: 150px; right: auto; top: 640px")
    s.credit()
    s.cue(at, "hit", -12)


def t_chain(s: Scene, d: dict, sizes) -> None:
    s.html.append(s.backdrop())
    nodes = d["nodes"]
    width = min(380, (1700 - 80 * (len(nodes) - 1)) // len(nodes))
    parts = []
    for i, (text, at) in enumerate(nodes):
        if i:
            parts.append(f'<div class="arrow" id="{s.id}a{i}"></div>')
            s.js.append(f'tl.to("#{s.id}a{i}", {{ scaleX: 1, duration: 0.25, ease: "power2.out" }}, {at - 0.25:.2f});')
        gold = i == len(nodes) - 1 and d.get("last_gold", True)
        body = f'<b class="gold">{text}</b>' if gold else text
        parts.append(f'<div class="node" id="{s.id}n{i}" style="width: {width}px"><div class="n">{i + 1:02d}</div><div class="t">{body}</div></div>')
        s.js.append(f'tl.to("#{s.id}n{i}", {{ opacity: 1, borderColor: "rgba(232,179,75,0.7)", duration: 0.25 }}, {at});')
        s.js.append(f'tl.fromTo("#{s.id}n{i}", {{ y: 10 }}, {{ y: 0, duration: 0.25, ease: "power2.out" }}, {at});')
        s.cue(at, "hit" if gold else "tick", -9 if gold else -11)
    s.html.append(f'<div class="chainhead"><div class="label">{d.get("label", "")}</div></div><div class="chain">{"".join(parts)}</div>')
    s.cue(s.start, "whoosh", -16)


def t_words(s: Scene, d: dict, sizes) -> None:
    if d.get("img"):
        s.html.append(f'<img class="fill grade" id="{s.id}p" src="{s.img(d["img"])}" /><div class="dimmer"></div>')
        s.js.append(f'D.drift(tl, "#{s.id}p", {s.start}, {s.end}, 1.0, 1.08);')
        s.credit()
    else:
        s.html.append(s.backdrop())
    size = d.get("size", 62)
    lines = "".join(f'<div class="wline" id="{s.id}w{i}" style="font-size: {size}px">{text}</div>' for i, (text, _) in enumerate(d["lines"]))
    s.html.append(f'<div class="words"><div class="label" id="{s.id}l" style="margin-bottom: 30px">{d.get("label", "")}</div>{lines}</div>')
    s.js.append(f'D.rise(tl, "#{s.id}l", {s.start + 0.1:.2f});')
    for i, (_, at) in enumerate(d["lines"]):
        s.js.append(f'D.rise(tl, "#{s.id}w{i}", {at}, 0.3, 22);')
        s.cue(at, "tick", -14)


def t_network(s: Scene, d: dict, sizes) -> None:
    """Boxes joined by lines: who is connected to whom."""
    s.html.append(s.backdrop())
    centres = {}
    boxes = []
    for node in d["nodes"]:
        nid, title, sub, x, y, at = node[:6]
        img = node[6] if len(node) > 6 else None
        centres[nid] = (x, y)
        face = f'<img src="{s.img(img)}" />' if img else ""
        boxes.append(f'<div class="nnode {"hasface" if img else ""}" id="{s.id}n{nid}" style="left: {x}px; top: {y}px">{face}'
                     f'<div><div class="t">{title}</div><div class="u">{sub}</div></div></div>')
        s.js.append(f'D.popIn(tl, "#{s.id}n{nid}", {at});')
        s.cue(at, "pop", -11)
    lines = []
    for i, (a, b, at) in enumerate(d.get("links", [])):
        if a not in centres or b not in centres:
            raise SceneError(f"{s.where()}: link joins unknown node '{a}' or '{b}'")
        (x1, y1), (x2, y2) = centres[a], centres[b]
        lines.append(f'<path id="{s.id}k{i}" pathLength="1" d="M{x1} {y1} L {x2} {y2}" fill="none" stroke="{GOLD}" stroke-width="2.5" stroke-dasharray="1" stroke-dashoffset="1" />')
        s.js.append(f'D.draw(tl, "#{s.id}k{i}", {at}, 0.5);')
        s.cue(at, "tick", -12)
    s.html.insert(1, f'<svg class="over" viewBox="0 0 1920 1080">{"".join(lines)}</svg>')
    s.html.append("".join(boxes))
    s.html.append(f'<div class="chainhead" style="top: 90px"><div class="label">{d.get("label", "")}</div></div>')
    s.caption(d.get("cap"))
    s.cue(s.start, "whoosh", -16)


def t_map(s: Scene, d: dict, sizes) -> None:
    """One map with a moving camera; countries light up, pins, routes, sea labels and captions appear on cue."""
    mid = f"{s.id}map"
    s.html.append(f'<svg class="map" id="{mid}"></svg>')
    cams = d["cam"]  # [[at, seconds, lon, lat, zoom], ...]; the first entry is the starting view
    js = [f'{{ const world = D.buildMap("#{mid}"); const P = D.project; const ns = "http://www.w3.org/2000/svg";',
          'const add = (tag, attrs, text) => { const e = document.createElementNS(ns, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text) e.textContent = text; world.appendChild(e); return e; };',
          'const view = (c) => { const p = P(c[2], c[3]); return { x: p[0], y: p[1], zoom: c[4] }; };',
          f'const cams = {json.dumps(cams)};',
          'D.place(world, view(cams[0]));',
          'for (let i = 1; i < cams.length; i++) D.camera(tl, world, cams[i][0], cams[i][1], view(cams[i - 1]), view(cams[i]), "power2.inOut");']
    for code in d.get("focus", []):
        js.append(f'world.querySelector(\'[data-code="{code}"]\')?.classList.add("focus");')
    for item in d.get("light", []):
        code, at = item[0], item[1]
        colour = COLOURS.get(item[2], item[2]) if len(item) > 2 else GOLD
        js.append(f'tl.to(world.querySelector(\'[data-code="{code}"]\'), {{ fill: "{colour}", stroke: "{colour}", duration: 0.35 }}, {at});')
        if len(item) > 3:
            js.append(f'tl.to(world.querySelector(\'[data-code="{code}"]\'), {{ fill: "#171b25", stroke: "rgba(243,239,230,0.22)", duration: 0.35 }}, {item[3]});')
    for i, pin in enumerate(d.get("pins", [])):
        name, lon, lat, at, side, zoom, sub = pin[:7]
        drop = pin[7] if len(pin) > 7 else 0
        anchor = "start" if side > 0 else "end"
        js.append(f'{{ const p = P({lon}, {lat}), g = add("g", {{ id: "{s.id}pin{i}", opacity: 0 }});'
                  f' g.innerHTML = `<circle class="dot" cx="${{p[0]}}" cy="${{p[1]}}" r="{9 / zoom:.1f}"></circle>'
                  f'<text x="${{p[0] + {22 * side / zoom:.1f}}}" y="${{p[1] + {(8 + drop) / zoom:.1f}}}" font-size="{30 / zoom:.1f}" text-anchor="{anchor}">{html.escape(name)}</text>'
                  + (f'<text x="${{p[0] + {22 * side / zoom:.1f}}}" y="${{p[1] + {(38 + drop) / zoom:.1f}}}" font-size="{22 / zoom:.1f}" text-anchor="{anchor}" style="fill:{GOLD}">{html.escape(sub)}</text>' if sub else "")
                  + f'`; tl.to(g, {{ opacity: 1, duration: 0.2 }}, {at}); }}')
        s.cue(at, "tick", -11)
    for item in d.get("tags", []):  # sea and region names
        text, lon, lat, at, zoom = item[:5]
        js.append(f'{{ const p = P({lon}, {lat}), e = add("text", {{ x: p[0], y: p[1], "font-size": {24 / zoom:.1f}, "text-anchor": "middle", class: "tag", opacity: 0 }}, {json.dumps(text)});'
                  f' tl.to(e, {{ opacity: 1, duration: 0.3 }}, {at});'
                  + (f' tl.to(e, {{ opacity: 0, duration: 0.3 }}, {item[5]});' if len(item) > 5 else "") + " }")
    for i, item in enumerate(d.get("routes", [])):
        lon1, lat1, lon2, lat2, at, dur, lift = item[:7]
        colour = COLOURS.get(item[7], item[7]) if len(item) > 7 else GOLD
        js.append(f'{{ const a = P({lon1}, {lat1}), b = P({lon2}, {lat2});'
                  f' const e = add("path", {{ d: `M${{a[0]}} ${{a[1]}} Q ${{(a[0] + b[0]) / 2}} ${{(a[1] + b[1]) / 2 - {lift}}} ${{b[0]}} ${{b[1]}}`, class: "route", pathLength: 1, stroke: "{colour}" }});'
                  f' e.style.stroke = "{colour}"; D.draw(tl, e, {at}, {dur}); }}')
        s.cue(at, "whoosh", -18)
    for item in d.get("rings", []):
        lon, lat, at, zoom = item[:4]
        colour = COLOURS.get(item[4], item[4]) if len(item) > 4 else GOLD
        js.append(f'{{ const p = P({lon}, {lat}), e = add("circle", {{ cx: p[0], cy: p[1], r: {70 / zoom:.1f}, fill: "none", stroke: "{colour}", "stroke-width": {3 / zoom:.2f}, opacity: 0 }});'
                  f' tl.fromTo(e, {{ opacity: 0, scale: 0.3, transformOrigin: "50% 50%" }}, {{ opacity: 0.9, scale: 1, duration: 0.5, ease: "power2.out" }}, {at}); }}')
        s.cue(at, "tick", -11)
    js.append("}")
    s.js.append("\n      ".join(js))
    for i, (text, at, until) in enumerate(d.get("big", [])):
        s.html.append(f'<div class="center"><div class="serif bigword" id="{s.id}big{i}">{text}</div></div>')
        s.js.append(f'tl.fromTo("#{s.id}big{i}", {{ opacity: 0, scale: 1.18 }}, {{ opacity: 1, scale: 1, duration: 0.3, ease: "power3.out" }}, {at});')
        s.js.append(f'tl.to("#{s.id}big{i}", {{ opacity: 0, duration: 0.3 }}, {until});')
        s.cue(at, "hit", -9)
    for i, cap in enumerate(d.get("caps", [])):
        s.caption(cap, suffix=str(i))
    s.stamp()
    s.credit()
    s.cue(s.start, "whoosh", -15)


def icon_svg(name: str) -> str:
    """An icon from library/icons, as inline SVG so it takes the text colour."""
    path = LIBRARY / "icons" / f"{name}.svg"
    if not path.is_file():
        raise SceneError(f"no icon called '{name}' in library/icons (see library/icons/LICENCE.md to add one)")
    text = path.read_text(encoding="utf-8")
    return text[text.index("<svg"):].replace('width="24"', "").replace('height="24"', "").replace('class="', 'class="ico ')


def tile(s: Scene, tid: str, icon: str, text: str, big: bool = False) -> str:
    return (f'<div class="tile {"big" if big else ""}" id="{tid}"><div class="disc"><div class="pulse"></div>{icon_svg(icon)}</div>'
            f'<div class="tt">{text}</div></div>')


def tile_in(s: Scene, tid: str, at: float, sound: str = "pop") -> None:
    s.js.append(f'D.popIn(tl, "#{tid}", {at});')
    s.js.append(f'tl.fromTo("#{tid} .pulse", {{ scale: 1, opacity: 0.7 }}, {{ scale: 1.9, opacity: 0, duration: 0.7, ease: "power2.out" }}, {at});')
    s.js.append(f'tl.fromTo("#{tid} svg", {{ rotation: -25, scale: 0.6 }}, {{ rotation: 0, scale: 1, duration: 0.45, ease: "back.out(2)" }}, {at});')
    s.cue(at, sound, -11)


def heading(s: Scene, d: dict) -> str:
    """Small gold label plus an optional short heading, shared by the animated templates."""
    out = f'<div class="label" id="{s.id}l">{d.get("label", "")}</div>'
    s.js.append(f'D.rise(tl, "#{s.id}l", {s.start + 0.1:.2f});')
    if d.get("head"):
        text, at = (d["head"], s.start + 0.2) if isinstance(d["head"], str) else d["head"]
        out += f'<div class="head serif" id="{s.id}hd">{text}</div>'
        s.js.append(f'D.rise(tl, "#{s.id}hd", {at}, 0.4, 24);')
    return out


def t_icons(s: Scene, d: dict, sizes) -> None:
    """A row of icons with one or two words each: the replacement for sentences on screen."""
    s.html.append(s.backdrop())
    tiles = d["tiles"]
    big = len(tiles) <= 3
    joiner = d.get("join", "")
    parts = []
    for i, (icon, text, at) in enumerate(tiles):
        if i and joiner:
            parts.append(f'<div class="joiner tj" id="{s.id}j{i}">{joiner}</div>')
            s.js.append(f'tl.to("#{s.id}j{i}", {{ opacity: 1, duration: 0.2 }}, {at - 0.15:.2f});')
        parts.append(tile(s, f"{s.id}t{i}", icon, text, big))
        tile_in(s, f"{s.id}t{i}", at)
    under = ""
    if d.get("under"):
        under = f'<div class="line under" id="{s.id}u">{d["under"][0]}</div>'
        s.js.append(f'D.rise(tl, "#{s.id}u", {d["under"][1]});')
        s.cue(d["under"][1], "tick", -12)
    s.html.append(f'<div class="center">{heading(s, d)}<div class="tilerow">{"".join(parts)}</div>{under}</div>')
    s.stamp("right: 240px; top: 170px")


def t_loop(s: Scene, d: dict, sizes) -> None:
    """Steps arranged in a circle with arrows between them and a dot that keeps circling."""
    s.html.append(s.backdrop())
    nodes = d["nodes"]
    n, cx, cy, r = len(nodes), 960, 560, 300
    arcs, boxes = [], []
    for i, (icon, text, at) in enumerate(nodes):
        angle = -90 + i * 360 / n
        x, y = cx + r * math.cos(math.radians(angle)), cy + r * math.sin(math.radians(angle))
        side = "right" if x > cx + 40 else "left" if x < cx - 40 else ("top" if y < cy else "bottom")
        boxes.append(f'<div class="lnode {side}" id="{s.id}n{i}" style="left: {x:.0f}px; top: {y:.0f}px">'
                     f'<div class="disc"><div class="pulse"></div>{icon_svg(icon)}</div><div class="tt">{text}</div></div>')
        tile_in(s, f"{s.id}n{i}", at, "tick")
        # arc from this node to the next one, drawn when the next node appears
        a0, a1 = math.radians(angle + 14), math.radians(angle + 360 / n - 14)
        x0, y0, x1, y1 = cx + r * math.cos(a0), cy + r * math.sin(a0), cx + r * math.cos(a1), cy + r * math.sin(a1)
        when = nodes[(i + 1) % n][2] - 0.35 if i + 1 < n else nodes[-1][2] + 0.5
        arcs.append(f'<path id="{s.id}a{i}" pathLength="1" d="M{x0:.1f} {y0:.1f} A {r} {r} 0 0 1 {x1:.1f} {y1:.1f}" '
                    f'fill="none" stroke="{GOLD}" stroke-width="3" stroke-linecap="round" marker-end="url(#{s.id}arrow)" />')
        s.js.append(f'D.draw(tl, "#{s.id}a{i}", {when:.2f}, 0.45);')
    closed = nodes[-1][2] + 0.95
    spin = max(s.end - closed, 0.1)
    s.html.append(
        f'<svg class="over" viewBox="0 0 1920 1080"><defs><marker id="{s.id}arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">'
        f'<path d="M0 0 L10 5 L0 10 z" fill="{GOLD}" /></marker></defs>{"".join(arcs)}'
        f'<g id="{s.id}orbit" opacity="0"><circle cx="{cx}" cy="{cy - r}" r="9" fill="#fff" /></g></svg>')
    s.js.append(f'tl.set("#{s.id}orbit", {{ opacity: 1, svgOrigin: "{cx} {cy}" }}, {closed:.2f});')
    s.js.append(f'tl.fromTo("#{s.id}orbit", {{ rotation: 0 }}, {{ rotation: {spin * 150:.0f}, duration: {spin:.2f}, ease: "none" }}, {closed:.2f});')
    s.html.append("".join(boxes))
    s.html.append(f'<div class="loopmid" style="left: {cx}px; top: {cy}px"><div class="label">{d.get("label", "")}</div>'
                  f'<div class="serif" id="{s.id}c">{d.get("head", "")}</div></div>')
    s.js.append(f'D.rise(tl, "#{s.id}c", {s.start + 0.2:.2f});')
    s.cue(s.start, "whoosh", -16)
    s.cue(closed, "riser", -18)


def t_spread(s: Scene, d: dict, sizes) -> None:
    """A few sources in the middle, then dots bursting outward: one post reaching many people."""
    s.html.append(s.backdrop())
    burst = d["burst"]
    cx, cy = 960, 520
    dots, lines = [], []
    golden = math.pi * (3 - math.sqrt(5))
    for k in range(90):
        radius = 170 + 620 * math.sqrt((k + 1) / 90)
        x, y = cx + radius * math.cos(k * golden) * 1.25, cy + radius * math.sin(k * golden) * 0.72
        if not (40 < x < 1880 and 40 < y < 1040):
            continue
        dots.append(f'<circle class="sd" cx="{x:.0f}" cy="{y:.0f}" r="{5 + (k % 4)}" fill="{GOLD if k % 5 == 0 else "#f3efe6"}" />')
        if k % 3 == 0:
            lines.append(f'<line class="sl" x1="{cx}" y1="{cy}" x2="{x:.0f}" y2="{y:.0f}" stroke="rgba(232,179,75,0.28)" stroke-width="1.5" />')
    s.html.append(f'<svg class="over" id="{s.id}sv" viewBox="0 0 1920 1080">{"".join(lines)}{"".join(dots)}</svg>')
    s.js.append(f'tl.fromTo("#{s.id}sv .sd", {{ opacity: 0, scale: 0, transformOrigin: "50% 50%" }}, '
                f'{{ opacity: 0.95, scale: 1, duration: 0.5, ease: "back.out(2)", stagger: {{ each: 0.018, from: "start" }} }}, {burst});')
    s.js.append(f'tl.fromTo("#{s.id}sv .sl", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.6, stagger: 0.03 }}, {burst});')
    s.js.append(f'tl.fromTo("#{s.id}sv", {{ scale: 1, transformOrigin: "50% 48%" }}, {{ scale: 1.06, duration: {max(s.end - burst, 0.1):.2f}, ease: "none" }}, {burst});')
    parts = []
    for i, (icon, text, at) in enumerate(d["sources"]):
        parts.append(tile(s, f"{s.id}t{i}", icon, text))
        tile_in(s, f"{s.id}t{i}", at)
    under = ""
    if d.get("under"):
        under = f'<div class="line under plate" id="{s.id}u">{d["under"][0]}</div>'
        s.js.append(f'D.rise(tl, "#{s.id}u", {d["under"][1]});')
    s.html.append(f'<div class="center" style="top: -40px">{heading(s, d)}<div class="tilerow plate">{"".join(parts)}</div>{under}</div>')
    s.cue(burst, "riser", -15)
    s.cue(burst + 1.2, "hit", -12)


def t_timeline(s: Scene, d: dict, sizes) -> None:
    """Dated events appearing along a line."""
    s.html.append(s.backdrop())
    events = d["events"]
    left, right, y = 190, 1730, 580
    step = (right - left) / max(len(events) - 1, 1)
    s.html.append(f'<svg class="over" viewBox="0 0 1920 1080"><path id="{s.id}ln" pathLength="1" d="M{left - 80} {y} L {right + 80} {y}" '
                  f'fill="none" stroke="rgba(243,239,230,0.35)" stroke-width="3" stroke-linecap="round" /></svg>')
    s.js.append(f'D.draw(tl, "#{s.id}ln", {s.start + 0.1:.2f}, {max(events[-1][2] - s.start, 0.6):.2f}, "none");')
    for i, event in enumerate(events):
        date, text, at = event[:3]
        x = left + step * i if len(events) > 1 else 960
        hot = len(event) > 3 and event[3]
        s.html.append(f'<div class="tev {"hot" if hot else ""}" id="{s.id}e{i}" style="left: {x:.0f}px; top: {y}px">'
                      f'<div class="when">{date}</div><div class="dot"></div><div class="what">{text}</div></div>')
        s.js.append(f'D.popIn(tl, "#{s.id}e{i}", {at});')
        s.cue(at, "hit" if hot else "tick", -10 if hot else -11)
    s.html.append(f'<div class="chainhead" style="top: 230px">{heading(s, d)}</div>')
    s.cue(s.start, "whoosh", -16)


def t_collage(s: Scene, d: dict, sizes) -> None:
    """Two to four photos sliding in as a grid, with one short heading."""
    imgs = d["imgs"]
    grids = {2: [(0, 0, 50, 100), (50, 0, 50, 100)],
             3: [(0, 0, 58, 100), (58, 0, 42, 50), (58, 50, 42, 50)],
             4: [(0, 0, 50, 50), (50, 0, 50, 50), (0, 50, 50, 50), (50, 50, 50, 50)]}
    if len(imgs) not in grids:
        raise SceneError(f"{s.where()}: a collage takes 2, 3 or 4 pictures")
    for i, (item, (x, y, w, h)) in enumerate(zip(imgs, grids[len(imgs)])):
        img, at = item[0], item[1]
        pos = item[2] if len(item) > 2 else "center"
        s.html.append(f'<div class="cell" id="{s.id}c{i}" style="left: {x}%; top: {y}%; width: {w}%; height: {h}%">'
                      f'<img class="grade" id="{s.id}p{i}" src="{s.img(img)}" style="object-position: {pos}" /></div>')
        s.js.append(f'tl.fromTo("#{s.id}c{i}", {{ opacity: 0, scale: 1.08 }}, {{ opacity: 1, scale: 1, duration: 0.35, ease: "power2.out" }}, {at});')
        s.js.append(f'D.drift(tl, "#{s.id}p{i}", {at}, {s.end}, {1.0 if i % 2 else 1.1}, {1.1 if i % 2 else 1.0});')
        s.cue(at, "shutter", -13)
    s.html.append('<div class="shade"></div>')
    s.caption(d.get("cap"))
    s.stamp()
    s.credit()


def t_balance(s: Scene, d: dict, sizes) -> None:
    """A beam scale with one idea on each side; it tips on cue."""
    s.html.append(s.backdrop())
    sides = ""
    for key in ("left", "right"):
        icon, text, at = d[key]
        sides += f'<div class="pan {key}" id="{s.id}{key}">{tile(s, f"{s.id}{key}t", icon, text, True)}</div>'
        tile_in(s, f"{s.id}{key}t", at)
    s.html.append(f'<div class="chainhead" style="top: 150px; right: 110px; text-align: center">{heading(s, d)}</div>'
                  f'<div class="scale"><div class="beam" id="{s.id}beam">{sides}</div><div class="post"></div><div class="foot"></div></div>')
    angle = 0
    for at, degrees in d.get("tilt", []):
        s.js.append(f'tl.fromTo("#{s.id}beam", {{ rotation: {angle} }}, {{ rotation: {degrees}, duration: 0.9, ease: "elastic.out(1, 0.55)" }}, {at});')
        s.js.append(f'tl.fromTo("#{s.id}beam .pan", {{ rotation: {-angle} }}, {{ rotation: {-degrees}, duration: 0.9, ease: "elastic.out(1, 0.55)" }}, {at});')
        s.cue(at, "whoosh", -17)
        angle = degrees
    if d.get("under"):
        s.html.append(f'<div class="center" style="top: auto; bottom: 90px; height: auto"><div class="line under" id="{s.id}u" style="margin: 0">{d["under"][0]}</div></div>')
        s.js.append(f'D.rise(tl, "#{s.id}u", {d["under"][1]});')


# ---------------------------------------------------------------------------
# The speaker's own footage, evidence boards and reconstructions
# ---------------------------------------------------------------------------

CAMERA = "camera.mp4"  # 1080p silent copy of a video recording, in assets/ (see docs/SCENES.md, camera)
INK = "#08080a"  # silhouette colour for reconstruction figures


def camera_clip(s: Scene, style: str = "", pos: str = "50% 40%") -> str:
    """The recording's own picture for this scene's stretch, so lips stay in sync with the voice."""
    s.assets.add(CAMERA)
    return (f'<div class="camwrap" id="{s.id}w" style="{style}"><video class="fill cam" id="{s.id}v" src="assets/{CAMERA}" muted playsinline '
            f'data-start="{s.start}" data-duration="{s.end - s.start:.3f}" data-media-start="{s.start}" style="object-position: {pos}"></video></div>')


def t_camera(s: Scene, d: dict, sizes) -> None:
    """The speaker on camera, with a slow push and optional punch-ins on key words."""
    s.html.append(camera_clip(s, pos=d.get("pos", "50% 40%")))
    z0, z1 = d.get("zoom", [1.0, 1.06])
    s.js.append(f'tl.fromTo("#{s.id}v", {{ scale: {z0} }}, {{ scale: {z1}, duration: {s.end - s.start:.2f}, ease: "sine.inOut", force3D: true }}, {s.start});')
    for at, scale in d.get("punch", []):
        s.js.append(f'tl.to("#{s.id}w", {{ scale: {scale}, duration: 1.1, ease: "sine.inOut", force3D: true }}, {at - 0.35:.2f});')
        s.cue(at, "whoosh", -22)
    s.html.append('<div class="camframe"></div>')
    if d.get("tag"):
        tag = d["tag"]
        s.html.append(f'<div class="camtag" id="{s.id}g"><div class="label">{tag[0]}</div><div class="line">{tag[1]}</div></div>')
        s.js.append(f'D.rise(tl, "#{s.id}g", {tag[2] if len(tag) > 2 else s.start + 0.3});')
        if len(tag) > 3:
            s.js.append(f'tl.to("#{s.id}g", {{ opacity: 0, duration: 0.2 }}, {tag[3]});')
    s.caption(d.get("cap"))
    s.stamp()


def t_split(s: Scene, d: dict, sizes) -> None:
    """Speaker on one half of the screen, a screenshot or photo on the other."""
    cam_left = d.get("side", "left") == "left"
    cam_x, other_x = (0, 960) if cam_left else (960, 0)
    s.html.append(f'<div class="splitbg" style="left: {other_x}px"></div>')
    s.html.append(camera_clip(s, f"left: {cam_x}px; width: 960px", d.get("pos", "50% 35%")))
    s.js.append(f'tl.fromTo("#{s.id}w", {{ xPercent: {-100 if cam_left else 100} }}, {{ xPercent: 0, duration: 0.45, ease: "power3.out" }}, {s.start});')
    s.js.append(f'tl.fromTo("#{s.id}v", {{ scale: 1.02 }}, {{ scale: 1.08, duration: {s.end - s.start:.2f}, ease: "sine.inOut", force3D: true }}, {s.start});')
    at = d.get("at", s.start + 0.35)
    top_room = 230 if d.get("head") else 120
    if d.get("img"):
        w, h = fit_box(*sizes(d["img"]), 820, 1080 - top_room - 130)
        left, top = other_x + (960 - w) // 2, top_room + (1080 - top_room - 80 - h) // 2
        if d.get("chip"):
            s.html.append(f'<div class="chip" id="{s.id}h" style="left: {left}px; top: {top - 40}px; opacity: 0">{d["chip"]}</div>')
            s.js.append(f'tl.to("#{s.id}h", {{ opacity: 1, duration: 0.3 }}, {at});')
        s.html.append(f'<div class="splitcard" id="{s.id}c" style="left: {left}px; top: {top}px; width: {w}px; height: {h}px"><img src="{s.img(d["img"])}" /></div>')
        s.js.append(f'tl.fromTo("#{s.id}c", {{ y: 50, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.35, ease: "power3.out" }}, {at});')
        s.js.append(f'tl.fromTo("#{s.id}c", {{ scale: 1 }}, {{ scale: 1.04, duration: {max(s.end - at - 0.4, 0.1):.2f}, ease: "none" }}, {at + 0.36:.2f});')
    if d.get("head"):
        label, line = d["head"][0], d["head"][1]
        s.html.append(f'<div class="splithead" id="{s.id}d" style="left: {other_x + 70}px"><div class="label">{label}</div><div class="line">{line}</div></div>')
        s.js.append(f'D.rise(tl, "#{s.id}d", {s.start + 0.25:.2f});')
    s.html.append('<div class="splitline"></div>')
    s.stamp(f"left: {other_x + 230}px; right: auto; top: 720px")
    s.credit()
    s.cue(s.start, "whoosh", -16)


def t_board(s: Scene, d: dict, sizes) -> None:
    """Evidence board: pinned photos and notes joined by red string; the view glides across it."""
    width, height = d.get("size", [2400, 1350])
    pins, strings, centres = [], [], {}
    for i, node in enumerate(d["nodes"]):
        nid, title, sub, x, y, at = node[:6]
        img = node[6] if len(node) > 6 else None
        centres[nid] = (x, y)
        tilt = (i * 37) % 9 - 4
        if img == "?":
            face, kind = '<div class="nophoto">?</div>', ""
        elif img:
            face, kind = f'<img src="{s.img(img)}" />', ""
        else:
            face, kind = "", " note"
        pins.append(f'<div class="pin{kind}" id="{s.id}n{nid}" style="left: {x - 125}px; top: {y - 160}px">'
                    f'<div class="pc" style="transform: rotate({tilt}deg)"><div class="tack"></div>{face}'
                    f'<div class="t">{title}</div><div class="u">{sub}</div></div></div>')
        s.js.append(f'D.popIn(tl, "#{s.id}n{nid}", {at});')
        s.cue(at, "pop", -12)
    for i, (a, b, at) in enumerate(d.get("links", [])):
        if a not in centres or b not in centres:
            raise SceneError(f"{s.where()}: link joins unknown pin '{a}' or '{b}'")
        (x1, y1), (x2, y2) = centres[a], centres[b]
        sag = 0.12 * math.hypot(x2 - x1, y2 - y1)
        strings.append(f'<path id="{s.id}k{i}" pathLength="1" d="M{x1} {y1 - 150} Q {(x1 + x2) / 2:.0f} {(y1 + y2) / 2 - 150 + sag:.0f} {x2} {y2 - 150}" '
                       f'fill="none" stroke="#d6402f" stroke-width="4" stroke-dasharray="1" stroke-dashoffset="1" />')
        s.js.append(f'D.draw(tl, "#{s.id}k{i}", {at}, 0.5);')
        s.cue(at, "tick", -13)
    for i, (nid, text, at) in enumerate(d.get("marks", [])):
        x, y = centres[nid]
        pins.append(f'<div class="pinstamp" id="{s.id}m{i}" style="left: {x - 110}px; top: {y - 40}px">{text}</div>')
        s.js.append(f'tl.fromTo("#{s.id}m{i}", {{ opacity: 0, scale: 1.8 }}, {{ opacity: 1, scale: 1, duration: 0.2, ease: "power4.in" }}, {at});')
        s.cue(at + 0.18, "stamp", -8)
    # strings sit on top of the pins, like real thread
    s.html.append(f'<div class="board" id="{s.id}b" style="width: {width}px; height: {height}px">{"".join(pins)}'
                  f'<svg viewBox="0 0 {width} {height}" width="{width}" height="{height}">{"".join(strings)}</svg></div>')
    cams = d.get("cam") or [[s.start, 0, width / 2, height / 2, min(1920 / width, 1080 / height)]]
    view = lambda c: f"{{ x: {960 - c[2] * c[4]:.0f}, y: {540 - c[3] * c[4]:.0f}, scale: {c[4]} }}"
    s.js.append(f'gsap.set("#{s.id}b", {{ transformOrigin: "0 0" }}); tl.set("#{s.id}b", {view(cams[0])}, {s.start});')
    for c in cams[1:]:
        s.js.append(f'tl.to("#{s.id}b", {{ ...{view(c)}, duration: {c[1]}, ease: "power2.inOut" }}, {c[0]});')
    if d.get("label"):
        s.html.append(f'<div class="boardhead"><div class="label">{d["label"]}</div></div>')
    s.caption(d.get("cap"))
    s.credit()
    s.cue(s.start, "whoosh", -16)


def t_case(s: Scene, d: dict, sizes) -> None:
    """A case-file folder: rows typed in one by one, a photo or a blank, then a red stamp."""
    if d.get("bg"):
        s.html.append(f'<img class="fill casebg" id="{s.id}p" src="{s.img(d["bg"])}" /><div class="redwash"></div>')
        s.js.append(f'D.drift(tl, "#{s.id}p", {s.start}, {s.end}, 1.0, 1.08);')
    else:
        s.html.append(s.backdrop())
    rows = "".join(f'<div class="row" id="{s.id}r{i}"><span class="k">{k}</span><span class="v">{v}</span></div>'
                   for i, (k, v, _) in enumerate(d["rows"]))
    photo = f'<img src="{s.img(d["photo"])}" />' if d.get("photo") else '<div class="q">?</div>'
    s.html.append(f'<div class="folder" id="{s.id}f"><div class="tab">{d.get("no", "CASE FILE")}</div>'
                  f'<div class="rows">{rows}</div><div class="ph">{photo}</div></div>')
    s.js.append(f'tl.fromTo("#{s.id}f", {{ opacity: 0, x: -90 }}, {{ opacity: 1, x: 0, duration: 0.4, ease: "power3.out" }}, {s.start});')
    for i, (_, _, at) in enumerate(d["rows"]):
        s.js.append(f'D.typeOn(tl, "#{s.id}r{i}", {at}, 0.45);')
        s.cue(at, "typing", -17)
    s.stamp("left: 1180px; right: auto; top: 700px")
    s.credit()
    s.cue(s.start, "whoosh", -16)


def recon_tag(s: Scene, text: str = "RECONSTRUCTION · ILLUSTRATIVE") -> None:
    s.html.append(f'<div class="recontag">{text}</div>')


def t_recon(s: Scene, d: dict, sizes) -> None:
    """Silhouette reconstruction: faceless figures act out an attack. Always labelled as a reconstruction."""
    if d.get("bg"):
        s.html.append(f'<img class="fill reconbg" id="{s.id}p" src="{s.img(d["bg"])}" style="object-position: {d.get("pos", "center")}" /><div class="redwash"></div>')
        s.js.append(f'D.drift(tl, "#{s.id}p", {s.start}, {s.end}, 1.04, 1.12);')
    else:
        s.html.append('<div class="fill" style="background: radial-gradient(ellipse at 50% 70%, #3a0d0d, #070708 70%)"></div>')
    ground = d.get("ground", 960)
    # a warm backlight along the horizon so the black figures read against the dark photo
    s.html.append(f'<svg class="over" viewBox="0 0 1920 1080" id="{s.id}s"><defs><radialGradient id="{s.id}glow"><stop offset="0" stop-color="#ff7a45" stop-opacity="0.55" />'
                  f'<stop offset="1" stop-color="#ff7a45" stop-opacity="0" /></radialGradient></defs>'
                  f'<ellipse cx="960" cy="{ground - 120}" rx="1150" ry="420" fill="url(#{s.id}glow)" />'
                  f'<rect y="{ground}" width="1920" height="{1080 - ground}" fill="{INK}" /></svg>'
                  f'<div class="whiteflash" id="{s.id}x"></div>')
    shots = d.get("shots", [])
    js = [f'{{ const v = document.querySelector("#{s.id}s"), c = "{INK}", L = Lab;']
    look = f'{{ skin: c, shirt: c, pants: c, hair: c, face: false }}'
    cartoon = d.get("style", "cartoon") == "cartoon"  # "silhouette" for the older faceless black figures
    if d.get("victim"):
        x0, x1, t0, t1 = d["victim"]
        if cartoon:
            js.append(f'const vic = L.side(v, 0, {ground + 4}, 1.12, {{ jacket: "#4a6fa5", jacketDark: "#3c5a86", pants: "#3b3b45", pantsDark: "#30303a" }});')
        else:
            js.append(f'const vic = L.figure(v, 0, {ground + 4}, 1.12, {{ ...{look}, hairStyle: "{d.get("victim_hair", "short")}" }});')
        js.append(f'L.walk(tl, vic, {t0}, {t1}, {x0}, {x1});' if x0 != x1 else f'tl.set(vic.mover, {{ x: {x0} }}, {s.start});')
        if d.get("fall"):
            js.append(f'tl.to(vic.body, {{ rotation: -84, svgOrigin: "0 0", duration: 0.45, ease: "power2.in" }}, {d["fall"]});')
    for k, (x0, x1, t0, t1) in enumerate(d.get("gunmen", [])):
        flip = "true" if x1 < x0 or d.get("face_left") else "false"
        if cartoon:
            js.append(f'const g{k} = L.side(v, 0, {ground + 4}, 1.18, {{ mask: true, gun: true, flip: {flip} }}); L.raise(tl, g{k}, {s.start}, 0.01);')
        else:
            js.append(f'const g{k} = L.figure(v, 0, {ground + 4}, 1.18, {{ ...{look}, hairStyle: "none", flip: {flip}, onHead: L.acc.hood(c), onHandR: L.acc.gun(c) }});')
        hold = "{ holdR: true }" if cartoon else "{}"
        js.append(f'L.walk(tl, g{k}, {t0}, {t1}, {x0}, {x1}, {hold});' if x0 != x1 else f'tl.set(g{k}.mover, {{ x: {x0} }}, {s.start});')
        if shots:
            # aim only after the walk has put the arms back down, or the walk would undo the aim
            walk_end = t0 + max(1, round((t1 - t0) / 0.25)) * 0.25 + 0.15 if x0 != x1 else s.start
            aim = max(shots[0] - 0.35, walk_end + 0.02)
            js.append(f'L.point(tl, g{k}, {aim:.2f}, {max(0.08, min(0.25, shots[0] - aim - 0.02)):.2f});')
            for at in shots:
                js.append(f'tl.set(g{k}.foreR.querySelector(".flash"), {{ opacity: 1 }}, {at}); tl.set(g{k}.foreR.querySelector(".flash"), {{ opacity: 0 }}, {at + 0.07:.2f});')
    for at in shots:
        js.append(f'tl.fromTo("#{s.id}x", {{ opacity: 0.55 }}, {{ opacity: 0, duration: 0.25, ease: "power2.out", immediateRender: false }}, {at});')
        s.cue(at, "gunshot", -9)
    js.append("}")
    s.js.append(" ".join(js))
    recon_tag(s)
    s.caption(d.get("cap"))
    s.stamp()
    s.credit()
    s.cue(s.start, "drone", -14)


def t_forensic(s: Scene, d: dict, sizes) -> None:
    """Top-down 'forensic' plan: blocks, roads, markers and moving paths; shots as flashing rings. Screen-pixel coordinates."""
    parts = ['<defs><pattern id="%sgrid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0 L0 0 0 60" fill="none" '
             'stroke="rgba(120,190,255,0.09)" stroke-width="1.5" /></pattern></defs><rect width="1920" height="1080" fill="url(#%sgrid)" />' % (s.id, s.id)]
    for x, y, w, h in d.get("roads", []):
        parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="rgba(120,170,220,0.10)" />')
    for x, y, w, h, label in d.get("blocks", []):
        parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="rgba(120,190,255,0.06)" stroke="rgba(140,200,255,0.55)" stroke-width="2.5" />'
                     f'<text class="ftext" x="{x + w / 2}" y="{y + h / 2 + 9}" text-anchor="middle">{label}</text>')
    js = []
    for i, (kind, x, y, rot, label, at) in enumerate(d.get("marks", [])):
        mid = f"{s.id}k{i}"
        if kind == "car":
            shape = ('<rect x="-62" y="-28" width="124" height="56" rx="14" fill="#e8b34b" /><rect x="-20" y="-22" width="34" height="44" rx="6" fill="#3b2a12" />')
        elif kind == "x":
            shape = '<path d="M-18 -18 L18 18 M18 -18 L-18 18" stroke="#d6402f" stroke-width="7" stroke-linecap="round" />'
        else:
            shape = '<circle r="14" fill="#e8b34b" /><circle r="26" fill="none" stroke="#e8b34b" stroke-width="2" opacity="0.6" />'
        parts.append(f'<g transform="translate({x},{y}) rotate({rot})"><g id="{mid}">{shape}</g></g>'
                     f'<text class="ftext lab" id="{mid}t" x="{x}" y="{y - 46}" text-anchor="middle">{label}</text>')
        js.append(f'tl.fromTo(["#{mid}", "#{mid}t"], {{ opacity: 0 }}, {{ opacity: 1, duration: 0.3 }}, {at});')
        s.cue(at, "tick", -13)
    for i, (pts, t0, t1, color, label) in enumerate(d.get("paths", [])):
        pid = f"{s.id}q{i}"
        coords = [[float(v) for v in p.split(",")] for p in pts.split()]
        d_attr = "M" + " L".join(f"{x:.0f} {y:.0f}" for x, y in coords)
        parts.append(f'<path id="{pid}l" pathLength="1" d="{d_attr}" fill="none" stroke="{color}" stroke-width="3" stroke-dasharray="1" stroke-dashoffset="1" opacity="0.7" />'
                     f'<g id="{pid}"><circle r="13" fill="{color}" /><circle r="24" fill="none" stroke="{color}" stroke-width="2" /></g>'
                     f'<text class="ftext lab" id="{pid}t" x="{coords[0][0]}" y="{coords[0][1] - 36}" text-anchor="middle" fill="{color}">{label}</text>')
        js.append(f'tl.set("#{pid}", {{ x: {coords[0][0]}, y: {coords[0][1]} }}, {s.start}); tl.fromTo(["#{pid}", "#{pid}t"], {{ opacity: 0 }}, {{ opacity: 1, duration: 0.25 }}, {t0 - 0.25:.2f});')
        js.append(f'D.draw(tl, "#{pid}l", {t0}, {t1 - t0:.2f}, "none");')
        lengths = [math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(coords, coords[1:])]
        at = t0
        for (x, y), seg in zip(coords[1:], lengths):
            dur = (t1 - t0) * seg / (sum(lengths) or 1)
            js.append(f'tl.to("#{pid}", {{ x: {x}, y: {y}, duration: {dur:.2f}, ease: "none" }}, {at:.2f});')
            at += dur
        js.append(f'tl.to("#{pid}t", {{ opacity: 0, duration: 0.2 }}, {t0 + 0.6:.2f});')
    for i, (at, x, y) in enumerate(d.get("shots", [])):
        rid = f"{s.id}r{i}"
        parts.append(f'<circle id="{rid}" cx="{x}" cy="{y}" r="30" fill="none" stroke="#ff5a3c" stroke-width="5" opacity="0" />'
                     f'<circle id="{rid}f" cx="{x}" cy="{y}" r="16" fill="#ffd27a" opacity="0" />')
        js.append(f'tl.fromTo("#{rid}", {{ opacity: 1, scale: 0.4, svgOrigin: "{x} {y}" }}, {{ opacity: 0, scale: 3, svgOrigin: "{x} {y}", duration: 0.6, ease: "power2.out", immediateRender: false }}, {at});')
        js.append(f'tl.fromTo("#{rid}f", {{ opacity: 1 }}, {{ opacity: 0, duration: 0.12, immediateRender: false }}, {at});')
        s.cue(at, "gunshot", -10)
    s.html.append(f'<div class="forensic"></div><svg class="over" viewBox="0 0 1920 1080">{"".join(parts)}</svg>')
    if d.get("label"):
        s.html.append(f'<div class="boardhead" style="top: 128px"><div class="label">{d["label"]}</div></div>')
    if d.get("clock"):
        s.html.append(f'<div class="fclock">{d["clock"]}</div>')
    s.js.extend(js)
    recon_tag(s)
    s.caption(d.get("cap"))
    s.stamp()
    s.cue(s.start, "static", -18)


def t_comic(s: Scene, d: dict, sizes) -> None:
    """Noir motion-comic: panels arrive one after another, each a high-contrast photo and/or a drawn scene, with a caption box."""
    paper = " paper" if d.get("paper") else ""  # warm cream page and duotone pictures instead of the dark noir page
    s.html.append(f'<div class="comicpage{paper}"></div>')
    for i, p in enumerate(d["panels"]):
        pid, (x, y, w, h), at = f"{s.id}c{i}", p["box"], p["at"]
        inner = f'<img src="{s.img(p["img"])}" style="object-position: {p.get("pos", "center")}" />' if p.get("img") else ""
        art = f'<svg viewBox="0 0 {w} {h}" id="{pid}a"></svg>' if p.get("art") else ""
        if p.get("sprite"):  # a cut-out character (transparent PNG) that walks in from the right and fires
            sp = p["sprite"]
            art += f'<img class="sprite" id="{pid}g" src="{s.img(sp["img"])}" style="height: {sp["h"]}px; bottom: {sp.get("bottom", 60)}px" />'
        box = f'<div class="pbox" id="{pid}b">{p["text"]}</div>' if p.get("text") else ""
        word = f'<div class="pword" id="{pid}w">{p["word"]}</div>' if p.get("word") else ""
        red = " red" if p.get("red") else ""
        s.html.append(f'<div class="panel{red}{paper}" id="{pid}" style="left: {x}px; top: {y}px; width: {w}px; height: {h}px">'
                      f'<div class="pin2" id="{pid}i">{inner}<div class="ht"></div>{art}</div>{box}{word}</div>')
        s.js.append(f'tl.fromTo("#{pid}", {{ opacity: 0, x: 70, rotation: 1.5 }}, {{ opacity: 1, x: 0, rotation: 0, duration: 0.35, ease: "power3.out" }}, {at});')
        s.js.append(f'tl.fromTo("#{pid}i", {{ scale: 1 }}, {{ scale: 1.1, duration: {max(s.end - at, 0.5):.2f}, ease: "none" }}, {at});')
        if p.get("art"):
            s.js.append(f'Case.art(tl, "#{pid}a", "{p["art"]}", {w}, {h}, {at}, {s.end});')
        if box:
            s.js.append(f'D.rise(tl, "#{pid}b", {at + 0.25:.2f}, 0.3, 10);')
        if word:
            wat = p.get("word_at", at + 0.3)
            s.js.append(f'tl.fromTo("#{pid}w", {{ opacity: 0, scale: 0.3 }}, {{ opacity: 1, scale: 1, duration: 0.22, ease: "back.out(2.5)" }}, {wat});')
        if p.get("sprite"):
            sp, g = p["sprite"], f"#{pid}g"
            x0, x1, t0, t1 = sp["from"], sp["to"], sp["walk"][0], sp["walk"][1]
            s.js.append(f'tl.set("{g}", {{ x: {x0}, transformOrigin: "50% 100%" }}, {at});')
            s.js.append(f'tl.to("{g}", {{ x: {x1}, duration: {t1 - t0:.2f}, ease: "none" }}, {t0});')
            steps = int((t1 - t0) / 0.32)
            for k in range(steps):  # a bob and a lean on every stride, so it walks instead of sliding
                s.js.append(f'tl.fromTo("{g}", {{ y: 0, rotation: -2 }}, {{ y: -16, rotation: 2, duration: 0.16, ease: "sine.out" }}, {t0 + k * 0.32:.2f});')
                s.js.append(f'tl.to("{g}", {{ y: 0, rotation: -2, duration: 0.16, ease: "sine.in" }}, {t0 + k * 0.32 + 0.16:.2f});')
            s.js.append(f'tl.to("{g}", {{ rotation: 0, y: 0, duration: 0.15 }}, {t0 + steps * 0.32:.2f});')
            for sh in sp.get("shots", []):
                s.js.append(f'tl.fromTo("{g}", {{ rotation: 0, scale: 1 }}, {{ rotation: -5, scale: 1.05, duration: 0.05, yoyo: true, repeat: 1 }}, {sh});')
        if p.get("hide"):
            s.js.append(f'tl.to("#{pid}", {{ opacity: 0, duration: 0.2 }}, {p["hide"]});')
        s.cue(at, "whoosh", -17)
    for at in d.get("shots", []):
        s.cue(at, "gunshot", -9)
    for at, name, level in d.get("sfx", []):
        s.cue(at, name, level)
    ids = [f"#{s.id}c{i}" for i in range(len(d["panels"]))]
    for at in d.get("shake", []):  # a quick jolt of the whole page on a gunshot
        for pid in ids:
            s.js.append(f'tl.to("{pid}", {{ keyframes: [{{ x: 14, y: -9, duration: 0.04 }}, {{ x: -11, y: 7, duration: 0.04 }}, {{ x: 6, y: -4, duration: 0.04 }}, {{ x: 0, y: 0, duration: 0.05 }}] }}, {at});')
    if d.get("flashes"):
        s.html.append(f'<div class="whiteflash" id="{s.id}fl"></div>')
        for at in d["flashes"]:
            s.js.append(f'tl.fromTo("#{s.id}fl", {{ opacity: 0.85 }}, {{ opacity: 0, duration: 0.3, ease: "power2.out" }}, {at});')
    s.credit()


TEMPLATES = {"framed": t_framed, "toon": t_toon, "clip": t_clip, "art": t_art, "photo": t_photo, "card": t_card, "list": t_list, "number": t_number, "title": t_title, "pills": t_pills,
             "person": t_person, "chain": t_chain, "words": t_words, "network": t_network, "map": t_map,
             "icons": t_icons, "loop": t_loop, "spread": t_spread, "timeline": t_timeline, "collage": t_collage,
             "balance": t_balance, "camera": t_camera, "split": t_split, "board": t_board, "case": t_case,
             "recon": t_recon, "forensic": t_forensic, "comic": t_comic}

PAGE = """<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="gsap.min.js"></script>
    <link rel="stylesheet" href="doc.css" />
    <link rel="stylesheet" href="casefile.css" />
    <script src="assets/south_asia.js"></script>
    <script src="doc.js"></script>
    <script src="figures.js"></script>
    <script src="toon.js"></script>
    <script src="casefile.js"></script>
  </head>
  <body>
    <!-- Generated by scripts/build_video.py from scenes.json. Edit scenes.json, not this file. -->
    <div id="root" class="{theme}" data-composition-id="main" data-start="0" data-duration="{total}" data-width="1920" data-height="1080">
{scenes}
      <div id="vignette"></div>{grain}
    </div>
    <script>
      const tl = gsap.timeline({{ paused: true }});
      const D = Doc;
{script}
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
"""


# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------


HYPERFRAMES_VERSION = "0.8.148"  # the version this project was built and tested with


def project_files(name: str) -> dict:
    """The three small files HyperFrames expects in a project folder."""
    run = f"npx --yes hyperframes@{HYPERFRAMES_VERSION}"
    return {
        "hyperframes.json": {"$schema": "https://hyperframes.heygen.com/schema/hyperframes.json",
                             "registry": "https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry",
                             "paths": {"blocks": "compositions", "components": "compositions/components", "assets": "assets"},
                             "media": {"autoProxy": True}},
        "package.json": {"name": name, "private": True, "type": "module",
                         "scripts": {"dev": f"{run} preview", "check": f"{run} check", "render": f"{run} render"}},
        "meta.json": {"id": name, "name": name},
    }


def make_blur(source: Path, target: Path) -> None:
    from PIL import Image, ImageEnhance, ImageFilter

    small = Image.open(source).convert("RGB").resize((480, 270)).filter(ImageFilter.GaussianBlur(14))
    dark = ImageEnhance.Brightness(ImageEnhance.Color(small).enhance(0.5)).enhance(0.32)
    dark.resize((1920, 1080), Image.BICUBIC).save(target, quality=88)


def build(video_dir: Path) -> dict:
    from PIL import Image

    plan_path = video_dir / "scenes.json"
    if not plan_path.exists():
        raise FileNotFoundError(f"scenes file not found: {plan_path}")
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    scenes, total = plan["scenes"], float(plan["duration"])
    validate(scenes, total)
    source_dir = video_dir / "assets"

    def sizes(name: str) -> tuple[int, int]:
        path = source_dir / name
        if not path.is_file():
            raise SceneError(f"picture not found: {path}")
        with Image.open(path) as im:
            return im.size

    ends = scene_ends([float(sc["t"]) for sc in scenes], total)
    built = []
    for index, (data, end) in enumerate(zip(scenes, ends)):
        scene = Scene(index, data, end)
        scene.js.append(f'D.scene(tl, "#{scene.id}", {scene.start}, {end});')
        TEMPLATES[data["type"]](scene, data, sizes)
        for cue in data.get("sfx") or []:
            scene.cues.append(cue)
        built.append(scene)

    hf = video_dir / "hf"
    (hf / "assets" / "fonts").mkdir(parents=True, exist_ok=True)
    for name in ("doc.css", "doc.js", "casefile.css", "casefile.js", "figures.js", "toon.js", "gsap.min.js"):  # GSAP kept locally so renders work offline
        shutil.copyfile(LIBRARY / "templates" / name, hf / name)
    if any(CAMERA in sc.assets for sc in built) and not (source_dir / CAMERA).is_file():
        raise SceneError(f"camera footage not found: {source_dir / CAMERA}. Make it with: ffmpeg -i <recording> "
                         f'-vf "scale=1920:1080,format=yuv420p" -c:v libx264 -crf 21 -g 30 -an {source_dir / CAMERA}')
    for font in (LIBRARY / "fonts").glob("*.ttf"):
        shutil.copyfile(font, hf / "assets" / "fonts" / font.name)
    map_path = LIBRARY / "maps" / f"{plan.get('map', 'south_asia')}.json"
    if not map_path.is_file():
        raise SceneError(f"map not found: {map_path}. Make it with scripts/make_map.py")
    map_json = map_path.read_text(encoding="utf-8")
    (hf / "assets" / "south_asia.js").write_text(f"window.MAP = {map_json};\n", encoding="utf-8")
    for name in sorted({a for sc in built for a in sc.assets}):
        if not (source_dir / name).is_file():
            raise SceneError(f"picture not found: {source_dir / name}")
        shutil.copyfile(source_dir / name, hf / "assets" / name)
    for name in sorted({b for sc in built for b in sc.blurs}):
        if not (source_dir / name).is_file():
            raise SceneError(f"backdrop picture not found: {source_dir / name}")
        make_blur(source_dir / name, hf / "assets" / f"blur_{Path(name).stem}.jpg")
    for name, content in project_files(video_dir.name).items():
        if not (hf / name).exists():
            (hf / name).write_text(json.dumps(content, indent=2) + "\n", encoding="utf-8")

    blocks, script = [], []
    for sc in built:
        note = html.escape(str(sc.data.get("say", "")))
        blocks.append(f'      <!-- {sc.start}s {sc.data["type"]}: {note} -->\n      <div class="scene" id="{sc.id}">\n        '
                      + "\n        ".join(sc.html) + "\n      </div>")
        script.append(f"      // {sc.start}s {sc.data['type']}\n      " + "\n      ".join(sc.js))
    theme = plan.get("theme", "")
    grain = '\n      <div id="grain"></div>' if theme == "casefile" else ""
    (hf / "index.html").write_text(PAGE.format(total=total, theme=theme, grain=grain, scenes="\n".join(blocks), script="\n".join(script)),
                                   encoding="utf-8")

    cues = sorted(c for sc in built for c in sc.cues)
    sound = {"voice": {"file": plan["voice"], "start": 0.0, "end": total}, "music": plan.get("music", []),
             "sfx_dir": "library/sfx", "cues": cues}
    (video_dir / "sound.json").write_text(json.dumps(sound, ensure_ascii=False, indent=1), encoding="utf-8")
    return {"scenes": len(built), "seconds": total, "sound_cues": len(cues), "project": str(hf)}


def main(argv: list[str] | None = None) -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    parser = argparse.ArgumentParser(description="Build the HyperFrames project and sound plan for one video.")
    parser.add_argument("video_dir", type=Path, help="the video's folder, e.g. videos/2026-10-pilot")
    args = parser.parse_args(argv)
    try:
        result = build(args.video_dir.resolve())
    except (FileNotFoundError, SceneError) as exc:
        log.error("%s", exc)
        return 1
    except json.JSONDecodeError as exc:
        log.error("scenes.json is not valid JSON: %s", exc)
        return 1
    log.info("done: %s", result)
    return 0


if __name__ == "__main__":
    sys.exit(main())
