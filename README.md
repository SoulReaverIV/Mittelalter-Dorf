# Mittelalter-Dorf

Ein vollständiges Idle-/Aufbau-Browsergame mit:

- Holzfällerlager
- Bauernhof
- Steinbruch
- Wohnhäusern (Bevölkerungsgrenze + Wachstum)
- Dorfbewohner-System (Arbeiter manuell zuweisen)
- Bewohnerwerte (Zufriedenheit + Gesundheit)
- Markt (manuell + Auto-Verkauf, dynamische Preise)
- Jahreszeiten-System
- Welt-Ereignisse (temporäre Boni/Mali)
- Quest-/Meilenstein-System mit Belohnungen
- Offline-Fortschritt beim Laden
- Prestige-Reset
- Auto-Save (localStorage)

## Starten

Einfach `index.html` im Browser öffnen.

Optional per lokalem Server:

```bash
python3 -m http.server 4173
```

Dann im Browser:

`http://127.0.0.1:4173/index.html`

## PR-Prozess (Konflikte sauber lösen)

Wenn eine PR wegen Konflikten nicht mergebar ist, nutze das Skript:

```bash
./takeover_pr.sh <COMMIT_HASH> [REMOTE] [BASE_BRANCH] [NEW_BRANCH]
```

Beispiel:

```bash
./takeover_pr.sh cf96054 origin main fix/rebuild-clean-pr
```

Das Skript übernimmt:
- Fetch + Update von `main`
- neue saubere Branch
- `cherry-pick` des gewünschten Commits
- Syntax-Checks für alle Spielmodule

Bei Konflikten stoppt es sauber und zeigt die nächsten Befehle an.
