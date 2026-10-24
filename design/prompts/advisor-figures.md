# Prompts: the five advisors at full length

These pictures replace the line drawings in the game's big pop-ups (the enemy at the gates, the judgement, the haruspex's prophecy, the inventions, the advisors' special abilities). The round coin portraits on the council stay as they are.

## How to use them

1. Generate each advisor with the **shared style block** plus **his own prompt** below. Midjourney, ChatGPT (image), Ideogram and Flux all work.
2. Use **portrait 2:3** (Midjourney `--ar 2:3`; elsewhere 1024 × 1536). Keep the whole figure inside the frame, feet included, with some empty space at the left and right edges: the game shows the picture at 1:2 and trims the sides a little.
3. **Keep the five alike.** Make Tertius first. When he looks right, give his picture as a style reference to the other four (Midjourney: `--sref <link to his image>`; ChatGPT: "same style as this image"). Use the same seed if your tool has one.
4. Save the files as PNG under `design/pieces/figures/`, named after the advisor's id: `priest.png`, `general.png`, `fleet.png`, `economist.png`, `treasurer.png`. Then run `python web/build.py` (it writes `web/img/figure-<id>.webp`), or simply tell Claude the files are there. The game picks a picture up automatically; while an advisor has none, his line drawing is shown.

## Shared style block (paste before every prompt)

**A: our house style (matches the coins, the cards and the city map).** Recommended.

> Full-length standing figure of a man in Roman Illyria, AD 30, seen from head to feet, three-quarter view, calm dignified pose, centred, plain background. Flat stylised illustration like a figure on an ancient coin or a Greek vase frieze: simple bold shapes, the figure as a deep near-black silhouette with soft details, a thin warm gold rim light along its edges, the objects he holds picked out in burnished gold. Background: a dusk gradient from night blue (#0d1530) to violet (#3a2552) with a soft glow behind the figure in {COLOUR}. Muted, elegant, no text, no letters, no frame, no border, no watermark.

**B: painted alternative.** Use this if A looks too flat to you.

> Full-length standing figure of a man in Roman Illyria, AD 30, head to feet, three-quarter view, centred. Painterly character art for a historical strategy board game, oil-painting texture, dramatic rim lighting at dusk, rich but dark palette of tyrian purple, deep blue and burnished gold, historically accurate clothing and objects, plain dark background with a soft glow in {COLOUR}. No text, no frame, no watermark.

**Negative prompt** (if your tool has one): `text, letters, logo, watermark, frame, cropped feet, extra fingers, modern clothing, fantasy armour, horned helmet, medieval, anime, photorealistic face`

Replace `{COLOUR}` with each advisor's colour below. They are the same colours the game uses for him.

## 1. Tertius Volusius, the haruspex (`priest.png`), colour: deep violet (#4a2a66)

> A Roman haruspex, about 55 years old, lean, clean-shaven, a long solemn face. He wears a long tunic to the ground and a heavy fringed mantle pinned at the shoulder, and on his head the tall pointed cap of an Etruscan haruspex, tied under the chin. In his raised right hand the lituus, a staff curled at the top like a crook; in his left hand, held up to the light, a bronze model of a sheep's liver engraved with the regions of the gods (like the Liver of Piacenza). Beside his feet a small stone altar with a thin ribbon of smoke rising. Mood: mysterious, wise, a man who knows what is coming.

## 2. Marcus Antistius, prefect of the auxiliaries (`general.png`), colour: dark crimson (#6a1830)

> A Roman auxiliary prefect, about 45, short grey hair, clean-shaven, weathered face, firm jaw. He wears a bronze muscled cuirass over a red military tunic, leather strips (pteruges) at the shoulders and hips, a red officer's cloak over his left shoulder, military sandal-boots (caligae). An Imperial-Gallic style helmet with a short red crest is tucked under his left arm. In his right hand the knotted vine staff of command (vitis), held across his body. A gladius in its scabbard on his left hip. An oval auxiliary shield leans against his leg. Mood: disciplined, practical, utterly reliable.

## 3. Epicadus the Liburnian, master of the fleet (`fleet.png`), colour: Adriatic blue (#24506a)

> An Illyrian sea captain from Liburnia, about 50, broad-shouldered and weathered, a thick dark beard going grey, a conical felt cap (pilos). He wears a short belted woollen tunic, bare strong forearms, a coil of rope over one shoulder, simple sandals, a small bronze amulet on a cord. With his right hand he holds upright a tall ship's steering oar (a Roman gubernaculum), taller than himself. Behind his legs, small, the curved prow of a liburna with a painted eye. Mood: blunt, superstitious, at home on the sea.

## 4. Nikandros of Epidaurum, adviser on trade (`economist.png`), colour: deep green (#2f5a3a)

> A Greek merchant of the Adriatic coast, about 40, clever lively eyes, a neat short beard, a wide-brimmed traveller's hat (petasos) pushed back on his head. He wears a knee-length chiton and a short cloak (chlamys) pinned at the right shoulder with a bronze brooch, and tall laced boots. In his outstretched right hand a bronze merchant's balance (libra) with two pans, one pan lower with a coin in it. At his feet a wine amphora with a stamped seal and a small sack of coins. Mood: shrewd, charming, always has a deal.

## 5. Felix, keeper of the treasury (`treasurer.png`), colour: dark bronze (#6a5020)

> A Roman freedman steward (dispensator), about 45, close-cropped hair, clean-shaven, careful watchful face. He wears a plain long belted tunic, a heavy bunch of iron keys and a leather coin purse hanging from his belt. In his hands an open wooden wax tablet (a diptych) with lines of writing scratched into the wax, and a bronze stylus. Beside him an iron-bound wooden strongbox (arca), its lid open on a heap of silver denarii. Mood: precise, anxious about the tribute, honest to the last coin.

## Later, if these work

The same style block can make more of the game's images: the Sanctuary of Cadmus and Harmonia (the religious victory), the screw press, a trireme, and each of the four victory endings. Ask Claude for those prompts when you want them.
