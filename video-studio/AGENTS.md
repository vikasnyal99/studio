# Video Studio for Codex

Read the root AGENTS.md. Use `make-video` for new edits, `revise-video` for feedback, `studio-audio` for multipart narration or voice cleanup, and `animate` / `proof-shots` for inserts. Full workflows live in `../docs/codex-skills/`.

Run Python as `.venv/bin/python` here. `scripts/make_video.py` selects Node 22 for HyperFrames. Scene formats: `docs/SCENES.md`; pacing and house look: `docs/STYLE.md`. `scripts/new_video.py` initializes a video; use the voice path it prints. `scripts/pick_takes.py` handles talking-head retakes; `scripts/join_parts.py` joins audio parts. Original inputs remain intact; maintain cut maps when changing timing.

`inbox/` contains incoming recordings; `videos/<name>/scenes.json` is the edit; `timing/timeline.txt` and targeted word queries establish cuts; `research/sources.json` holds facts and credits. `make_video.py ... assets` and `... check` make contact sheets; `... render` makes `output/final.mp4`. Deliver credits and caption files with the export.

Use source/licensed images and verify identities. Capture evidence with `scripts/capture_page.py` and inspect its crop grid; use another source if blocked. Use `scripts/prep_image.py` for supplied pictures, retaining attribution. Preview a new look in a short sample before a full render. Openings change every 2–3 seconds; later scenes usually last 3–8 seconds. Use whooshes at major moments, and split speaker/picture layouts where appropriate.

The newer Ramayana branch has renderer features absent here. Read `../docs/CODEX.md` before continuing it.
