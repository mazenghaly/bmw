#!/usr/bin/env python3
"""Car-shaped QR: the QR is the car's body, wrapped with a roofline, wheels
(drawn behind, peeking out) and a headlight. Colours match the E90 site.
Verified scannable with OpenCV before saving."""
import qrcode
from qrcode.constants import ERROR_CORRECT_H
from PIL import Image, ImageDraw, ImageFont
import cv2, sys

URL = "https://bmw-woad.vercel.app"

# ── Palette (from the site) ────────────────────────────────────────────────
BG       = (255, 255, 255)
DARK     = (14, 15, 17)        # #0E0F11 near-black QR modules
ACCENT   = (58, 110, 165)      # #3A6EA5 BMW-ish blue
ACCENT_D = (40, 80, 122)
GLASS    = (24, 28, 33)
RIM      = (188, 194, 202)
HEAD     = (255, 214, 120)

# ── QR matrix (high ECC so the centre badge + quiet styling is safe) ───────
qr = qrcode.QRCode(error_correction=ERROR_CORRECT_H, border=0, box_size=1)
qr.add_data(URL); qr.make(fit=True)
m = qr.get_matrix(); n = len(m)

# ── Geometry ───────────────────────────────────────────────────────────────
MOD  = 26
qpx  = n * MOD
PAD  = 4 * MOD                 # full 4-module quiet zone in white
body = qpx + PAD * 2
margin_x = 170
roof_h   = int(body * 0.30)
wheel_r  = int(body * 0.155)
top      = roof_h + 40

W = body + margin_x * 2
H = top + body + wheel_r + 260

img = Image.new("RGB", (W, H), BG)
d   = ImageDraw.Draw(img)

bx0, by0 = margin_x, top
bx1, by1 = bx0 + body, by0 + body
ox, oy   = bx0 + PAD, by0 + PAD          # QR top-left

# ── 1. Wheels FIRST, behind the body (only bottoms will show) ──────────────
wy = by1 + int(wheel_r * 0.30)
wheels_x = (bx0 + int(body * 0.26), bx1 - int(body * 0.26))
for wx in wheels_x:
    d.ellipse([wx-wheel_r, wy-wheel_r, wx+wheel_r, wy+wheel_r], fill=DARK)
    d.ellipse([wx-int(wheel_r*0.5), wy-int(wheel_r*0.5),
               wx+int(wheel_r*0.5), wy+int(wheel_r*0.5)], fill=RIM)
    d.ellipse([wx-int(wheel_r*0.16), wy-int(wheel_r*0.16),
               wx+int(wheel_r*0.16), wy+int(wheel_r*0.16)], fill=DARK)

# ── 2. Roof / cabin (wide windscreen above the body) ───────────────────────
ri = int(body * 0.16)
d.polygon([(bx0+ri, by0), (bx1-ri, by0),
           (bx1-int(ri*1.45), by0-roof_h), (bx0+int(ri*1.45), by0-roof_h)], fill=ACCENT)
g = 28
d.polygon([(bx0+ri+g, by0-g), (bx1-ri-g, by0-g),
           (bx1-int(ri*1.45)-g, by0-roof_h+g+6), (bx0+int(ri*1.45)+g, by0-roof_h+g+6)], fill=GLASS)

# ── 3. Car body panel (opaque — hides wheel tops) + white QR field ─────────
d.rounded_rectangle([bx0, by0, bx1, by1], radius=52, fill=ACCENT)
d.rounded_rectangle([bx0+20, by0+20, bx1-20, by1-20], radius=40, fill=BG)

# ── 4. QR modules (lightly rounded) ────────────────────────────────────────
def in_finder(xx, yy):
    return (xx < 7 and yy < 7) or (xx >= n-7 and yy < 7) or (xx < 7 and yy >= n-7)
for yy in range(n):
    for xx in range(n):
        if m[yy][xx] and not in_finder(xx, yy):
            cx, cy = ox + xx*MOD, oy + yy*MOD
            d.rounded_rectangle([cx, cy, cx+MOD, cy+MOD], radius=int(MOD*0.22), fill=DARK)

# ── 5. Finder eyes: standard dark/white/dark, corners softened ─────────────
def finder(gx, gy):
    x0, y0 = ox+gx*MOD, oy+gy*MOD
    x1, y1 = x0+7*MOD, y0+7*MOD
    d.rounded_rectangle([x0, y0, x1, y1], radius=int(MOD*0.85), fill=DARK)
    d.rounded_rectangle([x0+MOD, y0+MOD, x1-MOD, y1-MOD], radius=int(MOD*0.6), fill=BG)
    d.rounded_rectangle([x0+2*MOD, y0+2*MOD, x1-2*MOD, y1-2*MOD], radius=int(MOD*0.4), fill=DARK)
finder(0, 0); finder(n-7, 0); finder(0, n-7)

# ── 6. Centre BMW-style roundel (small; ECC-H absorbs it) ──────────────────
br = int(qpx*0.07)
cx, cy = ox+qpx//2, oy+qpx//2
d.ellipse([cx-br-11, cy-br-11, cx+br+11, cy+br+11], fill=BG)
d.ellipse([cx-br, cy-br, cx+br, cy+br], fill=DARK)
d.ellipse([cx-br+8, cy-br+8, cx+br-8, cy+br-8], fill=BG)
d.pieslice([cx-br+8, cy-br+8, cx+br-8, cy+br-8], 180, 270, fill=ACCENT)
d.pieslice([cx-br+8, cy-br+8, cx+br-8, cy+br-8],   0,  90, fill=ACCENT)
d.line([(cx, cy-br+8),(cx, cy+br-8)], fill=DARK, width=4)
d.line([(cx-br+8, cy),(cx+br-8, cy)], fill=DARK, width=4)

# ── 7. Two headlights in the lower white margin (clear of QR data) ─────────
hr = int(PAD*0.32)
hy = by1 - PAD//2
for hx in (bx0 + PAD//2, bx1 - PAD//2):
    d.ellipse([hx-hr, hy-hr, hx+hr, hy+hr], fill=HEAD)
    d.ellipse([hx-int(hr*0.45), hy-int(hr*0.45), hx+int(hr*0.45), hy+int(hr*0.45)], fill=(255,236,190))

# ── 8. Caption ─────────────────────────────────────────────────────────────
def font(sz, bold=True):
    p = ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold
         else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
    try: return ImageFont.truetype(p, sz)
    except: return ImageFont.load_default()
cyt = by1 + wheel_r + 60
for txt, fnt, col in [("SCAN TO VIEW THE PROJECT", font(46), DARK),
                      ("bmw-woad.vercel.app", font(38, False), ACCENT_D)]:
    w = d.textbbox((0,0), txt, font=fnt)[2]
    d.text(((W-w)//2, cyt), txt, font=fnt, fill=col); cyt += 64

out = "/home/claude/repo/qr/bmw-car-qr.png"
img.save(out, "PNG"); print("saved", out, img.size)

# ── Verify it scans ────────────────────────────────────────────────────────
data, _, _ = cv2.QRCodeDetector().detectAndDecode(cv2.imread(out))
print("DECODED:", repr(data))
if data != URL:
    print("‼️  SCAN CHECK FAILED", file=sys.stderr); sys.exit(1)
print("✅ scan check passed")
