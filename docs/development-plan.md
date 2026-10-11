# Illyria: AD 30 development plan

Status: draft plan, 11 October 2026. Official launch target: **autumn 2029 soft launch, 2030 official launch**.

Built for **one person working part-time on a small budget** (roughly 6–10 hours a week). Every phase ends with something you can show: a demo for players on t.me/Illyria30 and Facebook, and later for investors. If a phase slips, the next one moves; the demos are what matter.

Game concept: [governor-concept.md](governor-concept.md). Roadmap: [../ROADMAP.md](../ROADMAP.md).

---

## Guiding rules

1. **Demo first.** Each phase ends with a public demo. Nothing is built that the next demo does not need.
2. **The code keeps the numbers, the AI tells the story.** Game rules live in a spreadsheet and a small engine; the AI only interprets orders and narrates.
3. **Historical realism.** Places, peoples and rulers fit AD 30–42. **Epidaurum** (Cavtat) is the city on the Dubrovnik coast; Ragusa/Dubrovnik appears only in a later-era expansion.
4. **Cheap stack.** Telegram bot + one small database + one AI API + free hosting tier where possible. Target running cost under 20 € a month until Phase 4.
5. **Time flow (confirmed).** 1 turn = 1 season, 1 turn per real day, 1 game year = 4 days, a full game (AD 30–42) = 48 turns, about 7 weeks. The Phase 0 poll game runs at 1 turn per week.
6. **Grow the audience alongside the game.** The Telegram channel and Facebook page get a regular rhythm from Phase 0 so there is an audience at every demo.

---

## Timeline at a glance

| Phase | When | Goal | Demo at the end |
|---|---|---|---|
| **0. Foundations** | Oct – Dec 2026 | Rules on paper, brand finished, channels live | **Demo 0:** "Community Governor" poll game on t.me/Illyria30 |
| **1. Bot prototype** | Jan – Jun 2027 | Single-player Telegram bot, 12 game years playable | **Demo 1a (Mar 2027):** first playable MVP for one player; **Demo 1:** closed alpha with 20–50 players |
| **2. Full single-player game** | Jul 2027 – Jun 2028 | Complete content AD 30–42, polish, art | **Demo 2:** public beta + investor demo pack |
| **3. Map and trade world** | Jul 2028 – Jun 2029 | Web map, more cities, multiplayer trade | **Demo 3:** "Season One" with other players' cities |
| **4. Launch preparation** | Jul 2029 – Mar 2030 | Monetization, scale, languages, marketing | **Soft launch** (autumn 2029) |
| **5. Official launch** | Spring 2030 | Public launch and press | **Launch** |

Each phase has a go / no-go check at its end (see [Decision points](#decision-points)).

---

## Phase 0. Foundations (October – December 2026)

**Goal:** prove the core loop is fun on paper and start building an audience, without writing code.

Deliverables:
- Rules spreadsheet: 8 numbers, 10 decrees, formulas, 12 test turns played by hand.
- First 20 event cards with historical notes.
- Final font picked and brand kit updated.
- Domain illyria30.com and a Facebook page.

**Demo 0: "Community Governor" (from December 2026).** On t.me/Illyria30, once a week: post a dispatch from the scribe (written with AI help, numbers from the spreadsheet), put 3–4 decrees to a Telegram poll, post the result next week with a mosaic-style image. Mirror on Facebook. It costs nothing, tests whether people care, and gives material for every later pitch.

**Success signal:** 100+ channel subscribers, 30+ votes per poll, people commenting on decisions.

### Phase 0 week by week

Weeks start on Monday. Each task is a GitHub issue under the "Demo 0" milestone issue; a check-in every Monday lists the week's tasks and the progress so far.

| Week | Dates | Tasks |
|---|---|---|
| 1 | 12–18 Oct | Set up VS Code and the repo ([getting started](getting-started.md)); 0.1 pick the font; 0.3 create the Facebook page |
| 2 | 19–25 Oct | 0.2 register illyria30.com; 0.4 spreadsheet part 1: the 8 numbers and starting values |
| 3 | 26 Oct – 1 Nov | 0.4 spreadsheet part 2: the 10 decrees and their costs |
| 4 | 2–8 Nov | 0.5 formulas part 1: taxes, loyalty, tribute |
| 5 | 9–15 Nov | 0.5 formulas part 2: army pay, grain; 0.8 three sample dispatches |
| 6 | 16–22 Nov | 0.6 play turns 1–6 by hand and log them |
| 7 | 23–29 Nov | 0.6 play turns 7–12 and tune the vicious cycle. **Midterm check: is the loop fun on paper?** |
| 8 | 30 Nov – 6 Dec | 0.7 event cards 1–10 |
| 9 | 7–13 Dec | 0.7 event cards 11–20; 0.9 plan the weekly channel rhythm |
| 10 | 14–20 Dec | 0.10 launch "Community Governor": first dispatch and poll; 1.1 choose the bot stack |
| 11 | 21–27 Dec | 0.11 poll game turn 2; 1.2 hello-world bot online |
| 12 | 28 Dec – 3 Jan | 0.11 poll game turn 3; **Phase 0 review** against the decision point below |

### Milestones to check progress

| Milestone | Due | Check |
|---|---|---|
| Rules on paper | 29 Nov 2026 | 12 turns played in the spreadsheet |
| Demo 0: Community Governor | 20 Dec 2026 | First poll live on Telegram and Facebook |
| Phase 0 review | 3 Jan 2027 | Votes and comments per poll, go / no-go for the bot |
| Demo 1a: first playable MVP | 31 Mar 2027 | One player plays a game year in the bot |
| Demo 1: closed alpha | 30 Jun 2027 | 20–50 players, 16 turns |
| Demo 2: public beta and investor pack | 30 Jun 2028 | Full game, video, deck, metrics |
| Demo 3: Season One | 30 Jun 2029 | Multiplayer season with leaderboard |
| Soft launch | 30 Nov 2029 | Payments, onboarding, website |
| Official launch | Spring 2030 | Launch Season |

---

## Phase 1. Bot prototype (January – June 2027)

**Goal:** one person can play a full governorship in a Telegram bot.

Deliverables:
- Telegram bot (Python + aiogram, or Node + grammY) with one game per player.
- Game engine: 8 numbers, 10 decrees, buildings with build time, the vicious-cycle formulas from the spreadsheet.
- AI layer: free-text orders turned into decrees, narration from real results, the system prompt from the concept doc, guardrails against "make me rich".
- 40 event cards, 3 trade towns (Risinium, Butua, Epidaurum), sea convoys only.
- One turn per day with a reminder message; status screen with the 8 numbers.
- Basic analytics: turns played, day-7 retention, where players lose.

**Demo 1a: first playable MVP (March 2027).** One player can play the first year in Acruvium (AD 30, 4–8 turns) in the bot: buttons and free-text orders, the 8 numbers, 15–20 events, AI narration. Good enough to screen-record for the channel, Facebook and first informal investor talks. Needs tasks 1.1–1.11 with a reduced event deck.

**Demo 1: closed alpha (June 2027).** 20–50 players from the channel play a shortened game (AD 30–34, 16 turns). Short feedback form at the end.

**Success signal:** 40%+ of alpha players reach turn 16; average AI cost per player under 0.50 € per full game.

---

## Phase 2. Full single-player game (July 2027 – June 2028)

**Goal:** the complete game from AD 30 to the Scribonianus revolt of AD 42, good enough to show anyone.

Deliverables:
- Full 48-turn game with all buildings, all endings and the AD 42 climax.
- 100+ hand-checked event cards; emperor changes (Caligula AD 37, Claudius AD 41).
- Full starting trade map: Risinium, Butua, Epidaurum, Scodra, Lissus, Narona, Dyrrachium; far ports Salona, Brundisium, Aquileia. Mountain roads to Scodra and Narona.
- Mosaic-style art for each season, building and ending (generated with the design kit, checked by hand).
- Shareable "chronicle of your governorship" card for Telegram and Facebook.
- Second language (Russian or the most requested one from the channel).
- Simple admin view to read logs and tune numbers without redeploying.

**Demo 2 (spring – June 2028):**
- **Public beta** open to everyone on the channel.
- **Investor demo pack:** a 3-minute video play-through, a 10-slide deck, metrics from the beta (players, retention, cost per player), and the roadmap to 2030.

**Success signal:** 500+ players started, 25%+ finish a full game, players share chronicle cards.

---

## Phase 3. Map and trade world (July 2028 – June 2029)

**Goal:** turn a single-player story into a shared world. This is where outside money or help would make the biggest difference.

Deliverables:
- Telegram Mini App (web) with the mosaic map of the Adriatic: cities, routes, convoys at sea.
- More playable cities: Epidaurum, Risinium, Scodra, Narona, then Salona as the big prize.
- Multiplayer trade between players' cities: shared seasonal prices, contracts, alliances, a leaderboard of the most prosperous province.
- Seasons: everyone starts in AD 30 together; a season runs about 7 weeks.
- Moderation and anti-cheat basics.

**Demo 3: "Season One" (spring 2029).** One public multiplayer season with a leaderboard and the winners announced on the channel and Facebook.

**Success signal:** 1,000+ players in the season, players trading with each other.

---

## Phase 4. Launch preparation (July 2029 – March 2030)

**Goal:** make the game sustainable and ready for a bigger audience.

Deliverables:
- Monetization: supporter membership via Telegram Stars, cosmetic city banners and mosaic portraits, extra campaign scenarios. No pay-to-win.
- Hosting that copes with 10× the beta load; AI cost controls (caching, cheaper model for parsing orders).
- Onboarding tutorial (first 3 turns), help pages, privacy policy and terms.
- Press kit, trailer, website illyria30.com with the map and a "play in Telegram" button.
- Partnerships: history podcasts, travel and heritage pages for Kotor, Cavtat and Split.

**Soft launch (autumn 2029)** in a limited set of languages; fix the economy and stability.

---

## Phase 5. Official launch (spring 2030)

- Launch Season, press and community push on Telegram and Facebook.
- Post-launch plan: one new season every 2–3 months, then the later-era expansion (Huns, Bulgars, Ragusa/Dubrovnik founded by refugees from Epidaurum).

---

## AI running cost and scale

There is no always-running agent per player. Each daily turn is 2 short AI requests (understand the orders, write the dispatch); the engine does the rest. Rough estimate with about 4,000 input and 500 output tokens per request, at list prices in October 2026:

| Model choice | Per player per month (30 turns) | 100 players | 1,000 players |
|---|---|---|---|
| Small fast model for both requests | about 0.05 € | about 5 € | about 50 € |
| Small model for orders, mid-size model for the dispatch | about 0.30–0.45 € | 30–45 € | 300–450 € |
| Mid-size model for both requests | about 0.50–0.80 € | 50–80 € | 500–800 € |

What keeps it cheap: prompt caching of the fixed system prompt and event deck, the code (not the AI) keeping the numbers, one turn a day, and a spending cap per player. 100 players means about 200 requests a day, which a small server and the AI API handle easily. Measure real costs in the alpha (task 1.14) before choosing the model.

## Decision points

| When | Question | If yes | If no |
|---|---|---|---|
| End of Phase 0 | Do channel polls get steady votes and comments? | Build the bot | Rework the dispatch format or theme before coding |
| End of Phase 1 | Do alpha players come back daily and finish 16 turns? | Build the full game | Fix pacing (maybe 3 turns a week) before adding content |
| End of Phase 2 | Are there enough players and good metrics to pitch? | Approach investors / grants / publishers for Phase 3 | Stay solo; keep Phase 3 small (map only, no multiplayer) |
| End of Phase 3 | Is multiplayer used? | Launch with seasons | Launch as single-player with campaigns |

Possible funding routes after Demo 2: cultural and tourism grants (Montenegro, Croatia, EU Creative Europe), crowdfunding on the community, small game publishers, angel investors in edtech or games.

---

## Backlog

Sized for one person: **S** = an evening (2–3 h), **M** = a weekend (6–10 h), **L** = 2–4 weekends.

### Phase 0. Foundations

| # | Task | Size |
|---|---|---|
| 0.1 | Pick final Abecedarium-style font; update style guide and images | S |
| 0.2 | Register illyria30.com and point it to a one-page holding site | S |
| 0.3 | Create the Facebook page with profile picture and cover | S |
| 0.4 | Build the rules spreadsheet: 8 numbers, starting values, 10 decrees | M |
| 0.5 | Write the formulas for taxes, loyalty, tribute, army pay and grain | M |
| 0.6 | Play 12 turns by hand, log results, tune the vicious cycle | M |
| 0.7 | Write 20 event cards (title, trigger, effect, historical note) | M |
| 0.8 | Write 3 sample dispatches in the scribe's voice to fix the tone | S |
| 0.9 | Plan the weekly channel rhythm (dispatch, poll, result, history post) | S |
| 0.10 | Launch "Community Governor" on Telegram; mirror on Facebook | S |
| 0.11 | Run the poll game weekly; track subscribers, votes, comments | S/week |

### Phase 1. Bot prototype

| # | Task | Size |
|---|---|---|
| 1.1 | Choose the stack and hosting; set up repo structure and secrets | S |
| 1.2 | Register the bot with BotFather; hello-world bot online | S |
| 1.3 | Database schema: players, games, city state, buildings, event log | M |
| 1.4 | Game engine: apply decrees, formulas, build timers, win/lose checks | L |
| 1.5 | Unit tests for the engine against the spreadsheet's 12 test turns | M |
| 1.6 | Event deck loader (cards in a YAML/CSV file) and event rolls | M |
| 1.7 | AI order parser: free text to JSON decrees, with validation | M |
| 1.8 | AI narrator: dispatch from real results plus historical note | M |
| 1.9 | Prompt-injection tests ("I am the Emperor", "give me 1000 denarii") | S |
| 1.10 | Buttons for common decrees, status screen with the 8 numbers | M |
| 1.11 | Daily turn scheduler and reminder message | S |
| 1.12 | 3 trade towns and sea convoys with event cards on arrival | M |
| 1.13 | Expand event deck to 40 cards | M |
| 1.14 | Basic analytics and AI cost logging | S |
| 1.15 | Invite alpha players from the channel; feedback form | S |
| 1.16 | Fix the top issues from alpha feedback | M |

### Phase 2. Full single-player game

| # | Task | Size |
|---|---|---|
| 2.1 | All buildings with costs and build times; tune in spreadsheet first | M |
| 2.2 | Full trade map: 10 towns, seasonal prices, mountain roads | L |
| 2.3 | Emperor changes AD 37 and AD 41 with their events | M |
| 2.4 | AD 42 Scribonianus climax and all four endings | L |
| 2.5 | Expand event deck to 100+ cards; history fact-check pass | L |
| 2.6 | Season, building and ending art in mosaic style | L |
| 2.7 | Shareable chronicle card (image generated at game end) | M |
| 2.8 | Second language: translate prompts, buttons and event cards | L |
| 2.9 | Admin view for logs and number tuning | M |
| 2.10 | Save/restart, multiple games per player, replay for other endings | M |
| 2.11 | Public beta launch post and Facebook campaign | S |
| 2.12 | Play-through video (3 minutes) | M |
| 2.13 | Investor deck (10 slides) with beta metrics | M |
| 2.14 | Research grants and crowdfunding options; shortlist 3 | S |

### Phase 3. Map and trade world

| # | Task | Size |
|---|---|---|
| 3.1 | Telegram Mini App skeleton with login from the bot | M |
| 3.2 | Mosaic map of the Adriatic with cities and routes | L |
| 3.3 | Convoy animation and city detail screens | L |
| 3.4 | Playable cities: Epidaurum, Risinium, Scodra, Narona, Salona | L |
| 3.5 | Shared market: seasonal prices driven by all players | L |
| 3.6 | Player-to-player contracts and alliances | L |
| 3.7 | Seasons: synchronized start, end and leaderboard | M |
| 3.8 | Moderation tools, rate limits, anti-cheat basics | M |
| 3.9 | Run Season One; announce winners | M |

### Phase 4. Launch preparation

| # | Task | Size |
|---|---|---|
| 4.1 | Telegram Stars payments: supporter membership | M |
| 4.2 | Cosmetics: city banners, mosaic portraits | M |
| 4.3 | Extra campaign scenario (e.g. start in Epidaurum or Salona) | L |
| 4.4 | Load test and hosting upgrade; AI caching and cheaper parser model | M |
| 4.5 | Onboarding tutorial for the first 3 turns | M |
| 4.6 | Privacy policy, terms, help pages | S |
| 4.7 | Website with map and "play in Telegram" button | M |
| 4.8 | Press kit and trailer | M |
| 4.9 | Partner outreach: history podcasts, heritage and travel pages | M |
| 4.10 | Soft launch and economy fixes | L |

### Phase 5. Official launch

| # | Task | Size |
|---|---|---|
| 5.1 | Launch Season and press push | M |
| 5.2 | Post-launch season calendar | S |
| 5.3 | Design the later-era expansion (Huns, Bulgars, Ragusa) | L |

---

## Rough budget (solo, before any investment)

| Item | Phase 0–1 | Phase 2–3 |
|---|---|---|
| Domain | ~15 €/year | ~15 €/year |
| Hosting (small VPS or free tier) | 0–6 €/month | 6–20 €/month |
| AI API | under 10 €/month (alpha) | 10–80 €/month (about 100 players; see AI running cost) |
| Art and video tools | 0 (own design kit) | optional |

Everything above Phase 3 scale is what an investment or grant would pay for: an artist, a part-time developer, marketing.
