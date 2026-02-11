// housing.js
// Logik für Bevölkerung und Nahrung

import { FOOD_CONSUMPTION_PER_PERSON } from "./constants.js";
import { gameState } from "./state.js";

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
  return 50;
}
