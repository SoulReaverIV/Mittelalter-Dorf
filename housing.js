import {
  FOOD_CONSUMPTION_PER_PERSON,
  POP_GROWTH_SECONDS,
  POP_GROWTH_SURPLUS_THRESHOLD,
} from "./constants.js";
import { gameState, housingLevels } from "./state.js";

export function getPopulationCap() {
  const b = gameState.buildings.housing;
  let cap = housingLevels[b.level]?.popCap ?? 30;

  if (b.upgrades.granary) cap += 10;
  if (b.upgrades.infirmary) cap += 15;

  cap += gameState.resources.prestige * 2;
  return Math.floor(cap);
}

export function getFoodConsumptionPerSecond() {
  return gameState.resources.population * FOOD_CONSUMPTION_PER_PERSON;
}

function tickVillagerMood(dt, foodNetPerSecond) {
  const v = gameState.villagers;
  const cap = getPopulationCap();
  const popRatio = cap > 0 ? gameState.resources.population / cap : 1;

  if (foodNetPerSecond > 0.2) {
    v.happiness = Math.min(100, v.happiness + dt * 0.35);
    v.health = Math.min(100, v.health + dt * 0.22);
  } else if (foodNetPerSecond < 0) {
    v.happiness = Math.max(0, v.happiness - dt * 0.5);
    v.health = Math.max(0, v.health - dt * 0.25);
  }

  if (popRatio > 0.95) {
    v.happiness = Math.max(0, v.happiness - dt * 0.18);
  }

  if (gameState.resources.food <= 0) {
    v.health = Math.max(0, v.health - dt * 0.6);
  }
}

export function tickFoodAndPopulation(dt, foodProductionPerSecond) {
  const r = gameState.resources;
  const cap = getPopulationCap();
  const cons = getFoodConsumptionPerSecond();

  r.food -= cons * dt;
  r.food = Math.max(0, Math.min(r.foodStorageMax, r.food));

  if (r.food <= 0 && r.population > 0) {
    gameState.starvationCounter += dt;
    if (gameState.starvationCounter >= 30) {
      r.population = Math.max(0, r.population - 1);
      gameState.starvationCounter = 0;
    }
  } else {
    gameState.starvationCounter = 0;
  }

  const net = foodProductionPerSecond - cons;
  if (net >= POP_GROWTH_SURPLUS_THRESHOLD && r.population < cap) {
    gameState.popGrowthCounter += dt;
    if (gameState.popGrowthCounter >= POP_GROWTH_SECONDS) {
      r.population += 1;
      gameState.popGrowthCounter = 0;
    }
  } else {
    gameState.popGrowthCounter = 0;
  }

  tickVillagerMood(dt, net);

  if (r.population > cap) r.population = cap;
}

export function upgradeHousingLevel() {
  const b = gameState.buildings.housing;
  const r = gameState.resources;

  const next = b.level + 1;
  const data = housingLevels[next];
  if (!data) return false;

  if (r.gold < data.goldCost || r.wood < data.woodCost || r.stone < data.stoneCost) {
    return false;
  }

  r.gold -= data.goldCost;
  r.wood -= data.woodCost;
  r.stone -= data.stoneCost;
  b.level = next;
  return true;
}

export function buyHousingUpgrade(key) {
  const costs = {
    granary: { gold: 550, wood: 500, stone: 120 },
    infirmary: { gold: 900, wood: 400, stone: 250 },
  };

  const b = gameState.buildings.housing;
  const r = gameState.resources;
  const c = costs[key];

  if (!c || b.upgrades[key]) return false;
  if (r.gold < c.gold || r.wood < c.wood || r.stone < c.stone) return false;

  r.gold -= c.gold;
  r.wood -= c.wood;
  r.stone -= c.stone;
  b.upgrades[key] = true;
  return true;
}
