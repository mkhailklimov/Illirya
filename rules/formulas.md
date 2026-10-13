# Formulas (task 0.5)

**DRAFT.** These are deliberately simple first guesses, meant to be tuned by playing 12 turns by hand (task 0.6). The goal of the tuning: at normal taxes the town *just about* survives, so the player feels the vicious cycle (Rome wants tribute → taxes up → loyalty down → more soldiers → more pay → taxes up) and has to grow out of it with farms, workshops, wine and oil, and trade.

Starting values are in [numbers.csv](numbers.csv), decrees in [decrees.csv](decrees.csv), season effects in [seasons.csv](seasons.csv). [play.py](play.py) implements these formulas; its constants (top of the file) must match the numbers here, so change both together.

## Order of resolution (one turn = one season)

0. **Weather and cards.** Roll the wind and current, then draw one card each from the Land, Sea and Omen decks and turn all three over. Apply their effects and answer their choices (any order) *before* the decrees.
1. **Decrees.** Pay each decree's cost now. Refuse any decree that can't be paid. Apply instant effects; queue buildings with their `seasons_to_finish`.
2. **Finished buildings** start producing this season.
3. **Income:** taxes, then trade income from convoys that arrived.
4. **Spending:** army pay, then tribute if due.
5. **Grain:** harvest in, consumption out.
6. **Goods and wine & oil:** production in, upkeep out.
7. **People:** growth or loss.
8. **Loyalty and Roman favour.**
9. **Lose checks.**

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

## The city and its fields

Acruvium has **12 plots inside the walls** (the harbour and the walls take two of them) and **12 plots in the fields** around the bay. Every building takes one plot, including while it is being built. What each building costs and gives is in [buildings.csv](buildings.csv); the decree is **Build** (one building per decree, up to 3 decrees a season).

| Start | Town (6 of 12 plots) | Fields (4 of 12 plots) |
|---|---|---|
| Built | Forum, 3 residential districts, harbour, walls | 4 wheat terraces |
| Can add | Houses (max 8), 2nd harbour, towers, workshops (4), market, temple, barracks, baths | Wheat terraces, vineyards & olive groves (6), fisheries (3, shore only), sheep pastures (4) |

- **Harvest:** `season.harvest_grain × wheat_terraces / 4 × 4,000 / eaters × wind`, plus **0.5 months per fishery** every season (fisheries ignore the wind). The 4 starting terraces give the same harvest as before.
- **Housing:** each residential district houses 1,500 people. Population does not grow past the houses.
- **Per season:** workshops +6 goods, pastures +2 goods, vineyards +4 wine & oil once mature (×2 in Autumn), market +100 denarii, temple +1 loyalty and +1 favour, baths +2 loyalty.
- **Army:** barracks make each soldier cost 1 denarius less. Walls (+2 each) and barracks (+1) add to battle rolls via `battle_bonus`.
- **Ships:** start with 2. A convoy needs a free ship (one not at sea); it returns with the convoy. **Build a ship** (300 denarii, 15 goods) is ready next season; each harbour has berths for 3 ships. Storms and pirates can sink ships.
- **Market:** convoys trade 10% better on top of wind and current.

## Weather and the sea (rolled at the start of every season)

**Wind:** drawn from [winds.csv](winds.csv), weighted by season (more cold Aquilo in winter, more hot Auster and calm in summer). The wind multiplies the season's harvest:

| Wind | Latin name | Harvest | Ships sailing north | Ships sailing south |
|---|---|---|---|---|
| North | Aquilo (the bora) | ×0.75, cold | headwind −1 | tailwind +1 |
| South | Auster | ×0.8, heat and drought; makes the drought card likely | tailwind +1 | headwind −1 |
| West | Favonius | ×1.15, moist | 0 | 0 |
| South-west | Africus | ×1.25, warm and wet | +1 | −1 |
| East | Eurus | ×1, neutral | 0 | 0 |
| Calm | — | ×0.9, winnowing stalls | convoys wait one season | convoys wait one season |

(Windmills were not invented until the Middle Ages; a calm hurt the harvest because threshed grain was winnowed by tossing it into the wind.)

**Current:** roll a d6. 1 = slack (0), 2–5 = running (1), 6 = strong (2). The Adriatic circulates anticlockwise, so the current runs **north along our coast**: it adds to voyages north and subtracts from voyages south.

**Convoy prices:** sailing advantage = wind + current for the chosen direction. Each point changes the price by 10% in the convoy's favour (cheaper grain, better sale prices), at most ±30%.

## Dice (battles and risky choices)

An event option can carry a `roll` (see `../events/README.md`): roll the die (usually a d20), add the bonus (e.g. 1 per 50 soldiers, at most +5) and compare with the target. Equal or higher succeeds. As in tabletop role-playing games, the highest face (a natural 20) always succeeds and a 1 always fails.

## The council (advisors as characters)

Each of the five advisors in `advisors.csv` has a **mood** from 0 to 5 (start 3) and **one ability**.

- **Mood.** Every season each advisor gives advice. When the advice asks for something (buy grain, recruit, hold a festival…) and one of your decrees does it, his mood rises by 1 (at most 5). If you ignore what he asks for **2 seasons in a row**, his mood falls by 1. Advice that asks for nothing ("the omens are calm") leaves him as he is.
- **Sulking.** At mood 1 or below an advisor sulks: he still advises, but will not use his ability until you heed him again.
- **Abilities.** Each is offered at the moment it can help, and you say yes or no. Some can be used once a year, others once per governorship:

| Advisor | Ability | How often | Effect |
|---|---|---|---|
| Felix (treasury) | A season's grace | once per governorship | When the chest is short at tribute time, the tribute moves to next season with no loss of favour and no debt |
| Nikandros (trade) | Knows a man | once a year | One convoy trades at +20% on its price |
| Marcus Antistius (army) | Leads the charge | once a year | After a failed battle roll (one whose bonus counts the army) that +2 would turn, adds +2 (not on a natural 1) |
| Epicadus (fleet) | Winter run | once per governorship | One convoy may sail in winter, when the sea is closed |
| Tertius Volusius (haruspex) | Reads the entrails | once a year | Sees a dark omen (a decision, or any number going down) before it is turned over; may sacrifice again to draw another omen |

- **Qualities (DRAFT, not used in any formula yet).** Each advisor has six qualities from 1 to 5 in `advisors.csv`: experience, decisions, strategy, administration, persuasion, logic. They are on the character cards and in the web playtest so you can judge whether they fit each man. Possible uses, to choose later: a bonus to rolls in his field (strategy for battle rolls, persuasion for the haruspex's omens), how often his advice is right (logic), how fast his mood recovers (experience).

| Advisor | Experience | Decisions | Strategy | Administration | Persuasion | Logic |
|---|---|---|---|---|---|---|
| Epicadus | 5 | 4 | 3 | 2 | 2 | 3 |
| Marcus Antistius | 4 | 4 | 4 | 3 | 2 | 3 |
| Nikandros | 3 | 3 | 3 | 3 | 5 | 4 |
| Felix | 3 | 2 | 2 | 5 | 3 | 5 |
| Tertius Volusius | 4 | 3 | 2 | 2 | 5 | 2 |

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
