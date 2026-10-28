# Prompts: the five advisors at full length

These pictures replace the line drawings in the game's big pop-ups (the enemy at the gates, the judgement, the haruspex's prophecy, the inventions, the advisors' special abilities). The round coin portraits on the council stay as they are.

## Version 4 (28 October 2026): a red-figure vase, copied as it is

### What went wrong so far
- **Version 1** (`design/pieces/figures/drafts-realistic/`): a realistic painted book illustration.
- **Version 2** (`design/pieces/figures/drafts-too-detailed/`, made in ChatGPT with a vase reference): still a modern illustration *about* antiquity, not antiquity itself:
  - a coloured background with a glowing vignette;
  - engraved hatching everywhere;
  - a realistic face turned three-quarters, with wrinkles;
  - muscles;
  - ornament on every edge (fringes, palmettes, a Medusa on the breastplate, winged thunderbolts).

  The old prompts invited some of this, with words like "fringed edge", "breastplate", "painted eye" and "crested helmet".
- Version 3 tried an Etruscan fresco instead. You prefer the vase, with these two references.

### The two references
They are cropped to the figure alone, so the tool copies the painting, not the pot:
- **`references/crop-vase-judge.png`**, a robed man with a staff by the Berlin Painter. Use it for the three robed advisors: **priest, economist, treasurer**.
- **`references/crop-vase-hoplite.png`**, a warrior with a shield and spear by the Kleophrades Painter. Use it for the two men of action: **general, fleet**.

The full vase photos are still there (`vase-A-redfigure-berlin-painter-judge.png`, `vase-A-redfigure-kleophrades-hoplite.png`), but attach the crops.

### What we want, exactly as on those vases
- **Two colours only:**
  - the figure is the flat orange of the clay, #D2742C;
  - the background is flat black, #0E0B0A;
  - nothing else: no coloured background, no glow, no third colour.
- **Thin black lines** inside the orange: the outline of the arms, a few long folds of the robe, the eye, the beard, the toes. Nothing more.
- **No shading at all.** No hatching, no gradient, no light. The orange is one flat colour.
- **The face in strict profile**, facing left: a straight nose in line with the forehead, a large eye, the beard and hair as a black mass with a wavy edge.
- **A calm, upright pose.** One arm forward holding something, the other at the side or holding a staff. Feet bare or in sandals, standing on a short black ground line.
- **Objects as plain orange shapes with a black outline.** No decoration on them.
- The advisors are told apart **by what they hold and wear, not by colour**.

**The test:** could you cut it out of a real Greek amphora in a museum? If it looks like a poster, a book cover or a game card, it is wrong.

## How to use them (ChatGPT)

1. **Start a new chat for each figure.** A long chat drifts back to the detailed look.
2. **Attach the advisor's reference crop** (named in each prompt) and send: "This is a figure from a real Greek red-figure vase. Describe its painting style in 5 short points: colours, lines, face, body, background." Let it answer. Saying the style back makes it follow the style much better.
3. **Paste the advisor's full prompt** below. Each one is complete, with the style included. Ask for portrait 2:3 (1024 × 1536).
4. **If it is still too detailed, don't start again: correct it in the same chat**, one fix at a time:
   - "Only two colours: flat clay orange and flat black. Remove every other colour."
   - "Remove all hatching and shading. The orange must be one flat colour."
   - "The background must be flat black, no glow, no vignette."
   - "Make the face like the reference: strict profile, no wrinkles, no realistic features."
   - "Half as many lines. Copy the number of lines in the reference."
   - "Remove every ornament and pattern."
5. **Keep the five alike.** When one is right, attach it to the next chat as well: "Same painter, same vase, same style exactly: [next prompt]".
6. Save the PNGs in `design/pieces/figures/` as `priest.png`, `general.png`, `fleet.png`, `economist.png`, `treasurer.png`, and tell Claude (or run `python web/build.py`).

In **Midjourney**, use the same prompt with `--ar 2:3 --style raw --stylize 0 --sref <link to the crop>` and add `--no` with the negative list below.

**Negative list** (for tools that take one): `modern illustration, poster, book illustration, concept art, digital painting, engraving, hatching, cross-hatching, shading, gradient, vignette, glow, coloured background, third colour, 3D, realistic face, three-quarter view, wrinkles, muscles, ornament, pattern, fringe, jewellery, vase shape, reflections, text, letters, border, meander, cropped feet`

## The five prompts

Each block is complete: copy the whole block.

### 1. Tertius Volusius, the haruspex (`priest.png`): reference `crop-vase-judge.png`

```
A single figure from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: the figure in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, no vase shape, no reflections.

The figure: an old priest who reads the future from livers. Standing upright, head in strict profile facing left, no beard, a large eye, a tall pointed cap. He wears a long robe to his feet and a mantle over one shoulder, drawn with a few long fold lines like the reference. His left hand holds up a sheep's liver in front of his face, a plain rounded orange shape. His right hand holds a tall thin staff with a small curl at the top. A small plain altar, a simple orange block, stands at his feet.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. A calm, stiff, dignified pose. No wrinkles, no muscles, no ornament, no pattern, no text, no border. Full figure from head to feet standing on a short black ground line, empty black space on both sides, portrait 2:3.
```

### 2. Marcus Antistius, prefect of the auxiliaries (`general.png`): reference `crop-vase-hoplite.png`

```
A single figure from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: the figure in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, no vase shape, no reflections.

The figure: a Roman officer, standing calmly, not fighting. Head in strict profile facing left, no beard, short hair as a black mass with a wavy edge, a large eye. He wears a plain body armour drawn only by its outline, a short tunic with a few pleats below it, and a short cloak hanging behind his shoulders. His left hand rests on the rim of a big round shield standing on the ground beside him: a plain orange circle with one black ring, no picture on it. His right hand holds a short straight staff across his chest. A short sword at his hip. Bare legs, sandals.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. A calm, stiff, dignified pose. No helmet crest, no muscles, no ornament, no pattern, no text, no border. Full figure from head to feet standing on a short black ground line, empty black space on both sides, portrait 2:3.
```

### 3. Epicadus the Liburnian, master of the fleet (`fleet.png`): reference `crop-vase-hoplite.png`

```
A single figure from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: the figure in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, no vase shape, no reflections.

The figure: a sea captain, a strong man. Head in strict profile facing left, a full curly beard as a black mass with a wavy edge, a large eye, a small pointed cap. He wears a short belted tunic with a few fold lines, his arms and legs bare. With both hands he holds upright a long steering oar, taller than himself: a thin straight pole with a flat blade at the bottom resting on the ground. A coil of rope over one shoulder, three simple loops. Bare feet.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. A calm, stiff, dignified pose. No muscles, no ship, no waves, no ornament, no pattern, no text, no border. Full figure from head to feet standing on a short black ground line, empty black space on both sides, portrait 2:3.
```

### 4. Nikandros of Epidaurum, adviser on trade (`economist.png`): reference `crop-vase-judge.png`

```
A single figure from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: the figure in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, no vase shape, no reflections.

The figure: a Greek merchant. Head in strict profile facing left, a short pointed beard, a large eye, a flat wide-brimmed traveller's hat hanging on his back by its cord. He wears a knee-length tunic and a short cloak pinned at one shoulder, a few long fold lines. His left arm stretched forward holds up a simple balance: a straight bar with two flat pans hanging on thin lines. His right hand rests at his side. Beside his feet a tall plain amphora with two handles, orange with a black outline. Laced boots.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. A calm, stiff, dignified pose. No wrinkles, no muscles, no ornament, no pattern, no coins, no text, no border. Full figure from head to feet standing on a short black ground line, empty black space on both sides, portrait 2:3.
```

### 5. Felix, keeper of the treasury (`treasurer.png`): reference `crop-vase-judge.png`

```
A single figure from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: the figure in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, no vase shape, no reflections.

The figure: a steward who keeps the money. Head in strict profile facing left, no beard, close-cropped hair as a black mass, a large eye. He wears a long plain tunic to his ankles, belted, with a small round purse hanging from the belt, a few long fold lines. His left hand holds an open writing tablet, two plain rectangles hinged together. His right hand holds a thin pointed stylus. On the ground beside him a small plain chest, an orange box with a black outline and a lid.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. A calm, stiff, dignified pose. No wrinkles, no muscles, no ornament, no pattern, no keys, no text, no border. Full figure from head to feet standing on a short black ground line, empty black space on both sides, portrait 2:3.
```

## Alternative: the fresco look (version 3)

If the vase does not work out, the fresco is still possible. In any prompt:
- Replace the first paragraph with: "A photograph of an ancient Etruscan tomb wall painting from Tarquinia, about 480 BC: one standing figure painted on cream plaster. Not a modern illustration."
- Replace the style paragraph with: "Flat colour, no shading. Skin in flat red-brown ochre (#A0462A), clothes in one flat colour, a wobbly dark brown brush outline, light cream plaster background (#EDE3CC) with a soft texture, no vignette. No ornament, no text. Full figure head to feet, portrait 2:3."
- Attach `references/fresco-B-tomb-of-the-leopards.png`.
