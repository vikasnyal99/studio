# Ramayana trailer decoded: inserts for the stories with no trailer footage (doc-animation)

Video: `video-studio/videos/2026-10-25-ramayana-trailer-decoded` (script `record.txt`). Written 2026-10-26. NOT yet generated:
free quota was 0 (acc1 +1 at 12:09 pm, then about 5 a day). Plan: 4 generations in ONE ChatGPT chat, in this order.
Respectful devotional tone. No violence shown (Ravana is never shown injured; Shiva only calm).
Save into `assets/incoming/ramayana-trailer/`: 1 → `cast.png` (also copy to `assets/refs/ramayana_trailer_doc.png`), 2 → `kailash_grid.png`,
3 → `kumbhakarna_grid.png`, 4 → `sampati_grid.png`. Then `npm run -s prep-doc -- ramayana-trailer`.

Reuse without a new generation: the Lakshman Rekha insert (`jobs/2026-10-25-ramayana-trailer-decoded/rekha.json`) already uses the Sita Haran
art. Ravana's look comes from `assets/refs/sita_doc.png` (attach it to prompt 1; use the RIGHT figure, true form).

## CHARACTER DNA

- RAVANA (true form): as on `sita_doc.png`: towering king, ten crowned heads in a row, tall gold crown, thick black moustache,
  maroon and black royal clothes with heavy gold armour. In prompt 2 show him with ONE visible face in close shots, ten heads only in wides.
- SHIVA: calm meditating ascetic god, pale ash-smeared skin with a soft blue tint at the throat, matted hair piled high with a thin
  crescent moon and a gentle stream of water, three-lined ash marks on the forehead, a serene half-closed gaze,
  tiger-skin cloth, a coiled serpent round the neck, rudraksha beads, a trident beside him. Gentle and peaceful, never angry.
- NANDI: a large white bull, calm and dignified, a garland of bells and a red cloth on his back.
- BRAHMA: elderly four-faced god (three faces visible, in a fan), white beard, saffron robe, seated on a lotus, a soft golden glow.
- SARASWATI: graceful goddess in a white sari, a veena (string instrument) in her arms, a swan beside her, a soft white glow.
- KUMBHAKARNA: gigantic bulky rakshasa, much taller than a hut, wide stomach, thick arms, short thick dark beard, simple dark-red cloth
  round the waist, gold arm bands, a calm sleepy face; he sits in meditation first, then lies asleep. Not scary, a gentle giant.
- SAMPATI and JATAYU: two giant vultures, Sampati the elder (grey-brown, broad wings, a bald pale head), Jatayu the younger (darker,
  smaller). Noble, not monstrous.

## Prompt 1: cast sheet → `cast.png`

```
STYLE: cinematic 2D graphic-novel illustration for an animated documentary. Semi-realistic Indian faces and proportions, thin clean dark linework, soft cel shading with painted lighting, muted film colours, subtle film grain. Looks like a frame from a high-end animated mythological documentary, NOT anime, NOT flat vector, NOT 3D, NOT a photo. No text, no labels, no logos, no watermarks. Violence is only implied. CAST SHEET: LANDSCAPE 1536x1024, plain flat light-grey background (#BDB8AE), six full-body characters standing side by side at the same scale on one baseline, nothing cropped, evenly spaced (Kumbhakarna is shown at the same scale but clearly the biggest). LEFT TO RIGHT: SHIVA (calm meditating ascetic god, pale ash-smeared skin with a soft blue tint at the throat, matted hair piled high with a thin crescent moon and a gentle stream of water, three-lined ash marks on the forehead, tiger-skin cloth, coiled serpent round the neck, rudraksha beads, a trident); NANDI (a large white bull, a garland of bells, a red cloth on his back); BRAHMA (elderly four-faced god, three faces visible in a fan, white beard, saffron robe, soft golden glow); SARASWATI (graceful goddess in a white sari holding a veena, a swan beside her, soft white glow); KUMBHAKARNA (gigantic bulky rakshasa, wide stomach, thick arms, short thick dark beard, dark-red waist cloth, gold arm bands, calm sleepy face); SAMPATI (a giant grey-brown vulture with broad wings and a pale head, noble). Attach the Ravana cast sheet: do not redraw him here.
```
Attach: `assets/refs/sita_doc.png` (style reference).

## Prompt 2: Kailash grid → `kailash_grid.png`

```
New image, same cinematic 2D graphic-novel documentary style and the same characters as the cast sheets (Ravana in his true form as on the first cast sheet). LAYOUT: LANDSCAPE 1536x1024 canvas split into a 2x2 grid of 4 equal landscape panels separated by thin pure white gutters, each panel a separate film shot, consistent light. No text. Scene: Mount Kailash, a huge snowy peak at dawn. PANEL 1 (top-left): wide shot, Ravana's golden flying chariot (the Pushpaka Vimana, an ornate floating golden temple-like chariot) stops in the sky in front of the great snow peak, Nandi the white bull standing calmly on a ledge in front, raising one hand-like hoof as if asking it to stop. PANEL 2 (top-right): low angle, Ravana with his arms under the base of the mountain, straining to lift it, ten heads visible, snow and dust shaking loose, the mountain trembling, a rain of loose stones. PANEL 3 (bottom-left): close-up of Shiva sitting in peaceful meditation on the summit, smiling slightly, one foot just pressing down very gently on the rock, the peak settling heavy. PANEL 4 (bottom-right): medium shot, Ravana kneeling on the snow in front of Shiva, looking up with respect, Shiva holding out a curved golden sword with a bright crescent-moon shaped blade; soft golden light.
```

## Prompt 3: Kumbhakarna grid → `kumbhakarna_grid.png`

```
New image, same cinematic 2D graphic-novel documentary style and the same characters as the cast sheet. LAYOUT: LANDSCAPE 1536x1024 canvas split into a 2x2 grid of 4 equal landscape panels separated by thin pure white gutters, each panel a separate film shot. No text. PANEL 1 (top-left): wide shot, the giant Kumbhakarna sitting in silent meditation on a rocky hillside among burning small fires, evening sky, small trees at his feet showing how huge he is. PANEL 2 (top-right): Brahma appears in a golden glow in front of Kumbhakarna, hand raised in blessing, Kumbhakarna looking up with folded hands. PANEL 3 (bottom-left): close-up on Kumbhakarna's face, mouth just opening to speak, and behind his shoulder the faint figure of Saraswati, glowing white and holding her veena, her hand gently lifted as if touching the air near his lips. PANEL 4 (bottom-right): wide shot of Kumbhakarna fast asleep inside a huge cave, snoring peacefully, a tiny lamp and small figures at his feet, moonlight on the cave floor.
```

## Prompt 4: Sampati and Jatayu grid → `sampati_grid.png`

```
New image, same cinematic 2D graphic-novel documentary style as the cast sheets. LAYOUT: LANDSCAPE 1536x1024 canvas split into a 2x2 grid of 4 equal landscape panels separated by thin pure white gutters, each panel a separate film shot. No text. PANEL 1 (top-left): wide, two giant vultures, Sampati (grey-brown, elder) and Jatayu (darker, younger), racing side by side high above the clouds toward a huge glowing sun. PANEL 2 (top-right): close-up of Jatayu tiring in the blazing light, eyes narrowed, feathers glowing at the edges, the sun big behind. PANEL 3 (bottom-left): Sampati spreading his huge wings over Jatayu to shield him from the sunlight, his own feathers glowing and starting to smoulder (no fire shown, only a warm glow). PANEL 4 (bottom-right): wide, Sampati sitting alone on a rocky mountain top of the Vindhya hills, his wings bare and burnt-brown, looking up at the empty sky, evening light.
```

## Shots these feed (script parts, times set once the audio exists)

| Part of `record.txt` | Grid panels |
|---|---|
| 2 Chandrahas | kailash 1 → 2 → 3 → 4 (about 20 s) |
| 3 Kumbhakarna | kumbhakarna 1 → 2 → 3 → 4 (about 14 s) |
| 7 Jatayu | sampati 1 → 2 → 3 → 4 (about 14 s) |
| 9 Lakshman Rekha | `jobs/2026-10-25-ramayana-trailer-decoded/rekha.json` (existing art, about 20 s) |
