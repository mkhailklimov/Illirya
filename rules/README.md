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
| [advisors.csv](advisors.csv) | 0.7 | The governor's council: five advisors with names, roles, voices and one ability each (mood and abilities: formulas.md, "The council") |
| [winds.csv](winds.csv) | 0.5 | The six winds: effect on harvest and on sailing, and how often each blows per season |
| [buildings.csv](buildings.csv) | 0.4 | Every building: town or field plot, cost, build time, limit and what it gives each season |
| [play.py](play.py) | 0.6 | Plays the game in the terminal using all of the above |
| [scribe.py](scribe.py) | 1.7 (early) | Reads the governor's own words: Claude when available, otherwise a built-in word matcher |

Open the CSV files in Excel or Google Sheets (File → Import), or in VS Code with the Rainbow CSV extension. Keep the column names unchanged; the bot will rely on them.

## Playing in the terminal (easiest)

In VS Code open a terminal (**Terminal → New Terminal**) in the `Illirya` folder and run:

```
pip install pyyaml          (once)
python rules/play.py
```

Each turn shows the town's numbers, the wind compass, the season's three cards and your council's advice. Then the **scribe's dialogue box** asks for your orders:

- **A) Bold** and **B) Prudent**: two suggestions worked out from the real situation, with their cost and risks;
- **C) your own words**, e.g. *build terraces and send a convoy south to sell 8 amphorae of wine*. The scribe reads them, the rules check them (cost, season, tax limits), and you confirm before they are sealed. You can also type the orders straight away instead of C;
- **D)** the numbered list of decrees, or **Enter** to do nothing.

The game applies the formulas, may draw an event card (some ask you to choose), and shows what changed. Type `q` to save and stop; run it again to continue, or `python rules/play.py --new` to start over. On Windows you can double-click `play.bat` (continue) or `play-new.bat` (new game) in the repo folder instead.

**Claude as the scribe (optional).** Without setup the scribe is a built-in word matcher that understands plain orders. For the real AI game master, `pip install anthropic` and set an API key (`ANTHROPIC_API_KEY`); the scribe then understands anything you write and answers in character. The rules still check every decree, so no wording can create money or soldiers.

Every turn is written to `playtest-runs/run-<date>.csv`. Copy the interesting rows and your notes into `playtest-log.md`. To tune the game, change the CSV files or the constants at the top of `play.py` (they follow `formulas.md`) and play again.

## Playing a turn by hand

1. Read the numbers at the start of the season (last row of the playtest log).
2. Pick up to 3 decrees from `decrees.csv`. Check you can pay for them.
3. Apply `formulas.md` top to bottom, in order: decrees, income, spending, grain, people, loyalty, favour, then the lose checks.
4. Draw an event card from `../events/` if its trigger fits (or roll a die), and apply its effect.
5. Write the new numbers and one line of notes in `playtest-log.md`. Was it fun? Did the vicious cycle bite?

## Naming

The ids (`grain`, `treasury`, `raise_taxes`, …) are the names the bot will use. Display names can change freely; ids should not once the bot exists.
