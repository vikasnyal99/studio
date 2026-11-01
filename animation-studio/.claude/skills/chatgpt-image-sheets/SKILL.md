---
name: chatgpt-image-sheets
description: Generate and save Studio character references, storyboard art or documentary keyframes through Claude's available image tool or the user's logged-in ChatGPT browser session.
---

# Studio art in Claude

Read `<studio-root>/docs/ASSISTANTS.md`, `<studio-root>/docs/PRODUCTION.md` and the relevant animation skill. Use the user's named provider if they specify one. For Claude, use an available image tool; otherwise use the logged-in ChatGPT session through Claude's current browser/Chrome tools. Discover the tools and read their current interaction instructions instead of assuming older extension API names.

1. Plan the story beats, cast/style references and the number of images before generation. Use one full-quality image for each documentary keyframe; avoid 2×2 grids for those shots. State the planned count. The old `npm run -s quota` estimates are only a generation log, not a paid-account allowance. Stay on the current account and respect a live limit.
2. Build prompts in `prompts/characters/` or `prompts/scenes/` using the relevant style lock. For consistency, reuse the same art conversation and approved references in `assets/refs/` where possible. Upload only reference images needed for the job; do not upload narration.
3. Submit each prompt once and wait for an actual completed image before proceeding. Inspect character consistency, historical details and the requested framing. Revise specific defects. Let the user handle login and account challenges.
4. Save the resulting image through the available tool's documented download/export control into `assets/incoming/<video>/`. Verify the saved file, dimensions and association with its prompt. Record the prompt, filename and outcome in `jobs/<video>/images.md`; log generation with `npm run -s quota -- use <account> 1 "<what>"` when an account name is known.
5. Prepare the selected art with `npm run -s prep-doc -- <video>` for documentary shots, or the relevant action preparation script. Review a contact sheet and continue the Remotion edit.

If generation, export or login remains unavailable after a reasonable attempt, save the prompt and report the exact blocker and any completed local files. Do not claim success from a click alone.
