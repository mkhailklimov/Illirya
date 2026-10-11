# Event cards (task 0.7)

One card per YAML file, named `e<number>-<short-name>.yaml` (e.g. `e001-drought.yaml`). Phase 0 needs 20 cards, the bot prototype 40, the full game 100+.

Copy [_template.yaml](_template.yaml) to start a card. The two examples, [e001-drought.yaml](e001-drought.yaml) and [e002-pirates.yaml](e002-pirates.yaml), show a plain card and a card with a choice.

## Rules for a good card

- **Effects use the ids from `../rules/numbers.csv`** (`grain`, `treasury`, `goods`, `wine_oil`, `people`, `loyalty`, `favour`, `army`). The engine applies them; the AI only narrates.
- **Keep effects small and readable.** One to three numbers change; the card should matter, not decide the game.
- **A choice must be a real dilemma.** Each option costs something different (money vs loyalty vs favour).
- **History must fit AD 30–42.** Use peoples, places and rulers of the period (see the concept doc, section 6). The `historical_note` is one or two accurate sentences; put where you checked it in `source`.
- **Mix the categories** across the deck: Rome, locals, nature, raiders, trade, and the council.
- **Council cards** come from one of the governor's five advisors (e003–e007 are one each). They are the best way to give the advisors a personality.

## Fields

| Field | Meaning |
|---|---|
| `id` | Same as the file name without `.yaml` |
| `title` | Short headline shown to the player |
| `category` | `rome`, `locals`, `nature`, `raiders`, `trade` or `council` |
| `advisor` | For `council` cards: who brings it (`fleet`, `general`, `economist`, `treasurer`, `priest`; see `../rules/advisors.csv`) |
| `seasons` | Seasons it can happen in (`any`, or a list) |
| `years` | Earliest and latest year, e.g. `[30, 42]` |
| `trigger` | When it can fire: `random`, or a condition on the numbers |
| `chance` | Chance per season when the trigger holds (0–1) |
| `once` | `true` if it can only happen once per game |
| `effects` | Changes applied immediately (numbers only) |
| `choice` | Optional: options with their own effects; the player picks one |
| `scribe_hint` | One line for the AI scribe about tone or detail |
| `historical_note` | The short accurate note shown at the end of the dispatch |
| `source` | Where the history was checked |
