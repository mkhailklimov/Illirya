# Rules (Phase 0)

The game's numbers live here, not in code. The bot (Phase 1) will read these files, and its engine tests will replay the hand-played turns in `playtest-log.md`.

**Every value is a DRAFT.** It is a starting point to play and tune by hand (tasks 0.4–0.6). Change anything that doesn't feel right and note why in the playtest log.

| File | Task | What it holds |
|---|---|---|
| [numbers.csv](numbers.csv) | 0.4 | The 8 city numbers: unit, range, starting value |
| [decrees.csv](decrees.csv) | 0.4 | The 10 decrees: cost and what each changes |
| [formulas.md](formulas.md) | 0.5 | How a season is resolved: taxes, tribute, army pay, grain, loyalty, favour |
| [seasons.csv](seasons.csv) | 0.5 | What changes by season (harvest, sailing, tribute due) |
| [playtest-log.md](playtest-log.md) | 0.6 | 12 turns played by hand, with the numbers after each turn |

Open the CSV files in Excel or Google Sheets (File → Import), or in VS Code with the Rainbow CSV extension. Keep the column names unchanged; the bot will rely on them.

## Playing a turn by hand

1. Read the numbers at the start of the season (last row of the playtest log).
2. Pick up to 3 decrees from `decrees.csv`. Check you can pay for them.
3. Apply `formulas.md` top to bottom, in order: decrees, income, spending, grain, people, loyalty, favour, then the lose checks.
4. Draw an event card from `../events/` if its trigger fits (or roll a die), and apply its effect.
5. Write the new numbers and one line of notes in `playtest-log.md`. Was it fun? Did the vicious cycle bite?

## Naming

The ids (`grain`, `treasury`, `raise_taxes`, …) are the names the bot will use. Display names can change freely; ids should not once the bot exists.
