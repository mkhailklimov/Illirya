// Illyria: AD 30 — the rules engine (rules v6, 19 Oct 2026: a battle once a year; the city's own character; three dice a season; letters from Rome; the tribes).
// The web game is now the main playtest tool; rules/play.py is frozen at the v1 rules.
// The rules data (numbers, goods, towns, decrees, seasons, advisors, winds, buildings, cards)
// comes from data.js, built by web/build.py from rules/*.csv and events/*.yaml.
// Where the engine needs the player, it awaits the page's `ui` object.
(function () {
  const D = window.GAME_DATA;

  // --- Formula constants (formulas.md) ---
  const MAX_ORDERS = 12;                 // most orders validate() accepts in one go
  const FREE_ORDERS = 1;                 // after the three card decisions, the governor gives one order of his own
  const TAX_RATES = { low: [0.25, +1], normal: [0.4, 0], high: [0.55, -2] };   // denarii a person a season, loyalty a season (v4)
  const TAX_STEPS = ["low", "normal", "high"];
  const ARMY_PAY = 4, TRIBUTE = 3000, TRIBUTE_PAID_FAVOUR = 5, TRIBUTE_MISSED_FAVOUR = -20, TRIBUTE_DEBT_PENALTY = 1.5;
  const GRAIN_EATEN = 3, GRAIN_BASE_EATERS = 4600, GRAIN_PRICE = 500;
  const CITY = (D.cities || [{ id: "acruvium", name: "Acruvium", field_plots: 12, field_plots_max: 16, traits: "" }])[0];
  const TOWN_PLOTS = 12, FIELD_PLOTS = +CITY.field_plots || 12, BASE_WHEAT = 4;
  const SHIP_LOAD = 40, GRAIN_LOAD = 10;  // a ship carries 40 loads; a month of grain is 10 of them
  const VOYAGE_DIE = 20, VOYAGE_TARGET = 5; // d20 + sailing advantage when a convoy comes home
  const LOYALTY_LOW_FOOD = -3, LOYALTY_HUNGER = -10, UNREST_BELOW = 30, UNREST_FAVOUR = -3, UPRISING_BELOW = 20;
  const ORDER_ARMY = 100, ORDER_FAVOUR = -1;
  const DECKS = [["land", "Land"], ["sea", "Sea"], ["omen", "Omen"]];
  const CURRENT_DIE = 6, SAIL_STEP = 0.10, SAIL_CAP = 0.30, ROLL_BONUS_CAP = 5;
  const MOOD_START = 3, MOOD_MAX = 5, MOOD_SULK = 1, IGNORED_LIMIT = 2, LEAD_CHARGE_BONUS = 2, GOOD_DEAL_BONUS = 0.20;
  const COUNCIL_ORDER = ["treasurer", "economist", "general", "fleet", "priest"];
  const FESTIVAL_WINE_KEEP = 4;
  const MERCHANT_LOAD = 20, MERCHANT_MARKUP = 1.5;   // passing merchants: up to 20 loads at half again the base price
  const FIELD_PLOTS_MAX = +CITY.field_plots_max || 16, CLEAR_SEASONS = 2;     // clearing new fields (the tribes' land comes on top)
  // Rules v4
  const GROWTH_BASE = 0.015, GROWTH_HAPPY = 0.005;   // people per season in peace; +0.5% when loyalty is 60 or more
  const GROWTH_MIN_LOYALTY = 40, GROWTH_MIN_GRAIN = 2;
  const GAMBLE_DIE = 20, GAMBLE_TARGET = 10;          // a risky proposal is a d20 + the advisor's talent
  const GAMBLE_STAT = { general: "strategy", fleet: "experience", treasurer: "logic", economist: "persuasion", priest: "persuasion" };
  const TREATY_TARGET = 11, BATTLE_TARGET = 12, MARCH_MIN_ARMY = 150, HOSTILE_SEASONS = 12, RAID_WEIGHT = 3;
  // Rules v5: every card's decision is a check, rolled when all three are made
  const DIE_OF = { land: "opal", sea: "aquamarine", omen: "onyx" };
  const CHECK_DC = { moderate: 6, risky: 11, own: 9, letbe_bad: 9, letbe: 4, option: 3 };
  const WIND_SEA = { N: [-3, "the bora is rising"], S: [-1, "a hot wind from Africa"], W: [1, "a gentle west wind"], SW: [-2, "the stormy Africus"], E: [0, ""], CALM: [3, "a flat calm"] };
  const BONUS_CAP = 8;
  const END_TURN = 52;                               // Winter AD 42: Claudius sends a successor
  const EMPERORS = [[1, "Tiberius"], [29, "Gaius"], [44, "Claudius"]];   // from turn: Spring 37, Winter 40

  const num = (v, d = 0) => { if (v === null || v === undefined) return d; if (typeof v === "number") return v; v = String(v).trim(); return v ? parseFloat(v) : d; };
  const byId = (rows) => Object.fromEntries(rows.map((r) => [r.id, r]));
  /** "timber 10; iron 5" -> {timber: 10, iron: 5} */
  const parseList = (t) => Object.fromEntries(String(t || "").split(";").map((x) => x.trim().split(/\s+/)).filter((p) => p[0]).map(([k, v]) => [k, num(v, 1)]));
  const RULES = byId(D.numbers), GOODS_LIST = D.goods, GOOD = byId(D.goods);
  const CORE = D.numbers.map((r) => r.id), GOODS = D.goods.map((g) => g.id), NUMBERS = CORE.concat(GOODS);
  const DECREES = D.decrees, DECREE = byId(D.decrees);
  const SEASONS = [...D.seasons].sort((a, b) => +a.order - +b.order);
  const ADVISORS = byId(D.advisors), WINDS = byId(D.winds), BUILDING_LIST = D.buildings, BLD = byId(D.buildings);
  const BLD_IDS = BUILDING_LIST.map((b) => b.id);
  const TOWNS = D.towns.map((t) => ({ ...t, sellsTo: parseList(t.sells), buysFrom: parseList(t.buys), seasons: num(t.seasons, 1) }));
  const TOWN = byId(TOWNS);
  const CARDS = D.cards;
  const TRIBES = (D.tribes || []).map((t) => ({ ...t, plots: num(t.plots), strength: num(t.strength) }));
  const TRIBE = byId(TRIBES);
  const DECK_LABEL = Object.fromEntries(DECKS);
  const nameOf = (n) => (RULES[n] ? RULES[n].name : GOOD[n] ? GOOD[n].name : n);
  const unitOf = (n) => (RULES[n] ? RULES[n].unit : GOOD[n] ? GOOD[n].unit : "");

  const rint = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  function choices(items, weights) {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r < 0) return items[i]; }
    return items[items.length - 1];
  }
  const pct = (x) => (x >= 0 ? "+" : "−") + Math.round(Math.abs(x) * 100) + "%";
  const intc = (v) => Math.round(v).toLocaleString("en-US");
  const fmt = (n, v) => (n === "grain" ? v.toFixed(1) : intc(v));
  const listText = (o) => Object.entries(o).filter(([, v]) => v).map(([k, v]) => `${k === "grain" ? v + (v === 1 ? " month" : " months") + " of grain" : `${v} ${nameOf(k).toLowerCase()}`}`).join(", ");

  // --- Game state ---
  const startBuildings = () => BUILDING_LIST.flatMap((b) => Array.from({ length: num(b.start) }, () => ({ kind: b.id, done: -99 })));
  const newCouncil = () => Object.fromEntries(Object.keys(ADVISORS).map((a) => [a, { mood: MOOD_START, ignored: 0, used: null }]));
  function newGame() {
    const s = Object.fromEntries(CORE.map((n) => [n, num(RULES[n].start)]));
    for (const g of GOODS_LIST) s[g.id] = num(g.start);
    Object.assign(s, { version: 4, turn: 1, card_last: {}, calamity_turn: 0,
      troops: { slingers: 0, archers: 0, cavalry: 0, engines: 0 }, kit: {}, army_xp: 0, morale: 0, last_war: -9,
      tribes: Object.fromEntries(TRIBES.map((t) => [t.id, { state: "free", tries: 0, hostile_until: 0 }])), tax: "normal", buildings: startBuildings(), shipyard: [], convoys: [], tribute_debt: 0,
      field_plots: FIELD_PLOTS, clearing: [], wind: "E", current: 1, weather_turn: 0, forecast: null, hunger_streak: 0, last_festival: -9, once_fired: [], over: null,
      council: newCouncil(), last_roll: null });
    return migrate(s);
  }
  // rules v9-v10: ships with names, voyages, inventions, justice, restlessness. Older saves get the new fields here.
  const WAR_NAMES = ["Mars", "Bellona", "Fulmen", "Hercules", "Leo", "Triumphus", "Ultor", "Invicta"];
  function newWarName(s) {
    const used = new Set([...(s.navy || []), ...(s.shipyard || []).map((k) => k.name)]);
    return WAR_NAMES.find((n) => !used.has(n)) || `Mars ${["II", "III", "IV"][rint(0, 2)]}`;
  }
  const SHIP_NAMES = ["Fortuna", "Concordia", "Aquila", "Victoria", "Neptunus", "Salus", "Delphinus", "Pax", "Spes", "Minerva", "Castor", "Pollux", "Felicitas", "Triton", "Pietas", "Ister", "Clementia", "Mercurius"];
  function newShipName(s) {
    const used = new Set([...(s.fleet || []), ...(s.shipyard || []).map((k) => k.name)]);
    const free = SHIP_NAMES.filter((n) => !used.has(n));
    return free.length ? free[0] : `${SHIP_NAMES[(s.fleet || []).length % SHIP_NAMES.length]} ${["II", "III", "IV"][rint(0, 2)]}`;
  }
  /** Keep the names of the ships in step with their number (cards and storms may sink one, Rome may send one). */
  function fleetNames(s) {
    s.fleet = s.fleet || [];
    const n = Math.max(0, Math.trunc(s.ships));
    while (s.fleet.length > n) {   // the lost one is a ship in harbour, not one at sea
      const atSea = new Set((s.convoys || []).map((c) => c.ship));
      const k = s.fleet.findIndex((x) => !atSea.has(x));
      s.fleet.splice(k >= 0 ? k : s.fleet.length - 1, 1);
    }
    while (s.fleet.length < n) s.fleet.push(newShipName(s));
    return s.fleet;
  }
  function migrate(s) {
    s.shipyard = (s.shipyard || []).map((k) => (typeof k === "number" ? { done: k, name: null } : k));
    fleetNames(s);   // the ships afloat are named first, then the keels
    for (const k of s.shipyard) if (!k.name) k.name = newShipName(s);
    delete s.discontent; delete s.discontent_parts;   // rules v10: one number, loyalty
    s.restless = s.restless || 0;
    s.warships = s.warships || 0; s.navy = s.navy || [];
    s.justice = s.justice || { pardoned: 0, executed: 0 };
    s.inventions = s.inventions || [];
    s.voyages = s.voyages || [];
    s.news = s.news || [];
    s.army_peak = s.army_peak || Math.max(150, Math.trunc(s.army));
    fleetNames(s);
    for (const c of s.convoys || []) if (!c.ship) c.ship = s.fleet.find((n) => !s.convoys.some((x) => x.ship === n)) || "a ship";
    return s;
  }
  const seasonOf = (turn) => [SEASONS[(turn - 1) % SEASONS.length], 30 + Math.floor((turn - 1) / SEASONS.length)];
  const isDone = (s, b) => s.turn >= b.done;
  /** 0 before a building yields, rising to 1 as vines and groves grow (buildings.csv matures, ramp). */
  function yieldFactor(s, b) {
    if (!isDone(s, b)) return 0;
    const B = BLD[b.kind], age = s.turn - b.done, m = num(B.matures), r = num(B.ramp);
    if (age < m) return 0;
    return r ? Math.min(1, (age - m + 1) / r) : 1;
  }
  const built = (s, kind) => s.buildings.filter((b) => b.kind === kind && isDone(s, b)).length;
  const stat = (s, field) => s.buildings.filter((b) => isDone(s, b)).reduce((t, b) => t + num(BLD[b.kind][field]), 0);
  const plotsUsed = (s, zone) => s.buildings.filter((b) => BLD[b.kind].zone === zone).length;
  const clearedPlots = (s) => s.field_plots ?? FIELD_PLOTS;
  const tribeState = (s, id) => (s.tribes || {})[id] || { state: "free", tries: 0, hostile_until: 0 };
  const tribeWon = (s, id) => ["ally", "conquered"].includes(tribeState(s, id).state);
  const tribalPlots = (s) => TRIBES.filter((t) => tribeWon(s, t.id)).reduce((a, t) => a + t.plots, 0);
  const hostile = (s, id) => tribeState(s, id).hostile_until > s.turn;
  const anyHostile = (s) => TRIBES.some((t) => hostile(s, t.id));
  /** Field plots open now: the twelve, the cleared hillside, and the land won from the tribes. */
  const fieldPlots = (s) => clearedPlots(s) + tribalPlots(s);
  const emperorOf = (turn) => EMPERORS.filter(([t]) => turn >= t).pop()[1];
  const zonePlots = (s, zone) => (zone === "town" ? TOWN_PLOTS : zone === "hill" ? 1 : fieldPlots(s));
  /** Goods the passing merchants sell (no luxuries), and their price at the quay. */
  const MERCHANT_GOODS = ["grain"].concat(GOODS_LIST.filter((g) => g.origin !== "luxury").map((g) => g.id));
  const merchantPrice = (g) => Math.round((g === "grain" ? GRAIN_PRICE : num(GOOD[g].price)) * MERCHANT_MARKUP);
  const merchantCost = (o) => Object.entries(o.buy || {}).reduce((t, [g, q]) => t + q * merchantPrice(g), 0);
  const shipsAtSea = (s) => s.convoys.length;
  const SHIPS_MAX = 6, TRIREME_UPKEEP = 40, TRIREME_CUT = .15, TRIREMES_COUNT = 2;   // rules v11: one harbour, six berths, merchant galleys and triremes together
  const berths = (s) => Math.min(SHIPS_MAX, Math.trunc(stat(s, "ships_cap")));
  const berthsUsed = (s) => Math.trunc(s.ships) + (s.warships || 0) + (s.shipyard || []).length;
  const housing = (s) => Math.trunc(stat(s, "housing"));
  const turnsToTribute = (s) => [0, 1, 2, 3].find((i) => seasonOf(s.turn + i)[0].tribute_due === "yes");
  function buildingState(s, b) {
    const B = BLD[b.kind];
    if (!isDone(s, b)) return { phase: "building", left: b.done - s.turn, text: `being built, ready in ${b.done - s.turn} season${b.done - s.turn > 1 ? "s" : ""}` };
    const f = yieldFactor(s, b);
    if (B.produces && f === 0) { const left = num(B.matures) - (s.turn - b.done); return { phase: "growing", left, text: `growing, first yield in ${left} season${left > 1 ? "s" : ""}` }; }
    if (B.produces && f < 1) return { phase: "young", f, text: `young, ${Math.round(f * 100)}% of full yield` };
    return { phase: "done", f: 1, text: B.produces ? "in full yield" : "standing" };
  }

  // --- Dice and weather ---
  async function roll(die, bonus, target, why, quiet = false) {
    const r = rint(1, die), total = r + bonus;
    let ok = null, tag = null;
    if (target !== undefined && target !== null) {
      ok = total >= target;
      if (r === die) { ok = true; tag = "Critical success"; }
      else if (r === 1) { ok = false; tag = "Critical failure"; }
      else tag = ok ? "Success" : "Failure";
    }
    const res = { die, r, bonus, total, target, ok, tag, why };
    await ui.roll(res, quiet);
    return res;
  }
  function rollBonus(s, expr) {
    let total = 0;
    for (const term of String(expr ?? "0").replace(/ /g, "").split("+")) {
      const m = term.match(/^(\w+)(?:([/*])(\d+))?$/);
      if (!m) continue;
      const [, name, op, k] = m;
      let v;
      const talent = name.match(/^(\w+?)_(experience|decisions|strategy|administration|persuasion|logic)$/);
      if (talent && ADVISORS[talent[1]]) v = num(ADVISORS[talent[1]][talent[2]], 3) - 3;
      else if (/^-?\d+$/.test(name)) v = parseInt(name, 10);
      else if (typeof s[name] === "number") v = s[name];
      else if (BUILDING_LIST.length && name in BUILDING_LIST[0]) v = stat(s, name);
      else v = 0;
      v = op === "/" ? Math.floor(v / +k) : op === "*" ? v * +k : v;
      total += Math.trunc(v);
    }
    return Math.max(-ROLL_BONUS_CAP, Math.min(ROLL_BONUS_CAP, total));
  }
  function drawWeather(turn) {
    const key = "weight_" + seasonOf(turn)[0].season.toLowerCase();
    const ids = Object.keys(WINDS);
    const wind = choices(ids, ids.map((i) => num(WINDS[i][key], 1)));
    const c = rint(1, CURRENT_DIE);
    return { turn, wind, current: c === 1 ? 0 : c === CURRENT_DIE ? 2 : 1 };
  }
  function rollWeather(s) {
    if (s.weather_turn === s.turn) return;
    const w = s.forecast && s.forecast.turn === s.turn ? s.forecast : drawWeather(s.turn);
    s.wind = w.wind; s.current = w.current; s.weather_turn = s.turn; s.forecast = null;
  }
  const CURRENT_TEXT = { 0: "slack", 1: "running north along our coast", 2: "running strongly north along our coast" };
  function sailing(s, north) {
    const w = WINDS[s.wind];
    const adv = num(w[north ? "sail_north" : "sail_south"]) + (north ? s.current : -s.current);
    return [Math.max(-SAIL_CAP, Math.min(SAIL_CAP, adv * SAIL_STEP)), Math.trunc(num(w.delay))];
  }

  // --- Trade ---
  /** Price in denarii for one unit (a month for grain) in a town: side "sell" = we sell there, "buy" = we buy there. */
  function priceAt(s, townId, good, side, extra = 0) {
    const t = TOWN[townId];
    const mult = (side === "buy" ? t.sellsTo : t.buysFrom)[good];
    if (mult === undefined) return null;
    const base = good === "grain" ? GRAIN_PRICE : num(GOOD[good].price);
    const factor = sailing(s, t.direction === "north")[0] + stat(s, "trade_bonus") + extra;
    return Math.max(1, Math.round(base * mult * (side === "buy" ? 1 - factor : 1 + factor)));
  }
  const loads = (o) => Object.values(o.sell || {}).reduce((a, b) => a + b, 0) + Object.entries(o.buy || {}).reduce((a, [g, q]) => a + q * (g === "grain" ? GRAIN_LOAD : 1), 0);
  const buyCost = (s, o) => Object.entries(o.buy || {}).reduce((t, [g, q]) => t + q * (priceAt(s, o.town, g, "buy") || 0), 0);
  const sellValue = (s, o) => Object.entries(o.sell || {}).reduce((t, [g, q]) => t + q * (priceAt(s, o.town, g, "sell") || 0), 0);

  // --- The council ---
  function abilityReady(s, aid) {
    const st = s.council[aid];
    if (st.mood <= MOOD_SULK) return false;
    if (ADVISORS[aid].ability_uses === "game") return st.used === null;
    return st.used !== seasonOf(s.turn)[1];
  }
  const useAbility = (s, aid) => { s.council[aid].used = seasonOf(s.turn)[1]; };
  async function offerAbility(s, aid, question) {
    if (!abilityReady(s, aid)) return false;
    const yes = await ui.ability(aid, question);
    if (yes) useAbility(s, aid);
    return yes;
  }
  function abilityState(s, aid) {
    const a = ADVISORS[aid], st = s.council[aid];
    if (st.mood <= MOOD_SULK) return "sulking";
    if (abilityReady(s, aid)) return "ready";
    return a.ability_uses === "game" ? "used" : "used this year";
  }
  function cheer(s, aid, notes, why) {
    const st = s.council[aid];
    if (st.mood < MOOD_MAX) { st.mood += 1; notes.push(`${ADVISORS[aid].name} ${why} (mood ${st.mood}/${MOOD_MAX}).`); }
  }
  function updateMoods(s, wants, orders, notes) {
    for (const [aid, want] of Object.entries(wants)) {
      if (!want) continue;
      const st = s.council[aid], name = ADVISORS[aid].name;
      if (orders.some(want)) { st.ignored = 0; cheer(s, aid, notes, "is pleased you took his advice"); continue; }
      st.ignored += 1;
      if (st.ignored >= IGNORED_LIMIT && st.mood > 0) {
        st.mood -= 1; st.ignored = 0;
        notes.push(`${name} feels ignored (mood ${st.mood}/${MOOD_MAX}).${st.mood === MOOD_SULK ? " He sulks and will not use his gifts for you." : ""}`);
      }
    }
  }
  const convoyThat = (test) => (o) => o.id === "send_convoy" && test(o);
  const sells = (...gs) => convoyThat((o) => gs.some((g) => (o.sell || {})[g] > 0));
  const sellsAny = convoyThat((o) => Object.values(o.sell || {}).some((q) => q > 0));
  const buysGrain = convoyThat((o) => (o.buy || {}).grain > 0);
  const toward = (dir) => convoyThat((o) => TOWN[o.town] && TOWN[o.town].direction === dir);
  const decreeIs = (...ids) => (o) => ids.includes(o.id);
  const buildOf = (...kinds) => (o) => o.id === "build" && kinds.includes(o.building);

  /** Rome's tribute: how much, when, and what happens if the chest is short. */
  function tributeInfo(s) {
    const t = turnsToTribute(s), due = TRIBUTE + (s.tribute_debt || 0);
    return { amount: TRIBUTE, debt: s.tribute_debt || 0, due, inTurns: t, season: "Summer", grace: s.tribute_grace === s.turn || s.tribute_grace === s.turn + 1 ? s.tribute_grace : null,
      graceLeft: abilityReady(s, "treasurer"), paidFavour: TRIBUTE_PAID_FAVOUR, missedFavour: TRIBUTE_MISSED_FAVOUR, penalty: TRIBUTE_DEBT_PENALTY, short: Math.max(0, due - s.treasury) };
  }
  function council(s) {
    const wants = {}, say = {};
    const [season] = seasonOf(s.turn);
    const ttt = turnsToTribute(s);
    const income = s.people * TAX_RATES[s.tax][0] - s.army * ARMY_PAY;
    const due = TRIBUTE + s.tribute_debt;
    const money = (o) => decreeIs("raise_taxes", "hear_petitions")(o) || sellsAny(o);
    if (s.tribute_grace === s.turn) { say.treasurer = `Rome's season of grace ends now: ${intc(due)} denarii are due this season.`; wants.treasurer = money; }
    else if (s.treasury + income * (ttt + 1) < due) { say.treasurer = `At this rate we cannot pay Rome's ${intc(due)} denarii when the tribute falls due.`; wants.treasurer = money; }
    else say.treasurer = `The chest holds ${intc(s.treasury)} denarii. Tribute of ${intc(due)} is due ${ttt === 0 ? "this season" : `in ${ttt} season${ttt > 1 ? "s" : ""}`}.`;
    const mult = num(WINDS[s.wind].harvest_mult, 1);
    if (s.grain < 3) { say.economist = `Only ${s.grain.toFixed(1)} months of grain left. Buy grain in Dyrrachium, or from the merchants at the quay, or the people will starve.`; wants.economist = (o) => buysGrain(o) || (o.id === "merchants" && (o.buy || {}).grain > 0); }
    else if (s.grain < 6) { say.economist = "Our terraces feed us only 8 months a year. More wheat, a fishery or bought grain, Governor, or we go short."; wants.economist = (o) => buysGrain(o) || buildOf("wheat", "fishery")(o); }
    else if (s.wine + s.oil >= 14 && season.sailing === "yes") { say.economist = `${Math.trunc(s.wine)} amphorae of wine and ${Math.trunc(s.oil)} of oil wait in the stores. Aquileia and Brundisium pay best.`; wants.economist = sells("wine", "oil"); }
    else if (s.fleece >= 6 && !built(s, "weavers")) { say.economist = `${Math.trunc(s.fleece)} bales of fleece and no one to weave them. A weavers' workshop, Governor.`; wants.economist = buildOf("weavers"); }
    else if (mult !== 1 && num(season.harvest_grain) > 0) say.economist = `With this wind the harvest will be ${mult > 1 ? "better" : "worse"} than usual (${pct(mult - 1)}).`;
    else if (fieldsFull(s) && fieldPlots(s) < FIELD_PLOTS_MAX) { say.economist = "Every field round the bay is taken. Clear the scrub on the hillside for new terraces."; wants.economist = decreeIs("clear_land"); }
    else if (built(s, "olives") && !(s.inventions || []).includes("screw_press") && s.treasury > 1500) { say.economist = "Our olives are pressed the old way. A Greek screw press, Governor: a third more oil from every harvest, and the neighbours will pay to use it."; wants.economist = decreeIs("commission_press"); }
    else { say.economist = "The markets are steady. Vines and olives take years; plant them early."; wants.economist = buildOf("vineyard", "olives"); }
    if (s.army < ORDER_ARMY) { say.general = `Only ${Math.trunc(s.army)} men. Rome expects order, and so do the hill tribes.`; wants.general = decreeIs("recruit"); }
    else if (s.loyalty < 52) { say.general = "The mood in the streets is sour. Hang a few brigands, recruit, and the town will keep its head down."; wants.general = decreeIs("recruit", "hang_brigands"); }
    else say.general = `The garrison of ${Math.trunc(s.army)} stands ready. Its pay is ${intc(s.army * ARMY_PAY)} denarii a season.`;
    const [north] = sailing(s, true), [south] = sailing(s, false);
    if (season.sailing === "no") say.fleet = "Mare clausum. No ship of mine leaves the bay until spring.";
    else if (s.wind === "CALM") say.fleet = "Not a breath of wind. Any convoy we send will sit a season in harbour.";
    else if (north > south) { say.fleet = `Wind and current favour a voyage north up the coast (${pct(north)} on prices).`; wants.fleet = toward("north"); }
    else if (south > north) { say.fleet = `The wind is with us for a voyage south (${pct(south)} on prices).`; wants.fleet = toward("south"); }
    else say.fleet = "The sea is open; wind and current favour neither course.";
    const pr = s.prophecy && s.prophecy.turn >= s.turn - 1 ? s.prophecy : null;
    if (pr && pr.advice) { say.priest = `The liver spoke. ${pr.signs[0]} ${pr.advice.say}`; wants.priest = decreeIs(pr.advice.order.id); }
    else if (s.loyalty < 55) { say.priest = "The people murmur against you. A festival would please the gods and men alike."; wants.priest = decreeIs("hold_festival"); }
    else if (s.favour < 40) { say.priest = `The omens from Rome are cold. Honour ${emperorOf(s.turn)}, or send gifts.`; wants.priest = decreeIs("honour_rome", "honour_tiberius"); }
    else say.priest = "Sacrifice at the temple, Governor, and I will read the liver: the coming war, the sea, the granaries, and what you should do.";
    return { wants, say };
  }

  // --- Orders ---
  const effectsOf = (d) => Object.fromEntries(CORE.filter((n) => String(d[n] ?? "").trim()).map((n) => [n, num(d[n])]));
  const order = (id, extra = {}) => ({ id, building: "none", ...extra });
  function costOf(s, o) {
    if (o.id === "build" && BLD[o.building]) return [num(BLD[o.building].cost_treasury), parseList(BLD[o.building].cost)];
    const d = DECREE[o.id];
    let c = num(d.cost_treasury);
    if (o.id === "send_convoy" && o.town) c += buyCost(s, o);
    if (o.id === "merchants") c += merchantCost(o);
    if (o.id === "refill_ranks") { const R = refillOf(s); return [R.cost, R.mats]; }
    if (o.id === "treat_tribe" && TRIBE[o.tribe]) {
      const t = TRIBE[o.tribe], k = hostile(s, t.id) ? 1.5 : 1;
      return [Math.round(num(t.gifts_treasury) * k), Object.fromEntries(Object.entries(parseList(t.gifts)).map(([g, q]) => [g, Math.round(q * k)]))];
    }
    return [c, parseList(d.cost)];
  }
  /** Refilling the cohorts (rules v9): townsmen take the places of the fallen, up to the army's best strength; each needs a shield (timber), and a sword and javelins if the army carries them (iron). */
  const REFILL_MAX = 100;
  function refillOf(s) {
    const n = Math.max(0, Math.min(REFILL_MAX, Math.trunc((s.army_peak || 150) - s.army)));
    const k = s.kit || {}, swords = 1 + (k.gladius ? 1 : 0) + (k.pila ? 1 : 0);
    return { n, cost: n * REPLACE_COST + (k.pila ? n : 0), mats: n ? { timber: Math.ceil(n / 10), iron: Math.ceil(n / 10) * swords } : {} };
  }
  function describe(s, o) {
    const d = DECREE[o.id];
    if (!d) return o.id;
    if (o.id === "build") { const b = BLD[o.building]; return b ? (b.zone === "field" && ["vineyard", "olives", "wheat"].includes(b.id) ? `Plant ${b.name.toLowerCase()}` : `Build ${b.name.toLowerCase()}`) : "Build (what?)"; }
    if (o.id === "merchants") return Object.keys(o.buy || {}).length ? `Buy from the merchants at the quay: ${listText(o.buy)}` : d.name;
    if (o.id === "honour_tiberius") return `Decree honouring ${emperorOf(s.turn)}`;
    if (o.id === "refill_ranks") { const R = refillOf(s); return R.n ? `Refill the cohorts: ${R.n} recruits from the town` : d.name; }
    if (o.id === "treat_tribe") return `Treat with the ${TRIBE[o.tribe] ? TRIBE[o.tribe].name : "tribes"}`;
    if (o.id === "march_tribe") return `March against the ${TRIBE[o.tribe] ? TRIBE[o.tribe].name : "tribes"}`;
    if (o.id !== "send_convoy") return d.name;
    const t = TOWN[o.town];
    const parts = [];
    if (Object.keys(o.sell || {}).length) parts.push("sell " + listText(o.sell));
    if (Object.keys(o.buy || {}).length) parts.push("buy " + listText(o.buy));
    return `Convoy to ${t ? t.name : "?"}` + (parts.length ? ": " + parts.join("; ") : "");
  }
  /** Check orders against the rules, in order. Returns [accepted, problems]. */
  function validate(s, orders) {
    const [season] = seasonOf(s.turn);
    let treasury = s.treasury, tax = s.tax;
    const stores = Object.fromEntries(GOODS.map((g) => [g, s[g]]));
    const accepted = [], problems = [], seen = new Set(s.season_taken || []), newPlots = { town: 0, field: 0 }, newKinds = {};
    let newShips = 0, convoys = 0, clears = 0, army = s.army;
    orders.forEach((o, i) => {
      if (i >= MAX_ORDERS) { if (i === MAX_ORDERS) problems.push(`No more than ${MAX_ORDERS} actions a season.`); return; }
      o.building = o.building || "none";
      const d = DECREE[o.id];
      if (!d) { problems.push(`'${o.id}' is not a decree of this province.`); return; }
      if (seen.has(o.id) && d.once === "yes") { problems.push(`'${d.name}' only once a season.`); return; }
      const [c, mats] = costOf(s, o);
      if (o.id === "build") {
        const b = BLD[o.building];
        if (!b || b.id === "forum") { problems.push("The architect asks: build what?"); return; }
        newPlots[b.zone] = newPlots[b.zone] || 0;
        if (plotsUsed(s, b.zone) + newPlots[b.zone] >= zonePlots(s, b.zone)) { problems.push(b.zone === "hill" ? "The crag above the town has room for one citadel." : `No free plot ${b.zone === "town" ? "inside the walls" : "in the fields"} for ${b.name.toLowerCase()}.`); return; }
        const have = s.buildings.filter((x) => x.kind === b.id).length + (newKinds[b.id] || 0);
        if (have >= Math.trunc(num(b.max, 99))) { problems.push(`Acruvium already has as many ${b.name.toLowerCase()} as it can hold (${Math.trunc(num(b.max))}).`); return; }
      }
      if (["build_ship", "build_warship"].includes(o.id) && berthsUsed(s) + newShips >= berths(s)) { problems.push(berths(s) ? `Epicadus: every berth is taken (${berths(s)} at most, merchant galleys and triremes together, keels on the slipway included).` : "Epicadus: build the harbour first."); return; }
      if (o.id === "commission_press" && (s.inventions || []).includes("screw_press")) { problems.push("Nikandros: we already have a screw press."); return; }
      if (o.id === "refill_ranks" && refillOf(s).n < 5) { problems.push(`Antistius: the cohorts are at full strength (${Math.trunc(s.army)} of ${Math.trunc(s.army_peak || 150)}); there is nobody to replace.`); return; }
      if (o.id === "clear_land" && clearedPlots(s) + (s.clearing || []).length + clears >= FIELD_PLOTS_MAX) { problems.push(`The hillside is used up: at most ${FIELD_PLOTS_MAX} field plots.`); return; }
      if (o.id === "merchants") {
        if (season.sailing === "no") { problems.push("No merchant ships call in winter (mare clausum)."); return; }
        const bad = Object.keys(o.buy || {}).filter((g) => !MERCHANT_GOODS.includes(g));
        if (bad.length) { problems.push(`The merchants do not carry ${bad.map((g) => nameOf(g).toLowerCase()).join(", ")}.`); return; }
        if (!loads(o)) { problems.push("The merchants ask: what will you buy?"); return; }
        if (loads(o) > MERCHANT_LOAD) { problems.push(`The merchants can spare ${MERCHANT_LOAD} loads a season (a month of grain is ${GRAIN_LOAD}); this is ${loads(o)}.`); return; }
      }
      if (o.id === "treat_tribe" || o.id === "march_tribe") {
        const t = TRIBE[o.tribe];
        if (!t) { problems.push("Which tribe? The Docleatae, the Ardiaei or the Pirustae."); return; }
        if (tribeWon(s, t.id)) { problems.push(`The land of the ${t.name} is already ours.`); return; }
        if (o.id === "march_tribe" && army < MARCH_MIN_ARMY) { problems.push(`Antistius: ${MARCH_MIN_ARMY} soldiers at least to march into the hills; we have ${Math.trunc(army)}.`); return; }
        if (o.id === "march_tribe" && season.season === "Winter") { problems.push("Antistius: no one marches into the mountains in winter."); return; }
      }
      if (["train_slingers", "raise_archers", "raise_cavalry"].includes(o.id) && s.people < 500) { problems.push("The town has too few men to spare."); return; }
      if (o.id === "build_engine" && troopsOf(s).engines + (newKinds.engine || 0) >= ENGINES_MAX) { problems.push(`The arsenal has room for ${ENGINES_MAX} engines.`); return; }
      if ((o.id === "arm_pila" || o.id === "arm_gladius") && (s.kit || {})[o.id === "arm_pila" ? "pila" : "gladius"]) { problems.push("The infantry already has them."); return; }
      if (o.id === "build_engine") newKinds.engine = (newKinds.engine || 0) + 1;
      if (o.id === "build_ballista" && troopsOf(s).ballistae + (newKinds.ballista || 0) >= BALLISTA_MAX) { problems.push(`The arsenal has room for ${BALLISTA_MAX} ballistae.`); return; }
      if (o.id === "build_ballista") newKinds.ballista = (newKinds.ballista || 0) + 1;
      if (o.id === "dismiss" && army < 50) { problems.push("There are not 50 soldiers left to dismiss."); return; }
      if (o.id === "send_convoy") {
        const t = TOWN[o.town];
        if (!t) { problems.push("Epicadus asks: to which town?"); return; }
        if (season.sailing === "no" && (!abilityReady(s, "fleet") || convoys > 0)) { problems.push("Epicadus refuses: no convoys in winter (mare clausum)."); return; }
        if (Math.trunc(s.ships) - shipsAtSea(s) - convoys < 1) { problems.push("Epicadus: every ship is at sea or lost; there is none to send."); return; }
        if (loads(o) > SHIP_LOAD) { problems.push(`One ship carries ${SHIP_LOAD} loads (a month of grain is ${GRAIN_LOAD}); this convoy has ${loads(o)}.`); return; }
        if (!loads(o)) { problems.push(`The convoy to ${t.name} has nothing to sell or buy.`); return; }
        const bad = Object.keys(o.sell || {}).filter((g) => !(g in t.buysFrom)).concat(Object.keys(o.buy || {}).filter((g) => !(g in t.sellsTo)));
        if (bad.length) { problems.push(`${t.name} does not trade in ${bad.map((g) => nameOf(g).toLowerCase()).join(", ")}.`); return; }
        const short = Object.entries(o.sell || {}).filter(([g, q]) => q > stores[g]);
        if (short.length) { problems.push(`Nikandros: the stores do not hold ${short.map(([g, q]) => `${q} ${nameOf(g).toLowerCase()}`).join(", ")}.`); return; }
      }
      if (o.id === "raise_taxes") { if (tax === "high") { problems.push("Taxes are already high."); return; } tax = TAX_STEPS[TAX_STEPS.indexOf(tax) + 1]; }
      if (o.id === "lower_taxes") { if (tax === "low") { problems.push("Taxes are already low."); return; } tax = TAX_STEPS[TAX_STEPS.indexOf(tax) - 1]; }
      const lacking = Object.entries(mats).filter(([g, q]) => q > stores[g]);
      if (c > treasury || lacking.length) {
        const need = [c > treasury ? `${intc(c)} denarii` : ""].concat(lacking.map(([g, q]) => `${q} ${nameOf(g).toLowerCase()} (have ${Math.trunc(stores[g])})`)).filter(Boolean);
        problems.push(`Felix shakes his head: not enough for '${describe(s, o)}': ${need.join(", ")}.`); return;
      }
      treasury -= c;
      for (const [g, q] of Object.entries(mats)) stores[g] -= q;
      if (o.id === "send_convoy") for (const [g, q] of Object.entries(o.sell || {})) stores[g] -= q;
      if (o.id === "build") { newPlots[BLD[o.building].zone] += 1; newKinds[o.building] = (newKinds[o.building] || 0) + 1; }
      if (["build_ship", "build_warship"].includes(o.id)) newShips += 1;
      if (o.id === "send_convoy") convoys += 1;
      if (o.id === "clear_land") clears += 1;
      if (o.id === "recruit") army += 50;
      if (o.id === "dismiss") army -= 50;
      accepted.push(o); seen.add(o.id);
    });
    return [accepted, problems];
  }
  /** What a set of orders costs and changes, for the order book. */
  function totals(s, orders) {
    let treasury = 0, loyalty = 0, favour = 0;
    const mats = {}, extra = [];
    for (const o of orders) {
      const [c, m] = costOf(s, o);
      treasury += c;
      for (const [g, q] of Object.entries(m)) mats[g] = (mats[g] || 0) + q;
      const eff = effectsOf(DECREE[o.id]);
      loyalty += eff.loyalty || 0; favour += eff.favour || 0;
      if (o.id === "send_convoy" && o.town) { const v = sellValue(s, o); if (v) extra.push(`${TOWN[o.town].name} pays about ${intc(v)} on return`); }
    }
    return { treasury, mats, loyalty, favour, extra };
  }

  // --- Plans: each advisor's proposal, and the scribe's bold and prudent ones ---
  function fit(s, wishes) {
    const chosen = [];
    for (const o of wishes) {
      if (!o || chosen.length >= MAX_ORDERS) continue;
      const [ok] = validate(s, chosen.concat([o]).map((x) => ({ ...x })));
      if (ok.length === chosen.length + 1) chosen.push(o);
    }
    return chosen;
  }
  const b = (kind) => order("build", { building: kind });
  /** A convoy selling surplus goods to the town that pays best for the first of them. */
  function sellConvoy(s, goods, keep = {}) {
    const stock = goods.map((g) => [g, Math.max(0, Math.trunc(s[g] - (keep[g] || 0)))]).filter(([, q]) => q > 0);
    if (!stock.length || seasonOf(s.turn)[0].sailing === "no" || s.wind === "CALM") return null;
    let best = null;
    for (const t of TOWNS) {
      const o = { id: "send_convoy", town: t.id, sell: {}, buy: {}, building: "none" };
      let room = SHIP_LOAD;
      for (const [g, q] of stock) if (g in t.buysFrom && room > 0) { o.sell[g] = Math.min(q, room); room -= o.sell[g]; }
      const v = sellValue(s, o);
      if (v && (!best || v > best.v)) best = { o, v };
    }
    return best && best.o;
  }
  function grainConvoy(s, months) {
    if (seasonOf(s.turn)[0].sailing === "no" || s.wind === "CALM") return null;
    let best = null;
    for (const t of TOWNS) {
      const p = priceAt(s, t.id, "grain", "buy");
      if (p && (!best || p < best.p)) best = { t, p };
    }
    if (!best) return null;
    const m = Math.max(1, Math.min(months, Math.floor(SHIP_LOAD / GRAIN_LOAD), Math.floor((s.treasury * 0.5) / best.p)));
    return { id: "send_convoy", town: best.t.id, sell: {}, buy: { grain: m }, building: "none" };
  }
  /** A convoy buying materials where they cost least in all; wants = {good: amount}. */
  function buyConvoy(s, wants) {
    if (seasonOf(s.turn)[0].sailing === "no" || s.wind === "CALM") return null;
    let best = null;
    for (const t of TOWNS) {
      const o = { id: "send_convoy", town: t.id, sell: {}, buy: {}, building: "none" };
      for (const [g, q] of Object.entries(wants)) if (q > 0 && g in t.sellsTo) o.buy[g] = q;
      const got = Object.values(o.buy).reduce((a, q) => a + q, 0);
      if (!got || loads(o) > SHIP_LOAD) continue;
      const cost = buyCost(s, o);
      if (cost > s.treasury * 0.6) continue;
      if (!best || got > best.got || (got === best.got && cost < best.cost)) best = { o, got, cost };
    }
    return best && best.o;
  }
  /** Buy from the passing merchants: wants = {good: amount}, cut to 20 loads and to half the chest. */
  function merchantOrder(s, wants) {
    if (seasonOf(s.turn)[0].sailing === "no") return null;
    const o = order("merchants", { buy: {} });
    let room = MERCHANT_LOAD, money = s.treasury * 0.5;
    for (const [g, want] of Object.entries(wants)) {
      const per = g === "grain" ? GRAIN_LOAD : 1;
      const q = Math.min(Math.trunc(want), Math.floor(room / per), Math.floor(money / merchantPrice(g)));
      if (q > 0) { o.buy[g] = q; room -= q * per; money -= q * merchantPrice(g); }
    }
    return Object.keys(o.buy).length ? o : null;
  }
  const fieldsFull = (s) => plotsUsed(s, "field") >= fieldPlots(s);
  function plans(s) {
    const crowded = s.people > housing(s) * 0.95;
    const out = [];
    out.push({ who: "treasurer", title: "Fill the chest", orders: fit(s, [
      s.tax !== "high" && s.loyalty >= 68 ? order("raise_taxes") : null, order("hear_petitions"),
      sellConvoy(s, ["wine", "oil", "fish", "cloth"], { wine: FESTIVAL_WINE_KEEP }), b("market")]) });
    out.push({ who: "economist", title: "Feed the town and trade", orders: fit(s, [
      s.grain < 3 ? merchantOrder(s, { grain: 2 }) : null, s.grain < 6 ? grainConvoy(s, s.grain < 3 ? 4 : 2) : null, fieldsFull(s) ? order("clear_land") : null, b("wheat"), b("fishery"), s.fleece >= 6 ? b("weavers") : null,
      b("vineyard"), b("olives"), b("saltpans"), crowded ? b("houses") : null]) });
    out.push({ who: "general", title: "Order and arms", orders: fit(s, [
      s.iron < 5 ? merchantOrder(s, { iron: 10 - Math.trunc(s.iron) }) : null, s.iron < 10 || s.cloth < 5 ? buyConvoy(s, { iron: Math.max(0, 15 - Math.trunc(s.iron)), cloth: s.cloth < 5 ? 8 : 0 }) : null,
      s.army < 250 ? order("recruit") : null, order("hang_brigands"), b("barracks"), s.iron < 8 ? b("mine") : null, b("woodcutters")]) });
    out.push({ who: "fleet", title: "Ships and the sea", orders: fit(s, [
      order("build_ship"), sellConvoy(s, ["fish", "wine", "oil", "timber", "fleece"], { wine: FESTIVAL_WINE_KEEP, timber: 20 }),
      Math.trunc(s.ships) >= berths(s) ? b("harbour") : null, b("saltpans")]) });
    const wantTemple = !s.buildings.some((x) => x.kind === "temple");
    out.push({ who: "priest", title: "The gods and Rome", orders: fit(s, [
      wantTemple && (s.marble < 20 || s.bronze < 4) ? buyConvoy(s, { marble: Math.max(0, 20 - Math.trunc(s.marble)), bronze: Math.max(0, 4 - Math.trunc(s.bronze)) }) : null,
      wantTemple && s.marble < 20 ? merchantOrder(s, { marble: 20 - Math.trunc(s.marble), bronze: Math.max(0, 4 - Math.trunc(s.bronze)) }) : null,
      order("visit_temple"), order("honour_tiberius"), s.loyalty < 58 ? order("hold_festival") : null,
      s.favour < 45 ? order("honour_rome") : null, b("temple"), order("listen_sages")]) });
    out.push({ who: "bold", title: "The scribe's bold plan", orders: fit(s, [
      s.tax !== "high" && s.loyalty >= 68 ? order("raise_taxes") : null, sellConvoy(s, ["wine", "oil", "fish", "cloth", "fleece"]),
      order("build_ship"), b("vineyard"), b("olives"), b("market"), order("recruit"), b("mine"), order("hang_brigands")]) });
    out.push({ who: "prudent", title: "The scribe's prudent plan", orders: fit(s, [
      s.grain < 3 ? merchantOrder(s, { grain: 2 }) : null, s.grain < 4.5 ? grainConvoy(s, 3) : null, s.grain < 6 ? b("fishery") : null, crowded ? b("houses") : null,
      s.loyalty < 55 ? (s.last_festival !== s.turn - 1 ? order("hold_festival") : order("lower_taxes")) : order("hear_petitions"),
      order("visit_temple"), order("honour_tiberius"), order("listen_sages"), b("wheat")]) });
    return out.filter((p) => p.orders.length);
  }
  function situation(s) {
    const [season] = seasonOf(s.turn);
    const due = TRIBUTE + s.tribute_debt;
    if (s.grain < 2) return `Governor, the granaries hold barely ${s.grain.toFixed(1)} months of grain. The people fear hunger.`;
    if (season.tribute_due === "yes" && s.treasury < due) return `Governor, Rome expects ${intc(due)} denarii this season and the chest holds ${intc(s.treasury)}.`;
    if (s.loyalty < 35) return "Governor, the townspeople mutter against you in the forum.";
    if (s.favour < 35) return "Governor, letters from Rome grow colder with every ship.";
    if (s.grain < 4.5) return `Governor, our grain will last ${s.grain.toFixed(1)} months; the fields alone will not carry us.`;
    return "Governor, the town is quiet and the accounts are in order.";
  }

  // --- Gambles (rules v4): a risky proposal is decided by a d20 + the advisor's talent ---
  const GAMBLE_TEXT = {
    build: ["built in half the time", "half again the price, and a season late"],
    send_convoy: ["+30% on what she sells", "a storm on the way out: half the cargo lost"],
    recruit: ["75 men instead of 50", "half the recruits run off; loyalty −2"],
    hang_brigands: ["the town cheers: loyalty +3", "a riot at the gallows: loyalty −4"],
    raise_taxes: ["the people pay without a murmur", "they pay, and curse you: loyalty −6 more"],
    build_ship: ["ready next season", "the keel cracks: 150 denarii more"],
    build_warship: ["launched a season early", "the ram is cast badly: a season late"],
    hold_festival: ["the best games in memory: twice the effect", "rain and a brawl: no effect"],
    visit_temple: ["a perfect sacrifice: twice the effect", "the liver is malformed: no effect"],
    honour_tiberius: ["the Emperor hears of it: twice the effect", "nobody in Rome notices"],
    honour_rome: ["the gifts are praised: twice the effect", "the gifts are thought mean: no effect"],
    merchants: ["the merchants throw in a fifth more", "they cheat on the measure: a fifth less"],
    clear_land: ["cleared in one season", "rocks everywhere: a season more"],
  };
  const DEFAULT_GAMBLE = ["fortune smiles: +150 denarii", "it goes badly: −150 denarii"];
  function gambleOf(s, who, o) {
    const a = ADVISORS[who] || {}, stat = GAMBLE_STAT[who] || "experience";
    const bonus = num(a[stat], 3) - 3 + (s.council[who] && s.council[who].mood >= 4 ? 1 : 0);
    const [win, lose] = GAMBLE_TEXT[o.id] || DEFAULT_GAMBLE;
    return { who, die: GAMBLE_DIE, bonus, target: GAMBLE_TARGET, stat, win, lose };
  }

  // --- The tribes beyond the fields (rules v4): diplomacy and gold, or sword and fire ---
  /** The dice for each way to a tribe's land, for the page to show before you choose. */
  function tribeOdds(s, id) {
    const t = TRIBE[id], st = tribeState(s, id);
    const talker = num(ADVISORS.economist.persuasion, 3) >= num(ADVISORS.priest.persuasion, 3) ? "economist" : "priest";
    const treat = Math.max(-6, Math.min(6, num(ADVISORS[talker].persuasion, 3) - 3 + st.tries - t.strength - (hostile(s, id) ? 3 : 0)));
    const march = Math.max(-6, Math.min(6, Math.floor(s.army / 50) + Math.trunc(stat(s, "battle_bonus")) + num(ADVISORS.general.strategy, 3) - 3 - t.strength));
    const chance = (bonus, target) => Math.max(5, Math.min(95, Math.round(100 * (21 - Math.max(2, Math.min(20, target - bonus))) / 20)));
    const [tc, tm] = costOf(s, order("treat_tribe", { tribe: id }));
    return { talker, treat: { bonus: treat, target: TREATY_TARGET, chance: chance(treat, TREATY_TARGET), cost: tc, mats: tm },
      march: { bonus: march, target: BATTLE_TARGET, chance: chance(march, BATTLE_TARGET), cost: num(DECREE.march_tribe.cost_treasury), army: MARCH_MIN_ARMY } };
  }
  async function treatTribe(s, o, notes) {
    const t = TRIBE[o.tribe], st = ((s.tribes = s.tribes || {})[t.id] = { ...tribeState(s, t.id) });
    const talker = num(ADVISORS.economist.persuasion, 3) >= num(ADVISORS.priest.persuasion, 3) ? "economist" : "priest";
    const bonus = Math.max(-6, Math.min(6, num(ADVISORS[talker].persuasion, 3) - 3 + st.tries - t.strength - (hostile(s, t.id) ? 3 : 0)));
    const r = o.preRoll || await roll(20, bonus, TREATY_TARGET, `${ADVISORS[talker].name} treats with the ${t.name}`);
    if (r.ok) {
      st.state = "ally"; st.hostile_until = 0;
      s.loyalty += 2;
      notes.push(`The chiefs of the ${t.name} accept the gifts and swear friendship: ${t.land} is open to us (${t.plots} new field plots).`);
    } else {
      st.tries += 1;
      notes.push(`The ${t.name} take the gifts and ask for more. Their chiefs will listen better next time (+1 on the die).`);
    }
  }
  async function marchTribe(s, o, notes) {
    const t = TRIBE[o.tribe], st = ((s.tribes = s.tribes || {})[t.id] = { ...tribeState(s, t.id) });
    const won = await battle(s, makeEnemy(s, "march", t.id), notes);
    st.hostile_until = s.turn + HOSTILE_SEASONS;
    if (won) {
      const loot = parseList(t.loot);
      st.state = "conquered";
      s.treasury += num(t.loot_treasury); for (const [g, q] of Object.entries(loot)) s[g] += q;
      notes.push(`${t.land} is ours (${t.plots} new field plots), with ${intc(num(t.loot_treasury))} denarii and ${listText(loot)} in loot. The ${t.name} will raid us for years.`);
    } else notes.push(`The ${t.name} are now hostile.`);
  }


  // --- Battles (rules v6): once a year a conflict; you send your commander or lead yourself ---
  const UNIT = 50, ORDER_MULT = 1.75, SLING_CLASH = 1, SLING_CUT = 0.15, SLING_CUT_MAX = 0.45, BATTLE_DC = 10, ROMAN_ORDER = 2, SELF_LEAD = 3, GROWTH_OF_RAIDERS = 0.06, GLORY = [3, 2], WALLS_ALONE = 1, HOME_GROUND = 1, FARMERS_ALONE = -1;
  const LANES = ["left", "centre", "right"];
  const ENEMIES = {
    pirates: { name: "Pirates", who: "fleet", fury: 1, home: true, terrain: "shore", where: "at the mouth of the river, below the Sea Gate",
      say: "Liburnian sails in the gulf: they beach their ships at dawn and come up the shingle with axes." },
    brigands: { name: "Brigands", who: "general", fury: 1, home: true, terrain: "gorge", where: "in the gorge above the town",
      say: "Runaway slaves and hill men, led by a deserter: they hold the pass road and raid the terraces at night." },
    tribes: { name: "Warriors of the tribes", who: "general", fury: 2, home: true, terrain: "fields", where: "in the fields below the walls",
      say: "Men from beyond the mountains come down in a howling mass, shields painted, to burn the harvest." },
    march: { name: "Warriors of the tribes", who: "general", fury: 1, home: false, terrain: "valley", where: "in their own valley",
      say: "Their whole people stands across the valley, on ground they know." },
    rebels: { name: "The rebels of Acruvium", who: "general", fury: 2, home: false, terrain: "fields", where: "in the streets and the forum",
      say: "Thousands of townsmen with clubs, axes and stolen spears: your own people, and some of your militia with them." },
  };
  // rules v10: pirates and tribes either storm the town (the walls count) or raid the fields (no walls: meet them in the open, or shut the gates)
  const AT_TEXT = {
    pirates: { walls: ["at the Sea Gate", "Liburnian sails in the gulf: at night they run their ships against the quay and throw ladders up at the Sea Gate."],
      fields: ["on the shore farms by the river mouth", "Liburnian sails in the gulf: they beach their ships at dawn and fall on the farms and salt pans along the shore, far from the walls."] },
    tribes: { walls: ["under the walls of the town", "Men from beyond the mountains come down in a howling mass with ladders and fire, to storm the walls."],
      fields: ["in the fields below the walls", "Men from beyond the mountains come down in a howling mass, shields painted, to burn the harvest in the open fields."] },
  };
  const AT_NAME = { walls: "to storm the walls", fields: "to raid the fields" };
  // rules v9: how close the enemy stands. Stones from a sling fly far but wide: they do best against a dense crowd.
  // Arrows are fewer but aimed: the same against any enemy.
  const DENSITY = { tribes: 1, march: 1, rebels: 1, pirates: .5, brigands: .4 };
  const densityOf = (enemy) => Math.min(1, (DENSITY[enemy.kind] ?? .7) + (enemy.at === "walls" ? .3 : 0));   // an assault packs them at the gate
  const missileOf = (type, enemy) => { const d = densityOf(enemy);
    return type === "sling" ? .04 + .12 * d : type === "militia_sling" ? .03 + .08 * d : MISSILE[type] || 0; };
  const MISSILE_TYPES = ["sling", "archer", "militia_sling", "militia_archer"];
  const SHIELDS = ["cohort", "ally", "horse"];
  /** The year's conflict: at the first season of each year, decide whether and when it comes, and from where. */
  function planConflict(s) {
    const [season, year] = seasonOf(s.turn);
    if (season.season !== "Spring" || s.conflict_year === year) return;
    s.conflict_year = year;
    s.conflict = { turn: s.turn + rint(0, 2), ...rollConflict(s) };
  }
  /** Who comes this year, and whether they storm the town or raid the fields. */
  function rollConflict(s) {
    const w = { pirates: Math.max(1, 3 + (s.ships >= 3 ? 1 : 0) + (s.treasury > 8000 ? 2 : 0) - (s.warships || 0)), brigands: 2 + (s.loyalty < 45 ? 3 : 0) + (s.army < ORDER_ARMY ? 2 : 0) + (reputation(s).id === "weak" ? 3 : 0), tribes: 1 + (anyHostile(s) ? 5 : 0) };
    const kind = choices(Object.keys(w), Object.values(w));
    const at = kind === "pirates" ? (rint(1, 2) === 1 ? "walls" : "fields") : kind === "tribes" ? (rint(1, 5) <= 2 ? "walls" : "fields") : "fields";
    return { kind, at };
  }
  /** The enemy force: how many, and how they stand across the three lanes. */
  function makeEnemy(s, kind, tribe, at) {
    const E0 = ENEMIES[kind];
    at = at || (kind === "march" ? "valley" : kind === "rebels" ? "streets" : "fields");
    let men, share;
    if (kind === "pirates") { men = rint(110, 200) + Math.min(80, Math.floor(s.treasury / 250)); const wing = rint(0, 1) ? 0 : 2; share = [0, 0, 0]; share[wing] = .55; share[1] = .35; share[2 - wing] = .1; }
    else if (kind === "brigands") { men = rint(100, 170) + (s.loyalty < 40 ? 60 : 0); const a = rint(15, 35) / 100, c = rint(20, 40) / 100; share = rint(0, 1) ? [a, c, 1 - a - c] : [1 - a - c, c, a]; }
    else { const t = TRIBE[tribe] || TRIBES[rint(0, TRIBES.length - 1)]; tribe = t.id; men = rint(150, 260) + t.strength * 60 + (hostile(s, t.id) ? 60 : 0) + (kind === "march" ? 60 : 0); share = [.25, .5, .25]; }
    men = Math.round(men * (1 + GROWTH_OF_RAIDERS * (seasonOf(s.turn)[1] - 30)));   // word of a rich town spreads
    const navy = kind === "pirates" ? Math.min(TRIREMES_COUNT, s.warships || 0) : 0;
    if (navy) men = Math.round(men * (1 - TRIREME_CUT * navy));   // our triremes sink some of their boats before they land
    const name = kind === "tribes" || kind === "march" ? `${E0.name}: the ${TRIBE[tribe].name}` : E0.name;
    const [where, say] = (AT_TEXT[kind] && AT_TEXT[kind][at]) || [E0.where, E0.say];
    return { kind, tribe, name, men, share, fury: E0.fury, home: E0.home, terrain: E0.terrain, where, say: navy ? `${say} Our trireme${navy > 1 ? "s" : ""} caught them in the gulf and sank ${navy > 1 ? "several" : "some"} of their boats.` : say, who: E0.who, at, walled: at === "walls" && built(s, "walls"), navy };
  }
  // the mixed army (rules v7)
  const SLING_GROUP = 25, ARCHER_GROUP = 30, CAVALRY_MIN = 5, ENGINES_MAX = 4;
  const ARCHER_PAY = 2, CAVALRY_PAY = 10, ENGINE_UPKEEP = 10;
  const CUT = { sling: .12, archer: .08, pila: .05, engine: .10, wallArchers: .04, max: .6 };
  const GLADIUS_MULT = 2.1, MISSILE_CLASH = .6, CAVALRY_STRIKE = 2, GUARD_ESCAPE = .6, XP_MAX = 6;
  const HEAL_COST = 6, REPLACE_COST = 5;
  const troopsOf = (s) => ({ slingers: 0, archers: 0, cavalry: 0, engines: 0, ballistae: 0, ...(s.troops || {}) });
  const BALLISTA_MAX = 2, BALLISTA_UPKEEP = 15;
  const soldiersBesides = (s) => { const t = troopsOf(s); return t.slingers + t.archers + t.cavalry; };
  const unitsOf = (s) => Math.max(1, Math.floor(s.army / UNIT));
  const lower = (t) => String(t).replace(/^./, (m) => m.toLowerCase());   // "Warriors of the tribes: the Pirustae" keeps its capital
  const groups = (men, size) => (men >= size * .4 ? Math.max(1, Math.round(men / size)) : 0);
  // ---- Battles in rounds (rules v8). Every block stands somewhere on the field (x 0-900, y 250-450):
  // x decides the lane (left / centre / right); y the row: front (missiles), the line, the second line,
  // or, at home, the walls. Horsemen on a flank edge strike that lane; at the rear by the standard they guard you.
  const FIELD = { left: 300, right: 600, front: 300, line: 362, wallTop: 362, wallBottom: 388 };
  const MELEE_ROUNDS = 3, SIMS = 300, DISCIPLINE = 1, HIT_FOE = 20, HIT_US = 25;
  const MISSILE = { sling: .12, archer: .10, militia_sling: .08, militia_archer: .07, engine: .10, ballista: .15 };
  const CLASH = { cohort: 1.75, horse: 2.5, ally: 1.2, sling: .6, archer: .6, militia_sling: .45, militia_archer: .45 };
  const laneAt = (x) => (x < FIELD.left ? 0 : x < FIELD.right ? 1 : 2);
  function rowAt(u, enemy, s) {
    if (u.type === "horse") return u.x < 90 || u.x > 810 ? "flank" : u.y > 400 && Math.abs(u.x - 450) < 130 ? "guard" : u.y > 400 ? "pursue" : "line";
    if (enemy.walled && ["archer", "militia_archer", "sling", "militia_sling"].includes(u.type) && u.y >= FIELD.wallTop && u.y <= FIELD.wallBottom) return "walls";
    return u.y < FIELD.front ? "front" : u.y < FIELD.line ? "line" : "second";
  }
  /** The army as blocks to place: cohorts, slinger and archer groups, engines, ballistae, the horsemen, and this battle's militia and allies. */
  function forces(s) {
    const t = troopsOf(s), m = s.militia || {};
    return { cohorts: unitsOf(s), slingers: groups(t.slingers, SLING_GROUP), archers: groups(t.archers, ARCHER_GROUP), engines: t.engines, ballistae: t.ballistae, cavalry: t.cavalry >= CAVALRY_MIN ? t.cavalry : 0,
      perCohort: Math.max(0, s.army) / unitsOf(s), perSling: t.slingers / Math.max(1, groups(t.slingers, SLING_GROUP)), perArcher: t.archers / Math.max(1, groups(t.archers, ARCHER_GROUP)),
      militiaSling: m.slingers || 0, militiaArcher: m.archers || 0, allies: m.allies || [] };
  }
  const LANE_CX = [150, 450, 750];
  /** A sensible deployment: cohorts where the enemy is thickest (a second line with four or more), missiles in front of the biggest crowd,
      archers on the walls at home, engines behind the line, horsemen on the flank of the biggest crowd (or guarding the governor). */
  function defaultPlan(s, enemy, lead) {
    const f = forces(s), units = [], big = enemy.share.indexOf(Math.max(...enemy.share));
    let free = f.cohorts, second = null;
    if (f.cohorts >= 4) { second = big; free--; }
    const want = enemy.share.map((x) => x * free), give = want.map((x) => Math.floor(x));
    const left = free - give.reduce((a, b) => a + b, 0), order2 = want.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0]);
    for (let k = 0; k < left; k++) give[order2[k % 3][1]]++;
    let n = 0;
    give.forEach((g, i) => { for (let k = 0; k < g; k++) units.push({ id: "c" + n++, type: "cohort", x: LANE_CX[i] + (k - (g - 1) / 2) * 92, y: 330 }); });
    if (second !== null) units.push({ id: "c" + n++, type: "cohort", x: LANE_CX[second], y: 410 });
    const walls = enemy.walled;
    const spread = (n, k) => (k - (n - 1) / 2) * 92;   // side by side within a lane
    for (let k = 0; k < f.slingers; k++) units.push({ id: "s" + k, type: "sling", x: LANE_CX[big] + spread(f.slingers, k), y: 272 });
    const held = [0, 1, 2].filter((i) => give[i] || second === i), cover = (k) => (held.length ? held[k % held.length] : big);   // missiles only where a shield line stands
    for (let k = 0; k < f.archers; k++) units.push({ id: "a" + k, type: "archer", x: walls ? 120 + k * 230 : LANE_CX[cover(held.indexOf(big) + 1 + k)] + 40, y: walls ? 375 : 272 });
    for (let k = 0; k < f.engines; k++) units.push({ id: "e" + k, type: "engine", x: LANE_CX[big] + 120 + k * 46, y: 418 });
    for (let k = 0; k < f.ballistae; k++) units.push({ id: "b" + k, type: "ballista", x: LANE_CX[big] - 120 - k * 50, y: 418 });
    if (f.cavalry) units.push({ id: "h", type: "horse", x: lead === "self" ? 560 : big === 2 ? 860 : 40, y: lead === "self" ? 432 : 330 });
    if (f.militiaSling) units.push({ id: "ms", type: "militia_sling", x: LANE_CX[cover(held.indexOf(big) + 2)] - 40, y: 272 });
    if (f.militiaArcher) units.push({ id: "ma", type: "militia_archer", x: walls ? 720 : LANE_CX[cover(held.indexOf(big) + 3)] + 40, y: walls ? 375 : 272 });
    f.allies.forEach((a, k) => units.push({ id: "al" + k, type: "ally", x: LANE_CX[(big + 1 + k) % 3] + 60, y: 410, name: a.name, men: a.men }));
    return { units };
  }
  // a small deterministic random source, so the odds shown stay still while you drag
  const seeded = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  /** The lanes as they stand before the first stone flies: strength, enemy after missiles, morale, bonuses. */
  function setup(s, enemy, plan, lead) {
    const f = forces(s), kit = s.kit || {};
    const common = [["the discipline of Rome", DISCIPLINE]];
    if (enemy.walled) { const hd = Math.trunc(stat(s, "home_defence")); if (hd) common.push([built(s, "arx") ? "the walls and the citadel" : "the walls", hd]); }
    if (enemy.foretold) common.push(["forewarned by the haruspex", 1]);
    if (enemy.navy) common.push([`our trireme${enemy.navy > 1 ? "s" : ""} in the bay`, enemy.navy]);
    if (enemy.home && !enemy.walled) common.push(["our own ground: every terrace and path", HOME_GROUND]);
    const bb = Math.trunc(stat(s, "battle_bonus")); if (bb) common.push(["drilled in the barracks", bb]);
    const xp = Math.min(3, Math.floor((s.army_xp || 0) / 2)); if (xp) common.push(["veterans of past battles", xp]);
    if (s.morale) common.push([s.morale > 0 ? "high spirits" : "low spirits after defeat", s.morale]);
    const siege = plan.units.filter((u) => u.type === "ballista").length * 2 + (plan.units.some((u) => u.type === "engine") ? 1 : 0);
    if (!enemy.home && siege) common.push(["the engines batter their stockade", Math.min(3, siege)]);
    if (lead === "self") common.push(["the governor at their head", SELF_LEAD]);
    else if (ADVISORS[lead]) { const st = lead === "fleet" ? "experience" : "strategy"; common.push([`${ADVISORS[lead].name.split(" ")[0]}'s ${st}`, num(ADVISORS[lead][st], 3) - 3]); }
    const menOf = (u) => u.type === "cohort" ? f.perCohort : u.type === "sling" ? f.perSling : u.type === "archer" ? f.perArcher : u.type === "horse" ? f.cavalry
      : u.type === "militia_sling" ? f.militiaSling : u.type === "militia_archer" ? f.militiaArcher : u.type === "ally" ? (u.men || 0) : 0;
    const placed = plan.units.map((u) => ({ ...u, lane: laneAt(u.x), row: rowAt(u, enemy, s), men: menOf(u) }));
    const wallsMissile = placed.filter((u) => u.row === "walls").reduce((a, u) => a + (MISSILE[u.type] || 0) / 2, 0);
    const horse = placed.find((u) => u.type === "horse");
    const strikeLane = horse && horse.row === "flank" ? (horse.x < 90 ? 0 : 2) : -1;
    const lanes = [0, 1, 2].map((i) => {
      const here = placed.filter((u) => u.lane === i);
      const front = here.filter((u) => u.row === "front" || u.row === "line"), second = here.filter((u) => u.row === "second" && CLASH[u.type]);
      // the stages before the clash: far (sling stones, ballistae), near (slings again, arrows, scorpions), then the javelins
      const stage = { far: 0, near: wallsMissile, pila: 0 };
      for (const u of here) {
        if (u.row === "walls") continue;
        const m = MISSILE[u.type] ? missileOf(u.type, enemy) : 0;
        if (u.type === "sling" || u.type === "militia_sling") { stage.far += m / 2; stage.near += m / 2; }
        else if (u.type === "ballista") stage.far += m; else if (m) stage.near += m;
        if (u.type === "cohort" && u.row === "line" && kit.pila) stage.pila += CUT.pila;
      }
      const cut = Math.min(CUT.max, stage.far + stage.near + stage.pila);
      const shielded = here.some((u) => SHIELDS.includes(u.type) && u.row !== "pursue" && u.row !== "guard");
      const exposed = !shielded && here.some((u) => MISSILE_TYPES.includes(u.type) && u.row !== "walls");
      const foe0 = Math.round(enemy.men * enemy.share[i]), foe = Math.round(foe0 * (1 - cut) * (enemy.quality || 1));
      const mult = (u) => u.type === "cohort" ? (kit.gladius ? GLADIUS_MULT : CLASH.cohort) : CLASH[u.type] || 0;
      const ours = Math.round(front.reduce((a, u) => a + u.men * mult(u), 0)), reserve = Math.round(second.reduce((a, u) => a + u.men * mult(u), 0));
      const men = Math.round(front.reduce((a, u) => a + u.men, 0));
      const parts = foe < 5 ? [] : ours ? [[ours / foe >= 1 ? `${Math.round(ours / foe * 10) / 10} to 1 in our favour` : `${Math.round(foe / ours * 10) / 10} to 1 against us`, Math.max(-6, Math.min(6, Math.round(4 * Math.log2(ours / foe))))]].concat(common)
        : enemy.walled && Math.trunc(stat(s, "home_defence")) ? [[built(s, "arx") ? "only the walls and the citadel" : "only the walls and the townsmen", Math.trunc(stat(s, "home_defence")) + WALLS_ALONE]]
        : enemy.home ? [["only the farmers with their pitchforks", FARMERS_ALONE]] : [["nobody holds this flank", -99]];
      if (foe >= 5 && enemy.fury) parts.push(["their first wild charge (first round)", -enemy.fury]);
      if (strikeLane === i && foe >= 5) parts.push(["our horsemen strike their flank (first round)", CAVALRY_STRIKE]);
      if (exposed && foe >= 5) parts.push(["slingers and archers with no shield line to hide behind", -2]);
      return { lane: LANES[i], i, foe0, foe, cut: Math.round(cut * 100), stage: Object.fromEntries(Object.entries(stage).map(([k, v]) => [k, Math.round(Math.min(CUT.max, v) * 100)])), exposed: exposed && foe >= 5, ours, reserve, men, parts, walls: !ours && foe >= 5 && ((enemy.walled && Math.trunc(stat(s, "home_defence")) > 0) || (enemy.home && !enemy.walled)),
        empty: foe < 5, units: here.map((u) => u.type) };
    });
    return { lanes, horse: horse ? horse.row : null, placed, f };
  }
  /** One battle, round by round. rnd is the random source; returns the lanes' fates and a record of every roll. */
  function fight(s, enemy, st, rnd) {
    const d20 = () => 1 + Math.floor(rnd() * 20);
    const L = st.lanes.map((l) => ({ ...l, ourMor: 100 + (s.morale || 0) * 10, foeMor: 100 + enemy.fury * 10 - l.cut * .8, now: l.ours, foeNow: l.foe, res: l.reserve, fate: l.empty ? "won" : null, lost: 0 }));
    const rounds = [];
    if (enemy.fury) L.forEach((l) => { if (!l.fate) l.ourMor -= enemy.fury * 8; });
    for (let r = 1; r <= MELEE_ROUNDS; r++) {
      const rec = [];
      L.forEach((l, i) => {
        if (l.fate) { rec.push(null); return; }
        let bonus = l.parts.filter(([t]) => !/first round/.test(t) || r === 1).reduce((a, [, v]) => a + v, 0);
        if (!l.walls && l.now > 0) bonus = bonus - l.parts[0][1] + Math.max(-6, Math.min(6, Math.round(4 * Math.log2(Math.max(1, l.now) / Math.max(1, l.foeNow)))));
        if (L.some((x, j) => Math.abs(j - i) === 1 && x.fate === "won" && !x.empty)) bonus += 2;   // their neighbours have fled: we take them in the flank
        bonus = Math.max(-BONUS_CAP - 2, Math.min(BONUS_CAP + 2, bonus));
        const roll = d20(), total = roll + bonus, ok = bonus > -50 && (roll === 20 || (roll !== 1 && total >= BATTLE_DC)), margin = Math.min(8, Math.abs(total - BATTLE_DC));
        if (ok) { l.foeNow *= 1 - Math.min(.32, .12 + .02 * margin); l.foeMor -= Math.min(50, HIT_FOE + 3 * margin) + (roll === 20 ? 20 : 0); const lossNow = l.now * .03; l.now -= lossNow; l.lost += lossNow; }
        else { const lossNow = l.now * Math.min(.26, .08 + .02 * margin); l.now -= lossNow; l.lost += lossNow; l.ourMor -= Math.min(55, HIT_US + 3 * margin) + (roll === 1 ? 20 : 0); l.foeNow *= .97; }
        if (l.ourMor < 50 && l.res > 0) { l.now += l.res; l.ourMor += 30; l.res = 0; l.relieved = r; }
        if (l.foeMor <= 0 || l.foeNow < 5) l.fate = "won"; else if (l.ourMor <= 0) l.fate = "lost";
        rec.push({ roll, bonus, total, ok, ourMor: Math.max(0, Math.round(l.ourMor)), foeMor: Math.max(0, Math.round(l.foeMor)), relieved: l.relieved === r, fate: l.fate });
      });
      rounds.push(rec);
      const won = L.filter((l) => l.fate === "won").length, lost = L.filter((l) => l.fate === "lost").length;
      if (won >= 2 || lost >= 2) break;
    }
    L.forEach((l) => { if (!l.fate) l.fate = l.ourMor >= l.foeMor ? "won" : "lost"; });
    return { won: L.filter((l) => l.fate === "won").length >= 2, lanes: L, rounds };
  }
  /** The odds of a deployment: the battle fought SIMS times in the mind's eye. */
  function battleOdds(s, enemy, plan, lead) {
    const st = setup(s, enemy, plan, lead), rnd = seeded(7919);
    let wins = 0; const laneWins = [0, 0, 0];
    for (let k = 0; k < SIMS; k++) { const r = fight(s, enemy, st, rnd); if (r.won) wins++; r.lanes.forEach((l, i) => { if (l.fate === "won") laneWins[i]++; }); }
    const lanes = st.lanes.map((l, i) => ({ ...l, chance: Math.round(100 * laneWins[i] / SIMS), bonus: l.parts.reduce((a, [, v]) => a + v, 0) }));
    return { lanes, chance: Math.round(100 * wins / SIMS), forces: st.f, horse: st.horse, placed: st.placed, per: Math.round(st.f.perCohort) };
  }
  /** Send riders to the villages: slingers and bowmen of the gulf and the hills may come in time. */
  function muster(s) {
    if (s.militia && s.militia.called) return { already: true };
    const cost = 80, bonus = Math.floor(s.loyalty / 20), r = rint(1, 20), came = r === 20 || (r !== 1 && r + bonus >= 8);
    s.treasury -= cost; s.loyalty -= 1;
    s.militia = { ...(s.militia || {}), called: true, slingers: came ? rint(20, 40) : 0, archers: came ? rint(15, 30) : 0 };
    return { r, bonus, came, cost, slingers: s.militia.slingers, archers: s.militia.archers };
  }
  /** Allied tribes send warriors when we are attacked. */
  function alliesFor(s) {
    return TRIBES.filter((t) => tribeState(s, t.id).state === "ally").map((t) => ({ name: t.name, men: rint(30, 60) }));
  }
  /** Fight the battle. Returns true for a victory. A governor who leads and loses falls or is taken, unless his horsemen carry him off. */
  async function battle(s, enemy, notes) {
    s.army = Math.max(0, Math.trunc(s.army));   // card effects this season may have taken it below zero before the clamp
    s.troops = Object.fromEntries(Object.entries(troopsOf(s)).map(([k, v]) => [k, Math.max(0, v)]));
    s.militia = { allies: enemy.home ? alliesFor(s) : [] };
    const lead = await ui.battleCall(enemy, battleOdds(s, enemy, defaultPlan(s, enemy, enemy.who), enemy.who).chance);   // "self", the advisor's id, or "gates"
    if (lead === "gates" && canShut(enemy)) return shutGates(s, enemy, notes);
    const plan = lead === "self" ? await ui.battlePlan(enemy, defaultPlan(s, enemy, "self"), (pl) => battleOdds(s, enemy, pl, "self")) : defaultPlan(s, enemy, lead);
    const st = setup(s, enemy, plan, lead), result = fight(s, enemy, st, Math.random);
    const won = result.won;
    await ui.battleDice(enemy, st, result, won, lead);
    // the cost in men, lane by lane: the line loses what the rounds took; missile troops a little; the horse on a defeat
    const f = st.f, t = (s.troops = { ...troopsOf(s) });
    let deadInf = 0, deadSling = 0, deadArch = 0, deadCav = 0, deadMil = 0;
    const overrun = [];
    result.lanes.forEach((l, i) => {
      if (l.empty || !l.ours) return;
      const frac = Math.min(.6, (l.lost / Math.max(1, l.ours + (l.relieved ? l.reserve : 0))) * (l.fate === "lost" ? 1.4 : 1));
      st.placed.filter((u) => u.lane === i && (u.row === "line" || u.row === "front" || (u.row === "second" && l.relieved))).forEach((u) => {
        // missile troops with no shield line in their lane are caught when the enemy closes (rules v9)
        const f2 = l.exposed && MISSILE_TYPES.includes(u.type) ? Math.max(frac, l.fate === "lost" ? EXPOSED_LOST : EXPOSED_WON) : frac * (u.type === "cohort" ? 1 : .6);
        const d = Math.round(u.men * f2);
        if (l.exposed && MISSILE_TYPES.includes(u.type) && d) overrun.push(LANES[i]);
        if (u.type === "cohort") deadInf += d; else if (u.type === "sling") deadSling += d; else if (u.type === "archer") deadArch += d; else if (u.type === "horse") deadCav += d;
        else if (u.type === "militia_sling" || u.type === "militia_archer") deadMil += d;
      });
    });
    if (deadMil) { s.people = Math.max(0, s.people - deadMil); notes.push(`${deadMil} men of the village militia fell: fathers and sons, missed in the fields and on the boats.`); }
    if (overrun.length) notes.push(`On the ${[...new Set(overrun)].join(" and ")}, our slingers and archers had no shields in front of them: when the enemy closed they were cut down.`);
    if (!won && f.cavalry && st.horse !== "flank") deadCav += rint(1, Math.max(1, Math.round(f.cavalry / 4)));
    deadInf = Math.min(Math.trunc(s.army), deadInf); deadSling = Math.min(t.slingers, deadSling); deadArch = Math.min(t.archers, deadArch); deadCav = Math.min(t.cavalry, deadCav);
    s.army -= deadInf; t.slingers -= deadSling; t.archers -= deadArch; t.cavalry -= deadCav;
    const dead = deadInf + deadSling + deadArch + deadCav;
    s.calamity_turn = s.turn; s.last_war = s.turn;
    const leader = lead === "self" ? "you led them yourself" : `${ADVISORS[lead].name} led them`;
    const helpers = [(s.militia.slingers || s.militia.archers) ? "the village militia" : "", ...(s.militia.allies || []).map((a) => `warriors of the ${a.name}`)].filter(Boolean);
    if (won) {
      let loot = enemy.kind === "pirates" ? rint(300, 800) : enemy.kind === "brigands" ? rint(150, 400) : 0;
      if (st.horse === "pursue") loot = Math.round(loot * 1.5);
      s.treasury += loot; s.favour += 4; s.loyalty += 3;
      s.army_xp = Math.min(XP_MAX, (s.army_xp || 0) + 1); s.morale = Math.min(2, (s.morale || 0) + 1);
      if (lead === "self") { s.favour += GLORY[0]; s.loyalty += GLORY[1]; notes.push("The town cheers the governor who fought in the front rank; the story reaches Rome."); }
      else cheer(s, lead, notes, "returns in triumph");
      spoils(s, enemy, st, notes);
      notes.push(`Victory ${enemy.where} against ${lower(enemy.name)} (${enemy.men} men) after ${result.rounds.length} round${result.rounds.length > 1 ? "s" : ""}: ${leader}${helpers.length ? `, with ${helpers.join(" and ")}` : ""}; ${dead} of ours fell.${loot ? ` Their plunder brings ${intc(loot)} denarii${st.horse === "pursue" ? ", the horsemen running down the stragglers" : ""}.` : ""} The army gains experience (${s.army_xp}/${XP_MAX}).`);
    } else {
      s.favour -= 4; s.loyalty -= 5;
      s.army_xp = Math.max(0, (s.army_xp || 0) - 1); s.morale = -2;
      for (const aid of Object.keys(s.council)) s.council[aid].mood = Math.max(0, s.council[aid].mood - 1);   // the governor's authority suffers
      if (lead === "self") {
        if (st.horse === "guard" && Math.random() < GUARD_ESCAPE) { s.favour -= 6; s.loyalty -= 4; notes.push("Your horsemen close round you and cut a way out: you live, but the town has seen its governor flee the field."); }
        else s.over = rint(1, 2) === 1 ? `You fell ${enemy.where}, sword in hand, against ${lower(enemy.name)}. Rome sends a new governor.` : `Taken prisoner ${enemy.where} by ${lower(enemy.name)}. Your governorship ends in chains.`;
      } else { s.council[lead].mood = Math.max(0, s.council[lead].mood - 1); notes.push(`${ADVISORS[lead].name} comes back wounded and ashamed (mood ${s.council[lead].mood}/${MOOD_MAX}).`); }
      let take = 0;
      if (enemy.at === "walls") { take = Math.round(s.treasury * .25); notes.push("They break into the town."); damage(s, { damage: 1 }, notes); }
      else if (enemy.home) { take = Math.round(s.treasury * .1); burnFields(s, 1, notes); s.grain = Math.max(0, s.grain - 1); }
      s.treasury -= take;
      notes.push(`Defeat ${enemy.where} against ${lower(enemy.name)} (${enemy.men} men): ${leader}; ${dead} of ours fell${take ? `, and ${intc(take)} denarii were carried off` : ""}. Morale is low; the council doubts you.`);
    }
    if (!s.over && dead) {
      const wounded = Math.round(dead * 1.5), cost = wounded * HEAL_COST;
      if (s.treasury >= cost) { s.treasury -= cost; notes.push(`${wounded} wounded are cared for by the surgeons: ${intc(cost)} denarii.`); }
      else { const paid = Math.max(0, Math.floor(s.treasury / HEAL_COST)), lostW = Math.round((wounded - paid) / 3); s.treasury -= paid * HEAL_COST; s.army = Math.max(0, s.army - lostW); notes.push(`The chest cannot pay the surgeons for all ${wounded} wounded: ${lostW} more die.`); }
      if (deadInf >= 10) {
        const n = deadInf, cost2 = n * REPLACE_COST + (s.kit && s.kit.pila ? n : 0), iron = Math.ceil(n / 10), cloth = Math.ceil(n / 10);
        const can = s.treasury >= cost2 && s.iron >= iron && s.cloth >= cloth && s.people > n + 500;
        if (can && await ui.choose(`Replace the ${n} fallen?`, `Recruits from the town: ${intc(cost2)} denarii, ${iron} iron and ${cloth} cloth for their kit; ${n} fewer townsmen.`, [{ label: "Fill the ranks", sub: `${intc(cost2)} denarii, ${iron} iron, ${cloth} cloth` }, { label: "Leave the ranks thin", sub: `the garrison stays at ${Math.trunc(s.army)}` }], "general") === 0) {
          s.treasury -= cost2; s.iron -= iron; s.cloth -= cloth; s.people -= n; s.army += n; s.loyalty -= 1;
          notes.push(`${n} recruits fill the gaps in the ranks.`);
        }
      }
    }
    if (helpers.length) notes.push(`${helpers.join(" and ").replace(/^./, (m) => m.toUpperCase())} go home.`);
    if (won && !s.over) await judgement(s, enemy, notes);
    s.last_battle = { turn: s.turn, enemy, plan, odds: null, won, lead, rounds: result.rounds.length, fates: result.lanes.map((l) => l.fate) };
    s.militia = null;
    return won;
  }
  /** Burn n field buildings: two seasons to restore. */
  function burnFields(s, n, notes) {
    const fb = s.buildings.filter((bb) => BLD[bb.kind].zone === "field" && isDone(s, bb)), names = [];
    for (let k = 0; k < n && fb.length; k++) { const bb = fb.splice(rint(0, fb.length - 1), 1)[0]; bb.done = s.turn + 2; names.push(BLD[bb.kind].name.toLowerCase()); }
    if (names.length) notes.push(`They burn the ${names.join(" and the ")} (two seasons to restore).`);
  }
  // rules v10: raiders in the open fields may be left to burn them, behind shut gates
  const canShut = (enemy) => enemy.home && enemy.at === "fields";
  const SHUT = { grain: 1, loyalty: -4, favour: -2, burn: 1 };
  function shutGates(s, enemy, notes) {
    const grain = Math.min(s.grain, SHUT.grain);
    s.grain -= grain; s.loyalty += SHUT.loyalty; s.favour += SHUT.favour; s.calamity_turn = s.turn; s.militia = null;
    notes.push(`You shut the gates and leave the fields to ${lower(enemy.name)}. Nobody of ours falls, but they carry off ${grain.toFixed(1)} months of grain.`);
    burnFields(s, SHUT.burn, notes);
    notes.push(`The farmers outside the walls curse you (loyalty ${SHUT.loyalty}), and Rome hears that the governor hid behind his walls (favour ${SHUT.favour}).`);
    s.last_battle = null;
    return false;
  }
  // --- Spoils, judgement and loyalty (rules v9-v10) ---
  const EXPOSED_WON = .45, EXPOSED_LOST = .8, PRIZE_DC = 12, PRIZE_SALE = 500, GROVE_DC = 13;
  /** What a victory brings besides the plunder: a pirate ship taken, or the tribes' vines and olives on the border. */
  function spoils(s, enemy, st, notes) {
    const r = rint(1, 20) + (st.horse === "pursue" ? 4 : 0);
    if (enemy.kind === "pirates" && r >= PRIZE_DC - (enemy.at === "walls" ? 2 : 0) - 2 * (enemy.navy || 0)) {   // at the quay their ships are easier to take
      if (berthsUsed(s) < berths(s)) {
        fleetNames(s); s.ships += 1; const name = newShipName(s); s.fleet.push(name);
        notes.push(`A pirate liburna is taken on the beach: renamed the ${name}, she joins your ships (${Math.trunc(s.ships)} now).`);
        news(s, "ship", `Prize taken: the pirate liburna becomes the ${name}.`);
      } else { s.treasury += PRIZE_SALE; notes.push(`A pirate liburna is taken; no berth is free, so she is sold at the quay for ${intc(PRIZE_SALE)} denarii.`); }
    }
    if (enemy.kind === "tribes" && r >= GROVE_DC) {
      const kind = rint(0, 1) ? "vineyard" : "olives", B = BLD[kind];
      s.field_plots = clearedPlots(s) + 1;
      s.buildings.push({ kind, done: s.turn - num(B.matures) - num(B.ramp) });
      notes.push(`The beaten warriors flee beyond the ridge and leave their ${B.name.toLowerCase()} on the border slope: a new field plot, already bearing, is ours (${fieldPlots(s)} plots).`);
      news(s, "land", `Land won: the tribes' ${B.name.toLowerCase()} on the border is now yours.`);
    }
  }
  const news = (s, kind, text) => { (s.news = s.news || []).push({ kind, text, turn: s.turn }); };
  /** The governor's name for justice: pardoned against executed. One pardon in three or four is wise. */
  function reputation(s) {
    const J = s.justice || { pardoned: 0, executed: 0 }, n = J.pardoned + J.executed, ratio = n ? J.pardoned / n : .3;
    const r = n < 3 ? { id: "unknown", text: "the town does not yet know what kind of judge you are", drift: 0 }
      : ratio < .15 ? { id: "cruel", text: "they call you a cruel tyrant", drift: -2 }
      : ratio > .5 ? { id: "weak", text: "they call you soft: insolence grows, and brigands grow bold", drift: -2 }
      : ratio >= .2 && ratio <= .4 ? { id: "just", text: "they call you stern but just", drift: 1 }
      : { id: "fair", text: "they think you fair enough", drift: 0 };
    return { ...r, ratio, pardoned: J.pardoned, executed: J.executed };
  }
  const CAPTIVES = { pirates: "the pirate captains", brigands: "the brigand leaders", tribes: "the chieftains taken in the field", march: "the chieftains taken in their valley", rebels: "the ringleaders of the revolt" };
  /** After a victory: execute or pardon the defeated. */
  async function judgement(s, enemy, notes) {
    const J = (s.justice = s.justice || { pardoned: 0, executed: 0 }), rep0 = reputation(s), who = CAPTIVES[enemy.kind] || "the prisoners";
    const pick = await ui.choose(`Judgement on ${who}`,
      `They stand in chains in the forum. So far you have pardoned ${J.pardoned} and executed ${J.executed}: ${rep0.text}. A wise ruler pardons about one in three or four; never pardoning makes a tyrant, pardoning too often makes a weak one.`,
      [{ label: "Execute them", sub: "Rome approves (favour +1); the town is frightened (loyalty −2)" }, { label: "Pardon them", sub: "loyalty +3; they swear never to return" }], "general");
    if (pick === 1) { J.pardoned++; s.loyalty += 3; notes.push(`You pardon ${who}: they kneel and swear by their gods. ${reputation(s).text.replace(/^./, (m) => m.toUpperCase())}.`); }
    else { J.executed++; s.favour += 1; s.loyalty -= 2; notes.push(`${who.replace(/^./, (m) => m.toUpperCase())} are executed outside the Sea Gate. ${reputation(s).text.replace(/^./, (m) => m.toUpperCase())}.`); }
  }
  const REBELLION_BELOW = 50, PARLEY_DC = 15, REBEL_SHARE = .12, PEACE_UNTIL = 60, PEACE_LOYALTY = 2;
  const REP_LABEL = { just: "stern but just", cruel: "a cruel tyrant", weak: "a weak ruler" };
  /** How loyalty moves on its own this season, part by part (shown in the ledger). Cards, orders and battles come on top. */
  function loyaltyParts(s, hunger) {
    const rep0 = reputation(s), parts = [], taxL = TAX_RATES[s.tax][1], b = stat(s, "loyalty");
    if (taxL) parts.push([`${s.tax} taxes`, taxL]);
    if (hunger) parts.push(["hunger", LOYALTY_HUNGER]); else if (s.grain < 3) parts.push(["little bread", LOYALTY_LOW_FOOD]);
    if (b) parts.push(["the temple and the baths", b]);
    if (!hunger && s.grain >= 3 && s.calamity_turn !== s.turn && s.loyalty < PEACE_UNTIL) parts.push(["peace and bread", PEACE_LOYALTY]);
    if (rep0.drift) parts.push([REP_LABEL[rep0.id], rep0.drift]);
    return parts;
  }
  /** The town rises: talk, or fight your own people. Winning costs half the town. */
  async function rebellion(s, notes) {
    const t = (s.troops = { ...troopsOf(s) });
    const pick = await ui.choose("The town rises in rebellion",
      `Loyalty has stayed below ${REBELLION_BELOW} for two seasons (now ${Math.round(s.loyalty)}). Thousands of townsmen take up arms in the forum, and the militia you raised from them wavers. You may parley (d20 + loyalty / 10, need ${PARLEY_DC}): taxes fall to low and Rome thinks you weak. Or you may crush them: if you win, half the town is dead and its trade ruined; if you lose, you are finished.`,
      [{ label: "Parley with the rebels", sub: `d20 + ${Math.floor(s.loyalty / 10)}, need ${PARLEY_DC}; if it fails, they fight` }, { label: "Crush the revolt", sub: "a battle in the streets" }], "priest");
    if (pick === 0) {
      const r = await roll(20, Math.floor(s.loyalty / 10), PARLEY_DC, "Parley with the rebels");
      if (r.ok) {
        s.tax = "low"; s.restless = 0; s.favour -= 6; s.loyalty = Math.max(s.loyalty, REBELLION_BELOW + 5); s.calamity_turn = s.turn;
        notes.push(`The parley holds (d20: ${r.r}): you lower the taxes and swear to hear the town. The crowds go home; Rome hears that the governor bargained with a mob (favour −6).`);
        news(s, "rebellion", "The rebellion ends at the parley table: taxes are lowered.");
        return true;
      }
      notes.push(`The parley fails (d20: ${r.r}): stones fly, and it comes to swords.`);
    }
    const defect = Math.round(t.slingers / 2) + Math.round(t.archers / 2);
    t.slingers -= Math.round(t.slingers / 2); t.archers -= Math.round(t.archers / 2);
    const E0 = ENEMIES.rebels;
    const enemy = { kind: "rebels", tribe: null, name: E0.name, men: Math.round(s.people * REBEL_SHARE) + defect, share: [.3, .4, .3], fury: E0.fury, home: false, terrain: E0.terrain, where: E0.where, say: E0.say, who: E0.who, quality: .5, at: "streets", walled: false };
    if (defect) notes.push(`${defect} of the town's slingers and archers go over to the rebels.`);
    s.restless = 0;   // the battle itself decides now
    const won = await battle(s, enemy, notes);
    if (s.over) return won;
    if (won) {
      const dead = Math.round(s.people / 2);
      s.people -= dead;
      for (const g of GOODS) s[g] = Math.floor(s[g] / 2);
      s.treasury = Math.floor(s.treasury / 2);
      damage(s, { damage: 2 }, notes);
      s.loyalty = REBELLION_BELOW; s.favour -= 8; s.calamity_turn = s.turn;   // a town in terror obeys
      notes.push(`The revolt is crushed, but at a terrible price: ${intc(dead)} townspeople are dead, the stores and the chest are plundered (half lost), and Rome asks how a governor let it come to this (favour −8).`);
      news(s, "rebellion", `Rebellion crushed: ${intc(dead)} dead, half the town's wealth gone.`);
    } else s.over = "Overthrown: the town rose in rebellion and your soldiers could not hold the streets.";
    return won;
  }
  /** The season's battle, if the year's conflict falls now; or the town's own rebellion. */
  async function conflictPhase(s, notes) {
    if ((s.restless || 0) >= 2 && s.loyalty < REBELLION_BELOW && !s.over) { if (s.conflict && s.conflict.turn === s.turn) s.conflict.turn++; return rebellion(s, notes); }
    planConflict(s);
    if (!s.conflict || s.conflict.turn !== s.turn || s.over) return null;
    const enemy = makeEnemy(s, s.conflict.kind, undefined, s.conflict.at);
    enemy.foretold = !!s.conflict.foretold;
    s.conflict = null;
    return battle(s, enemy, notes);
  }

  // --- Applying orders and resolving the season (formulas.md, in order) ---
  async function applyDecrees(s, orders, notes) {
    for (const o of orders) {
      const d = DECREE[o.id];
      const [c, mats] = costOf(s, o);
      s.treasury -= c;
      for (const [g, q] of Object.entries(mats)) s[g] -= q;
      const eff = effectsOf(d);
      const win = o.boost === "win", lose = o.boost === "lose";
      if (o.id === "merchants" && o.boost) for (const g of Object.keys(o.buy || {})) o.buy[g] = Math.max(0, Math.round(o.buy[g] * (win ? 1.2 : 0.8) * 10) / 10);
      if (["hold_festival", "visit_temple", "honour_tiberius", "honour_rome"].includes(o.id) && o.boost) for (const n of Object.keys(eff)) eff[n] = win ? eff[n] * 2 : 0;
      if (o.id === "raise_taxes" && o.boost) eff.loyalty = win ? 0 : (eff.loyalty || 0) * 2;
      if (o.id === "hang_brigands" && o.boost) eff.loyalty = win ? 3 : -4;
      if (o.id === "recruit" && win) eff.army = 75;
      if (o.id === "recruit" && lose) { eff.army = 25; eff.loyalty = (eff.loyalty || 0) - 2; }
      if (o.id === "build_ship" && lose) s.treasury -= 150;
      if (!GAMBLE_TEXT[o.id] && o.boost && !["treat_tribe", "march_tribe"].includes(o.id)) s.treasury += win ? 150 : -150;
      if (o.boost === "lost" && !["treat_tribe", "march_tribe"].includes(o.id)) {   // a disaster on the die: paid for, and nothing to show
        if (o.id === "send_convoy") {
          for (const [g, q] of Object.entries(o.sell || {})) s[g] -= q;
          s.ships = Math.max(0, s.ships - 1); s.army = Math.max(0, s.army - 10); fleetNames(s);
          notes.push(`Disaster at sea: the ship for ${TOWN[o.town] ? TOWN[o.town].name : "the coast"} goes down with her cargo, the money paid and ten marines.`);
        } else if (o.id === "build") notes.push(`Disaster: the works on the ${BLD[o.building].name.toLowerCase()} collapse; the money and materials are lost.`);
        else if (o.id === "recruit") { s.loyalty -= 4; notes.push("Disaster: the recruits riot in the forum and run off to the hills; nobody is enlisted."); }
        else { s.treasury -= 150; s.loyalty -= 2; notes.push(`Disaster: '${describe(s, o)}' goes badly wrong (−150 denarii, loyalty −2).`); }
        s.calamity_turn = s.turn;
        continue;
      }
      if (o.dearer) { s.treasury -= o.dearer; notes.push(`A setback: '${describe(s, o)}' costs ${o.dearer} denarii more than planned.`); }
      if (o.id === "refill_ranks") {
        const R = refillOf(s), n = Math.round(R.n * (win ? 1 : lose ? .6 : 1));
        s.army += n; s.people -= n;
        notes.push(`${n} townsmen take the shields and ${(s.kit || {}).gladius ? "swords" : "spears"} of the fallen: the cohorts stand at ${Math.trunc(s.army)} again.`);
      }
      if (o.id === "build_ballista") { const t = (s.troops = { ...troopsOf(s) }); t.ballistae += 1; notes.push(`A ballista is built: ${t.ballistae} stone-thrower${t.ballistae > 1 ? "s" : ""}.`); }
      if (["train_slingers", "raise_archers", "raise_cavalry", "build_engine", "arm_pila", "arm_gladius"].includes(o.id)) {
        const t = (s.troops = { ...troopsOf(s) }), k = (s.kit = { ...(s.kit || {}) });
        const n = { train_slingers: 25, raise_archers: 30, raise_cavalry: 10 }[o.id];
        if (o.id === "train_slingers") { t.slingers += n * (win ? 1.4 : lose ? .6 : 1) | 0; notes.push(`${t.slingers} slingers now drill on the shore.`); }
        else if (o.id === "raise_archers") { t.archers += n * (win ? 1.4 : lose ? .6 : 1) | 0; notes.push(`The townsmen take up bows: ${t.archers} archers in all.`); }
        else if (o.id === "raise_cavalry") { t.cavalry += lose ? 5 : n; notes.push(`Horses are bought in the hills: ${t.cavalry} horsemen.`); }
        else if (o.id === "build_engine") { t.engines += 1; notes.push(`A scorpion is built in the arsenal: ${t.engines} engine${t.engines > 1 ? "s" : ""}.`); }
        else if (o.id === "arm_pila") { k.pila = true; notes.push("Every cohort now carries javelins."); }
        else { k.gladius = true; notes.push("The infantry is armed with short Spanish swords."); }
      }
      if (o.id === "treat_tribe") await treatTribe(s, o, notes);
      else if (o.id === "march_tribe") await marchTribe(s, o, notes);
      if (d.id === "raise_taxes") s.tax = TAX_STEPS[TAX_STEPS.indexOf(s.tax) + 1];
      else if (d.id === "lower_taxes") s.tax = TAX_STEPS[TAX_STEPS.indexOf(s.tax) - 1];
      else if (d.id === "hold_festival") {
        if (s.last_festival === s.turn - 1) { eff.loyalty = (eff.loyalty || 0) / 2; notes.push("A second festival in a row pleases the people less."); }
        s.last_festival = s.turn;
      } else if (d.id === "build") {
        const B = BLD[o.building], base = Math.trunc(num(B.seasons_to_build));
        const wait = win ? Math.max(1, Math.ceil(base / 2)) : lose ? base + 1 : base;
        if (lose) s.treasury -= Math.round(c / 2);
        s.buildings.push({ kind: B.id, done: s.turn + wait });
        notes.push(`Work begins on ${B.name.toLowerCase()}; ready in turn ${s.turn + wait}${num(B.matures) ? `, first yield ${num(B.matures)} seasons later` : ""}.`);
      } else if (d.id === "build_ship") {
        const name = newShipName(s);
        s.shipyard.push({ done: s.turn + (win ? 1 : 2), name });
        notes.push(`The keel of the ${name} is laid on the slipway; she will be launched in ${win ? "one season" : "two seasons"}.`);
      } else if (d.id === "build_warship") {
        const name = newWarName(s), wait = win ? 2 : lose ? 4 : 3;
        s.shipyard.push({ done: s.turn + wait, name, war: true });
        notes.push(`The keel of the trireme ${name} is laid: three banks of oars and a bronze ram; she will be launched in ${wait} seasons.`);
      } else if (d.id === "commission_press") {
        invent(s, { invention: "screw_press" }, true, notes);
      } else if (d.id === "merchants") {
        for (const [g, q] of Object.entries(o.buy || {})) s[g] += q;
        notes.push(`Merchants at the quay sell you ${listText(o.buy)} for ${intc(merchantCost(o))} denarii.`);
      } else if (d.id === "clear_land") {
        const wait = CLEAR_SEASONS + (win ? -1 : lose ? 1 : 0);
        s.clearing = (s.clearing || []).concat([s.turn + wait]);
        notes.push(`Labourers start clearing the scrub for a new field; ready in turn ${s.turn + wait}.`);
      } else if (d.id === "send_convoy") {
        if (seasonOf(s.turn)[0].sailing === "no") { useAbility(s, "fleet"); notes.push("Epicadus takes a ship out in winter, when no one else dares: his winter run is spent."); }
        await convoy(s, notes, o);
      } else if (d.id === "hang_brigands") { cheer(s, "general", notes, "approves of the hangings"); s.justice = s.justice || { pardoned: 0, executed: 0 }; s.justice.executed++; }
      else if (d.id === "visit_temple") { cheer(s, "priest", notes, "is glad to see the governor at the altar"); prophecy(s, notes, o.boost); }
      else if (d.id === "hear_petitions") cheer(s, "treasurer", notes, "learns a great deal about who owes what");
      else if (d.id === "listen_sages") {
        s.forecast = drawWeather(s.turn + 1); s.forecast_turn = s.turn + 1;
        const w = WINDS[s.forecast.wind];
        notes.push(`The sages read the sky: next season brings ${w.id === "CALM" ? "a dead calm" : `${w.latin}, the wind from the ${w.from}`}. ${w.effect}`);
      }
      for (const [n, v] of Object.entries(eff)) s[n] += v;
    }
  }
  // --- The haruspex (rules v10): a sacrifice at the temple, and Tertius reads the liver ---
  const KIND_NAME = { pirates: "Pirates", brigands: "Brigands from the gorge", tribes: "Warriors of the tribes" };
  /** This year's conflict if it is still to come; otherwise next year's, decided now. */
  function foresee(s) {
    if (s.conflict) return s.conflict;
    const [, year] = seasonOf(s.turn), idx = (s.turn - 1) % SEASONS.length;
    if (s.conflict_year !== year) return null;   // not planned yet (only before the first Spring)
    s.conflict_year = year + 1;
    s.conflict = { turn: s.turn + (SEASONS.length - idx) + rint(0, 2), ...rollConflict(s) };
    return s.conflict;
  }
  /** Next season's harvest as the gods see it: the wind is fixed now (like the sages' forecast), and the yield follows. */
  function harvestForecast(s) {
    const t = s.turn + 1, [season] = seasonOf(t);
    if (!(s.forecast && s.forecast.turn === t)) { s.forecast = drawWeather(t); s.forecast_turn = t; }
    const w = WINDS[s.forecast.wind], mult = num(w.harvest_mult, 1), later = { ...s, turn: t };
    const eaters = s.people + s.army + soldiersBesides(s);
    const grain = Math.round((num(season.harvest_grain) * built(s, "wheat") / BASE_WHEAT * GRAIN_BASE_EATERS / eaters * mult + stat(s, "grain")) * 10) / 10;
    const goods = {};
    for (const B of BUILDING_LIST) {
      if (!B.produces || String(B.uses || "").trim()) continue;   // the farms and the sea; workshops depend on their stores
      const when = String(B.yields_in || "any");
      if (when !== "any" && !when.split(/[;, ]+/).includes(season.season)) continue;
      const f = s.buildings.filter((x) => x.kind === B.id).reduce((a, x) => a + yieldFactor(later, x), 0);
      for (const [g, q] of Object.entries(parseList(B.produces))) if (g !== "grain" && q * f) goods[g] = (goods[g] || 0) + Math.round(q * f);
    }
    for (const v of inventionsOf(s)) for (const [g, m] of Object.entries(v.more || {})) if (goods[g]) goods[g] += Math.round(goods[g] * m);
    return { season: season.season, wind: w, mult, grain, goods, after: Math.round((s.grain + grain - GRAIN_EATEN) * 10) / 10 };
  }
  /** The omen card of next season, drawn now and kept for it. */
  function foreOmen(s) {
    const t = s.turn + 1;
    if (s.omen_next && s.omen_next.turn === t) return CARDS.find((c) => c.id === s.omen_next.id);
    weightState = s;
    const pool = CARDS.filter((c) => c.deck === "omen" && cardFits(s, c));
    if (!pool.length) return null;
    const c = choices(pool, pool.map(weight));
    s.omen_next = { turn: t, id: c.id };
    return c;
  }
  /** What the liver says: the coming war, the sea, the granaries, the town; and one piece of wise advice. */
  function prophecy(s, notes, boost) {
    if (boost === "lose" || boost === "lost") { s.prophecy = { turn: s.turn, signs: ["The liver is malformed: the gods will not speak this season."], advice: null }; notes.push("Tertius Volusius turns the liver in his hands and goes pale: it is malformed, and the gods are silent."); return; }
    const signs = [], c = foresee(s);
    let advice = null;
    if (c) {
      const [se, yr] = seasonOf(c.turn), en = makeEnemy(s, c.kind, undefined, c.at);
      c.foretold = en.foretold = true;
      const odds = battleOdds(s, en, defaultPlan(s, en, en.who), en.who).chance;
      signs.push(`Mars: ${KIND_NAME[c.kind] || "Enemies"} will come in ${se.season} AD ${yr}, ${AT_NAME[c.at] || "against us"}. As we stand now, ${en.who === "general" ? "Antistius" : ADVISORS[en.who].name.split(" ")[0]} would win ${odds} times in 100. Forewarned, the men fight better (+1).`);
      if (odds < 75) {
        const t = troopsOf(s), o = c.at === "walls" ? (built(s, "walls") && t.archers < 60 ? order("raise_archers") : order("recruit"))
          : refillOf(s).n >= 30 ? order("refill_ranks") : s.army < 300 ? order("recruit") : t.slingers < 50 ? order("train_slingers") : null;
        if (o) advice = { order: o, say: c.at === "walls" ? `They will come against the walls: ${o.id === "raise_archers" ? "put archers on them" : "more men on the walls"}, Governor: ${lower(describe(s, o))}.`
          : `They will come into the open fields, where the walls cannot help: ${lower(describe(s, o))}. Or be ready to shut the gates and let the fields burn.` };
      }
    }
    const atSea = (s.convoys || []);
    if (atSea.length) { for (const cv of atSea) cv.blessed = true; signs.push(`Neptune accepts the offering: ${atSea.map((cv) => `the ${cv.ship || "ship"}`).join(" and ")} will have a kind sea home (+2 on the voyage).`); }
    const hf = harvestForecast(s), what = Object.entries(hf.goods).map(([g, q]) => `${q} ${nameOf(g).toLowerCase()}`);
    const windText = hf.wind.id === "CALM" ? "a dead calm" : `${hf.wind.latin}, the wind from the ${hf.wind.from}`;
    signs.push(`Ceres: next season (${hf.season}) brings ${windText}. ${hf.grain || what.length ? `The fields will give ${hf.grain ? `${hf.grain} months of grain` : "no grain"}${what.length ? ` and ${what.join(", ")}` : ""}${hf.mult !== 1 ? ` (the wind ${pct(hf.mult - 1)})` : ""}` : "No harvest is due"}; three months are eaten, so the granaries will hold ${Math.max(0, hf.after)} months${hf.after < 3 ? ": too little" : ""}.`);
    const om = foreOmen(s);
    if (om) signs.push(`The omen of next season is already written: “${om.title}”${om.choice ? ", a choice for you to make" : `: ${effectsText(om.effects)}`}.${darkOmen(om) ? " A dark sign: prepare for it." : ""}`);
    if (hf.after < 3) {
      if (s.grain < 4 || hf.after < 1.5) { const g = suggestions(s).find((p) => p.who === "economist"); if (g) advice = { order: g.order, say: `Fill the granaries before anything else: ${lower(describe(s, g.order))}.` }; }
    }
    if (s.loyalty < 55) {
      signs.push(`The household gods are uneasy: loyalty stands at ${Math.round(s.loyalty)}. Below ${REBELLION_BELOW} for two seasons, the town rises.`);
      if (!advice) { const o = s.tax === "high" ? order("lower_taxes") : order("hold_festival"); advice = { order: o, say: `Win back the town: ${lower(describe(s, o))}.` }; }
    }
    if (!advice) {
      const p = suggestions(s)[0];
      if (p) advice = { order: p.order, say: `${ADVISORS[p.who].name.split(" ")[0]} is right this time: ${lower(describe(s, p.order))}.` };
    }
    s.prophecy = { turn: s.turn, signs, advice: advice ? { say: advice.say, order: advice.order } : null };
    notes.push(`Tertius Volusius reads the liver: ${signs.join(" ")}${advice ? ` His advice: ${advice.say}` : ""}`);
    news(s, "omen", `The haruspex foretells: ${signs[0]}`);
  }
  async function convoy(s, notes, o) {
    const t = TOWN[o.town];
    const [, delay] = sailing(s, t.direction === "north");
    const paid0 = buyCost(s, o) + num(DECREE.send_convoy.cost_treasury);   // what the voyage cost at the outset
    let deal = 0, refund = 0;
    if (await offerAbility(s, "economist", `I know a man in ${t.name} who will give us a better price (+20%).`)) {
      deal = GOOD_DEAL_BONUS; notes.push(`Nikandros strikes a deal in ${t.name}: the convoy trades at a better price.`);
    }
    // goods leave the stores now; the money for purchases was paid with the order (costOf)
    for (const [g, q] of Object.entries(o.sell || {})) s[g] -= q;
    let revenue = Object.entries(o.sell || {}).reduce((v, [g, q]) => v + q * priceAt(s, t.id, g, "sell", deal), 0);
    if (o.boost === "win") revenue = Math.round(revenue * 1.3);
    if (o.boost === "lose") { revenue = Math.round(revenue / 2); for (const g of Object.keys(o.buy || {})) o.buy[g] = Math.floor(o.buy[g] / 2); }
    if (deal) { refund = buyCost(s, o) - Object.entries(o.buy || {}).reduce((v, [g, q]) => v + q * priceAt(s, t.id, g, "buy", deal), 0); s.treasury += refund; }
    if (delay) notes.push("Dead calm: the convoy waits a season in harbour before it can sail.");
    fleetNames(s);
    const ship = s.fleet.find((n) => !s.convoys.some((c) => c.ship === n)) || "a ship";
    const paid = paid0 - refund;
    s.convoys.push({ ship, town: t.id, out: s.turn, arrive: s.turn + t.seasons + delay, revenue, paid, cargo: { ...(o.buy || {}) }, sold: { ...(o.sell || {}) } });
    notes.push(`The ${ship} sails for ${t.name}` + (Object.keys(o.sell || {}).length ? ` with ${listText(o.sell)}` : "") +
      (Object.keys(o.buy || {}).length ? ` to bring back ${listText(o.buy)}` : "") + `; home in turn ${s.turn + t.seasons + delay}.`);
  }
  async function convoyHome(s, c, notes) {
    const t = TOWN[c.town];
    const [factor] = sailing(s, t.direction !== "north");   // the voyage home runs the other way
    const bonus = Math.round(factor * 10) + (s.council.fleet.mood >= 4 ? 1 : 0) + (c.blessed ? 2 : 0);
    const r = await roll(VOYAGE_DIE, bonus, VOYAGE_TARGET, `The ship from ${t.name}`, true);
    let share = 1, how = "safely";
    if (r.r === 1 && s.warships) how = "attacked by pirates off the coast, but a trireme drove them off";
    else if (r.r === 1) { share = 0; how = "robbed by pirates off the coast; she limps home empty"; }
    else if (!r.ok) { share = 0.5; how = "battered by a storm; half the cargo went over the side"; }
    else if (r.r === VOYAGE_DIE) { share = 1.1; how = "early on a fair wind, with a little extra trade"; }
    const money = Math.round(c.revenue * share);
    s.treasury += money;
    const got = Object.fromEntries(Object.entries(c.cargo).map(([g, q]) => [g, g === "grain" ? Math.floor(q * Math.min(share, 1) * 10) / 10 : Math.floor(q * Math.min(share, 1))]));
    for (const [g, q] of Object.entries(got)) s[g] += q;
    // the voyage's ledger: the goods brought home are valued at what they cost there
    const paid = c.paid ?? 0, brought = Math.round(Object.entries(got).reduce((v, [g, q]) => v + q * priceAt(s, t.id, g, "buy"), 0));
    const lost = Math.round(Object.entries(c.cargo).reduce((v, [g, q]) => v + (q - (got[g] || 0)) * priceAt(s, t.id, g, "buy"), 0));
    const profit = money + brought - paid, ship = c.ship || "a ship";
    s.voyages = (s.voyages || []).concat([{ ship, town: t.id, turn: s.turn, sold: c.sold || {}, money, cargo: got, brought, paid, lost, profit, how: r.r === 1 ? "pirates" : !r.ok ? "storm" : r.r === VOYAGE_DIE ? "fair wind" : "safe" }]).slice(-12);
    const verdict = `${profit >= 0 ? "profit" : "loss"} ${profit >= 0 ? "+" : "−"}${intc(Math.abs(profit))} denarii`;
    notes.push(`The ${ship}'s ledger: ${Object.keys(c.sold || {}).length ? `sold ${listText(c.sold)} for ${intc(money)}` : "nothing to sell"}; ${Object.values(got).some((q) => q > 0) ? `brought ${listText(got)} worth ${intc(brought)}` : "brought nothing back"}${lost ? ` (${intc(lost)} lost on the way)` : ""}; paid ${intc(paid)} at the outset: ${verdict}.`);
    news(s, "voyage", `The ${ship} is home from ${t.name}: ${verdict}.`);
    notes.push(`The ${ship} from ${t.name} comes home ${how} (d20: ${r.r}${bonus ? (bonus > 0 ? " + " : " − ") + Math.abs(bonus) : ""})` +
      (money ? `: ${intc(money)} denarii` : "") + (Object.values(got).some((q) => q > 0) ? `${money ? " and " : ": "}${listText(got)}` : "") + ".");
  }
  async function resolve(s, notes) {
    const [season] = seasonOf(s.turn);
    const arrived = s.convoys.filter((c) => c.arrive <= s.turn);
    s.convoys = s.convoys.filter((c) => c.arrive > s.turn);
    for (const b of s.buildings) if (b.done === s.turn) notes.push(`${BLD[b.kind].name} finished.`);
    const readyWar = s.shipyard.filter((k) => k.done <= s.turn && k.war);
    const ready = s.shipyard.filter((k) => k.done <= s.turn && !k.war);
    if (readyWar.length) {
      s.shipyard = s.shipyard.filter((k) => !readyWar.includes(k));
      s.warships = (s.warships || 0) + readyWar.length; s.navy = (s.navy || []).concat(readyWar.map((k) => k.name));
      for (const k of readyWar) { notes.push(`The trireme ${k.name} is launched: her ram flashes in the bay (${s.warships} warship${s.warships > 1 ? "s" : ""} now).`); news(s, "ship", `Launched: the trireme ${k.name} joins the fleet.`); }
    }
    const cleared = (s.clearing || []).filter((t) => t <= s.turn);
    if (cleared.length) { s.field_plots = clearedPlots(s) + cleared.length; s.clearing = s.clearing.filter((t) => t > s.turn); notes.push(`New field${cleared.length > 1 ? "s are" : " is"} cleared: ${s.field_plots} field plots now.`); }
    if (ready.length) {
      fleetNames(s);
      s.ships += ready.length; s.fleet.push(...ready.map((k) => k.name)); s.shipyard = s.shipyard.filter((k) => k.done > s.turn);
      for (const k of ready) { notes.push(`The ${k.name} is launched: she slides into the harbour (${Math.trunc(s.ships)} ships now).`); news(s, "ship", `Launched: the ${k.name} slides into the harbour.`); }
    }
    // income
    const [rate] = TAX_RATES[s.tax];
    s.treasury += Math.round(s.people * rate);
    s.treasury += stat(s, "treasury");
    s.inv_report = [];
    for (const v of inventionsOf(s)) if (v.rent) { s.treasury += v.rent; s.inv_report.push({ name: v.name, rent: v.rent, text: v.rent_text }); notes.push(`${v.name}: +${v.rent} denarii ${v.rent_text}.`); }
    for (const c of arrived) await convoyHome(s, c, notes);
    // army pay
    const tr = troopsOf(s);
    const pay = (s.army + tr.slingers) * Math.max(1, ARMY_PAY - stat(s, "army_pay_discount")) + tr.archers * ARCHER_PAY + tr.cavalry * CAVALRY_PAY + tr.engines * ENGINE_UPKEEP + tr.ballistae * BALLISTA_UPKEEP + (s.warships || 0) * TRIREME_UPKEEP;
    if (s.treasury >= pay) s.treasury -= pay;
    else {
      const unpaid = (pay - s.treasury) / pay; s.treasury = 0;
      const tens = Math.ceil(unpaid * 10), lost = Math.round(s.army * 0.05 * tens);
      s.army -= lost; s.loyalty -= 3 * tens;
      notes.push(`The soldiers were not fully paid: ${lost} desert and some take what they are owed.`);
    }
    // tribute
    const graceEnds = s.tribute_grace === s.turn;
    if (season.tribute_due === "yes" || graceEnds) {
      delete s.tribute_grace;
      const due = TRIBUTE + s.tribute_debt;
      if (s.treasury < due && !graceEnds && await offerAbility(s, "treasurer", `The chest holds ${intc(s.treasury)} of ${intc(due)}. Shall I beg Rome for one more season?`)) {
        s.tribute_grace = s.turn + 1; notes.push(`Felix wins a season's grace from Rome: the tribute of ${intc(due)} denarii is due next season.`);
      } else if (s.treasury >= due) {
        s.treasury -= due; s.tribute_debt = 0; s.favour += TRIBUTE_PAID_FAVOUR; notes.push(`The tribute of ${intc(due)} denarii sails for Rome.`);
      } else {
        const short = due - s.treasury; s.treasury = 0;
        s.tribute_debt = Math.round(short * TRIBUTE_DEBT_PENALTY); s.favour += TRIBUTE_MISSED_FAVOUR;
        notes.push(`Rome receives only part of its tribute. ${intc(s.tribute_debt)} denarii are owed next year.`);
      }
    }
    // grain: the wheat harvest, fisheries, and three months eaten
    const eaters = s.people + s.army + soldiersBesides(s);
    const mult = num(WINDS[s.wind].harvest_mult, 1);
    let harvest = num(season.harvest_grain) * built(s, "wheat") / BASE_WHEAT * GRAIN_BASE_EATERS / eaters * mult;
    if (harvest && mult !== 1) notes.push(`The wind made the harvest ${mult > 1 ? "richer" : "poorer"} (${pct(mult - 1)}).`);
    harvest += stat(s, "grain");
    s.grain = Math.round((s.grain + harvest - GRAIN_EATEN) * 10) / 10;
    const hunger = s.grain <= 0;
    s.grain = Math.max(s.grain, 0);
    s.hunger_streak = hunger ? s.hunger_streak + 1 : 0;
    if (hunger) notes.push("The granaries are empty. People go hungry.");
    // production: what each kind of building yields this season, as it matures
    for (const B of BUILDING_LIST) {
      if (!B.produces) continue;
      const when = String(B.yields_in || "any");
      if (when !== "any" && !when.split(/[;, ]+/).includes(season.season)) continue;
      const f = s.buildings.filter((x) => x.kind === B.id).reduce((t, x) => t + yieldFactor(s, x), 0);
      if (!f) continue;
      const out = parseList(B.produces), use = parseList(B.uses);
      let ratio = 1;
      for (const [g, q] of Object.entries(use)) ratio = Math.min(ratio, q * f ? s[g] / (q * f) : 1);
      ratio = Math.max(0, Math.min(1, ratio));
      for (const [g, q] of Object.entries(use)) s[g] -= Math.round(q * f * ratio);
      const made = Object.fromEntries(Object.entries(out).map(([g, q]) => [g, Math.round(q * f * ratio)]));
      for (const v of inventionsOf(s)) for (const [g, m] of Object.entries(v.more || {})) if (made[g]) {
        const extra = Math.round(made[g] * m), base = made[g]; made[g] += extra;
        (s.inv_report = s.inv_report || []).push({ name: v.name, good: g, extra, base, unit: unitOf(g) });
        notes.push(`${v.name}: +${extra} ${nameOf(g).toLowerCase()} from the same harvest.`);
      }
      for (const [g, q] of Object.entries(made)) s[g] += q;
      if (Object.values(made).some((q) => q > 0)) notes.push(`${B.name}${built(s, B.id) > 1 ? ` (${built(s, B.id)})` : ""}: +${listText(made)}${f < built(s, B.id) ? ", the young ones not yet at full yield" : ""}.`);
      else if (Object.keys(use).length) notes.push(`${B.name}: idle, no ${Object.keys(use).map((g) => nameOf(g).toLowerCase()).join(" or ")} to work.`);
    }
    // people
    if (hunger) s.people = Math.round(s.people * 0.95);
    else if (s.calamity_turn === s.turn) notes.push("No newcomers this season: word of the troubles has spread along the coast.");
    else if (s.grain >= GROWTH_MIN_GRAIN && s.loyalty >= GROWTH_MIN_LOYALTY) {
      const room = housing(s), rate = GROWTH_BASE + (s.loyalty >= 60 ? GROWTH_HAPPY : 0);
      if (s.people < room) {
        const before = s.people;
        s.people = Math.min(room, Math.round(s.people * (1 + rate)));
        if (s.people > before) notes.push(`${intc(s.people - before)} newcomers settle in Acruvium: a peaceful town draws people from the hills and the islands.`);
      } else notes.push("The town is full: newcomers have nowhere to live. Build a residential district.");
    }
    // loyalty and favour
    const lparts = loyaltyParts(s, hunger);
    s.loyalty += lparts.reduce((a, [, v]) => a + v, 0);
    s.loyalty_parts = lparts;
    s.favour += stat(s, "favour");
    if (s.loyalty < UNREST_BELOW) { s.favour += UNREST_FAVOUR; notes.push("Unrest in the streets; Rome hears of it."); }
    if (s.army < ORDER_ARMY) s.favour += ORDER_FAVOUR;
    if (s.morale && s.turn - (s.last_war ?? -9) >= 4 && s.turn % 2 === 0) s.morale += s.morale > 0 ? -1 : 1;   // spirits settle with time
    // rules v10: below 50 the town grows restless; still below 50 a season later, it rises
    if (s.loyalty < REBELLION_BELOW) {
      s.restless = (s.restless || 0) + 1;
      notes.push(s.restless >= 2 ? `Warning: loyalty is still below ${REBELLION_BELOW} (${Math.round(s.loyalty)}): the town will rise in rebellion next season unless it climbs back.`
        : `Warning: loyalty has fallen below ${REBELLION_BELOW} (${Math.round(s.loyalty)}). If it is still below ${REBELLION_BELOW} at the end of next season, the town rises in rebellion.`);
    } else s.restless = 0;
    s.army_peak = Math.max(s.army_peak || 150, Math.trunc(s.army));
    fleetNames(s);
    s.history = (s.history || []).concat([Object.fromEntries([["turn", s.turn], ...NUMBERS.map((n) => [n, Math.round(s[n] * 10) / 10])])]).slice(-12);
  }
  // inventions (rules v9): a card may bring a new machine that keeps paying
  const INVENTIONS = {
    screw_press: { name: "The screw press", more: { oil: .3 }, rent: 50, rent_text: "from neighbours who press their olives here",
      text: "Olive oil +30% at every harvest; neighbours pay 50 denarii a season to use it." },
  };
  const inventionsOf = (s) => (s.inventions || []).map((id) => INVENTIONS[id]).filter(Boolean);

  // --- The season's cards ---
  function triggerHolds(s, trig) {
    trig = String(trig ?? "random").trim();
    if (trig === "random") return true;
    const w = trig.match(/^wind\s*(==|!=)\s*(\w+)$/);
    if (w) return (s.wind === w[2]) === (w[1] === "==");
    const m = trig.match(/^(\w+)\s*(<=|>=|<|>|==)\s*(-?\d+(?:\.\d+)?)$/);
    if (!m || !(m[1] in s)) return false;
    const a = s[m[1]], bb = parseFloat(m[3]);
    return { "<": a < bb, "<=": a <= bb, ">": a > bb, ">=": a >= bb, "==": a === bb }[m[2]];
  }
  const SEASON_IDX = { Spring: 1, Summer: 2, Autumn: 3, Winter: 4 };
  /** "Autumn 31" -> the turn of that season. */
  const dateTurn = (d) => { const m = String(d || "").match(/(Spring|Summer|Autumn|Winter)\s+(\d+)/); return m ? (+m[2] - 30) * 4 + SEASON_IDX[m[1]] : null; };
  function cardFits(s, c) {
    if (c.date) return false;                                   // letters come on their own date, never by chance
    const last = (s.card_last || {})[c.id];
    if (c.cooldown && last && s.turn - last < num(c.cooldown)) return false;
    const [season, year] = seasonOf(s.turn);
    const seasons = c.seasons ?? "any";
    if (seasons !== "any" && !seasons.includes(season.season)) return false;
    const [lo, hi] = c.years || [30, 42];
    if (!(lo <= year && year <= hi) || (c.once && s.once_fired.includes(c.id))) return false;
    return triggerHolds(s, c.trigger);
  }
  let weightState = null;   // raids are three times as likely while a tribe is hostile
  const weight = (c) => parseFloat(c.chance ?? 0.1) * (weightState && c.category === "raiders" && anyHostile(weightState) ? RAID_WEIGHT : 1);
  function drawSeasonCards(s) {
    weightState = s;
    const drawn = [];
    for (const [deck] of DECKS) {
      const letter = deck === "sea" && CARDS.find((c) => c.date && dateTurn(c.date) === s.turn && !(s.once_fired || []).includes(c.id));
      if (letter) { drawn.push(letter); continue; }
      const seen = deck === "omen" && s.omen_next && s.omen_next.turn === s.turn ? CARDS.find((c) => c.id === s.omen_next.id) : null;
      if (seen && cardFits(s, seen)) { drawn.push(seen); s.omen_next = null; continue; }
      const pool = CARDS.filter((c) => c.deck === deck && cardFits(s, c));
      if (pool.length) drawn.push(choices(pool, pool.map(weight)));
    }
    return drawn;
  }
  /** Effects with ranges ({people: [-100, -50]}) rolled to numbers. */
  const concrete = (eff) => Object.fromEntries(Object.entries(eff || {}).map(([n, v]) => [n, Array.isArray(v) ? rint(Math.min(v[0], v[1]), Math.max(v[0], v[1])) : v]));
  /** A card that kills people or soldiers, or says so, stops growth for the season. */
  const isCalamity = (c, eff) => !!c.calamity || (eff.people || 0) < 0 || (eff.army || 0) < 0;
  /** An earthquake throws down a finished building in town; it must be rebuilt. */
  function damage(s, c, notes) {
    for (let k = 0; k < num(c.damage); k++) {
      const pool = s.buildings.filter((b) => BLD[b.kind].zone === "town" && b.kind !== "forum" && isDone(s, b));
      if (!pool.length) return;
      const b = pool[rint(0, pool.length - 1)];
      b.done = s.turn + 2;
      notes.push(`The ${BLD[b.kind].name.toLowerCase()} is thrown down and must be rebuilt (two seasons).`);
    }
  }
  const effectsText = (eff) => Object.entries(eff || {}).filter(([n]) => NUMBERS.includes(n))
    .map(([n, v]) => Array.isArray(v) ? `${nameOf(n).toLowerCase()} ${Math.min(...v)} to ${Math.max(...v)}` : `${nameOf(n).toLowerCase()} ${v > 0 ? "+" : ""}${v}`).join(", ") || "no effect";
  const applyEffects = (s, eff) => { for (const [n, v] of Object.entries(eff || {})) if (NUMBERS.includes(n)) s[n] += v; };
  const darkOmen = (c) => !!c.choice || Object.values(c.effects || {}).some((v) => v < 0);

  function invent(s, opt, ok, notes) {
    const v = INVENTIONS[opt.invention];
    if (!v) return;
    if (!ok) { notes.push(`${v.name}: the work fails and the money is wasted; perhaps another time.`); return; }
    if ((s.inventions = s.inventions || []).includes(opt.invention)) return;
    s.inventions.push(opt.invention);
    notes.push(`${v.name} is built and working. ${v.text}`);
    news(s, "invention", `New in Acruvium: ${v.name.toLowerCase()}. ${v.text}`);
  }
  async function answerCard(s, c, notes) {
    const ch = c.choice;
    const opts = ch.options.map((o) => ({ label: o.label, sub: o.roll ? `d${o.roll.die || 20} + ${rollBonus(s, o.roll.bonus)}, need ${o.roll.target}` : effectsText(o.effects), roll: !!o.roll }));
    const pick = await ui.cardChoice(c, opts);
    const opt = ch.options[pick];
    const eff = concrete(opt.effects);
    const r = opt.roll;
    if (r) {
      const bonus = rollBonus(s, r.bonus), target = Math.trunc(r.target);
      const res = await roll(Math.trunc(r.die || 20), bonus, target, opt.label);
      let ok = res.ok;
      const battle = String(r.bonus ?? "").includes("army");
      if (battle && !ok && res.r !== 1 && res.total + LEAD_CHARGE_BONUS >= target &&
          await offerAbility(s, "general", `Let me lead the men myself: +${LEAD_CHARGE_BONUS} turns this into a success.`)) {
        ok = true; notes.push("Marcus Antistius led the charge himself and turned the day.");
      }
      for (const [n, v] of Object.entries(concrete(r[ok ? "success" : "failure"]))) eff[n] = (eff[n] || 0) + v;
      notes.push(`${c.title}: you chose '${opt.label}' and the die says ${ok ? "success" : "failure"} (${effectsText(eff)}).`);
    } else notes.push(`${c.title}: you chose '${opt.label}' (${effectsText(eff)}).`);
    applyEffects(s, eff);
    invent(s, opt, true, notes);
    if (isCalamity({}, eff)) s.calamity_turn = s.turn;
  }
  async function revealCards(s, notes) {
    const cards = drawSeasonCards(s);
    const omen = cards.find((c) => c.deck === "omen");
    if (omen && darkOmen(omen) && abilityReady(s, "priest")) {
      const what = omen.choice ? "a decision for you" : effectsText(omen.effects);
      if (await offerAbility(s, "priest", `I read the entrails before the cards are turned: a dark omen is coming, “${omen.title}” (${what}). Shall I sacrifice again and ask the gods for another sign?`)) {
        const pool = CARDS.filter((c) => c.deck === "omen" && c.id !== omen.id && cardFits(s, c));
        if (pool.length) {
          const fresh = choices(pool, pool.map(weight));
          cards[cards.indexOf(omen)] = fresh;
          notes.push(`Tertius Volusius sacrificed again: '${omen.title}' gave way to '${fresh.title}'.`);
        }
      }
    }
    await ui.reveal(cards);
    for (const c of cards) {
      if (c.once) s.once_fired.push(c.id);
      if (!c.choice) { applyEffects(s, c.effects); if (!c.quiet) notes.push(`${c.title}: ${effectsText(c.effects)}.`); }
    }
    const open = cards.filter((c) => c.choice);
    while (open.length) {
      const i = open.length > 1 ? await ui.choose("Which card do you deal with first?", "", open.map((c) => ({ label: c.title, sub: DECK_LABEL[c.deck] }))) : 0;
      await answerCard(s, open.splice(i, 1)[0], notes);
    }
    return cards;
  }

  // --- Rules v3: on every card two advisors propose one order each, one moderate and one risky ---
  /** good, bad or quiet: a card that costs the town something is bad. */
  const cardTone = (c) => (c.quiet ? "quiet" : Object.values(c.effects || {}).some((v) => v < 0) ? "bad" : "good");
  /** Who speaks on which card: [moderate, risky]. */
  const PAIRS = {
    land: { good: ["economist", "general"], bad: ["economist", "general"], quiet: ["economist", "general"] },
    sea: { good: ["economist", "fleet"], bad: ["treasurer", "fleet"], quiet: ["treasurer", "fleet"] },
    omen: { good: ["priest", "treasurer"], bad: ["priest", "treasurer"], quiet: ["priest", "treasurer"] },
  };
  /** Which deck an order belongs to: sea orders on sea cards, land orders on land cards, gods and Rome on omens. */
  const SEA_BUILDINGS = ["harbour", "fishery", "saltpans", "market"];
  function domainOf(o) {
    if (!o) return null;
    if (["send_convoy", "build_ship", "build_warship", "merchants"].includes(o.id)) return "sea";
    if (o.id === "build") return SEA_BUILDINGS.includes(o.building) ? "sea" : o.building === "temple" ? "omen" : "land";
    if (["visit_temple", "hold_festival", "honour_tiberius", "honour_rome", "listen_sages"].includes(o.id)) return "omen";
    return "land";
  }
  /** Can this one order be given now (after what the season's cards already ordered)? Returns a problem or null. */
  function canDo(s, o) {
    const before = (s.season_pending || []).map((x) => ({ ...x }));
    const [ok, problems] = validate(s, before.concat([{ ...o }]));
    return ok.length === before.length + 1 ? null : problems[problems.length - 1] || "It cannot be done.";
  }
  /** Each advisor's wishes for a card of this tone, best first; the first that can be done is his proposal. */
  function wishes(s, who, tone) {
    const hungry = s.grain < 3;
    const food = [hungry ? merchantOrder(s, { grain: 2 }) : null, s.grain < 4.5 ? grainConvoy(s, 3) : null];
    const nextTribe = TRIBES.find((t) => !tribeWon(s, t.id));
    const crowded = fieldsFull(s) && clearedPlots(s) + (s.clearing || []).length >= FIELD_PLOTS_MAX && nextTribe;
    const houses = s.people > housing(s) * 0.9 ? b("houses") : null;   // more room, more taxpayers
    if (who === "economist") return tone === "bad"
      ? food.concat([b("fishery"), b("wheat"), b("saltpans")])
      : food.concat([houses, crowded ? order("treat_tribe", { tribe: nextTribe.id }) : null, fieldsFull(s) && fieldPlots(s) < FIELD_PLOTS_MAX ? order("clear_land") : null, s.fleece >= 6 && !built(s, "weavers") ? b("weavers") : null,
        built(s, "olives") && !(s.inventions || []).includes("screw_press") && s.treasury > 1500 ? order("commission_press") : null,
        tone === "good" ? b("wheat") : b("vineyard"), b("olives"), b("vineyard"), b("wheat"), b("pasture"), sellConvoy(s, ["wine", "oil"], { wine: FESTIVAL_WINE_KEEP })]);
    if (who === "general") return tone === "bad"
      ? [refillOf(s).n >= 30 ? order("refill_ranks") : null, s.army < 250 ? order("recruit") : null, order("hang_brigands"), b("walls"), b("barracks")]
      : [crowded && s.army >= MARCH_MIN_ARMY ? order("march_tribe", { tribe: nextTribe.id }) : null, !(s.kit || {}).pila && s.iron >= 12 ? order("arm_pila") : null,
        troopsOf(s).slingers < 50 ? order("train_slingers") : null, s.buildings.some((x) => x.kind === "walls") && troopsOf(s).archers < 60 ? order("raise_archers") : null,
        anyHostile(s) && troopsOf(s).engines < 2 ? order("build_engine") : null, troopsOf(s).cavalry < 10 && s.treasury > 4000 ? order("raise_cavalry") : null, b("walls"), b("barracks"), s.army < 300 ? order("recruit") : null, s.iron < 8 ? b("mine") : null, order("hang_brigands")];
    if (who === "fleet") return tone === "bad"
      ? [!s.warships && s.treasury > 2500 ? order("build_warship") : null, order("build_ship"), Math.trunc(s.ships) >= berths(s) ? b("harbour") : null, sellConvoy(s, ["fish", "wine", "oil", "timber", "fleece", "cloth"], { wine: FESTIVAL_WINE_KEEP, timber: 20 })]
      : [sellConvoy(s, ["wine", "oil", "fish", "cloth", "timber", "fleece"], { wine: FESTIVAL_WINE_KEEP, timber: 20 }), order("build_ship"), Math.trunc(s.ships) >= berths(s) ? b("harbour") : null];
    if (who === "treasurer" && tone !== "good" && s.favour < 60) return [order("honour_tiberius"), order("honour_rome"), houses, order("hear_petitions"), b("market"), sellConvoy(s, ["wine", "oil", "fish", "cloth"], { wine: FESTIVAL_WINE_KEEP })];
    if (who === "treasurer") return [houses, tone === "good" && s.tax !== "high" && s.loyalty >= 68 ? order("raise_taxes") : null, order("hear_petitions"), b("market"),
      sellConvoy(s, ["wine", "oil", "fish", "cloth"], { wine: FESTIVAL_WINE_KEEP }), s.army > 200 ? order("dismiss") : null];
    // priest
    const easeTaxes = s.tax === "high" && s.loyalty < 58 ? order("lower_taxes") : null;
    return tone === "bad"
      ? [easeTaxes, order("visit_temple"), s.loyalty < 60 && s.last_festival !== s.turn - 1 ? order("hold_festival") : null, s.favour < 45 ? order("honour_rome") : null, order("honour_tiberius")]
      : [easeTaxes, tone === "quiet" ? order("listen_sages") : null, order("honour_tiberius"), order("visit_temple"), !s.buildings.some((x) => x.kind === "temple") ? b("temple") : null, order("listen_sages")];
  }
  const sameOrder = (a, x) => a && x && a.id === x.id && (a.building || "none") === (x.building || "none") && a.town === x.town;
  /** What the advisor says when he proposes it. */
  function pitch(s, who, tone, o, c) {
    const what = describe(s, o).replace(/^./, (m) => m.toLowerCase());
    const lines = {
      economist: { good: `A good season, Governor. Turn it into more: ${what}. A wise governor feeds his people first.`,
        bad: `We must protect the people's bread. Let us ${what}.`, quiet: `A calm season is a season for planting: ${what}. Vines and olives take years.` },
      general: { good: `Good money, Governor. Spend it on our safety: ${what}.`, bad: `Strength answers this. ${what.replace(/^./, (m) => m.toUpperCase())}, and quickly.`,
        quiet: `Quiet seasons end. Prepare for the next raid: ${what}.` },
      fleet: { good: `The sea is open and the gods are kind. ${what.replace(/^./, (m) => m.toUpperCase())}!`, bad: `The sea took from us; the sea will pay us back. ${what.replace(/^./, (m) => m.toUpperCase())}.`,
        quiet: `Ships in harbour earn nothing. ${what.replace(/^./, (m) => m.toUpperCase())}.` },
      treasurer: { good: `While fortune smiles, fill the chest: ${what}.`, bad: `Losses must be made good, Governor. Let us ${what}.`, quiet: `Every quiet season should leave the chest fuller: ${what}.` },
      priest: { good: `The gods have spoken kindly. Thank them, and Rome: ${what}.`, bad: `This is a warning. Appease the gods: ${what}.`, quiet: `Silence from the gods is a question. ${what.replace(/^./, (m) => m.toUpperCase())}.` },
    };
    return lines[who][tone];
  }
  /** The two proposals for a card that asks no question of its own. */
  function proposals(s, c) {
    const tone = cardTone(c), [mod, risky] = (PAIRS[c.deck] || PAIRS.land)[tone];
    const out = [];
    const fallback = { sea: [order("build_ship"), merchantOrder(s, { grain: 1 }), b("fishery"), b("saltpans"), b("harbour"), b("market"), sellConvoy(s, ["wine", "oil", "fish", "cloth", "timber"], { wine: FESTIVAL_WINE_KEEP, timber: 20 })],
      land: [b("wheat"), b("houses"), order("hear_petitions"), order("recruit"), order("train_slingers"), b("woodcutters"), order("hang_brigands")],
      omen: [order("visit_temple"), order("honour_tiberius"), order("listen_sages"), order("honour_rome"), order("hold_festival"), b("temple")] }[c.deck] || [];
    const inDeck = (x) => domainOf(x) === c.deck || (c.deck === "omen" && x.id === "lower_taxes");
    for (const [who, risk] of [[mod, "moderate"], [risky, "risky"]]) {
      const o = wishes(s, who, tone).concat(fallback).find((x) => x && inDeck(x) && !canDo(s, x) && !out.some((p) => sameOrder(p.order, x)));
      if (o) out.push({ who, risk, order: o, say: pitch(s, who, tone, o, c) });
    }
    for (const p of out) p.check = checkFor(s, c, { kind: "advice", who: p.who, risk: p.risk, order: p.order });
    return { tone, list: out, letbe: checkFor(s, c, { kind: "none" }) };
  }
  // --- Checks (rules v5): the die of the card's deck, a DC, and the bonuses that move it, shown before you choose ---
  const isSea = (o) => o && ["send_convoy", "build_ship", "build_warship", "merchants"].includes(o.id);
  const isArms = (o) => o && ["recruit", "hang_brigands", "dismiss", "march_tribe"].includes(o.id);
  /** chance of total >= dc on a d20 where a 1 always fails and a 20 always succeeds */
  const chanceOf = (bonus, dc) => Math.max(5, Math.min(95, 5 * (21 - Math.max(2, Math.min(21, dc - bonus)))));
  function conditions(s, c, o, who) {
    const parts = [];
    const add = (v, label) => { if (v) parts.push([label, v]); };
    if (who && ADVISORS[who]) {
      const stat = GAMBLE_STAT[who] || "experience", st = s.council[who];
      add(num(ADVISORS[who][stat], 3) - 3, `${ADVISORS[who].name.split(" ")[0]}'s ${stat}`);
      if (st.mood >= 4) add(1, `${ADVISORS[who].name.split(" ")[0]} in good heart`);
      else if (st.mood <= MOOD_SULK) add(-2, `${ADVISORS[who].name.split(" ")[0]} sulking`);
    }
    if (c.deck === "sea" || isSea(o)) {
      const [w, label] = WIND_SEA[s.wind] || [0, ""];
      add(w, label);
      if (seasonOf(s.turn)[0].sailing === "no") add(-3, "the winter sea");
      if (s.forecast_turn === s.turn) add(1, "the sages read the sky");
      if (built(s, "harbour") > 1) add(1, "a second harbour");
    }
    if (isArms(o) || c.category === "raiders") {
      add(Math.trunc(stat(s, "battle_bonus")), "walls and barracks");
      add(Math.min(3, Math.floor(s.army / 100)), "the garrison");
    }
    if (c.deck === "omen") {
      if (built(s, "temple")) add(2, "the temple");
      if (s.council.priest.mood >= 4 && who !== "priest") add(1, "Tertius at peace with the gods");
    }
    if (c.deck === "land" && s.loyalty < 35) add(-1, "a sullen town");
    if (s.calamity_turn === s.turn) add(-1, "the town in mourning");
    return parts;
  }
  /** The check for one choice on a card: {die, dc, parts, bonus, chance, win, lose}. */
  function checkFor(s, c, pick) {
    const die = DIE_OF[c.deck] || "opal";
    let dc, parts = [], win = "", lose = "", bonus;
    const tone = cardTone(c);
    if (pick.kind === "advice" || pick.kind === "order") {
      const o = pick.order, who = pick.kind === "advice" ? pick.who : null;
      if (o.id === "treat_tribe" || o.id === "march_tribe") {
        const od = tribeOdds(s, o.tribe), w = o.id === "treat_tribe" ? od.treat : od.march;
        if (o.id === "march_tribe") { const en = makeEnemy(s, "march", o.tribe), bo = battleOdds(s, en, defaultPlan(s, en, "general"), "general");
          return { die, dc: BATTLE_DC, parts: [["a battle: see the battlefield", 0]], bonus: 0, chance: bo.chance, win: "their land and loot", lose: "men lost; they turn hostile" }; }
        return { die, dc: w.target, parts: [[o.id === "treat_tribe" ? "the chiefs' mood" : "our strength against theirs", w.bonus]], bonus: w.bonus, chance: chanceOf(w.bonus, w.target),
          win: o.id === "treat_tribe" ? "their land and their friendship" : "their land and loot", lose: o.id === "treat_tribe" ? "the gifts are wasted" : "men lost; they turn hostile" };
      }
      const risk = pick.kind === "order" ? "own" : pick.risk;
      dc = CHECK_DC[risk];
      parts = conditions(s, c, o, who);
      const [gw, gl] = GAMBLE_TEXT[o.id] || DEFAULT_GAMBLE;
      win = risk === "risky" ? gw : "carried out as ordered";
      lose = risk === "risky" ? gl : "it costs a quarter more";
    } else if (pick.kind === "option") {
      const opt = c.choice.options[pick.i];
      if (opt.roll) {
        dc = Math.trunc(opt.roll.target);
        const base = rollBonus(s, opt.roll.bonus);
        parts = (base ? [[String(opt.roll.bonus).replace(/_/g, " ").replace("army / 50", "soldiers / 50"), base]] : []).concat(conditions(s, c, null, c.advisor));
        win = effectsText(opt.roll.success); lose = effectsText(opt.roll.failure);
      } else { dc = CHECK_DC.option; parts = conditions(s, c, null, null); win = effectsText(opt.effects); lose = "things go worse than you hoped"; }
    } else {
      dc = tone === "bad" ? CHECK_DC.letbe_bad : CHECK_DC.letbe;
      parts = conditions(s, c, null, null);
      win = tone === "bad" ? "the trouble passes" : "nothing changes"; lose = tone === "bad" ? "it gets worse: half of it again" : "a little bad luck";
    }
    bonus = Math.max(-BONUS_CAP, Math.min(BONUS_CAP, parts.reduce((a, [, v]) => a + v, 0)));
    return { die, dc, parts, bonus, chance: chanceOf(bonus, dc), win, lose };
  }
  const TIER = (r, total, dc) => (r === 1 ? "disaster" : r === 20 ? "triumph" : total >= dc ? "success" : "setback");
  const scale = (eff, k) => Object.fromEntries(Object.entries(eff || {}).map(([n, v]) => [n, typeof v !== "number" ? v : n === "grain" ? Math.round(v * k * 10) / 10 : Math.round(v * k)]));
  const negatives = (eff) => Object.fromEntries(Object.entries(eff || {}).filter(([n, v]) => typeof v === "number" && v < 0));
  const positives = (eff) => Object.fromEntries(Object.entries(eff || {}).filter(([n, v]) => typeof v === "number" && v > 0));
  /** Carry out one card's decision with the tier its die gave. */
  async function settle(s, d, res, notes) {
    const c = d.card, tier = res.tier, title = c.title;
    const said = { disaster: "disaster", setback: "a setback", success: "success", triumph: "a triumph" }[tier];
    if (d.pick.kind === "advice" || d.pick.kind === "order") {
      const o = { ...d.pick.order };
      if (o.id === "treat_tribe") o.preRoll = { r: res.r, total: res.total, ok: tier === "success" || tier === "triumph", tag: res.tag };
      else if (o.id === "march_tribe") { /* the battle decides */ }
      else if (tier === "disaster") o.boost = "lost";
      else if (tier === "triumph") o.boost = "win";
      else if (d.pick.risk === "risky") o.boost = tier === "success" ? "win" : "lose";
      else if (tier === "setback") o.dearer = Math.max(50, Math.round(costOf(s, o)[0] * 0.25));
      notes.push(`${title}: the ${d.check.die} die says ${said} (${res.r}${res.bonus ? (res.bonus > 0 ? " + " : " − ") + Math.abs(res.bonus) : ""} against ${d.check.dc}).`);
      const [ok, pr] = validate(s, [{ ...d.pick.order }]);   // the cards since may have emptied the chest
      if (!ok.length) { notes.push(`${title}: the order lapses: ${pr[0] || "it can no longer be done"}`); return; }
      await giveOrder(s, o, notes);
      if (tier === "triumph" && d.pick.who) cheer(s, d.pick.who, notes, "is delighted by the outcome");
    } else if (d.pick.kind === "option") {
      const opt = c.choice.options[d.pick.i];
      let eff = concrete(opt.effects);
      if (opt.roll) {
        const ok = tier === "success" || tier === "triumph";
        let extra = concrete(opt.roll[ok ? "success" : "failure"]);
        if (tier === "triumph") extra = scale(extra, 1.5);
        if (tier === "disaster") extra = scale(extra, 1.5);
        for (const [n, v] of Object.entries(extra)) eff[n] = (eff[n] || 0) + v;
      } else if (tier === "disaster") eff = { ...scale(positives(eff), 0.5), ...scale(negatives(eff), 1.5) };
      else if (tier === "triumph") eff = { ...scale(positives(eff), 1.5), ...negatives(eff) };
      notes.push(`${title}: you chose '${opt.label}', and the ${d.check.die} die says ${said} (${effectsText(eff)}).`);
      applyEffects(s, eff);
      invent(s, opt, tier !== "disaster", notes);
      if (isCalamity({}, eff)) s.calamity_turn = s.turn;
    } else {
      const neg = negatives(c.rolled || c.effects), pos = positives(c.rolled || c.effects), bad = cardTone(c) === "bad";
      let eff = {};
      if (tier === "disaster") eff = bad ? neg : { treasury: -100 };
      else if (tier === "setback") eff = bad ? scale(neg, 0.5) : {};
      else if (tier === "triumph") eff = bad ? scale(neg, -0.5) : scale(pos, 0.5);
      notes.push(`${title}: you let it be, and the ${d.check.die} die says ${said}${Object.keys(eff).length ? ` (${effectsText(eff)})` : ""}.`);
      applyEffects(s, eff);
    }
  }
  /** The governor took one advisor's advice (or none, who = null): he is pleased, the others who spoke feel ignored. */
  function heed(s, who, spoke, notes) {
    if (who) { s.council[who].ignored = 0; cheer(s, who, notes, "is pleased you took his advice"); }
    for (const aid of spoke) {
      if (aid === who) continue;
      const st = s.council[aid];
      st.ignored += 1;
      if (st.ignored >= IGNORED_LIMIT && st.mood > 0) {
        st.mood -= 1; st.ignored = 0;
        notes.push(`${ADVISORS[aid].name} feels ignored (mood ${st.mood}/${MOOD_MAX}).${st.mood === MOOD_SULK ? " He sulks and will not use his gifts for you." : ""}`);
      }
    }
  }
  /** Carry out one order at once (a card's decision or the free order), counting it against once-a-season decrees. */
  async function giveOrder(s, o, notes) {
    s.season_taken = (s.season_taken || []).concat([o.id]);
    await applyDecrees(s, [o], notes);
  }
  /** The season's cards (rules v5): turn each over and decide; when all three are decided, the three dice are thrown together. */
  async function playCards(s, notes) {
    s.season_taken = []; s.season_pending = [];
    const cards = drawSeasonCards(s);
    const omen = cards.find((c) => c.deck === "omen");
    if (omen && darkOmen(omen) && abilityReady(s, "priest")) {
      const what = omen.choice ? "a decision for you" : effectsText(omen.effects);
      if (await offerAbility(s, "priest", `I read the entrails before the cards are turned: a dark omen is coming, “${omen.title}” (${what}). Shall I sacrifice again and ask the gods for another sign?`)) {
        const pool = CARDS.filter((c) => c.deck === "omen" && c.id !== omen.id && cardFits(s, c));
        if (pool.length) {
          const fresh = choices(pool, pool.map(weight));
          cards[cards.indexOf(omen)] = fresh;
          notes.push(`Tertius Volusius sacrificed again: '${omen.title}' gave way to '${fresh.title}'.`);
        }
      }
    }
    s.card_last = s.card_last || {};
    for (const c of cards) s.card_last[c.id] = s.turn;
    await ui.lay(cards);
    const decisions = [];
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      await ui.turn(c, i);
      if (c.once) s.once_fired.push(c.id);
      let pick;
      if (c.choice) {
        const opts = c.choice.options.map((o, k) => ({ label: o.label, sub: o.roll ? "" : effectsText(o.effects), check: checkFor(s, c, { kind: "option", i: k }) }));
        pick = { kind: "option", i: await ui.cardChoice(c, opts) };
      } else {
        const eff = concrete(c.effects);
        applyEffects(s, eff);
        if (!c.quiet) notes.push(`${c.title}: ${effectsText(eff)}.`);
        if (isCalamity(c, eff)) s.calamity_turn = s.turn;
        if (c.damage) damage(s, c, notes);
        c.rolled = eff;
        const { tone, list, letbe } = proposals(s, c);
        const choice = await ui.decide(c, i, list, tone, letbe);
        const spoke = list.map((p) => p.who);
        if (choice.kind === "advice") { const p = list[choice.i]; pick = { kind: "advice", who: p.who, risk: p.risk, order: p.order }; heed(s, p.who, spoke, notes); }
        else if (choice.kind === "order") { pick = { kind: "order", order: choice.order }; heed(s, null, spoke, notes); }
        else { pick = { kind: "none" }; heed(s, null, spoke, notes); }
        if (pick.order) s.season_pending.push(pick.order);
      }
      const check = checkFor(s, c, pick);
      decisions.push({ card: c, i, pick, check });
      await ui.decided(c, i, pick, check);
    }
    // the throw: one die per card, all at once
    const results = decisions.map((d) => {
      const r = rint(1, 20), total = r + d.check.bonus, tier = TIER(r, total, d.check.dc);
      return { r, bonus: d.check.bonus, total, dc: d.check.dc, die: d.check.die, tier, ok: tier === "success" || tier === "triumph",
        tag: { disaster: "Disaster", setback: "Setback", success: "Success", triumph: "Triumph" }[tier], why: d.card.title };
    });
    await ui.throwDice(decisions, results);
    s.last_roll = { ...results[results.length - 1], target: results[results.length - 1].dc };
    s.season_outcomes = [];
    for (let k = 0; k < decisions.length; k++) {
      await settle(s, decisions[k], results[k], notes);
      s.season_outcomes.push(`${decisions[k].card.title}: ${results[k].tag.toLowerCase()} (${results[k].r}${results[k].bonus ? (results[k].bonus > 0 ? "+" : "") + results[k].bonus : ""} vs ${results[k].dc})`);
    }
    s.season_pending = [];
    return cards;
  }
  function clampAndCheck(s, notes) {
    for (const n of CORE) s[n] = Math.min(Math.max(s[n], num(RULES[n].min, 0)), num(RULES[n].max, Infinity));
    for (const g of GOODS) s[g] = Math.max(0, s[g]);
    fleetNames(s);
    if (s.over) return;
    if (s.favour <= 0) s.over = "Recalled to Rome in disgrace: Roman favour reached 0.";
    else if (s.loyalty <= 0 && s.army < ORDER_ARMY) s.over = "Overthrown: the town rose up and the army was too weak to stop it.";
    else if (s.hunger_streak >= 2) s.over = "Replaced for famine: two hungry seasons in a row.";
    else if (s.turn >= END_TURN) { s.over = "Your governorship ends in the winter of AD 42: Claudius sends a successor, and you sail for Rome."; s.finished = true; }
  }
  /** The governorship's score: what a successor would find. */
  function score(s) {
    const builtCount = s.buildings.filter((b) => isDone(s, b) && b.kind !== "forum").length;
    const parts = [["people", Math.round(s.people / 100)], ["loyalty", Math.round(s.loyalty)], ["Roman favour", Math.round(s.favour)],
      ["buildings", builtCount * 3], ["treasury", Math.round(s.treasury / 500)],
      ["the tribes", TRIBES.reduce((a, t) => a + (tribeState(s, t.id).state === "ally" ? 12 : tribeState(s, t.id).state === "conquered" ? 8 : 0), 0)],
      ["seasons governed", s.turn]];
    return { total: parts.reduce((a, [, v]) => a + v, 0), parts };
  }

  // --- The fourth order (rules v4): three prepared choices from the council ---
  function suggestions(s) {
    const order3 = s.grain < 4 ? ["economist", "treasurer", "general"] : s.army < ORDER_ARMY ? ["general", "economist", "priest"]
      : s.loyalty < 56 ? ["priest", "economist", "treasurer"] : s.favour < 45 ? ["priest", "treasurer", "economist"]
      : [["economist", "fleet", "general"], ["treasurer", "economist", "priest"], ["fleet", "general", "economist"]][s.turn % 3];
    const out = [];
    if (s.tax === "high" && s.loyalty < 58 && !canDo(s, order("lower_taxes"))) out.push({ who: "priest", order: order("lower_taxes"), say: "The people cannot carry these taxes much longer, Governor. Ease them." });
    for (const who of order3) {
      if (out.length >= 3) break;
      for (const tone of ["good", "quiet", "bad"]) {
        const o = wishes(s, who, tone).find((x) => x && !canDo(s, x) && !out.some((p) => sameOrder(p.order, x)));
        if (o) { out.push({ who, order: o, say: pitch(s, who, tone, o) }); break; }
      }
    }
    return out;
  }

  // --- For the AI scribe: the town in a few lines, and an order checked against the rules ---
  function stateText(s) {
    const [season, year] = seasonOf(s.turn), w = WINDS[s.wind];
    const blds = BUILDING_LIST.map((B) => { const n = s.buildings.filter((b) => b.kind === B.id).length; return n ? `${B.id} x${n}` : ""; }).filter(Boolean).join(", ");
    const goods = GOODS.filter((g) => s[g] > 0).map((g) => `${g} ${Math.trunc(s[g])}`).join(", ");
    const tribes = TRIBES.map((t) => `${t.id} (${t.name}): ${tribeState(s, t.id).state}${hostile(s, t.id) ? ", hostile" : ""}`).join("; ");
    return [`Season: ${season.season} AD ${year} (turn ${s.turn} of ${END_TURN}); emperor ${emperorOf(s.turn)}; sailing ${season.sailing === "yes" ? "open" : "closed (winter)"}; wind ${w.latin} from the ${w.from}.`,
      `Numbers: grain ${s.grain.toFixed(1)} months, treasury ${Math.trunc(s.treasury)} denarii, people ${Math.trunc(s.people)} (housing ${housing(s)}), loyalty ${Math.round(s.loyalty)}/100, Roman favour ${Math.round(s.favour)}/100, army ${Math.trunc(s.army)}, ships ${Math.trunc(s.ships)} (${Math.trunc(s.ships) - shipsAtSea(s)} in harbour, berths ${berths(s)}), tax ${s.tax}, tribute ${TRIBUTE} due each Summer${s.tribute_debt ? `, debt ${s.tribute_debt}` : ""}.`,
      `Stores: ${goods || "empty"}.`, `Buildings: ${blds}. Plots: town ${plotsUsed(s, "town")}/${TOWN_PLOTS}, fields ${plotsUsed(s, "field")}/${fieldPlots(s)}.`,
      `Tribes beyond the fields: ${tribes}.`, `Tribute: ${TRIBUTE} denarii to Rome every Summer (next in ${turnsToTribute(s)} season(s))${s.tribute_debt ? `, plus ${s.tribute_debt} owed` : ""}.`, `Army: ${Math.trunc(s.army)} infantry, ${troopsOf(s).slingers} slingers, ${troopsOf(s).archers} archers, ${troopsOf(s).cavalry} horsemen, ${troopsOf(s).engines} scorpions, ${troopsOf(s).ballistae} ballistae; kit: ${Object.keys(s.kit || {}).join(", ") || "plain"}; experience ${s.army_xp || 0}/6, morale ${s.morale || 0}.`, `The city: ${CITY.traits}${built(s, "arx") ? " The citadel stands." : ""}`].join("\n");
  }
  function rulesText(s) {
    const dec = DECREES.map((d) => `- ${d.id}: ${d.id === "honour_tiberius" ? `Decree honouring ${emperorOf(s.turn)}` : d.name}; ${num(d.cost_treasury) ? num(d.cost_treasury) + " den" : "no denarii"}${d.cost ? ", " + d.cost : ""}. ${String(d.notes).replace("DRAFT. ", "")}`).join("\n");
    const blds = BUILDING_LIST.filter((b) => b.id !== "forum").map((b) => `- ${b.id} (${b.zone}): ${num(b.cost_treasury)} den${b.cost ? ", " + b.cost : ""}; ${num(b.seasons_to_build)} seasons; ${String(b.notes).replace("DRAFT. ", "")}`).join("\n");
    const towns = TOWNS.map((t) => `- ${t.id}: sells ${t.sells}; buys ${t.buys}; ${t.direction}, back in ${t.seasons} season(s)`).join("\n");
    return `DECREES:\n${dec}\nBUILDINGS (for "build"):\n${blds}\nTOWNS (for "send_convoy"):\n${towns}`;
  }
  /** Keep only the fields an order may have, with sane values. */
  function sanitizeOrder(o) {
    if (!o || !DECREE[o.id]) return null;
    const out = order(String(o.id));
    if (o.id === "build") out.building = BLD[o.building] ? o.building : "none";
    if (o.id === "send_convoy") { out.town = TOWN[o.town] ? o.town : null; out.sell = {}; out.buy = {}; }
    if (o.id === "merchants") out.buy = {};
    for (const side of ["sell", "buy"]) if (out[side]) for (const [g, q] of Object.entries(o[side] || {})) if ((GOOD[g] || g === "grain") && +q > 0) out[side][g] = Math.min(40, Math.trunc(+q));
    if (o.id === "treat_tribe" || o.id === "march_tribe") out.tribe = TRIBE[o.tribe] ? o.tribe : null;
    return out;
  }

  // --- The scribe's word matcher (offline): the governor's own words into orders ---
  const PATTERNS = [
    ["raise_taxes", /\b(raise|increase|higher|up|double)\b[^.,;]*\btax|\btax\w*\b[^.,;]*\b(up|higher|raise|increase)/],
    ["lower_taxes", /\b(lower|reduce|cut|ease|less)\b[^.,;]*\btax|\btax\w*\b[^.,;]*\b(down|lower|cut)/],
    ["dismiss", /\b(dismiss|disband|discharge|send home)\b/],
    ["recruit", /\b(recruit|hire|levy|enlist|raise (an )?army|more (soldiers|men|troops))\b/],
    ["hang_brigands", /\b(hang|execut\w*|crucif\w*|brigands?|bandits?|criminals?|thieves)\b/],
    ["hear_petitions", /\b(petitions?|hear the people|judge\w*|judgement|court|assizes)\b/],
    ["build_ship", /\b(keel|(build|lay down|construct|new)\b[^.,;]*\b(ship|galley|boat)s?)\b/],
    ["listen_sages", /\b(sages?|elders?|wise men|philosoph\w*|astrolog\w*|soothsay\w*)\b/],
    ["march_tribe", /\b(march|attack|war|conquer|invade|burn)\b[^.,;]*\b(docleatae|ardiaei|pirustae|tribes?|hills)\b/],
    ["treat_tribe", /\b(treat|treaty|talk|negotiat\w*|gifts? to|envoys?|peace)\b[^.,;]*\b(docleatae|ardiaei|pirustae|tribes?|chiefs?)\b/],
    ["honour_tiberius", /\b(tiberius|gaius|caligula|claudius|inscription|statue|decree\b[^.,;]*\bemperor)\b/],
    ["honour_rome", /\b(gifts?|send\b[^.,;]*\bto rome)\b/],
    ["visit_temple", /\b(sacrific\w*|pray\w*|offering|visit\b[^.,;]*\btemple|go to the temple)\b/],
    ["hold_festival", /\b(festival|games|feast|celebrat\w*|holiday)\b/],
    ["merchants", /\b(merchants?|at the quay)\b/],
    ["clear_land", /\b(clear\w*|new fields?|scrub)\b/],
    ["send_convoy", /\b(convoy|sail|trade with|sell|buy|export|import|epidaurum|salona|aquileia|dyrrachium|brundisium)\b/],
  ];
  const BUILD_VERB = /\b(build|construct|plant|found|erect|lay out|dig|open|expand|establish|set up|start|make)\b/;
  const BUILD_WORDS = [
    ["harbour", /\b(harbou?rs?|port|docks?|quay|berths?)\b/], ["houses", /\b(houses?|homes?|residential|dwellings?|insula\w*|housing)\b/],
    ["market", /\b(market\w*|trading district|trade district|merchants' quarter)\b/], ["temple", /\b(temples?|shrine)\b/],
    ["barracks", /\bbarracks?\b/], ["baths", /\bbaths?\b/], ["walls", /\b(walls?|towers?|fortif\w*)\b/],
    ["weavers", /\b(weav\w*|looms?|textiles?|cloth)\b/], ["fishery", /\b(fisher\w*|fishing)\b/], ["saltpans", /\b(salt ?pans?|salterns?|salt works)\b/],
    ["pasture", /\b(pastures?|sheep|wool|flocks?)\b/], ["olives", /\b(olives?|olive groves?)\b/], ["vineyard", /\b(vine\w*|grapes?)\b/],
    ["woodcutters", /\b(woodcutter\w*|lumber|logging|timber|forest)\b/], ["mine", /\b(mines?|iron)\b/],
    ["wheat", /\b(terraces?|wheat|farmland|fields?|farms?)\b/],
  ];
  const GOOD_WORDS = [["grain", /\b(grain|wheat|corn)\b/], ["wine", /\bwine\b/], ["oil", /\b(olive )?oil\b/], ["fish", /\bfish\b/],
    ["cloth", /\b(cloth|textiles?)\b/], ["fleece", /\b(fleece|wool)\b/], ["timber", /\b(timber|wood|logs?)\b/], ["salt", /\bsalt\b/],
    ["iron", /\biron\b/], ["tin", /\btin\b/], ["bronze", /\bbronze\b/], ["marble", /\bmarble\b/], ["amber", /\bamber\b/],
    ["glass", /\bglass\w*\b/], ["papyrus", /\bpapyrus\b/], ["pepper", /\bpepper\b/], ["purple", /\bpurple\b/]];
  const GREEDY = /\b(make me rich|free money|\d{4,} denarii|i am the emperor|ignore (the|your) rules|infinite|unlimited)\b/;
  const WORD_NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, a: 1, an: 1 };
  const numIn = (t) => { const m = t.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/); return m ? (/^\d+$/.test(m[1]) ? +m[1] : WORD_NUM[m[1]]) : 0; };
  function parseConvoy(s, clause, whole) {
    let town = TOWNS.find((t) => whole.includes(t.id) || whole.includes(t.name.toLowerCase()));
    if (!town) town = /\bsouth|italy\b/.test(whole) ? TOWN.brundisium : /\bnorth\b/.test(whole) ? TOWN.salona : null;
    const o = { id: "send_convoy", town: town ? town.id : null, sell: {}, buy: {}, building: "none" };
    for (const part of clause.split(/\b(?=sell|buy|export|import)\b/)) {
      const side = /^(sell|export)/.test(part) ? "sell" : /^(buy|import)/.test(part) ? "buy" : null;
      if (!side) continue;
      for (const [g, rx] of GOOD_WORDS) {
        if (!rx.test(part)) continue;
        const n = numIn(part);
        if (side === "sell") o.sell[g] = Math.min(Math.trunc(s[g] || 0), n || SHIP_LOAD);
        else o.buy[g] = n || (g === "grain" ? 2 : 5);
      }
    }
    if (!o.town) {   // no town named: the best market for what is being sold, else for grain
      const pick = Object.keys(o.sell).length ? sellConvoy(s, Object.keys(o.sell)) : grainConvoy(s, o.buy.grain || 2);
      if (pick) o.town = pick.town;
    }
    for (const g of Object.keys(o.sell)) if (!o.sell[g]) delete o.sell[g];
    if (!Object.keys(o.sell).length && !Object.keys(o.buy).length) {
      const pick = sellConvoy(s, ["wine", "oil", "fish", "cloth"], { wine: FESTIVAL_WINE_KEEP });
      if (pick) { if (!o.town || o.town === pick.town) Object.assign(o, { town: pick.town, sell: pick.sell }); }
    }
    return o;
  }
  function wordParse(s, text) {
    const t = text.toLowerCase();
    if (GREEDY.test(t)) return { orders: [], reply: "Governor, the treasury holds what it holds; not even the Emperor's own scribe can write denarii into being. Shall I draw up a real decree instead?" };
    const orders = [];
    for (let clause of t.split(/\band then\b|\bthen\b|\band\b|[,;.]/)) {
      clause = clause.trim();
      if (!clause) continue;
      const tribal = /\b(docleatae|ardiaei|pirustae|tribes?)\b/.test(clause);
      const hit = !tribal && BUILD_WORDS.find(([, rx]) => rx.test(clause));
      const trade = /\b(sell|buy|export|import|convoy)\b/.test(clause);
      if (hit && !trade && (BUILD_VERB.test(clause) || !PATTERNS.some(([, rx]) => rx.test(clause)))) {
        const n = /\b(two|three|four|\d+)\b/.test(clause) ? Math.max(1, numIn(clause)) : 1;
        for (let i = 0; i < Math.min(n, 4); i++) orders.push(order("build", { building: hit[0] }));
        continue;
      }
      const p = PATTERNS.find(([, rx]) => rx.test(clause));
      if (p && p[0] === "merchants") {
        const o = order("merchants", { buy: {} });
        for (const [g, rx] of GOOD_WORDS) if (rx.test(clause) && MERCHANT_GOODS.includes(g)) o.buy[g] = numIn(clause.replace(/\bmerchants?\b/, "")) || (g === "grain" ? 1 : 5);
        if (Object.keys(o.buy).length) orders.push(o);
      } else if (p && (p[0] === "march_tribe" || p[0] === "treat_tribe")) {
        const t = TRIBES.find((x) => clause.includes(x.id) || clause.includes(x.name.toLowerCase())) || TRIBES.find((x) => !tribeWon(s, x.id));
        orders.push(order(p[0], { tribe: t ? t.id : null }));
      } else if (p) orders.push(p[0] === "send_convoy" ? parseConvoy(s, clause, t) : order(p[0]));
    }
    return { orders: orders.slice(0, MAX_ORDERS), reply: orders.length ? "As you command, Governor."
      : "Forgive me, Governor, I could not make a decree of that. Speak of taxes, soldiers, brigands, petitions, a building or planting, a ship's keel, a convoy to a town, a festival, the temple, the Emperor, gifts to Rome, the sages, or the tribes (treat with them or march against them)." };
  }

  let ui = null;
  window.Engine = {
    setUI: (u) => { ui = u; }, MAX_ORDERS, FREE_ORDERS, CORE, GOODS, GOOD, NUMBERS, RULES, DECREES, DECREE, BLD, BLD_IDS, BUILDING_LIST, ADVISORS, WINDS, TOWNS, TOWN,
    COUNCIL_ORDER, DECK_LABEL, TOWN_PLOTS, FIELD_PLOTS, FIELD_PLOTS_MAX, MERCHANT_LOAD, MERCHANT_GOODS, merchantPrice, fieldPlots, MOOD_MAX, CURRENT_TEXT, TRIBUTE, SHIP_LOAD, GRAIN_LOAD, VOYAGE_TARGET,
    newGame, seasonOf, rollWeather, revealCards, council, plans, situation, validate, totals, describe, order, costOf, priceAt, loads,
    sailing, abilityState, updateMoods, applyDecrees, resolve, clampAndCheck, wordParse, fmt, intc, pct, housing, berths, shipsAtSea,
    plotsUsed, effectsText, num, parseList, nameOf, unitOf, buildingState, listText, playCards, proposals, canDo, giveOrder, cardTone,
    TRIBES, TRIBE, tribeState, tribeWon, hostile, clearedPlots, tribalPlots, emperorOf, gambleOf, suggestions, score, END_TURN,
    stateText, rulesText, sanitizeOrder, MARCH_MIN_ARMY, tribeOdds, HOSTILE_SEASONS, checkFor, chanceOf, DIE_OF,
    CITY, conflictPhase, migrate, fleetNames, reputation, refillOf, INVENTIONS, inventionsOf, DENSITY, densityOf, REBELLION_BELOW, loyaltyParts, canShut, SHUT, AT_NAME, foresee, harvestForecast, berthsUsed, SHIPS_MAX, TRIREME_UPKEEP, battleOdds, defaultPlan, makeEnemy, unitsOf, LANES, UNIT, BATTLE_DC, forces, troopsOf, XP_MAX, CUT,
    tributeInfo, muster, setup, FIELD, laneAt, domainOf, MELEE_ROUNDS,
  };
})();
