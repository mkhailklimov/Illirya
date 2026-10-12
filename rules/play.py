"""Illyria: AD 30 — play "The Governor" in the terminal (Phase 0 playtest tool).

It applies the rules in this folder so you can play and tune without doing the
sums by hand. Change numbers.csv, decrees.csv, seasons.csv, advisors.csv or the
event cards in ../events/ and the game changes with them. The formula constants
below follow formulas.md; keep the two in step when you tune.

    python rules/play.py          continue the saved game, or start one
    python rules/play.py --new    start a new game

Each turn is written to rules/playtest-runs/ (one CSV per game) so the bot's
engine tests can replay it later.
"""
import csv
import datetime
import glob
import json
import math
import os
import random
import re
import sys

import yaml

import scribe

HERE = os.path.dirname(os.path.abspath(__file__))
RUNS = os.path.join(HERE, "playtest-runs")
SAVE = os.path.join(RUNS, "save.json")
EVENTS = os.path.join(HERE, "..", "events")

# --- Formula constants (formulas.md). DRAFT: tune these with the CSVs. ---
TAX_RATES = {"low": (0.25, +2), "normal": (0.5, 0), "high": (0.75, -4)}  # denarii/person, loyalty/season
TAX_STEPS = ["low", "normal", "high"]
ARMY_PAY = 4                 # denarii per soldier per season
TRIBUTE = 3000               # denarii, due in seasons with tribute_due = yes
TRIBUTE_PAID_FAVOUR = 5
TRIBUTE_MISSED_FAVOUR = -20
TRIBUTE_DEBT_PENALTY = 1.5   # unpaid tribute carries over with 50% added
GRAIN_EATEN = 3              # months of supply eaten per season
GRAIN_BASE_EATERS = 4000     # harvest_grain in seasons.csv is for this many eaters
# City and fields (buildings.csv; formulas.md "The city and its fields")
TOWN_PLOTS, FIELD_PLOTS = 12, 12   # plots inside the walls (incl. harbour and walls) and around the bay
BASE_WHEAT = 4               # seasons.csv harvest_grain is what these 4 starting wheat terraces give
ARMY_GOODS_PER = 50          # 1 goods per 50 soldiers per season
GRAIN_PRICE = 500            # denarii per month of supply bought by convoy
WINE_OIL_PRICE = 60          # denarii per amphora sold by convoy
GOODS_PRICE = 15             # denarii per unit of goods sold by convoy
LOYALTY_LOW_FOOD, LOYALTY_HUNGER = -3, -10
UNREST_BELOW, UNREST_FAVOUR = 30, -3
UPRISING_BELOW = 20
ORDER_ARMY, ORDER_FAVOUR = 100, -1
DECKS = [("land", "LAND"), ("sea", "SEA"), ("omen", "OMEN")]  # one card from each, every season
# Weather and the sea (winds.csv; formulas.md "Weather and the sea")
CURRENT_DIE = 6              # d6 each season: 1 slack, 2-5 running, 6 strong
SAIL_STEP, SAIL_CAP = 0.10, 0.30   # convoy price change per point of sailing advantage, and its limit
ROLL_BONUS_CAP = 5           # most a number can add to a die roll
# The council as characters (advisors.csv; formulas.md "The council")
MOOD_START, MOOD_MAX = 3, 5  # each advisor's mood, 0-5
MOOD_SULK = 1                # at or below this an advisor sulks and will not use his ability
IGNORED_LIMIT = 2            # seasons in a row his advice is ignored before his mood drops
LEAD_CHARGE_BONUS = 2        # Antistius: added to a battle roll after it is rolled
GOOD_DEAL_BONUS = 0.20       # Nikandros: better convoy price
COUNCIL_ORDER = ("treasurer", "economist", "general", "fleet", "priest")

NUMBERS = ["grain", "treasury", "goods", "wine_oil", "people", "loyalty", "favour", "army", "ships"]


# --- Loading the rules -------------------------------------------------------
def read_csv(name):
    with open(os.path.join(HERE, name), encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def num(v, default=0):
    v = (v or "").strip()
    return float(v) if v else default


RULES = {r["id"]: r for r in read_csv("numbers.csv")}
DECREES = read_csv("decrees.csv")
DECREE = {d["id"]: d for d in DECREES}
SEASONS = sorted(read_csv("seasons.csv"), key=lambda r: int(r["order"]))
ADVISORS = {r["id"]: r for r in read_csv("advisors.csv")}
WINDS = {r["id"]: r for r in read_csv("winds.csv")}
BUILDING_LIST = read_csv("buildings.csv")
BLD = {b["id"]: b for b in BUILDING_LIST}
OLD_KINDS = {"terraces": "wheat", "workshops": "workshop", "groves": "vineyard"}  # saves from before 11 Oct
CARDS = []
for path in sorted(glob.glob(os.path.join(EVENTS, "*.yaml"))):
    if os.path.basename(path).startswith("_"):
        continue
    with open(path, encoding="utf-8") as f:
        CARDS.append(yaml.safe_load(f))


# --- Game state ----------------------------------------------------------------
def start_buildings():
    return [{"kind": b["id"], "done": 0} for b in BUILDING_LIST for _ in range(int(num(b["start"])))]


def new_council():
    return {aid: {"mood": MOOD_START, "ignored": 0, "used": None} for aid in ADVISORS}


def new_game():
    s = {n: num(RULES[n]["start"]) for n in NUMBERS}
    s.update(turn=1, tax="normal", buildings=start_buildings(), shipyard=[], convoys=[], tribute_debt=0,
             wind="E", current=1, weather_turn=0,
             hunger_streak=0, last_festival=-9, once_fired=[], over=None, council=new_council(),
             log=os.path.join(RUNS, datetime.datetime.now().strftime("run-%Y-%m-%d_%H%M.csv")))
    return s


def upgrade_save(s):
    """Bring a save from before the city plots (11 Oct 2026) up to date."""
    for b in s.get("buildings", []):
        b["kind"] = OLD_KINDS.get(b["kind"], b["kind"])
    if not any(b["kind"] == "forum" for b in s["buildings"]):
        have = {k: sum(1 for b in s["buildings"] if b["kind"] == k) for k in BLD}
        for b in start_buildings():
            if have.get(b["kind"], 0) > 0:
                have[b["kind"]] -= 1
            else:
                s["buildings"].append(b)
    s.setdefault("ships", num(RULES["ships"]["start"]))
    s.setdefault("shipyard", [])
    for c in s.get("convoys", []):
        c.setdefault("ship", 1)
    s.setdefault("council", new_council())
    return s


def season_of(turn):
    return SEASONS[(turn - 1) % len(SEASONS)], 30 + (turn - 1) // len(SEASONS)


def fmt(n, v):
    return f"{v:.1f}" if n == "grain" else f"{int(round(v)):,}"


def built(s, kind, turn=None):
    """Finished buildings of one kind."""
    turn = s["turn"] if turn is None else turn
    return sum(1 for b in s["buildings"] if b["kind"] == kind and turn >= b["done"])


def stat(s, field):
    """Sum of one column of buildings.csv over all finished buildings."""
    return sum(num(BLD[b["kind"]][field]) for b in s["buildings"] if s["turn"] >= b["done"])


def plots_used(s, zone):
    """Plots taken in a zone, counting buildings still under construction."""
    return sum(1 for b in s["buildings"] if BLD[b["kind"]]["zone"] == zone)


def zone_plots(zone):
    return TOWN_PLOTS if zone == "town" else FIELD_PLOTS


def ships_at_sea(s):
    return sum(c.get("ship", 1) for c in s["convoys"])


def berths(s):
    return int(stat(s, "ships_cap"))


def housing(s):
    return int(stat(s, "housing"))


# --- Dice and weather -----------------------------------------------------------
def roll(die, bonus=0, target=None, why=""):
    """Roll a die like a tabletop RPG: d4, d6, d8, d10, d12 or d20. With a target,
    the highest face always succeeds and a 1 always fails."""
    r = random.randint(1, die)
    total = r + bonus
    text = f"  [d{die}] {why}: rolled {r}" + (f" {'+' if bonus >= 0 else '-'} {abs(bonus)} = {total}" if bonus else "")
    if target is None:
        print(text)
        return total, None
    ok = total >= target
    if r == die:
        ok, tag = True, "CRITICAL SUCCESS"
    elif r == 1:
        ok, tag = False, "CRITICAL FAILURE"
    else:
        tag = "SUCCESS" if ok else "FAILURE"
    print(f"{text}  (needed {target})  -> {tag}")
    return total, ok


def roll_bonus(s, expr):
    """Bonus to a die roll, e.g. 'army / 50 + battle_bonus' or '2'. A name is a number of
    the town (army, loyalty...) or a column of buildings.csv summed over finished
    buildings (battle_bonus). Capped at ROLL_BONUS_CAP."""
    total = 0
    for term in str(expr or "0").replace(" ", "").split("+"):
        m = re.fullmatch(r"(\w+)(?:([/*])(\d+))?", term)
        if not m:
            continue
        name, op, k = m.group(1), m.group(2), m.group(3)
        if re.fullmatch(r"-?\d+", name):
            v = int(name)
        elif name in s and isinstance(s[name], (int, float)):
            v = s[name]
        elif BUILDING_LIST and name in BUILDING_LIST[0]:
            v = stat(s, name)
        else:
            v = 0
        v = v // int(k) if op == "/" else v * int(k) if op == "*" else v
        total += int(v)
    return max(-ROLL_BONUS_CAP, min(ROLL_BONUS_CAP, total))


def roll_weather(s):
    """New wind and current at the start of each season (kept in the save)."""
    if s.get("weather_turn") == s["turn"]:
        return
    season, _ = season_of(s["turn"])
    key = "weight_" + season["season"].lower()
    ids = list(WINDS)
    s["wind"] = random.choices(ids, weights=[num(WINDS[i][key], 1) for i in ids])[0]
    c = random.randint(1, CURRENT_DIE)
    s["current"] = 0 if c == 1 else 2 if c == CURRENT_DIE else 1
    s["weather_turn"] = s["turn"]


CURRENT_TEXT = {0: "slack", 1: "running north along our coast", 2: "running strongly north along our coast"}


def show_compass(s):
    w = WINDS[s["wind"]]
    lab = lambda k: (f"[{k}]" if k == s["wind"] else f" {k} ").center(4)
    centre = "o" if s["wind"] == "CALM" else "+"
    rose = [f"            {lab('N')}",
            f"      {lab('NW')}    |    {lab('NE')}",
            f"   {lab('W')} -----{centre}----- {lab('E')}",
            f"      {lab('SW')}    |    {lab('SE')}",
            f"            {lab('S')}"]
    wind = "dead calm" if s["wind"] == "CALM" else f"{w['latin']}, from the {w['from']}"
    info = [f"Wind: {wind}", f"  {w['effect']}", f"Current: {CURRENT_TEXT[s['current']]}",
            "  (the Adriatic turns anticlockwise)", ""]
    print()
    for a, b in zip(rose, info):
        print(f"{a:<30}{b}")


def sailing(s, north):
    """Price factor for a convoy: wind behind you and the current with you help."""
    w = WINDS[s["wind"]]
    adv = num(w["sail_north" if north else "sail_south"]) + (s["current"] if north else -s["current"])
    return max(-SAIL_CAP, min(SAIL_CAP, adv * SAIL_STEP)), int(num(w["delay"]))


# --- Screens -------------------------------------------------------------------
def city_cells(s, zone):
    cells = []
    for b in sorted((b for b in s["buildings"] if BLD[b["kind"]]["zone"] == zone),
                    key=lambda b: (b["done"] > s["turn"], list(BLD).index(b["kind"]))):
        name = BLD[b["kind"]]["short"]
        if b["done"] > s["turn"]:
            name = f"{name[:4]}({b['done'] - s['turn']})"   # under construction: seasons left
        cells.append(f"[{name:^7}]")
    return cells + ["[   .   ]"] * (zone_plots(zone) - len(cells))


def show_city(s):
    town, fields = city_cells(s, "town"), city_cells(s, "field")
    print(f"\n  {'ACRVVIVM, inside the walls':<30}   FIELDS AROUND THE BAY")
    town_used = f"{plots_used(s, 'town')}/{TOWN_PLOTS} plots"
    print(f"  {town_used:<30}   {plots_used(s, 'field')}/{FIELD_PLOTS} plots")
    for r in range(4):
        print(f"  {''.join(town[r * 3:r * 3 + 3]):<30}   {''.join(fields[r * 3:r * 3 + 3])}")
    free = max(0, int(s["ships"]) - ships_at_sea(s))
    print(f"  Houses for {housing(s):,} people; {int(s['ships'])} ships ({free} in harbour, "
          f"berths for {berths(s)}). (n) = seasons until finished")


def show_status(s):
    season, year = season_of(s["turn"])
    print("\n" + "=" * 64)
    print(f"  Turn {s['turn']} - {season['season']}, AD {year}      tax rate: {s['tax']}")
    print("=" * 64)
    for n in NUMBERS:
        print(f"  {RULES[n]['name']:<13} {fmt(n, s[n]):>9}   {RULES[n]['unit']}")
    show_city(s)
    for c in s["convoys"]:
        print(f"  ... a ship is at sea with a convoy, back in turn {c['arrive']}")
    for t in s["shipyard"]:
        print(f"  ... a new ship is on the slipway, ready in turn {t}")
    if s["tribute_debt"]:
        print(f"  Unpaid tribute owed to Rome: {int(s['tribute_debt']):,} denarii")
    show_compass(s)


def ability_ready(s, aid):
    """An advisor can use his ability if he is not sulking and has not used it
    this year (or, for once-a-governorship abilities, ever)."""
    st = s["council"][aid]
    if st["mood"] <= MOOD_SULK:
        return False
    if ADVISORS[aid]["ability_uses"] == "game":
        return st["used"] is None
    return st["used"] != season_of(s["turn"])[1]


def use_ability(s, aid):
    s["council"][aid]["used"] = season_of(s["turn"])[1]


def offer_ability(s, aid, question):
    """Ask whether to use an advisor's ability now. Uses it on yes."""
    if not ability_ready(s, aid):
        return False
    a = ADVISORS[aid]
    once = "once per governorship" if a["ability_uses"] == "game" else "once a year"
    yes = ask(f"  ** {a['name']}: {question} [{a['ability_name']}, {once}] (y/n) > ").lower()
    if yes in ("y", "yes"):
        use_ability(s, aid)
        return True
    return False


def mood_text(st):
    return "[" + "*" * int(st["mood"]) + "." * (MOOD_MAX - int(st["mood"])) + "]"


def ability_status(s, aid):
    a, st = ADVISORS[aid], s["council"][aid]
    if st["mood"] <= MOOD_SULK:
        state = "sulking, will not help"
    elif ability_ready(s, aid):
        state = "ready"
    else:
        state = "used" + ("" if a["ability_uses"] == "game" else " this year")
    return f"{a['ability_name']}: {state}"


def update_moods(s, wants, orders, notes):
    """Heeded advice cheers an advisor up; advice ignored for IGNORED_LIMIT seasons
    in a row sours him. Seasons with nothing to ask leave him as he is."""
    for aid, want in wants.items():
        if not want:
            continue
        st, name = s["council"][aid], ADVISORS[aid]["name"]
        if any(want(o) for o in orders):
            st["ignored"] = 0
            if st["mood"] < MOOD_MAX:
                st["mood"] += 1
                notes.append(f"{name} is pleased you took his advice (mood {st['mood']}/{MOOD_MAX}).")
            continue
        st["ignored"] += 1
        if st["ignored"] >= IGNORED_LIMIT and st["mood"] > 0:
            st["mood"] -= 1
            st["ignored"] = 0
            sulk = " He sulks and will not use his gifts for you." if st["mood"] == MOOD_SULK else ""
            notes.append(f"{name} feels ignored (mood {st['mood']}/{MOOD_MAX}).{sulk}")


def convoy_for(cargo=None, direction=None):
    """A want: any convoy with this cargo and/or direction."""
    return lambda o: (o["id"] == "send_convoy" and (cargo is None or o.get("cargo") == cargo)
                      and (direction is None or o.get("direction") == direction))


def decree_is(*ids):
    return lambda o: o["id"] in ids


def build_of(*kinds):
    return lambda o: o["id"] == "build" and o.get("building") in kinds


def council(s):
    """Each advisor speaks. Returns what each one wants this season (a test on an
    order), or None when he asks for nothing in particular."""
    wants = {}
    season, _ = season_of(s["turn"])
    turns_to_tribute = next(i for i in range(4) if season_of(s["turn"] + i)[0]["tribute_due"] == "yes")
    rate, _ = TAX_RATES[s["tax"]]
    income = s["people"] * rate - s["army"] * ARMY_PAY
    due = TRIBUTE + s["tribute_debt"]
    say = {}
    if s.get("tribute_grace") == s["turn"]:
        say["treasurer"] = f"Rome's season of grace ends now: {int(due):,} denarii are due this season."
        wants["treasurer"] = lambda o: decree_is("raise_taxes")(o) or convoy_for("sell_wine_oil")(o) or convoy_for("sell_goods")(o)
    elif s["treasury"] + income * (turns_to_tribute + 1) < due:
        say["treasurer"] = f"At this rate we cannot pay Rome's {int(due):,} denarii when the tribute falls due."
        wants["treasurer"] = lambda o: decree_is("raise_taxes")(o) or convoy_for("sell_wine_oil")(o) or convoy_for("sell_goods")(o)
    else:
        when = "this season" if turns_to_tribute == 0 else f"in {turns_to_tribute} season(s)"
        say["treasurer"] = f"The chest holds {int(s['treasury']):,} denarii. Tribute of {int(due):,} is due {when}."
    mult = num(WINDS[s["wind"]]["harvest_mult"], 1)
    if s["grain"] < 3:
        say["economist"] = f"Only {s['grain']:.1f} months of grain left. Buy grain by convoy or the people will starve."
        wants["economist"] = convoy_for("buy_grain")
    elif s["grain"] < 6:
        say["economist"] = "Our fields feed us only 8 months a year. More wheat terraces, a fishery or bought grain, Governor, or we go short."
        wants["economist"] = lambda o: convoy_for("buy_grain")(o) or build_of("wheat", "fishery")(o)
    elif s["wine_oil"] >= 10 and season["sailing"] == "yes":
        say["economist"] = f"{int(s['wine_oil'])} amphorae wait in the stores. Brundisium pays well for wine and oil."
        wants["economist"] = convoy_for("sell_wine_oil")
    elif mult != 1 and num(season["harvest_grain"]) > 0:
        say["economist"] = f"With this wind the harvest will be {'better' if mult > 1 else 'worse'} than usual ({mult - 1:+.0%})."
    else:
        say["economist"] = "The markets are steady. A workshop would give us goods to sell."
        wants["economist"] = build_of("workshop")
    if s["army"] < ORDER_ARMY:
        say["general"] = f"Only {int(s['army'])} men. Rome expects order, and so do the hill tribes."
        wants["general"] = decree_is("recruit")
    elif s["loyalty"] < 40:
        say["general"] = "The mood in the streets is sour. My men can keep order, but not forever. Pay them well and recruit."
        wants["general"] = decree_is("recruit")
    else:
        say["general"] = f"The garrison of {int(s['army'])} stands ready. Its pay is {int(s['army'] * ARMY_PAY):,} denarii a season."
    north, _ = sailing(s, True)
    south, _ = sailing(s, False)
    if season["sailing"] == "no":
        say["fleet"] = "Mare clausum. No ship of mine leaves the bay until spring."
    elif s["wind"] == "CALM":
        say["fleet"] = "Not a breath of wind. Any convoy we send will sit a season in harbour."
    elif north > south:
        say["fleet"] = f"Wind and current favour a voyage north up the coast ({north:+.0%} on prices)."
        wants["fleet"] = convoy_for(direction="north")
    elif south > north:
        say["fleet"] = f"The wind is with us for a voyage south ({south:+.0%} on prices)."
        wants["fleet"] = convoy_for(direction="south")
    else:
        say["fleet"] = "The sea is open; wind and current favour neither course."
    if s["loyalty"] < 40:
        say["priest"] = "The people murmur against you. A festival would please the gods and men alike."
        wants["priest"] = decree_is("hold_festival")
    elif s["favour"] < 40:
        say["priest"] = "The omens from Rome are cold. Gifts to the Emperor would warm them."
        wants["priest"] = decree_is("honour_rome")
    else:
        say["priest"] = "The omens are calm."
    print("\n  Your council:                                        mood   ability")
    for aid in COUNCIL_ORDER:
        a, st = ADVISORS[aid], s["council"][aid]
        head = f"{a['name']} ({a['title'].lower()})"
        print(f"  * {head:<52} {mood_text(st)}  {ability_status(s, aid)}")
        print(f"      \"{say[aid]}\"")
    return wants


# --- Input ---------------------------------------------------------------------
def ask(prompt):
    try:
        return input(prompt).strip()
    except EOFError:
        return "q"


def ask_int(prompt, lo, hi):
    while True:
        a = ask(prompt)
        if a == "q":
            return None
        if a.isdigit() and lo <= int(a) <= hi:
            return int(a)
        print(f"    Please type a number from {lo} to {hi}.")


# --- Decrees -------------------------------------------------------------------
def effects_of(d):
    return {n: num(d.get(n)) for n in NUMBERS if (d.get(n) or "").strip()}


def order(did, direction="none", cargo="none", amount=0, building="none"):
    return {"id": did, "direction": direction, "cargo": cargo, "amount": int(amount or 0), "building": building}


def cost_of(o):
    """Denarii and goods an order costs when it is sealed (grain bought by convoy not included)."""
    if o["id"] == "build" and o.get("building") in BLD:
        b = BLD[o["building"]]
        return num(b["cost_treasury"]), num(b["cost_goods"])
    d = DECREE[o["id"]]
    return num(d["cost_treasury"]), num(d["cost_goods"])


def grain_price(s, direction):
    factor, _ = sailing(s, direction == "north")
    return round(GRAIN_PRICE * (1 - factor - stat(s, "trade_bonus")))


def describe(s, o):
    """One line in plain words for an order."""
    d = DECREE[o["id"]]
    if o["id"] == "build":
        b = BLD.get(o.get("building"))
        return f"Build {b['name'].lower()}" if b else "Build (what?)"
    if o["id"] != "send_convoy":
        return d["name"]
    where = {"north": "north up the coast", "south": "south"}.get(o["direction"], "")
    if o["cargo"] == "buy_grain":
        what = (f"to buy {o['amount']} month{'s' if o['amount'] != 1 else ''} of grain" if o["amount"]
                else "to buy grain")
    elif o["cargo"] == "sell_wine_oil":
        what = f"to sell {o['amount']} amphorae of wine and oil" if o["amount"] else "to sell wine and oil"
    elif o["cargo"] == "sell_goods":
        what = f"to sell {o['amount']} goods" if o["amount"] else "to sell goods"
    else:
        what = ""
    return " ".join(x for x in ("Send a convoy", where, what) if x)


def validate(s, orders):
    """Check orders against the rules, in order. Returns (accepted, problems)."""
    season, _ = season_of(s["turn"])
    treasury, goods, tax = s["treasury"], s["goods"], s["tax"]
    accepted, problems, seen = [], [], set()
    new_plots = {"town": 0, "field": 0}
    new_kinds, new_ships, convoys = {}, 0, 0
    for o in orders[:3]:
        o.setdefault("building", "none")
        d = DECREE.get(o["id"])
        if not d:
            problems.append(f"'{o['id']}' is not a decree of this province.")
            continue
        if o["id"] in seen and o["id"] in ("raise_taxes", "lower_taxes", "send_convoy", "hold_festival"):
            problems.append(f"'{d['name']}' only once a season.")
            continue
        c, g = cost_of(o)
        if o["id"] == "build":
            b = BLD.get(o["building"])
            if not b:
                problems.append("The architect asks: build what? (see the list of buildings)")
                continue
            zone = b["zone"]
            if plots_used(s, zone) + new_plots[zone] >= zone_plots(zone):
                problems.append(f"No free plot {'inside the walls' if zone == 'town' else 'in the fields'} for {b['name'].lower()}.")
                continue
            have = sum(1 for x in s["buildings"] if x["kind"] == b["id"]) + new_kinds.get(b["id"], 0)
            if have >= int(num(b["max"], 99)):
                problems.append(f"Acruvium already has as many {b['name'].lower()} as it can hold ({int(num(b['max']))}).")
                continue
        if o["id"] == "build_ship":
            if int(s["ships"]) + len(s["shipyard"]) + new_ships >= berths(s):
                problems.append(f"Epicadus: no free berth for another ship (berths for {berths(s)}); build a second harbour first.")
                continue
        if o["id"] == "send_convoy":
            if season["sailing"] == "no" and not ability_ready(s, "fleet"):
                problems.append("Epicadus refuses: no convoys in winter (mare clausum).")
                continue
            if int(s["ships"]) - ships_at_sea(s) - convoys < 1:
                problems.append("Epicadus: every ship is at sea or lost; there is none to send.")
                continue
            if o["cargo"] == "buy_grain" and o["amount"] and o["direction"] in ("north", "south"):
                c += o["amount"] * grain_price(s, o["direction"])
            if o["cargo"] == "sell_wine_oil" and s["wine_oil"] < 1 or o["cargo"] == "sell_goods" and goods < 1:
                problems.append("Nikandros: there is nothing in the stores to sell.")
                continue
        if o["id"] == "raise_taxes":
            if tax == "high":
                problems.append("Taxes are already high.")
                continue
            tax = TAX_STEPS[TAX_STEPS.index(tax) + 1]
        if o["id"] == "lower_taxes":
            if tax == "low":
                problems.append("Taxes are already low.")
                continue
            tax = TAX_STEPS[TAX_STEPS.index(tax) - 1]
        if c > treasury or g > goods:
            problems.append(f"Felix shakes his head: not enough for '{describe(s, o)}' "
                            f"({int(c):,} denarii{f', {int(g)} goods' if g else ''}).")
            continue
        treasury -= c
        goods -= g
        if o["id"] == "build":
            new_plots[BLD[o["building"]]["zone"]] += 1
            new_kinds[o["building"]] = new_kinds.get(o["building"], 0) + 1
        new_ships += o["id"] == "build_ship"
        convoys += o["id"] == "send_convoy"
        accepted.append(o)
        seen.add(o["id"])
    return accepted, problems


def preview(s, orders):
    """Cost and the most visible effects of a set of orders, for the dialogue box."""
    cost, goods, loyalty, favour, extra = 0, 0, 0, 0, []
    for o in orders:
        d = DECREE[o["id"]]
        c, g = cost_of(o)
        cost += c
        goods += g
        eff = effects_of(d)
        loyalty += eff.get("loyalty", 0)
        favour += eff.get("favour", 0)
        if o["id"] == "send_convoy" and o["cargo"] == "buy_grain":
            cost += o["amount"] * grain_price(s, o["direction"])
        if o["id"] == "raise_taxes" and TAX_STEPS.index(s["tax"]) == 1:
            extra.append("then -4 loyalty every season at high taxes")
        if o["id"] == "send_convoy" and o["direction"] in ("north", "south"):
            factor, delay = sailing(s, o["direction"] == "north")
            if factor:
                extra.append(f"wind and current {factor:+.0%} on convoy prices")
            if delay:
                extra.append("dead calm: the convoy waits a season")
        if o["id"] == "build" and o["building"] in BLD:
            b = BLD[o["building"]]
            extra.append(f"{b['short'].lower()} ready in {int(num(b['seasons_to_build']))} seasons")
        if o["id"] == "build_ship":
            extra.append("ship ready next season")
        if o["id"] == "send_convoy" and season_of(s["turn"])[0]["sailing"] == "no":
            extra.append("Epicadus's winter run (once per governorship)")
    parts = [f"costs {int(cost):,} denarii" + (f", {int(goods)} goods" if goods else "")]
    if loyalty:
        parts.append(f"loyalty {loyalty:+g}")
    if favour:
        parts.append(f"Rome {favour:+g}")
    return "; ".join(parts + extra)


def suggest(s):
    """Two suggestions from the real situation: (bold, prudent)."""
    season, _ = season_of(s["turn"])
    can_sail = season["sailing"] == "yes" and s["wind"] != "CALM"
    north, _ = sailing(s, True)
    south, _ = sailing(s, False)
    best = "north" if north >= south else "south"
    turns_to_tribute = next(i for i in range(4) if season_of(s["turn"] + i)[0]["tribute_due"] == "yes")
    rate, _ = TAX_RATES[s["tax"]]
    income = s["people"] * rate - s["army"] * ARMY_PAY
    tribute_short = s["treasury"] + income * (turns_to_tribute + 1) < TRIBUTE + s["tribute_debt"]

    def build(wishes):
        chosen = []
        for o in wishes:
            if len(chosen) == 3:
                break
            if any(c["id"] == o["id"] for c in chosen):
                continue  # one of each per suggestion
            ok, _ = validate(s, chosen + [o])
            if len(ok) == len(chosen) + 1:
                chosen.append(o)
        return chosen

    def b(kind):
        return order("build", building=kind)

    # prudent: food first, then content people, then Rome; spend little before a hard tribute
    prudent = []
    if s["grain"] < 4.5:
        if can_sail:
            gp = grain_price(s, best)
            months = max(1, min(3, int((s["treasury"] * .5) // gp)))
            prudent.append(order("send_convoy", best, "buy_grain", months))
        prudent += [b("fishery"), b("wheat")]
    if s["people"] > housing(s) * 0.95:
        prudent.append(b("houses"))
    if s["loyalty"] < 45:
        prudent.append(order("hold_festival") if s["last_festival"] != s["turn"] - 1 else order("lower_taxes"))
    if s["favour"] < 45 and not tribute_short:
        prudent.append(order("honour_rome"))
    if not tribute_short:
        prudent += [b("wheat"), b("workshop"), b("temple")]
    prudent = build(prudent)[:2] if tribute_short else build(prudent)

    # bold: squeeze harder and invest bigger; sell abroad even with pirates about
    bold = []
    if s["tax"] != "high" and s["loyalty"] >= 35:
        bold.append(order("raise_taxes"))
    elif s["loyalty"] < 35 and s["army"] < 250:
        bold.append(order("recruit"))
    if can_sail and s["wine_oil"] >= 6:
        bold.append(order("send_convoy", best, "sell_wine_oil", int(s["wine_oil"])))
    if int(s["ships"]) - ships_at_sea(s) < 1:
        bold.append(order("build_ship"))
    bold += [b("vineyard"), b("market"), b("workshop"), order("recruit")]
    bold = build(bold)
    return bold, prudent


def situation(s):
    """The scribe's opening line: the most pressing matter."""
    season, _ = season_of(s["turn"])
    due = TRIBUTE + s["tribute_debt"]
    if s["grain"] < 2:
        return f"Governor, the granaries hold barely {s['grain']:.1f} months of grain. The people fear hunger."
    if season["tribute_due"] == "yes" and s["treasury"] < due:
        return f"Governor, Rome expects {int(due):,} denarii this season and the chest holds {int(s['treasury']):,}."
    if s["loyalty"] < 35:
        return "Governor, the townspeople mutter against you in the forum."
    if s["favour"] < 35:
        return "Governor, letters from Rome grow colder with every ship."
    if s["grain"] < 4.5:
        return f"Governor, our grain will last {s['grain']:.1f} months; the fields alone will not carry us."
    return "Governor, the town is quiet and the accounts are in order."


def world_state(s):
    season, year = season_of(s["turn"])
    w = WINDS[s["wind"]]
    return {"season": season["season"], "year": f"AD {year}", "tax_rate": s["tax"],
            "wind": f"{w['latin']} ({w['from']})", "current": CURRENT_TEXT[s["current"]],
            "sailing_season": season["sailing"] == "yes",
            **{RULES[n]["name"]: (round(s[n], 1) if n == "grain" else int(s[n])) for n in NUMBERS},
            "buildings": {BLD[k]["name"]: built(s, k) for k in BLD if built(s, k)},
            "free_plots": {"town": TOWN_PLOTS - plots_used(s, "town"), "fields": FIELD_PLOTS - plots_used(s, "field")},
            "ships_in_harbour": int(s["ships"]) - ships_at_sea(s)}


def show_orders(s, orders, indent="     "):
    for i, o in enumerate(orders, 1):
        print(f"{indent}{i}. {describe(s, o)}")


def dialogue(s):
    """The season's dialogue box. Returns a list of orders, or None to save and quit."""
    bold, prudent = suggest(s)
    while True:
        print("\n  " + "-" * 70)
        print(f'  The scribe: "{situation(s)} What are your orders?"')
        print()
        if bold:
            print("   A) BOLD     " + "; ".join(describe(s, o) for o in bold))
            print("               " + preview(s, bold))
        if prudent:
            print("   B) PRUDENT  " + "; ".join(describe(s, o) for o in prudent))
            print("               " + preview(s, prudent))
        print("   C) Give your own orders, in your own words")
        print("   D) Choose decrees from the list")
        print("   Enter) Do nothing this season        q) Save and quit")
        print("  " + "-" * 70)
        a = ask("  > ").lower()
        if a == "q":
            return None
        if a == "":
            return []
        if a == "a" and bold:
            return bold
        if a == "b" and prudent:
            return prudent
        if a == "d":
            picked = choose_decrees(s)
            if picked is None:
                return None
            if picked:
                return picked
            continue
        if a == "c" or len(a) > 3:
            text = a if len(a) > 3 else ask("  Your orders, Governor > ")
            if text in ("", "q"):
                continue
            result = scribe.read_orders(text, world_state(s), DECREES)
            print(f'\n  The scribe ({result.get("source", "?")}): "{result.get("reply", "")}"')
            accepted, problems = validate(s, result.get("orders", []))
            for pr in problems:
                print(f"   ! {pr}")
            if not accepted:
                continue
            print("   I will write these decrees:")
            show_orders(s, accepted)
            print("     " + preview(s, accepted))
            yes = ask("  Seal them? (y = yes, n = back) > ").lower()
            if yes in ("y", "yes", ""):
                return accepted
            continue
        print("    Please choose A, B, C, D, press Enter, or q.")


def choose_decrees(s):
    print("\n  Decrees (choose up to 3, e.g. '4 9', Enter to go back, q to save and quit):")
    for i, d in enumerate(DECREES, 1):
        cost = int(num(d["cost_treasury"]))
        goods = int(num(d["cost_goods"]))
        extra = f", {goods} goods" if goods else ""
        print(f"   {i:>2}. {d['name']:<34} {cost:>4} denarii{extra}")
    while True:
        a = ask("  Decrees > ")
        if a == "q":
            return None
        if a == "":
            return []
        picks = a.replace(",", " ").split()
        if len(picks) > 3 or not all(p.isdigit() and 1 <= int(p) <= len(DECREES) for p in picks):
            print("    Up to 3 numbers from the list, separated by spaces.")
            continue
        orders = [order(DECREES[int(p) - 1]["id"]) for p in picks]
        for o in orders:
            if o["id"] == "build":
                o["building"] = choose_building(s)
        accepted, problems = validate(s, orders)
        for pr in problems:
            print(f"    {pr}")
        if len(accepted) == len(orders):
            return accepted


def choose_building(s):
    print("    The architect: what shall we build?")
    for i, b in enumerate(BUILDING_LIST, 1):
        if b["id"] == "forum":
            continue
        where = "town" if b["zone"] == "town" else "field"
        goods = int(num(b["cost_goods"]))
        cost = f"{int(num(b['cost_treasury'])):>5} den" + (f", {goods} goods" if goods else "")
        about = b["notes"].replace("DRAFT. ", "")[:60]
        print(f"     {i:>2}. {b['name']:<28} {where:<5} {cost}, {int(num(b['seasons_to_build']))} seasons. {about}")
    i = ask_int("    > ", 1, len(BUILDING_LIST))
    return BUILDING_LIST[i - 1]["id"] if i else "none"


def apply_decrees(s, orders, notes):
    for o in orders:
        d = DECREE[o["id"]]
        c, g = cost_of(o)
        s["treasury"] -= c
        s["goods"] -= g
        eff = effects_of(d)
        if d["id"] == "raise_taxes":
            s["tax"] = TAX_STEPS[TAX_STEPS.index(s["tax"]) + 1]
        elif d["id"] == "lower_taxes":
            s["tax"] = TAX_STEPS[TAX_STEPS.index(s["tax"]) - 1]
        elif d["id"] == "hold_festival":
            if s["last_festival"] == s["turn"] - 1:
                eff["loyalty"] = eff.get("loyalty", 0) / 2
                notes.append("A second festival in a row pleases the people less.")
            s["last_festival"] = s["turn"]
        elif d["id"] == "build":
            b = BLD[o["building"]]
            wait = int(num(b["seasons_to_build"]))
            s["buildings"].append({"kind": b["id"], "done": s["turn"] + wait})
            notes.append(f"Work begins on {b['name'].lower()}; ready in turn {s['turn'] + wait}.")
        elif d["id"] == "build_ship":
            s["shipyard"].append(s["turn"] + int(num(d["seasons_to_finish"], 1)))
            notes.append("A new ship is laid down on the slipway.")
        elif d["id"] == "send_convoy":
            if season_of(s["turn"])[0]["sailing"] == "no":
                use_ability(s, "fleet")
                notes.append("Epicadus takes a ship out in winter, when no one else dares: his winter run is spent.")
            convoy(s, notes, o)
        for n, v in eff.items():
            s[n] += v
    return s


def convoy(s, notes, o=None):
    """Send a convoy. Direction, cargo and amount come from the order when given, else are asked."""
    o = o or order("send_convoy")
    if o["direction"] in ("north", "south"):
        north = o["direction"] == "north"
    else:
        print("    Epicadus: which way?  1) north up the coast (Narona, Salona, Aquileia)  2) south (Dyrrachium, Brundisium)")
        north = (ask_int("    > ", 1, 2) or 1) == 1
    factor, delay = sailing(s, north)
    factor += stat(s, "trade_bonus")
    if offer_ability(s, "economist", "I know a man in the port who will give us a better price (+20%)."):
        factor += GOOD_DEAL_BONUS
        notes.append("Nikandros strikes a deal: the convoy trades at a better price.")
    if factor:
        print(f"    Wind, current and market {'help' if factor > 0 else 'hinder'} this voyage: {factor:+.0%} on prices.")
    if delay:
        print("    Dead calm: the convoy waits a season in harbour before it can sail.")
    kinds = {"buy_grain": 1, "sell_wine_oil": 2, "sell_goods": 3}
    if o["cargo"] in kinds:
        kind = kinds[o["cargo"]]
    else:
        print("    Nikandros: what shall the convoy do?  1) buy grain  2) sell wine & oil  3) sell goods")
        kind = ask_int("    > ", 1, 3) or 1
    c = {"arrive": s["turn"] + 1 + delay, "grain": 0, "treasury": 0, "ship": 1}
    gp = round(GRAIN_PRICE * (1 - factor))
    if kind == 1:
        most = min(int(s["treasury"] // gp), 12)
        if most < 1:
            notes.append("The convoy sails empty: no money to buy grain.")
        else:
            m = min(o["amount"], most) if o["amount"] else \
                (ask_int(f"    Months of grain to buy at {gp} denarii each (1-{most}): ", 1, most) or 1)
            s["treasury"] -= m * gp
            c["grain"] = m
            notes.append(f"A convoy sails {'north' if north else 'south'} to buy {m} months of grain at {gp} denarii each.")
    else:
        key, price = ("wine_oil", WINE_OIL_PRICE) if kind == 2 else ("goods", GOODS_PRICE)
        price = round(price * (1 + factor))
        have = int(s[key])
        if have < 1:
            notes.append(f"The convoy sails empty: no {RULES[key]['name'].lower()} to sell.")
        else:
            q = min(o["amount"], have) if o["amount"] else \
                (ask_int(f"    How many to sell at {price} denarii each (1-{have}): ", 1, have) or have)
            s[key] -= q
            c["treasury"] = q * price
            notes.append(f"A convoy sails {'north' if north else 'south'} with {q} {RULES[key]['unit']} to sell at {price} each.")
    s["convoys"].append(c)


# --- Resolving the season (formulas.md, in order) ---------------------------------
def resolve(s, notes):
    season, _ = season_of(s["turn"])
    arrived = [c for c in s["convoys"] if c["arrive"] <= s["turn"]]
    s["convoys"] = [c for c in s["convoys"] if c["arrive"] > s["turn"]]
    # buildings and ships finished this season
    for b in s["buildings"]:
        if b["done"] == s["turn"] and b["done"] > 0:
            notes.append(f"{BLD[b['kind']]['name']} finished.")
    ready = [t for t in s["shipyard"] if t <= s["turn"]]
    if ready:
        s["ships"] += len(ready)
        s["shipyard"] = [t for t in s["shipyard"] if t > s["turn"]]
        notes.append(f"{len(ready)} new ship{'s' if len(ready) > 1 else ''} slide{'' if len(ready) > 1 else 's'} into the harbour.")
    # income
    rate, rate_loyalty = TAX_RATES[s["tax"]]
    s["treasury"] += round(s["people"] * rate)
    fees = stat(s, "treasury")
    if fees:
        s["treasury"] += fees
    for c in arrived:
        if c["treasury"]:
            s["treasury"] += c["treasury"]
            notes.append(f"The convoy returns with {c['treasury']:,} denarii.")
    # army pay
    pay = s["army"] * max(1, ARMY_PAY - stat(s, "army_pay_discount"))
    if s["treasury"] >= pay:
        s["treasury"] -= pay
    else:
        unpaid = (pay - s["treasury"]) / pay
        s["treasury"] = 0
        tens = math.ceil(unpaid * 10)
        lost = round(s["army"] * 0.05 * tens)
        s["army"] -= lost
        s["loyalty"] -= 3 * tens
        notes.append(f"The soldiers were not fully paid: {lost} desert and some take what they are owed.")
    # tribute
    grace_ends = s.get("tribute_grace") == s["turn"]
    if season["tribute_due"] == "yes" or grace_ends:
        s.pop("tribute_grace", None)
        due = TRIBUTE + s["tribute_debt"]
        if s["treasury"] < due and not grace_ends and offer_ability(
                s, "treasurer", f"The chest holds {int(s['treasury']):,} of {int(due):,}. Shall I beg Rome for one more season?"):
            s["tribute_grace"] = s["turn"] + 1
            notes.append(f"Felix wins a season's grace from Rome: the tribute of {int(due):,} denarii is due next season.")
        elif s["treasury"] >= due:
            s["treasury"] -= due
            s["tribute_debt"] = 0
            s["favour"] += TRIBUTE_PAID_FAVOUR
            notes.append(f"The tribute of {int(due):,} denarii sails for Rome.")
        else:
            short = due - s["treasury"]
            s["treasury"] = 0
            s["tribute_debt"] = round(short * TRIBUTE_DEBT_PENALTY)
            s["favour"] += TRIBUTE_MISSED_FAVOUR
            notes.append(f"Rome receives only part of its tribute. {s['tribute_debt']:,} denarii are owed next year.")
    # grain
    eaters = s["people"] + s["army"]
    mult = num(WINDS[s["wind"]]["harvest_mult"], 1)
    harvest = num(season["harvest_grain"]) * built(s, "wheat") / BASE_WHEAT * GRAIN_BASE_EATERS / eaters * mult
    if harvest and mult != 1:
        notes.append(f"The wind made the harvest {'richer' if mult > 1 else 'poorer'} ({mult - 1:+.0%}).")
    harvest += stat(s, "grain")   # fisheries: every season, whatever the wind
    bought = sum(c["grain"] for c in arrived)
    if bought:
        notes.append(f"The convoy unloads {bought} months of grain.")
    s["grain"] = round(s["grain"] + harvest + bought - GRAIN_EATEN, 1)
    hunger = s["grain"] <= 0
    s["grain"] = max(s["grain"], 0)
    s["hunger_streak"] = s["hunger_streak"] + 1 if hunger else 0
    if hunger:
        notes.append("The granaries are empty. People go hungry.")
    # goods, wine & oil
    s["goods"] += stat(s, "goods") - s["army"] // ARMY_GOODS_PER
    groves = stat(s, "wine_oil") * (2 if season["season"] == "Autumn" else 1)
    s["wine_oil"] += groves
    if groves:
        notes.append(f"The vineyards and olive groves yield {int(groves)} amphorae.")
    # people
    if hunger:
        s["people"] = round(s["people"] * 0.95)
    elif s["grain"] >= 3 and s["loyalty"] >= 50:
        room = housing(s)
        if s["people"] < room:
            s["people"] = min(room, round(s["people"] * 1.01))
        else:
            notes.append("The town is full: newcomers have nowhere to live. Build a residential district.")
    # loyalty and favour
    s["loyalty"] += rate_loyalty + (LOYALTY_HUNGER if hunger else LOYALTY_LOW_FOOD if s["grain"] < 3 else 0)
    s["loyalty"] += stat(s, "loyalty")   # temple, baths
    s["favour"] += stat(s, "favour")     # temple, walls
    if s["loyalty"] < UNREST_BELOW:
        s["favour"] += UNREST_FAVOUR
        notes.append("Unrest in the streets; Rome hears of it.")
    if s["army"] < ORDER_ARMY:
        s["favour"] += ORDER_FAVOUR


def trigger_holds(s, trig):
    trig = str(trig or "random").strip()
    if trig == "random":
        return True
    w = re.fullmatch(r"wind\s*(==|!=)\s*(\w+)", trig)
    if w:
        return (s["wind"] == w.group(2)) == (w.group(1) == "==")
    m = re.fullmatch(r"(\w+)\s*(<=|>=|<|>|==)\s*(-?\d+(?:\.\d+)?)", trig)
    if not m or m.group(1) not in s:
        return False
    a, op, b = s[m.group(1)], m.group(2), float(m.group(3))
    return {"<": a < b, "<=": a <= b, ">": a > b, ">=": a >= b, "==": a == b}[op]


def card_fits(s, c):
    season, year = season_of(s["turn"])
    seasons = c.get("seasons", "any")
    if seasons != "any" and season["season"] not in seasons:
        return False
    lo, hi = c.get("years", [30, 42])
    if not lo <= year <= hi or (c.get("once") and c["id"] in s["once_fired"]):
        return False
    return trigger_holds(s, c.get("trigger"))


def draw_season_cards(s):
    """One card from each deck (land, sea, omen), weighted by each card's chance."""
    drawn = []
    for deck, _ in DECKS:
        pool = [c for c in CARDS if c.get("deck") == deck and card_fits(s, c)]
        if pool:
            drawn.append(random.choices(pool, weights=[float(c.get("chance", 0.1)) for c in pool])[0])
    return drawn


def effects_text(eff):
    return ", ".join(f"{RULES[n]['name'].lower()} {'+' if v > 0 else ''}{v:g}" for n, v in eff.items() if n in NUMBERS) or "no effect"


def apply_effects(s, eff):
    for n, v in eff.items():
        if n in NUMBERS:
            s[n] += v


def answer_card(s, c, notes):
    """Ask the player's choice on a card (and roll the die if the option says so)."""
    ch = c["choice"]
    label = dict(DECKS)[c["deck"]]
    print(f"\n  [{label}] {c['title']}")
    print("  " + " ".join(str(ch["prompt"]).split()))
    for i, o in enumerate(ch["options"], 1):
        r = o.get("roll")
        odds = f"   [d{r.get('die', 20)} + {roll_bonus(s, r.get('bonus'))}, need {r['target']}]" if r else ""
        print(f"    {i}) {o['label']}{odds}")
    pick = ask_int("  Your choice > ", 1, len(ch["options"])) or 1
    opt = ch["options"][pick - 1]
    eff = dict(opt.get("effects") or {})
    r = opt.get("roll")
    if r:
        bonus, target = roll_bonus(s, r.get("bonus")), int(r["target"])
        total, ok = roll(int(r.get("die", 20)), bonus, target, opt["label"])
        natural_one = total - bonus == 1
        battle = "army" in str(r.get("bonus", ""))   # a roll the soldiers fight, not a test of the gods
        if battle and not ok and not natural_one and total + LEAD_CHARGE_BONUS >= target and \
                offer_ability(s, "general", f"Let me lead the men myself: +{LEAD_CHARGE_BONUS} turns this into a success."):
            ok = True
            print(f"  Antistius leads the charge: {total} + {LEAD_CHARGE_BONUS} = {total + LEAD_CHARGE_BONUS} -> SUCCESS")
            notes.append("Marcus Antistius led the charge himself and turned the day.")
        for n, v in (r.get("success" if ok else "failure") or {}).items():
            eff[n] = eff.get(n, 0) + v
        notes.append(f"{c['title']}: you chose '{opt['label']}' and the die says {'success' if ok else 'failure'} ({effects_text(eff)}).")
    else:
        notes.append(f"{c['title']}: you chose '{opt['label']}' ({effects_text(eff)}).")
    apply_effects(s, eff)


def dark_omen(c):
    """An omen worth sacrificing again for: a decision, or any number going down."""
    return bool(c.get("choice")) or any(v < 0 for v in (c.get("effects") or {}).values())


def reveal_cards(s, notes):
    """Draw the season's three cards and turn them all over at once."""
    cards = draw_season_cards(s)
    omen = next((c for c in cards if c["deck"] == "omen"), None)
    if omen and dark_omen(omen) and ability_ready(s, "priest"):
        print(f"\n  Tertius Volusius reads the entrails before the cards are turned: a dark omen is coming,")
        print(f"  '{omen['title']}' ({'your decision' if omen.get('choice') else effects_text(omen.get('effects') or {})}).")
        if offer_ability(s, "priest", "Shall I sacrifice again and ask the gods for another sign?"):
            pool = [c for c in CARDS if c.get("deck") == "omen" and c["id"] != omen["id"] and card_fits(s, c)]
            if pool:
                new = random.choices(pool, weights=[float(c.get("chance", 0.1)) for c in pool])[0]
                cards[cards.index(omen)] = new
                notes.append(f"Tertius Volusius sacrificed again: '{omen['title']}' gave way to '{new['title']}'.")
    print("\n  The season's cards are turned over:")
    for c in cards:
        label = dict(DECKS)[c["deck"]]
        who = ADVISORS.get(c.get("advisor", ""), {}).get("name")
        what = "your decision" if c.get("choice") else effects_text(c.get("effects") or {})
        title = c["title"] + (f" ({who})" if who else "")
        print(f"   [{label:<4}]  {title:<48} {what}")
    for c in cards:
        if c.get("once"):
            s["once_fired"].append(c["id"])
        if not c.get("choice"):
            eff = dict(c.get("effects") or {})
            apply_effects(s, eff)
            if not c.get("quiet"):
                notes.append(f"{c['title']}: {effects_text(eff)}.")
    open_cards = [c for c in cards if c.get("choice")]
    while open_cards:
        if len(open_cards) > 1:
            print("\n  Which card do you deal with first?")
            for i, c in enumerate(open_cards, 1):
                print(f"    {i}) [{dict(DECKS)[c['deck']]}] {c['title']}")
            i = ask_int("  Which first? > ", 1, len(open_cards)) or 1
        else:
            i = 1
        answer_card(s, open_cards.pop(i - 1), notes)
    for c in cards:
        note = " ".join(str(c.get("historical_note", "")).split())
        if note:
            notes.append(f"History ({c['title']}): {note}")
    return " + ".join(c["id"] for c in cards)


def clamp_and_check(s, notes):
    for n in NUMBERS:
        lo = num(RULES[n]["min"], 0)
        hi = num(RULES[n]["max"], float("inf"))
        s[n] = min(max(s[n], lo), hi)
    if s["loyalty"] < UPRISING_BELOW:
        notes.append("Warning: loyalty is so low that an uprising is near (no uprising card written yet).")
    if s["favour"] <= 0:
        s["over"] = "Recalled to Rome in disgrace: Roman favour reached 0."
    elif s["loyalty"] <= 0 and s["army"] < ORDER_ARMY:
        s["over"] = "Overthrown: the town rose up and the army was too weak to stop it."
    elif s["hunger_streak"] >= 2:
        s["over"] = "Replaced for famine: two hungry seasons in a row."


# --- Log and save ------------------------------------------------------------------
def log_turn(s, orders, event, notes):
    season, year = season_of(s["turn"])
    new = not os.path.exists(s["log"])
    with open(s["log"], "a", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        if new:
            w.writerow(["turn", "season", "year", "wind", "current", "decrees", "event", *NUMBERS, "tax_rate", "notes"])
        w.writerow([s["turn"], season["season"], f"AD {year}", s["wind"], s["current"], " + ".join(o["id"] for o in orders), event,
                    *[fmt(n, s[n]).replace(",", "") for n in NUMBERS], s["tax"], " | ".join(notes)])


def save(s):
    with open(SAVE, "w", encoding="utf-8") as f:
        json.dump(s, f, indent=1)


def main():
    os.makedirs(RUNS, exist_ok=True)
    if "--new" in sys.argv or not os.path.exists(SAVE):
        s = new_game()
        print("\nAD 30. Tiberius sends you from Rome to govern Acruvium, in the Bay of Kotor.")
        print("Each turn is one season. Keep Rome and the people content, and the granaries full.")
    else:
        with open(SAVE, encoding="utf-8") as f:
            s = upgrade_save(json.load(f))
        print(f"\nContinuing your governorship (turn {s['turn']}). Use --new to start again.")
    while not s.get("over"):
        roll_weather(s)
        if s.get("cards_turn") != s["turn"]:
            s["before"] = {n: s[n] for n in NUMBERS}
            show_status(s)
            notes = []
            s["events"] = reveal_cards(s, notes)
            s["season_notes"] = notes
            s["cards_turn"] = s["turn"]
            save(s)
            changed = [f"{RULES[n]['name']} {fmt(n, s['before'][n])} -> {fmt(n, s[n])}"
                       for n in NUMBERS if abs(s[n] - s["before"][n]) >= 0.05]
            if changed:
                print("\n  After the cards: " + ";  ".join(changed))
        else:
            show_status(s)
            print(f"\n  This season's cards are already played: {s['events']}")
        before = s["before"]
        wants = council(s)
        orders = dialogue(s)
        if orders is None:
            save(s)
            print(f"\nSaved. Run again to continue. Log: {os.path.relpath(s['log'])}")
            return
        notes = list(s["season_notes"])
        update_moods(s, wants, orders, notes)
        apply_decrees(s, orders, notes)
        resolve(s, notes)
        event = s["events"]
        clamp_and_check(s, notes)
        print("\n  The season ends:")
        for line in notes:
            print(f"  - {line}")
        for n in NUMBERS:
            d = s[n] - before[n]
            if abs(d) >= 0.05:
                print(f"    {RULES[n]['name']:<13} {fmt(n, before[n]):>9} -> {fmt(n, s[n]):>9}  ({'+' if d > 0 else ''}{fmt(n, d)})")
        log_turn(s, orders, event, notes)
        s["turn"] += 1
        save(s)
    print(f"\n  THE END. {s['over']}")
    print(f"  You governed for {s['turn'] - 1} seasons. Log: {os.path.relpath(s['log'])}")
    os.remove(SAVE)


if __name__ == "__main__":
    main()
