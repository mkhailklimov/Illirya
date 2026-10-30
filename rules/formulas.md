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

## Rules v15 (30 October 2026): sixty years, a council that grows old, useful cards

- **Sixty years.** The game runs from Spring AD 30 to Winter AD 89 (240 turns). The governor is 31 at the start and dies in his ninetieth year at the end; that is the normal end (score as before, "seasons governed" now counts up to 240). Victories still end it early.
- **Emperors to AD 89:** Tiberius, Gaius (Spring 37), Claudius (Winter 40), Nero (Autumn 54), Galba (Summer 68), Otho (Winter 68), Vitellius (Spring 69), Vespasian (Winter 69), Titus (Summer 79), Domitian (Autumn 81). New letters: h08 Claudius dies, h09 the great fire, h10 Nero dies, h11 the Danube legions for Vespasian, h12 Vespasian dies, h13 Vesuvius, h14 Titus dies, h15 the Dacian war. The deaths of Caesar (h08, h10, h12, h14) are chances for the political victory, and the haruspex can foretell all of them.
- **The council grows old.** Each advisor has an age (start: fleet 46, general 41, economist 37, treasurer 44, priest 58) and the six skills of advisors.csv (1–5). At the end of every year:
  - each is a year older;
  - with chance 1/2 one skill below 5 rises by 1 (his main skill, the one used on his advice, 40% of the time);
  - he dies with chance 1% under 50, 2.5% in his fifties, 6% in his sixties, 12% in his seventies, 25% from 80.
  A successor (from a list of period names per office) is 26–38, has experience 1 and each other skill 1–2 below the founder's. His mood starts afresh, his ability is ready. In a 60-year game about nine advisors die.
- **Seven new inventions,** each from a card (once per game): the wheeled plough (wheat harvests +25%), the upright loom (cloth +50%), the brick kiln (buildings need 25% less timber; +60 a season), the pilot's charts (+2 on the voyage die), the new rig (convoys trade 8% better), the physician's house (the people and soldiers a card kills are halved). The screw press stays as before.
- **New card fields:** a card's `fate` (the haruspex foretells next Summer's harvest: ×0.55 lean, ×1.4 rich; an option's `fate` softens it), `plague: true` (the plague card e030 comes within 1–3 seasons); an option's `tip` (a good sells dearer in a town for a year: oil or wine in Aquileia +40%), `plots` (a drained marsh gives a field plot), `guard` (for 4 seasons a card kills only 40% as many people).
- **Older cards** now run to AD 89 (`years: [30, 89]`), except the comet (Tiberius) and Rome's praise (to AD 37).

## Rules v14 (25 October 2026): walls on the ring, bigger fields

- **The walls take no plot.** They are the ring round the town (zone `ring` in buildings.csv). All 12 town plots are free for buildings. Build them, or a second set of towers (+2 again), from any free town plot or by clicking the wall on the map.
- **Half as many wheat terraces and vineyards, each twice the size.** Wheat: 2 at the start (was 4), at most 6, 1200 den and 4 timber; the harvest counts each terrace as two (BASE_WHEAT 2). Vineyard: at most 3, 800 den and 4 timber, 24 amphorae each Autumn. Food and wine are as before; the fields have two more free plots.
- Old saves: the walls leave their plot, and the wheat and vineyards are halved (the oldest kept, rounded up).

## Rules v13 (25 October 2026): a battle in three throws, one die per lane

- **1. Engines, slingers and archers together:** a d20 for each lane where any of them stand (+1 on a hill). At most 3 engines take the field (ballistae first); each adds to its lane's fire (ballista 0.10, scorpion 0.07; one with no enemy in front shoots at the biggest crowd). The lane's fire is the sum of its bands: sling 0.04 + 0.12 × density, archer 0.14 − 0.05 × density (militia 0.03 + 0.08 d, 0.10 − 0.04 d), ×1.25 on the walls, + javelins 0.05 if a cohort with pila stands in the line. Killed = fire × (1 / 0.4 / 1.5 / 0) × (½ in a wood, ×1.25 on a hill), at most 45%. Their heart falls by 0.9 × the share killed.
- **2. Their charge:** a d20 per undecided lane: roll + their fury + ground (brook −2, rocks −1) − our lane bonus ≥ 10 (20 always, 1 never). Success: our line loses 10–30% and 25–60 heart; failure: they lose 6–20% and 15–45 heart. **Exposed shooters** (no cohort, ally or horsemen in the lane, not on the walls) are caught on 4+: the lane is lost and 90% of them die. An empty lane is held by the walls (walled) or the farmers (fields) only if their charge fails; on a march it is lost.
- **3. Our counter-attack:** a d20 per lane still undecided with our line: roll + our bonus ≥ 10. Success: they lose 14–34% and 28–60 heart; failure: we lose 7–24% and 18–50 heart.
- A lane is won when their heart is gone or fewer than 5 stand, lost when ours is gone; otherwise the better heart holds the field (ours starts at 100 + 10 × morale, theirs at 100 + 5 × fury). Two lanes of three win.
- **The ground:** each battle (not a street fight) has 0–2 features in random lanes: brook (their charge −2), rocks (their charge −1, no cavalry strike), wood (missiles ½), hill (+1 to us, missiles ×1.25).
- The order of battle shows no damage figures for missiles any more; the odds are still shown.

## Rules v12 (24 October 2026, later): four victories, one great prophecy a year

- **Four paths to victory** (the Glory tab shows each one's progress). A victory ends the game at once in triumph (+150 to the score):
  - *The purple* (political): in the season an Emperor dies (the letters of Spring AD 37 and Winter AD 40), if Roman favour ≥ 90, loyalty ≥ 70, soldiers ≥ 500 and people ≥ 6,000, the soldiers hail you Imperator. Accept: victory. Refuse: favour +10, the game goes on.
  - *The sword* (war): soldiers (infantry, slingers, archers, horsemen) ≥ 1,000 and all three tribes won (allied or conquered).
  - *The gods* (religious): the Sanctuary of Cadmus and Harmonia is finished: a town building, 15,000 denarii, 60 marble, 40 timber, 20 bronze, 12 seasons, the temple first.
  - *The purse* (economic): 100,000 denarii in the chest at the end of a season.
  - Otherwise the game ends in the winter of AD 42 with the score, as before.
- **The haruspex speaks once a year**, at the first sacrifice of the year, and only of the most important thing to come, in this order: an Emperor's death or a revolt against Caesar within the next four seasons (the dated letters); the town rising (loyalty below 58, or already restless); pirates, or any raid with poor odds (+1 forewarned); a dark omen next season; famine (the harvest forecast leaves under 3 months); otherwise the coming raid, or a quiet year. Each comes with one order. Give it within four seasons: loyalty +2 and favour +2 on top of the order's own effect. "Do as he says" in the pop-up puts the order into next season's book. Later sacrifices that year still please the gods and bless ships at sea (+2), but he will not read the liver again. A bad die means silence, and he can try again next season.
- **The city map** places the harbour by the quay, the fisheries and salt pans on the open field plots nearest the bay, the forum in the middle, and everything else inland.

## Rules v11 (24 October 2026): triremes, six berths, the press to order, the haruspex sees the harvest

- **Six berths.** One harbour (no second one) holds 6 ships at most: merchant galleys and triremes together, keels on the slipway included.
- **Triremes** ("Lay the keel of a trireme", sea): 900 denarii, 30 timber, 8 iron, 6 cloth; launched in 3 seasons (2 on a good die, 4 on a bad one); 40 denarii a season for rowers and marines. They do not trade. Each trireme, two at most: the pirates' weight in the year's raid −1 (never below 1); a pirate force loses 15% of its men at sea before landing; +1 in a pirate battle; the prize ship is 2 easier to take. While you have one, a convoy that rolls a 1 is not robbed: the trireme drives the pirates off.
- **Commission a screw press** (land, once): 800 denarii, 4 iron, 6 timber. The same machine as the Greek engineer's card: olive oil +30% at every harvest, +50 denarii a season. Nikandros proposes it once you have olives.
- **The haruspex sees further.** Besides the war, the sea, the town and his advice, a sacrifice now shows (1) next season's wind (fixed, like the sages' forecast) and the harvest it brings, grain and goods, and how many months the granaries will hold after it; (2) next season's omen card, drawn now and kept: that is the card that comes. His reading opens as a pop-up after the report.
- **The citadel** costs 2,500 denarii, 20 timber and 6 iron (was 30 and 10) and takes 8 seasons (was 12). Build it from the dashed citadel site on the crag.

## Rules v10 (22 October 2026, evening): one loyalty, walls or fields, the haruspex

- **Discontent is gone; loyalty does its work.** Loyalty starts at 60. Each season it moves on its own, part by part (click Loyalty in the ledger): taxes (low +1, high −2), hunger −10 or little bread −3, the temple and the baths, peace and bread +2 while below 60, and your name as a judge (stern but just +1, a cruel tyrant or a weak ruler −2). Cards, orders and battles come on top. A pardon is loyalty +3; an execution loyalty −2 and favour +1.
- **Rebellion: below 50 for two seasons.** At the end of a season below 50 the town is restless (warning). If loyalty is still below 50 at the end of the next season and has not climbed back by the next battle phase, the town rises: parley (d20 + loyalty/10, need 15; loyalty back to 55, taxes low, favour −6) or fight (half the town-raised slingers and archers defect; win: half the people die, half the goods and chest lost, two buildings thrown down, favour −8, loyalty set to 50; lose: overthrown). The advisors now advise raising taxes only at loyalty 68 or more and easing them below 58.
- **Walls or fields.** Each year's raiders either storm the town or raid the fields. Pirates: 1 in 2 at the Sea Gate; tribes: 2 in 5 against the walls; brigands always in the open. Storming the walls: the walls (+2) and the citadel (+5) count, an empty lane is held by the walls, archers and slingers may stand on the walls, and the attackers bunch at the gate (density +0.3 for the slings). In the fields: no walls, our own ground (+1), an empty lane is held only by the farmers (−1). A lost defence of the walls: they break in, take a quarter of the chest and throw down a building. A lost fight in the fields: they burn a field building, take a tenth of the chest and a month of grain. Pirates beaten at the quay give up a ship on d20 ≥ 10 (12 on the beach).
- **Shut the gates** (fields only): no battle and nobody of ours falls, but they burn one field building (two seasons to restore), carry off a month of grain, loyalty −4, favour −2.
- **The haruspex.** "Sacrifice at the temple" (50 denarii, once a season) makes Tertius read the liver: (1) Mars: who comes next, in which season, and whether to storm the walls or to raid the fields (next year's raid is decided now if this year's is past), with the general's odds as things stand; that battle gets +1 "forewarned"; (2) Neptune: every ship at sea gets +2 on her voyage home; (3) Ceres: a warning if the granaries are below 6 months; (4) the household gods: a warning if loyalty is below 55; and one piece of advice, an order (bread first, then the coming war if the odds are below 75%, then loyalty, else the best of the council's suggestions). He repeats it in the council next season. A malformed liver (the die's setback) means silence.

## Rules v9 (22 October 2026): spoils, justice, discontent, the fleet

- **Missiles in stages, by how close the enemy stands** (density: tribes and rebels 1, pirates 0.5, brigands 0.4). Slingers throw twice, far and near: 4% + 12% × density (16% against the tribes, 10% against pirates, 9% against brigands), half in each volley; village slingers 3% + 8% × density. Archers shoot once, near, aimed: 10% (village bowmen 7%). Ballistae 15% far; scorpions 10% near; pila 5% at the last moment. 60% at most per lane.
- **Missiles need a shield line.** In a lane with no cohort, allies or horsemen, slingers and archers (not on the walls) count −2 and are overrun when the enemy closes: they lose at least 45% of their men in a won lane, 80% in a lost one.
- **Militia losses** come off the town's people.
- **Spoils of a victory:** against pirates, d20 (+4 if the horsemen pursue) ≥ 12 takes a pirate ship (a free berth: she joins the fleet; no berth: sold for 500). Against the tribes at home, d20 (+4 pursuing) ≥ 13: they leave a vineyard or an olive grove on the border, a new field plot already bearing.
- **Refill the cohorts** (order): townsmen take the places of the fallen, up to the army's best strength, 100 at most at once; each costs 5 denarii (6 with pila), a shield (1 timber per 10 men) and iron for each weapon the army carries (1 per 10 men for spears, +1 for gladii, +1 for pila); the town loses as many people. Antistius proposes it when 30 or more are missing.
- **Judgement:** after every victory, execute (favour +1, discontent +2) or pardon (loyalty +2, discontent −3) the defeated; hanging brigands counts as an execution. After three judgements the town names you: pardoned under 15% a cruel tyrant (discontent +2 a season), 20–40% stern but just (−1 a season), over 50% a weak ruler (+2 a season, and brigands three times as likely).
- **Discontent** (0–100, starts at 10) each season: taxes low −2 / normal 0 / high +3; hunger +6, under 3 months of grain +2; loyalty under 40 +2, 60 or more −2; the judge's name; peace and bread −1. Orders: raise taxes +6, lower taxes −6, festival −8, petitions −4, temple −2, recruiting +2. The angry crowd card moves it too.
- **Rebellion above 50**, at the next conflict phase: parley (d20 + loyalty/10 ≥ 15: taxes to low, discontent 30, favour −6) or fight. Half the town's slingers and archers defect; the rebels are 12% of the people plus the defectors, fighting at half strength (untrained), fury 2, in the streets (no walls). Lose: overthrown. Win: half the people die, half of every good and of the chest is lost, two buildings are thrown down, favour −8, discontent 20, loyalty at most 30.
- **The fleet:** every ship has a name (Fortuna, Concordia, Aquila...), given when her keel is laid. A launch, a voyage home (with its ledger: sold for, goods brought valued at their price there, paid at the outset, profit or loss), a prize and an invention are announced.
- **Inventions:** a card option may carry `invention:`. The screw press (e018): olive oil +30% at every harvest and +50 denarii a season from neighbours who use it.

## Rules v8 (19 October 2026): battles in rounds

- **Deployment by position** (x 0–900, y 250–450): x < 300 left, < 600 centre, else right; y < 300 front (missiles), < 362 the line, else the second line; at home with walls, missile troops at y 362–388 stand on the walls (half their effect on every lane). Horsemen: x < 90 or > 810 strike that flank; at the rear near the standard they guard the governor; elsewhere at the rear they wait to pursue.
- **Missiles** (before the clash, 60% at most per lane): slingers 12%, archers 8%, village slingers 8%, village bowmen 6%, scorpions 10%, ballistae 15%, pila 5% per cohort in the line.
- **The clash** in up to 3 rounds per lane. Strength per man: shield line 1.75 (2.1 with gladii), horse 2.5, allied warriors 1.2, slingers and archers 0.6, militia 0.45. Bonus: 4 × log2(ours/theirs) (−6 to +6, recomputed each round) + discipline 1 + walls/citadel at home + barracks + experience + morale + the leader; first round only: their charge −fury, our horse strike +2; a neighbouring lane broken: +2 (flank). d20 + bonus against DC 10.
- **Morale:** ours starts at 100 (+10 per point of army morale), theirs at 100 + 10 × fury − 0.8 × missile %. Their charge costs us 8 × fury. A won round: they lose 12–32% of their men and 20 + 3 × margin morale (+20 on a 20); we lose 3%. A lost round: we lose 8–26% and 25 + 3 × margin morale (+20 on a 1); they lose 3%. The second line joins when our morale falls below 50 (+30). A lane is decided when one side's morale reaches 0; after three rounds the higher morale holds it. Two lanes of three win the day.
- **Village militia** (home battles): 80 denarii, loyalty −1; d20 + loyalty/20 ≥ 8 (a 1 fails, a 20 succeeds): 20–40 slingers and 15–30 bowmen for this battle. **Allies**: each allied tribe sends 30–60 warriors to a home battle.
- **Ballista:** 600 denarii, 15 timber, 8 iron; upkeep 15; two at most.

## Rules v7 (19 October 2026): the mixed army

- **Troops:** infantry in cohorts of 50 (`army`); slingers (groups of 25), archers (groups of 30, raised from the townsmen), horsemen (a troop from 5 riders), scorpions (up to 4) in `s.troops`; kit `pila` and `gladius` in `s.kit`. Pay a season: infantry and slingers 4 each (barracks −1), archers 2, horsemen 10, scorpions 10 upkeep. All soldiers eat.
- **Before the clash** a lane loses 12% per slinger group, 8% per archer group, 5% per cohort with pila, 10% per scorpion, and 4% per archer group on the walls (at home, every lane); 60% at most.
- **In the clash** a shield line counts 1.75 (2.1 with gladii) of theirs per man; slingers and archers in the lane count 0.6.
- **Bonuses added to every lane:** experience +1 per two victories (up to +3), morale (−2 to +2), +1 for engines on a march, +2 on the lane the horsemen strike.
- **After the battle:** wounded = 1.5 × fallen, 6 denarii each (a third of the unpaid die); replacements for fallen infantry (10+) at 5 denarii each (+1 with pila), 1 iron and 1 cloth per 10. Victory: experience +1, morale +1. Defeat: experience −1, morale −2, every advisor's mood −1; leading in person, the horse guard saves you 60% of the time (favour −6, loyalty −4 more), otherwise the game ends.

## Rules v6 (19 October 2026): battles and the city

- **A conflict once a year:** in Spring the rules pick the season (Spring to Autumn) and the enemy: pirates (weight 3, +1 with 3+ ships, +2 with 8,000+ denarii), brigands (2, +3 at loyalty below 45, +2 with fewer than 100 soldiers), tribes (1, +5 while a tribe is hostile). Marches against a tribe are battles too.
- **Enemy size:** pirates 110–200 + treasury/250 (at most +80), brigands 70–130 (+50 at loyalty below 40), tribes 150–260 + 60 × strength (+60 if hostile, +60 on their own ground), all +6% a year after AD 30. Spread over three lanes: pirates on one wing (55/35/10), brigands uneven, tribes 25/50/25.
- **A lane:** our strength = cohorts × men each × (1.75 for a shield line, 1 for slingers); slingers cut the enemy in front 15% each (at most 45%). Bonus = 4 × log2(ours/theirs) (−6 to +6) + 2 discipline − the enemy's fury (pirates 1, tribes 2 at home, 1 on a march) + home defence at home (walls 2 each, citadel 5) + barracks 1 + the leader (yourself +3; Antistius strategy −3, Epicadus experience −3). d20 + bonus against DC 10 (a 1 fails, a 20 wins). An empty lane at home is held by the walls: home defence + 1 − fury. An empty lane on a march is lost.
- **The day:** two lanes of three win; a cohort in reserve rolls again (+1) for the first lost lane. Our dead: 3–9% in a lane that holds, 20–35% in one that breaks.
- **Victory:** favour +4, loyalty +3, plunder (pirates 300–800, brigands 150–400); led in person +3 favour, +2 loyalty more. **Defeat:** favour −4, loyalty −5, at home a fifth of the chest and a burnt field; delegated, the commander's mood −2; **led in person, the game ends** (fallen or taken).
- **The city** (`rules/cities.csv`): Acruvium has 8 field plots, 12 at most with the hillside terraces, and the citadel site on the crag.

## Rules v4 (16 October 2026): what changed

The browser game (`web/engine.js`) plays by these rules; where they differ from the sections below, v4 wins.

- **Taxes:** low 0.25 denarii a person a season (+1 loyalty a season), normal 0.40 (0), high 0.55 (−2). Raising taxes still costs −6 loyalty at once.
- **Peace and bread:** in a season with no calamity and no hunger, grain 3+ and loyalty below 50, loyalty recovers by 1.
- **Growth in peace:** every season with no calamity (no quake, raid lost, battle or deaths on a card), grain 2+ and loyalty 40+, the people grow by 1.5% (2% at loyalty 60+), up to the housing. More people eat more grain and pay more tax.
- **Gambles:** a *risky* proposal on a card is a d20 + the advisor's talent − 3 (+1 if his mood is 4+), need 10: Antistius uses strategy, Epicadus experience, Felix logic, Nikandros and Tertius persuasion. Win or lose changes the order: a building in half the time or half again the price and a season late; a convoy +30% or half its cargo lost; 75 recruits or 25; a festival or sacrifice twice the effect or none; and so on (`GAMBLE_TEXT` in the engine).
- **Earthquake:** about 1% of the land deck, never twice within 16 seasons; kills 50–100 people, costs 600 denarii, 10 timber and 5 loyalty, and throws down one finished building in town (two seasons to rebuild). A card effect can now be a range, `people: [-100, -50]`, rolled when the card is turned.
- **Letters from Rome** (`events/h01`–`h07`, `date:` field): they come as the sea card on their date and never by chance. Autumn 31 Sejanus falls; Summer 33 the credit crisis; Spring 37 Tiberius dies, Gaius (Caligula) succeeds; Summer 39 Gaius wants gold; Summer 40 Gaius demands worship; Winter 40 Gaius murdered, Claudius; Spring 42 Scribonianus, governor of Dalmatia, rebels. The decree honouring the Emperor follows the reigning emperor.
- **The tribes** (`rules/tribes.csv`): the Docleatae (4 field plots), the Ardiaei (3) and the Pirustae (3) hold the land beyond the fields. *Treat with them*: their gifts in denarii and goods, d20 + the better talker's persuasion − 3 − the tribe's strength (+1 for every failed try, −3 if hostile), need 11; success makes them allies and opens their land. *March against them*: 200 denarii, at least 150 soldiers, not in winter; d20 + soldiers/50 + battle bonus + Antistius's strategy − 3 − strength, need 12 (Antistius may lead the charge); victory takes the land and loot (−5 to −20 men), defeat costs 25–50 men; either way the tribe is hostile for 12 seasons, and raids are three times as likely while any tribe is hostile.
- **The end:** the governorship ends after Winter AD 42 (turn 52). The score: people/100 + loyalty + Roman favour + 3 a building + treasury/500 + 12 an allied tribe (8 a conquered one) + seasons governed.

Bot simulation (40 games per style, to AD 42): economy first, army late: 24 finish, score 426, about 6,250 people, almost all tribes won; always cautious: 19 finish, 367; random: 2, 213; army first: 0 (all starve), 218.

## Rules v2 (13 October 2026): what changed

The browser game (`web/engine.js`) plays by these rules; where they differ from the sections below, v2 wins. The terminal game `play.py` stays at v1.

- **Up to 12 orders a season.** Some can be given only once a season (`once` in `decrees.csv`): taxes, the festival, hanging brigands, petitions, the temple, the decree for Tiberius, the sages. Building, convoys, recruiting and keels can be repeated as far as money, materials, plots and ships allow.
- **New actions:** hang the brigands (50 den; loyalty −1, Rome +2, the prefect +1 mood), hear petitions (free; loyalty +2, the treasurer +1 mood), sacrifice at the temple (50 den; loyalty +1, Rome +1, the haruspex +1 mood), decree honouring Tiberius (100 den; Rome +4), listen to the sages (free; you learn next season's wind now), lay the keel of a ship (300 den, 20 timber, 3 iron, 4 cloth; ready in two seasons).
- **Goods instead of one 'goods' number** (`goods.csv`): wine, olive oil, fleece, cloth, timber, salt, salted fish, iron are made here; tin, bronze and marble come only by sea; amber, glassware, papyrus, pepper and purple cloth are rare goods sold in Aquileia and Brundisium. Each has a base price.
- **Buildings cost materials** as well as denarii (`cost` column, e.g. "marble 20; timber 15; bronze 4") and take time in three steps: `seasons_to_build`, then `matures` (seasons before the first yield), then `ramp` (seasons from the first yield to full yield). A harbour takes 8 seasons to build, the temple 12, the baths 8. A vineyard: 1 season to plant, first wine 3 seasons later, full after 4 more. An olive grove: first oil after 7, full after 4 more.
- **Yields by season** (`yields_in`, `produces`, `uses`): vineyards 12 wine each Autumn; olive groves 10 oil each Winter; pastures 8 fleece at the Spring shearing; salt pans 10 salt each Summer; weavers 3 cloth from 3 fleece every season; the fishery 2 salted fish from 1 salt, plus 0.5 months of food; woodcutters 4 timber; the iron mine 2 iron. A building without its input stands idle.
- **Convoys go to a town** (`towns.csv`): Epidaurum, Salona, Aquileia (two seasons there and back), Dyrrachium, Brundisium: five towns for AD 30 (with Acruvium, six places on the map). Narona, Iader, Pola and Ancon wait in `towns-later.csv` for Illyria: AD 120 (nine towns), and AD 180 may grow to twelve. Each town sells some goods and buys others, at its own price multiplier on the base price. Wind and current move prices as before (north or south by the town's direction), the trading district adds 10%, Nikandros's deal 20%. One ship carries 40 loads; a month of grain is 10. Purchases are paid when the ship sails; sales are paid when she comes home.
- **The voyage home is a d20 roll:** d20 + the sailing advantage (−3 to +3), +1 if Epicadus's mood is 4 or more; need 5. Failure: a storm, half the cargo and money lost. A natural 1: pirates take everything, the ship limps home. A natural 20: +10%.
- **The army no longer eats goods.** Recruits cost 5 iron and 5 cloth instead.

Seen in test games (bots, 40 seasons): money piles up (40,000–60,000 denarii by year 10) while iron and marble run short, so materials are the real limit; and a governor who never buys grain starves within five seasons. Both are for tuning in playtests.

### Balance pass, 14 October 2026

- **Buy from passing merchants** (once a season, sailing season only): up to 20 loads of any non-luxury good, or grain (a month = 10 loads), at 1.5 × the base price (grain 750 a month). The goods are in the stores at once, with no ship and no voyage roll. This turns spare denarii into iron, marble and grain, and gives a way out of a grain crisis without a free ship.
- **Clear new fields** (600 denarii, 2 iron; can be repeated): one more field plot after 2 seasons, on the hillside above the bay. 12 field plots at the start, at most 16. (At the start, 8 of the 12 field plots are already used, so they filled up within the first year.)
- **Iron mine:** 3 iron a season instead of 2, and up to 2 mines.
- The council knows these orders: the economist asks to clear land when the fields are full, and suggests the merchants when grain is below 3. The general's and the haruspex's plans buy iron and marble from them, and the scribe understands "buy 5 iron from the merchants" and "clear new fields".

Bots, 60 games of 40 seasons, before → after: famine ended 47% → 32% of games; iron at year 10 about 9 → 27; marble 5 → 12–18; money at year 10 about 58,000 → 45,000. Money still piles up for bots, which do not buy much from the merchants unless short. The question for the playtest is whether a human player now has enough to spend it on.

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
