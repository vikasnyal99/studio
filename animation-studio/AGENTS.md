# Animation Studio for Codex

Read the root AGENTS.md. Use `animate-shot`, `doc-animation`, `closeup-shots`, `proof-shots`, `shorts-from-video`, and `chatgpt-image-sheets` in `../docs/codex-skills/`. Run Node/npm from this folder.

Generate new art directly in Codex with the built-in imagegen skill/tool by default (user preference, 28 October 2026). Save the actual generated assets into this workspace before referencing them in Remotion. Use chatgpt-image-sheets only when Chrome is explicitly requested.

The preferred method is generated story keyframes cut to narration. Documentary: cinematic 16:9 graphic-novel frames, slow camera moves, living light, labels/year cards, no captions. Action Shorts: 9:16 close-ups, impact cuts and Roman Hinglish captions. Remotion supplies motion; existing AI clips can be used, but no turnkey AI video-generation integration is configured.

Prompts live in `prompts/characters/` and `prompts/scenes/`: CHARACTER DNA plus numbered prompts, Attach lines and supported placeholders. Expand them with `npm run -s prompt -- <name> <ID>`. Preserve faces, outfits, directions and scene geography. Approved sheets live in `assets/refs/`; incoming images in `assets/incoming/<video>/`; render assets in `public/`. Inspect sheets, flag drift, and use the existing prep scripts.

`npm run -s brief -- <video> <shot> <from> <to>` creates a job and narration preview. Register custom shots in `src/jobs/index.tsx`, usually 30fps. `npm run -s deliver -- Job-<shot> <video> <shot>` delivers a silent clip to sibling video-studio and prints its scene entry. Do not alter the sibling's originals or timing. Full Shorts include their audio; inserts remain silent to avoid doubling narration.

Newer compositions: `src/war/War.tsx` with `scripts/war.mjs` (war-tactics maps with moving soldiers), `src/histmap/HistMap.tsx` with `scripts/histmap.mjs` (animated historical territory), `src/hook/Hook.tsx` with `scripts/hook.mjs` (video openings), and `src/vshorts/VShort.tsx` with `node scripts/vshorts.mjs <video> [--still s,s]` (talking-head phone recordings into vertical Shorts, from `jobs/<video>/vshort.json`). For VShorts, crop landscape recordings to 9:16 around the face.

`src/doc/Doc.tsx`, `src/proof/Proof.tsx` and `src/shorts/ShortCut.tsx` define the data schemas. Read only the relevant schema and example. Check still/contact-sheet output before render. The old account-cap tracker does not constrain the paid ChatGPT plan; respect live limits and log actual generations.
