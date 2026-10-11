"""The d20: one image per face, gold and flat-shaded like the rest of the kit.

    python dice.py      -> build/d20-<n>.html for n = 1..20
    node render.js $PWD/../build/d20-20.html 360 360 ../pieces/dice/d20-20.png 1.5 transparent

A natural 20 glows; a natural 1 has a crimson face. Rendered with a transparent
background so the die can sit on any post, card or bot message.
"""
import math
import os

from make import HEAD, TAIL, OUT

W = H = 360
CX, CY, R = 180, 186, 150
LIGHT, PALE, MID, DARK, DEEP = "#f6e3a1", "#eacb7c", "#d9ac4f", "#b98a2e", "#8f6a22"


def P(x, y):
    return f"{CX + x:.1f},{CY + y:.1f}"


def die(n):
    hexa = [(R * math.cos(math.radians(-90 + 60 * k)), R * math.sin(math.radians(-90 + 60 * k))) for k in range(6)]
    H0, H1, H2, H3, H4, H5 = hexa                     # top, upper-right, lower-right, bottom, lower-left, upper-left
    A, B, C = (0, -.62 * R), (.54 * R, .31 * R), (-.54 * R, .31 * R)   # central face, point up
    faces = [  # flat tones, light from the upper left
        ((H5, H0, A), PALE), ((H0, H1, A), MID), ((A, H1, B), MID), ((H1, H2, B), DARK),
        ((H2, H3, B), DEEP), ((B, H3, C), DARK), ((H3, H4, C), MID), ((H4, H5, C), PALE),
        ((C, H5, A), LIGHT),
    ]
    centre = "#9b2240" if n == 1 else LIGHT
    ink = "#fbeedd" if n == 1 else "#2c0819"
    s = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
    s += ('<defs><radialGradient id="crit"><stop offset="0" stop-color="#f6e3a1" stop-opacity=".9"/>'
          '<stop offset="1" stop-color="#e59a52" stop-opacity="0"/></radialGradient>'
          '<filter id="soft"><feGaussianBlur stdDeviation="10"/></filter></defs>')
    if n == 20:
        s += f'<circle cx="{CX}" cy="{CY}" r="{R * 1.12:.0f}" fill="url(#crit)" filter="url(#soft)"/>'
    for pts, col in faces:
        s += f'<polygon points="{" ".join(P(*p) for p in pts)}" fill="{col}" stroke="{DEEP}" stroke-width="2" stroke-linejoin="round"/>'
    s += f'<polygon points="{P(*A)} {P(*B)} {P(*C)}" fill="{centre}" stroke="{DEEP}" stroke-width="2" stroke-linejoin="round"/>'
    size = 80 if n < 10 else 60
    s += (f'<text x="{CX}" y="{CY + .1 * R + size * .36:.1f}" text-anchor="middle" font-family="Marcellus" '
          f'font-size="{size}" fill="{ink}" stroke="{ink}" stroke-width="1.5">{n}</text>')
    # small numbers on two neighbouring faces, so it reads as a die
    for (x, y), m, rot in ((((H5[0] + H0[0] + A[0]) / 3, (H5[1] + H0[1] + A[1]) / 3), 8 if n != 8 else 2, -30),
                           (((H1[0] + H2[0] + B[0]) / 3, (H1[1] + H2[1] + B[1]) / 3), 14 if n != 14 else 6, 60)):
        s += (f'<text transform="translate({CX + x:.1f},{CY + y + 8:.1f}) rotate({rot})" text-anchor="middle" '
              f'font-family="Marcellus" font-size="22" fill="#4a1030" opacity=".55">{m}</text>')
    s += "</svg>"
    return s


if __name__ == "__main__":
    for n in range(1, 21):
        with open(os.path.join(OUT, f"d20-{n}.html"), "w", encoding="utf-8") as f:
            f.write(HEAD + die(n) + TAIL)
    print("ok d20-1 .. d20-20")
