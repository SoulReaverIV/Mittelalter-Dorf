import {
  BASE_STORAGE_WOOD,
  BASE_STORAGE_FOOD,
  BASE_STORAGE_STONE,
  SEASON_DURATION,
  seasons,
  EVENT_MIN_INTERVAL,
} from "./constants.js";

export const woodcutterLevels = {
  1: { baseProduction: 10, goldCost: 0 },
  2: { baseProduction: 18, goldCost: 150 },
  3: { baseProduction: 28, goldCost: 400 },
  4: { baseProduction: 40, goldCost: 900 },
  5: { baseProduction: 60, goldCost: 1800 },
  6: { baseProduction: 85, goldCost: 3200 },
};

export const farmLevels = {
  1: { baseProduction: 8, goldCost: 0 },
  2: { baseProduction: 14, goldCost: 180 },
  3: { baseProduction: 22, goldCost: 450 },
  4: { baseProduction: 35, goldCost: 1000 },
  5: { baseProduction: 55, goldCost: 2000 },
  6: { baseProduction: 78, goldCost: 3600 },
};

export const quarryLevels = {
  1: { baseProduction: 6, goldCost: 0 },
  2: { baseProduction: 12, goldCost: 200 },
  3: { baseProduction: 20, goldCost: 500 },
  4: { baseProduction: 30, goldCost: 1200 },
  5: { baseProduction: 45, goldCost: 2600 },
};

export const housingLevels = {
  1: { popCap: 35, goldCost: 0, woodCost: 0, stoneCost: 0 },
  2: { popCap: 50, goldCost: 180, woodCost: 220, stoneCost: 40 },
  3: { popCap: 70, goldCost: 500, woodCost: 420, stoneCost: 110 },
  4: { popCap: 95, goldCost: 1200, woodCost: 780, stoneCost: 230 },
  5: { popCap: 130, goldCost: 2800, woodCost: 1300, stoneCost: 500 },
};

export function createInitialState() {
  return {
    villageName: "",
    view: "overview",
    resources: {
      wood: 0,
      food: 100,
      stone: 0,
      gold: 200,
      population: 20,
      prestige: 0,
      woodStorageMax: BASE_STORAGE_WOOD,
      foodStorageMax: BASE_STORAGE_FOOD,
      stoneStorageMax: BASE_STORAGE_STONE,
    },
    villagers: {
      happiness: 60,
      health: 70,
    },
    season: {
      index: 0,
      secondsInSeason: 0,
      duration: SEASON_DURATION,
    },
    starvationCounter: 0,
    popGrowthCounter: 0,
    meta: {
      lifetimeGoldEarned: 0,
      lastTickSoldGold: 0,
      resetCount: 0,
      lastSavedAt: Date.now(),
    },
    market: {
      autoSell: {
        wood: false,
        food: false,
        stone: false,
      },
    },
    labor: {
      woodcutter: 3,
      farm: 3,
      quarry: 2,
    },
    world: {
      activeEvent: null,
      eventTimeLeft: 0,
      eventCooldown: EVENT_MIN_INTERVAL,
      offlineSummary: "",
    },
    quests: {
      completed: {},
      rewardClaimed: {},
    },
    buildings: {
      woodcutter: {
        level: 1,
        workProgress: 0,
        upgrades: { sharpAxe: false, secondWorker: false, mechanicalSaw: false },
      },
      farm: {
        level: 1,
        workProgress: 0,
        upgrades: { betterPlow: false, betterSeeds: false, secondFarmer: false },
      },
      quarry: {
        level: 1,
        workProgress: 0,
        upgrades: { ironTools: false, blastPowder: false, crane: false },
      },
      housing: {
        level: 1,
        upgrades: { granary: false, infirmary: false },
      },
    },
  };
}

export const gameState = createInitialState();

// Legacy Alias für ältere Branches/Imports
export const initialGameState = createInitialState;

export { seasons, SEASON_DURATION };
