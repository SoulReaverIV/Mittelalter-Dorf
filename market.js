// market.js
// Marktlogik: Ressourcen verkaufen -> Gold

import { gameState } from "./state.js";

export const MARKET_PRICES = {
  wood: 0.5,
  food: 0.3,
  stone: 1.0,
};

export function sellResource(resourceKey, amount) {
  const r = gameState.resources;
  const price = MARKET_PRICES[resourceKey];
  if (!price) return 0;

  const current = Math.floor(r[resourceKey] ?? 0);
  if (current <= 0) return 0;

  const toSell = amount === "all" ? current : Math.min(current, Number(amount) || 0);
  if (toSell <= 0) return 0;

  r[resourceKey] -= toSell;
  const earned = toSell * price;
  r.gold += earned;

  return earned;
}

export function getGoldPerSecond() {
  // Aktuell nur manueller Verkauf, keine passive Goldproduktion.
  return 0;
}
