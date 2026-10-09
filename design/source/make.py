import math, random, os
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'build')
os.makedirs(OUT, exist_ok=True)
FONTS = os.path.join(HERE, 'fonts')
HEAD = f"""<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:Cinzel;src:url('file://{FONTS}/cinzel.woff2') format('woff2');font-weight:400 900}}
@font-face{{font-family:Corm;src:url('file://{FONTS}/cormorant-italic.woff2') format('woff2');font-style:italic;font-weight:300 700}}
html,body{{margin:0;padding:0;background:transparent}} svg{{display:block}}
</style></head><body>"""
TAIL = "</body></html>"

GOLD = """<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#f6e3a1"/><stop offset=".45" stop-color="#d9ac4f"/><stop offset=".7" stop-color="#b98a2e"/><stop offset="1" stop-color="#f0d184"/></linearGradient>"""

def leaf_branch(cx, cy, R, t0, t1, n, color):
    """Left laurel branch from angle t0 (deg, bottom) to t1 (upper left)."""
    parts = []
    # stem
    pts = []
    for i in range(41):
        t = math.radians(t0 + (t1 - t0) * i / 40)
        pts.append(f"{cx+R*math.cos(t):.1f},{cy+R*math.sin(t):.1f}")
    parts.append(f'<polyline points="{" ".join(pts)}" fill="none" stroke="{color}" stroke-width="5" stroke-linecap="round"/>')
    for i in range(n):
        f = (i + 0.5) / n
        t = math.radians(t0 + (t1 - t0) * f)
        x, y = cx + R*math.cos(t), cy + R*math.sin(t)
        tang = math.degrees(math.atan2(math.cos(t), -math.sin(t)))
        L = 62 - 26 * f
        for side, off in ((-1, 0), (1, 0)):
            rot = tang + side * 38
            parts.append(f'<path transform="translate({x:.1f},{y:.1f}) rotate({rot:.1f})" d="M0,0 Q{L*.45:.1f},{-L*.3:.1f} {L:.1f},0 Q{L*.45:.1f},{L*.3:.1f} 0,0Z" fill="{color}"/>')
        if i % 3 == 1:
            bx, by = cx + (R-22)*math.cos(t+.05), cy + (R-22)*math.sin(t+.05)
            parts.append(f'<circle cx="{bx:.1f}" cy="{by:.1f}" r="6" fill="{color}"/>')
    # tip leaf
    t = math.radians(t1)
    x, y = cx + R*math.cos(t), cy + R*math.sin(t)
    tang = math.degrees(math.atan2(math.cos(t), -math.sin(t)))
    parts.append(f'<path transform="translate({x:.1f},{y:.1f}) rotate({tang:.1f})" d="M0,0 Q16,-9 38,0 Q16,9 0,0Z" fill="{color}"/>')
    return "\n".join(parts)

def sun(cx, cy, r, color, rays=8):
    s = [f'<circle cx="{cx}" cy="{cy}" r="{r*.42:.1f}" fill="{color}"/>']
    for k in range(rays):
        a = math.radians(k * 360 / rays - 90)
        a1, a2 = a - math.radians(9), a + math.radians(9)
        r0 = r * .55
        s.append(f'<path d="M{cx+r0*math.cos(a1):.1f},{cy+r0*math.sin(a1):.1f} L{cx+r*math.cos(a):.1f},{cy+r*math.sin(a):.1f} L{cx+r0*math.cos(a2):.1f},{cy+r0*math.sin(a2):.1f}Z" fill="{color}"/>')
    return "".join(s)

# ---------- Profile A: coin ----------
def profile_coin():
    c = 360
    beads = "".join(f'<circle cx="{c+322*math.cos(math.radians(a)):.1f}" cy="{c+322*math.sin(math.radians(a)):.1f}" r="5.5" fill="url(#gold)"/>' for a in range(0, 360, 5))
    left = leaf_branch(c, c, 255, 102, 238, 13, "url(#gold)")
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="720" height="720" viewBox="0 0 720 720">
<defs>{GOLD}
<radialGradient id="field" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#6b1d45"/><stop offset=".7" stop-color="#4a1030"/><stop offset="1" stop-color="#2c0819"/></radialGradient>
<filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#14030b" flood-opacity=".6"/></filter>
</defs>
<rect width="720" height="720" fill="#2c0819"/>
<circle cx="360" cy="360" r="360" fill="url(#field)"/>
<circle cx="360" cy="360" r="344" fill="none" stroke="url(#gold)" stroke-width="6"/>
{beads}
<circle cx="360" cy="360" r="300" fill="none" stroke="url(#gold)" stroke-width="2.5" opacity=".8"/>
<g filter="url(#sh)">
<g>{left}</g>
<g transform="translate(720,0) scale(-1,1)">{left}</g>
{sun(360, 112, 30, "url(#gold)")}
<text x="360" y="420" text-anchor="middle" font-family="Cinzel" font-weight="900" font-size="300" fill="url(#gold)">I</text>
<text x="360" y="508" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="58" letter-spacing="6" fill="url(#gold)">AD 30</text>
</g>
</svg>"""
    return svg

# ---------- Ship (liburna) ----------
def ship(sail="#9b2240", hull="#efe0b4", emblem="#e3b552", oars=True):
    o = ""
    if oars:
        o = "".join(f'<line x1="{x}" y1="458" x2="{x-26}" y2="512" stroke="{hull}" stroke-width="6" stroke-linecap="round"/>' for x in range(232, 520, 30))
    return f"""
<line x1="360" y1="190" x2="360" y2="450" stroke="{hull}" stroke-width="9" stroke-linecap="round"/>
<path d="M238,214 L482,214" stroke="{hull}" stroke-width="9" stroke-linecap="round"/>
<path d="M246,222 L474,222 Q492,305 466,392 Q360,410 254,392 Q228,305 246,222Z" fill="{sail}"/>
<g transform="translate(360,305)">{sun(0,0,48,emblem)}</g>
<line x1="246" y1="226" x2="200" y2="438" stroke="{hull}" stroke-width="3" opacity=".7"/>
<line x1="474" y1="226" x2="530" y2="438" stroke="{hull}" stroke-width="3" opacity=".7"/>
{o}
<path d="M124,442 L196,436 L212,444 Q360,462 520,442 C552,436 572,410 576,372 C578,346 596,332 614,338 C622,341 624,350 616,354 C604,350 594,356 594,374 C592,430 566,466 516,476 Q360,500 222,478 L200,460 L124,456Z" fill="{hull}"/>
"""

def profile_ship():
    waves = ""
    for i, y in enumerate((520, 556, 592)):
        d = f"M40,{y} " + " ".join(f"q30,-16 60,0 t60,0" for _ in range(11))
        waves += f'<path d="{d}" fill="none" stroke="#5fa3c7" stroke-width="7" stroke-linecap="round" opacity="{.85 - i*.22:.2f}"/>'
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="720" height="720" viewBox="0 0 720 720">
<defs>{GOLD}
<radialGradient id="sea" cx=".5" cy=".38" r=".65"><stop offset="0" stop-color="#1d5d86"/><stop offset=".65" stop-color="#0f3c5c"/><stop offset="1" stop-color="#08243a"/></radialGradient>
<clipPath id="inner"><circle cx="360" cy="360" r="318"/></clipPath>
<path id="top" d="M100,360 A260,260 0 0 1 620,360"/>
<path id="bot" d="M78,360 A282,282 0 0 0 642,360"/>
</defs>
<rect width="720" height="720" fill="#08243a"/>
<circle cx="360" cy="360" r="360" fill="url(#sea)"/>
<g clip-path="url(#inner)" transform="translate(0,-10)">
{waves}
{ship()}
</g>
<circle cx="360" cy="360" r="318" fill="none" stroke="url(#gold)" stroke-width="4"/>
<circle cx="360" cy="360" r="346" fill="none" stroke="url(#gold)" stroke-width="6"/>
<text font-family="Cinzel" font-weight="900" font-size="46" letter-spacing="10" fill="url(#gold)"><textPath href="#top" startOffset="50%" text-anchor="middle">ILLYRIA</textPath></text>
<text font-family="Cinzel" font-weight="700" font-size="34" letter-spacing="8" fill="url(#gold)"><textPath href="#bot" startOffset="50%" text-anchor="middle">· AD 30 ·</textPath></text>
</svg>"""
    return svg

# ---------- Cover ----------
def ridge(seed, base, amp, rough, w=1640, step=6):
    rnd = random.Random(seed)
    y = 0; raw = []
    peaks = [(rnd.uniform(0, w), rnd.uniform(.5, 1), rnd.uniform(140, 260)) for _ in range(7)]
    for x in range(-60, w + 60, step):
        y = y * .9 + rnd.uniform(-rough, rough)
        bump = max(amp * h * math.exp(-((x-p)/sw)**2) for p, h, sw in peaks)
        bay = 1 - .75 * math.exp(-((x-820)/320)**2)
        raw.append((x, base - (bump + 12) * bay + y))
    k = 3
    return [(raw[i][0], sum(r[1] for r in raw[max(0,i-k):i+k+1]) / len(raw[max(0,i-k):i+k+1])) for i in range(len(raw))]

def cover():
    W, H = 1640, 624
    hz = 470
    layers = [(11, 420, 150, 5, "#5a4377", 1), (23, 445, 105, 5, "#3a2c5c", 1), (5, 466, 55, 4, "#211a3d", 1)]
    mts = ""
    for seed, base, amp, rough, col, op in layers:
        pts = ridge(seed, base, amp, rough)
        d = "M" + " L".join(f"{x},{y:.1f}" for x, y in pts) + f" L{W+20},{hz} L-20,{hz}Z"
        mts += f'<path d="{d}" fill="{col}" opacity="{op}"/>'
    rnd = random.Random(7)
    stars = "".join(f'<circle cx="{rnd.uniform(0,W):.0f}" cy="{rnd.uniform(0,200):.0f}" r="{rnd.uniform(.6,1.8):.1f}" fill="#fff" opacity="{rnd.uniform(.25,.8):.2f}"/>' for _ in range(110))
    glints = "".join(f'<rect x="{820 - w/2 + rnd.uniform(-20,20):.0f}" y="{y}" width="{w:.0f}" height="3" rx="1.5" fill="#f3c66d" opacity="{.75 - (y-hz)/250:.2f}"/>'
                     for y, w in [(hz+8+i*12, 260 - i*14 + rnd.uniform(-30,30)) for i in range(12)])
    meander = ""
    for i in range(0, W, 40):
        meander += f'<path d="M{i},612 v-20 h30 v14 h-18 v-6" fill="none" stroke="url(#gold)" stroke-width="3"/>'
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs>{GOLD}
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1530"/><stop offset=".45" stop-color="#3a2552"/><stop offset=".72" stop-color="#a24b4f"/><stop offset=".86" stop-color="#e59a52"/></linearGradient>
<radialGradient id="sunglow" cx="820" cy="420" r="420" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffd98a" stop-opacity=".9"/><stop offset=".25" stop-color="#f3a25a" stop-opacity=".45"/><stop offset="1" stop-color="#f3a25a" stop-opacity="0"/></radialGradient>
<linearGradient id="seaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3a66"/><stop offset="1" stop-color="#0b1630"/></linearGradient>
<radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
<linearGradient id="textShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1530" stop-opacity=".0"/><stop offset=".5" stop-color="#0d1530" stop-opacity=".35"/><stop offset="1" stop-color="#0d1530" stop-opacity="0"/></linearGradient>
<filter id="tsh" x="-10%" y="-30%" width="120%" height="160%"><feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#0a0718" flood-opacity=".75"/></filter>
</defs>
<rect width="{W}" height="{H}" fill="url(#sky)"/>
{stars}
<rect width="{W}" height="{H}" fill="url(#sunglow)"/>
<circle cx="820" cy="440" r="58" fill="#ffd98a" opacity=".95"/>
{mts}
<rect y="{hz}" width="{W}" height="{H-hz}" fill="url(#seaG)"/>
<rect y="{hz}" width="{W}" height="{H-hz}" fill="url(#sunglow)" opacity=".5"/>
{glints}
<g transform="translate(1180,438) scale(.2)" opacity=".92">{ship(sail="#1a1430", hull="#1a1430", emblem="#e59a52")}</g>
<g transform="translate(330,452) scale(.13)" opacity=".8">{ship(sail="#1a1430", hull="#1a1430", emblem="#a24b4f")}</g>
<rect width="{W}" height="{H}" fill="url(#vig)"/>
<rect x="0" y="110" width="{W}" height="300" fill="url(#textShade)"/>
<rect x="0" y="582" width="{W}" height="42" fill="#0b0f22" opacity=".85"/>
{meander}
<g filter="url(#tsh)" text-anchor="middle">
<text x="820" y="262" font-family="Cinzel" font-weight="900" font-size="150" letter-spacing="22" fill="url(#gold)">ILLYRIA</text>
<line x1="590" y1="318" x2="720" y2="318" stroke="url(#gold)" stroke-width="3"/>
<line x1="920" y1="318" x2="1050" y2="318" stroke="url(#gold)" stroke-width="3"/>
<text x="820" y="336" font-family="Cinzel" font-weight="700" font-size="52" letter-spacing="10" fill="#f6e3a1">AD 30</text>
<text x="820" y="392" font-family="Corm" font-style="italic" font-weight="500" font-size="40" fill="#fbeedd">Rule the Roman Balkans. A strategy game of history &amp; geography.</text>
</g>
</svg>"""
    return svg

if __name__ == "__main__":
  for name, svg in (("profile-coin", profile_coin()), ("profile-ship", profile_ship()), ("cover", cover())):
    with open(os.path.join(OUT, name + ".html"), "w") as f:
        f.write(HEAD + svg + TAIL)
  print("ok")
