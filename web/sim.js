// Bot simulation for the rules: four governor styles play N games each to the end in AD 42.
//   node web/sim.js 40
const fs = require("fs"), vm = require("vm");
const ctx = { window: {}, console, Math, JSON };
vm.createContext(ctx);
for (const f of ["data.js", "engine.js"]) vm.runInContext(fs.readFileSync(require("path").join(__dirname, f), "utf8"), ctx);
const E = ctx.window.Engine;
let style = "econ", s = null, log = { quakes: 0, letters: 0, gambles: 0, wins: 0, rolls: 0 };
const ECON = ["economist", "treasurer", "fleet", "priest"];
const ui = {
  lay: async () => {}, turn: async (c) => { if (c.id === "e010-earthquake") log.quakes++; if (c.letter) log.letters++; },
  decided: async () => {},
  cardChoice: async (c, o) => (style === "random" ? Math.floor(Math.random() * o.length) : 0),
  decide: async (c, i, list) => {
    if (!list.length) return { kind: "none" };
    let k = 0;
    if (style === "random") k = Math.floor(Math.random() * (list.length + 1));
    else if (style === "careful") k = list.findIndex((p) => p.risk === "moderate");
    else if (style === "army") k = list.findIndex((p) => p.who === "general" || p.risk === "risky");
    else { // econ first, army late
      const late = s.turn > 28;
      k = late ? list.findIndex((p) => p.who === "general") : list.findIndex((p) => ECON.includes(p.who));
      if (k < 0) k = list.findIndex((p) => p.risk === "moderate");
    }
    if (k < 0 || k >= list.length) return { kind: "none" };
    if (list[k].risk === "risky") log.gambles++;
    return { kind: "advice", i: k };
  },
  roll: async (r) => { log.rolls++; if (r.ok) log.wins++; }, ability: async () => true, choose: async () => 0, number: async (t, lo, hi) => hi,
};
E.setUI(ui);
(async () => {
  const N = +(process.argv[2] || 20);
  for (style of ["econ", "army", "careful", "random"]) {
    const res = [];
    log = { quakes: 0, letters: 0, gambles: 0, wins: 0, rolls: 0 };
    for (let g = 0; g < N; g++) {
      s = E.newGame();
      const peopleAt = {};
      while (!s.over) {
        E.rollWeather(s);
        s.before = Object.fromEntries(E.NUMBERS.map((n) => [n, s[n]]));
        const notes = [];
        await E.playCards(s, notes);
        const sug = E.suggestions(s);
        let free = [];
        if (style === "econ") free = sug.filter((p) => s.turn > 28 ? true : ECON.includes(p.who)).slice(0, 1);
        else if (style === "army") free = sug.filter((p) => p.who === "general").slice(0, 1);
        else if (style === "careful") free = sug.slice(0, 1);
        else free = Math.random() < .7 && sug.length ? [sug[Math.floor(Math.random() * sug.length)]] : [];
        const [ok] = E.validate(s, free.map((p) => ({ ...p.order })));
        await E.applyDecrees(s, ok, notes);
        await E.resolve(s, notes);
        E.clampAndCheck(s, notes);
        const bad = E.NUMBERS.filter((n) => typeof s[n] !== "number" || Number.isNaN(s[n]));
        if (bad.length) { console.log("NaN", bad, s.turn, notes); process.exit(1); }
        if (s.turn % 12 === 0) peopleAt[s.turn] = s.people;
        s.turn++;
      }
      const sc = E.score(s);
      const tribes = E.TRIBES.map((t) => E.tribeState(s, t.id).state[0]).join("");
      res.push({ fin: !!s.finished, turn: s.turn - 1, score: sc.total, people: s.people, treasury: s.treasury, loy: s.loyalty, fav: s.favour, army: s.army, tribes, over: s.over, p12: peopleAt[12], p24: peopleAt[24], p36: peopleAt[36] });
    }
    const avg = (k) => Math.round(res.reduce((a, r) => a + (r[k] || 0), 0) / res.length);
    const fin = res.filter((r) => r.fin).length;
    const why = {}; for (const r of res.filter((r) => !r.fin)) { const k = r.over.split(":")[0]; why[k] = (why[k] || 0) + 1; }
    const won = res.reduce((a, r) => a + (r.tribes.match(/[ac]/g) || []).length, 0);
    console.log(`${style.padEnd(8)} finished ${fin}/${N}  score ${avg("score")}  people ${avg("people")} (t12 ${avg("p12")}, t24 ${avg("p24")}, t36 ${avg("p36")})  treasury ${avg("treasury")}  loyalty ${avg("loy")}  favour ${avg("fav")}  army ${avg("army")}  tribes won ${won}  lost: ${JSON.stringify(why)}`);
    console.log(`         per game: quakes ${(log.quakes / N).toFixed(2)}, letters ${(log.letters / N).toFixed(1)}, gambles ${(log.gambles / N).toFixed(1)}, dice ${(log.rolls / N).toFixed(1)} (won ${Math.round(100 * log.wins / Math.max(1, log.rolls))}%)`);
  }
})();
