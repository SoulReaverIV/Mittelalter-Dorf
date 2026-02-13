#!/usr/bin/env bash
set -euo pipefail

# Automatisiert den "sauberen PR-Neustart" für konfliktlastige Branches.
# Nutzung:
#   ./takeover_pr.sh <COMMIT_HASH> [REMOTE] [BASE_BRANCH] [NEW_BRANCH]
# Beispiel:
#   ./takeover_pr.sh cf96054 origin main fix/rebuild-clean-pr

COMMIT_HASH="${1:-}"
REMOTE="${2:-origin}"
BASE_BRANCH="${3:-main}"
NEW_BRANCH="${4:-fix/rebuild-clean-pr}"

if [[ -z "$COMMIT_HASH" ]]; then
  echo "❌ Bitte COMMIT_HASH angeben."
  exit 1
fi

if ! git rev-parse --verify "$COMMIT_HASH" >/dev/null 2>&1; then
  echo "❌ Commit nicht gefunden: $COMMIT_HASH"
  exit 1
fi

if ! git remote get-url "$REMOTE" >/dev/null 2>&1; then
  echo "❌ Remote '$REMOTE' nicht gefunden."
  echo "   Erst Remote setzen, z. B.:"
  echo "   git remote add origin <GIT_URL>"
  exit 1
fi

echo "➡️  Hole aktuelle Daten von $REMOTE ..."
git fetch "$REMOTE"

echo "➡️  Wechsle auf $BASE_BRANCH ..."
git checkout "$BASE_BRANCH"
git pull "$REMOTE" "$BASE_BRANCH"

echo "➡️  Erstelle neue Branch: $NEW_BRANCH"
git checkout -B "$NEW_BRANCH"

echo "➡️  Übernehme Commit per cherry-pick: $COMMIT_HASH"
if ! git cherry-pick "$COMMIT_HASH"; then
  echo "⚠️  Cherry-pick hat Konflikte erzeugt."
  echo "   Bitte Konflikte lösen und dann ausführen:"
  echo "   git add <dateien>"
  echo "   git cherry-pick --continue"
  exit 2
fi

echo "➡️  Führe Syntax-Checks aus ..."
node --check main.js
node --check constants.js
node --check state.js
node --check woodcutter.js
node --check farm.js
node --check quarry.js
node --check housing.js
node --check market.js
node --check villagers.js
node --check quests.js
node --check events.js

echo "✅ Fertig. Jetzt pushen und neue PR erstellen:"
echo "   git push -u $REMOTE $NEW_BRANCH"
