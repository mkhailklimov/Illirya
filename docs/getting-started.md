# Getting started in VS Code

## 1. Get the code

1. Install [VS Code](https://code.visualstudio.com/), [Git](https://git-scm.com/) and [Python 3.12+](https://www.python.org/).
2. In VS Code: **Command Palette → Git: Clone**, paste `https://github.com/mkhailklimov/Illirya.git`, and open the folder.
3. Recommended extensions: Python, Pylance, GitLens, Markdown Preview, Rainbow CSV, YAML.

## 2. Folder layout

What exists now and what gets added as the plan moves on:

```text
Illirya/
├── ROADMAP.md
├── docs/            concept, development plan, this guide
├── design/          style guide, fonts, drawing code
├── changelogs/      one file per working session
├── rules/           Phase 0: the rules spreadsheet and test-turn logs
│   ├── rules.xlsx   (or numbers.csv, decrees.csv, formulas.md)
│   └── playtest-log.md
├── events/          Phase 0: event cards, one YAML file per card
│   └── e001-drought.yaml
└── bot/             Phase 1: the Telegram bot (Python + aiogram)
    ├── engine/      numbers, decrees, formulas, win/lose (no AI here)
    ├── ai/          order parser and narrator prompts
    ├── data/        towns, buildings, starting values
    ├── tests/       engine tests checked against the spreadsheet turns
    └── main.py
```

## 3. What to do first

**Phase 0 starts with the rules, not with code.** The bot is only as good as the numbers behind it, so the first weeks are spreadsheet work:

1. Create `rules/` and a spreadsheet with the 8 city numbers and their starting values (see [governor-concept.md](governor-concept.md), section 3).
2. Add the 10 decrees and what each one changes.
3. Write the formulas, then play 12 turns by hand and log them in `rules/playtest-log.md`.
4. Write event cards in `events/` with a title, a trigger, the effect and a short historical note.

Code starts in week 10 (mid-December) with choosing the stack and a hello-world bot. The week-by-week list is in the [development plan](development-plan.md#phase-0-week-by-week).

## 4. Working habits

- Commit small and often, with a clear message ("Add grain formula").
- Keep secrets (bot token, AI API key) in a `.env` file. It is listed in `.gitignore` and must never be committed, because this repository is public.
- Close the GitHub issue for a task when it is done; the Monday check-in counts closed issues against the milestone.
