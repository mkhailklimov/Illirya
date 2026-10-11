"""Font comparison sheet for Illyria task 0.1: Cinzel (current) vs Caesar Dressing vs Marcellus.

Usage: python font_compare.py <fonts_dir> <out.png>
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

fonts_dir, out = sys.argv[1:3]
F = lambda name: os.path.join(fonts_dir, name)

GOLD = [(0xf6, 0xe3, 0xa1), (0xd9, 0xac, 0x4f), (0xb9, 0x8a, 0x2e)]
CREAM = (0xfb, 0xee, 0xdd)
SKY = [(0x0d, 0x15, 0x30), (0x3a, 0x25, 0x52), (0xa2, 0x4b, 0x4f), (0xe5, 0x9a, 0x52)]
SHADOW = (0x0a, 0x07, 0x18)

W, PANEL_H = 1600, 520
CANDIDATES = [
    ('CINZEL (current)', 'Cinzel[wght].ttf', 900),
    ('CAESAR DRESSING (recommended)', 'CaesarDressing-Regular.ttf', None),
    ('MARCELLUS (alternative)', 'Marcellus-Regular.ttf', None),
]


def font(file, size, weight=None):
    f = ImageFont.truetype(F(file), size)
    if weight:
        try:
            f.set_variation_by_axes([weight])
        except Exception:
            pass
    return f


def vgradient(w, h, stops):
    g = Image.new('RGB', (w, h))
    d = ImageDraw.Draw(g)
    n = len(stops) - 1
    for y in range(h):
        t = y / max(h - 1, 1) * n
        i = min(int(t), n - 1)
        u = t - i
        c = tuple(round(stops[i][k] + (stops[i + 1][k] - stops[i][k]) * u) for k in range(3))
        d.line([(0, y), (w, y)], fill=c)
    return g


def tracked_mask(text, f, tracking):
    """Text mask with extra letter-spacing (wide caps per the style guide)."""
    widths = [f.getbbox(ch)[2] - f.getbbox(ch)[0] if ch != ' ' else f.getlength(' ') for ch in text]
    total = int(sum(f.getlength(ch) for ch in text) + tracking * (len(text) - 1)) + 20
    asc, desc = f.getmetrics()
    m = Image.new('L', (total, asc + desc + 20), 0)
    d = ImageDraw.Draw(m)
    x = 10
    for ch in text:
        d.text((x, 10), ch, font=f, fill=255)
        x += f.getlength(ch) + tracking
    return m.crop(m.getbbox())


def draw_title(img, text, f, tracking, cy, fill_stops):
    m = tracked_mask(text, f, tracking)
    x = (img.width - m.width) // 2
    y = cy - m.height // 2
    # soft drop shadow (dy 5, blur 7, ~75%)
    sh = Image.new('L', img.size, 0)
    sh.paste(m, (x, y + 5))
    sh = sh.filter(ImageFilter.GaussianBlur(7)).point(lambda v: int(v * 0.75))
    img.paste(Image.new('RGB', img.size, SHADOW), (0, 0), sh)
    fill = vgradient(m.width, m.height, fill_stops) if isinstance(fill_stops, list) else Image.new('RGB', m.size, fill_stops)
    img.paste(fill, (x, y), m)


def panel(label, file, weight):
    img = vgradient(W, PANEL_H, SKY)
    d = ImageDraw.Draw(img)
    # sun glow
    glow = Image.new('L', (W, PANEL_H), 0)
    ImageDraw.Draw(glow).ellipse([W // 2 - 420, PANEL_H - 260, W // 2 + 420, PANEL_H + 420], fill=110)
    img.paste(Image.new('RGB', img.size, (0xe5, 0x9a, 0x52)), (0, 0), glow.filter(ImageFilter.GaussianBlur(90)))
    # label
    d.text((28, 20), label, font=font('Cinzel[wght].ttf', 22, 700), fill=CREAM)
    draw_title(img, 'ILLYRIA: AD 30', font(file, 110, weight), 14, 150, GOLD)
    draw_title(img, 'ACRVVIVM', font(file, 64, weight), 18, 265, GOLD)
    draw_title(img, 'TIBERIVS CAESAR AVGVSTVS', font(file, 36, weight), 10, 335, CREAM)
    draw_title(img, 'The Governor of the Bay of Kotor', font('CormorantGaramond-Italic[wght].ttf', 40, 500), 1, 400, CREAM)
    # small-size check: must read at ~40 px tall (style guide)
    small = font(file, 26, weight)
    d.text((28, PANEL_H - 52), 'AD 30   EPIDAVRVM   RISINIVM   SCODRA   NARONA   SALONA', font=small, fill=GOLD[0])
    return img


panels = [panel(*c) for c in CANDIDATES]
sheet = Image.new('RGB', (W, PANEL_H * len(panels) + 8 * (len(panels) - 1)), (0x2c, 0x08, 0x19))
for i, p in enumerate(panels):
    sheet.paste(p, (0, i * (PANEL_H + 8)))
sheet.save(out)
print(out, sheet.size)
