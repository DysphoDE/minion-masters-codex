# Minion Masters Codex

Inoffizieller Fan-Guide zu [Minion Masters](https://store.steampowered.com/app/489520/Minion_Masters/): Meta-Decks aus den Ranglisten, Builds für alle 14 Master, Datenbank mit allen Karten, Tierlist, Kombos, Counter, Deckbuilder und Grundlagen.

**Live:** https://dysphode.github.io/minion-masters-codex/

Stand: Patch 2.34 (Oktober 2026).

## Aufbau

Eine statische Seite ohne Build-Schritt:

- `index.html`, `css/style.css`, `js/app.js`: Seite und Logik (Hash-Routing)
- `js/content.js`: kuratierte Texte, Fakten und Kategorien
- `js/data.js`: erzeugte Daten (nicht von Hand bearbeiten)
- `data/`: Recherche-Rohdaten (JSON und CSV)
- `img/`: Kartenbilder, Master-Porträts, Icons, Screenshots

Daten neu erzeugen, nachdem etwas in `data/` geändert wurde:

```bash
python3 tools/build_data.py
```

## Quellen und Rechte

Kein offizielles Produkt von BetaDwarf. Minion Masters, alle Kartenbilder, Master-Artworks, Logos und Screenshots gehören BetaDwarf. Kartenbilder und Kartentexte stammen aus dem [Minion Masters Wiki](https://minionmasters.fandom.com) (Texte unter CC BY-SA), Screenshots von Steam und der offiziellen Website. Ranglisten-Decks und Spielraten stammen aus der Meta-Auswertung von [BadAsAFish80](https://badasafish80.com/minion-masters-meta-2-33/), Master-Winrates aus den öffentlichen Minion Masters Stats. Alle Quellen sind auf der Seite unter „Lore & Links“ aufgeführt.
