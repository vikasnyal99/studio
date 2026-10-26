# Scenes reference

`videos/<name>/scenes.json` is the storyboard. `scripts/new_video.py` creates
it with the voice, duration, map and one music bed filled in; you add the
`scenes` list. A complete real example (82 scenes, 9 min 41 s) is
`docs/example_scenes.json`; grep it for a type rather than reading it whole:

    grep -m2 '"type": "map"' docs/example_scenes.json

## File layout

```json
{
 "voice": "videos/<name>/voice/original.mp3",
 "duration": 580.9,
 "map": "south_asia",
 "music": [
  {"file": "library/music/Interloper.mp3", "from": 0, "to": 106, "below_voice_db": 19},
  {"file": "library/music/Crypto.mp3", "from": 104.9, "to": 580.9, "start": 20, "below_voice_db": 19, "fade_out": 4}
 ],
 "scenes": [ {"t": 0, "type": "...", "say": "..."}, ... ]
}
```

- Music beds overlap by about a second to cross-fade. `start` skips into the
  track. A track shorter than its slot loops.
- Put one scene per line so the file stays easy to edit.

## Every scene

| Key | Meaning |
|---|---|
| `t` | Narration second the scene starts. It runs until the next scene's `t`. The first must be 0. |
| `type` | One of the types below |
| `say` | A few words of what is being said then. For humans; not shown. |
| `bg` | Text-type scenes only: picture in `assets/` to blur behind the text |
| `quiet` | `true` removes the scene's built-in sound effects |
| `sfx` | Extra cues: `[[second, name, dB], ...]`. Names: whoosh, pop, click, tick, hit, riser, typing, shutter, swell, stamp |

Times inside a scene (`at` values) are narration seconds too, not offsets.
Text accepts `<b>...</b>` (gold) and `<br />`. Pictures are file names in
`videos/<name>/assets/`.

## Types

### photo: full-screen photo, slow move
```json
{"t": 9.2, "type": "photo", "say": "log sadkon par", "img": "protest_crowd.jpg", "move": "out", "cap": ["Colombo · 13 April 2022", "Log <b>sadkon par</b> aa gaye", 9.45], "credit": "Photo: AntanO / Wikimedia Commons · CC BY-SA 4.0"}
```
`cap` is [label, line, appears at]. `move`: `in` (default) or `out`.
`pos`: CSS object-position when the subject is off-centre, e.g. `"center 30%"`.
`stamp`: ["RESIGNED", "9 SEPTEMBER 2025", at]. Always give `credit` (the line
`find_photos.py` printed).

### card: article screenshot
```json
{"t": 2.9, "type": "card", "say": "economic crisis", "img": "shot_crisis.png", "chip": "The Kathmandu Post · 1 April 2022", "marks": [[2.4, 13.6, 32, 6.6, 3.4]]}
```
`chip` is the outlet and date shown above the card. `marks` are highlight
sweeps: [left %, top %, width %, height %, at] of the picture; only add one
when you have measured it on the capture grid, otherwise leave it out. With
`cap` the card moves right and the caption sits on the left. `bg` as above.

### list: points on the left, evidence on the right
```json
{"t": 4.8, "type": "list", "label": "Sri Lanka · 2022", "items": [["Fuel <b>nahi</b>", 4.8], ["Food <b>shortage</b>", 5.8]], "cards": [["shot_fuel.png", "Arab News · 27 June 2022", 4.8], ["crisis.jpg", "Cooking-gas queue, Colombo · May 2022", 5.8, "photo"]]}
```
Each card is [picture, chip, at]; add `"photo"` for a photo rather than a
screenshot. Up to four items.

### number: counter
```json
{"t": 7.6, "type": "number", "label": "Inflation · September 2022", "to": 69.8, "dec": 1, "suffix": "%", "dur": 0.95, "line": "Inflation <b>sky high</b>", "credit": "Colombo Consumer Price Index · Dept. of Census and Statistics"}
```
Also `prefix`. Always give the source in `credit`.

### title: serif title
```json
{"t": 10.8, "type": "title", "img": "demo.jpg", "label": "The movement", "title": "Aragalaya", "size": 190, "at": 12.05, "dur": 0.85, "sub": ["Sinhala for <b>“The Struggle”</b>", 13.7], "credit": "Photo: ..."}
```
Without `img` it sits on the blurred `bg`. `size`: 190 for one word, about
100 for a short question, 82 for a sentence. `"pop": true` makes it snap in
instead of typing.

### pills: keywords popping in
```json
{"t": 86.4, "type": "pills", "bg": "np_3.jpg", "label": "Focus sirf social media ban nahi raha", "pills": [["Corruption", 90.1], ["Governance", 92.0]], "under": ["Sab <b>ek movement</b> mein combine", 94.4], "width": 1500}
```
`join`: text between pills, e.g. `"+"`, `"→"`, `"ya"`. `width` narrows the
row so long pills wrap sooner.

### person: portrait with name
```json
{"t": 61.1, "type": "person", "bg": "bd_4.jpg", "img": "hasina.jpg", "name": "Sheikh Hasina", "role": "Prime Minister of Bangladesh, 2009–2024", "at": 61.4, "cap": ["5 August 2024", "Prime Minister ki <b>post chhodi</b>", 63.0], "stamp": ["RESIGNED", "5 AUGUST 2024", 64.6], "credit": "Photo: ..."}
```
`at` is when the portrait slides in. `pos` as for photo.

### chain: numbered steps lighting up
```json
{"t": 37.2, "type": "chain", "label": "Sri Lanka · the sequence", "nodes": [["Economic crisis", 38.1], ["Mass protest", 39.7], ["President out", 42.1]]}
```
Two to four nodes. The last is gold unless `"last_gold": false`.

### words: lines of text on a blurred photo
```json
{"t": 117.1, "type": "words", "label": "Lekin ek cheez samajhna zaroori hai", "lines": [["Government change ke baad", 119.2], ["<b>geopolitical game</b> reset ho jaata hai", 120.5]]}
```
`size` (default 62). With `img` instead of `bg` the photo stays sharp but
dimmed. Avoid this type: the user does not want sentences on screen. Use
`icons`, `collage`, `timeline`, `balance`, `loop` or a `map` instead.

### network: boxes joined by lines
```json
{"t": 434.3, "type": "network", "label": "To picture dekhiye", "nodes": [["cjp", "CJP", "Cockroach Janta Party", 960, 300, 434.5], ["f", "CJP founder", "Past AAP association", 400, 540, 435.4, "dipke.jpg"]], "links": [["cjp", "f", 435.6]]}
```
Node: [id, title, small text, x, y, at, optional face picture]. x and y are
the box centre on the 1920x1080 frame. Keep to five nodes.

### icons: icons with one or two words each
```json
{"t": 86.4, "type": "icons", "bg": "np_3.jpg", "label": "Ban se aage", "tiles": [["banknote", "Corruption", 90.1], ["landmark", "Establishment", 90.8], ["scale", "Governance", 92.0]], "under": ["<b>Ek movement</b>", 94.4]}
```
Tile: [icon name, words, at]. Use this where you would otherwise write a
sentence. `head`: a short serif heading, either text or [text, at]. `join`:
`"+"`, `"→"` between tiles. `stamp` as elsewhere. Two or three tiles are
drawn larger. Icon names are the files in `library/icons/` (run
`ls library/icons`); `library/icons/LICENCE.md` says how to add more.

### loop: a cycle
```json
{"t": 496.6, "type": "loop", "label": "Creator + audience", "head": "Feedback loop", "nodes": [["thumbs-up", "Narrative pasand", 500.5], ["video", "Aur content", 503.7], ["trending-up", "Viral", 506.1], ["users", "Audience consolidate", 507.4]]}
```
Three to five nodes round a circle; arrows draw between them and a dot keeps
circling once the loop closes.

### spread: one thing reaching many
```json
{"t": 525.1, "type": "spread", "label": "Digital distribution network", "sources": [["video", "Ek video", 527.9], ["film", "Ek reel", 529.8]], "burst": 530.5, "under": ["<b>Millions</b> tak", 531.7]}
```
Sources appear in the middle; at `burst` dots fly outward across the frame.

### timeline: dated events along a line
```json
{"t": 341.4, "type": "timeline", "label": "CJP · 2026", "head": ["Story khatam nahi hui", 345.6], "events": [["16 May", "CJP founded", 341.6], ["25 July", "Minister resigns", 343.8], ["October", "SIR protests", 346.0, true]]}
```
Event: [date, two or three words, at, optional `true` to mark it gold].
Three to five events. Only dates you have verified.

### collage: two to four photos
```json
{"t": 270.4, "type": "collage", "imgs": [["cjp_1.jpg", 270.4], ["cjp_4.jpg", 271.6], ["cjp_6.jpg", 273.0]], "cap": ["Jantar Mantar, Delhi · July 2026", "Massive <b>movement</b>", 271.2], "credit": "Photos: ... / Wikimedia Commons · CC BY-SA 4.0"}
```
Image: [picture, at, optional object-position]. Pictures arrive one by one,
so one collage can cover several beats of narration. Credit every author.

### balance: two ideas on a scale
```json
{"t": 547.4, "type": "balance", "label": "Opposition ka challenge", "left": ["vote", "Elections", 550.5], "right": ["megaphone", "Street mobilization", 554.9], "tilt": [[552.3, -5], [555.6, 9]], "under": ["Alternative <b>pressure mechanism</b>", 556.3]}
```
Each side: [icon, words, at]. `tilt`: [[at, degrees]]; negative tips to the
left side, positive to the right.

### map: one map, moving camera
```json
{"t": 31.3, "type": "map", "cam": [[31.3, 0, 81.6, 6.3, 1.05], [31.3, 5.9, 88.4, 5.3, 0.72]], "focus": ["LKA"], "pins": [["Colombo", 79.86, 6.93, 31.5, -1, 0.9, "", -34], ["Singapore", 103.82, 1.35, 35.2, -1, 0.72, "14 July", 46]], "routes": [[79.86, 6.93, 73.51, 4.17, 32.9, 0.9, 110]], "caps": [["July 2022", "Rajapaksa <b>country se bahar</b>", 31.9]], "stamp": ["RESIGNED", "14 JULY 2022", 35.85]}
```

| Key | Format |
|---|---|
| `cam` | [[at, seconds, longitude, latitude, zoom], ...]. The first entry is the opening view (its `at` and seconds are ignored); each later entry moves there starting at `at` |
| `focus` | Countries gold from the start, by 3-letter code |
| `light` | [[code, at, colour, until]]: colour is `gold` (default), `blue`, `red`; `until` optional |
| `pins` | [[name, lon, lat, at, side, zoom, small text, drop]]: side 1 = label right of the dot, -1 = left; zoom = the camera zoom when it is read; drop (optional) moves the label down in pixels to clear a route |
| `routes` | [[lon1, lat1, lon2, lat2, at, seconds, lift, colour]]: a line drawn from the first place to the second; lift bends it up (positive) or down |
| `tags` | [[text, lon, lat, at, zoom, until]]: sea and region names in capitals |
| `rings` | [[lon, lat, at, zoom, colour]]: a circle marking an area |
| `caps` | [[label, line, at, until]]: several captions in turn; give `until` on all but the last |
| `big` | [[text, at, until]]: a large word in the centre, e.g. a year |
| `stamp` | [text, small text, at] |

Zoom guide (map `south_asia`, 54 degrees wide): 0.5 shows the whole region,
0.6 India, 1.0 a large country with neighbours, 1.7 to 2.0 Nepal or
Bangladesh filling the frame, 2.7 Sri Lanka. Keep labels away from the
lower-left corner, where captions sit.

Codes on the `south_asia` map: IND, PAK, BGD, NPL, BTN, LKA, MDV, CHN, MMR,
AFG, IRN, THA, MYS, SGP, IDN, VNM, LAO, KHM, plus Gulf and Central Asian
states. For another part of the world make a map once:

    .venv/bin/python scripts/make_map.py --name middle_east --west 25 --east 65 --south 10 --north 43

and set `"map": "middle_east"` at the top of scenes.json.

### camera: the speaker on screen
```json
{"t": 12.0, "type": "camera", "say": "aam murder nahi", "punch": [[13.4, 1.07]], "zoom": [1.0, 1.04], "tag": ["Paramjit Singh Panjwar", "India: <b>designated terrorist</b>", 114.8]}
```
Only for a recording given as video. Make the silent 1080p copy once:
`ffmpeg -i inbox/<file>.mp4 -vf "scale=1920:1080,format=yuv420p" -c:v libx264 -crf 21 -g 30 -an videos/<name>/assets/camera.mp4`.
The picture is cut at the same second as the voice, so lips stay in sync.
`punch`: [[at, scale]] quick zoom-ins on key words. `tag`: [label, line, at, until] lower third. `pos` for framing.
### split: speaker on one half, picture on the other
```json
{"t": 137.7, "type": "split", "side": "left", "img": "shot_gulf_reject.png", "chip": "Gulf News · 19 September 2023", "head": ["India ka jawab", "Sab claims <b>reject</b>"]}
```
`side`: which half the speaker is on. `img` a screenshot (give `chip`) or photo (give `credit`).
### board: evidence board with red string
```json
{"t": 50.3, "type": "board", "label": "File 02 · Network", "nodes": [["b", "Lawrence Bishnoi", "Jail, India", 700, 620, 50.5, "?"], ["ph", "Jail se phone", "US indictment", 700, 1080, 59.5]], "links": [["b", "ph", 59.8]], "marks": [["b", "TARGET", 65.1]], "cam": [[50.3, 0, 700, 620, 1.4], [59.0, 1.0, 850, 860, 1.0]]}
```
Node: [id, title, small text, x, y, at, picture]. Picture `"?"` is a blank (use it for anyone without a free photo);
leave it out for a yellow note. x, y are the pin centre on a 2400x1350 board (`size` to change). `cam`: [[at, seconds, x, y, zoom]],
the first is the opening view. `marks`: red stamps on pins.
### case: case-file folder
```json
{"t": 96.7, "type": "case", "bg": "karachi_night.jpg", "no": "CASE 01 · KARACHI", "rows": [["DATE", "March 2022", 97.0], ["NAME", "Zahoor Mistry Ibrahim", 99.2]], "stamp": ["UNKNOWN", "GUNMEN", 102.3], "credit": "..."}
```
Rows type in one by one. `photo` puts a picture in the folder (else a blank "?").
### recon: silhouette reconstruction
```json
{"t": 103.3, "type": "recon", "bg": "karachi_night.jpg", "victim": [600, 760, 103.3, 104.4], "gunmen": [[1700, 1150, 103.3, 103.95]], "shots": [104.6, 104.85], "fall": 104.9}
```
Faceless figures, always tagged "RECONSTRUCTION · ILLUSTRATIVE". `victim` and each gunman: [x from, x to, walk start, walk end].
End the gunmen's walk at least 0.5 s before the first shot so they can aim. Never show blood; never add details the sources do not give.
### forensic: top-down plan of an incident
```json
{"t": 237.6, "type": "forensic", "label": "Galaxy Apartments · firing", "clock": "14 APRIL 2024 · BANDRA, MUMBAI", "roads": [[0, 570, 1920, 170]], "blocks": [[760, 190, 520, 320, "GALAXY APARTMENTS"]], "marks": [["pin", 1020, 540, 0, "Salman Khan ka ghar", 238.6]], "paths": [["-40,655 600,655 990,645", 242.5, 243.9, "#d6402f", "Bike · 2 log"]], "shots": [[244.3, 1000, 610]]}
```
Screen-pixel coordinates. Mark kinds: `car`, `x`, `pin`. Paths: ["x,y x,y ...", start, end, colour, label]: a dot travels and leaves a trail.
### comic: noir motion-comic panels
```json
{"t": 0, "type": "comic", "panels": [{"at": 0.0, "box": [60, 60, 890, 560], "img": "gurdwara.jpg", "text": "18 June 2023 · Surrey"}, {"at": 8.3, "box": [60, 640, 1180, 380], "art": "gunmen", "text": "Unknown gunmen"}, {"at": 10.4, "box": [1260, 640, 600, 380], "art": "flash", "red": true, "word": "BANG!"}], "shots": [10.55, 10.9]}
```
Panel `box` is [x, y, w, h]. `img` is shown high-contrast black and white; `art`: `car`, `gunmen`, `flash` (drawn).
`hide`: when a panel leaves. `shots` adds muffled gunshot sounds.

The case-file look: put `"theme": "casefile"` at the top of scenes.json (red accents, film grain).
Sound effects also include gunshot (muffled), drone, heartbeat, static, buzz.

### art: an illustration pushing in slowly
```json
{"t": 263.2, "type": "art", "img": "drawing.jpg", "chip": "Illustration · not a real photo", "shots": [264.2]}
```
For drawings only (never pass one off as a photo). Slow push, slight sway, chip always shown.

### toon: 2D cartoon story animation (library/templates/toon.js)
```json
{"t": 6.3, "type": "toon", "kind": "crowd", "mood": "dusk", "n": 26, "sign": "ASOLA · FATEHPUR BERI", "big": "Hazaaron", "big_at": 3.6, "cap": ["Kuch ghanton mein", "Pura area <b>jam</b>", 6.8, 9.6]}
```
`kind`: `phone` (figure reacts to a phone feed with a BREAKING banner; `banner`, `sub`, `posts`), `crowd` (small figures walk to a
sign; `n`, `sign`, `big`), `travel` (dashed routes and moving dots to a destination; `dest_name`, `origins`: [[name, x, y, "200 km"]]),
`lift` (side-view bench press with a loaded bar and a kg counter; `to`, `reps`, `label`), `fight` (one strong figure, small
attackers knocked away with POW words, no blood; `n`, `big`), `candle` (candle, bowed figures; `line`). `mood`: day, dusk, night, gym.
`sfx`: [[at, "hit", -12]] adds sounds (a fight's hit times are `t + 0.5 + i*0.28 + 1.35 + (i>>1)*0.55`).
### clip: a video clip full screen
```json
{"t": 24.5, "type": "clip", "clip": "neeraj_bench.mp4", "from": 6, "zoom": 1.06, "cap": ["Gym footage", "Bench press", 25.0, 30.6], "credit": "Video: MT Studio / YouTube"}
```
Cut clips first: `ffmpeg -ss 62 -t 20 -i src.mp4 -vf "fps=30,scale=1920:1080:flags=lanczos,format=yuv420p" -c:v libx264 -crf 18 -an V/assets/name.mp4`.
`from` is seconds into the clip.

### Extras learned on the Bishnoi video (18 Oct 2026)
- `comic` panel: `"art": "stage"` is the gunmen backdrop without figures; `"sprite": {"img": "x.png", "h": 400, "from": 1250, "to": 560, "walk": [8.3, 10.0], "shots": [...]}`
  walks a transparent PNG across it (make one with `scripts/prep_image.py ... --cutout`). The user preferred the original
  silhouette `"art": "gunmen"`; use sprites only if asked.
- `comic` scene: `"shake": [times]` jolts every panel on a gunshot, `"flashes": [times]` white flash.
- `board` node 7th value and `case` `"photo"` take a picture file; `"?"` / no photo shows a blank card. Use `"?"` only when no picture exists.
- `split` needs no `chip`/`head`; speaker `side` left or right. Use it where a scene runs long or the screen is quiet.
- `quiet: true` on a scene silences its effects. `loud: true` keeps whooshes in it (see STYLE.md, Sound).
- The recording as video: make `assets/camera.mp4` with
  `ffmpeg -i inbox/<file>.mp4 -vf "fps=30,format=yuv420p" -c:v libx264 -crf 18 -g 30 -an V/assets/camera.mp4`
  (keeps 4K; 1080p is fine too). The render itself is 1080p either way.
- `"resolution": "1080p"` (default). `"4k"` crashed after ~4 h on this laptop (no GPU, software Chrome); do not use it.

### Proof shots from animation-studio (24 Oct 2026)
Fact-check graphics are rendered by animation-studio (`proof-shots` skill) from `V/proofs.json` into `assets/p_*.mp4` and
placed as `clip` scenes with `"from": 0, "zoom": 1.0`. Clip scenes are silent: to hear the other side, splice their audio into
the narration with `scripts/pick_takes.py cut` (`src` pieces) and lay the matching `claim` shot over it.

## Not built yet

- Burned-in subtitles. Upload `timing/subtitles_hi.srt` to YouTube instead.
