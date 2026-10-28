# Prompts: the five advisors at full length

These pictures replace the line drawings in the game's big pop-ups (the enemy at the gates, the judgement, the haruspex's prophecy, the inventions, the advisors' special abilities). The round coin portraits on the council stay as they are.

## Version 3 (28 October 2026): an ancient fresco, not a modern illustration

### What went wrong so far
- **Version 1** (`design/pieces/figures/drafts-realistic/`): a realistic painted book illustration.
- **Version 2** (`design/pieces/figures/drafts-too-detailed/`, made in ChatGPT with a vase reference): better colours, but still a modern illustration *about* antiquity, not antiquity itself:
  - a dark background with a glowing vignette;
  - engraved hatching and shading lines everywhere, like a banknote;
  - a realistic face turned three-quarters, with wrinkles and a modelled jaw;
  - muscles on the legs and arms;
  - ornament on every edge (fringes, palmettes, a Medusa on the breastplate, winged thunderbolts on the shield).

The old prompts invited some of this: "fringed edge", "breastplate", "painted eye", "crested helmet" all ask for detail.

### What we want
**A figure from an Etruscan tomb painting at Tarquinia, about 480 BC** (see `design/pieces/figures/references/fresco-B-tomb-of-the-leopards.png`). Those painters worked fast on wet plaster:
- **Cream plaster background**, light, with a soft uneven texture and a few cracks. Not dark, no glow.
- **Skin in one flat red-brown.** Clothes in one or two flat colours. No shading at all.
- **One dark outline**, a little wobbly, drawn with a brush. Only a handful of inner lines: one or two for folds, one for the hair, one for the eye.
- **The face in strict profile**, with a big almond eye seen from the front, a straight nose in one line with the forehead, and no wrinkles.
- **Stiff, naive bodies**: smooth limbs without muscles, big hands, both feet in profile pointing the same way, as if walking.
- **Objects drawn like a child would**: a liver is a rounded blob, a shield is an oval, coins are dots.

**The one test:** could it be a photo of a real painted wall in a museum? If it looks like a poster, a book cover or a game card, it is wrong.

### The palette (the same for all five, so they belong together)
| | Colour | Hex |
|---|---|---|
| Plaster (background) | warm cream | #EDE3CC |
| Skin | red-brown ochre | #A0462A |
| Outline and hair | brown-black | #2B1A12 |
| Cloth | one advisor colour each, below | |

The advisor colours are:
- **priest:** dark red, #7E2420;
- **general:** ochre yellow, #C8952F;
- **fleet:** blue, #2F5D8C;
- **economist:** green, #4F7F5A;
- **treasurer:** white with a red border.

## How to use them (ChatGPT)

1. **Start a new chat for each figure.** A long chat drifts back to the detailed look.
2. **Attach the reference first**, `design/pieces/figures/references/fresco-B-tomb-of-the-leopards.png`, and send: "Look at this ancient wall painting. Describe its painting style in 5 short points: lines, colours, faces, bodies, background." Let it answer. Saying the style back makes it follow it much better.
3. **Paste the advisor's full prompt** below (each one is complete, with the style included). Ask for portrait 2:3 (1024 × 1536).
4. **If it is still too detailed, don't start again: correct it in the same chat.** Send one fix at a time:
   - "Remove all hatching and shading lines. Flat colour only."
   - "Make the background light cream plaster, no dark vignette."
   - "Make the face simpler: strict profile, one big almond eye, no wrinkles."
   - "Half as many lines. A painter did this in ten minutes on wet plaster."
   - "Remove every ornament and pattern from the clothes."
5. **Keep the five alike.** When one is right, attach it to the next chat as the style reference instead of the tomb photo: "Same painter, same wall, same style exactly: [next prompt]".
6. Save the PNGs in `design/pieces/figures/` as `priest.png`, `general.png`, `fleet.png`, `economist.png`, `treasurer.png`, and tell Claude (or run `python web/build.py`).

In **Midjourney**, use the same prompt with `--ar 2:3 --style raw --stylize 0 --sref <link to the tomb photo>` and add `--no` with the negative list at the end.

**Negative list** (for tools that take one): `modern illustration, poster, book illustration, concept art, digital painting, engraving, hatching, cross-hatching, shading, gradient, vignette, glow, dark background, 3D, realistic face, three-quarter view, wrinkles, muscles, anatomy, ornament, pattern, fringe, jewellery, text, letters, border, frame, cropped feet`

## The five prompts

Each block is complete: copy the whole block.

### 1. Tertius Volusius, the haruspex (`priest.png`)

```
A photograph of an ancient Etruscan tomb wall painting from Tarquinia, about 480 BC: one standing figure painted on cream plaster. Not a modern illustration.

The figure: an old priest who reads the future from livers. Head in strict profile facing right, a big almond-shaped eye seen from the front, a straight nose, no beard, no wrinkles. On his head a tall pointed cap. He wears one long dark red mantle (#7E2420) from shoulders to ankles, drawn with two or three fold lines only. His right hand holds up a liver in front of his face, a simple rounded brown blob. His left hand holds a tall thin staff ending in a curl. A small plain block altar at his feet with one wavy line of smoke.

Style: flat colour, no shading, no hatching, no gradient. Skin in one flat red-brown ochre (#A0462A). One wobbly dark brown brush outline (#2B1A12) and very few inner lines. A stiff, naive body: smooth limbs, big hands, both feet in profile. Light cream plaster background (#EDE3CC) with a soft uneven texture and a few hairline cracks, no vignette. No ornament, no pattern, no fringe, no text. Full figure head to feet with space on both sides, portrait 2:3.
```

### 2. Marcus Antistius, prefect of the auxiliaries (`general.png`)

```
A photograph of an ancient Etruscan tomb wall painting from Tarquinia, about 480 BC: one standing figure painted on cream plaster. Not a modern illustration.

The figure: a Roman officer. Head in strict profile facing right, a big almond-shaped eye seen from the front, a straight nose, short dark hair drawn as one flat shape, no beard. He wears a plain ochre yellow body armour (#C8952F), just one flat shape with a single line at the waist, over a short white tunic, and a short dark red cloak hanging behind one shoulder. In his right hand a short straight stick held across his chest. His left hand rests on the rim of a big plain oval shield standing on the ground beside him, the shield a flat ochre oval with one dark ring. Bare legs, simple sandals.

Style: flat colour, no shading, no hatching, no gradient. Skin in one flat red-brown ochre (#A0462A). One wobbly dark brown brush outline (#2B1A12) and very few inner lines. A stiff, naive body: smooth limbs without muscles, big hands, both feet in profile. Light cream plaster background (#EDE3CC) with a soft uneven texture and a few hairline cracks, no vignette. No ornament, no pattern, no helmet crest, no text. Full figure head to feet with space on both sides, portrait 2:3.
```

### 3. Epicadus the Liburnian, master of the fleet (`fleet.png`)

```
A photograph of an ancient Etruscan tomb wall painting from Tarquinia, about 480 BC: one standing figure painted on cream plaster. Not a modern illustration.

The figure: a sea captain from the Illyrian coast. Head in strict profile facing right, a big almond-shaped eye seen from the front, a straight nose, a full round dark beard drawn as one flat shape, a small pointed cap. He wears a short blue tunic (#2F5D8C) belted at the waist, with two fold lines. With both hands he holds upright a long steering oar, taller than himself: a thin pole with a flat blade at the bottom. A coil of rope over one shoulder, drawn as three loops. Bare legs, bare feet.

Style: flat colour, no shading, no hatching, no gradient. Skin in one flat red-brown ochre (#A0462A). One wobbly dark brown brush outline (#2B1A12) and very few inner lines. A stiff, naive body: smooth limbs without muscles, big hands, both feet in profile. Light cream plaster background (#EDE3CC) with a soft uneven texture and a few hairline cracks, no vignette. Below his feet, three wavy blue lines for the sea. No ship, no ornament, no pattern, no text. Full figure head to feet with space on both sides, portrait 2:3.
```

### 4. Nikandros of Epidaurum, adviser on trade (`economist.png`)

```
A photograph of an ancient Etruscan tomb wall painting from Tarquinia, about 480 BC: one standing figure painted on cream plaster. Not a modern illustration.

The figure: a Greek merchant. Head in strict profile facing right, a big almond-shaped eye seen from the front, a straight nose, a short pointed dark beard, a flat wide-brimmed hat. He wears a short green tunic (#4F7F5A) and a short white cloak over one shoulder, two fold lines each. His right arm stretched forward holds a simple balance: a straight bar with two flat pans hanging on thin lines. Beside his feet a tall plain amphora, a flat ochre shape with two handles. Simple boots.

Style: flat colour, no shading, no hatching, no gradient. Skin in one flat red-brown ochre (#A0462A). One wobbly dark brown brush outline (#2B1A12) and very few inner lines. A stiff, naive body: smooth limbs without muscles, big hands, both feet in profile. Light cream plaster background (#EDE3CC) with a soft uneven texture and a few hairline cracks, no vignette. No ornament, no pattern, no text. Full figure head to feet with space on both sides, portrait 2:3.
```

### 5. Felix, keeper of the treasury (`treasurer.png`)

```
A photograph of an ancient Etruscan tomb wall painting from Tarquinia, about 480 BC: one standing figure painted on cream plaster. Not a modern illustration.

The figure: a household steward who keeps the money. Head in strict profile facing right, a big almond-shaped eye seen from the front, a straight nose, close-cropped dark hair drawn as one flat shape, no beard. He wears a long plain white tunic to the ankles with a dark red border at the hem (#7E2420), belted, with a small round purse hanging from the belt. In his left hand an open writing tablet, two plain rectangles. In his right hand a thin pointed stick. Beside him on the ground a small plain wooden chest, a brown box with a few yellow dots for coins on top.

Style: flat colour, no shading, no hatching, no gradient. Skin in one flat red-brown ochre (#A0462A). One wobbly dark brown brush outline (#2B1A12) and very few inner lines. A stiff, naive body: smooth limbs, big hands, both feet in profile. Light cream plaster background (#EDE3CC) with a soft uneven texture and a few hairline cracks, no vignette. No ornament, no pattern, no keys, no text. Full figure head to feet with space on both sides, portrait 2:3.
```

## Alternative: the vase look

If you prefer a vase after all, replace the first paragraph of any prompt with:

```
A museum photograph of a single figure on an ancient Greek red-figure vase, about 480 BC, the figure cut out flat from the painted surface. Not a modern illustration.
```

Then replace the style paragraph with:

```
Style: the figure is the flat orange colour of the clay, the background flat glossy black with no glow. Only a black outline and a few fine black lines for folds and hair. No shading, no hatching, no gradient, no ornament. Full figure head to feet, portrait 2:3.
```

Attach `vase-A-redfigure-berlin-painter-singer.png` as the reference. Keep the clothing colours out of the figure text, because a vase has only clay orange and black.
