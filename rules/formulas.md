# Formulas (task 0.5)

**DRAFT.** These are deliberately simple first guesses, meant to be tuned by playing 12 turns by hand (task 0.6). The goal of the tuning: at normal taxes the town *just about* survives, so the player feels the vicious cycle (Rome wants tribute → taxes up → loyalty down → more soldiers → more pay → taxes up) and has to grow out of it with farms, workshops, wine and oil, and trade.

Starting values are in [numbers.csv](numbers.csv), decrees in [decrees.csv](decrees.csv), season effects in [seasons.csv](seasons.csv). [play.py](play.py) implements these formulas; its constants (top of the file) must match the numbers here, so change both together.

## Order of resolution (one turn = one season)

1. **Decrees.** Pay each decree's cost now. Refuse any decree that can't be paid. Apply instant effects; queue buildings with their `seasons_to_finish`.
2. **Finished buildings** start producing this season.
3. **Income:** taxes, then trade income from convoys that arrived.
4. **Spending:** army pay, then tribute if due.
5. **Grain:** harvest in, consumption out.
6. **Goods and wine & oil:** production in, upkeep out.
7. **People:** growth or loss.
8. **Loyalty and Roman favour.**
9. **Event card** (see `../events/`), then **lose checks**.

Round money to whole denarii and grain to one decimal.

## Tax rate

Three steps; the starting rate is **normal**. `raise_taxes` / `lower_taxes` move one step.

| Rate | Denarii per person per season | Loyalty each season |
|---|---|---|
| Low | 0.25 | +2 |
| Normal | 0.5 | 0 |
| High | 0.75 | −4 |

```
tax_income = people × rate
```

## Army pay

```
army_pay = army × 4              (denarii per season, local auxiliaries)
```
If the treasury can't cover army pay: pay what you can, and for every 10% unpaid, lose 5% of the army (desertion) and 3 loyalty (soldiers take what they aren't paid).

## Tribute to Rome

```
tribute = 3,000 denarii, due in Summer (see seasons.csv)
```
- Paid in full: favour +5.
- Not paid in full: favour −20, and the unpaid part is carried to next Summer with 50% added.

## Grain (months of supply)

```
eaters        = people + army
harvest       = season.harvest_grain × 4,000 / eaters  +  terraces_finished × season.terrace_bonus
grain_new     = grain + harvest + grain_bought − 3
```
- With no terraces, a year's harvest is 8 months for 4,000 eaters, against 12 months eaten. **The town is short of about 4 months of grain a year from the start**, so it must build terraces, fish, or import grain by convoy.
- Grain bought by convoy: about **500 denarii per month of supply** (to be set per town later).
- Grain cannot go below 0. If it is 0 at the end of the season, mark a hunger season.

## Goods and Wine & Oil

```
goods_new    = goods + 6 × workshops_finished − army / 50
wine_oil_new = wine_oil + 4 × groves_mature        (groves mature 8 seasons after planting; in Autumn ×2)
```

## People

| Condition (after grain) | Change |
|---|---|
| Grain ≥ 3 and loyalty ≥ 50 | +1% |
| Grain between 0.1 and 3 | 0 |
| Grain 0 (hunger season) | −5% |

## Loyalty (0–100)

```
loyalty_new = loyalty + tax_rate_effect + decree_effects + food_effect + event_effect
```
- Food effect: grain ≥ 3: 0; grain below 3: −3; hunger season: −10.
- Unrest: if loyalty is below 30, Roman favour −3 that season (the governor can't keep order).
- Uprising: if loyalty is below 20, draw the uprising event card.

## Roman favour (0–100)

```
favour_new = favour + tribute_effect + decree_effects + unrest_effect + event_effect
```
Favour also drifts by −1 each season while the army is below 100 ("Rome expects order").

## Lose checks (end of season)

- **Recalled:** Roman favour 0.
- **Overthrown:** loyalty 0 and army below 100.
- **Replaced for famine:** two hunger seasons in a row.

## Worked example: Turn 1, Spring AD 30, no decrees

Start: grain 6, treasury 3,000, goods 40, wine & oil 10, people 4,000, loyalty 55, favour 60, army 150.

| Step | Calculation | Result |
|---|---|---|
| Income | 4,000 × 0.5 | treasury 3,000 + 2,000 = 5,000 |
| Army pay | 150 × 4 = 600 | treasury 4,400 |
| Tribute | not due in Spring | — |
| Grain | 6 + 1 × 4,000 / 4,150 − 3 = 6 + 1.0 − 3 | grain 4.0 |
| Goods | 40 − 150/50 | goods 37 |
| People | grain ≥ 3, loyalty ≥ 50: +1% | people 4,040 |
| Loyalty | normal tax 0, food 0 | loyalty 55 |
| Favour | army ≥ 100, no tribute | favour 60 |

Over a whole year with no decrees: treasury roughly +8,000 taxes − 2,400 army − 3,000 tribute = **+2,600**, but grain falls by about 4 months, which costs about **2,000** to import. So the town nets about +600 a year and can afford little building: the squeeze the game is about. Tune from here.
