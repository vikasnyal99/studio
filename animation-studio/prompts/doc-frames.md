# Documentary keyframes (AniDoc-style method)

How one picture becomes several shots, and how to spend the few free ChatGPT images.
Check what is left first: `npm run -s quota` (accounts, generations left, blocked until).

## Budget rules

- 1 generation = 1 keyframe (hero shot, sharp) or 1 grid (4 inserts, softer: each panel is ~760x506 and upscaled).
- Use single keyframes for faces, close-ups and the shots that stay on screen longest; use grids for wides, inserts, objects, crowds.
- Get 2-3 shots out of every keyframe in the edit: the wide (push), then a crop on a face or a hand (`z` 1.6-2.2 + `focus`), then a
  slow pan to the other side. Only do the close crop on single keyframes (grid panels go soft).
- Reuse: a location plate serves every scene in that place; a cast close-up serves every "who is this" label.
- Rough need: 60-90 s insert for another project ≈ 3-5 generations. 12-15 min documentary ≈ 110-130 shots ≈ 40-55 generations
  (≈ 10-14 account-days on free accounts at 4 a day). Plan which chapters to make first.

## Prompt order for one video (same ChatGPT chat per account, so faces stay the same)

1. Cast sheets for the 2-4 main people (one generation each; reuse forever from `assets/refs/<name>_doc.png`).
2. Hook frames (the climax moment, 3-4 keyframes) — the first 30 s decide retention.
3. Chapter by chapter: a location plate or wide, then the keyframes, then a grid of inserts (hands, objects, papers, phones, cars).

## Keyframe prompt (fill [..])

```
[STYLE LOCK DOC]
[FRAME: camera]
Scene: [place, era, time of day, light source]. [PERSON A: one-line look from the cast sheet] is [one clear action, mid-motion pose].
[PERSON B ...]. Mood: [tense / quiet / triumphant]. Story beat: "[the narration line this shot sits under]".
```

## Grid prompt (fill [..])

```
[STYLE LOCK DOC]
[LAYOUT GRID]
Scene: [place, era, light]. Characters: [A look], [B look].
PANEL 1 (top-left): [..]  PANEL 2 (top-right): [..]  PANEL 3 (bottom-left): [..]  PANEL 4 (bottom-right): [..]
```

## Shot menu (what AniDoc cuts between)

- date / year card on black (no image needed: `kind: card`)
- establishing wide of the city or building in that era
- character standing in a doorway with light behind him, then the medium shot of his face (label with his name)
- two people talking across a table, over-the-shoulder
- close-up of hands: money changing hands, a file, a phone, a gun on the table (not fired at anyone)
- crowd / press scene, police arriving with sirens (`fx: sirens`)
- the same moment as a TV news frame (`tv`) or CCTV (`cctv`)
- night street, rain, a car leaving (`fx: rain`)
- reaction close-up: worried face, eyes, sweat
- chapter break: dip to black (`in: black`) then a year card
- the title card after the hook (`kind: title`)
