# Event cards (task 0.7)

One card per YAML file, named `e<number>-<short-name>.yaml` (e.g. `e001-drought.yaml`). Phase 0 needs 20 cards (done: e001–e026; e022–e026 are draft Omen cards to choose from), the bot prototype 40, the full game about 150 (three cards a season over 48 turns).

## Three decks, three cards a season

Every season one card is drawn from each deck and **all three are turned over at once**, before the governor's decrees. Cards with a choice can be answered in any order.

| Deck | What's in it |
|---|---|
| **Land** | Weather and harvests, floods and earthquakes, the townspeople, raiders from the hills, the council's land business |
| **Sea** | Pirates, merchants and convoys, the harbour, and **letters from Rome** (orders, demands and praise travel by sea) |
| **Omen** | Signs from the gods, read by the haruspex: eagles, lightning, dark entrails |

Each deck also has a **quiet card** (`q-land`, `q-sea`, `q-omen`) so that not every season is dramatic. A card's `chance` is its weight in its deck: of the cards that fit the season, a card with 0.30 is drawn three times as often as one with 0.10.

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
| `deck` | `land`, `sea` or `omen` |
| `quiet` | `true` for a deck's quiet card |
| `title` | Short headline shown to the player |
| `category` | `rome`, `locals`, `nature`, `raiders`, `trade` or `council` |
| `advisor` | For `council` cards: who brings it (`fleet`, `general`, `economist`, `treasurer`, `priest`; see `../rules/advisors.csv`) |
| `seasons` | Seasons it can happen in (`any`, or a list) |
| `years` | Earliest and latest year, e.g. `[30, 42]` |
| `trigger` | When it can fire: `random`, a condition on the numbers (`loyalty < 30`), or the wind (`wind == S`) |
| `chance` | Weight when the season's card is drawn from its deck (only cards whose trigger holds take part) |
| `once` | `true` if it can only happen once per game |
| `effects` | Changes applied immediately (numbers only) |
| `choice` | Optional: options with their own effects; the player picks one |
| `roll` | Optional, inside a choice option: `die` (4, 6, 8, 10, 12 or 20), `bonus` (e.g. `army / 50`), `target`, and `success` / `failure` effects. See [e008-hill-raid.yaml](e008-hill-raid.yaml) |
| `scribe_hint` | One line for the AI scribe about tone or detail |
| `historical_note` | The short accurate note shown at the end of the dispatch |
| `source` | Where the history was checked |
