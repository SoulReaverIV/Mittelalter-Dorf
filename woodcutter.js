// woodcutter.js
// Logik für das Holzfällerlager

import {
  BASE_WOOD_WORK_SPEED,
} from "./constants.js";

import {
  gameState,
  woodcutterLevels,
  seasons,
} from "./state.js";
import { getStaffingFactor } from "./villagers.js";

// ===============================
// Hilfsfunktionen: Produktion
// ===============================

// Holz pro Abschluss (inkl. Level, Upgrades, Jahreszeit)
export function getWoodPerCompletion() {
  const b = gameState.buildings.woodcutter;
  const levelData = woodcutterLevels[b.level];

  if (!levelData) return 0;

  let amount = levelData.baseProduction;

  // Upgrade: mechanische Säge verdoppelt Produktion
  if (b.upgrades.mechanicalSaw) {
    amount *= 2;
  }

  // Jahreszeiten-Multiplikator
  const season = seasons[gameState.season.index];
  if (season && typeof season.woodMult === "number") {
    amount *= season.woodMult;
  }

  return amount;
}

// Arbeitstempo pro Sekunde (Fortschritt pro Sekunde)
export function getWoodWorkSpeed() {
  const b = gameState.buildings.woodcutter;
  let speed = BASE_WOOD_WORK_SPEED; // Basis

  // Upgrades
  if (b.upgrades.sharpAxe) speed += 0.05;
  if (b.upgrades.secondWorker) speed += 0.10;

  // Prestige als globaler Produktionsbonus
  speed *= 1 + gameState.resources.prestige * 0.02;

  speed *= getStaffingFactor("woodcutter");

  return speed;
}

// Holz pro Sekunde (nur zur Anzeige)
export function getWoodPerSecond() {
  return getWoodPerCompletion() * getWoodWorkSpeed();
}

// ===============================
// Tick-Logik
// ===============================

// dt = vergangene Zeit in Sekunden
export function tickWoodcutter(dt) {
  const b = gameState.buildings.woodcutter;
  const speed = getWoodWorkSpeed();
  const r = gameState.resources;

  // Fortschritt erhöhen
  b.workProgress += speed * dt;

  // Solange wir einen „Abschluss“ erreicht haben, Holz gutschreiben
  while (b.workProgress >= 1) {
    b.workProgress -= 1;

    let gain = getWoodPerCompletion();

    // Lagerbegrenzung beachten
    const free = r.woodStorageMax - r.wood;
    if (free <= 0) {
      gain = 0;
    } else if (gain > free) {
      gain = free;
    }

    if (gain <= 0) break;

    r.wood += gain;
  }
}

// ===============================
// Upgrades & Level
// ===============================

// Level-Up, wenn genug Gold vorhanden
export function upgradeWoodcutterLevel() {
  const b = gameState.buildings.woodcutter;
  const r = gameState.resources;

  const nextLevel = b.level + 1;
  const data = woodcutterLevels[nextLevel];

  if (!data) return; // Max-Level erreicht
  if (r.gold < data.goldCost) return; // zu wenig Gold

  r.gold -= data.goldCost;
  b.level = nextLevel;
}

// Upgrade kaufen (sharpAxe, secondWorker, mechanicalSaw)
export function buyWoodcutterUpgrade(key) {
  const b = gameState.buildings.woodcutter;
  const r = gameState.resources;

  const costs = {
    sharpAxe: 150,
    secondWorker: 300,
    mechanicalSaw: 1000,
  };

  const cost = costs[key];
  if (!cost) return;
  if (b.upgrades[key]) return;       // bereits gekauft
  if (r.gold < cost) return;         // zu wenig Gold

  r.gold -= cost;
  b.upgrades[key] = true;
}
