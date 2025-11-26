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
      workProgress: 0,
      upgrades: {
        sharpAxe: false,
        secondWorker: false,
        mechanicalSaw: false,
      },
    },
  },
  season: { index: 0 },
};

// Level-Daten
const woodcutterLevels = {
  1: { baseProduction: 1, goldCost: 0 },
  2: { baseProduction: 2, goldCost: 100 },
  3: { baseProduction: 4, goldCost: 300 },
  4: { baseProduction: 7, goldCost: 800 },
  5: { baseProduction: 12, goldCost: 2000 },
};

// Produktionsmenge pro Abschluss
function getWoodPerCompletion() {
  const building = gameState.buildings.woodcutter;
  const base = woodcutterLevels[building.level].baseProduction;

  let multiplier = 1;
  if (building.upgrades.mechanicalSaw) multiplier *= 2;

  return base * multiplier;
}

// Arbeitsgeschwindigkeit
function getWorkSpeed() {
  let speed = 0.1; // am Anfang: 10 Sekunden pro Abschluss

  const upg = gameState.buildings.woodcutter.upgrades;
  if (upg.sharpAxe) speed += 0.05;
  if (upg.secondWorker) speed += 0.1;

  speed *= 1 + gameState.resources.prestige * 0.02;
  return speed;
}

// Spiel-Tick
function gameTick() {
  const building = gameState.buildings.woodcutter;

  // Arbeitsfortschritt aufbauen
  building.workProgress += getWorkSpeed();

  // Pro "voller" Arbeitseinheit Holz erzeugen
  while (building.workProgress >= 1) {
    building.workProgress -= 1;

    let gain = getWoodPerCompletion();
    const freeSpace =
      gameState.resources.woodStorageMax - gameState.resources.wood;
    gain = Math.min(gain, freeSpace);

    gameState.resources.wood += gain;
  }

  updateUI();
}

// Level erhöhen
function upgradeWoodcutterLevel() {
  const building = gameState.buildings.woodcutter;
  const nextLevel = building.level + 1;
  const data = woodcutterLevels[nextLevel];
  if (!data) return;

  if (gameState.resources.gold >= data.goldCost) {
    gameState.resources.gold -= data.goldCost;
    building.level = nextLevel;
  }
}

// Upgrade kaufen
function buyWoodcutterUpgrade(key) {
  const upg = gameState.buildings.woodcutter.upgrades;

  const costs = {
    sharpAxe: 150,
    secondWorker: 300,
    mechanicalSaw: 1000,
  };

  if (upg[key]) return;
  if (gameState.resources.gold < costs[key]) return;

  gameState.resources.gold -= costs[key];
  upg[key] = true;

  // Spezialeffekt: größeres Lager könnten wir später hier einbauen
}

// UI aktualisieren
function updateUI() {
  document.getElementById("wood").textContent =
    Math.floor(gameState.resources.wood);
  document.getElementById("gold").textContent =
    Math.floor(gameState.resources.gold);
  document.getElementById("stone").textContent =
    Math.floor(gameState.resources.stone);
  document.getElementById("prestige").textContent =
    gameState.resources.prestige;

  document.getElementById("woodLevel").textContent =
    gameState.buildings.woodcutter.level;

  document.getElementById("woodPerHit").textContent =
    getWoodPerCompletion();

  document.getElementById("woodMax").textContent =
    gameState.resources.woodStorageMax;

  const progress =
    Math.min(gameState.buildings.woodcutter.workProgress, 1) * 100;
  document.getElementById("workBar").style.width = progress + "%";
}

// Spiel starten: 1 Tick pro Sekunde
setInterval(gameTick, 1000);
