# Illyria: AD 30 visual style ("antique" style)

Use these rules for every game element (social posts, UI, cards, icons, maps), so everything looks like one family. The reference images in `images/` are the profile pictures, the Facebook cover and the Tiberius post.

## Principles
- **Flat silhouettes, no detail painting.** Things are drawn as simple filled shapes, like figures on a coin, a frieze or a vase. There are no outlines, no textures and no realistic shading.
- **Few shapes, readable small.** Every motif must still read at 40 px. If it doesn't, remove detail.
- **Gold marks what matters.** Heroes, rulers, titles and key objects are in gold. Everything else is a dark silhouette.
- **Depth comes from layers, not perspective.** Use two or three flat layers of hills or buildings, each darker toward the front.
- **Dusk is the default light.** Use a night-to-amber sky with a soft sun glow behind the subject.

## Palette
| Role | Colour | Hex |
|---|---|---|
| Gold (gradient) | light / mid / dark | #f6e3a1 / #d9ac4f / #b98a2e |
| Tyrian purple (rulers, coins) | field / deep | #4a1030 / #2c0819 |
| Adriatic blue (sea, Illyrians) | mid / deep | #0f3c5c / #08243a |
| Crimson (sails, banners, Rome) | | #9b2240 |
| Cream (text, light silhouettes) | | #fbeedd / #efe0b4 |
| Sky | night / violet / rose / amber | #0d1530 / #3a2552 / #a24b4f / #e59a52 |
| Hills, back to front | | #5a4377 / #3a2c5c / #211a3d |
| Foreground silhouette | | #1a1430 |

## Type
- **Cinzel** (Black 900 or Bold 700), all caps with wide letter-spacing, for titles, names and dates.
- **Cormorant Garamond Italic** (500) for taglines and narrative lines, in sentence case.
- Dates are written "AD 30". Latin inscriptions on coins use V for U (AVGVSTVS).
- Large text gets a soft dark drop shadow (dy 5, blur 7, ~75% of #0a0718).

## Motifs (reuse these, don't redraw them)
- Coin or medallion: a dark field, a gold rim with a beaded ring and an inscription arc. Use it for rulers and achievements.
- Laurel wreath: paired pointed leaves along an arc, with berries.
- Illyrian sun: a disc with 8 triangular rays. This is the Illyrian emblem, used on sails and banners.
- Liburnian galley: a cream hull with a ram and curled stern, a crimson sail with the sun, and oars as short strokes.
- Rome: a temple with a pediment and columns, aqueduct arches, umbrella pines and cypresses.
- Legion standard (signum): a pole with discs and a gold eagle on top.
- Greek key (meander) band in gold along the bottom edge, as a frame.

## Maps
- Sea is Adriatic blue with small light-blue wave strokes. Land is parchment cream (#efe0b4 to #dcc48e) with a thin gold coastline and a soft blue halo offshore.
- Mountains are small cream-brown triangles with white caps. Region names are wide-spaced Cinzel in faded brown.
- Cities are gold dots. The Roman name is in Cinzel with the modern name in italic underneath (cream text on the sea, purple on the land).
- Routes are dotted cream lines. Use the ship icon and compass rose in `pieces/` as they are.
- The coastline comes from Natural Earth 1:10m (public domain). The Bay of Kotor is hand-drawn because the dataset is too coarse there.

## Sizes
- Square avatar: 1080×1080, with the subject kept inside the central circle.
- Facebook cover: 1640×624, with the text inside the central ~1100 px.
- Post or scene: 1600×900 (16:9).
- Map card: 1600×1200 (4:3).

## Source
The images are generated from SVG code in `source/` (Python writes the SVG and Playwright/Chromium renders the PNG). The fonts are in `source/fonts` under the SIL Open Font License. All artwork is original.
