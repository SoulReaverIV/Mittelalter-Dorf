import { EVENT_DURATION, EVENT_MAX_INTERVAL, EVENT_MIN_INTERVAL } from "./constants.js";
import { gameState } from "./state.js";

const EVENT_POOL = [
  {
    id: "good_harvest",
    name: "Reiche Ernte",
    description: "Die Felder tragen außergewöhnlich viel.",
    mods: { farmSpeedMult: 1.25 },
  },
  {
    id: "lumber_festival",
    name: "Holzfällerfest",
    description: "Mehr Motivation im Forst.",
    mods: { woodSpeedMult: 1.2 },
  },
  {
    id: "stone_contract",
    name: "Bauauftrag",
    description: "Stein ist gefragt und teuer.",
    mods: { stonePriceMult: 1.25 },
  },
  {
    id: "sickness",
    name: "Erkältungswelle",
    description: "Bewohner sind geschwächt.",
    mods: { villagerHealthDelta: -8, allSpeedMult: 0.9 },
  },
];

export function getActiveEvent() {
  return gameState.world.activeEvent;
}

export function getEventModifiers() {
  return gameState.world.activeEvent?.mods || {};
}

export function tickEvents(dt) {
  const w = gameState.world;

  if (w.activeEvent) {
    w.eventTimeLeft -= dt;
    if (w.eventTimeLeft <= 0) {
      w.activeEvent = null;
      w.eventTimeLeft = 0;
      w.eventCooldown = EVENT_MIN_INTERVAL + Math.random() * (EVENT_MAX_INTERVAL - EVENT_MIN_INTERVAL);
    }
    return;
  }

  w.eventCooldown -= dt;
  if (w.eventCooldown > 0) return;

  const event = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
  w.activeEvent = event;
  w.eventTimeLeft = EVENT_DURATION;

  if (event.mods.villagerHealthDelta) {
    gameState.villagers.health = Math.max(0, Math.min(100, gameState.villagers.health + event.mods.villagerHealthDelta));
  }
}
