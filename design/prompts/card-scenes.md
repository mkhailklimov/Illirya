# Prompts: the 57 cards in vase style

These pictures will replace the line drawings on the Land, Sea and Omen cards, one card at a time. A card with no new picture keeps its line drawing, so you can make them in any order.

## How to use them (ChatGPT)

1. **Test three cards first:** `e012-bumper-crop` (a simple scene), `e021-storm` (no calm figures) and `e007-priest-omens` (an advisor). Send them to Claude to check in the game before you make the rest.
2. **Start a new chat for every card.** A long chat drifts back to the detailed look.
3. **Attach the file named under the card's title.** Advisor files are in `design/pieces/figures/`, and so is `references/`. When a card has come out well, attach it too and add: "Same painter, same vase, same style exactly."
4. **Paste the whole prompt** and ask for landscape 3:2 (1536 × 1024). The picture box on a card is wide and low (about 300 to 420 pixels wide and 168 high), so every prompt keeps the scene in the middle, where nothing important gets cut.
5. **Save it as a PNG in `design/pieces/cards/`, named after the card**, for example `e012-bumper-crop.png`.

**If it comes out too detailed, correct it in the same chat, one fix at a time:**
- "Only two colours: flat clay orange and flat black. Remove every other colour."
- "Remove all hatching and shading. The orange must be one flat colour."
- "The background must be flat black, with no glow and no vignette."
- "Half as many lines. Copy the number of lines in the reference."
- "Fewer things: make the main subject twice as big." (The picture is shown only 168 pixels high.)
- "Remove every ornament, pattern and letter."

**In Midjourney:** use the same prompt with `--ar 3:2 --style raw --stylize 0 --sref <link to the reference>` and this list after `--no`:

`modern illustration, poster, book illustration, concept art, digital painting, engraving, hatching, shading, gradient, vignette, glow, coloured background, third colour, 3D, perspective, realistic face, three-quarter view, wrinkles, muscles, ornament, pattern, jewellery, vase shape, reflections, text, letters, border, meander, nudity`

## Land (16 cards)

Fields, townspeople, raiders, inventions and disasters.

### The springs run dry

Save as `e001-drought.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: A woman in a long robe kneels at a small stone spring and tips a big water jar upside down: one single drop falls from it. Beside her, three dry stalks of wheat bend over.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### The garrison wants its pay raised

Save as `e004-general-pay.png`. Attach `general.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: Antistius the officer, beardless, with short hair, plain body armour, a short pleated tunic and a short cloak, stands at the left with his arms at his sides. Facing him, two soldiers in short tunics each hold out one open, empty hand. Their shields rest on the ground behind them.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### Nikandros offers a salt deal

Save as `e005-economist-salt.png`. Attach `economist.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: Nikandros the merchant, with a short pointed beard, a knee-length tunic, a short cloak and a flat traveller's hat hanging on his back, walks in front and points forward. Behind him a mule on a lead rope carries two big plain sacks, one on each side.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### Raiders come down from the hills

Save as `e008-hill-raid.png`. Attach `references/crop-vase-hoplite.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: Two hill warriors in short tunics run to the left, each with a spear and a small round shield, driving a big cow in front of them. Behind them a small round hut burns, with a few flat flame shapes on its roof.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### The torrents flood the lower fields

Save as `e009-flood.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: A big plain mountain shape at the right pours a thick stream of water down its side, drawn as long curling lines. The water fills the bottom of the picture as a row of large plain waves. A farmer in a short tunic wades through it up to his knees, carrying a sack on his head.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### The earth shakes

Save as `e010-earthquake.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: A small plain temple with four columns falling apart: two columns lean over and the roof block slides off. The ground line under it is broken by a big zigzag crack. A small man runs away to the left with both arms in the air.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### Angry crowds in the forum

Save as `e011-unrest.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: Three townsmen in long robes stand side by side and face left, each with one fist raised above his head, shouting with open mouths. The first one holds a stone. In front of them stands an empty speaker's platform, a plain block with two steps.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### A bumper harvest

Save as `e012-bumper-crop.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: An ox pulls a two-wheeled cart heaped very high with sheaves of wheat. A farmer in a short tunic walks beside it, with a sickle in one hand and a sheaf over his shoulder.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### A farmer ploughs up a hoard

Save as `e013-treasure.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: A farmer in a short tunic stands behind a simple wooden plough and an ox. He lets go of the handle and throws up one hand in surprise. On the ground in front of him lies a broken round jar, with a heap of plain round coins spilling out of it.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### A great vintage

Save as `e014-great-vintage.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: Two men in short tunics hold hands and tread grapes in a wide wooden vat, knees high, as if dancing. Juice runs from a spout in the vat into a big amphora. A vine with a few bunches of grapes arches over them.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### A plough on wheels

Save as `e027-wheeled-plough.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: A big heavy plough with two small round wheels very clearly visible at the front and a large iron blade, pulled by an ox. A farmer in a short tunic holds the handles and looks down at the wheels.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### A better loom

Save as `e028-upright-loom.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: A woman in a long robe sits on a low stool at a tall upright loom: two plain posts, a beam at the top, a beam at the bottom, and many straight vertical threads between them. She reaches up to the threads with one hand. A finished folded cloth lies beside her.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### Clay by the river

Save as `e029-brick-kiln.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: A round domed brick kiln with an arched opening at the bottom, with flat flame shapes inside it. A man in a short tunic stands beside it and holds up one flat roof tile with both hands. A neat stack of tiles stands behind him.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### Plague in the harbour quarter

Save as `e030-plague.png`. Attach `priest.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: A sick man lies on a low plain couch with one arm hanging down. A woman in a long robe stands at his feet with one hand on her head in grief. Tertius the priest, a beardless old man in a tall pointed cap and a long robe, stands at his head holding a burning torch in one hand and a small sprig in the other. No blood, no wounds.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### Fever from the marsh

Save as `e031-marsh-fever.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: Two men in short tunics dig a ditch with long-handled mattocks, swinging them high. Tall plain reeds stand in a row behind them, with a band of plain waves at their feet. Above them, one big mosquito, drawn large and simple, far bigger than life.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### A quiet season in the fields

Save as `q-land.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: A shepherd in a short tunic and a wide hat stands at ease, leaning on a long staff with his legs crossed. Two goats graze in front of him, and one stands on its hind legs to reach a small tree.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

## Sea (12 cards)

Ships, trade, the harbour and the fleet.

### Sails off Risinium

Save as `e002-pirates.png`. Attach `references/crop-vase-hoplite.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: A long low galley seen from the side, with a pointed ram at the bow and one plain square sail. Three men with spears and round shields stand in a row along its side. The ship sails to the left over a single row of large plain waves.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### Epicadus wants a galley

Save as `e003-fleet-liburna.png`. Attach `fleet.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: Epicadus the sea captain, with a full curly beard, a small pointed cap and a short belted tunic, stands at the left holding his long steering oar and points at an unfinished galley: a bare hull with a few plain ribs, on wooden props. A shipwright in a short tunic swings an axe at the hull.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### Felix finds missing denarii

Save as `e006-treasurer-skimming.png`. Attach `treasurer.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: Felix the steward, beardless, with cropped hair and a long belted tunic with a small purse at the belt, stands at the left and holds up two wax tablets, one in each hand, comparing them. Facing him, a customs man in a long tunic looks away with his head turned back, and hides a fat purse behind his back.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### Merchants bring cheap oil

Save as `e015-olive-merchants.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: A bearded ship's captain in a short tunic stands on a quay and holds out a big amphora with both hands. Behind him, four more amphorae stand in a row, and the curved stern of a ship rises at the right edge.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### A letter from Rome demands troops

Save as `e016-rome-troops.png`. Attach `references/crop-vase-hoplite.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: Three soldiers in single file with spears and round shields walk up a sloping plank onto the side of a ship. A messenger in a short cloak stands at the foot of the plank and holds up a tablet with a round seal.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### A letter from Capri

Save as `e017-rome-praise.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: A steep rocky island with a small plain house with columns on top of it. In front of it a small boat with one rower crosses a row of plain waves, and a messenger stands in the boat holding up a rolled letter.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### A Greek engineer and his new press

Save as `e018-screw-press.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: A big wooden press: two thick posts, a crossbeam and one huge vertical screw with bold spiral lines. A man in a short tunic walks round pushing a long bar that turns the screw. Oil runs from a spout into a jar. A Greek engineer in a long robe holds up a tablet and watches.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### A storm scatters the shipping

Save as `e021-storm.png`. Attach `references/crop-vase-hoplite.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: One small ship tilted steeply on a huge curling wave, its mast broken and its plain sail torn. Two tiny men cling to the side. More large waves fill the bottom of the picture, and slanting lines of rain cross the top.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### A pilot's book of the coast

Save as `e032-pilot-charts.png`. Attach `fleet.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: Epicadus the sea captain, with a full curly beard, a small pointed cap and a short belted tunic, and an old Greek pilot with a long beard and a long robe stand facing each other and hold a long open scroll stretched between them. On the scroll, only one long wavy line for the coast. No letters. Epicadus touches the line with his thumb.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### A foresail from Alexandria

Save as `e033-new-rig.png`. Attach `fleet.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: A big round-bellied merchant ship seen from the side, sailing to the left over a row of plain waves. It has one big square sail on the main mast and, very clearly, a second small sail on a short mast that leans forward over the bow. One small man stands at the steering oar.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### Thirsty soldiers in Aquileia

Save as `e034-wine-in-aquileia.png`. Attach `references/crop-vase-hoplite.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: Two soldiers in short tunics, with their shields on the ground behind them, each lift a wide shallow drinking cup. Between them a big amphora leans on a stand, and a ship's captain tips it to pour for them.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### Ordinary traffic in the harbour

Save as `q-sea.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: One small fishing boat on a row of plain waves. A fisherman in a short tunic stands in it and throws a round net. Three plain fish swim below the waves.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

## Letters from Rome (15 cards)

These are Sea cards too, and they arrive on fixed dates. Each has its own scene instead of a picture of a letter.

### Letter from Rome: Sejanus has fallen

Save as `h01-sejanus.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: Two men in short tunics pull with all their weight on a rope tied round the neck of a tall statue of a man in a long robe. The statue tilts and is about to fall from its plain block.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### Letter from Rome: money is short

Save as `h02-credit-crisis.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: A merchant in a long robe stands at a plain table and turns an empty purse upside down over it. Nothing falls out. Facing him, a moneylender holds out an open hand. There is one single coin on the table.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### Letter from Rome: Tiberius is dead

Save as `h03-tiberius-dies.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: A big old eagle falls head first from the top of the picture, wings folded back. Below it, a row of plain waves. At the left a messenger in a short cloak looks up and holds out a broken ring in his open hand.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### Letter from Rome: the Emperor needs gold

Save as `h04-caligula-money.png`. Attach `references/crop-vase-hoplite.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: A young horseman in a cloak and breastplate rides proudly across a line of five small boats lashed side by side to form a bridge, with a flat road on top of them. A row of plain waves runs underneath.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### Letter from Rome: Gaius is a god

Save as `h05-caligula-god.png`. Attach `priest.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: A huge bronze head of a young man, with no body, sits in a plain open crate with straw sticking out of it. Tertius the priest, a beardless old man in a tall pointed cap and a long robe, stands beside it and leans back with both hands raised in fear.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### Letter from Rome: Gaius murdered

Save as `h06-claudius.png`. Attach `references/crop-vase-hoplite.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: A tall curtain hangs between two posts, drawn with long fold lines. A soldier with a spear pulls it aside with one hand. Behind it an older man in a long robe cowers with his hands up. The soldier is starting to kneel to him.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### Letter from Salona: the governor rebels

Save as `h07-scribonianus.png`. Attach `references/crop-vase-hoplite.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: A governor in armour and a cloak stands on a low plain platform and raises a sword high. A soldier beside him holds a tall pole with a plain eagle on top, but has turned his back and is walking away.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### Letter from Rome: Claudius is dead

Save as `h08-claudius-dies.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: An old man in a long robe has collapsed on a dining couch, with one arm hanging down to the floor. On a small three-legged table in front of the couch stands a dish piled with big mushrooms, drawn large and clear. No blood.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### Letter from Rome: the city burns

Save as `h09-great-fire.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: A row of plain city buildings and one small temple with columns, side by side, with tall flat tongues of flame rising from every roof to the top of the picture. One small man runs away with a bundle on his back.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### Letter from Rome: Nero is dead

Save as `h10-nero-dies.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: No figures. A plain empty couch with a rumpled robe on it. On the ground in front of it, a lyre with broken strings lies on its side, next to a short dagger. No blood.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### Letter from the Danube: the legions march for Vespasian

Save as `h11-danube-legions.png`. Attach `references/crop-vase-hoplite.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: Three soldiers in single file march to the left with round shields and spears, all in step. The first one carries a tall pole with a plain eagle on top.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### Letter from Rome: Vespasian is dead

Save as `h12-vespasian-dies.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: A very old bald man in a long robe stands with his knees giving way, smiling, held up under each arm by a younger attendant. He raises one hand as if telling a joke.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### Letter from Rome: a mountain buries Campania

Save as `h13-vesuvius.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: A big plain triangular mountain with flat flames and big round stones bursting from its top. At the bottom left a small galley on a row of plain waves, with one small figure standing up in it and raising an arm toward the mountain.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### Letter from Rome: Titus is dead

Save as `h14-titus-dies.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: A funeral scene as on old Greek vases: a young man lies on a high plain bier, wrapped in a long cloth. Two mourners, one at each end, stand with both hands raised to their heads.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### Letter from Rome: the Dacians cross the Danube

Save as `h15-dacian-war.png`. Attach `references/crop-vase-hoplite.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: A Dacian warrior in trousers and a soft pointed cap strides to the left, holding a long curved sword and a pole topped with a plain dragon's head. He walks on a flat line of ice with cracks in it. A Roman helmet lies on the ice in front of him.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

## Omen (14 cards)

Signs from the gods, mostly read by Tertius Volusius.

### The haruspex reads a dark omen

Save as `e007-priest-omens.png`. Attach `priest.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: Tertius the priest, a beardless old man in a tall pointed cap and a long robe, stands at a plain altar and holds up a sheep's liver with one big dark spot on it, staring at it. Thin wavy lines of smoke rise from the altar. A townsman behind him watches with one hand over his mouth.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### Eagles over the forum

Save as `e019-eagles.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: Two big eagles with wings spread wide fly to the left, one above the other, filling the top of the picture. Below them a small man in a long robe looks up and points at them.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### Lightning strikes the temple

Save as `e020-lightning.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: One huge zigzag thunderbolt comes down from the top of the picture and strikes the roof of a small plain temple with four columns. The roof is cracked, with a few flat flames. A man runs away to the left with his arms up.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### A comet over the bay

Save as `e022-comet.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: A big star with a very long tail of straight streaks crosses the black sky from right to left, above a line of plain mountain peaks. Two small men stand on a low wall at the bottom, one pointing up, the other covering his mouth.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### A prophetess in the market

Save as `e023-prophetess.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: A wild-looking woman with long loose hair, in a long robe, stands on a plain rock with one arm raised high and her mouth open. Two townsmen sit on the ground in front of her and listen, looking up.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### A serpent in the temple

Save as `e024-sacred-snake.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: A very big snake lies coiled in loops on three plain temple steps, its head raised. An old woman in a long robe and a veil bends down and offers it a shallow bowl of milk with both hands.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### The governor's dream

Save as `e025-governors-dream.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: A man in a long robe lies asleep on a plain couch at the bottom of the picture, with his head on his arm. Floating in the black space above him, as in a dream, a small ship sinks bow first into a short row of plain waves.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### Seabirds fly inland

Save as `e026-birds-harbour.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: A flock of seven big plain seabirds flies to the right across the top of the picture, towards a plain mountain at the right edge. Below them a fisherman in a short tunic holds a net over his shoulder and shades his eyes as he looks up.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### The physician who restores sight

Save as `e035-cataract.png`. Attach `references/crop-vase-judge.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: An old fisherman in a short tunic sits on a stool with his face tilted up. A Greek physician in a long robe stands in front of him, holding his chin with one hand and a very thin long needle near his eye with the other. No blood. A plain box of tools stands on the ground.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### The liver shows a lean year

Save as `e036-lean-year.png`. Attach `priest.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: Tertius the priest, a beardless old man in a tall pointed cap and a long robe, holds up a very small shrivelled liver. In front of him, a farmer in a short tunic hangs his head and holds out one thin, bare stalk of wheat, bent over and almost without grain.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### The liver shows a rich year

Save as `e037-rich-year.png`. Attach `priest.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: Tertius the priest, a beardless old man in a tall pointed cap and a long robe, holds up a very large rounded liver and smiles. In front of him stand three tall, thick stalks of wheat heavy with grain, as tall as he is. A farmer in a short tunic pours a little wine on the ground from a shallow cup.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### Sell your oil in Aquileia

Save as `e038-oil-in-aquileia.png`. Attach `priest.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: The god Mercury in a winged hat and winged sandals, holding a staff topped with two curls, points at three tall oil jars standing in a row, one of them tipped over and empty. Tertius the priest, a beardless old man in a tall pointed cap and a long robe, stands on the other side of the jars with both hands raised.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### A sickness is coming by sea

Save as `e039-plague-foretold.png`. Attach `priest.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: Tertius the priest, a beardless old man in a tall pointed cap and a long robe, stands at the left and holds up a liver covered in black spots. With his other hand raised, palm out, he signals a ship to stop. At the right a merchant ship with a plain sail comes towards him over a row of plain waves.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

### The gods are silent

Save as `q-omen.png`. Attach `priest.png`.

```
A scene from an ancient Greek red-figure vase painting, about 480 BC, in exactly the style of the attached reference: everything in flat clay orange (#D2742C) on a flat black background (#0E0B0A), drawn with a few thin black lines. Not a modern illustration. Show only the flat painting, unrolled like a frieze, with no vase shape and no reflections.

The scene: Tertius the priest, a beardless old man in a tall pointed cap and a long robe, stands with his arms at his sides beside a plain altar with one thin, straight line of smoke, looking up at the empty black sky. Nothing else.

Style: two colours only, clay orange and black. No shading, no hatching, no gradient, no glow. Any face is in strict profile with a large eye and no wrinkles, in a calm, stiff pose, and all people are fully clothed. Everything is seen flat from the side, with no perspective, on one short black ground line. A few big, simple shapes that read at a small size. No muscles, no ornament, no pattern, no text, no border. Keep the whole scene in the middle of the picture, with empty black space above, below and on both sides. Landscape 3:2.
```

