import json, math, random, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from make import HEAD, TAIL, GOLD, ship, OUT
NE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ne')  # Natural Earth geojson, see README
W, H = 1600, 1200
LON0, LON1, LAT0, LAT1 = 12.95, 19.97, 41.85, 45.65
KY = H / (LAT1 - LAT0); KX = W / (LON1 - LON0)
def P(lon, lat): return ((lon - LON0) * KX, (LAT1 - lat) * KY)

def rings():
    out = []
    for f in ("ne_10m_land", "ne_10m_minor_islands"):
        for feat in json.load(open(os.path.join(NE, f + ".geojson")))["features"]:
            g = feat["geometry"]
            polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
            for poly in polys:
                for ring in poly[:1]:
                    xs = [p[0] for p in ring]; ys = [p[1] for p in ring]
                    if max(xs) < LON0-1 or min(xs) > LON1+1 or max(ys) < LAT0-1 or min(ys) > LAT1+1: continue
                    pts = []
                    for lon, lat in ring:
                        x, y = P(lon, lat)
                        x = min(max(x, -40), W+40); y = min(max(y, -40), H+40)
                        if not pts or abs(pts[-1][0]-x) + abs(pts[-1][1]-y) > .8: pts.append((x, y))
                    if len(pts) > 2: out.append(pts)
    return out

def inside(x, y, R):
    c = False
    for r in R:
        if not (min(p[0] for p in r) <= x <= max(p[0] for p in r)): continue
        j = len(r) - 1
        for i in range(len(r)):
            xi, yi = r[i]; xj, yj = r[j]
            if (yi > y) != (yj > y) and x < (xj-xi)*(y-yi)/(yj-yi)+xi: c = not c
            j = i
    return c

def smooth(pts):
    d = f"M{pts[0][0]:.1f},{pts[0][1]:.1f} "
    for i in range(len(pts)-1):
        p0 = pts[max(i-1,0)]; p1 = pts[i]; p2 = pts[i+1]; p3 = pts[min(i+2,len(pts)-1)]
        c1 = (p1[0]+(p2[0]-p0[0])/6, p1[1]+(p2[1]-p0[1])/6); c2 = (p2[0]-(p3[0]-p1[0])/6, p2[1]-(p3[1]-p1[1])/6)
        d += f"C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f} "
    return d

ROUTE = [(13.85,44.87),(13.80,44.74),(14.05,44.50),(14.25,44.33),(14.75,43.95),(15.35,43.58),(15.72,43.17),(15.95,42.92),(16.40,42.85),(16.80,42.85),(17.30,42.69),(17.75,42.62),(18.10,42.55),(18.42,42.39),(18.53,42.425),(18.61,42.455),(18.68,42.475),(18.73,42.46),(18.77,42.43)]

def hav(a, b):
    R = 6371; la1, la2 = math.radians(a[1]), math.radians(b[1]); dl = math.radians(b[0]-a[0])
    return 2*R*math.asin(math.sqrt(math.sin((la2-la1)/2)**2 + math.cos(la1)*math.cos(la2)*math.sin(dl/2)**2))

def route_svg(pts, color="#f6e3a1"):
    """Reusable dotted route: pts are (lon,lat) waypoints."""
    d = smooth([P(*p) for p in pts])
    return (f'<path d="{d}" fill="none" stroke="#0b1f33" stroke-width="12" stroke-linecap="round" stroke-dasharray="0 22" opacity=".5"/>'
            f'<path d="{d}" fill="none" stroke="{color}" stroke-width="8" stroke-linecap="round" stroke-dasharray="0 22"/>')

def ship_icon(x, y, s=.17, flip=True):
    """Reusable ship icon centred on (x,y); flip=True sails to the right."""
    sx = -s if flip else s
    return (f'<g transform="translate({x},{y})"><ellipse cx="0" cy="30" rx="40" ry="6" fill="#0b1f33" opacity=".35"/>'
            f'<g transform="scale({sx},{s}) translate(-360,-340)">{ship()}</g></g>')

def compass(cx, cy, r):
    """Reusable simplified compass rose."""
    s = f'<g transform="translate({cx},{cy})"><circle r="{r*1.42:.0f}" fill="#2c0819" opacity=".8"/>'
    s += f'<circle r="{r}" fill="none" stroke="url(#gold)" stroke-width="3"/><circle r="{r*.86}" fill="none" stroke="url(#gold)" stroke-width="1.5" opacity=".7"/>'
    for k in range(32):
        a = math.radians(k*360/32); l = r*.12 if k % 4 else r*.2
        s += f'<line x1="{(r*.86)*math.sin(a):.1f}" y1="{-(r*.86)*math.cos(a):.1f}" x2="{(r*.86+ (l if k%4==0 else r*.07))*math.sin(a):.1f}" y2="{-(r*.86+(l if k%4==0 else r*.07))*math.cos(a):.1f}" stroke="url(#gold)" stroke-width="2"/>' if k % 2 == 0 else ""
    for k, (L, wd) in enumerate([(r*1.05, r*.16), (r*.62, r*.11)]):
        for j in range(4):
            ang = j*90 + k*45
            for side, col in ((-1, "#f6e3a1"), (1, "#b98a2e")):
                s += f'<path transform="rotate({ang})" d="M0,{-L:.1f} L{side*wd:.1f},{-wd:.1f} L0,0Z" fill="{col}"/>'
    s += f'<circle r="{r*.07}" fill="#4a1030" stroke="url(#gold)" stroke-width="2"/>'
    s += f'<text y="{-r*1.18:.1f}" text-anchor="middle" font-family="Cinzel" font-weight="900" font-size="{r*.26:.0f}" fill="#f6e3a1">N</text></g>'
    return s

def mountain(x, y, s, col, snow):
    return (f'<path d="M{x-16*s:.1f},{y:.1f} L{x:.1f},{y-22*s:.1f} L{x+16*s:.1f},{y:.1f}Z" fill="{col}"/>'
            f'<path d="M{x-5*s:.1f},{y-15*s:.1f} L{x:.1f},{y-22*s:.1f} L{x+5*s:.1f},{y-15*s:.1f} L{x+2*s:.1f},{y-13*s:.1f} L{x:.1f},{y-16*s:.1f} L{x-2*s:.1f},{y-13*s:.1f}Z" fill="{snow}"/>')

def city(lon, lat, roman, modern, major, dx=14, dy=-10, anchor="start", sea=False):
    x, y = P(lon, lat)
    r = 11 if major else 6
    s = f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r+4}" fill="#2c0819" opacity=".8"/><circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="url(#gold)"/>'
    if major: s += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="4" fill="#4a1030"/>'
    fs = 34 if major else 22
    c1, c2, flt = ("#f6e3a1", "#cfe3ef", "tsh") if sea else ("#4a1030" if major else "#3a2c5c", "#5a4377", "lsh")
    s += f'<g filter="url(#{flt})" text-anchor="{anchor}"><text x="{x+dx:.1f}" y="{y+dy:.1f}" font-family="Cinzel" font-weight="{900 if major else 700}" font-size="{fs}" letter-spacing="2" fill="{c1}">{roman}</text>'
    s += f'<text x="{x+dx:.1f}" y="{y+dy+fs*.85:.1f}" font-family="Corm" font-style="italic" font-weight="500" font-size="{fs*.78:.0f}" fill="{c2}">{modern}</text></g>'
    return s

def scene():
    R = rings()
    land = "".join("M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in r) + "Z" for r in R)
    rnd = random.Random(4)
    waves = ""
    for gy in range(40, H, 46):
        for gx in range(20, W, 70):
            x = gx + rnd.uniform(-18, 18) + (35 if (gy//46) % 2 else 0); y = gy + rnd.uniform(-8, 8)
            if any(inside(x+ox, y+oy, R) for ox, oy in ((0,0),(-30,0),(30,0),(0,-22),(0,22),(-22,-16),(22,16))): continue
            if rnd.random() < .45: continue
            waves += f'<path d="M{x-14:.0f},{y:.0f} q7,-7 14,0 t14,0" fill="none" stroke="#5fa3c7" stroke-width="3" stroke-linecap="round" opacity=".45"/>'
    mts = ""
    for lon, lat, sc in [(15.25,44.75,1.1),(15.6,44.42,1.2),(16.2,44.1,1.3),(16.65,43.85,1.3),(17.15,43.62,1.4),(17.65,43.32,1.3),(18.15,43.02,1.3),(18.65,42.82,1.2),
                         (16.0,44.62,1),(17.0,44.15,1.1),(17.55,43.85,1.2),(18.05,43.55,1.1),(18.8,43.2,1.2),(15.75,44.95,.9),(16.5,44.4,1),(18.45,43.85,1),
                         (13.15,42.95,1.1),(12.85,43.45,1)]:
        x, y = P(lon, lat); mts += mountain(x, y, sc*1.6, "#c4a46a", "#f4ead0")
    rlab = lambda lon, lat, t, fs, rot=0, sp=14: (lambda x, y: f'<text x="{x:.0f}" y="{y:.0f}" transform="rotate({rot} {x:.0f} {y:.0f})" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="{fs}" letter-spacing="{sp}" fill="#8a6d3b" opacity=".75">{t}</text>')(*P(lon, lat))
    BAY = [(18.44,42.37),(18.49,42.41),(18.53,42.45),(18.60,42.47),(18.66,42.49),(18.69,42.53),(18.73,42.52),(18.72,42.48),(18.76,42.46),(18.785,42.42),(18.755,42.405),(18.70,42.445),(18.66,42.455),(18.60,42.43),(18.56,42.40),(18.52,42.35)]
    bay = "M" + " L".join("%.1f,%.1f" % P(*q) for q in BAY) + "Z"
    km = sum(hav(ROUTE[i], ROUTE[i+1]) for i in range(len(ROUTE)-1))
    sx, sy = P(15.30, 43.50)
    meander = "".join(f'<path d="M{i},{H-12} v-20 h30 v14 h-18 v-6" fill="none" stroke="url(#gold)" stroke-width="3"/>' for i in range(0, W, 40))
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs>{GOLD}
<radialGradient id="seaG" cx=".45" cy=".55" r=".8"><stop offset="0" stop-color="#1d5d86"/><stop offset=".7" stop-color="#0f3c5c"/><stop offset="1" stop-color="#08243a"/></radialGradient>
<linearGradient id="landG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#efe0b4"/><stop offset="1" stop-color="#dcc48e"/></linearGradient>
<filter id="lsh"><feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="#f6ecd0" flood-opacity="1"/></filter>
<filter id="tsh" x="-10%" y="-30%" width="120%" height="160%"><feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0a0718" flood-opacity=".7"/></filter>
<radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>
</defs>
<rect width="{W}" height="{H}" fill="url(#seaG)"/>
{waves}
<path d="{land}" fill="none" stroke="#5fa3c7" stroke-width="26" stroke-linejoin="round" opacity=".18"/>
<path d="{land}" fill="none" stroke="#5fa3c7" stroke-width="12" stroke-linejoin="round" opacity=".35"/>
<path d="{land}" fill="url(#landG)" stroke="#b98a2e" stroke-width="2" stroke-linejoin="round"/>
{mts}
<path d="{bay}" fill="#14496e" stroke="#b98a2e" stroke-width="1.5"/>
{rlab(13.55,42.85,"ITALIA",40,-38)}
{rlab(14.05,45.3,"ISTRIA",28,0,10)}
{rlab(16.75,44.25,"DALMATIA",46,-30,18)}
{rlab(16.9,45.35,"PANNONIA",34,0,14)}
<text x="{P(15.1,42.82)[0]:.0f}" y="{P(14.95,42.78)[1]:.0f}" transform="rotate(-30 {P(14.95,42.78)[0]:.0f} {P(14.95,42.78)[1]:.0f})" text-anchor="middle" font-family="Corm" font-style="italic" font-weight="500" font-size="40" letter-spacing="6" fill="#a9d0e6" opacity=".6">Mare Adriaticum</text>
{route_svg(ROUTE)}
{city(15.23,44.12,"IADER","Zadar",False,10,-10)}
{city(16.48,43.54,"SALONA","Split",False,10,-12)}
{city(18.22,42.58,"EPIDAURUM","Cavtat",False,-14,12,"end",True)}
{city(13.52,43.62,"ANCONA","Ancona",False,12,-8,"start",True)}
{city(14.90,44.99,"SENIA","Senj",False,10,-8)}
{city(13.85,44.87,"POLA","Pula",True,-18,-14,"end",True)}
{city(18.77,42.43,"ACRVVIVM","Kotor",True,18,6)}
{ship_icon(sx, sy)}
{compass(*P(13.95,42.42), 90)}
<g transform="translate(1090,60)">
<rect width="470" height="215" rx="10" fill="#2c0819" opacity=".88"/>
<rect x="8" y="8" width="454" height="199" rx="6" fill="none" stroke="url(#gold)" stroke-width="2"/>
<g text-anchor="middle" filter="url(#tsh)">
<text x="235" y="62" font-family="Cinzel" font-weight="700" font-size="22" letter-spacing="8" fill="#f6e3a1">SEA ROUTE · AD 30</text>
<text x="235" y="118" font-family="Cinzel" font-weight="900" font-size="38" letter-spacing="2" fill="url(#gold)">POLA → ACRVVIVM</text>
<text x="235" y="166" font-family="Corm" font-style="italic" font-weight="500" font-size="32" fill="#fbeedd">about {round(km/1.48/10)*10} Roman miles by sea</text>
</g></g>
<rect width="{W}" height="{H}" fill="url(#vig)"/>
<rect x="0" y="{H-46}" width="{W}" height="46" fill="#0b0f22" opacity=".92"/>
{meander}
<rect x="6" y="6" width="{W-12}" height="{H-58}" fill="none" stroke="url(#gold)" stroke-width="4"/>
</svg>"""
    print("route km", round(km), "RM", round(km/1.48))
    return svg

open(os.path.join(OUT, "map.html"), "w").write(HEAD + scene() + TAIL)

# reusable pieces as standalone SVGs
for name, body, w, h in (("ship-icon", ship_icon(70, 50, .17), 140, 100), ("compass", compass(140, 150, 90), 280, 290)):
    open(os.path.join(OUT, name + ".svg"), "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><defs>{GOLD}</defs>{body}</svg>')
    open(os.path.join(OUT, name + ".html"), "w").write(HEAD + f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><defs>{GOLD}</defs>{body}</svg>' + TAIL)
