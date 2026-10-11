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
WORKSHOP_GOODS = 6
GROVE_WINE_OIL = 4           # per season once mature, x2 in Autumn
GROVE_MATURE = 8             # seasons after planting
ARMY_GOODS_PER = 50          # 1 goods per 50 soldiers per season
GRAIN_PRICE = 500            # denarii per month of supply bought by convoy
WINE_OIL_PRICE = 60          # denarii per amphora sold by convoy
GOODS_PRICE = 15             # denarii per unit of goods sold by convoy
LOYALTY_LOW_FOOD, LOYALTY_HUNGER = -3, -10
UNREST_BELOW, UNREST_FAVOUR = 30, -3
UPRISING_BELOW = 20
ORDER_ARMY, ORDER_FAVOUR = 100, -1
EVENT_ROLLS_PER_SEASON = 1   # at most this many cards fire per season
# Weather and the sea (winds.csv; formulas.md "Weather and the sea")
CURRENT_DIE = 6              # d6 each season: 1 slack, 2-5 running, 6 strong
SAIL_STEP, SAIL_CAP = 0.10, 0.30   # convoy price change per point of sailing advantage, and its limit
ROLL_BONUS_CAP = 5           # most a number can add to a die roll

NUMBERS = ["grain", "treasury", "goods", "wine_oil", "people", "loyalty", "favour", "army"]
BUILDINGS = {"build_terraces": "terraces", "build_workshop": "workshops", "plant_vines_olives": "groves"}


# --- Loading the rules -------------------------------------------------------
def read_csv(name):
    with open(os.path.join(HERE, name), encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def num(v, default=0):
    v = (v or "").strip()
    return float(v) if v else default


RULES = {r["id"]: r for r in read_csv("numbers.csv")}
DECREES = read_csv("decrees.csv")
SEASONS = sorted(read_csv("seasons.csv"), key=lambda r: int(r["order"]))
ADVISORS = {r["id"]: r for r in read_csv("advisors.csv")}
WINDS = {r["id"]: r for r in read_csv("winds.csv")}
CARDS = []
for path in sorted(glob.glob(os.path.join(EVENTS, "e*.yaml"))):
    with open(path, encoding="utf-8") as f:
        CARDS.append(yaml.safe_load(f))


# --- Game state ----------------------------------------------------------------
def new_game():
    s = {n: num(RULES[n]["start"]) for n in NUMBERS}
    s.update(turn=1, tax="normal", buildings=[], convoys=[], tribute_debt=0, wind="E", current=1, weather_turn=0,
             hunger_streak=0, last_festival=-9, once_fired=[], over=None,
             log=os.path.join(RUNS, datetime.datetime.now().strftime("run-%Y-%m-%d_%H%M.csv")))
    return s


def season_of(turn):
    return SEASONS[(turn - 1) % len(SEASONS)], 30 + (turn - 1) // len(SEASONS)


def fmt(n, v):
    return f"{v:.1f}" if n == "grain" else f"{int(round(v)):,}"


def built(s, kind, turn=None):
    turn = s["turn"] if turn is None else turn
    return sum(1 for b in s["buildings"] if b["kind"] == kind and turn >= b["done"])


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
    """'army / 50' -> army // 50, '2' -> 2. Capped at ROLL_BONUS_CAP."""
    expr = str(expr or "0").replace(" ", "")
    m = re.fullmatch(r"(\w+)/(\d+)", expr)
    b = int(s.get(m.group(1), 0) // int(m.group(2))) if m else int(float(expr or 0))
    return max(-ROLL_BONUS_CAP, min(ROLL_BONUS_CAP, b))


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
def show_status(s):
    season, year = season_of(s["turn"])
    print("\n" + "=" * 64)
    print(f"  Turn {s['turn']} - {season['season']}, AD {year}      tax rate: {s['tax']}")
    print("=" * 64)
    for n in NUMBERS:
        print(f"  {RULES[n]['name']:<13} {fmt(n, s[n]):>9}   {RULES[n]['unit']}")
    in_progress = [b for b in s["buildings"] if b["done"] > s["turn"]]
    done = {k: built(s, k) for k in ("terraces", "workshops")}
    groves = [b for b in s["buildings"] if b["kind"] == "groves"]
    print(f"  Built: {done['terraces']} terraces, {done['workshops']} workshops, "
          f"{len(groves)} groves ({sum(1 for g in groves if s['turn'] >= g['done'])} mature)")
    for b in in_progress:
        print(f"  ... {b['kind']} ready in turn {b['done']}")
    for c in s["convoys"]:
        print(f"  ... convoy returns in turn {c['arrive']}")
    if s["tribute_debt"]:
        print(f"  Unpaid tribute owed to Rome: {int(s['tribute_debt']):,} denarii")
    show_compass(s)


def council(s):
    season, _ = season_of(s["turn"])
    turns_to_tribute = next(i for i in range(4) if season_of(s["turn"] + i)[0]["tribute_due"] == "yes")
    rate, _ = TAX_RATES[s["tax"]]
    income = s["people"] * rate - s["army"] * ARMY_PAY
    due = TRIBUTE + s["tribute_debt"]
    say = {}
    if s["treasury"] + income * (turns_to_tribute + 1) < due:
        say["treasurer"] = f"At this rate we cannot pay Rome's {int(due):,} denarii when the tribute falls due."
    else:
        when = "this season" if turns_to_tribute == 0 else f"in {turns_to_tribute} season(s)"
        say["treasurer"] = f"The chest holds {int(s['treasury']):,} denarii. Tribute of {int(due):,} is due {when}."
    mult = num(WINDS[s["wind"]]["harvest_mult"], 1)
    if s["grain"] < 3:
        say["economist"] = f"Only {s['grain']:.1f} months of grain left. Buy grain by convoy or the people will starve."
    elif s["grain"] < 6:
        say["economist"] = "Our fields feed us only 8 months a year. Terraces or bought grain, Governor, or we go short."
    elif s["wine_oil"] >= 10 and season["sailing"] == "yes":
        say["economist"] = f"{int(s['wine_oil'])} amphorae wait in the stores. Brundisium pays well for wine and oil."
    elif mult != 1 and num(season["harvest_grain"]) > 0:
        say["economist"] = f"With this wind the harvest will be {'better' if mult > 1 else 'worse'} than usual ({mult - 1:+.0%})."
    else:
        say["economist"] = "The markets are steady. A workshop would give us goods to sell."
    if s["army"] < ORDER_ARMY:
        say["general"] = f"Only {int(s['army'])} men. Rome expects order, and so do the hill tribes."
    elif s["loyalty"] < 40:
        say["general"] = "The mood in the streets is sour. My men can keep order, but not forever."
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
    elif south > north:
        say["fleet"] = f"The wind is with us for a voyage south ({south:+.0%} on prices)."
    else:
        say["fleet"] = "The sea is open; wind and current favour neither course."
    if s["loyalty"] < 40:
        say["priest"] = "The people murmur against you. A festival would please the gods and men alike."
    elif s["favour"] < 40:
        say["priest"] = "The omens from Rome are cold. Gifts to the Emperor would warm them."
    else:
        say["priest"] = "The omens are calm."
    print("\n  Your council:")
    for aid in ("treasurer", "economist", "general", "fleet", "priest"):
        a = ADVISORS[aid]
        print(f"  * {a['name']} ({a['title'].lower()}): {say[aid]}")


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


def choose_decrees(s):
    season, _ = season_of(s["turn"])
    print("\n  Decrees (choose up to 3, e.g. '4 9', Enter for none, q to save and quit):")
    for i, d in enumerate(DECREES, 1):
        cost = int(num(d["cost_treasury"]))
        goods = int(num(d["cost_goods"]))
        extra = f", {goods} goods" if goods else ""
        print(f"   {i:>2}. {d['name']:<34} {cost:>4} denarii{extra}")
    while True:
        a = ask("  Your orders, Governor > ")
        if a == "q":
            return None
        picks = a.replace(",", " ").split()
        if len(picks) > 3 or not all(p.isdigit() and 1 <= int(p) <= len(DECREES) for p in picks):
            print("    Up to 3 numbers from the list, separated by spaces.")
            continue
        orders = []
        treasury, goods = s["treasury"], s["goods"]
        ok = True
        for p in picks:
            d = DECREES[int(p) - 1]
            c, g = num(d["cost_treasury"]), num(d["cost_goods"])
            if d["id"] == "send_convoy" and season["sailing"] == "no":
                print("    Epicadus refuses: no convoys in winter (mare clausum).")
                ok = False
                break
            if d["id"] == "raise_taxes" and s["tax"] == "high" or d["id"] == "lower_taxes" and s["tax"] == "low":
                print(f"    Taxes are already {s['tax']}.")
                ok = False
                break
            if c > treasury or g > goods:
                print(f"    Felix shakes his head: not enough for '{d['name']}'.")
                ok = False
                break
            treasury -= c
            goods -= g
            orders.append(d)
        if ok:
            return orders


def apply_decrees(s, orders, notes):
    for d in orders:
        s["treasury"] -= num(d["cost_treasury"])
        s["goods"] -= num(d["cost_goods"])
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
        elif d["id"] in BUILDINGS:
            kind = BUILDINGS[d["id"]]
            wait = GROVE_MATURE if kind == "groves" else int(num(d["seasons_to_finish"]))
            s["buildings"].append({"kind": kind, "done": s["turn"] + wait})
            notes.append(f"Work begins on {kind}; ready in turn {s['turn'] + wait}.")
        elif d["id"] == "send_convoy":
            convoy(s, notes)
        for n, v in eff.items():
            s[n] += v
    return s


def convoy(s, notes):
    print("    Epicadus: which way?  1) north up the coast (Narona, Salona, Aquileia)  2) south (Dyrrachium, Brundisium)")
    north = (ask_int("    > ", 1, 2) or 1) == 1
    factor, delay = sailing(s, north)
    if factor:
        print(f"    Wind and current {'help' if factor > 0 else 'hinder'} this voyage: {factor:+.0%} on prices.")
    if delay:
        print("    Dead calm: the convoy waits a season in harbour before it can sail.")
    print("    Nikandros: what shall the convoy do?  1) buy grain  2) sell wine & oil  3) sell goods")
    kind = ask_int("    > ", 1, 3) or 1
    c = {"arrive": s["turn"] + 1 + delay, "grain": 0, "treasury": 0}
    grain_price = round(GRAIN_PRICE * (1 - factor))
    if kind == 1:
        most = int(s["treasury"] // grain_price)
        if most < 1:
            notes.append("The convoy sails empty: no money to buy grain.")
        else:
            m = ask_int(f"    Months of grain to buy at {grain_price} denarii each (1-{min(most, 12)}): ", 1, min(most, 12)) or 1
            s["treasury"] -= m * grain_price
            c["grain"] = m
            notes.append(f"A convoy sails to buy {m} months of grain.")
    else:
        key, price = ("wine_oil", WINE_OIL_PRICE) if kind == 2 else ("goods", GOODS_PRICE)
        price = round(price * (1 + factor))
        have = int(s[key])
        if have < 1:
            notes.append(f"The convoy sails empty: no {RULES[key]['name'].lower()} to sell.")
        else:
            q = ask_int(f"    How many to sell at {price} denarii each (1-{have}): ", 1, have) or have
            s[key] -= q
            c["treasury"] = q * price
            notes.append(f"A convoy sails with {q} {RULES[key]['unit']} to sell.")
    s["convoys"].append(c)


# --- Resolving the season (formulas.md, in order) ---------------------------------
def resolve(s, notes):
    season, _ = season_of(s["turn"])
    arrived = [c for c in s["convoys"] if c["arrive"] <= s["turn"]]
    s["convoys"] = [c for c in s["convoys"] if c["arrive"] > s["turn"]]
    # income
    rate, rate_loyalty = TAX_RATES[s["tax"]]
    s["treasury"] += round(s["people"] * rate)
    for c in arrived:
        if c["treasury"]:
            s["treasury"] += c["treasury"]
            notes.append(f"The convoy returns with {c['treasury']:,} denarii.")
    # army pay
    pay = s["army"] * ARMY_PAY
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
    if season["tribute_due"] == "yes":
        due = TRIBUTE + s["tribute_debt"]
        if s["treasury"] >= due:
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
    harvest = (num(season["harvest_grain"]) * GRAIN_BASE_EATERS / eaters + built(s, "terraces") * num(season["terrace_bonus"])) * mult
    if harvest and mult != 1:
        notes.append(f"The wind made the harvest {'richer' if mult > 1 else 'poorer'} ({mult - 1:+.0%}).")
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
    s["goods"] += WORKSHOP_GOODS * built(s, "workshops") - s["army"] // ARMY_GOODS_PER
    groves = built(s, "groves") * GROVE_WINE_OIL * (2 if season["season"] == "Autumn" else 1)
    s["wine_oil"] += groves
    if groves:
        notes.append(f"The groves yield {groves} amphorae.")
    # people
    if hunger:
        s["people"] = round(s["people"] * 0.95)
    elif s["grain"] >= 3 and s["loyalty"] >= 50:
        s["people"] = round(s["people"] * 1.01)
    # loyalty and favour
    s["loyalty"] += rate_loyalty + (LOYALTY_HUNGER if hunger else LOYALTY_LOW_FOOD if s["grain"] < 3 else 0)
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


def draw_event(s, notes):
    season, year = season_of(s["turn"])
    deck = []
    for c in CARDS:
        seasons = c.get("seasons", "any")
        if seasons != "any" and season["season"] not in seasons:
            continue
        lo, hi = c.get("years", [30, 42])
        if not lo <= year <= hi or (c.get("once") and c["id"] in s["once_fired"]):
            continue
        if trigger_holds(s, c.get("trigger")):
            deck.append(c)
    random.shuffle(deck)
    fired = 0
    for c in deck:
        if fired >= EVENT_ROLLS_PER_SEASON or random.random() >= float(c.get("chance", 0)):
            continue
        fired += 1
        s["once_fired"].append(c["id"])
        who = ADVISORS.get(c.get("advisor", ""), {}).get("name")
        print(f"\n  EVENT: {c['title']}" + (f"  ({who})" if who else ""))
        eff = dict(c.get("effects") or {})
        ch = c.get("choice")
        if ch:
            print("  " + " ".join(str(ch["prompt"]).split()))
            for i, o in enumerate(ch["options"], 1):
                print(f"    {i}) {o['label']}")
            pick = ask_int("  Your choice > ", 1, len(ch["options"])) or 1
            opt = ch["options"][pick - 1]
            eff.update(opt.get("effects") or {})
            r = opt.get("roll")
            if r:
                _, ok = roll(int(r.get("die", 20)), roll_bonus(s, r.get("bonus")), int(r["target"]), opt["label"])
                for n, v in (r.get("success" if ok else "failure") or {}).items():
                    eff[n] = eff.get(n, 0) + v
                notes.append(f"Die roll for '{opt['label']}': {'success' if ok else 'failure'}.")
        for n, v in eff.items():
            if n in NUMBERS:
                s[n] += v
        note = " ".join(str(c.get("historical_note", "")).split())
        notes.append(f"Event: {c['title']}.")
        if note:
            notes.append(f"History: {note}")
        return c["id"]
    return ""


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
        w.writerow([s["turn"], season["season"], f"AD {year}", s["wind"], s["current"], " + ".join(d["id"] for d in orders), event,
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
            s = json.load(f)
        print(f"\nContinuing your governorship (turn {s['turn']}). Use --new to start again.")
    while not s.get("over"):
        roll_weather(s)
        save(s)
        before = {n: s[n] for n in NUMBERS}
        show_status(s)
        council(s)
        orders = choose_decrees(s)
        if orders is None:
            save(s)
            print(f"\nSaved. Run again to continue. Log: {os.path.relpath(s['log'])}")
            return
        notes = []
        apply_decrees(s, orders, notes)
        resolve(s, notes)
        event = draw_event(s, notes)
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
