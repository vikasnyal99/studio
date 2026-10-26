---
name: chatgpt-image-sheets
description: Generate character/pose/storyboard/background images in the user's logged-in ChatGPT (free plan) through the Claude-in-Chrome extension, and save them into animation-studio/assets/incoming/. Use when animation needs new art, or the user says "generate the images yourself" / "use chatgpt".
---

# Making images in ChatGPT through Chrome

Claude cannot draw. The user's ChatGPT is open in their Chrome (Free plan, logged in); drive it with the `mcp__claude-in-chrome__*` tools
(load them in ONE ToolSearch call first, see the claude-in-chrome skill). Never enter passwords, never solve CAPTCHAs; if ChatGPT asks, stop and tell the user.
Do not upload the user's voice recording: only reference pictures (character sheets) go to ChatGPT.

## Budget first (several free accounts — track them)
The Free plan allows only a few images per account (5 in a row worked on acc1, 2026-10-25; the cap is per account in the tracker); the user has several accounts for long-form work.
Every account and every generation is tracked in `assets/chatgpt-accounts.json` with `scripts/quota.mjs`:
- Before planning: `npm run -s quota` (left per account, blocked until) and `npm run -s quota -- plan <n>` (which accounts cover n images).
- Tell the user the plan and the count ("6 images: acc1 x3, acc2 x3") before generating.
- Which account is logged in: open the profile menu (bottom-left) and read the name/email; if it is not the planned one,
  ask the user to switch accounts (never type passwords). New account: `npm run -s quota -- add <name> 4 "<email or note>"`.
- After every generation: `npm run -s quota -- use <acc> 1 "<what>"`. When ChatGPT says the limit is reached, read the time it
  gives and `npm run -s quota -- limit <acc> <hours|HH:MM>`, then stop and report.
- Pack many shots in ONE image: a 2x2 sheet = 4 shots (`prompts/storyboard-sheets.md` for Shorts, `prompts/doc-frames.md` for documentaries).
- Character/pose sheets: put every pose of every character on one sheet. Skip optional sheets unless quota is left.

## Steps
1. `tabs_context_mcp` with createIfEmpty, then `navigate` to https://chatgpt.com (or the earlier chat URL, to keep character context; wait 3 s after loading).
2. Reference picture: `find` "file upload input" -> `file_upload` the `assets/refs/<name>_sheet.png` onto the "Attach photos" ref (only on the first message of a chat).
3. `find` "message input box" -> click its ref -> `type` the prompt as ONE paragraph (no newlines, they would send early) -> key `Return`.
4. Generation takes 60-90 s: `wait` 10 s x5-6, then scroll down and screenshot (scale 0.5). Judge it against the character sheet. One-line fix message if it drifted.
5. Save (fastest, worked 2026-10-25): the finished image is a `blob:` <img> in the page. With `javascript_tool`:
   `const im=[...document.querySelectorAll('img')].filter(i=>i.naturalWidth>300).pop(); const b=await (await fetch(im.src)).blob(); const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='<name>.png'; document.body.appendChild(a); a.click(); a.remove(); b.size`
   → `~/Downloads/<name>.png` (1536x1024, ~2.5 MB), then copy into `assets/incoming/`. Check md5s differ between images.
   (Old way: click the image, wait 3 s, click the viewer's download arrow; files get AI-made titles.)
   Generation takes 60-90 s: batch 6-7 `wait 10` + scroll down + screenshot (scale 0.5) + count big imgs in one browser_batch.
6. `Escape` closes the viewer. Next prompt in the same chat keeps the characters consistent.

## Prompt rules (from what worked)
- Style: close-up fight Shorts use the flat cel line ("same flat 2D Indian animated-series cel-shaded style as the sheet above"); documentaries
  (`doc-animation`) paste the block from `prompts/style-lock-doc.md`. Then the one-line look of each character.
- Say "PORTRAIT 1024x1536" for Shorts, "LANDSCAPE 1536x1024" for 16:9 documentaries, "no text", "thin pure white gutters" for grids, "plain flat #BDB8AE background, nothing cropped" for pose sheets.
- Cartoon violence only, no blood. Name no real person's face; characters are generic designs.
- Backgrounds: ask for the real setting of the story (e.g. underground hotel parking), flat 2D, no people, clear floor in the middle.
- If the tab freezes (screenshot timeouts), a native dialog is probably open: ask the user to dismiss it. After 2-3 failures stop and ask.
- Several accounts: the profile menu (bottom-left) → name → shows only the accounts logged in to THIS Chrome profile. If the planned
  account is not there, keep going on the current one until ChatGPT refuses, then report.
- If the tool permission check errors repeatedly, stop after a few tries and tell the user what is done (counts, files) — do not loop.
