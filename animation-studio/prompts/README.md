# ChatGPT image workflow (how to get the SAME character every time)

ChatGPT has no memory between chats or accounts. Consistency comes from 3 things
you send **every time**:

1. **Reference images** — attach `assets/refs/<character>_sheet.png` (and the style ref).
2. **STYLE LOCK** — paste the block from `style-lock.md` word for word.
3. **CHARACTER DNA** — paste the character's DNA block from `characters/<name>.md` word for word.

Then add the one specific request (pose / shot / background) from the prompt file.

## Steps in each ChatGPT chat

1. New chat. Attach the reference image(s) listed in the prompt.
2. Paste the full prompt (it already contains STYLE LOCK + DNA).
3. Check the result against the reference:
   - face, hair, skin tone, body size, clothes, colours, outline thickness
4. If something drifted, reply with ONE fix, e.g.
   `The face changed. Keep everything else, match the face in the reference sheet exactly.`
5. Download at full size (PNG). Don't screenshot.

## Rules that make animation easy

- **Characters:** plain flat light-grey background `#BDB8AE`, no floor, no shadow, nothing cropped.
- **Fight poses:** SIDE VIEW (profile). Neeraj faces RIGHT, opponents face LEFT.
- **Multiple poses in one image:** same scale, feet on the same line, gaps between figures.
- **Backgrounds:** empty — NO people in them. Characters are added separately.
- **Shorts/Reels:** backgrounds in vertical 9:16 (1024x1536). YouTube long: 16:9 (1536x1024).

## Sharing with Claude

Save files into `assets/incoming/` named like:

```
nakul_sheet.png
nakul_parts.png
nakul_pose_hit.png
bg_lily_white_parking_night.png
```

Then tell Claude: "added nakul_sheet.png" — it will check, cut out, rig and animate.
If a file is good, Claude moves the master sheet to `assets/refs/` so future prompts attach it.
