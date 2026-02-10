// ===============================
// KONSTANTEN: Jahreszeiten & Grundwerte
// ===============================

// Jahreszeiten (5 Minuten pro Season)
export const SEASON_DURATION = 5 * 60; // 5 Minuten

export const seasons = [
  {
    name: "Frühling",
    woodMult: 1.0,
    foodMult: 1.2,
  },
  {
    name: "Sommer",
    woodMult: 1.0,
    foodMult: 1.5,
  },
  {
    name: "Herbst",
    woodMult: 1.1,
    foodMult: 1.0,
  },
  {
    name: "Winter",
    woodMult: 0.8,
    foodMult: 0.5,
  },
];

// ===============================
// Produktion: Grundwerte
// ===============================

export const BASE_WOOD_PER_COMPLETION = 10;
export const BASE_WOOD_WORK_SPEED = 0.25;

export const BASE_FARM_PER_COMPLETION = 8;
export const BASE_FARM_WORK_SPEED = 0.25;

// ===============================
// Ressourcen-Kapazität
// ===============================

export const BASE_STORAGE_WOOD = 1000;
export const BASE_STORAGE_FOOD = 500;
export const BASE_STORAGE_STONE = 300;

// ===============================
// Bevölkerung
// ===============================

export const FOOD_CONSUMPTION_PER_PERSON = 0.02; // Nahrung pro Sekunde

// ===============================
// Tick-Zeit
// ===============================

export const TICKRATE = 100; // 100 ms pro Tick (10x pro Sekunde)
