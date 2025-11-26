// Spielzustand
const gameState = {
  resources: {
    wood: 0,
    stone: 200,
    gold: 500,
    prestige: 0,
    woodStorageMax: 1000,
  },
  buildings: {
    woodcutter: {
      level: 1,
      workProgress: 0, // 0–1: Fortschritt bis zur nächsten Lieferung
      upgrades: {
        sharpAxe: false,
        secondWorker: false,
        mechanicalSaw: false,
      },
    },
  },
  season: { index: 0 }, // später für Jahreszeiten
};

// Level-Daten Holzfällerlager
const woodcutterLevels = {
  1: { baseProduction: 1, goldCost: 0 },
  2: { baseProduction: 2, goldCost: 100 },
  3: { baseProduction: 4, goldCost: 300 },
  4: { baseProduction: 7, goldCost: 800 },
  5: { baseProduction: 12, goldCost: 2000 },
};

// Holz pro Abschluss (eine "fertige" Arbeitseinheit)
function getWoodPerCompletion() {
  const building = gameState.buildings.woodcutter;
  const base = woodcutterLevels[building.level].baseProduction;

  let multiplier = 1;
  if (building.upgrades.mechanicalSaw) multiplier *= 2;

  return base * multiplier;
}

// Arbeitsgeschwindigkeit (Fortschritt pro Tick/Sekunde)
function getWorkSpeed() {
  let speed = 0.1; // Basis: 10 Sekunden pro Abschluss

  const upg = gameState.buildings.woodcutter.upgrades;
  if (upg.sharpAxe) speed += 0.05;   // schneller
  if (upg.secondWorker) speed += 0.1; // deutlich schneller

  // Prestige-Bonus: +2 % pro Punkt
  speed *= 1 + gameState.resources.prestige * 0.02;

  return speed;
}

// Haupt-Tick – 1x pro Sekunde
function gameTick() {
  const building = gameState.buildings.woodcutter;

  // Arbeitsfortschritt erhöhen
  building.workProgress += getWorkSpeed();

  // Solange eine "Einheit" fertig ist, Holz gutschreiben
  while (building.workProgress >= 1) {
    building.workProgress -= 1;

    let gain = getWoodPerCompletion();
    const freeSpace =
      gameState.resources.woodStorageMax - gameState.resources.wood;

    gain = Math.min(gain, freeSpace);
    if (gain <= 0) break;

    gameState.resources.wood += gain;
  }

  updateUI();
}

// Holzfällerlager-Level erhöhen
function upgradeWoodcutterLevel() {
  const building = gameState.buildings.woodcutter;
  const nextLevel = building.level + 1;
  const data = woodcutterLevels[nextLevel];
  if (!data) return; // max Level erreicht

  if (gameState.resources.gold >= data.goldCost) {
    gameState.resources.gold -= data.goldCost;
    building.level = nextLevel;
  }
}

// Upgrades für Holzfällerlager
function buyWoodcutterUpgrade(key) {
  const upg = gameState.buildings.woodcutter.upgrades;

  const costs = {
    sharpAxe: 150,
    secondWorker: 300,
    mechanicalSaw: 1000,
  };

  if (!costs[key]) return;
  if (upg[key]) return; // schon gekauft
  if (gameState.resources.gold < costs[key]) return;

  gameState.resources.gold -= costs[key];
  upg[key] = true;

  // hier später Spezialeffekte wie größeres Lager ergänzen
}

// UI aktualisieren
function updateUI() {
  // Ressourcen
  document.getElementById("wood").textContent =
    Math.floor(gameState.resources.wood);
  document.getElementById("gold").textContent =
    Math.floor(gameState.resources.gold);
  document.getElementById("stone").textContent =
    Math.floor(gameState.resources.stone);
  document.getElementById("prestige").textContent =
    gameState.resources.prestige;

  const woodcutter = gameState.buildings.woodcutter;

  // Holzfällerlager-Anzeige
  document.getElementById("woodLevel").textContent =
    woodcutter.level;

  document.getElementById("woodPerHit").textContent =
    getWoodPerCompletion();

  document.getElementById("woodMax").textContent =
    gameState.resources.woodStorageMax;

  // Fortschrittsbalken
  const progress =
    Math.min(woodcutter.workProgress, 1) * 100;
  document.getElementById("workBar").style.width = progress + "%";

  // Kosten nächstes Level
  const nextLevel = woodcutter.level + 1;
  const nextData = woodcutterLevels[nextLevel];
  const costSpan = document.getElementById("woodLevelCost");

  if (nextData) {
    costSpan.textContent = nextData.goldCost;
  } else {
    costSpan.textContent = "Max";
  }

  // Zeit bis zur nächsten Lieferung
  const timeSpan = document.getElementById("timeToNext");
  if (timeSpan) {
    const speed = getWorkSpeed();
    if (speed > 0) {
      const remaining = Math.max(0, 1 - woodcutter.workProgress);
      const seconds = remaining / speed; // Tick = 1s
      timeSpan.textContent = seconds.toFixed(1);
    } else {
      timeSpan.textContent = "–";
    }
  }
}

// Spiel starten: 1 Tick pro Sekunde
setInterval(gameTick, 1000);

// Initiales UI-Update
updateUI();
