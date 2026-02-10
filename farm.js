import { BASE_FARM_WORK_SPEED } from "./constants.js";
import { farmLevels, gameState, seasons } from "./state.js";
import { getStaffingFactor } from "./villagers.js";

export function getFarmPerCompletion() {
  const b = gameState.buildings.farm;
  const levelData = farmLevels[b.level];
  if (!levelData) return 0;

  let amount = levelData.baseProduction;
  if (b.upgrades.betterSeeds) amount *= 1.3;

  const season = seasons[gameState.season.index];
  amount *= season.foodMult;

  return amount;
}

export function getFarmWorkSpeed() {
  const b = gameState.buildings.farm;
  let speed = BASE_FARM_WORK_SPEED;

  if (b.upgrades.betterPlow) speed += 0.05;
  if (b.upgrades.secondFarmer) speed += 0.10;

  speed *= 1 + gameState.resources.prestige * 0.02;
  speed *= getStaffingFactor("farm");
  return speed;
}

export function getFoodProductionPerSecond() {
  return getFarmPerCompletion() * getFarmWorkSpeed();
}

export function tickFarm(dt) {
  const b = gameState.buildings.farm;
  const r = gameState.resources;

  b.workProgress += getFarmWorkSpeed() * dt;

  while (b.workProgress >= 1) {
    b.workProgress -= 1;
    const free = r.foodStorageMax - r.food;
    if (free <= 0) break;

    r.food += Math.min(free, getFarmPerCompletion());
  }
}

export function upgradeFarmLevel() {
  const b = gameState.buildings.farm;
  const r = gameState.resources;
  const next = b.level + 1;
  const data = farmLevels[next];
  if (!data) return false;
  if (r.gold < data.goldCost) return false;

  r.gold -= data.goldCost;
  b.level = next;
  return true;
}

export function buyFarmUpgrade(key) {
  const costs = {
    betterPlow: 200,
    betterSeeds: 350,
    secondFarmer: 800,
  };

  const b = gameState.buildings.farm;
  const r = gameState.resources;

  const cost = costs[key];
  if (!cost || b.upgrades[key] || r.gold < cost) return false;

  r.gold -= cost;
  b.upgrades[key] = true;
  return true;
}
