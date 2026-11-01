import sys, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
fr, out = sys.argv[1], sys.argv[2]
W, H = 1280, 720
F = "/usr/share/fonts/truetype/noto/NotoSans-ExtraCondensedBlack.ttf"
RED, YEL = (235, 25, 35), (255, 212, 0)
def crop_c(img, cx, cy, w, h):
    x0 = max(0, min(img.width - w, cx - w // 2)); y0 = max(40, min(img.height - 40 - h, cy - h // 2))
    return img.crop((x0, y0, x0 + w, y0 + h)), (x0, y0)
def ring(d, cx, cy, r, w=9):
    d.ellipse((cx - r - 3, cy - r - 3, cx + r + 3, cy + r + 3), outline=(0, 0, 0), width=w + 6)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=RED, width=w)
def text(d, xy, s, size, fill, stroke=6, anchor="la"):
    d.text(xy, s, font=ImageFont.truetype(F, size), fill=fill, stroke_width=stroke, stroke_fill=(0, 0, 0), anchor=anchor)

canvas = Image.new("RGB", (W, H), (10, 10, 12))
# main frame: Ravana (Yash) with the sword
src = Image.open(f"{fr}/hq_sword2.png").convert("RGB")
mw = 830; ch = 1000; cw = int(ch * mw / H)
main = src.crop((0, 40, cw, 40 + ch)).resize((mw, H), Image.LANCZOS)
main = ImageEnhance.Brightness(ImageEnhance.Contrast(ImageEnhance.Color(main).enhance(1.35)).enhance(1.15)).enhance(1.25)
canvas.paste(main, (0, 0))
# dark top-left for title
sh = Image.new("L", (W, H), 0); ImageDraw.Draw(sh).rectangle((0, 0, 560, 300), fill=170)
sh = sh.filter(ImageFilter.GaussianBlur(70))
canvas = Image.composite(Image.new("RGB", (W, H), (0, 0, 0)), canvas, sh)
d = ImageDraw.Draw(canvas)
k = mw / cw
sx, sy = int(100 * k) + 6, int((600 - 40) * k)
ring(d, sx + 8, sy, 70)
lf = ImageFont.truetype(F, 46); lab = "CHANDRAHAS"; lw = d.textlength(lab, font=lf)
bx, by = 20, sy + 110
d.line((sx + 30, sy + 68, bx + 90, by), fill=(0, 0, 0), width=14); d.line((sx + 30, sy + 68, bx + 90, by), fill=RED, width=8)
d.rectangle((bx - 4, by - 4, bx + lw + 32, by + 64), fill=(0, 0, 0)); d.rectangle((bx, by, bx + lw + 28, by + 60), fill=YEL)
d.text((bx + 14, by + 1), lab, font=lf, fill=(0, 0, 0))
# evidence tiles on the right
tiles = [("hq_airavat.png", 800, 560, "AIRAVAT"), ("hq_pushpak_air.png", 900, 470, "PUSHPAK VIMAAN"), ("hq_axe.png", 760, 330, "PARASHURAM")]
tx, tw, th, gap = mw + 14, W - mw - 26, 224, 12
for i, (f, cx, cy, lab) in enumerate(tiles):
    im = Image.open(f"{fr}/{f}").convert("RGB")
    c, (x0, y0) = crop_c(im, cx, cy, 1000, int(1000 * th / tw))
    c = ImageEnhance.Color(c.resize((tw, th), Image.LANCZOS)).enhance(1.3)
    ty = 12 + i * (th + gap)
    d.rectangle((tx - 5, ty - 5, tx + tw + 5, ty + th + 5), fill=(255, 255, 255))
    canvas.paste(c, (tx, ty))
    s = tw / 1000
    ring(d, int(tx + (cx - x0) * s), int(ty + (cy - y0) * s), 70, 7)
    lf = ImageFont.truetype(F, 34); lw = d.textlength(lab, font=lf)
    d.rectangle((tx, ty + th - 46, tx + lw + 24, ty + th), fill=YEL)
    d.text((tx + 12, ty + th - 44), lab, font=lf, fill=(0, 0, 0))
# title
text(d, (28, 6), "TRAILER", 110, (255, 255, 255), 7)
text(d, (24, 110), "DECODED", 150, YEL, 8)
# magnifier icon
mx, my, mr = 555, 100, 46
d.ellipse((mx - mr, my - mr, mx + mr, my + mr), outline=(0, 0, 0), width=22)
d.ellipse((mx - mr, my - mr, mx + mr, my + mr), outline=(255, 255, 255), width=12)
d.line((mx + 34, my + 34, mx + 80, my + 80), fill=(0, 0, 0), width=30)
d.line((mx + 34, my + 34, mx + 78, my + 78), fill=(255, 255, 255), width=18)
canvas.save(out, "JPEG", quality=92)
