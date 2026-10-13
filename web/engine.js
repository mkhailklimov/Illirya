// Illyria: AD 30 — the rules engine for the browser playtest.
// A port of rules/play.py (formulas.md); keep the two in step when you tune.
// The rules data (numbers, decrees, seasons, advisors, winds, buildings, cards) comes from
// data.js, built by web/build.py from the same CSV and YAML files the terminal game reads.
// Where play.py asks the player with input(), this engine awaits the page's `ui` object.
(function () {
  const D = window.GAME_DATA;

  // --- Formula constants (formulas.md) — same values as play.py ---
  const TAX_RATES = { low: [0.25, +2], normal: [0.5, 0], high: [0.75, -4] };
  const TAX_STEPS = ["low", "normal", "high"];
  const ARMY_PAY = 4, TRIBUTE = 3000, TRIBUTE_PAID_FAVOUR = 5, TRIBUTE_MISSED_FAVOUR = -20, TRIBUTE_DEBT_PENALTY = 1.5;
  const GRAIN_EATEN = 3, GRAIN_BASE_EATERS = 4000;
  const TOWN_PLOTS = 12, FIELD_PLOTS = 12, BASE_WHEAT = 4, ARMY_GOODS_PER = 50;
  const GRAIN_PRICE = 500, WINE_OIL_PRICE = 60, GOODS_PRICE = 15;
  const LOYALTY_LOW_FOOD = -3, LOYALTY_HUNGER = -10, UNREST_BELOW = 30, UNREST_FAVOUR = -3, UPRISING_BELOW = 20;
  const ORDER_ARMY = 100, ORDER_FAVOUR = -1;
  const DECKS = [["land", "Land"], ["sea", "Sea"], ["omen", "Omen"]];
  const CURRENT_DIE = 6, SAIL_STEP = 0.10, SAIL_CAP = 0.30, ROLL_BONUS_CAP = 5;
  const MOOD_START = 3, MOOD_MAX = 5, MOOD_SULK = 1, IGNORED_LIMIT = 2, LEAD_CHARGE_BONUS = 2, GOOD_DEAL_BONUS = 0.20;
  const COUNCIL_ORDER = ["treasurer", "economist", "general", "fleet", "priest"];
  const NUMBERS = ["grain", "treasury", "goods", "wine_oil", "people", "loyalty", "favour", "army", "ships"];

  const num = (v, d = 0) => { if (v === null || v === undefined) return d; if (typeof v === "number") return v; v = String(v).trim(); return v ? parseFloat(v) : d; };
  const byId = (rows) => Object.fromEntries(rows.map((r) => [r.id, r]));
  const RULES = byId(D.numbers), DECREES = D.decrees, DECREE = byId(D.decrees);
  const SEASONS = [...D.seasons].sort((a, b) => +a.order - +b.order);
  const ADVISORS = byId(D.advisors), WINDS = byId(D.winds), BUILDING_LIST = D.buildings, BLD = byId(D.buildings);
  const BLD_IDS = BUILDING_LIST.map((b) => b.id);
  const CARDS = D.cards;
  const DECK_LABEL = Object.fromEntries(DECKS);

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

  // --- Game state ---
  const startBuildings = () => BUILDING_LIST.flatMap((b) => Array.from({ length: num(b.start) }, () => ({ kind: b.id, done: 0 })));
  const newCouncil = () => Object.fromEntries(Object.keys(ADVISORS).map((a) => [a, { mood: MOOD_START, ignored: 0, used: null }]));
  function newGame() {
    const s = Object.fromEntries(NUMBERS.map((n) => [n, num(RULES[n].start)]));
    Object.assign(s, { turn: 1, tax: "normal", buildings: startBuildings(), shipyard: [], convoys: [], tribute_debt: 0,
      wind: "E", current: 1, weather_turn: 0, hunger_streak: 0, last_festival: -9, once_fired: [], over: null, council: newCouncil() });
    return s;
  }
  const seasonOf = (turn) => [SEASONS[(turn - 1) % SEASONS.length], 30 + Math.floor((turn - 1) / SEASONS.length)];
  const built = (s, kind, turn) => { turn = turn ?? s.turn; return s.buildings.filter((b) => b.kind === kind && turn >= b.done).length; };
  const stat = (s, field) => s.buildings.filter((b) => s.turn >= b.done).reduce((t, b) => t + num(BLD[b.kind][field]), 0);
  const plotsUsed = (s, zone) => s.buildings.filter((b) => BLD[b.kind].zone === zone).length;
  const zonePlots = (zone) => (zone === "town" ? TOWN_PLOTS : FIELD_PLOTS);
  const shipsAtSea = (s) => s.convoys.reduce((t, c) => t + (c.ship ?? 1), 0);
  const berths = (s) => Math.trunc(stat(s, "ships_cap"));
  const housing = (s) => Math.trunc(stat(s, "housing"));
  const turnsToTribute = (s) => [0, 1, 2, 3].find((i) => seasonOf(s.turn + i)[0].tribute_due === "yes");

  // --- Dice and weather ---
  async function roll(die, bonus, target, why) {
    const r = rint(1, die), total = r + bonus;
    let ok = null, tag = null;
    if (target !== undefined && target !== null) {
      ok = total >= target;
      if (r === die) { ok = true; tag = "Critical success"; }
      else if (r === 1) { ok = false; tag = "Critical failure"; }
      else tag = ok ? "Success" : "Failure";
    }
    await ui.roll({ die, r, bonus, total, target, ok, tag, why });
    return [total, ok];
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
  function rollWeather(s) {
    if (s.weather_turn === s.turn) return;
    const key = "weight_" + seasonOf(s.turn)[0].season.toLowerCase();
    const ids = Object.keys(WINDS);
    s.wind = choices(ids, ids.map((i) => num(WINDS[i][key], 1)));
    const c = rint(1, CURRENT_DIE);
    s.current = c === 1 ? 0 : c === CURRENT_DIE ? 2 : 1;
    s.weather_turn = s.turn;
  }
  const CURRENT_TEXT = { 0: "slack", 1: "running north along our coast", 2: "running strongly north along our coast" };
  function sailing(s, north) {
    const w = WINDS[s.wind];
    const adv = num(w[north ? "sail_north" : "sail_south"]) + (north ? s.current : -s.current);
    return [Math.max(-SAIL_CAP, Math.min(SAIL_CAP, adv * SAIL_STEP)), Math.trunc(num(w.delay))];
  }

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
  function updateMoods(s, wants, orders, notes) {
    for (const [aid, want] of Object.entries(wants)) {
      if (!want) continue;
      const st = s.council[aid], name = ADVISORS[aid].name;
      if (orders.some(want)) {
        st.ignored = 0;
        if (st.mood < MOOD_MAX) { st.mood += 1; notes.push(`${name} is pleased you took his advice (mood ${st.mood}/${MOOD_MAX}).`); }
        continue;
      }
      st.ignored += 1;
      if (st.ignored >= IGNORED_LIMIT && st.mood > 0) {
        st.mood -= 1; st.ignored = 0;
        const sulk = st.mood === MOOD_SULK ? " He sulks and will not use his gifts for you." : "";
        notes.push(`${name} feels ignored (mood ${st.mood}/${MOOD_MAX}).${sulk}`);
      }
    }
  }
  const convoyFor = (cargo, direction) => (o) => o.id === "send_convoy" && (cargo == null || o.cargo === cargo) && (direction == null || o.direction === direction);
  const decreeIs = (...ids) => (o) => ids.includes(o.id);
  const buildOf = (...kinds) => (o) => o.id === "build" && kinds.includes(o.building);

  function council(s) {
    const wants = {}, say = {};
    const [season] = seasonOf(s.turn);
    const ttt = turnsToTribute(s);
    const income = s.people * TAX_RATES[s.tax][0] - s.army * ARMY_PAY;
    const due = TRIBUTE + s.tribute_debt;
    const moneyWant = (o) => decreeIs("raise_taxes")(o) || convoyFor("sell_wine_oil")(o) || convoyFor("sell_goods")(o);
    if (s.tribute_grace === s.turn) { say.treasurer = `Rome's season of grace ends now: ${intc(due)} denarii are due this season.`; wants.treasurer = moneyWant; }
    else if (s.treasury + income * (ttt + 1) < due) { say.treasurer = `At this rate we cannot pay Rome's ${intc(due)} denarii when the tribute falls due.`; wants.treasurer = moneyWant; }
    else say.treasurer = `The chest holds ${intc(s.treasury)} denarii. Tribute of ${intc(due)} is due ${ttt === 0 ? "this season" : `in ${ttt} season${ttt > 1 ? "s" : ""}`}.`;
    const mult = num(WINDS[s.wind].harvest_mult, 1);
    if (s.grain < 3) { say.economist = `Only ${s.grain.toFixed(1)} months of grain left. Buy grain by convoy or the people will starve.`; wants.economist = convoyFor("buy_grain"); }
    else if (s.grain < 6) { say.economist = "Our fields feed us only 8 months a year. More wheat terraces, a fishery or bought grain, Governor, or we go short."; wants.economist = (o) => convoyFor("buy_grain")(o) || buildOf("wheat", "fishery")(o); }
    else if (s.wine_oil >= 10 && season.sailing === "yes") { say.economist = `${Math.trunc(s.wine_oil)} amphorae wait in the stores. Brundisium pays well for wine and oil.`; wants.economist = convoyFor("sell_wine_oil"); }
    else if (mult !== 1 && num(season.harvest_grain) > 0) say.economist = `With this wind the harvest will be ${mult > 1 ? "better" : "worse"} than usual (${pct(mult - 1)}).`;
    else { say.economist = "The markets are steady. A workshop would give us goods to sell."; wants.economist = buildOf("workshop"); }
    if (s.army < ORDER_ARMY) { say.general = `Only ${Math.trunc(s.army)} men. Rome expects order, and so do the hill tribes.`; wants.general = decreeIs("recruit"); }
    else if (s.loyalty < 40) { say.general = "The mood in the streets is sour. My men can keep order, but not forever. Pay them well and recruit."; wants.general = decreeIs("recruit"); }
    else say.general = `The garrison of ${Math.trunc(s.army)} stands ready. Its pay is ${intc(s.army * ARMY_PAY)} denarii a season.`;
    const [north] = sailing(s, true), [south] = sailing(s, false);
    if (season.sailing === "no") say.fleet = "Mare clausum. No ship of mine leaves the bay until spring.";
    else if (s.wind === "CALM") say.fleet = "Not a breath of wind. Any convoy we send will sit a season in harbour.";
    else if (north > south) { say.fleet = `Wind and current favour a voyage north up the coast (${pct(north)} on prices).`; wants.fleet = convoyFor(null, "north"); }
    else if (south > north) { say.fleet = `The wind is with us for a voyage south (${pct(south)} on prices).`; wants.fleet = convoyFor(null, "south"); }
    else say.fleet = "The sea is open; wind and current favour neither course.";
    if (s.loyalty < 40) { say.priest = "The people murmur against you. A festival would please the gods and men alike."; wants.priest = decreeIs("hold_festival"); }
    else if (s.favour < 40) { say.priest = "The omens from Rome are cold. Gifts to the Emperor would warm them."; wants.priest = decreeIs("honour_rome"); }
    else say.priest = "The omens are calm.";
    return { wants, say };
  }

  // --- Decrees ---
  const effectsOf = (d) => Object.fromEntries(NUMBERS.filter((n) => String(d[n] ?? "").trim()).map((n) => [n, num(d[n])]));
  const order = (id, direction = "none", cargo = "none", amount = 0, building = "none") => ({ id, direction, cargo, amount: Math.trunc(amount || 0), building });
  function costOf(o) {
    if (o.id === "build" && BLD[o.building]) return [num(BLD[o.building].cost_treasury), num(BLD[o.building].cost_goods)];
    const d = DECREE[o.id];
    return [num(d.cost_treasury), num(d.cost_goods)];
  }
  const grainPrice = (s, direction) => Math.round(GRAIN_PRICE * (1 - sailing(s, direction === "north")[0] - stat(s, "trade_bonus")));
  function describe(s, o) {
    const d = DECREE[o.id];
    if (o.id === "build") { const b = BLD[o.building]; return b ? `Build ${b.name.toLowerCase()}` : "Build (what?)"; }
    if (o.id !== "send_convoy") return d.name;
    const where = { north: "north up the coast", south: "south" }[o.direction] || "";
    let what = "";
    if (o.cargo === "buy_grain") what = o.amount ? `to buy ${o.amount} month${o.amount !== 1 ? "s" : ""} of grain` : "to buy grain";
    else if (o.cargo === "sell_wine_oil") what = o.amount ? `to sell ${o.amount} amphorae of wine and oil` : "to sell wine and oil";
    else if (o.cargo === "sell_goods") what = o.amount ? `to sell ${o.amount} goods` : "to sell goods";
    return ["Send a convoy", where, what].filter(Boolean).join(" ");
  }
  function validate(s, orders) {
    const [season] = seasonOf(s.turn);
    let treasury = s.treasury, goods = s.goods, tax = s.tax;
    const accepted = [], problems = [], seen = new Set(), newPlots = { town: 0, field: 0 }, newKinds = {};
    let newShips = 0, convoys = 0;
    for (const o of orders.slice(0, 3)) {
      o.building = o.building || "none";
      const d = DECREE[o.id];
      if (!d) { problems.push(`'${o.id}' is not a decree of this province.`); continue; }
      if (seen.has(o.id) && ["raise_taxes", "lower_taxes", "send_convoy", "hold_festival"].includes(o.id)) { problems.push(`'${d.name}' only once a season.`); continue; }
      let [c, g] = costOf(o);
      if (o.id === "build") {
        const b = BLD[o.building];
        if (!b) { problems.push("The architect asks: build what?"); continue; }
        if (plotsUsed(s, b.zone) + newPlots[b.zone] >= zonePlots(b.zone)) { problems.push(`No free plot ${b.zone === "town" ? "inside the walls" : "in the fields"} for ${b.name.toLowerCase()}.`); continue; }
        const have = s.buildings.filter((x) => x.kind === b.id).length + (newKinds[b.id] || 0);
        if (have >= Math.trunc(num(b.max, 99))) { problems.push(`Acruvium already has as many ${b.name.toLowerCase()} as it can hold (${Math.trunc(num(b.max))}).`); continue; }
      }
      if (o.id === "build_ship" && Math.trunc(s.ships) + s.shipyard.length + newShips >= berths(s)) { problems.push(`Epicadus: no free berth for another ship (berths for ${berths(s)}); build a second harbour first.`); continue; }
      if (o.id === "send_convoy") {
        if (season.sailing === "no" && !abilityReady(s, "fleet")) { problems.push("Epicadus refuses: no convoys in winter (mare clausum)."); continue; }
        if (Math.trunc(s.ships) - shipsAtSea(s) - convoys < 1) { problems.push("Epicadus: every ship is at sea or lost; there is none to send."); continue; }
        if (o.cargo === "buy_grain" && o.amount && ["north", "south"].includes(o.direction)) c += o.amount * grainPrice(s, o.direction);
        if ((o.cargo === "sell_wine_oil" && s.wine_oil < 1) || (o.cargo === "sell_goods" && goods < 1)) { problems.push("Nikandros: there is nothing in the stores to sell."); continue; }
      }
      if (o.id === "raise_taxes") { if (tax === "high") { problems.push("Taxes are already high."); continue; } tax = TAX_STEPS[TAX_STEPS.indexOf(tax) + 1]; }
      if (o.id === "lower_taxes") { if (tax === "low") { problems.push("Taxes are already low."); continue; } tax = TAX_STEPS[TAX_STEPS.indexOf(tax) - 1]; }
      if (c > treasury || g > goods) { problems.push(`Felix shakes his head: not enough for '${describe(s, o)}' (${intc(c)} denarii${g ? `, ${Math.trunc(g)} goods` : ""}).`); continue; }
      treasury -= c; goods -= g;
      if (o.id === "build") { newPlots[BLD[o.building].zone] += 1; newKinds[o.building] = (newKinds[o.building] || 0) + 1; }
      if (o.id === "build_ship") newShips += 1;
      if (o.id === "send_convoy") convoys += 1;
      accepted.push(o); seen.add(o.id);
    }
    return [accepted, problems];
  }
  function preview(s, orders) {
    let cost = 0, goods = 0, loyalty = 0, favour = 0;
    const extra = [];
    for (const o of orders) {
      const d = DECREE[o.id];
      const [c, g] = costOf(o);
      cost += c; goods += g;
      const eff = effectsOf(d);
      loyalty += eff.loyalty || 0; favour += eff.favour || 0;
      if (o.id === "send_convoy" && o.cargo === "buy_grain") cost += o.amount * grainPrice(s, o.direction);
      if (o.id === "raise_taxes" && TAX_STEPS.indexOf(s.tax) === 1) extra.push("then −4 loyalty every season at high taxes");
      if (o.id === "send_convoy" && ["north", "south"].includes(o.direction)) {
        const [factor, delay] = sailing(s, o.direction === "north");
        if (factor) extra.push(`wind and current ${pct(factor)} on convoy prices`);
        if (delay) extra.push("dead calm: the convoy waits a season");
      }
      if (o.id === "build" && BLD[o.building]) extra.push(`${BLD[o.building].short.toLowerCase()} ready in ${Math.trunc(num(BLD[o.building].seasons_to_build))} seasons`);
      if (o.id === "build_ship") extra.push("ship ready next season");
      if (o.id === "send_convoy" && seasonOf(s.turn)[0].sailing === "no") extra.push("Epicadus's winter run (once per governorship)");
    }
    const parts = [`costs ${intc(cost)} denarii` + (goods ? `, ${Math.trunc(goods)} goods` : "")];
    if (loyalty) parts.push(`loyalty ${loyalty > 0 ? "+" : ""}${loyalty}`);
    if (favour) parts.push(`Rome ${favour > 0 ? "+" : ""}${favour}`);
    return parts.concat(extra).join("; ");
  }
  function suggest(s) {
    const [season] = seasonOf(s.turn);
    const canSail = season.sailing === "yes" && s.wind !== "CALM";
    const [north] = sailing(s, true), [south] = sailing(s, false);
    const best = north >= south ? "north" : "south";
    const ttt = turnsToTribute(s);
    const income = s.people * TAX_RATES[s.tax][0] - s.army * ARMY_PAY;
    const short = s.treasury + income * (ttt + 1) < TRIBUTE + s.tribute_debt;
    const build = (wishes) => {
      const chosen = [];
      for (const o of wishes) {
        if (chosen.length === 3) break;
        if (chosen.some((c) => c.id === o.id)) continue;
        const [ok] = validate(s, chosen.concat([{ ...o }]));
        if (ok.length === chosen.length + 1) chosen.push(o);
      }
      return chosen;
    };
    const b = (kind) => order("build", "none", "none", 0, kind);
    let prudent = [];
    if (s.grain < 4.5) {
      if (canSail) { const gp = grainPrice(s, best); prudent.push(order("send_convoy", best, "buy_grain", Math.max(1, Math.min(3, Math.floor((s.treasury * 0.5) / gp))))); }
      prudent.push(b("fishery"), b("wheat"));
    }
    if (s.people > housing(s) * 0.95) prudent.push(b("houses"));
    if (s.loyalty < 45) prudent.push(s.last_festival !== s.turn - 1 ? order("hold_festival") : order("lower_taxes"));
    if (s.favour < 45 && !short) prudent.push(order("honour_rome"));
    if (!short) prudent.push(b("wheat"), b("workshop"), b("temple"));
    prudent = short ? build(prudent).slice(0, 2) : build(prudent);
    let bold = [];
    if (s.tax !== "high" && s.loyalty >= 35) bold.push(order("raise_taxes"));
    else if (s.loyalty < 35 && s.army < 250) bold.push(order("recruit"));
    if (canSail && s.wine_oil >= 6) bold.push(order("send_convoy", best, "sell_wine_oil", Math.trunc(s.wine_oil)));
    if (Math.trunc(s.ships) - shipsAtSea(s) < 1) bold.push(order("build_ship"));
    bold.push(b("vineyard"), b("market"), b("workshop"), order("recruit"));
    bold = build(bold);
    return [bold, prudent];
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

  // --- Applying decrees and resolving the season (formulas.md, in order) ---
  async function applyDecrees(s, orders, notes) {
    for (const o of orders) {
      const d = DECREE[o.id];
      const [c, g] = costOf(o);
      s.treasury -= c; s.goods -= g;
      const eff = effectsOf(d);
      if (d.id === "raise_taxes") s.tax = TAX_STEPS[TAX_STEPS.indexOf(s.tax) + 1];
      else if (d.id === "lower_taxes") s.tax = TAX_STEPS[TAX_STEPS.indexOf(s.tax) - 1];
      else if (d.id === "hold_festival") {
        if (s.last_festival === s.turn - 1) { eff.loyalty = (eff.loyalty || 0) / 2; notes.push("A second festival in a row pleases the people less."); }
        s.last_festival = s.turn;
      } else if (d.id === "build") {
        const b = BLD[o.building], wait = Math.trunc(num(b.seasons_to_build));
        s.buildings.push({ kind: b.id, done: s.turn + wait });
        notes.push(`Work begins on ${b.name.toLowerCase()}; ready in turn ${s.turn + wait}.`);
      } else if (d.id === "build_ship") {
        s.shipyard.push(s.turn + Math.trunc(num(d.seasons_to_finish, 1)));
        notes.push("A new ship is laid down on the slipway.");
      } else if (d.id === "send_convoy") {
        if (seasonOf(s.turn)[0].sailing === "no") { useAbility(s, "fleet"); notes.push("Epicadus takes a ship out in winter, when no one else dares: his winter run is spent."); }
        await convoy(s, notes, o);
      }
      for (const [n, v] of Object.entries(eff)) s[n] += v;
    }
  }
  async function convoy(s, notes, o) {
    let north;
    if (["north", "south"].includes(o.direction)) north = o.direction === "north";
    else north = (await ui.choose("Epicadus: which way?", "", [{ label: "North up the coast", sub: "Narona, Salona, Aquileia" }, { label: "South", sub: "Dyrrachium, Brundisium" }])) === 0;
    let [factor, delay] = sailing(s, north);
    factor += stat(s, "trade_bonus");
    if (await offerAbility(s, "economist", "I know a man in the port who will give us a better price (+20%).")) {
      factor += GOOD_DEAL_BONUS; notes.push("Nikandros strikes a deal: the convoy trades at a better price.");
    }
    if (delay) notes.push("Dead calm: the convoy waits a season in harbour before it can sail.");
    const kinds = { buy_grain: 1, sell_wine_oil: 2, sell_goods: 3 };
    const kind = kinds[o.cargo] || 1 + (await ui.choose("Nikandros: what shall the convoy do?", "", [{ label: "Buy grain" }, { label: "Sell wine & oil" }, { label: "Sell goods" }]));
    const c = { arrive: s.turn + 1 + delay, grain: 0, treasury: 0, ship: 1 };
    const gp = Math.round(GRAIN_PRICE * (1 - factor));
    if (kind === 1) {
      const most = Math.min(Math.floor(s.treasury / gp), 12);
      if (most < 1) notes.push("The convoy sails empty: no money to buy grain.");
      else {
        const m = o.amount ? Math.min(o.amount, most) : await ui.number(`Months of grain to buy at ${gp} denarii each`, 1, most);
        s.treasury -= m * gp; c.grain = m;
        notes.push(`A convoy sails ${north ? "north" : "south"} to buy ${m} months of grain at ${gp} denarii each.`);
      }
    } else {
      const [key, base] = kind === 2 ? ["wine_oil", WINE_OIL_PRICE] : ["goods", GOODS_PRICE];
      const price = Math.round(base * (1 + factor)), have = Math.trunc(s[key]);
      if (have < 1) notes.push(`The convoy sails empty: no ${RULES[key].name.toLowerCase()} to sell.`);
      else {
        const q = o.amount ? Math.min(o.amount, have) : await ui.number(`How many to sell at ${price} denarii each`, 1, have);
        s[key] -= q; c.treasury = q * price;
        notes.push(`A convoy sails ${north ? "north" : "south"} with ${q} ${RULES[key].unit} to sell at ${price} each.`);
      }
    }
    s.convoys.push(c);
  }
  async function resolve(s, notes) {
    const [season] = seasonOf(s.turn);
    const arrived = s.convoys.filter((c) => c.arrive <= s.turn);
    s.convoys = s.convoys.filter((c) => c.arrive > s.turn);
    for (const b of s.buildings) if (b.done === s.turn && b.done > 0) notes.push(`${BLD[b.kind].name} finished.`);
    const ready = s.shipyard.filter((t) => t <= s.turn);
    if (ready.length) { s.ships += ready.length; s.shipyard = s.shipyard.filter((t) => t > s.turn); notes.push(`${ready.length} new ship${ready.length > 1 ? "s slide" : " slides"} into the harbour.`); }
    const [rate, rateLoyalty] = TAX_RATES[s.tax];
    s.treasury += Math.round(s.people * rate);
    s.treasury += stat(s, "treasury");
    for (const c of arrived) if (c.treasury) { s.treasury += c.treasury; notes.push(`The convoy returns with ${intc(c.treasury)} denarii.`); }
    const pay = s.army * Math.max(1, ARMY_PAY - stat(s, "army_pay_discount"));
    if (s.treasury >= pay) s.treasury -= pay;
    else {
      const unpaid = (pay - s.treasury) / pay; s.treasury = 0;
      const tens = Math.ceil(unpaid * 10), lost = Math.round(s.army * 0.05 * tens);
      s.army -= lost; s.loyalty -= 3 * tens;
      notes.push(`The soldiers were not fully paid: ${lost} desert and some take what they are owed.`);
    }
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
    const eaters = s.people + s.army;
    const mult = num(WINDS[s.wind].harvest_mult, 1);
    let harvest = num(season.harvest_grain) * built(s, "wheat") / BASE_WHEAT * GRAIN_BASE_EATERS / eaters * mult;
    if (harvest && mult !== 1) notes.push(`The wind made the harvest ${mult > 1 ? "richer" : "poorer"} (${pct(mult - 1)}).`);
    harvest += stat(s, "grain");
    const bought = arrived.reduce((t, c) => t + c.grain, 0);
    if (bought) notes.push(`The convoy unloads ${bought} months of grain.`);
    s.grain = Math.round((s.grain + harvest + bought - GRAIN_EATEN) * 10) / 10;
    const hunger = s.grain <= 0;
    s.grain = Math.max(s.grain, 0);
    s.hunger_streak = hunger ? s.hunger_streak + 1 : 0;
    if (hunger) notes.push("The granaries are empty. People go hungry.");
    s.goods += stat(s, "goods") - Math.floor(s.army / ARMY_GOODS_PER);
    const groves = stat(s, "wine_oil") * (season.season === "Autumn" ? 2 : 1);
    s.wine_oil += groves;
    if (groves) notes.push(`The vineyards and olive groves yield ${Math.trunc(groves)} amphorae.`);
    if (hunger) s.people = Math.round(s.people * 0.95);
    else if (s.grain >= 3 && s.loyalty >= 50) {
      const room = housing(s);
      if (s.people < room) s.people = Math.min(room, Math.round(s.people * 1.01));
      else notes.push("The town is full: newcomers have nowhere to live. Build a residential district.");
    }
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
    const a = s[m[1]], b = parseFloat(m[3]);
    return { "<": a < b, "<=": a <= b, ">": a > b, ">=": a >= b, "==": a === b }[m[2]];
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
    .map(([n, v]) => `${RULES[n].name.toLowerCase()} ${v > 0 ? "+" : ""}${v}`).join(", ") || "no effect";
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
      let [total, ok] = await roll(Math.trunc(r.die || 20), bonus, target, opt.label);
      const naturalOne = total - bonus === 1;
      const battle = String(r.bonus ?? "").includes("army");
      if (battle && !ok && !naturalOne && total + LEAD_CHARGE_BONUS >= target &&
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
    for (const n of NUMBERS) s[n] = Math.min(Math.max(s[n], num(RULES[n].min, 0)), num(RULES[n].max, Infinity));
    if (s.loyalty < UPRISING_BELOW) notes.push("Warning: loyalty is so low that an uprising is near.");
    if (s.favour <= 0) s.over = "Recalled to Rome in disgrace: Roman favour reached 0.";
    else if (s.loyalty <= 0 && s.army < ORDER_ARMY) s.over = "Overthrown: the town rose up and the army was too weak to stop it.";
    else if (s.hunger_streak >= 2) s.over = "Replaced for famine: two hungry seasons in a row.";
  }

  // --- The scribe's word matcher (rules/scribe.py, offline path) ---
  const PATTERNS = [
    ["raise_taxes", /\b(raise|increase|higher|up|double)\b[^.,;]*\btax|\btax\w*\b[^.,;]*\b(up|higher|raise|increase)/],
    ["lower_taxes", /\b(lower|reduce|cut|ease|less)\b[^.,;]*\btax|\btax\w*\b[^.,;]*\b(down|lower|cut)/],
    ["dismiss", /\b(dismiss|disband|release|send home|discharge)\b/],
    ["recruit", /\b(recruit|hire|levy|enlist|raise (an )?army|more (soldiers|men|troops))\b/],
    ["build_ship", /\b(build|lay down|construct|new)\b[^.,;]*\b(ship|galley|boat)s?\b/],
    ["send_convoy", /\b(convoy|ships?|sail|trade|merchant\w*|buy grain|import|sell|export)\b/],
    ["hold_festival", /\b(festival|games|feast|celebrat\w*|holiday)\b/],
    ["honour_rome", /\b(gift|gifts|honou?r (rome|the emperor)|tribute to (the )?emperor|send .* to rome)\b/],
  ];
  const BUILD_WORDS = [
    ["harbour", /\b(harbou?rs?|port|docks?|quay|berths?)\b/], ["houses", /\b(houses?|homes?|districts?|dwellings?|insula\w*|housing)\b/],
    ["market", /\bmarket\w*\b/], ["temple", /\b(temples?|shrine)\b/], ["barracks", /\bbarracks?\b/], ["baths", /\bbaths?\b/],
    ["walls", /\b(walls?|towers?|fortif\w*)\b/], ["workshop", /\b(workshops?|smithy|forge|weav\w*|looms?|potter\w*|armou?rer)\b/],
    ["fishery", /\b(fisher\w*|fishing)\b/], ["pasture", /\b(pastures?|sheep|wool|flocks?)\b/],
    ["vineyard", /\b(vine\w*|olive groves?|groves?|orchards?|plant\w*)\b/], ["wheat", /\b(terraces?|wheat|farmland|fields?|farms?)\b/],
  ];
  const TRADE_WORDS = /\b(sell|buy|export|import|convoy)\b/;
  const GREEDY = /\b(make me rich|free money|\d{4,} denarii|i am the emperor|ignore (the|your) rules|infinite|unlimited)\b/;
  const WORD_NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, a: 1, an: 1 };
  function amountIn(text) {
    const m = text.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/);
    return m ? (/^\d+$/.test(m[1]) ? parseInt(m[1], 10) : WORD_NUM[m[1]]) : 0;
  }
  function wordParse(text) {
    const t = text.toLowerCase();
    if (GREEDY.test(t)) return { orders: [], reply: "Governor, the treasury holds what it holds; not even the Emperor's own scribe can write denarii into being. Shall I draw up a real decree instead?" };
    const orders = [], seen = new Set();
    for (let clause of t.split(/\band then\b|\bthen\b|\band\b|[,;.]/)) {
      clause = clause.trim();
      if (!clause) continue;
      if (!TRADE_WORDS.test(clause) && !PATTERNS[4][1].test(clause)) {
        const hit = BUILD_WORDS.find(([, rx]) => rx.test(clause));
        if (hit) {
          const n = /\b(two|three|\d+)\b/.test(clause) ? Math.max(1, amountIn(clause)) : 1;
          for (let i = 0; i < Math.min(n, 3); i++) orders.push(order("build", "none", "none", 0, hit[0]));
          continue;
        }
      }
      for (const [did, rx] of PATTERNS) {
        if (seen.has(did) || !rx.test(clause)) continue;
        const o = order(did);
        if (did === "send_convoy") {
          o.direction = /\bsouth|brundisium|dyrrachium|italy\b/.test(t) ? "south" : "north";
          o.cargo = /\b(sell|export)\b[^.,;]*\b(wine|oil|amphor)/.test(clause) ? "sell_wine_oil"
            : /\b(sell|export)\b[^.,;]*\b(goods|tools|cloth|pottery)/.test(clause) ? "sell_goods" : "buy_grain";
          o.amount = amountIn(clause);
        }
        orders.push(o); seen.add(did);
        break;
      }
    }
    return { orders: orders.slice(0, 3), reply: orders.length ? "As you command, Governor."
      : "Forgive me, Governor, I could not make a decree of that. Speak of taxes, soldiers, a building (houses, temple, market, terraces...), a ship, a convoy, a festival or gifts to Rome." };
  }

  let ui = null;
  window.Engine = {
    setUI: (u) => { ui = u; }, NUMBERS, RULES, DECREES, DECREE, BLD, BLD_IDS, BUILDING_LIST, ADVISORS, WINDS, COUNCIL_ORDER, DECK_LABEL,
    TOWN_PLOTS, FIELD_PLOTS, MOOD_MAX, CURRENT_TEXT, TRIBUTE,
    newGame, seasonOf, rollWeather, revealCards, council, suggest, situation, validate, preview, describe, order, costOf, grainPrice,
    sailing, abilityState, updateMoods, applyDecrees, resolve, clampAndCheck, wordParse, fmt, intc, pct, housing, berths, shipsAtSea,
    plotsUsed, effectsText, num,
  };
})();
