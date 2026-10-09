# Illyria: AD 30 design kit

This folder is the reference for all Illyria artwork, in the flat "antique" silhouette style. Read [style-guide.md](style-guide.md) first. It lists the rules, palette, fonts, motifs and sizes.

| Folder | What's in it |
|---|---|
| `images/` | Approved reference images: profile pictures, Facebook cover, Tiberius, Jesus of Nazareth, Pola–Acruvium map |
| `pieces/` | Reusable parts (ship icon, compass rose) as SVG and PNG |
| `source/` | The Python code that draws every image, the render script and the fonts (SIL Open Font License) |

## Making a new image

Every image is drawn as SVG code and then rendered to PNG with headless Chromium, so the shapes stay identical from one image to the next.

1. Requirements: Python 3, Node.js and Playwright (`npm i playwright`, then `npx playwright install chromium`).
2. Copy the closest existing script in `source/` (`tiberius.py` or `jesus.py` for a scene, `map.py` for a map) and change the scene. Reuse the shared helpers instead of redrawing them:
   - `make.py`: gold gradient, laurel branch, Illyrian sun, galley (`ship()`), hill ridges (`ridge()`)
   - `tiberius.py`: coin medallion, temple, aqueduct, cypress
   - `jesus.py`: robed figures and crowds, olive tree, palm, hill town
   - `map.py`: coastline projection, dotted route (`route_svg()`), ship icon (`ship_icon()`), compass (`compass()`), city labels
3. Run the script. It writes an HTML file to `build/`.
   ```
   cd design/source
   python3 tiberius.py
   ```
4. Render it to PNG: `node render.js <html> <width> <height> <output.png> [scale]`
   ```
   node render.js $PWD/../build/tiberius.html 1600 900 ../images/new-image.png
   ```
   Profile pictures use `720 720 ... 1.5`, which gives 1080×1080 output.

Maps also need Natural Earth 1:10m data (public domain). Put it in `source/ne/` before running `map.py`:
```
mkdir -p source/ne && cd source/ne
curl -LO https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_land.geojson
curl -LO https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_minor_islands.geojson
```

## Asking Claude for new artwork

Point Claude at this folder and say what the scene should show, for example: "Using design/ in the illirya repo, draw *Germanicus campaigns on the Rhine*, 1600×900." Claude follows the style guide and the existing scripts.
