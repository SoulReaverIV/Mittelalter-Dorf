// state.js
// Hält den kompletten Spielzustand und Level-Konfigurationen

import {
  seasons,
  SEASON_DURATION,
  BASE_STORAGE_WOOD,
  BASE_STORAGE_FOOD,
  BASE_STORAGE_STONE,
} from "./constants.js";

export const gameState = {
  villageName: "",
  view: "overview",

  resources: {
    wood: 0,
    food: 100,
    gold: 200,
    stone: 0,
    population: 20,
    prestige: 0,

    woodStorageMax: BASE_STORAGE_WOOD,
    foodStorageMax: BASE_STORAGE_FOOD,
    stoneStorageMax: BASE_STORAGE_STONE,
  },

  season: {
    index: 0,
    secondsInSeason: 0,
    duration: SEASON_DURATION,
  },

  starvationCounter: 0,

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

    farm: {
      level: 1,
      workProgress: 0,
      upgrades: {
        betterPlow: false,
        betterSeeds: false,
        secondFarmer: false,
      },
    },
  },
};

export const woodcutterLevels = {
  1: { baseProduction: 10, goldCost: 0 },
  2: { baseProduction: 18, goldCost: 150 },
  3: { baseProduction: 28, goldCost: 400 },
  4: { baseProduction: 40, goldCost: 900 },
  5: { baseProduction: 60, goldCost: 1800 },
};

export const farmLevels = {
  1: { baseProduction: 8, goldCost: 0 },
  2: { baseProduction: 14, goldCost: 180 },
  3: { baseProduction: 22, goldCost: 450 },
  4: { baseProduction: 35, goldCost: 1000 },
  5: { baseProduction: 55, goldCost: 2000 },
};

export { seasons, SEASON_DURATION };
