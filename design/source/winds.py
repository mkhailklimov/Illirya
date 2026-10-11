"""Wind compass: one image per wind in rules/winds.csv, the active wind glowing gold.

    python winds.py      -> build/wind-<ID>.html for every wind
    node render.js $PWD/../build/wind-W.html 720 720 ../pieces/winds/wind-W.png 1.5

Names and effect lines come from rules/winds.csv, so the game and the art agree.
Latin inscriptions use V for U (AQVILO, FAVONIVS), as the style guide asks.
"""
import csv
import math
import os

from make import HEAD, TAIL, GOLD, OUT

HERE = os.path.dirname(os.path.abspath(__file__))
WINDS_CSV = os.path.join(HERE, "..", "..", "rules", "winds.csv")

W = H = 720
CX, CY, R = 360, 300, 205
POINTS = {"N": 0, "NE": 45, "E": 90, "SE": 135, "S": 180, "SW": 225, "W": 270, "NW": 315}


def latin(word):
    return word.upper().replace("U", "V")


def xy(deg, r):
    a = math.radians(deg)
    return CX + r * math.sin(a), CY - r * math.cos(a)


def rose(r):
    s = ""
    for k, (L, wd) in enumerate([(r * 1.0, r * .15), (r * .6, r * .1)]):
        for j in range(4):
            ang = j * 90 + k * 45
            for side, col in ((-1, "#f6e3a1"), (1, "#b98a2e")):
                s += (f'<path transform="translate({CX},{CY}) rotate({ang})" '
                      f'd="M0,{-L:.1f} L{side * wd:.1f},{-wd:.1f} L0,0Z" fill="{col}"/>')
    return s


def ticks(r):
    s = ""
    for k in range(0, 32, 2):
        if k % 4 == 0:
            continue  # the eight main points carry letters instead
        a = k * 360 / 32
        l = r * .06
        x1, y1 = xy(a, r - l)
        x2, y2 = xy(a, r)
        s += f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="url(#gold)" stroke-width="2"/>'
    return s


def wedge(deg, r, half=24):
    x1, y1 = xy(deg - half, r)
    x2, y2 = xy(deg + half, r)
    return f'M{CX},{CY} L{x1:.1f},{y1:.1f} A{r},{r} 0 0 1 {x2:.1f},{y2:.1f}Z'


def streaks(deg):
    """Three curved wind strokes blowing from the wind's side toward the centre."""
    s = ""
    for off, bend in ((-11, -1), (0, 0), (11, 1)):
        x0, y0 = xy(deg + off, R * .9)
        x1, y1 = xy(deg + off * .5, R * .46)
        mx, my = xy(deg + off + bend * 3, R * .68)
        s += (f'<path d="M{x0:.1f},{y0:.1f} Q{mx:.1f},{my:.1f} {x1:.1f},{y1:.1f}" fill="none" '
              f'stroke="#fbeedd" stroke-width="5" stroke-linecap="round" opacity=".85"/>')
        # arrowhead pointing inward
        a = math.atan2(y1 - my, x1 - mx)
        for da in (2.6, -2.6):
            hx, hy = x1 + 14 * math.cos(a + da), y1 + 14 * math.sin(a + da)
            s += f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{hx:.1f}" y2="{hy:.1f}" stroke="#fbeedd" stroke-width="5" stroke-linecap="round" opacity=".85"/>'
    return s


def scene(w):
    active = w["id"]
    deg = POINTS.get(active)
    calm = deg is None
    s = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}"><defs>{GOLD}'
    s += ('<radialGradient id="sky" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="#3a2552"/>'
          '<stop offset="1" stop-color="#0d1530"/></radialGradient>'
          '<radialGradient id="field" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#4a1030"/>'
          '<stop offset="1" stop-color="#2c0819"/></radialGradient>'
          '<radialGradient id="glow"><stop offset="0" stop-color="#f6e3a1" stop-opacity=".75"/>'
          '<stop offset="1" stop-color="#d9ac4f" stop-opacity="0"/></radialGradient>'
          '<filter id="soft"><feGaussianBlur stdDeviation="6"/></filter>'
          '<filter id="tsh"><feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#0a0718" flood-opacity=".75"/></filter>'
          '</defs>')
    s += f'<rect width="{W}" height="{H}" fill="url(#sky)"/>'
    # medallion
    s += f'<circle cx="{CX}" cy="{CY}" r="{R + 22}" fill="#2c0819" opacity=".85"/>'
    s += f'<circle cx="{CX}" cy="{CY}" r="{R}" fill="url(#field)"/>'
    # active sector
    if calm:
        s += f'<circle cx="{CX}" cy="{CY}" r="{R * .45:.0f}" fill="url(#glow)" filter="url(#soft)"/>'
    else:
        s += f'<path d="{wedge(deg, R)}" fill="url(#gold)" opacity=".35" filter="url(#soft)"/>'
        s += f'<path d="{wedge(deg, R, 12)}" fill="url(#gold)" opacity=".35"/>'
    # rim: two rings and beads
    s += f'<circle cx="{CX}" cy="{CY}" r="{R}" fill="none" stroke="url(#gold)" stroke-width="5"/>'
    s += f'<circle cx="{CX}" cy="{CY}" r="{R + 16}" fill="none" stroke="url(#gold)" stroke-width="2"/>'
    for k in range(48):
        bx, by = xy(k * 7.5, R + 8)
        s += f'<circle cx="{bx:.1f}" cy="{by:.1f}" r="2.6" fill="#d9ac4f"/>'
    s += ticks(R * .9)
    s += rose(R * .7)
    s += f'<circle cx="{CX}" cy="{CY}" r="11" fill="#4a1030" stroke="url(#gold)" stroke-width="3"/>'
    if not calm:
        s += streaks(deg)
    # point letters just inside the rim
    for p, a in POINTS.items():
        x, y = xy(a, R * .8)
        on = p == active
        size, fill = (26, "#f6e3a1") if on else (20, "#cdb27a")
        bold = ' stroke="#f6e3a1" stroke-width="1"' if on else ""  # Marcellus has one weight
        s += (f'<text x="{x:.1f}" y="{y + 8:.1f}" text-anchor="middle" font-family="Marcellus" '
              f'font-size="{size}" fill="{fill}"{bold}>{p}</text>')
    s += '</svg>'
    return s


def caption(w):
    calm = w["id"] == "CALM"
    title = "TRANQVILLITAS" if calm else latin(w["latin"])
    sub = "dead calm" if calm else f"the {w['from']} wind"
    return (f'<g filter="url(#tsh)" text-anchor="middle">'
            f'<text x="{CX}" y="598" font-family="Caesar" font-size="58" letter-spacing="8" fill="url(#gold)">{title}</text>'
            f'<text x="{CX}" y="636" font-family="Marcellus" font-size="22" letter-spacing="6" fill="#f6e3a1">{sub.upper()}</text>'
            f'<text x="{CX}" y="680" font-family="Corm" font-style="italic" font-weight="500" font-size="28" fill="#fbeedd">{w["effect"]}</text>'
            f'</g>')


if __name__ == "__main__":
    with open(WINDS_CSV, encoding="utf-8-sig", newline="") as f:
        winds = list(csv.DictReader(f))
    for w in winds:
        svg = scene(w).replace("</svg>", caption(w) + "</svg>")
        with open(os.path.join(OUT, f"wind-{w['id']}.html"), "w", encoding="utf-8") as f:
            f.write(HEAD + svg + TAIL)
    print("ok", ", ".join(w["id"] for w in winds))
