// housing.js
// Logik für Bevölkerung und Nahrung

import { FOOD_CONSUMPTION_PER_PERSON } from "./constants.js";
import {
  gameState,
  housingLevels,
} from "./state.js";

export function getFoodConsumptionPerSecond() {
  const r = gameState.resources;
  return r.population * FOOD_CONSUMPTION_PER_PERSON;
}

export function tickFoodAndPopulation(dt) {
  const r = gameState.resources;

  const cons = getFoodConsumptionPerSecond();
  r.food -= cons * dt;

  if (r.food < 0) r.food = 0;
  if (r.food > r.foodStorageMax) r.food = r.foodStorageMax;

  if (r.food <= 0 && r.population > 0) {
    gameState.starvationCounter += dt;
    if (gameState.starvationCounter >= 30) {
      r.population = Math.max(0, r.population - 1);
      gameState.starvationCounter = 0;
    }
  } else {
    gameState.starvationCounter = 0;
  }
}

export function getPopulationCap() {
  const b = gameState.buildings.housing;
  const base = housingLevels[b.level]?.popCap ?? 50;
  let bonus = 0;

  if (b.upgrades.granary) bonus += 10;
  if (b.upgrades.infirmary) bonus += 15;

  return base + bonus;
}

export function upgradeHousingLevel() {
  const b = gameState.buildings.housing;
  const r = gameState.resources;

  const next = housingLevels[b.level + 1];
  if (!next) return false;

  if (r.gold < next.goldCost) return false;
  if (r.wood < next.woodCost) return false;
  if (r.stone < next.stoneCost) return false;

  r.gold -= next.goldCost;
  r.wood -= next.woodCost;
  r.stone -= next.stoneCost;
  b.level += 1;
  return true;
}

export function buyHousingUpgrade(key) {
  const b = gameState.buildings.housing;
  const r = gameState.resources;

  const costs = {
    granary: { gold: 550, wood: 500, stone: 120 },
    infirmary: { gold: 900, wood: 400, stone: 250 },
  };

  const cost = costs[key];
  if (!cost) return false;
  if (b.upgrades[key]) return false;
  if (r.gold < cost.gold || r.wood < cost.wood || r.stone < cost.stone) return false;

  r.gold -= cost.gold;
  r.wood -= cost.wood;
  r.stone -= cost.stone;
  b.upgrades[key] = true;
  return true;
}
