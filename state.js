// state.js
// Hält den kompletten Spielzustand und Level-Konfigurationen

import {
  seasons,
  SEASON_DURATION,
  BASE_STORAGE_WOOD,
  BASE_STORAGE_FOOD,
} from "./constants.js";

// ===============================
// ANFANGS-ZUSTAND
// ===============================

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
  },

  // Jahreszeit / Zeitsteuerung
  season: {
    index: 0,            // 0 = Frühling, 1 = Sommer, 2 = Herbst, 3 = Winter
    secondsInSeason: 0,  // wie viele Sekunden sind in der aktuellen Season vergangen
    duration: SEASON_DURATION,
  },

  // Hungersystem
  starvationCounter: 0,

  // Gebäude / Produktionsketten
  buildings: {
    woodcutter: {
      level: 1,
      workProgress: 0, // 0–1 → ein „Abschluss“
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

// ===============================
// LEVEL-KONFIGURATIONEN
// ===============================

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

// Export Seasons (optional, falls woanders gebraucht)
export { seasons, SEASON_DURATION };
