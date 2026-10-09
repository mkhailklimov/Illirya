import math, random, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from make import HEAD, TAIL, GOLD, ridge, OUT
from tiberius import cypress

W, H = 1600, 900

def preacher(x, y, s, fill, detail):
    return f"""<g transform="translate({x},{y}) scale({s})">
<path d="M-18,-246 C-25,-226 -25,-212 -21,-198 L21,-198 C25,-212 25,-226 18,-246Z" fill="{fill}"/>
<path d="M-20,-204 C-36,-200 -44,-194 -46,-180 C-50,-120 -54,-60 -64,0 L62,0 C52,-60 48,-120 44,-180 C42,-194 34,-200 20,-204Z" fill="{fill}"/>
<path d="M-64,0 C-40,-6 -20,4 0,-2 C20,4 40,-6 62,0 L64,6 L-66,6Z" fill="{fill}"/>
<path d="M-42,-192 C-72,-180 -94,-156 -110,-128 L-98,-116 C-84,-130 -68,-136 -48,-126Z" fill="{fill}"/>
<path d="M42,-192 C72,-180 94,-156 110,-128 L98,-116 C84,-130 68,-136 48,-126Z" fill="{fill}"/>
<ellipse cx="-112" cy="-116" rx="9" ry="12" transform="rotate(-35 -112 -116)" fill="{fill}"/>
<ellipse cx="112" cy="-116" rx="9" ry="12" transform="rotate(35 112 -116)" fill="{fill}"/>
<ellipse cx="0" cy="-238" rx="18" ry="22" fill="{fill}"/>
<path d="M-40,-186 L-24,-196 L46,-40 L34,-26Z" fill="{detail}" opacity=".22"/>
<path d="M-12,-120 C-16,-70 -20,-30 -24,0 M16,-110 C20,-60 24,-30 26,0" fill="none" stroke="{detail}" stroke-width="2.5" opacity=".22"/>
</g>"""

def person(x, base, h, kind, col, rnd):
    hr = h * .1
    hy = base - h + hr
    head = f'<ellipse cx="{x:.1f}" cy="{hy:.1f}" rx="{hr:.1f}" ry="{hr*1.15:.1f}" fill="{col}"/>'
    if kind in ("veil", "turban"):
        if kind == "veil":
            head += f'<path d="M{x-hr*1.2:.1f},{hy+hr*.2:.1f} C{x-hr*1.3:.1f},{hy-hr*1.6:.1f} {x+hr*1.3:.1f},{hy-hr*1.6:.1f} {x+hr*1.2:.1f},{hy+hr*.2:.1f} L{x+hr*1.9:.1f},{hy+hr*3.4:.1f} L{x-hr*1.9:.1f},{hy+hr*3.4:.1f}Z" fill="{col}"/>'
        else:
            head += f'<ellipse cx="{x:.1f}" cy="{hy-hr*.7:.1f}" rx="{hr*1.25:.1f}" ry="{hr*.7:.1f}" fill="{col}"/>'
    sh = hy + hr * 1.5
    nk = hr * .6
    shw = hr * 2.1
    if kind == "seated":
        body = f'<path d="M{x-nk:.1f},{sh-hr*.4:.1f} C{x-shw:.1f},{sh-hr*.2:.1f} {x-shw*1.2:.1f},{sh+hr:.1f} {x-shw*1.3:.1f},{sh+hr*2.5:.1f} C{x-shw*1.6:.1f},{base-hr:.1f} {x-shw*1.9:.1f},{base-hr*.3:.1f} {x-shw*2:.1f},{base:.1f} L{x+shw*2:.1f},{base:.1f} C{x+shw*1.9:.1f},{base-hr*.3:.1f} {x+shw*1.6:.1f},{base-hr:.1f} {x+shw*1.3:.1f},{sh+hr*2.5:.1f} C{x+shw*1.2:.1f},{sh+hr:.1f} {x+shw:.1f},{sh-hr*.2:.1f} {x+nk:.1f},{sh-hr*.4:.1f}Z" fill="{col}"/>'
    else:
        w1 = hr * (2.3 + rnd.uniform(0, .7))
        body = f'<path d="M{x-nk:.1f},{sh-hr*.4:.1f} C{x-shw:.1f},{sh-hr*.2:.1f} {x-shw*1.15:.1f},{sh+hr*1.2:.1f} {x-shw*1.05:.1f},{sh+hr*3:.1f} C{x-w1*.95:.1f},{base-h*.25:.1f} {x-w1:.1f},{base-h*.1:.1f} {x-w1:.1f},{base:.1f} L{x+w1:.1f},{base:.1f} C{x+w1:.1f},{base-h*.1:.1f} {x+w1*.95:.1f},{base-h*.25:.1f} {x+shw*1.05:.1f},{sh+hr*3:.1f} C{x+shw*1.15:.1f},{sh+hr*1.2:.1f} {x+shw:.1f},{sh-hr*.2:.1f} {x+nk:.1f},{sh-hr*.4:.1f}Z" fill="{col}"/>'
        if kind == "staff":
            body += f'<line x1="{x+shw*1.5:.1f}" y1="{hy-hr*1.5:.1f}" x2="{x+shw*1.7:.1f}" y2="{base:.1f}" stroke="{col}" stroke-width="{max(2,hr*.35):.1f}" stroke-linecap="round"/>'
    return body + head

def olive(x, base, h, col):
    t = f'<path d="M{x-8},{base} C{x-4},{base-h*.3} {x-16},{base-h*.45} {x-6},{base-h*.6} L{x+6},{base-h*.6} C{x+14},{base-h*.4} {x+6},{base-h*.3} {x+10},{base}Z" fill="{col}"/>'
    blobs = [(-.35, .62, .32), (.3, .65, .3), (0, .8, .36), (-.15, .7, .3), (.45, .78, .22), (-.48, .76, .2)]
    return t + "".join(f'<ellipse cx="{x+dx*h:.1f}" cy="{base-dy*h:.1f}" rx="{r*h:.1f}" ry="{r*h*.6:.1f}" fill="{col}"/>' for dx, dy, r in blobs)

def palm(x, base, h, lean, col):
    tx, ty = x + lean, base - h
    t = f'<path d="M{x-6},{base} Q{x+lean*.2:.1f},{base-h*.5:.1f} {tx-3:.1f},{ty:.1f} L{tx+3:.1f},{ty:.1f} Q{x+lean*.2+8:.1f},{base-h*.5:.1f} {x+6},{base}Z" fill="{col}"/>'
    fr = ""
    for a in (-160, -125, -95, -60, -25, 10, 190):
        r = math.radians(a)
        ex, ey = tx + h*.42*math.cos(r), ty + h*.42*math.sin(r) + h*.1
        mx, my = tx + h*.25*math.cos(r), ty + h*.25*math.sin(r) - h*.08
        fr += f'<path d="M{tx:.1f},{ty:.1f} Q{mx:.1f},{my:.1f} {ex:.1f},{ey:.1f} Q{mx:.1f},{my+12:.1f} {tx:.1f},{ty+6:.1f}Z" fill="{col}"/>'
    return t + fr

def town(x, base, col):
    rnd = random.Random(9); s = ""
    for i in range(9):
        w = rnd.uniform(22, 40); hh = rnd.uniform(16, 34)
        s += f'<rect x="{x+i*30:.0f}" y="{base-hh-(4-abs(i-4))*6:.0f}" width="{w:.0f}" height="{hh+40:.0f}" fill="{col}"/>'
    return s

def scene():
    rnd = random.Random(5)
    stars = "".join(f'<circle cx="{rnd.uniform(0,W):.0f}" cy="{rnd.uniform(0,300):.0f}" r="{rnd.uniform(.6,1.8):.1f}" fill="#fff" opacity="{rnd.uniform(.2,.7):.2f}"/>' for _ in range(120))
    hills = ""
    for seed, base, amp, col in ((31, 640, 130, "#5a4377"), (44, 690, 90, "#3a2c5c")):
        pts = ridge(seed, base, amp, 4, w=W)
        hills += 'M' if False else ''
        hills += f'<path d="M' + " L".join(f"{x},{y:.1f}" for x, y in pts) + f' L{W+60},{H} L-60,{H}Z" fill="{col}"/>'
    mid = "#2a2147"; fg = "#1a1430"
    # the preaching hill
    hill = f'<path d="M-40,{H} L-40,700 C200,690 380,600 560,598 C740,600 900,690 1180,720 C1400,740 1560,730 1660,735 L1660,{H}Z" fill="{mid}"/>'
    land = (town(1300, 660, "#3a2c5c") + olive(250, 700, 120, mid) + olive(930, 700, 100, mid)
            + palm(120, 740, 210, 30, fg) + palm(170, 745, 170, -28, fg) + palm(1520, 760, 200, -26, fg)
            + cypress(1050, 735, 110, mid) + cypress(1075, 738, 85, mid))
    # followers close to the preacher (mid tone), crowd below (dark)
    follow = ""
    for dx, h, k in ((-120, 120, "staff"), (-85, 110, "plain"), (95, 116, "plain"), (130, 104, "veil")):
        follow += person(560 + dx, 612, h, k, mid if False else "#3a2c5c", rnd)
    crowd = ""
    kinds = ["plain", "veil", "turban", "seated", "plain", "veil", "staff", "seated"]
    for row, (base, h0, col, n, x0, x1) in enumerate(((735, 105, mid, 16, 230, 900), (800, 140, fg, 13, 150, 1000), (870, 175, fg, 10, 40, 1140))):
        for i in range(n):
            x = x0 + (x1 - x0) * (i + rnd.uniform(-.25, .25)) / (n - 1)
            k = kinds[rnd.randrange(len(kinds))]
            h = h0 * rnd.uniform(.85, 1.08) * (.7 if k == "seated" else 1) * (.75 if rnd.random() < .12 else 1)
            crowd += person(x, base + rnd.uniform(-6, 6), h, k, col, rnd)
    meander = "".join(f'<path d="M{i},888 v-20 h30 v14 h-18 v-6" fill="none" stroke="url(#gold)" stroke-width="3"/>' for i in range(0, W, 40))
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs>{GOLD}
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1530"/><stop offset=".45" stop-color="#3a2552"/><stop offset=".72" stop-color="#a24b4f"/><stop offset=".86" stop-color="#e59a52"/></linearGradient>
<radialGradient id="glow" cx="560" cy="470" r="520" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffd98a" stop-opacity=".7"/><stop offset=".3" stop-color="#f3a25a" stop-opacity=".3"/><stop offset="1" stop-color="#f3a25a" stop-opacity="0"/></radialGradient>
<radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></radialGradient>
<filter id="tsh" x="-20%" y="-30%" width="140%" height="160%"><feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#0a0718" flood-opacity=".75"/></filter>
</defs>
<rect width="{W}" height="{H}" fill="url(#sky)"/>
{stars}
<rect width="{W}" height="{H}" fill="url(#glow)"/>
{hills}
{land}
{hill}
{follow}
<g filter="url(#tsh)">{preacher(560, 604, 1.05, "url(#gold)", "#4a1030")}</g>
{crowd}
<rect width="{W}" height="{H}" fill="url(#vig)"/>
<g filter="url(#tsh)" text-anchor="middle">
<text x="1245" y="250" font-family="Cinzel" font-weight="900" font-size="120" letter-spacing="14" fill="url(#gold)">JESUS</text>
<text x="1245" y="312" font-family="Cinzel" font-weight="700" font-size="44" letter-spacing="10" fill="#f6e3a1">OF NAZARETH</text>
<text x="1245" y="388" font-family="Corm" font-style="italic" font-weight="500" font-size="50" fill="#fbeedd">preaches to crowds in Judea</text>
<text x="1245" y="446" font-family="Corm" font-style="italic" font-weight="500" font-size="50" fill="#fbeedd">and gathers followers</text>
<line x1="1080" y1="494" x2="1180" y2="494" stroke="url(#gold)" stroke-width="3"/>
<line x1="1310" y1="494" x2="1410" y2="494" stroke="url(#gold)" stroke-width="3"/>
<text x="1245" y="506" font-family="Cinzel" font-weight="700" font-size="34" letter-spacing="4" fill="#f6e3a1">AD 30</text>
</g>
<rect x="0" y="858" width="{W}" height="42" fill="#0b0f22" opacity=".9"/>
{meander}
</svg>"""
    return svg

open(os.path.join(OUT, "jesus.html"), "w").write(HEAD + scene() + TAIL)
print("ok")
