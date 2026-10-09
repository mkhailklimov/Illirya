import math, random, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from make import HEAD, TAIL, GOLD, ridge, ship, sun, OUT

W, H = 1600, 900
HEAD_PATH = ("M120,440 C130,380 110,330 100,290 C80,240 80,170 120,120 C160,70 240,60 285,95 "
  "C305,112 312,140 310,165 C312,180 318,188 322,198 L317,207 C322,225 335,245 350,263 "
  "C342,271 331,273 322,272 C325,281 327,288 321,294 C328,300 326,306 319,310 "
  "C323,322 322,338 308,348 C290,356 270,352 256,350 C262,380 268,410 282,440 "
  "L304,474 C230,494 150,494 86,474Z")

def wreath(color):
    out = []
    cx, cy, rx, ry = 198, 190, 112, 100
    n = 11
    for i in range(n):
        f = i / (n - 1)
        a = math.radians(158 + 140 * f)
        x, y = cx + rx*math.cos(a), cy + ry*math.sin(a)
        tx, ty = -rx*math.sin(a), ry*math.cos(a)
        tang = math.degrees(math.atan2(ty, tx))
        L = 46 - 10 * f
        for side in (-1, 1):
            out.append(f'<path transform="translate({x:.1f},{y:.1f}) rotate({tang + side*32:.1f})" d="M0,0 Q{L*.45:.1f},{-L*.32:.1f} {L:.1f},0 Q{L*.45:.1f},{L*.32:.1f} 0,0Z" fill="{color}"/>')
    # ribbons at the back
    out.append(f'<path d="M104,262 C80,300 98,330 70,372 C90,340 82,310 112,272Z" fill="{color}"/>')
    out.append(f'<path d="M110,266 C108,310 132,330 116,384 C138,340 120,312 122,272Z" fill="{color}"/>')
    return "".join(out)

def bust(fill, detail):
    # eye, ear, hair line details cut in the detail colour
    return f"""<path d="{HEAD_PATH}" fill="{fill}"/>
{wreath(fill)}
<path d="M188,226 C212,212 230,234 220,256 C214,270 198,272 192,260" fill="none" stroke="{detail}" stroke-width="5" stroke-linecap="round"/><path d="M200,236 C210,234 214,246 206,252" fill="none" stroke="{detail}" stroke-width="3.5" stroke-linecap="round"/>
<path d="M286,206 C294,203 303,204 309,209 C302,212 293,212 286,206Z" fill="{detail}"/>
<path d="M296,190 C302,186 311,187 316,192" fill="none" stroke="{detail}" stroke-width="3" stroke-linecap="round"/>
<path d="M258,350 C246,330 236,316 240,296" fill="none" stroke="{detail}" stroke-width="3" stroke-linecap="round" opacity=".7"/>
<path d="M120,440 C170,452 240,454 282,440" fill="none" stroke="{detail}" stroke-width="4" opacity=".5"/>"""

def medallion(cx, cy, r):
    beads = "".join(f'<circle cx="{cx+(r-18)*math.cos(math.radians(a)):.1f}" cy="{cy+(r-18)*math.sin(math.radians(a)):.1f}" r="5" fill="url(#gold)"/>' for a in range(0, 360, 5))
    s = r / 300
    return f"""
<path id="legend" d="M{cx+(r-60)*math.cos(math.radians(122)):.1f},{cy+(r-60)*math.sin(math.radians(122)):.1f} A{r-60},{r-60} 0 1 1 {cx+(r-60)*math.cos(math.radians(58)):.1f},{cy+(r-60)*math.sin(math.radians(58)):.1f}" fill="none"/>
<circle cx="{cx}" cy="{cy}" r="{r+16}" fill="#0b0f22" opacity=".35"/>
<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#field)"/>
<circle cx="{cx}" cy="{cy}" r="{r-4}" fill="none" stroke="url(#gold)" stroke-width="7"/>
{beads}
<circle cx="{cx}" cy="{cy}" r="{r-36}" fill="none" stroke="url(#gold)" stroke-width="2" opacity=".8"/>
<text font-family="Cinzel" font-weight="700" font-size="{30*s:.0f}" letter-spacing="{5*s:.0f}" fill="url(#gold)"><textPath href="#legend" startOffset="50%" text-anchor="middle">TI · CAESAR · DIVI · AVG · F · AVGVSTVS</textPath></text>
<g transform="translate({cx-205*s:.1f},{cy-250*s:.1f}) scale({s*1.02:.3f})" filter="url(#tsh)">{bust("url(#gold)", "#4a1030")}</g>
"""

def temple(x, base, w, col):
    h = w * .55
    n = 8
    cw = w / (n * 2 - 1)
    cols = "".join(f'<rect x="{x + i*2*cw:.1f}" y="{base-h:.1f}" width="{cw:.1f}" height="{h:.1f}" fill="{col}"/>' for i in range(n))
    return f"""<rect x="{x-w*.06:.1f}" y="{base:.1f}" width="{w*1.12:.1f}" height="{w*.08:.1f}" fill="{col}"/>
<rect x="{x-w*.06:.1f}" y="{base+w*.06:.1f}" width="{w*1.12:.1f}" height="200" fill="{col}"/>
{cols}<rect x="{x-w*.04:.1f}" y="{base-h-w*.07:.1f}" width="{w*1.08:.1f}" height="{w*.07:.1f}" fill="{col}"/>
<path d="M{x-w*.06:.1f},{base-h-w*.07:.1f} L{x+w/2:.1f},{base-h-w*.3:.1f} L{x+w*1.06:.1f},{base-h-w*.07:.1f}Z" fill="{col}"/>"""

def aqueduct(x0, x1, top, base, col):
    span = 46
    s = f'<rect x="{x0}" y="{top}" width="{x1-x0}" height="16" fill="{col}"/>'
    d = f"M{x0},{top+14} "
    x = x0
    while x + span <= x1:
        d += f"L{x},{base} L{x+9},{base} L{x+9},{top+44} A{(span-9)/2},{(span-9)/2} 0 0 1 {x+span},{top+44} "
        x += span
    d += f"L{x},{base} L{x+9},{base} L{x+9},{top+14}Z"
    return s + f'<path d="{d}" fill="{col}"/>'

def pine(x, base, h, col):
    return (f'<path d="M{x-3},{base} L{x-2},{base-h*.75} L{x+2},{base-h*.75} L{x+3},{base}Z" fill="{col}"/>'
            f'<ellipse cx="{x}" cy="{base-h*.8:.1f}" rx="{h*.48:.1f}" ry="{h*.16:.1f}" fill="{col}"/>'
            f'<ellipse cx="{x-h*.15:.1f}" cy="{base-h*.9:.1f}" rx="{h*.3:.1f}" ry="{h*.12:.1f}" fill="{col}"/>')

def cypress(x, base, h, col):
    return f'<path d="M{x},{base-h} C{x+h*.14},{base-h*.6} {x+h*.12},{base-h*.1} {x+3},{base} L{x-3},{base} C{x-h*.12},{base-h*.1} {x-h*.14},{base-h*.6} {x},{base-h}Z" fill="{col}"/>'

def scene():
    rnd = random.Random(3)
    stars = "".join(f'<circle cx="{rnd.uniform(0,W):.0f}" cy="{rnd.uniform(0,330):.0f}" r="{rnd.uniform(.6,1.9):.1f}" fill="#fff" opacity="{rnd.uniform(.25,.8):.2f}"/>' for _ in range(160))
    hills = ""
    for seed, base, amp, col in ((11, 700, 120, "#5a4377"), (23, 735, 80, "#3a2c5c")):
        pts = ridge(seed, base, amp, 4, w=W)
        hills += f'<path d="M' + " L".join(f"{x},{y:.1f}" for x, y in pts) + f' L{W+60},{H} L-60,{H}Z" fill="{col}"/>'
    fg = "#1a1430"
    city = (aqueduct(-20, 420, 690, 800, "#2a2147") + aqueduct(1180, 1640, 700, 800, "#2a2147")
            + f'<path d="M0,780 Q400,720 800,745 T1600,770 L1600,{H} L0,{H}Z" fill="{fg}"/>'
            + temple(980, 690, 210, fg) + temple(640, 735, 120, fg)
            + pine(560, 760, 120, fg) + pine(1300, 760, 150, fg) + pine(1430, 775, 110, fg) + pine(120, 790, 130, fg)
            + cypress(900, 760, 130, fg) + cypress(925, 762, 100, fg) + cypress(1240, 770, 120, fg) + cypress(250, 790, 110, fg))
    meander = "".join(f'<path d="M{i},888 v-20 h30 v14 h-18 v-6" fill="none" stroke="url(#gold)" stroke-width="3"/>' for i in range(0, W, 40))
    standard = lambda x, y: f"""<g transform="translate({x},{y})" fill="url(#gold)">
<rect x="-4" y="0" width="8" height="300"/><rect x="-26" y="40" width="52" height="8" rx="3"/>
<circle cx="0" cy="80" r="16"/><circle cx="0" cy="126" r="16"/><circle cx="0" cy="172" r="16"/>
<path d="M-50,-6 C-40,-30 -18,-30 -8,-14 L-4,-34 C2,-46 12,-42 10,-30 L6,-14 C18,-30 40,-30 50,-6 C34,-14 18,-10 8,0 L-8,0 C-18,-10 -34,-14 -50,-6Z"/>
</g>"""
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs>{GOLD}
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1530"/><stop offset=".45" stop-color="#3a2552"/><stop offset=".72" stop-color="#a24b4f"/><stop offset=".86" stop-color="#e59a52"/></linearGradient>
<radialGradient id="glow" cx="520" cy="420" r="560" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffd98a" stop-opacity=".55"/><stop offset=".35" stop-color="#f3a25a" stop-opacity=".25"/><stop offset="1" stop-color="#f3a25a" stop-opacity="0"/></radialGradient>
<radialGradient id="field" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#6b1d45"/><stop offset=".7" stop-color="#4a1030"/><stop offset="1" stop-color="#2c0819"/></radialGradient>
<radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></radialGradient>
<filter id="tsh" x="-10%" y="-30%" width="120%" height="160%"><feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#0a0718" flood-opacity=".75"/></filter>
</defs>
<rect width="{W}" height="{H}" fill="url(#sky)"/>
{stars}
<rect width="{W}" height="{H}" fill="url(#glow)"/>
{hills}
{city}
<rect width="{W}" height="{H}" fill="url(#vig)"/>
{standard(170, 300)}{standard(870, 300)}
{medallion(520, 395, 300)}
<g filter="url(#tsh)" text-anchor="middle">
<text x="1245" y="300" font-family="Cinzel" font-weight="700" font-size="44" letter-spacing="12" fill="#f6e3a1">EMPEROR</text>
<text x="1245" y="400" font-family="Cinzel" font-weight="900" font-size="104" letter-spacing="8" fill="url(#gold)">TIBERIUS</text>
<text x="1245" y="470" font-family="Corm" font-style="italic" font-weight="500" font-size="56" fill="#fbeedd">rules Rome’s vast empire</text>
<line x1="1080" y1="520" x2="1180" y2="520" stroke="url(#gold)" stroke-width="3"/>
<line x1="1310" y1="520" x2="1410" y2="520" stroke="url(#gold)" stroke-width="3"/>
<text x="1245" y="532" font-family="Cinzel" font-weight="700" font-size="34" letter-spacing="4" fill="#f6e3a1">AD 30</text>
</g>
<rect x="0" y="858" width="{W}" height="42" fill="#0b0f22" opacity=".9"/>
{meander}
</svg>"""
    return svg

if __name__ == "__main__":
  svg = scene()
  open(os.path.join(OUT, "tiberius.html"), "w").write(HEAD + svg + TAIL)
  print("ok")
