# Animation Studio (Remotion)

Videos are React code: every frame is a function of `frame` number, so timing,
camera moves, shakes, springs and effects are exact and re-tweakable.

## Daily commands

```bash
npm run studio                 # live preview + timeline scrubber at http://localhost:3000
npm run prep                   # re-cut characters from the reference sheet into public/
npx remotion render MotionComic out/sample1_motion_comic.mp4
npx remotion render PuppetPunch out/sample2_puppet_rig.mp4
npx remotion still MotionComic out/frame.png --frame=228   # single frame check
```

## Documentary look (AniDoc style)

```bash
npm run -s quota                                   # ChatGPT accounts: generations left / blocked until
npm run -s prep-doc -- <video>                     # assets/incoming/<video>/*.png (+ *_grid.png) -> public/doc/<video>/
npm run -s doc -- jobs/<video>/<shot>.json --still # one frame per shot -> out/doc/<shot>_stills.jpg
npm run -s doc -- jobs/<video>/<shot>.json --deliver <video> <shot>   # silent mp4 into video-studio assets
npm run -s doc -- jobs/<video>/ch01.json --with-audio                 # long-form chapter with narration/music/SFX
```

Spec format and effects: top of `src/doc/Doc.tsx`; workflow: `.claude/skills/doc-animation/SKILL.md`.

## Shots for video-studio

```bash
npm run brief   -- 2026-10-18-neeraj-pepsu punch 24.5 29.0     # brief + narration slice (add --short for 9:16)
npm run deliver -- Job-punch 2026-10-18-neeraj-pepsu punch      # silent MP4 -> video-studio assets + scenes.json line
```

Briefs live in `jobs/<video>/`, shot code in `src/jobs/<video>/`, registered in `src/jobs/index.tsx`.

## Layout

| Path | What it is |
|---|---|
| `neeraj*.png/jpeg` | your source references |
| `scripts/prep-assets.mjs` | cuts poses/faces out of the character sheet (transparent PNGs) |
| `public/` | assets used by videos (`staticFile('name.png')`) |
| `src/Root.tsx` | list of compositions (size, fps, duration) |
| `src/compositions/MotionComic.tsx` | Sample 1: vertical reel, crowd → face → punch → KO → end card |
| `src/compositions/PuppetPunch.tsx` | Sample 2: landscape rigged puppet fight |
| `src/components/fx.tsx` | reusable FX: Shake, SpeedLines, ImpactStar, Dust, Flash, SlamText, Grade |
| `src/components/Crowd.tsx` | procedural cheering crowd silhouettes |
| `src/components/Rig.tsx` | `NeerajRig` (cutout puppet from one image) + `VectorFighter` (placeholder rival) |

## Retiming

`BEATS` at the top of `MotionComic.tsx` and `STEP/PUNCH/IMPACT/...` at the top of
`PuppetPunch.tsx` control the whole timing. Change a number, the studio updates live.

## Recommended production flow

1. **Design**: character sheet + key poses (wind-up, punch extended, hit reaction,
   on the floor) generated in your image tool, same style as `neeraj_anim2.png`.
2. **Character motion**: either
   - cutout rig in Remotion (like `NeerajRig`) for simple limb moves, or
   - image-to-video AI (Kling / Runway / Veo, etc.) from those poses for complex body motion,
     exported on green screen or plain background.
3. **Assemble in Remotion**: backgrounds, camera, hit-stop, impact frames, shakes,
   sound-effect text, captions, music sync, color grade. Use `<OffthreadVideo>` for clips.
4. **Render** MP4 and do final polish/sound in your editor.

## Lily White Hotel teaser (audio: `public/final_with_hook.mp3`)

```bash
npx remotion render Teaser-Animated out/teaser_animated.mp4
npx remotion render Teaser-Photos   out/teaser_photos.mp4
npx remotion render Teaser-Comic    out/teaser_comic.mp4
```

- `src/teaser/Teaser.tsx` — the edit list (`SHOTS`): cut frames (on the woosh peaks), captions,
  and which frozen frames become "photos"/comic panels. All 3 variants read from it.
- `src/teaser/scenes.tsx` — the 5 animated shots (hotel/Holi, Nakul, Neeraj entry, angry look, fight/KO).

| Cut | Time | Frame | Audio |
|---|---|---|---|
| Hotel / Holi party | 0.00s | 0 | "Lily White Hotel hai... Holi party" |
| Nakul | 4.70s | 141 | "tagda boxer, ab tak na pita" |
| Neeraj entry | 9.70s | 291 | "South Indian movie jaisi" |
| Angry look | 13.55s | 406 | "Neeraj aa li" |
| Face-off → punch | 16.95s | 508 | punch "boom" at 19.8s (frame 594) |
