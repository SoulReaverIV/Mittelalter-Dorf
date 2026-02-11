import { gameState, seasons } from "./state.js";
import { getEventModifiers } from "./events.js";

export const BASE_MARKET_PRICES = {
  wood: 0.5,
  food: 0.3,
  stone: 1.0,
};

// Legacy Alias für ältere Branches/Imports
export const MARKET_PRICES = BASE_MARKET_PRICES;

function getDemandModifier(resourceKey) {
  const sold = gameState.meta.lastTickSoldGold;
  const pressure = Math.min(0.15, sold / 4000);

  if (resourceKey === "food") {
    const season = seasons[gameState.season.index];
    return (season.marketFoodMult ?? 1) - pressure;
  }

  return 1 - pressure;
}

export function getCurrentPrice(resourceKey) {
  const base = BASE_MARKET_PRICES[resourceKey];
  if (!base) return 0;

  const prestigeBonus = 1 + gameState.resources.prestige * 0.01;
  let value = base * getDemandModifier(resourceKey) * prestigeBonus;
  const mods = getEventModifiers();
  if (resourceKey === "stone" && mods.stonePriceMult) value *= mods.stonePriceMult;
  return Math.max(0.05, value);
}

export function sellResource(resourceKey, amount) {
  const r = gameState.resources;
  const current = Math.floor(r[resourceKey] ?? 0);
  if (current <= 0) return 0;

  const toSell = amount === "all" ? current : Math.min(current, Number(amount) || 0);
  if (toSell <= 0) return 0;

  const price = getCurrentPrice(resourceKey);
  const earned = toSell * price;

  r[resourceKey] -= toSell;
  r.gold += earned;

  gameState.meta.lifetimeGoldEarned += earned;
  gameState.meta.lastTickSoldGold += earned;

  return earned;
}

export function tickMarket() {
  const m = gameState.market.autoSell;
  if (m.wood) sellResource("wood", 10);
  if (m.food) {
    const foodThreshold = gameState.resources.foodStorageMax * 0.65;
    if (gameState.resources.food > foodThreshold) {
      sellResource("food", 10);
    }
  }
  if (m.stone) sellResource("stone", 10);

  gameState.meta.lastTickSoldGold *= 0.9;
}

export function getGoldPerSecond() {
  return 0;
}
