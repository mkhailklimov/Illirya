"""The d20 in three stones: obsidian, amber and malachite. One image per face and stone.

    python dice.py      -> build/d20-<stone>-<n>.html for n = 1..20
    node render.js <abs path>/build/d20-obsidian-20.html 360 360 ../pieces/dice/obsidian/d20-20.png 1.5 transparent

The die is drawn in two layers: the stone itself (glassy black, honey amber with
inclusions, banded green malachite) clipped to the die's outline, then the facets as
light and shadow on top, lit from the upper left. Numerals are Caesar Dressing, inlaid
in gold (dark resin on amber). A natural 20 glows; a natural 1 has a crimson face.
die_svg() is also used by the web version (web/build.py), so the two stay alike.
"""
import math
import os
import random

from make import HEAD, TAIL, OUT

W = H = 360
CX, CY, R = 180, 186, 150
STONES = ("obsidian", "amber", "malachite", "opal", "aquamarine", "onyx")   # the last three: the land, sea and omen dice of rules v5

# per stone: base gradient (light, dark), edge colour, numeral fill and outline, small-numeral colour
LOOK = {
    "obsidian": {"light": "#1f1a2b", "dark": "#020104", "edge": "#7d7398", "gloss": .5, "ink": "url(#inlay)", "rim": "#2c0819", "small": "#d9ac4f"},
    "amber": {"gloss": 1, "light": "#ffc861", "dark": "#8a3d08", "edge": "#ffe2a0", "ink": "#3a1404", "rim": "#ffe9b8", "small": "#5a2408"},
    "malachite": {"gloss": 1, "light": "#4fd39a", "dark": "#06402a", "edge": "#b8f0d4", "ink": "url(#inlay)", "rim": "#06301f", "small": "#f6e3a1"},
    "opal": {"gloss": .7, "light": "#fbf8ff", "dark": "#c3cde4", "edge": "#ffffff", "ink": "#3a2a55", "rim": "#fdfbff", "small": "#5a4a78"},
    "aquamarine": {"gloss": 1, "light": "#bff3f0", "dark": "#2b7f93", "edge": "#e4fffd", "ink": "#0c3442", "rim": "#e8fffe", "small": "#0f4a5a"},
    "onyx": {"gloss": .5, "light": "#26222a", "dark": "#050406", "edge": "#d8d2c8", "ink": "url(#inlay)", "rim": "#1a0f12", "small": "#e8e0d0"},
}
# facets: light (+) or shadow (-) laid over the stone, light from the upper left
SHADE = [+.30, +.10, +.05, -.20, -.45, -.25, +.00, +.22, +.38]


def P(x, y):
    return f"{CX + x:.1f},{CY + y:.1f}"


def geometry():
    hexa = [(R * math.cos(math.radians(-90 + 60 * k)), R * math.sin(math.radians(-90 + 60 * k))) for k in range(6)]
    H0, H1, H2, H3, H4, H5 = hexa                     # top, upper-right, lower-right, bottom, lower-left, upper-left
    A, B, C = (0, -.62 * R), (.54 * R, .31 * R), (-.54 * R, .31 * R)   # central face, point up
    faces = [(H5, H0, A), (H0, H1, A), (A, H1, B), (H1, H2, B), (H2, H3, B), (B, H3, C), (H3, H4, C), (H4, H5, C), (C, H5, A)]
    return hexa, (A, B, C), faces


def material(stone, uid):
    """The stone's body, to be clipped to the die outline."""
    L = LOOK[stone]
    rnd = random.Random(stone)
    out = [f'<rect x="0" y="0" width="{W}" height="{H}" fill="url(#body-{uid})"/>']
    if stone == "malachite":      # concentric bands, like a polished slice
        ox, oy = CX - 120, CY + 150
        for i in range(34):
            r = 30 + i * 13 + rnd.uniform(-4, 4)
            col = ("#0b5a3a", "#178a58", "#2fb67c", "#0a4a30", "#5fe0a8")[i % 5]
            w = rnd.uniform(4, 11)
            out.append(f'<circle cx="{ox}" cy="{oy}" r="{r:.1f}" fill="none" stroke="{col}" stroke-width="{w:.1f}" opacity=".75"/>')
        ox, oy = CX + 140, CY - 120   # a second eye of bands
        for i in range(10):
            r = 14 + i * 11
            out.append(f'<circle cx="{ox}" cy="{oy}" r="{r}" fill="none" stroke="{("#0a4a30", "#3fcf90")[i % 2]}" stroke-width="5" opacity=".55"/>')
    elif stone == "amber":        # warm inner glow, bubbles and dark specks of old resin
        out.append(f'<circle cx="{CX - 20}" cy="{CY - 10}" r="{R * .8:.0f}" fill="url(#core-{uid})"/>')
        for _ in range(9):
            x, y, r = CX + rnd.uniform(-90, 90), CY + rnd.uniform(-90, 90), rnd.uniform(2, 6)
            out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="#fff4d0" opacity=".45"/>')
        for _ in range(6):
            x, y, r = CX + rnd.uniform(-100, 100), CY + rnd.uniform(-100, 100), rnd.uniform(1.5, 3.5)
            out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="#4a1a04" opacity=".6"/>')
        out.append(f'<path d="M{CX - 70},{CY + 60} c20,-14 40,-6 56,-20 c10,-9 22,-8 30,-2" fill="none" stroke="#6a2a06" stroke-width="2" opacity=".45"/>')
    elif stone == "opal":         # milky body with a play of colour: flecks of fire, green and blue
        out.append(f'<circle cx="{CX - 30}" cy="{CY - 30}" r="{R * .9:.0f}" fill="#ffffff" opacity=".35"/>')
        out.append(f'<ellipse cx="{CX + 40}" cy="{CY + 50}" rx="120" ry="70" fill="#ffd9ec" opacity=".35" transform="rotate(-25 {CX + 40} {CY + 50})"/>')
        out.append(f'<ellipse cx="{CX - 60}" cy="{CY + 10}" rx="90" ry="60" fill="#d4f5ff" opacity=".4"/>')
        for _ in range(80):
            x, y = CX + rnd.uniform(-135, 135), CY + rnd.uniform(-135, 135)
            col = rnd.choice(("#ff5f86", "#37d6a6", "#4f8dff", "#ffc23d", "#a970ff", "#3fe0ff"))
            out.append(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{rnd.uniform(2.5, 8):.1f}" ry="{rnd.uniform(1.5, 4):.1f}" fill="{col}" opacity="{rnd.uniform(.35, .75):.2f}" transform="rotate({rnd.uniform(0, 180):.0f} {x:.1f} {y:.1f})"/>')
    elif stone == "aquamarine":   # clear sea-green crystal: long inner streaks and a bright core
        out.append(f'<ellipse cx="{CX - 10}" cy="{CY - 20}" rx="{R * .7:.0f}" ry="{R * .5:.0f}" fill="#eafffd" opacity=".35"/>')
        for i in range(9):
            x = CX - 120 + i * 30 + rnd.uniform(-8, 8)
            out.append(f'<path d="M{x:.1f},{CY - 150} l{rnd.uniform(-30, 30):.1f},300" stroke="#ffffff" stroke-width="{rnd.uniform(1, 3):.1f}" opacity="{rnd.uniform(.12, .3):.2f}"/>')
    elif stone == "onyx":         # black stone with fine white bands
        ox, oy = CX + 160, CY + 190
        for i in range(26):
            r = 60 + i * 12 + rnd.uniform(-3, 3)
            out.append(f'<circle cx="{ox}" cy="{oy}" r="{r:.1f}" fill="none" stroke="#efe8dc" stroke-width="{rnd.uniform(.8, 2.6):.1f}" opacity="{rnd.uniform(.25, .6):.2f}"/>')
    else:                         # obsidian: a faint violet sheen and a few conchoidal ripples
        out.append(f'<ellipse cx="{CX - 50}" cy="{CY - 60}" rx="120" ry="60" fill="#6c5aa8" opacity=".18" transform="rotate(-30 {CX - 50} {CY - 60})"/>')
        for i in range(5):
            out.append(f'<path d="M{CX - 130 + i * 18},{CY + 120} q60,-70 150,-90" fill="none" stroke="#9a8cc8" stroke-width="1.2" opacity="{.18 - i * .025:.3f}"/>')
    return "".join(out)


def die_svg(n, stone="obsidian", uid=None, size=None):
    """One face of the d20 as an SVG string. uid keeps ids unique when several dice share a page."""
    uid = uid or f"{stone}{n}"
    L = LOOK[stone]
    hexa, (A, B, C), faces = geometry()
    outline = " ".join(P(*p) for p in hexa)
    dims = f'width="{size}" height="{size}"' if size else f'width="{W}" height="{H}"'
    s = f'<svg xmlns="http://www.w3.org/2000/svg" {dims} viewBox="0 0 {W} {H}">'
    s += (f'<defs><clipPath id="die-{uid}"><polygon points="{outline}"/></clipPath>'
          f'<linearGradient id="body-{uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{L["light"]}"/>'
          f'<stop offset="1" stop-color="{L["dark"]}"/></linearGradient>'
          f'<radialGradient id="core-{uid}"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".8"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>'
          f'<linearGradient id="inlay" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e3a1"/><stop offset=".5" stop-color="#d9ac4f"/><stop offset="1" stop-color="#f0d184"/></linearGradient>'
          f'<radialGradient id="crit-{uid}"><stop offset="0" stop-color="#f6e3a1" stop-opacity=".9"/><stop offset="1" stop-color="#e59a52" stop-opacity="0"/></radialGradient>'
          f'<filter id="soft-{uid}"><feGaussianBlur stdDeviation="10"/></filter>'
          f'<filter id="ish-{uid}"><feDropShadow dx="0" dy="1.5" stdDeviation="1.2" flood-color="#000" flood-opacity=".6"/></filter></defs>')
    if n == 20:
        s += f'<circle cx="{CX}" cy="{CY}" r="{R * 1.14:.0f}" fill="url(#crit-{uid})" filter="url(#soft-{uid})"/>'
    s += f'<g clip-path="url(#die-{uid})">{material(stone, uid)}'
    for pts, a in zip(faces, SHADE):
        col = "#ffffff" if a > 0 else "#000000"
        s += f'<polygon points="{" ".join(P(*p) for p in pts)}" fill="{col}" opacity="{abs(a) * (L["gloss"] if a > 0 else 1):.2f}"/>'
    centre_fill, centre_op = ("#9b2240", .85) if n == 1 else ("#ffffff", .12)
    s += f'<polygon points="{P(*A)} {P(*B)} {P(*C)}" fill="{centre_fill}" opacity="{centre_op}"/>'
    # a glassy highlight across the upper-left facets
    s += f'<path d="M{CX - 118},{CY - 50} L{CX - 30},{CY - 128} L{CX - 14},{CY - 118} L{CX - 104},{CY - 36}Z" fill="#fff" opacity="{.22 if stone != "obsidian" else .3}"/>'
    s += "</g>"
    for pts in faces:
        s += f'<polygon points="{" ".join(P(*p) for p in pts)}" fill="none" stroke="{L["edge"]}" stroke-width="1.6" stroke-linejoin="round" opacity=".55"/>'
    s += f'<polygon points="{outline}" fill="none" stroke="{L["edge"]}" stroke-width="2.5" stroke-linejoin="round" opacity=".7"/>'
    ink = "#fbeedd" if n == 1 and stone == "amber" else L["ink"]
    size_n = 108 if n < 10 else 84
    s += (f'<text x="{CX}" y="{CY + .1 * R + size_n * .34:.1f}" text-anchor="middle" font-family="Caesar" '
          f'font-size="{size_n}" fill="{ink}" stroke="{L["rim"]}" stroke-width="2" paint-order="stroke" filter="url(#ish-{uid})">{n}</text>')
    # small numbers on two neighbouring faces, so it reads as a die
    H0, H1, H2, H3, H4, H5 = hexa
    for (x, y), m, rot in ((((H5[0] + H0[0] + A[0]) / 3, (H5[1] + H0[1] + A[1]) / 3), 8 if n != 8 else 2, -30),
                           (((H1[0] + H2[0] + B[0]) / 3, (H1[1] + H2[1] + B[1]) / 3), 14 if n != 14 else 6, 60)):
        s += (f'<text transform="translate({CX + x:.1f},{CY + y + 8:.1f}) rotate({rot})" text-anchor="middle" '
              f'font-family="Caesar" font-size="24" fill="{L["small"]}" opacity=".7">{m}</text>')
    s += "</svg>"
    return s


if __name__ == "__main__":
    for stone in STONES:
        for n in range(1, 21):
            with open(os.path.join(OUT, f"d20-{stone}-{n}.html"), "w", encoding="utf-8") as f:
                f.write(HEAD + die_svg(n, stone) + TAIL)
    print("ok d20-<stone>-1 .. 20 for", ", ".join(STONES))
