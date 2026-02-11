import { gameState } from "./state.js";
import { getEventModifiers } from "./events.js";

const BUILDINGS = ["woodcutter", "farm", "quarry"];

export function normalizeWorkerAssignments() {
  const labor = gameState.labor;
  const pop = gameState.resources.population;

  for (const key of BUILDINGS) {
    labor[key] = Math.max(0, Math.floor(labor[key] || 0));
  }

  let assigned = BUILDINGS.reduce((sum, key) => sum + labor[key], 0);
  if (assigned <= pop) return;

  for (const key of ["quarry", "farm", "woodcutter"]) {
    if (assigned <= pop) break;
    const reduceBy = Math.min(labor[key], assigned - pop);
    labor[key] -= reduceBy;
    assigned -= reduceBy;
  }
}

export function getAssignedWorkers() {
  normalizeWorkerAssignments();
  return BUILDINGS.reduce((sum, key) => sum + gameState.labor[key], 0);
}

export function getFreeVillagers() {
  return Math.max(0, gameState.resources.population - getAssignedWorkers());
}

export function getVillagerEfficiency() {
  const h = gameState.villagers.happiness / 100;
  const health = gameState.villagers.health / 100;
  return 0.6 + h * 0.25 + health * 0.15;
}

export function getStaffingFactor(buildingKey) {
  const workers = Math.max(0, gameState.labor[buildingKey] || 0);
  if (workers <= 0) return 0;

  let factor = 1 + (workers - 1) * 0.35;
  factor *= getVillagerEfficiency();

  const mods = getEventModifiers();
  if (mods.allSpeedMult) factor *= mods.allSpeedMult;
  if (buildingKey === "woodcutter" && mods.woodSpeedMult) factor *= mods.woodSpeedMult;
  if (buildingKey === "farm" && mods.farmSpeedMult) factor *= mods.farmSpeedMult;

  return factor;
}

export function changeWorkers(buildingKey, delta) {
  if (!BUILDINGS.includes(buildingKey)) return false;

  normalizeWorkerAssignments();
  if (delta > 0) {
    if (getFreeVillagers() <= 0) return false;
    gameState.labor[buildingKey] += 1;
    return true;
  }

  if (delta < 0 && gameState.labor[buildingKey] > 0) {
    gameState.labor[buildingKey] -= 1;
    return true;
  }

  return false;
}
