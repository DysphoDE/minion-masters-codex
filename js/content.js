/* Kuratierte Inhalte für die Gestaltung: Kernaussagen, Fakten, Kategorien.
   Destilliert aus den Recherche-Daten (data/*.json); die Originaltexte bleiben als Details erreichbar. */
window.MMC = {
  basicsIntro: 'Zwei Master, zwei Brücken, zehn Karten. Minion Masters verbindet Deckbuilding mit Tower Defense in Echtzeit: Wer die Brücken hält, sammelt XP, schaltet Perks frei und gewinnt am Ende das Mana-Rennen.',

  facts: [
    { icon: 'cards', big: '10', label: 'Karten im Deck', sub: 'ein Exemplar reicht seit 2.0' },
    { icon: 'hand', big: '4', label: 'Karten auf der Hand', sub: 'gespielte Karten gehen ans Deckende' },
    { icon: 'mana', big: '10', label: 'Mana maximal', sub: 'lädt für beide gleich schnell' },
    { icon: 'bridge', big: '2', label: 'Brücken', sub: '+1 XP alle 4 s pro Brücke' },
    { icon: 'star', big: '20 · 60 · 120', label: 'XP für Perk 1 · 2 · 3', sub: 'drei Stufen pro Match' },
    { icon: 'flame', big: '200', label: 'XP bis Mana Frenzy', sub: 'im 2v2: 400 XP' },
    { icon: 'clock', big: '3:20', label: 'volles Mana-Tempo', sub: 'alle 40 s wird es schneller' },
    { icon: 'crown', big: '14', label: 'Master', sub: 'je 3 Perks + Alternativen' },
  ],

  arena: [
    { n: 1, title: 'Deine Hälfte', text: 'Nur hier darfst du Karten platzieren. Ausnahmen sind Effekte wie Infiltration oder Walking Blind Date.' },
    { n: 2, title: 'Gehaltene Brücke', text: 'Ein eigener Minion auf der Brücke erobert sie. Jede gehaltene Brücke gibt +1 XP alle 4 s, ab Mana Frenzy Mana.' },
    { n: 3, title: 'Neutrale Brücke', text: 'Gelbe Brücken gehören niemandem und geben keine XP. Brücken greifen selbst nicht an.' },
    { n: 4, title: 'Dein Master', text: 'Steht auf deinem Turm und greift mit seinem Grundangriff mit. Fällt er, ist das Match verloren.' },
    { n: 5, title: 'Lanes', text: 'Minions ohne Ziel laufen auf dem kürzesten Weg über eine Brücke zum gegnerischen Turm.' },
    { n: 6, title: 'Gegnerischer Master', text: 'Dein Ziel: Bring ihn auf 0 Lebenspunkte.' },
  ],

  manaRates: {
    times: [0, 40, 80, 120, 160, 200],
    '1v1': [2.62, 2.40, 2.18, 1.96, 1.74, 1.52],
    '2v2': [3.15, 2.905, 2.74, 2.535, 2.33, 2.125],
  },

  mechanics: [
    { icon: 'map', title: 'Arena & Lanes', ref: 'Arena & Lanes',
      key: 'Jede Seite spielt nur in ihrer eigenen Hälfte. Zwei Brücken verbinden die Hälften.',
      bullets: ['Zwei Lanes mit je einer Brücke (8 Einheiten breit).', 'Karten nur in der eigenen Hälfte platzierbar, außer mit Infiltration oder Walking Blind Date.', 'Manche Gebäude haben eine Placement Aura und lassen sich nicht direkt am Rand setzen.'] },
    { icon: 'trophy', title: 'Siegbedingung', ref: 'Siegbedingung & Matchdauer',
      key: 'Zerstöre den gegnerischen Master auf seinem Turm.',
      bullets: ['Ein festes Zeitlimit ist nicht dokumentiert.', 'Ab 3:20 läuft das Mana maximal schnell, Partien beschleunigen sich stark.', 'Typische Matches dauern länger als drei Minuten.'] },
    { icon: 'mana', title: 'Mana', ref: 'Mana',
      key: 'Mana lädt automatisch und für beide Seiten gleich schnell, bis maximal 10.',
      bullets: ['1v1: 1 Mana alle 2,62 s, alle 40 s schneller bis 1,52 s ab 3:20.', '2v2: von 3,15 s bis 2,125 s pro Mana.', 'Mana Freeze (X) streicht dir die nächsten X Mana.'] },
    { icon: 'star', title: 'XP & Perks', ref: 'XP, Perks & Mana Frenzy',
      key: 'XP gibt es passiv und für jede gehaltene Brücke. Sie schalten die drei Perks deines Masters frei.',
      bullets: ['Passiv 1 XP alle 4 s (2v2: 2 XP, im Team geteilt).', '+1 XP alle 4 s pro gehaltener Brücke.', 'Perks bei 20, 60 und 120 XP.', 'Extra-XP: Bounty Sniper (+2 pro Kill oder Turmtreffer), Dionas Ruffles, Bridge Shrine.'] },
    { icon: 'flame', title: 'Mana Frenzy', ref: 'XP, Perks & Mana Frenzy',
      key: 'Ab 200 XP (2v2: 400) wird jede weitere XP zu Mana.',
      bullets: ['Brückenkontrolle wird damit direkt zu Bonus-Mana.', 'Mit beiden Brücken nach etwa 4:27 erreicht, ohne Brücke erst nach etwa 13:20.', 'Wer zuerst in der Frenzy ist, gewinnt oft das Late Game.'] },
    { icon: 'bridge', title: 'Brücken', ref: 'Brücken erobern',
      key: 'Ein Minion auf der Brücke erobert sie für deine Seite.',
      bullets: ['Gelbe Brücken sind neutral und geben niemandem XP.', 'Brücken greifen nicht an, ihr Wert ist XP und später Mana.', 'Mana Puff erzeugt auf einer Brücke alle 10 s 1 Mana.'] },
    { icon: 'tower', title: 'Master & Grundangriff', ref: 'Meister & Grundangriff',
      key: 'Dein Master kämpft vom Turm aus mit und wird durch Perks stärker.',
      bullets: ['Valorian: 45 Schaden alle 2 s. Tronveir: 100 Schaden alle 4 s.', 'Stormbringer: Reichweite 20, ab Perk 1 global.', 'Seit Patch 2.6 gibt es Alternativ-Perks. Gewählt wird im Deckbau oder im Match, bis die Schwelle erreicht ist.'] },
    { icon: 'cards', title: 'Deck & Kartenzyklus', ref: 'Deck, Hand & Kartenzyklus',
      key: 'Gespielte Karten wandern ans Ende des Decks, das Deck rotiert.',
      bullets: ['10 Karten im Deck, 4 davon auf der Hand.', 'Perk-Karten landen meist oben im Deck.', 'Manche Karten sind auf 1 Kopie limitiert, z. B. Ghast, Rendrath, Spiderlings und Undying Skeleton.', 'Seit 2.31 lassen sich Decks per Code teilen (Steam).'] },
    { icon: 'hourglass', title: 'Beschwörung', ref: 'Beschwörung & Verzögerungen',
      key: 'Zwischen Klick und Wirkung vergeht Zeit, also immer einen Schritt vorausdenken.',
      bullets: ['0,5 s bis der Effekt startet.', 'Zauber haben eine eigene Cast-Verzögerung: Black Hole unter 1 s, Call to Arms über 2 s.', 'Minions und Gebäude stehen 1 s eingefroren da, sind aber schon angreifbar.', 'Das Keyword Rush hebt diese Verzögerung auf.'] },
    { icon: 'target', title: 'Zielauswahl', ref: 'Zielauswahl der Einheiten',
      key: 'Einheiten greifen das nächste erreichbare Ziel an und bleiben dann dabei.',
      bullets: ['Aggro-Radius: 8 oder die eigene Reichweite, je nachdem was größer ist.', 'Ein Zielwechsel passiert nur bei Tod, Stealth, Stun, Taunt oder wenn das Ziel den Radius verlässt.', 'Marked hat Vorrang vor Taunt.', 'Flieger treffen nur Einheiten mit Luft-Ziel. Luftabwehr gehört in jedes Deck.'] },
    { icon: 'swords', title: 'Angriffsanimation', ref: 'Angriffsanimation',
      key: 'Ein Angriff besteht aus Ausholen, Treffer und Erholung.',
      bullets: ['Ausholen + Erholung = Angriffstempo.', 'Verliert eine Einheit ihr Ziel beim Ausholen, bricht der Angriff ab.', 'Stealth oder Black Hole kurz vor dem Treffer verschwenden gegnerische Angriffe.'] },
  ],

  keywordCats: [
    { id: 'combat', label: 'Kampf & Ziele', icon: 'target', names: ['Flying / Ground (Targets)', 'Ranged / Melee', 'AoE (Flächenschaden)', 'Marksmanship', 'Taunt (Spott)', 'Marked (Markiert)', 'Stealth (Tarnung)', 'Sneaky'] },
    { id: 'buff', label: 'Buffs & Schutz', icon: 'shield', names: ['Haste (Eile)', 'Rage (Wut)', "Berserker's Rage", 'Shield (Schild)', 'Divine Shield', 'Barrel Shield', 'Bulwark', 'Thick Hide (Dicke Haut)', 'Spirit', 'Vampiric', 'Mana Surge', 'Growthburst Shroom / Giant Growth'] },
    { id: 'control', label: 'Kontrolle & Debuffs', icon: 'snow', names: ['Stun (Betäubung)', 'Frozen (Eingefroren)', 'Icebreaker', 'Slow (Verlangsamung)', 'Poison (Gift)', 'Cursed (Verflucht)', 'Fear (Furcht)', 'Hypnotized', 'Knockback / Pull', 'Mana Freeze (X)'] },
    { id: 'card', label: 'Karten & Beschwörung', icon: 'cards', names: ['Rush', 'Summoning Sickness', 'Mythic', 'Legion (X)', 'Myriad (X)', 'Piloted', 'Ability (Fähigkeitskarte)', 'Invoke', 'Blood Pact', 'Puff (Kartentyp)'] },
    { id: 'faction', label: 'Fraktions-Mechaniken', icon: 'sparkles', names: ['Slitherbind (X) / Sacrifice', 'Revelry (Stoutheart)', 'Accursed Ascension', 'Empyrean Army', 'Outlander Tech', 'Scrat Swarm', 'Voidborne Wound', 'Zen-Chi Flow'] },
  ],

  leagues: [
    { name: 'Wood', ranks: 'Rang 40–36', reward: 'Keine Verluste bei Niederlagen', color: '#8a6a4a' },
    { name: 'Stone', ranks: 'Rang 35–31', reward: '15× zufällige Common', color: '#8d93a6' },
    { name: 'Bronze', ranks: 'Rang 30–26', reward: '3000 Gold', color: '#c9824a' },
    { name: 'Silver', ranks: 'Rang 25–21', reward: '15× zufällige Rare', color: '#c3cbe0' },
    { name: 'Gold', ranks: 'Rang 20–16', reward: '5 Power Tokens', color: '#f2c14e' },
    { name: 'Platinum', ranks: 'Rang 15–11', reward: '10× zufällige Supreme', color: '#6fd6c8' },
    { name: 'Diamond', ranks: 'Rang 10–6', reward: '500 Shards', color: '#5ab4ff', icon: 'img/leagues/diamond.png' },
    { name: 'Master', ranks: 'Rang 5–1', reward: '10 Power Tokens', color: '#b47bff', icon: 'img/leagues/master.png' },
    { name: 'Grandmaster', ranks: 'Platzierung', reward: '1 Legendary', color: '#ff7a59', icon: 'img/leagues/grandmaster.png' },
    { name: 'Contender', ranks: '2000 Punkte in GM', reward: '300 Rubine + Chatfarbe', color: '#ffdf8a', icon: 'img/leagues/contender.png' },
  ],

  modeCards: {
    '1v1': { icon: 'swords', avg: 3.67, blurb: 'Günstige Tempo-Decks um Heal Puff, Morgrul the Swarmer King und Karmic dominieren.' },
    rand: { icon: 'users', avg: 3.77, blurb: 'Accursed-Skelette mit Morellia vorne, dahinter Control mit The Veilstalker und Beam of DOOM!.' },
    pre: { icon: 'users', avg: 4.20, blurb: 'Big-Minion-Ramp mit Mordar plus ein kontrollierender Partner. Die teuersten Decks der Meta.' },
    draft: { icon: 'dice', avg: 3.69, blurb: 'Tronveir ist der meistgedraftete Master, Scrat die stärkste Draft-Fraktion.' },
  },

  patch: {
    version: '2.34', date: '19.10.2026', title: 'Karma',
    nerfs: [
      ["A'Zog, Voidfiend of Shars'Rakk", 'Schaden 30×2 → 25×2, Shadow Dash 75'],
      ['Karmic', 'Schaden 9×3 → 8×3'],
      ['Screaming Scrat', 'kein Rush mehr, explodiert nach 4 statt 3 s'],
      ['Feng the Wanderer', 'kostet 6 statt 5 Mana (dafür 400 HP)'],
      ["Korrrgoth, Tyrant of Gor'Rakk", 'Reichweite 6'],
      ['Zap Shrine', 'Reichweite 16'],
      ['Terror Brutus', '2350 HP'],
    ],
    buffs: [
      ['AtG Drone x8', 'verstärkt'], ['Brothers of Light', 'verstärkt'], ['Chief Ice Breaker Bolf', 'verstärkt'],
      ["Jez'Ra", 'verstärkt'], ['Stormtamer', 'verstärkt'], ['The Revenant', 'verstärkt'],
      ['Re-Boomer', 'verstärkt'], ['Magma Cannon', 'erhält Icebreaker'],
    ],
    limits: ['Ghast', 'Rendrath the Deathless', 'Spiderlings', 'Undying Skeleton'],
    masterBuff: 'Valorian wurde ebenfalls verstärkt.',
  },

  modeFacts: {
    'ranked-1v1': { icon: 'swords', facts: ['1 gegen 1', 'eigenes Deck', 'Ligen Wood bis Contender', 'Reset mit jedem Update'] },
    'ranked-2v2-randoms': { icon: 'users', facts: ['2 gegen 2', 'zufälliger Partner', 'doppelte Karten im Team erlaubt'] },
    'ranked-2v2-premade': { icon: 'users', facts: ['2 gegen 2', 'fester Partner', 'keine gleichen Karten oder Master im Team'] },
    draft: { icon: 'dice', facts: ['1 gegen 1', '750 Gold oder 55 Rubine', 'Master aus 3, dann 10× Karte aus 3', 'bis 12 Siege oder 3 Niederlagen'] },
    mayhem: { icon: 'bolt', facts: ['2 gegen 2', 'Donnerstag bis Sonntag', 'wöchentliche Sonderregeln', '750 Gold, erster Run gratis'] },
    adventures: { icon: 'compass', facts: ['PvE', 'solo oder Koop', 'Roguelike-Deckbau', 'teils 600 Rubine'] },
    practice: { icon: 'robot', facts: ['gegen Bots', 'Schwierigkeit wählbar', 'Freundschaftsspiele'] },
    'entfernte-modi': { icon: 'hourglass', facts: ['Conquest', 'House Event', 'Expeditions', 'Challenges'] },
  },

  economyIcons: {
    'Gold': 'coin', 'Shards (Scherben)': 'shard', 'Rubine': 'gem', 'Power Tokens / Power Tower': 'token',
    'Karten-Promotion & Glory': 'star', 'Season Pass': 'ticket', 'Premium Upgrade (DLC)': 'gift',
    'All Masters Upgrade (DLC)': 'crown', 'Fraktions-/Season-DLCs': 'layers', 'Profil-Level-Belohnungen': 'user',
    'Rangbelohnungen (pro Season, einmalig)': 'trophy', 'Abgeschaffte Systeme': 'hourglass', 'F2P-Tipps: Wofür zuerst ausgeben?': 'sparkles',
  },
};
