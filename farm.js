// farm.js
// Logik für den Bauernhof

import {
  BASE_FARM_PER_COMPLETION,
  BASE_FARM_WORK_SPEED,
} from "./constants.js";

import {
  gameState,
  farmLevels,
  seasons,
} from "./state.js";

export function getFarmPerCompletion() {
  const b = gameState.buildings.farm;
  const levelData = farmLevels[b.level];
  if (!levelData) return 0;

  let amount = levelData.baseProduction ?? BASE_FARM_PER_COMPLETION;

  if (b.upgrades.betterSeeds) amount *= 1.3;

  const season = seasons[gameState.season.index];
  if (season && typeof season.foodMult === "number") {
    amount *= season.foodMult;
  }

  return amount;
}

export function getFarmWorkSpeed() {
  const b = gameState.buildings.farm;
  let speed = BASE_FARM_WORK_SPEED;

  if (b.upgrades.betterPlow) speed += 0.05;
  if (b.upgrades.secondFarmer) speed += 0.1;

  speed *= 1 + gameState.resources.prestige * 0.02;

  return speed;
}

export function getFoodProductionPerSecond() {
  return getFarmPerCompletion() * getFarmWorkSpeed();
}

export function tickFarm(dt) {
  const b = gameState.buildings.farm;
  const r = gameState.resources;

  const speed = getFarmWorkSpeed();
  b.workProgress += speed * dt;

  while (b.workProgress >= 1) {
    b.workProgress -= 1;

    let gain = getFarmPerCompletion();

    const free = r.foodStorageMax - r.food;
    if (free <= 0) {
      gain = 0;
    } else if (gain > free) {
      gain = free;
    }

    if (gain <= 0) break;

    r.food += gain;
  }
}

export function upgradeFarmLevel() {
  const b = gameState.buildings.farm;
  const r = gameState.resources;

  const nextLevel = b.level + 1;
  const data = farmLevels[nextLevel];

  if (!data) return;
  if (r.gold < data.goldCost) return;

  r.gold -= data.goldCost;
  b.level = nextLevel;
}

export function buyFarmUpgrade(key) {
  const b = gameState.buildings.farm;
  const r = gameState.resources;

  const costs = {
    betterPlow: 200,
    betterSeeds: 350,
    secondFarmer: 800,
  };

  const cost = costs[key];
  if (!cost) return;
  if (b.upgrades[key]) return;
  if (r.gold < cost) return;

  r.gold -= cost;
  b.upgrades[key] = true;
}
