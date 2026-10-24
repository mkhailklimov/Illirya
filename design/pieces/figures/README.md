# Advisor figures

Full-length pictures of the five advisors, made with the prompts in [design/prompts/advisor-figures.md](../../prompts/advisor-figures.md).

Put the images here as PNG, named after the advisor's id:

- `priest.png`: Tertius Volusius
- `general.png`: Marcus Antistius
- `fleet.png`: Epicadus the Liburnian
- `economist.png`: Nikandros of Epidaurum
- `treasurer.png`: Felix

Then run `python web/build.py`: it writes `web/img/figure-<id>.webp`, and the game's pop-ups show them instead of the line drawings.
