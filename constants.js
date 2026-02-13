// Globale Konstanten

export const TICKRATE = 100; // 10 Ticks pro Sekunde
export const SAVE_INTERVAL_MS = 5000;

export const SEASON_DURATION = 5 * 60;
export const seasons = [
  { name: "Frühling", woodMult: 1.0, foodMult: 1.2, stoneMult: 1.0, marketFoodMult: 1.0 },
  { name: "Sommer", woodMult: 1.0, foodMult: 1.5, stoneMult: 0.95, marketFoodMult: 0.9 },
  { name: "Herbst", woodMult: 1.1, foodMult: 1.0, stoneMult: 1.0, marketFoodMult: 1.1 },
  { name: "Winter", woodMult: 0.8, foodMult: 0.5, stoneMult: 1.2, marketFoodMult: 1.3 },
];

export const BASE_STORAGE_WOOD = 1000;
export const BASE_STORAGE_FOOD = 500;
export const BASE_STORAGE_STONE = 300;

export const BASE_WOOD_WORK_SPEED = 0.25;
export const BASE_FARM_PER_COMPLETION = 8;
export const BASE_FARM_WORK_SPEED = 0.25;
export const BASE_QUARRY_WORK_SPEED = 0.2;

export const FOOD_CONSUMPTION_PER_PERSON = 0.02;

export const POP_GROWTH_SURPLUS_THRESHOLD = 0.05;
export const POP_GROWTH_SECONDS = 45;

export const PRESTIGE_WEALTH_TARGET = 12000;

export const SAVE_KEY = "mittelalter_dorf_save_v3";
export const SAVE_KEY_LEGACY = "mittelalter_dorf_save_v2";
export const OFFLINE_MAX_SECONDS = 8 * 60 * 60;

export const EVENT_MIN_INTERVAL = 60;
export const EVENT_MAX_INTERVAL = 150;
export const EVENT_DURATION = 40;
