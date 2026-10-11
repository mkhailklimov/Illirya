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
| [advisors.csv](advisors.csv) | 0.7 | The governor's council: five advisors with names, roles and voices |
| [play.py](play.py) | 0.6 | Plays the game in the terminal using all of the above |

Open the CSV files in Excel or Google Sheets (File → Import), or in VS Code with the Rainbow CSV extension. Keep the column names unchanged; the bot will rely on them.

## Playing in the terminal (easiest)

In VS Code open a terminal (**Terminal → New Terminal**) in the `Illirya` folder and run:

```
pip install pyyaml          (once)
python rules/play.py
```

Each turn shows the town's numbers and advice from your council, then asks for up to 3 decrees: type their numbers, e.g. `5 9` for terraces and a festival, or press Enter for none. The game applies the formulas, may draw an event card (some ask you to choose), and shows what changed. Type `q` to save and stop; run it again to continue, or `python rules/play.py --new` to start over.

Every turn is written to `playtest-runs/run-<date>.csv`. Copy the interesting rows and your notes into `playtest-log.md`. To tune the game, change the CSV files or the constants at the top of `play.py` (they follow `formulas.md`) and play again.

## Playing a turn by hand

1. Read the numbers at the start of the season (last row of the playtest log).
2. Pick up to 3 decrees from `decrees.csv`. Check you can pay for them.
3. Apply `formulas.md` top to bottom, in order: decrees, income, spending, grain, people, loyalty, favour, then the lose checks.
4. Draw an event card from `../events/` if its trigger fits (or roll a die), and apply its effect.
5. Write the new numbers and one line of notes in `playtest-log.md`. Was it fun? Did the vicious cycle bite?

## Naming

The ids (`grain`, `treasury`, `raise_taxes`, …) are the names the bot will use. Display names can change freely; ids should not once the bot exists.
