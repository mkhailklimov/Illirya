"""The five advisors as character cards (750x1050), one PNG each in pieces/advisors/.

    python advisors.py            writes build/advisor-<id>.html for every advisor
    node render.js <html> 750 1050 ../pieces/advisors/<id>.png 1.5

Names, titles, what they watch and their ability come from rules/advisors.csv,
so the cards change with the game rules. The portrait is the coin bust from
tiberius.py with each advisor's own headgear and beard.
"""
import csv, math, os, sys, textwrap
sys.path.insert(0, os.path.dirname(__file__))
from make import HEAD, TAIL, GOLD, sun, ship, OUT
from tiberius import HEAD_PATH

W, H = 750, 1050
RULES = os.path.join(os.path.dirname(__file__), "..", "..", "rules", "advisors.csv")
DETAIL = "#4a1030"
CRIMSON = "#9b2240"
MOOD_START, MOOD_MAX = 3, 5      # as in rules/play.py

LEGEND = {
    "fleet": "EPICADVS · LIBVRNVS · NAVARCHVS",
    "general": "M · ANTISTIVS · PRAEFECTVS · COH",
    "economist": "NICANDER · EPIDAVRIVS · MERCATOR",
    "treasurer": "FELIX · DISPENSATOR · ACRVVII",
    "priest": "T · VOLVSIVS · HARVSPEX",
}


# --- headgear and beards, drawn on the bust's own coordinates (see tiberius.HEAD_PATH) ---
def line(d, w=4, op=1):
    return f'<path d="{d}" fill="none" stroke="{DETAIL}" stroke-width="{w}" stroke-linecap="round" opacity="{op}"/>'


def face_details():
    """Eye, brow and ear, as on the Tiberius coin."""
    return (line("M188,226 C212,212 230,234 220,256 C214,270 198,272 192,260", 5)
            + line("M200,236 C210,234 214,246 206,252", 3.5)
            + f'<path d="M286,206 C294,203 303,204 309,209 C302,212 293,212 286,206Z" fill="{DETAIL}"/>'
            + line("M296,190 C302,186 311,187 316,192", 3)
            + line("M120,440 C170,452 240,454 282,440", 4, .5))


def beard(full=True):
    """A beard that juts past the chin, with curls cut in the detail colour."""
    if full:
        shape = ("M222,212 C232,286 240,322 252,352 C266,382 292,404 318,398 C338,392 342,366 334,344 "
                 "C330,330 326,318 322,310 C312,306 302,304 294,302 C276,300 262,290 252,270 C246,250 246,228 250,206Z")
    else:
        shape = ("M232,250 C236,290 246,326 260,350 C274,372 298,382 316,376 C330,370 332,352 326,336 "
                 "C320,322 314,314 306,310 C292,306 276,300 264,288 C254,276 250,262 248,250Z")
    curls = "".join(line(f"M{x},{y} c6,-6 14,-6 18,2", 3, .8) for x, y in
                    ((246, 300), (262, 330), (282, 356), (300, 378), (270, 300), (290, 330), (308, 350)))
    tache = f'<path d="M292,300 C302,292 318,290 330,296 C322,304 304,306 292,300Z" fill="url(#gold)"/>' + line("M294,302 C306,300 318,300 328,298", 2.5, .8)
    return f'<path d="{shape}" fill="url(#gold)"/>' + curls + tache


def pilos():
    """Epicadus: the sailor's conical felt cap (pilos)."""
    return ('<path d="M84,214 C92,150 124,90 170,30 C178,20 188,20 196,30 C240,84 300,120 322,184 '
            'C252,206 156,214 84,214Z" fill="url(#gold)"/>'
            + line("M86,206 C160,204 250,196 318,176", 6, .9)
            + line("M150,60 C190,70 230,100 260,140", 3, .5))


def helmet():
    """Antistius: an Imperial Gallic helmet with a crimson crest."""
    crest = '<g transform="translate(0,26)">' + (f'<path d="M110,92 C120,20 200,-14 268,10 C300,22 318,48 322,72 C300,60 270,52 240,56 '
             f'C200,40 150,56 132,98Z" fill="{CRIMSON}"/>'
             + "".join(line(f"M{x},{y} l{dx},{dy}", 2.5, .55) for x, y, dx, dy in
                       ((150, 40, 10, 30), (180, 24, 8, 30), (212, 16, 6, 32), (244, 18, 2, 32), (274, 30, -2, 30)))) + '</g>'
    bowl = ('<path d="M74,232 C62,140 120,70 210,66 C282,64 330,110 336,176 L318,180 C300,150 256,130 206,132 '
            'C150,136 118,176 112,232Z" fill="url(#gold)"/>'
            '<path d="M76,226 L112,226 L114,300 C100,306 72,312 40,318 C52,290 70,262 76,226Z" fill="url(#gold)"/>'  # neck guard
            '<path d="M184,176 L238,176 C246,220 244,270 228,302 C214,296 196,280 188,256 C182,226 182,200 184,176Z" fill="url(#gold)"/>'  # cheek guard
            '<path d="M232,170 L344,182 L340,192 L236,184Z" fill="url(#gold)"/>')  # brow guard
    marks = (line("M112,232 C116,180 150,140 206,136 C256,134 296,152 318,180", 4, .8)
             + line("M190,196 C200,230 210,260 226,292", 3, .6)
             + line("M84,250 L110,250", 3, .6) + line("M70,280 L112,278", 3, .6))
    return crest + bowl + marks


def taenia():
    """Nikandros: curly Greek hair under a plain headband, ribbons behind."""
    curls = "".join(f'<circle cx="{x}" cy="{y}" r="15" fill="url(#gold)"/>' for x, y in
                    ((108, 150), (128, 118), (162, 96), (200, 86), (238, 90), (272, 108), (296, 132),
                     (96, 190), (104, 228)))
    band = line("M300,150 C240,136 160,148 98,196", 9, .95)
    ribbons = ('<path d="M100,196 C76,230 88,262 64,300 C84,272 82,246 108,206Z" fill="url(#gold)"/>'
               '<path d="M104,200 C100,240 120,262 108,306 C128,266 114,240 116,206Z" fill="url(#gold)"/>')
    texture = "".join(line(f"M{x},{y} c5,-5 12,-5 15,1", 2.5, .6) for x, y in
                      ((130, 120), (170, 100), (210, 92), (250, 100), (112, 170), (102, 214)))
    return curls + ribbons + band + texture


def cropped():
    """Felix: a freedman's cropped hair, no wreath."""
    return (line("M302,150 C270,122 200,108 150,128 C116,142 98,176 104,214 C108,240 128,260 150,268", 4, .85)
            + "".join(line(f"M{x},{y} l{dx},{dy}", 2.5, .5) for x, y, dx, dy in
                      ((140, 150, 8, -10), (170, 136, 8, -10), (200, 128, 8, -10), (232, 128, 8, -10),
                       (262, 136, 8, -10), (126, 186, 8, -10), (124, 222, 8, -10))))


def veil():
    """Tertius: head covered by a fold of his toga (capite velato), as Romans sacrificed."""
    drape = ('<path d="M296,140 C296,74 236,34 166,40 C88,48 46,118 52,214 C56,300 50,390 30,494 '
             'L124,494 C128,420 116,350 124,280 C130,240 150,200 186,170 C220,146 260,140 296,140Z" fill="url(#gold)"/>')
    edge = line("M296,140 C258,142 222,154 190,174 C150,204 132,244 126,290 C120,350 128,420 124,494", 5, .9)
    folds = (line("M110,90 C86,150 82,230 88,320", 3, .5) + line("M150,60 C116,120 104,210 104,300", 3, .5)
             + line("M70,240 C70,330 62,410 52,480", 3, .5))
    return drape + edge + folds


PORTRAIT = {
    "fleet": lambda: pilos() + beard(True),
    "general": lambda: helmet(),
    "economist": lambda: taenia() + beard(False),
    "treasurer": lambda: cropped(),
    "priest": lambda: veil(),
}


def bust(aid):
    return (f'<path d="{HEAD_PATH}" fill="url(#gold)"/>' + face_details() + PORTRAIT[aid]())


# --- emblems for the badge under the portrait (drawn in a 120x120 box) ---
def emblem(aid):
    g = "url(#gold)"
    if aid == "fleet":
        return f'<g transform="translate(0,4) scale(0.16)">{ship(sail=CRIMSON, hull="#f6e3a1", emblem="#f6e3a1")}</g>'
    if aid == "general":       # legion standard
        return (f'<g fill="{g}"><rect x="56" y="22" width="8" height="92"/><rect x="40" y="36" width="40" height="6" rx="3"/>'
                f'<circle cx="60" cy="58" r="9"/><circle cx="60" cy="80" r="9"/>'
                f'<path d="M34,22 C40,8 52,8 56,16 L58,4 C60,0 64,0 64,4 L64,16 C70,8 82,8 86,22 C76,18 68,20 64,26 L56,26 C52,20 44,18 34,22Z"/></g>')
    if aid == "economist":     # amphora
        return (f'<path d="M50,12 L70,12 L68,26 C88,36 92,62 84,84 C78,100 68,108 60,116 C52,108 42,100 36,84 '
                f'C28,62 32,36 52,26Z" fill="{g}"/>'
                f'<path d="M50,30 C36,30 34,46 44,50 M70,30 C84,30 86,46 76,50" fill="none" stroke="{g}" stroke-width="5"/>')
    if aid == "treasurer":     # stack of coins
        return "".join(f'<ellipse cx="60" cy="{y}" rx="34" ry="11" fill="{g}" stroke="{DETAIL}" stroke-width="2"/>'
                       for y in (98, 84, 70, 56)) + f'<circle cx="60" cy="56" r="5" fill="{DETAIL}"/>'
    # priest: the lituus, the augur's curved staff
    return (f'<path d="M48,116 L58,40 C60,22 76,12 88,20 C98,28 94,44 82,44 C74,44 72,34 78,32" '
            f'fill="none" stroke="{g}" stroke-width="9" stroke-linecap="round"/>')


# --- the card ---
def medallion(aid, cx, cy, r):
    beads = "".join(f'<circle cx="{cx+(r-16)*math.cos(math.radians(a)):.1f}" cy="{cy+(r-16)*math.sin(math.radians(a)):.1f}" r="4" fill="url(#gold)"/>' for a in range(0, 360, 6))
    s = r / 300
    return f"""
<path id="legend-{aid}" d="M{cx+(r-52)*math.cos(math.radians(122)):.1f},{cy+(r-52)*math.sin(math.radians(122)):.1f} A{r-52},{r-52} 0 1 1 {cx+(r-52)*math.cos(math.radians(58)):.1f},{cy+(r-52)*math.sin(math.radians(58)):.1f}" fill="none"/>
<circle cx="{cx}" cy="{cy}" r="{r+12}" fill="#0b0f22" opacity=".4"/>
<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#field)"/>
<circle cx="{cx}" cy="{cy}" r="{r-4}" fill="none" stroke="url(#gold)" stroke-width="6"/>
{beads}
<circle cx="{cx}" cy="{cy}" r="{r-30}" fill="none" stroke="url(#gold)" stroke-width="2" opacity=".8"/>
<text font-family="Marcellus" font-size="{26*s:.0f}" letter-spacing="{4*s:.0f}" fill="url(#gold)"><textPath href="#legend-{aid}" startOffset="50%" text-anchor="middle">{LEGEND[aid]}</textPath></text>
<g clip-path="url(#coin-{aid})"><g transform="translate({cx-195*s:.1f},{cy-215*s:.1f}) scale({s*0.95:.3f})" filter="url(#tsh)">{bust(aid)}</g></g>
<clipPath id="coin-{aid}"><circle cx="{cx}" cy="{cy}" r="{r-58}"/></clipPath>
"""


def mood_pips(cx, y, mood):
    out = []
    for i in range(MOOD_MAX):
        x = cx + (i - (MOOD_MAX - 1) / 2) * 44
        leaf = f"M{x - 13},{y} Q{x},{y - 13} {x + 13},{y} Q{x},{y + 13} {x - 13},{y}Z"
        out.append(f'<path d="{leaf}" fill="url(#gold)"/>' if i < mood else
                   f'<path d="{leaf}" fill="none" stroke="#d9ac4f" stroke-width="2.5" opacity=".7"/>')
    return "".join(out)


def card(a):
    aid = a["id"]
    uses = "ONCE PER GOVERNORSHIP" if a["ability_uses"] == "game" else "ONCE A YEAR"
    text_lines = textwrap.wrap(a["ability_text"], 46)
    ability_text = "".join(f'<tspan x="375" dy="{0 if i == 0 else 33}">{t}</tspan>' for i, t in enumerate(text_lines))
    meander = "".join(f'<path d="M{i},1022 v-18 h26 v12 h-16 v-6" fill="none" stroke="url(#gold)" stroke-width="2.5"/>' for i in range(40, W - 40, 34))
    name = a["name"].upper()
    name_size = 44 if len(name) <= 18 else 38
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs>{GOLD}
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1530"/><stop offset=".55" stop-color="#2a1d48"/><stop offset="1" stop-color="#3a2552"/></linearGradient>
<radialGradient id="glow" cx="375" cy="380" r="380" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffd98a" stop-opacity=".35"/><stop offset=".5" stop-color="#f3a25a" stop-opacity=".12"/><stop offset="1" stop-color="#f3a25a" stop-opacity="0"/></radialGradient>
<radialGradient id="field" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#6b1d45"/><stop offset=".7" stop-color="#4a1030"/><stop offset="1" stop-color="#2c0819"/></radialGradient>
<filter id="tsh" x="-10%" y="-30%" width="120%" height="160%"><feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#0a0718" flood-opacity=".75"/></filter>
</defs>
<rect width="{W}" height="{H}" rx="34" fill="url(#bg)"/>
<rect width="{W}" height="{H}" rx="34" fill="url(#glow)"/>
<rect x="16" y="16" width="{W - 32}" height="{H - 32}" rx="24" fill="none" stroke="url(#gold)" stroke-width="5"/>
<rect x="28" y="28" width="{W - 56}" height="{H - 56}" rx="16" fill="none" stroke="url(#gold)" stroke-width="1.5" opacity=".6"/>
<text x="375" y="88" text-anchor="middle" font-family="Marcellus" font-size="28" letter-spacing="7" fill="#f6e3a1" filter="url(#tsh)">{a['title'].upper()}</text>
{medallion(aid, 375, 340, 220)}
<circle cx="375" cy="566" r="50" fill="#2c0819" stroke="url(#gold)" stroke-width="4"/>
<g transform="translate(315,506)">{emblem(aid)}</g>
<text x="375" y="668" text-anchor="middle" font-family="Marcellus" font-size="{name_size}" letter-spacing="4" fill="url(#gold)" stroke="url(#gold)" stroke-width="1" filter="url(#tsh)">{name}</text>
<text x="375" y="708" text-anchor="middle" font-family="Corm" font-style="italic" font-weight="500" font-size="27" fill="#efe0b4">watches {a['watches']}</text>
<text x="375" y="752" text-anchor="middle" font-family="Marcellus" font-size="18" letter-spacing="5" fill="#d9ac4f">MOOD</text>
{mood_pips(375, 782, MOOD_START)}
<rect x="62" y="814" width="626" height="180" rx="14" fill="#2c0819" opacity=".85" stroke="url(#gold)" stroke-width="2"/>
<text x="375" y="854" text-anchor="middle" font-family="Marcellus" font-size="30" letter-spacing="4" fill="url(#gold)">{a['ability_name'].upper()}</text>
<text x="375" y="880" text-anchor="middle" font-family="Marcellus" font-size="15" letter-spacing="4" fill="#d9ac4f" opacity=".85">{uses}</text>
<text x="375" y="916" text-anchor="middle" font-family="Corm" font-style="italic" font-weight="500" font-size="27" fill="#fbeedd">{ability_text}</text>
{meander}
</svg>"""


if __name__ == "__main__":
    with open(RULES, encoding="utf-8-sig", newline="") as f:
        advisors = list(csv.DictReader(f))
    for a in advisors:
        path = os.path.join(OUT, f"advisor-{a['id']}.html")
        open(path, "w", encoding="utf-8").write(HEAD + card(a) + TAIL)
        print(path)
