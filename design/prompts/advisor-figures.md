# Prompts: the five advisors at full length

These pictures replace the line drawings in the game's big pop-ups (the enemy at the gates, the judgement, the haruspex's prophecy, the inventions, the advisors' special abilities). The round coin portraits on the council stay as they are.

## The look we want (version 2, 24 October 2026)

The first try (realistic painted illustration, kept in `design/pieces/figures/drafts-realistic/`) looked like a plate from a history book: shading, muscles, 3D light. That is too much. We want **the way the ancients drew themselves**: a figure from a Greek painted vase or a Roman/Etruscan wall painting. That means:

- **Flat colour, no shading.** No gradients, no light and shadow, no 3D. Each area is one colour.
- **A bold contour line** around every shape, and a few thin lines for folds, hair and details. Drapery folds are parallel lines, not modelled cloth.
- **Head in profile,** with the almond-shaped eye drawn as if seen from the front, as on the vases. Body upright, a stiff, formal, dignified pose.
- **Few colours:** terracotta orange, black, cream and a little gold or dark red.
- **Simple:** a child should be able to copy it. One or two objects in the hands, nothing else.

This sits between the game's line drawings and the realistic pictures: as clear as a sketch, as rich as real ancient art.

## How to use the prompts

1. Use **style block A** (red-figure vase) for all five. It suits the game's dark screens best. Style B (fresco) is the alternative if A feels too dark.
2. Use **portrait 2:3** (Midjourney `--ar 2:3`; elsewhere 1024 × 1536). Draw the whole figure, feet included, with empty space left and right: the game shows it at 1:2 and trims the sides.
3. **Give a style reference.** This matters more than the words. Download a photo of a real red-figure vase (for example the Berlin Painter's amphorae, or Achilles and Ajax playing dice by Exekias, black-figure) and attach it:
   - in ChatGPT: "in the style of this image";
   - in Midjourney: `--sref <image link>`, plus `--style raw --stylize 50` so it does not make it pretty.
   Where to find reference pictures (most images on these pages are public domain; check the licence on the image's own page before you upload it anywhere):
   - Red-figure vases: [Red-figure pottery](https://en.wikipedia.org/wiki/Red-figure_pottery), [the Berlin Painter](https://en.wikipedia.org/wiki/Berlin_Painter), or search Wikimedia Commons for [red-figure amphora](https://commons.wikimedia.org/w/index.php?search=red-figure+amphora).
   - Black-figure (simpler still): [Exekias](https://en.wikipedia.org/wiki/Exekias), the amphora of Achilles and Ajax playing dice (Vatican Museums).
   - Wall painting (style B): [Tomb of the Leopards, Tarquinia](https://en.wikipedia.org/wiki/Tomb_of_the_Leopards), or search Commons for [Pompeii fresco figure](https://commons.wikimedia.org/w/index.php?search=Pompeii+fresco+figure).
   - **Ready to use:** eight of them are already saved as PNG in [`design/pieces/figures/references/`](../pieces/figures/references/), with credits and licences. Start with `vase-A-redfigure-berlin-painter-singer.png` (one standing figure on black); for the robed advisors try `vase-A-redfigure-berlin-painter-judge.png`, for Antistius `vase-A-redfigure-kleophrades-hoplite.png`.
4. **Keep the five alike.** Make Tertius first. When he is right, use him as the style reference for the other four.
5. Save the PNGs in `design/pieces/figures/` as `priest.png`, `general.png`, `fleet.png`, `economist.png`, `treasurer.png`, and tell Claude (or run `python web/build.py`).

## Style block A: red-figure vase (recommended)

> Ancient Greek red-figure vase painting, 5th century BC style. A single standing figure, full length from head to feet, head in strict profile with the eye drawn frontally, upright formal pose. The figure is the orange-red colour of the clay, outlined with a bold black contour line; folds of the clothes, hair and details drawn with fine black lines; a little gold and dark red for the objects he holds. The background is flat glossy black. Completely flat: no shading, no gradients, no 3D, no perspective. Simple, elegant, few lines, like the painting on an amphora. No border, no meander band, no text, no letters.

## Style block B: wall painting (alternative)

> Roman or Etruscan wall painting (fresco), like the tomb paintings of Tarquinia or the frescoes of Pompeii. A single standing figure, full length from head to feet, head in profile, upright formal pose. Flat areas of colour (ochre, terracotta red, black, cream) with a dark outline, no shading, no 3D; the plaster's soft texture visible. Plain background of {COLOUR}. Simple, few lines, naive and elegant. No border, no text, no letters.

**Negative prompt** (if your tool has one): `realistic, photorealistic, 3D, shading, gradient, muscles, dramatic lighting, rim light, digital painting, concept art, book illustration, detailed face, text, letters, frame, border, cropped feet`

For style B, replace `{COLOUR}` with the advisor's colour below.

## The five advisors

Each prompt goes after the style block. They are deliberately short: a vase painter shows only what tells you who the man is.

### 1. Tertius Volusius, the haruspex (`priest.png`), colour for B: deep violet

> A Roman priest who reads the future, an old lean man with no beard. He wears a tall pointed cap tied under the chin and a long mantle with a fringed edge reaching to his feet. In one hand a tall staff curled at the top like a crook; in the other, held up before his face, a sheep's liver. A small altar with a curl of smoke stands at his feet.

### 2. Marcus Antistius, prefect of the auxiliaries (`general.png`), colour for B: dark red

> A Roman officer, a middle-aged man with short hair and no beard. He wears a breastplate, a short tunic with a fringe of leather strips, a cloak hanging from one shoulder, and laced military sandals. He holds a short knotted staff of vine wood across his chest; a crested helmet is under his other arm, and a sword hangs at his hip. A tall oval shield leans against his leg.

### 3. Epicadus the Liburnian, master of the fleet (`fleet.png`), colour for B: sea blue

> An Illyrian sea captain, a strong man with a full curly beard and a pointed felt cap. He wears a short belted tunic and sandals, with a coil of rope over one shoulder. With one hand he holds upright a long steering oar, taller than himself. Small at his feet, the curved prow of a ship with a painted eye.

### 4. Nikandros of Epidaurum, adviser on trade (`economist.png`), colour for B: dark green

> A Greek merchant, a man with a short neat beard and a wide-brimmed traveller's hat. He wears a short tunic, a short cloak pinned at the shoulder and high laced boots. In one outstretched hand a merchant's balance with two hanging pans. A tall amphora stands at his feet.

### 5. Felix, keeper of the treasury (`treasurer.png`), colour for B: dark ochre

> A Roman steward, a man with close-cropped hair and no beard. He wears a long plain belted tunic, with a bunch of keys and a purse hanging from the belt. He holds an open wax writing tablet in one hand and a pointed stylus in the other. Beside him stands a wooden strongbox bound with iron, full of coins.

## If it still comes out too realistic

- Add at the start: "flat 2D, in the exact style of an ancient Greek vase painting".
- Attach the vase photo again and say: "copy this style exactly: flat colours, black outline, no shading".
- Ask for "simpler, fewer lines" once more. The tools tend to add detail; keep taking it away.
