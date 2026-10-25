#!/usr/bin/env python3
"""Fügt die Recherche-JSONs und Leaderboard-CSVs zu js/data.js zusammen.

Aufruf: python3 tools/build_data.py [research-dir]
research-dir (Standard: data/) enthält cards.json, masters.json, meta.json, basics.json und raw/.
"""
import csv, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'data')
RAW = os.path.join(R, 'raw')
MM = os.path.join(RAW, 'mmmeta')

def load(name):
    with open(os.path.join(R, name), encoding='utf-8') as f:
        return json.load(f)

def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

def norm(s):
    return re.sub(r'[^a-z0-9]', '', s.lower())

cards_j, masters_j, meta_j, basics_j = load('cards.json'), load('masters.json'), load('meta.json'), load('basics.json')

# ---------------- Karten ----------------
cards = []
by_norm = {}
for c in cards_j['cards']:
    cid = slug(c['name'])
    img = f'img/cards/{cid}.webp'
    card = {
        'id': cid, 'name': c['name'], 'type': c['type'], 'mana': c['mana'],
        'rarity': c['rarity'], 'faction': c['faction'], 'count': c.get('count', ''),
        'text': c['text'], 'tier': c.get('tier', 'B') or 'B',
        'img': img if os.path.exists(os.path.join(ROOT, img)) else '',
    }
    cards.append(card)
    by_norm[norm(c['name'])] = cid

ALIASES = {
    "ankaheshdesertsdoom": "an-kahesh-desert-s-doom",
    "azog": "a-zog-voidfiend-of-shars-rakk",
    "revenant": "the-revenant",
    "s1egebr3akermki": "s1ege-br3aker-mk1",
}
unresolved = set()

def resolve(name):
    """Kartenname -> Karten-ID (oder None)."""
    if not name:
        return None
    n = norm(re.sub(r'\(.*?\)', '', name))
    if n in by_norm:
        return by_norm[n]
    if ALIASES.get(n):
        return ALIASES[n]
    # Präfix: "Rendrath" -> "Rendrath the Deathless", "A'Zog" -> "A'Zog, Voidfiend ..."
    cands = [cid for k, cid in by_norm.items() if k.startswith(n) and len(n) >= 4]
    if len(cands) == 1:
        return cands[0]
    cands = [cid for k, cid in by_norm.items() if n.startswith(k) and len(k) >= 5]
    if cands:
        return max(cands, key=len)
    unresolved.add(name)
    return None


def card_refs(names):
    out = []
    for nm in names:
        grp = re.match(r'^(.*?)\s*\((.*,.*)\)\s*$', nm)
        if grp:  # Kategorie mit Beispielkarten: "Schwärme (Scrat Horde, Skeleton Horde, ...)"
            ids = [resolve(x.strip()) for x in re.split(r',|/', grp.group(2))]
            out.append({'name': grp.group(1), 'group': [i for i in ids if i]})
            continue
        cid = resolve(nm)
        out.append(cid if cid else {'name': nm})
    return out

# ---------------- Master ----------------
mnorm = {}
masters = []
for m in masters_j['masters']:
    mid = slug(m['name'])
    mnorm[norm(m['name'])] = mid
    masters.append({
        'id': mid, 'name': m['name'], 'title': m.get('title', ''), 'faction': m.get('faction', ''),
        'unlock': m.get('unlock', ''), 'role': m.get('role', ''), 'attack': m.get('attack', ''),
        'perks': m.get('perks', []), 'build': m.get('build', ''), 'tier': m.get('tier', ''),
        'img': f'img/masters/{mid}-full.jpg', 'icon': f'img/masters/{mid}-icon.webp',
    })
mnorm['r3kt'] = 'r3-kt'

def resolve_master(name):
    n = norm(name or '')
    if n in mnorm:
        return mnorm[n]
    for k, v in mnorm.items():
        if n.startswith(k) or k.startswith(n):
            return v
    return None

# Master-Statistiken (Winrates, Stand 17.10.2026)
stats_master = {}
with open(os.path.join(RAW, 'sheet_Masters%20-%20EOS.csv'), encoding='utf-8') as f:
    for row in csv.DictReader(f):
        mid = resolve_master(row['Master Name'].strip())
        if not mid:
            continue
        def fl(k):
            try: return round(float(row[k]) * 100, 1)
            except (ValueError, KeyError): return None
        def it(k):
            try: return int(row[k])
            except (ValueError, KeyError): return 0
        stats_master[mid] = {
            'wr1v1': fl('Win Rate - 1v1'), 'n1v1': it('Matches Played - 1v1'),
            'wr2v2': fl('Win Rate - 2v2 Solo'), 'n2v2': it('Matches Played - 2v2 Solo'),
            'wrPre': fl('Win Rate - 2v2 Premade'), 'nPre': it('Matches Played - 2v2 Premade'),
            'wrAll': fl('Win Rate - All'), 'nAll': it('Matches Played - All'), 'date': row['Date'],
        }

# Master-Pickrate in Leaderboard-Decks (aus overall.csv, "Master Composition")
master_pick = {}
with open(os.path.join(MM, 'overall.csv'), encoding='utf-8') as f:
    rows = list(csv.reader(f))
start = next(i for i, r in enumerate(rows) if r and r[0] == 'Master Composition') + 2
for r in rows[start:start + 14]:
    mid = resolve_master(r[0])
    if not mid:
        continue
    def num(x):
        try: return int(x)
        except ValueError: return 0
    master_pick[mid] = {'1v1': num(r[1]), 'rand': num(r[4]), 'pre': num(r[7]), 'draft': 0}
# Draft steht nur in der nach Picks sortierten Spalte (Name in r[18], Anzahl in r[19])
for r in rows[start:start + 14]:
    if len(r) > 19:
        mid = resolve_master(r[18])
        if mid:
            master_pick.setdefault(mid, {})['draft'] = int(r[19] or 0)

# Karten-Spielraten (Anteil der Leaderboard-Decks, die die Karte spielen)
card_rates = {}
for mode, fn, decks in [('1v1', 'f_Overall_Cards_1v1.csv', 8500), ('rand', 'f_Overall_Cards_2v2_Randoms.csv', 8500),
                        ('pre', 'f_Overall_Cards_2v2_Premades.csv', 8500), ('draft', 'f_Overall_Cards_Draft.csv', 6460)]:
    with open(os.path.join(MM, fn), encoding='utf-8') as f:
        for r in list(csv.reader(f))[1:]:
            if len(r) < 2 or not r[1].isdigit():
                continue
            cid = resolve(r[0])
            if cid and int(r[1]) > 0:
                card_rates.setdefault(cid, {})[mode] = round(int(r[1]) / decks * 100, 1)

# Leaderboard-Top-Decks
lb_decks = []
for mode, fn in [('1v1', 'td_1v1.csv'), ('rand', 'td_rand.csv'), ('pre', 'td_pre.csv')]:
    with open(os.path.join(MM, fn), encoding='utf-8') as f:
        rows = list(csv.reader(f))[1:]
    for rank, r in enumerate(rows, 1):
        if len(r) < 11 or not r[0].strip():
            continue
        mid = resolve_master(r[0].strip())
        lb_decks.append({'mode': mode, 'rank': rank, 'master': mid, 'cards': card_refs([x.strip() for x in r[1:11]])})
with open(os.path.join(MM, 'draft_imp.csv'), encoding='utf-8') as f:
    rows = list(csv.reader(f))[1:]
for r in rows:
    if len(r) < 14 or not r[3].strip() or not r[2].strip().isdigit():
        continue
    lb_decks.append({'mode': 'draft', 'rank': int(r[2]), 'master': resolve_master(r[3].strip()),
                     'cards': card_refs([x.strip() for x in r[4:14]])})

# ---------------- Meta / Modi ----------------
def fix_text(s):
    if not isinstance(s, str):
        return s
    # Brücken schießen nicht auf den Master (laut Wiki: nur XP); Mana Frenzy wandelt XP in Mana um.
    s = s.replace("gehaltene Brücken schießen auf den gegnerischen Master und geben XP", "gehaltene Brücken geben XP")
    s = s.replace("'Mana Frenzy' (doppelte Mana-Rate)", "'Mana Frenzy' (XP wird in Mana umgewandelt)")
    s = s.replace("gehaltene Brücken bringen Turmschaden UND XP für deine Perks", "gehaltene Brücken bringen XP für deine Perks und ab der Mana Frenzy Bonus-Mana")
    return s

def deep_fix(o):
    if isinstance(o, dict):
        return {k: deep_fix(v) for k, v in o.items()}
    if isinstance(o, list):
        return [deep_fix(v) for v in o]
    return fix_text(o)

meta_j = deep_fix(meta_j)
modes = []
curated = []
for i, m in enumerate(meta_j['modes']):
    mode_id = slug(m['name'].split('(')[0])
    modes.append({'id': mode_id, 'name': m['name'], 'rules': m.get('rules', ''), 'rewards': m.get('rewards', ''),
                  'tips': m.get('tips', []), 'deckCount': len(m.get('decks', []))})
    for d in m.get('decks', []):
        curated.append({
            'id': slug(mode_id + '-' + d['name']), 'mode': mode_id, 'modeName': m['name'],
            'name': d['name'], 'master': resolve_master(d.get('master', '')), 'masterName': d.get('master', ''),
            'cards': card_refs(d.get('cards', [])), 'avg': d.get('avg_mana'),
            'playstyle': d.get('playstyle', ''), 'gameplan': d.get('gameplan', ''),
            'combos': d.get('combos', []), 'tips': d.get('tips', ''), 'weak': d.get('weak_against', ''),
            'source': d.get('source', ''),
        })

# ---------------- Kombos / Counter / Top ----------------
combos = [{'name': c['name'], 'cards': card_refs(c['cards']), 'why': c.get('why', ''), 'how': c.get('how', '')}
          for c in cards_j.get('combos', [])]
counters = [{'threat': card_refs([c['threat']])[0], 'answers': card_refs(c.get('answers', [])),
             'tip': c.get('tip', '')} for c in cards_j.get('counters', [])]
top_cards = [{'card': resolve(t['name']) or {'name': t['name']}, 'why': t['why']} for t in cards_j.get('top_cards', [])]

# ---------------- Basics ----------------
b = basics_j
factions = []
for f_ in b.get('factions', []):
    fid = slug(f_['name'])
    icon = f'img/factions/{fid}.png'
    factions.append({'id': fid, 'name': f_['name'], 'theme': f_.get('theme', ''),
                     'icon': icon if os.path.exists(os.path.join(ROOT, icon)) else ''})

sources = []
seen = set()
for src in (cards_j.get('sources', []) + masters_j.get('sources', []) + meta_j.get('sources', []) + b.get('sources', [])):
    u = src.get('url', '')
    if u and u not in seen:
        seen.add(u)
        sources.append({'url': u, 'date': src.get('date', ''), 'note': src.get('note', '')})

data = {
    'built': '2026-10-24',
    'patch': meta_j.get('current_patch', ''),
    'cards': cards,
    'cardRates': card_rates,
    'masters': masters,
    'masterSystem': masters_j.get('system_explanation', ''),
    'masterNotes': masters_j.get('notes', {}),
    'masterStats': stats_master,
    'masterPick': master_pick,
    'metaSummary': meta_j.get('meta_summary', ''),
    'archetypes': meta_j.get('archetypes', []),
    'patchHistory': meta_j.get('patch_history', []),
    'modes': modes,
    'decks': curated,
    'lbDecks': lb_decks,
    'combos': combos,
    'counters': counters,
    'topCards': top_cards,
    'cardMeta': cards_j.get('meta', {}),
    'basics': {
        'overview': b.get('overview', ''), 'mechanics': b.get('mechanics', []), 'keywords': b.get('keywords', []),
        'economy': b.get('economy', []), 'ranks': b.get('ranks', ''), 'beginner': b.get('beginner_tips', []),
        'advanced': b.get('advanced_tips', []), 'lore': b.get('lore', ''), 'timeline': b.get('timeline', []),
        'links': b.get('links', []),
    },
    'factions': factions,
    'sources': sources,
}

out = os.path.join(ROOT, 'js', 'data.js')
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w', encoding='utf-8') as f:
    f.write('/* Automatisch erzeugt von tools/build_data.py — nicht von Hand bearbeiten. */\n')
    f.write('window.MM = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')

print(f'{len(cards)} Karten, {len(masters)} Master, {len(curated)} kuratierte Decks, {len(lb_decks)} Leaderboard-Decks, '
      f'{len(combos)} Kombos, {len(counters)} Counter, {len(sources)} Quellen')
print('Master-Stats:', len(stats_master), 'Master-Picks:', len(master_pick), 'Kartenraten:', len(card_rates))
if unresolved:
    print('Nicht aufgelöst:', sorted(unresolved))
