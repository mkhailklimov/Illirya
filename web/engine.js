// Illyria: AD 30 — the rules engine (rules v2, 13 Oct 2026).
// The web game is now the main playtest tool; rules/play.py is frozen at the v1 rules.
// The rules data (numbers, goods, towns, decrees, seasons, advisors, winds, buildings, cards)
// comes from data.js, built by web/build.py from rules/*.csv and events/*.yaml.
// Where the engine needs the player, it awaits the page's `ui` object.
(function () {
  const D = window.GAME_DATA;

  // --- Formula constants (formulas.md) ---
  const MAX_ORDERS = 12;                 // actions a season
  const TAX_RATES = { low: [0.25, +2], normal: [0.5, 0], high: [0.75, -4] };
  const TAX_STEPS = ["low", "normal", "high"];
  const ARMY_PAY = 4, TRIBUTE = 3000, TRIBUTE_PAID_FAVOUR = 5, TRIBUTE_MISSED_FAVOUR = -20, TRIBUTE_DEBT_PENALTY = 1.5;
  const GRAIN_EATEN = 3, GRAIN_BASE_EATERS = 4000, GRAIN_PRICE = 500;
  const TOWN_PLOTS = 12, FIELD_PLOTS = 12, BASE_WHEAT = 4;
  const SHIP_LOAD = 40, GRAIN_LOAD = 10;  // a ship carries 40 loads; a month of grain is 10 of them
  const VOYAGE_DIE = 20, VOYAGE_TARGET = 5; // d20 + sailing advantage when a convoy comes home
  const LOYALTY_LOW_FOOD = -3, LOYALTY_HUNGER = -10, UNREST_BELOW = 30, UNREST_FAVOUR = -3, UPRISING_BELOW = 20;
  const ORDER_ARMY = 100, ORDER_FAVOUR = -1;
  const DECKS = [["land", "Land"], ["sea", "Sea"], ["omen", "Omen"]];
  const CURRENT_DIE = 6, SAIL_STEP = 0.10, SAIL_CAP = 0.30, ROLL_BONUS_CAP = 5;
  const MOOD_START = 3, MOOD_MAX = 5, MOOD_SULK = 1, IGNORED_LIMIT = 2, LEAD_CHARGE_BONUS = 2, GOOD_DEAL_BONUS = 0.20;
  const COUNCIL_ORDER = ["treasurer", "economist", "general", "fleet", "priest"];
  const FESTIVAL_WINE_KEEP = 4;

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
  const listText = (o) => Object.entries(o).filter(([, v]) => v).map(([k, v]) => `${k === "grain" ? v + " months of grain" : `${v} ${nameOf(k).toLowerCase()}`}`).join(", ");

  // --- Game state ---
  const startBuildings = () => BUILDING_LIST.flatMap((b) => Array.from({ length: num(b.start) }, () => ({ kind: b.id, done: -99 })));
  const newCouncil = () => Object.fromEntries(Object.keys(ADVISORS).map((a) => [a, { mood: MOOD_START, ignored: 0, used: null }]));
  function newGame() {
    const s = Object.fromEntries(CORE.map((n) => [n, num(RULES[n].start)]));
    for (const g of GOODS_LIST) s[g.id] = num(g.start);
    Object.assign(s, { version: 2, turn: 1, tax: "normal", buildings: startBuildings(), shipyard: [], convoys: [], tribute_debt: 0,
      wind: "E", current: 1, weather_turn: 0, forecast: null, hunger_streak: 0, last_festival: -9, once_fired: [], over: null,
      council: newCouncil(), last_roll: null });
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
  const zonePlots = (zone) => (zone === "town" ? TOWN_PLOTS : FIELD_PLOTS);
  const shipsAtSea = (s) => s.convoys.length;
  const berths = (s) => Math.trunc(stat(s, "ships_cap"));
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
      if (/^-?\d+$/.test(name)) v = parseInt(name, 10);
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
    if (s.grain < 3) { say.economist = `Only ${s.grain.toFixed(1)} months of grain left. Buy grain in Narona or Dyrrachium, or the people will starve.`; wants.economist = buysGrain; }
    else if (s.grain < 6) { say.economist = "Our terraces feed us only 8 months a year. More wheat, a fishery or bought grain, Governor, or we go short."; wants.economist = (o) => buysGrain(o) || buildOf("wheat", "fishery")(o); }
    else if (s.wine + s.oil >= 14 && season.sailing === "yes") { say.economist = `${Math.trunc(s.wine)} amphorae of wine and ${Math.trunc(s.oil)} of oil wait in the stores. Aquileia and Brundisium pay best.`; wants.economist = sells("wine", "oil"); }
    else if (s.fleece >= 6 && !built(s, "weavers")) { say.economist = `${Math.trunc(s.fleece)} bales of fleece and no one to weave them. A weavers' workshop, Governor.`; wants.economist = buildOf("weavers"); }
    else if (mult !== 1 && num(season.harvest_grain) > 0) say.economist = `With this wind the harvest will be ${mult > 1 ? "better" : "worse"} than usual (${pct(mult - 1)}).`;
    else { say.economist = "The markets are steady. Vines and olives take years; plant them early."; wants.economist = buildOf("vineyard", "olives"); }
    if (s.army < ORDER_ARMY) { say.general = `Only ${Math.trunc(s.army)} men. Rome expects order, and so do the hill tribes.`; wants.general = decreeIs("recruit"); }
    else if (s.loyalty < 40) { say.general = "The mood in the streets is sour. Hang a few brigands, recruit, and the town will keep its head down."; wants.general = decreeIs("recruit", "hang_brigands"); }
    else say.general = `The garrison of ${Math.trunc(s.army)} stands ready. Its pay is ${intc(s.army * ARMY_PAY)} denarii a season.`;
    const [north] = sailing(s, true), [south] = sailing(s, false);
    if (season.sailing === "no") say.fleet = "Mare clausum. No ship of mine leaves the bay until spring.";
    else if (s.wind === "CALM") say.fleet = "Not a breath of wind. Any convoy we send will sit a season in harbour.";
    else if (north > south) { say.fleet = `Wind and current favour a voyage north up the coast (${pct(north)} on prices).`; wants.fleet = toward("north"); }
    else if (south > north) { say.fleet = `The wind is with us for a voyage south (${pct(south)} on prices).`; wants.fleet = toward("south"); }
    else say.fleet = "The sea is open; wind and current favour neither course.";
    if (s.loyalty < 40) { say.priest = "The people murmur against you. A festival would please the gods and men alike."; wants.priest = decreeIs("hold_festival"); }
    else if (s.favour < 40) { say.priest = "The omens from Rome are cold. Honour Tiberius, or send gifts."; wants.priest = decreeIs("honour_rome", "honour_tiberius"); }
    else say.priest = "The omens are calm. Still, the gods like to see the governor at the altar.";
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
    return [c, parseList(d.cost)];
  }
  function describe(s, o) {
    const d = DECREE[o.id];
    if (!d) return o.id;
    if (o.id === "build") { const b = BLD[o.building]; return b ? (b.zone === "field" && ["vineyard", "olives", "wheat"].includes(b.id) ? `Plant ${b.name.toLowerCase()}` : `Build ${b.name.toLowerCase()}`) : "Build (what?)"; }
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
    const accepted = [], problems = [], seen = new Set(), newPlots = { town: 0, field: 0 }, newKinds = {};
    let newShips = 0, convoys = 0, army = s.army;
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
        if (plotsUsed(s, b.zone) + newPlots[b.zone] >= zonePlots(b.zone)) { problems.push(`No free plot ${b.zone === "town" ? "inside the walls" : "in the fields"} for ${b.name.toLowerCase()}.`); return; }
        const have = s.buildings.filter((x) => x.kind === b.id).length + (newKinds[b.id] || 0);
        if (have >= Math.trunc(num(b.max, 99))) { problems.push(`Acruvium already has as many ${b.name.toLowerCase()} as it can hold (${Math.trunc(num(b.max))}).`); return; }
      }
      if (o.id === "build_ship" && Math.trunc(s.ships) + s.shipyard.length + newShips >= berths(s)) { problems.push(`Epicadus: no free berth for another ship (berths for ${berths(s)}); a second harbour first.`); return; }
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
      if (o.id === "build_ship") newShips += 1;
      if (o.id === "send_convoy") convoys += 1;
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
  function plans(s) {
    const crowded = s.people > housing(s) * 0.95;
    const out = [];
    out.push({ who: "treasurer", title: "Fill the chest", orders: fit(s, [
      s.tax !== "high" && s.loyalty >= 45 ? order("raise_taxes") : null, order("hear_petitions"),
      sellConvoy(s, ["wine", "oil", "fish", "cloth"], { wine: FESTIVAL_WINE_KEEP }), b("market")]) });
    out.push({ who: "economist", title: "Feed the town and trade", orders: fit(s, [
      s.grain < 6 ? grainConvoy(s, s.grain < 3 ? 4 : 2) : null, b("wheat"), b("fishery"), s.fleece >= 6 ? b("weavers") : null,
      b("vineyard"), b("olives"), b("saltpans"), crowded ? b("houses") : null]) });
    out.push({ who: "general", title: "Order and arms", orders: fit(s, [
      s.iron < 10 || s.cloth < 5 ? buyConvoy(s, { iron: Math.max(0, 15 - Math.trunc(s.iron)), cloth: s.cloth < 5 ? 8 : 0 }) : null,
      s.army < 250 ? order("recruit") : null, order("hang_brigands"), b("barracks"), s.iron < 8 ? b("mine") : null, b("woodcutters")]) });
    out.push({ who: "fleet", title: "Ships and the sea", orders: fit(s, [
      order("build_ship"), sellConvoy(s, ["fish", "wine", "oil", "timber", "fleece"], { wine: FESTIVAL_WINE_KEEP, timber: 20 }),
      Math.trunc(s.ships) >= berths(s) ? b("harbour") : null, b("saltpans")]) });
    const wantTemple = !s.buildings.some((x) => x.kind === "temple");
    out.push({ who: "priest", title: "The gods and Rome", orders: fit(s, [
      wantTemple && (s.marble < 20 || s.bronze < 4) ? buyConvoy(s, { marble: Math.max(0, 20 - Math.trunc(s.marble)), bronze: Math.max(0, 4 - Math.trunc(s.bronze)) }) : null,
      order("visit_temple"), order("honour_tiberius"), s.loyalty < 50 ? order("hold_festival") : null,
      s.favour < 45 ? order("honour_rome") : null, b("temple"), order("listen_sages")]) });
    out.push({ who: "bold", title: "The scribe's bold plan", orders: fit(s, [
      s.tax !== "high" && s.loyalty >= 35 ? order("raise_taxes") : null, sellConvoy(s, ["wine", "oil", "fish", "cloth", "fleece"]),
      order("build_ship"), b("vineyard"), b("olives"), b("market"), order("recruit"), b("mine"), order("hang_brigands")]) });
    out.push({ who: "prudent", title: "The scribe's prudent plan", orders: fit(s, [
      s.grain < 4.5 ? grainConvoy(s, 3) : null, s.grain < 6 ? b("fishery") : null, crowded ? b("houses") : null,
      s.loyalty < 45 ? (s.last_festival !== s.turn - 1 ? order("hold_festival") : order("lower_taxes")) : order("hear_petitions"),
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

  // --- Applying orders and resolving the season (formulas.md, in order) ---
  async function applyDecrees(s, orders, notes) {
    for (const o of orders) {
      const d = DECREE[o.id];
      const [c, mats] = costOf(s, o);
      s.treasury -= c;
      for (const [g, q] of Object.entries(mats)) s[g] -= q;
      const eff = effectsOf(d);
      if (d.id === "raise_taxes") s.tax = TAX_STEPS[TAX_STEPS.indexOf(s.tax) + 1];
      else if (d.id === "lower_taxes") s.tax = TAX_STEPS[TAX_STEPS.indexOf(s.tax) - 1];
      else if (d.id === "hold_festival") {
        if (s.last_festival === s.turn - 1) { eff.loyalty = (eff.loyalty || 0) / 2; notes.push("A second festival in a row pleases the people less."); }
        s.last_festival = s.turn;
      } else if (d.id === "build") {
        const B = BLD[o.building], wait = Math.trunc(num(B.seasons_to_build));
        s.buildings.push({ kind: B.id, done: s.turn + wait });
        notes.push(`Work begins on ${B.name.toLowerCase()}; ready in turn ${s.turn + wait}${num(B.matures) ? `, first yield ${num(B.matures)} seasons later` : ""}.`);
      } else if (d.id === "build_ship") {
        s.shipyard.push(s.turn + 2);
        notes.push("The keel of a new ship is laid on the slipway; she will be ready in two seasons.");
      } else if (d.id === "send_convoy") {
        if (seasonOf(s.turn)[0].sailing === "no") { useAbility(s, "fleet"); notes.push("Epicadus takes a ship out in winter, when no one else dares: his winter run is spent."); }
        await convoy(s, notes, o);
      } else if (d.id === "hang_brigands") cheer(s, "general", notes, "approves of the hangings");
      else if (d.id === "visit_temple") cheer(s, "priest", notes, "is glad to see the governor at the altar");
      else if (d.id === "hear_petitions") cheer(s, "treasurer", notes, "learns a great deal about who owes what");
      else if (d.id === "listen_sages") {
        s.forecast = drawWeather(s.turn + 1);
        const w = WINDS[s.forecast.wind];
        notes.push(`The sages read the sky: next season brings ${w.id === "CALM" ? "a dead calm" : `${w.latin}, the wind from the ${w.from}`}. ${w.effect}`);
      }
      for (const [n, v] of Object.entries(eff)) s[n] += v;
    }
  }
  async function convoy(s, notes, o) {
    const t = TOWN[o.town];
    const [, delay] = sailing(s, t.direction === "north");
    let deal = 0;
    if (await offerAbility(s, "economist", `I know a man in ${t.name} who will give us a better price (+20%).`)) {
      deal = GOOD_DEAL_BONUS; notes.push(`Nikandros strikes a deal in ${t.name}: the convoy trades at a better price.`);
    }
    // goods leave the stores now; the money for purchases was paid with the order (costOf)
    for (const [g, q] of Object.entries(o.sell || {})) s[g] -= q;
    const revenue = Object.entries(o.sell || {}).reduce((v, [g, q]) => v + q * priceAt(s, t.id, g, "sell", deal), 0);
    if (deal) s.treasury += buyCost(s, o) - Object.entries(o.buy || {}).reduce((v, [g, q]) => v + q * priceAt(s, t.id, g, "buy", deal), 0);
    if (delay) notes.push("Dead calm: the convoy waits a season in harbour before it can sail.");
    s.convoys.push({ town: t.id, out: s.turn, arrive: s.turn + t.seasons + delay, revenue, cargo: { ...(o.buy || {}) }, sold: { ...(o.sell || {}) } });
    notes.push(`A ship sails for ${t.name}` + (Object.keys(o.sell || {}).length ? ` with ${listText(o.sell)}` : "") +
      (Object.keys(o.buy || {}).length ? ` to bring back ${listText(o.buy)}` : "") + `; home in turn ${s.turn + t.seasons + delay}.`);
  }
  async function convoyHome(s, c, notes) {
    const t = TOWN[c.town];
    const [factor] = sailing(s, t.direction !== "north");   // the voyage home runs the other way
    const bonus = Math.round(factor * 10) + (s.council.fleet.mood >= 4 ? 1 : 0);
    const r = await roll(VOYAGE_DIE, bonus, VOYAGE_TARGET, `The ship from ${t.name}`, true);
    let share = 1, how = "safely";
    if (r.r === 1) { share = 0; how = "robbed by pirates off the coast; she limps home empty"; }
    else if (!r.ok) { share = 0.5; how = "battered by a storm; half the cargo went over the side"; }
    else if (r.r === VOYAGE_DIE) { share = 1.1; how = "early on a fair wind, with a little extra trade"; }
    const money = Math.round(c.revenue * share);
    s.treasury += money;
    const got = Object.fromEntries(Object.entries(c.cargo).map(([g, q]) => [g, g === "grain" ? Math.floor(q * Math.min(share, 1) * 10) / 10 : Math.floor(q * Math.min(share, 1))]));
    for (const [g, q] of Object.entries(got)) s[g] += q;
    notes.push(`The ship from ${t.name} comes home ${how} (d20: ${r.r}${bonus ? (bonus > 0 ? " + " : " − ") + Math.abs(bonus) : ""})` +
      (money ? `: ${intc(money)} denarii` : "") + (Object.values(got).some((q) => q > 0) ? `${money ? " and " : ": "}${listText(got)}` : "") + ".");
  }
  async function resolve(s, notes) {
    const [season] = seasonOf(s.turn);
    const arrived = s.convoys.filter((c) => c.arrive <= s.turn);
    s.convoys = s.convoys.filter((c) => c.arrive > s.turn);
    for (const b of s.buildings) if (b.done === s.turn) notes.push(`${BLD[b.kind].name} finished.`);
    const ready = s.shipyard.filter((t) => t <= s.turn);
    if (ready.length) { s.ships += ready.length; s.shipyard = s.shipyard.filter((t) => t > s.turn); notes.push(`${ready.length} new ship${ready.length > 1 ? "s slide" : " slides"} into the harbour.`); }
    // income
    const [rate, rateLoyalty] = TAX_RATES[s.tax];
    s.treasury += Math.round(s.people * rate);
    s.treasury += stat(s, "treasury");
    for (const c of arrived) await convoyHome(s, c, notes);
    // army pay
    const pay = s.army * Math.max(1, ARMY_PAY - stat(s, "army_pay_discount"));
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
    const eaters = s.people + s.army;
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
      for (const [g, q] of Object.entries(made)) s[g] += q;
      if (Object.values(made).some((q) => q > 0)) notes.push(`${B.name}${built(s, B.id) > 1 ? ` (${built(s, B.id)})` : ""}: +${listText(made)}${f < built(s, B.id) ? ", the young ones not yet at full yield" : ""}.`);
      else if (Object.keys(use).length) notes.push(`${B.name}: idle, no ${Object.keys(use).map((g) => nameOf(g).toLowerCase()).join(" or ")} to work.`);
    }
    // people
    if (hunger) s.people = Math.round(s.people * 0.95);
    else if (s.grain >= 3 && s.loyalty >= 50) {
      const room = housing(s);
      if (s.people < room) s.people = Math.min(room, Math.round(s.people * 1.01));
      else notes.push("The town is full: newcomers have nowhere to live. Build a residential district.");
    }
    // loyalty and favour
    s.loyalty += rateLoyalty + (hunger ? LOYALTY_HUNGER : s.grain < 3 ? LOYALTY_LOW_FOOD : 0);
    s.loyalty += stat(s, "loyalty");
    s.favour += stat(s, "favour");
    if (s.loyalty < UNREST_BELOW) { s.favour += UNREST_FAVOUR; notes.push("Unrest in the streets; Rome hears of it."); }
    if (s.army < ORDER_ARMY) s.favour += ORDER_FAVOUR;
  }

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
  function cardFits(s, c) {
    const [season, year] = seasonOf(s.turn);
    const seasons = c.seasons ?? "any";
    if (seasons !== "any" && !seasons.includes(season.season)) return false;
    const [lo, hi] = c.years || [30, 42];
    if (!(lo <= year && year <= hi) || (c.once && s.once_fired.includes(c.id))) return false;
    return triggerHolds(s, c.trigger);
  }
  const weight = (c) => parseFloat(c.chance ?? 0.1);
  function drawSeasonCards(s) {
    const drawn = [];
    for (const [deck] of DECKS) {
      const pool = CARDS.filter((c) => c.deck === deck && cardFits(s, c));
      if (pool.length) drawn.push(choices(pool, pool.map(weight)));
    }
    return drawn;
  }
  const effectsText = (eff) => Object.entries(eff || {}).filter(([n]) => NUMBERS.includes(n))
    .map(([n, v]) => `${nameOf(n).toLowerCase()} ${v > 0 ? "+" : ""}${v}`).join(", ") || "no effect";
  const applyEffects = (s, eff) => { for (const [n, v] of Object.entries(eff || {})) if (NUMBERS.includes(n)) s[n] += v; };
  const darkOmen = (c) => !!c.choice || Object.values(c.effects || {}).some((v) => v < 0);

  async function answerCard(s, c, notes) {
    const ch = c.choice;
    const opts = ch.options.map((o) => ({ label: o.label, sub: o.roll ? `d${o.roll.die || 20} + ${rollBonus(s, o.roll.bonus)}, need ${o.roll.target}` : effectsText(o.effects), roll: !!o.roll }));
    const pick = await ui.cardChoice(c, opts);
    const opt = ch.options[pick];
    const eff = { ...(opt.effects || {}) };
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
      for (const [n, v] of Object.entries(r[ok ? "success" : "failure"] || {})) eff[n] = (eff[n] || 0) + v;
      notes.push(`${c.title}: you chose '${opt.label}' and the die says ${ok ? "success" : "failure"} (${effectsText(eff)}).`);
    } else notes.push(`${c.title}: you chose '${opt.label}' (${effectsText(eff)}).`);
    applyEffects(s, eff);
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
  function clampAndCheck(s, notes) {
    for (const n of CORE) s[n] = Math.min(Math.max(s[n], num(RULES[n].min, 0)), num(RULES[n].max, Infinity));
    for (const g of GOODS) s[g] = Math.max(0, s[g]);
    if (s.loyalty < UPRISING_BELOW) notes.push("Warning: loyalty is so low that an uprising is near.");
    if (s.favour <= 0) s.over = "Recalled to Rome in disgrace: Roman favour reached 0.";
    else if (s.loyalty <= 0 && s.army < ORDER_ARMY) s.over = "Overthrown: the town rose up and the army was too weak to stop it.";
    else if (s.hunger_streak >= 2) s.over = "Replaced for famine: two hungry seasons in a row.";
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
    ["honour_tiberius", /\b(tiberius|inscription|statue|decree\b[^.,;]*\bemperor)\b/],
    ["honour_rome", /\b(gifts?|send\b[^.,;]*\bto rome)\b/],
    ["visit_temple", /\b(sacrific\w*|pray\w*|offering|visit\b[^.,;]*\btemple|go to the temple)\b/],
    ["hold_festival", /\b(festival|games|feast|celebrat\w*|holiday)\b/],
    ["send_convoy", /\b(convoy|sail|trade with|sell|buy|export|import|epidaurum|narona|salona|aquileia|dyrrachium|brundisium)\b/],
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
      const hit = BUILD_WORDS.find(([, rx]) => rx.test(clause));
      const trade = /\b(sell|buy|export|import|convoy)\b/.test(clause);
      if (hit && !trade && (BUILD_VERB.test(clause) || !PATTERNS.some(([, rx]) => rx.test(clause)))) {
        const n = /\b(two|three|four|\d+)\b/.test(clause) ? Math.max(1, numIn(clause)) : 1;
        for (let i = 0; i < Math.min(n, 4); i++) orders.push(order("build", { building: hit[0] }));
        continue;
      }
      const p = PATTERNS.find(([, rx]) => rx.test(clause));
      if (p) orders.push(p[0] === "send_convoy" ? parseConvoy(s, clause, t) : order(p[0]));
    }
    return { orders: orders.slice(0, MAX_ORDERS), reply: orders.length ? "As you command, Governor."
      : "Forgive me, Governor, I could not make a decree of that. Speak of taxes, soldiers, brigands, petitions, a building or planting, a ship's keel, a convoy to a town, a festival, the temple, Tiberius, gifts to Rome or the sages." };
  }

  let ui = null;
  window.Engine = {
    setUI: (u) => { ui = u; }, MAX_ORDERS, CORE, GOODS, GOOD, NUMBERS, RULES, DECREES, DECREE, BLD, BLD_IDS, BUILDING_LIST, ADVISORS, WINDS, TOWNS, TOWN,
    COUNCIL_ORDER, DECK_LABEL, TOWN_PLOTS, FIELD_PLOTS, MOOD_MAX, CURRENT_TEXT, TRIBUTE, SHIP_LOAD, GRAIN_LOAD, VOYAGE_TARGET,
    newGame, seasonOf, rollWeather, revealCards, council, plans, situation, validate, totals, describe, order, costOf, priceAt, loads,
    sailing, abilityState, updateMoods, applyDecrees, resolve, clampAndCheck, wordParse, fmt, intc, pct, housing, berths, shipsAtSea,
    plotsUsed, effectsText, num, parseList, nameOf, unitOf, buildingState, listText,
  };
})();
