"""The five advisors as character cards (750x1050), one PNG each in pieces/advisors/.

    python advisors.py            writes build/advisor-<id>.html for every advisor
    node render.js <html> 750 1050 ../pieces/advisors/<id>.png 1.5

Names, titles, what they watch and their ability come from rules/advisors.csv,
so the cards change with the game rules. The portrait is the coin bust from
tiberius.py with each advisor's own headgear and beard, and
no props: his sign (galley, vine rod, scales, coins, lituus) is the badge under it. Nikandros wears a petasos. Six qualities (1-5) sit under
the name.
"""
import csv, math, os, sys, textwrap
sys.path.insert(0, os.path.dirname(__file__))
from make import HEAD, TAIL, GOLD, OUT
from tiberius import HEAD_PATH

W, H = 750, 1050
RULES = os.path.join(os.path.dirname(__file__), "..", "..", "rules", "advisors.csv")
DETAIL = "#4a1030"
CRIMSON = "#9b2240"
MOOD_START, MOOD_MAX = 3, 5      # as in rules/play.py
STATS = [("experience", "EXPERIENCE"), ("decisions", "DECISIONS"), ("strategy", "STRATEGY"),
         ("administration", "ADMINISTRATION"), ("persuasion", "PERSUASION"), ("logic", "LOGIC")]
STAT_MAX = 5

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


def petasos():
    """Nikandros: the Greek traveller's wide-brimmed hat, curls showing at the nape."""
    curls = "".join(f'<circle cx="{x}" cy="{y}" r="14" fill="url(#gold)"/>' for x, y in ((104, 196), (98, 232), (112, 262)))
    crown = 'M112,156 C108,84 160,46 216,46 C276,48 304,96 300,140 C236,148 168,156 112,156Z'
    brim = 'M24,178 C70,138 270,112 368,132 C376,140 368,150 352,154 C260,150 120,170 40,192 C28,192 18,186 24,178Z'
    return (curls + f'<path d="{crown}" fill="url(#gold)"/>' + f'<path d="{brim}" fill="url(#gold)"/>'
            + line("M40,184 C120,164 260,146 360,142", 4, .8) + line("M116,150 C176,142 240,138 298,134", 5, .9)
            + line("M150,92 C180,74 220,70 252,80", 3, .45) + line("M300,150 C306,200 300,250 290,290", 3, .7))


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


# --- what each man carries, so the portraits read apart at a glance (bust coordinates) ---
def outlined(d, w=3):
    """A gold shape with a dark edge, so it stands off the gold bust."""
    return f'<path d="{d}" fill="url(#gold)" stroke="{DETAIL}" stroke-width="{w}" stroke-linejoin="round"/>'


def vexillum():
    """Antistius: the cavalry pennant of his cohort on a spear, held before him."""
    pole = outlined("M368,494 L366,112 L378,112 L382,494Z", 3)
    tip = outlined("M372,52 L386,90 L372,114 L358,90Z", 3)
    bar = outlined("M332,108 L412,108 L412,120 L332,120Z", 2.5)
    cloth = (f'<path d="M336,120 L408,120 L408,222 L394,210 L380,224 L366,210 L352,224 L338,210 L336,222Z" '
             f'fill="{CRIMSON}" stroke="{DETAIL}" stroke-width="3" stroke-linejoin="round"/>')
    fringe = "".join(line(f"M{x},218 l0,14", 3, .9) for x in range(340, 408, 9))
    mark = (f'<circle cx="372" cy="164" r="17" fill="none" stroke="url(#gold)" stroke-width="5"/>'
            f'<circle cx="372" cy="164" r="6" fill="url(#gold)"/>'
            + "".join(f'<path d="M372,164 l{dx},{dy}" stroke="url(#gold)" stroke-width="3"/>' for dx, dy in ((0, -26), (0, 26), (-26, 0), (26, 0))))
    return pole + bar + cloth + fringe + mark + tip


def vitis():
    """Antistius: the vine rod (vitis) of a Roman officer, held slanting before him."""
    d = "M318,494 L404,96"
    knots = "".join(f'<ellipse cx="{318 + 86 * f:.0f}" cy="{494 - 398 * f:.0f}" rx="13" ry="7" transform="rotate(-12 {318 + 86 * f:.0f} {494 - 398 * f:.0f})" '
                    f'fill="url(#gold)" stroke="{DETAIL}" stroke-width="3"/>' for f in (.18, .42, .66, .9))
    return (f'<path d="{d}" fill="none" stroke="{DETAIL}" stroke-width="24" stroke-linecap="round"/>'
            f'<path d="{d}" fill="none" stroke="url(#gold)" stroke-width="15" stroke-linecap="round"/>' + knots)


def lituus_held():
    """Tertius: the augur's curved staff raised before his face."""
    d = "M402,494 L384,184 C382,124 346,104 324,128 C306,150 320,178 344,176 C360,174 360,154 348,150"
    return (f'<path d="{d}" fill="none" stroke="{DETAIL}" stroke-width="22" stroke-linecap="round"/>'
            f'<path d="{d}" fill="none" stroke="url(#gold)" stroke-width="13" stroke-linecap="round"/>')


def amulet():
    """Tertius: a bulla, the round gold amulet against evil, on a cord at his throat."""
    cord = line("M126,352 C160,396 220,410 262,378", 5, .95)
    return (cord + f'<circle cx="200" cy="420" r="30" fill="{CRIMSON}" stroke="{DETAIL}" stroke-width="3"/>'
            + f'<circle cx="200" cy="420" r="25" fill="none" stroke="url(#gold)" stroke-width="7"/>'
            + f'<circle cx="200" cy="420" r="9" fill="url(#gold)"/>' + line("M200,392 L200,402", 4, 1))


def trident():
    """Epicadus: Neptune's trident behind his shoulder."""
    shaft = outlined("M46,494 L50,132 L58,132 L56,494Z", 2.5)
    head = outlined("M26,140 L82,140 L82,148 L58,150 L58,156 L50,156 L50,150 L26,148Z", 2)
    tines = "".join(outlined(f"M{x - 4},142 L{x - 4},{top + 14} L{x - 9},{top + 18} L{x},{top} L{x + 9},{top + 18} L{x + 4},{top + 14} L{x + 4},142Z", 2)
                    for x, top in ((30, 86), (54, 70), (78, 86)))
    return shaft + head + tines


PORTRAIT = {
    "fleet": lambda: pilos() + beard(True),
    "general": lambda: helmet(),
    "economist": lambda: petasos() + beard(False),
    "treasurer": lambda: cropped(),
    "priest": lambda: veil(),
}


# Nothing held: each man's sign sits outside the portrait, in the badge under it (and on his coin in the game).
# trident(), vitis(), lituus_held() and amulet() are kept for other pieces.
BEHIND = {}
IN_FRONT = {}


def bust(aid):
    back = BEHIND.get(aid, str)()
    front = IN_FRONT.get(aid, str)()
    return back + f'<path d="{HEAD_PATH}" fill="url(#gold)"/>' + face_details() + PORTRAIT[aid]() + front


# --- emblems for the badge under the portrait (drawn in a 120x120 box) ---
def emblem(aid):
    g = "url(#gold)"
    if aid == "fleet":
        # a bold galley that still reads at coin-badge size: square sail, hull, curled stern, oars
        return (f'<path d="M57,10 h6 v66 h-6Z" fill="{g}"/>'
                f'<path d="M26,18 H94 Q99,42 92,64 H28 Q21,42 26,18Z" fill="{g}"/>'
                f'<path d="M4,74 H108 C116,74 120,66 118,56 C124,62 124,80 110,88 L96,96 H22Z" fill="{g}"/>'
                + "".join(f'<path d="M{24 + i * 14},96 l-8,18" stroke="{g}" stroke-width="5" stroke-linecap="round"/>' for i in range(6)))
    if aid == "general":       # the vine rod (vitis), knotted
        return (f'<path d="M30,112 L90,10" fill="none" stroke="{g}" stroke-width="11" stroke-linecap="round"/>'
                + "".join(f'<ellipse cx="{30 + 60 * f:.0f}" cy="{112 - 102 * f:.0f}" rx="10" ry="5.5" transform="rotate(-30 {30 + 60 * f:.0f} {112 - 102 * f:.0f})" fill="{g}" stroke="{DETAIL}" stroke-width="2"/>'
                          for f in (.2, .45, .7, .92)))
    if aid == "economist":     # merchant's scales
        pan = lambda x: (f'<path d="M{x},30 L{x - 18},70 M{x},30 L{x + 18},70" stroke="{g}" stroke-width="3" fill="none"/>'
                         f'<path d="M{x - 22},70 L{x + 22},70 C{x + 18},86 {x - 18},86 {x - 22},70Z" fill="{g}"/>')
        return (f'<path d="M60,10 L60,108 M38,112 L82,112 M16,30 L104,30" stroke="{g}" stroke-width="7" stroke-linecap="round" fill="none"/>'
                f'<circle cx="60" cy="12" r="7" fill="{g}"/>' + pan(24) + pan(96))
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


def stat_panel(a, y0):
    """Six qualities in two columns: label on the left, five small diamonds on the right."""
    out = []
    for i, (key, label) in enumerate(STATS):
        col, row = i % 2, i // 2
        x, y = (86, 392)[col], y0 + row * 32
        out.append(f'<text x="{x}" y="{y + 6}" font-family="Marcellus" font-size="15" letter-spacing="1.5" fill="#efe0b4">{label}</text>')
        v = int(a.get(key) or 0)
        for k in range(STAT_MAX):
            cx = x + 198 + k * 16
            d = f"M{cx},{y - 7} L{cx + 6},{y} L{cx},{y + 7} L{cx - 6},{y}Z"
            out.append(f'<path d="{d}" fill="url(#gold)"/>' if k < v else
                       f'<path d="{d}" fill="none" stroke="#d9ac4f" stroke-width="1.5" opacity=".6"/>')
    return "".join(out)


def card(a):
    aid = a["id"]
    uses = "ONCE PER GOVERNORSHIP" if a["ability_uses"] == "game" else "ONCE A YEAR"
    text_lines = textwrap.wrap(a["ability_text"], 48)
    ability_text = "".join(f'<tspan x="375" dy="{0 if i == 0 else 30}">{t}</tspan>' for i, t in enumerate(text_lines))
    meander = "".join(f'<path d="M{i},1022 v-18 h26 v12 h-16 v-6" fill="none" stroke="url(#gold)" stroke-width="2.5"/>' for i in range(40, W - 40, 34))
    name = a["name"].upper()
    name_size = 50 if len(name) <= 18 else 42
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
<text x="375" y="78" text-anchor="middle" font-family="Marcellus" font-size="26" letter-spacing="7" fill="#f6e3a1" filter="url(#tsh)">{a['title'].upper()}</text>
{medallion(aid, 375, 300, 196)}
<circle cx="375" cy="512" r="44" fill="#2c0819" stroke="url(#gold)" stroke-width="4"/>
<g transform="translate(327,464) scale(.8)">{emblem(aid)}</g>
<text x="375" y="606" text-anchor="middle" font-family="Caesar" font-size="{name_size}" letter-spacing="2" fill="url(#gold)" filter="url(#tsh)">{name}</text>
<text x="375" y="642" text-anchor="middle" font-family="Marcellus" font-size="22" letter-spacing="1" fill="#efe0b4">watches {a['watches']}</text>
{stat_panel(a, 682)}
<text x="300" y="784" text-anchor="end" font-family="Marcellus" font-size="16" letter-spacing="5" fill="#d9ac4f">MOOD</text>
{mood_pips(408, 778, MOOD_START)}
<rect x="62" y="804" width="626" height="192" rx="14" fill="#2c0819" opacity=".85" stroke="url(#gold)" stroke-width="2"/>
<text x="375" y="848" text-anchor="middle" font-family="Caesar" font-size="34" letter-spacing="2" fill="url(#gold)">{a['ability_name'].upper()}</text>
<text x="375" y="874" text-anchor="middle" font-family="Marcellus" font-size="14" letter-spacing="4" fill="#d9ac4f" opacity=".85">{uses}</text>
<text x="375" y="910" text-anchor="middle" font-family="Marcellus" font-size="22" fill="#fbeedd">{ability_text}</text>
{meander}
</svg>"""


if __name__ == "__main__":
    with open(RULES, encoding="utf-8-sig", newline="") as f:
        advisors = list(csv.DictReader(f))
    for a in advisors:
        path = os.path.join(OUT, f"advisor-{a['id']}.html")
        open(path, "w", encoding="utf-8").write(HEAD + card(a) + TAIL)
        print(path)
