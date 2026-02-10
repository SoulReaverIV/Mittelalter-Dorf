import { BASE_QUARRY_WORK_SPEED } from "./constants.js";
import { gameState, quarryLevels, seasons } from "./state.js";
import { getStaffingFactor } from "./villagers.js";

export function getStonePerCompletion() {
  const b = gameState.buildings.quarry;
  const levelData = quarryLevels[b.level];
  if (!levelData) return 0;

  let amount = levelData.baseProduction;
  if (b.upgrades.blastPowder) amount *= 1.4;

  const season = seasons[gameState.season.index];
  amount *= season.stoneMult;

  return amount;
}

export function getQuarryWorkSpeed() {
  const b = gameState.buildings.quarry;
  let speed = BASE_QUARRY_WORK_SPEED;

  if (b.upgrades.ironTools) speed += 0.04;
  if (b.upgrades.crane) speed += 0.08;

  speed *= 1 + gameState.resources.prestige * 0.02;
  speed *= getStaffingFactor("quarry");
  return speed;
}

export function getStoneProductionPerSecond() {
  return getStonePerCompletion() * getQuarryWorkSpeed();
}

export function tickQuarry(dt) {
  const b = gameState.buildings.quarry;
  const r = gameState.resources;

  b.workProgress += getQuarryWorkSpeed() * dt;

  while (b.workProgress >= 1) {
    b.workProgress -= 1;

    const free = r.stoneStorageMax - r.stone;
    if (free <= 0) break;

    r.stone += Math.min(free, getStonePerCompletion());
  }
}

export function upgradeQuarryLevel() {
  const b = gameState.buildings.quarry;
  const r = gameState.resources;

  const next = b.level + 1;
  const data = quarryLevels[next];
  if (!data || r.gold < data.goldCost) return false;

  r.gold -= data.goldCost;
  b.level = next;
  return true;
}

export function buyQuarryUpgrade(key) {
  const costs = {
    ironTools: 280,
    blastPowder: 700,
    crane: 1200,
  };

  const b = gameState.buildings.quarry;
  const r = gameState.resources;

  const cost = costs[key];
  if (!cost || b.upgrades[key] || r.gold < cost) return false;

  r.gold -= cost;
  b.upgrades[key] = true;
  return true;
}
