import {
  OFFLINE_MAX_SECONDS,
  PRESTIGE_WEALTH_TARGET,
  SAVE_INTERVAL_MS,
  SAVE_KEY,
  SAVE_KEY_LEGACY,
  SEASON_DURATION,
  TICKRATE,
} from "./constants.js";
import {
  createInitialState,
  farmLevels,
  gameState,
  housingLevels,
  quarryLevels,
  seasons,
  woodcutterLevels,
} from "./state.js";
import {
  getFarmPerCompletion,
  getFarmWorkSpeed,
  getFoodProductionPerSecond,
  tickFarm,
  upgradeFarmLevel as upgradeFarmLevelImpl,
  buyFarmUpgrade as buyFarmUpgradeImpl,
} from "./farm.js";
import {
  buyHousingUpgrade,
  getFoodConsumptionPerSecond,
  getPopulationCap,
  tickFoodAndPopulation,
  upgradeHousingLevel,
} from "./housing.js";

import {
  buyQuarryUpgrade,
  getQuarryWorkSpeed,
  getStonePerCompletion,
  getStoneProductionPerSecond,
  tickQuarry,
  upgradeQuarryLevel,
} from "./quarry.js";

import {
  MARKET_PRICES,
  getCurrentPrice,
  getGoldPerSecond,
  sellResource,
  tickMarket,
} from "./market.js";
import {
  changeWorkers,
  getAssignedWorkers,
  getFreeVillagers,
  normalizeWorkerAssignments,
  getVillagerEfficiency,
} from "./villagers.js";
import {
  buyWoodcutterUpgrade as buyWoodcutterUpgradeImpl,
  getWoodPerCompletion,
  getWoodPerSecond,
  getWoodWorkSpeed,
  tickWoodcutter,
  upgradeWoodcutterLevel as upgradeWoodcutterLevelImpl,
} from "./woodcutter.js";
import { claimQuestReward as claimQuestRewardImpl, QUESTS, updateQuestProgress } from "./quests.js";
import { getActiveEvent, tickEvents } from "./events.js";

function startGame() {
  const input = document.getElementById("villageNameInput");
  const errorEl = document.getElementById("startError");
  const name = (input.value || "").trim();

  if (!name) {
    if (errorEl) errorEl.textContent = "Bitte gib zuerst einen Dorfnamen ein.";
    return;
  }

  if (errorEl) errorEl.textContent = "";
  gameState.villageName = name;
  if (gameState.world) gameState.world.offlineSummary = gameState.world.offlineSummary || "";

  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("header").classList.remove("hidden");
  document.getElementById("gameArea").classList.remove("hidden");
  setView("overview");
}

function setupStartScreenBindings() {
  const btn = document.getElementById("startButton");
  const input = document.getElementById("villageNameInput");

  if (btn && !btn.dataset.bound) {
    btn.addEventListener("click", startGame);
    btn.dataset.bound = "1";
  }

  if (input && !input.dataset.bound) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") startGame();
    });
    input.dataset.bound = "1";
  }
}

function setView(viewName) {
  const allowed = [
    "overview",
    "woodcutter",
    "farm",
    "quarry",
    "housing",
    "market",
    "quests",
  ];
  if (!allowed.includes(viewName)) viewName = "overview";

  gameState.view = viewName;
  document.querySelectorAll(".detailPanel").forEach((p) => p.classList.add("hidden"));

  const panelMap = {
    overview: "overviewPanel",
    woodcutter: "woodcutterPanel",
    farm: "farmPanel",
    quarry: "quarryPanel",
    housing: "housingPanel",
    market: "marketPanel",
    quests: "questsPanel",
  };

  const el = document.getElementById(panelMap[viewName]);
  if (el) el.classList.remove("hidden");

  updateUI();
}

function tickSeason(dt) {
  const s = gameState.season;
  s.secondsInSeason += dt;

  while (s.secondsInSeason >= s.duration) {
    s.secondsInSeason -= s.duration;
    s.index = (s.index + 1) % seasons.length;
  }
}

function formatSecondsToMMSS(secFloat) {
  const sec = Math.max(0, Math.floor(secFloat));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDelta(before, after) {
  const delta = after - before;
  const sign = delta >= 0 ? "+" : "";
  return `${before.toFixed(2)} → ${after.toFixed(2)} (${sign}${delta.toFixed(2)})`;
}

function getWealthScore() {
  const r = gameState.resources;
  return (
    r.gold +
    r.wood * getCurrentPrice("wood") +
    r.food * getCurrentPrice("food") +
    r.stone * getCurrentPrice("stone")
  );
}

function doPrestigeReset() {
  const wealth = getWealthScore();
  const points = Math.floor(wealth / PRESTIGE_WEALTH_TARGET);
  if (points <= 0) return;

  const oldName = gameState.villageName;
  const newState = createInitialState();
  const prestige = gameState.resources.prestige + points;
  const resets = gameState.meta.resetCount + 1;

  Object.assign(gameState, newState);
  gameState.villageName = oldName;
  gameState.resources.prestige = prestige;
  gameState.meta.resetCount = resets;

  updateUI();
  saveGame();
}

function renderQuests() {
  const list = document.getElementById("questsList");
  if (!list) return;

  list.innerHTML = "";
  for (const q of QUESTS) {
    const complete = !!gameState.quests.completed[q.id];
    const claimed = !!gameState.quests.rewardClaimed[q.id];
    const reward = Object.entries(q.reward)
      .map(([k, v]) => `${v} ${k}`)
      .join(", ");

    const item = document.createElement("div");
    item.className = "questItem";
    item.innerHTML = `
      <strong>${q.title}</strong><br>
      <span>${q.text}</span><br>
      <span class="small">Belohnung: ${reward}</span><br>
      <span>Status: ${claimed ? "Abgeholt" : complete ? "Fertig" : "Läuft"}</span>
    `;

    if (complete && !claimed) {
      const btn = document.createElement("button");
      btn.textContent = "Belohnung abholen";
      btn.onclick = () => {
        claimQuestRewardImpl(q.id);
        updateUI();
      };
      item.appendChild(document.createElement("br"));
      item.appendChild(btn);
    }

    list.appendChild(item);
  }
}

function saveGame() {
  gameState.meta.lastSavedAt = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
}

function manualSave() {
  saveGame();
  const info = document.getElementById("saveInfo");
  if (info) info.textContent = `Gespeichert: ${new Date().toLocaleTimeString()}`;
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY) || localStorage.getItem(SAVE_KEY_LEGACY);
  if (!raw) return;

  try {
    const loaded = JSON.parse(raw);
    const fresh = createInitialState();

    Object.assign(gameState, fresh, loaded);
    gameState.resources = { ...fresh.resources, ...(loaded.resources || {}) };
    gameState.villagers = { ...fresh.villagers, ...(loaded.villagers || {}) };
    gameState.season = { ...fresh.season, ...(loaded.season || {}) };
    gameState.meta = { ...fresh.meta, ...(loaded.meta || {}) };
    gameState.market = {
      ...fresh.market,
      ...(loaded.market || {}),
      autoSell: { ...fresh.market.autoSell, ...((loaded.market || {}).autoSell || {}) },
    };
    gameState.labor = { ...fresh.labor, ...(loaded.labor || {}) };
    gameState.world = { ...fresh.world, ...(loaded.world || {}) };
    gameState.quests = {
      ...fresh.quests,
      ...(loaded.quests || {}),
      completed: { ...fresh.quests.completed, ...((loaded.quests || {}).completed || {}) },
      rewardClaimed: { ...fresh.quests.rewardClaimed, ...((loaded.quests || {}).rewardClaimed || {}) },
    };
    gameState.buildings = {
      ...fresh.buildings,
      ...(loaded.buildings || {}),
      woodcutter: {
        ...fresh.buildings.woodcutter,
        ...((loaded.buildings || {}).woodcutter || {}),
        upgrades: {
          ...fresh.buildings.woodcutter.upgrades,
          ...(((loaded.buildings || {}).woodcutter || {}).upgrades || {}),
        },
      },
      farm: {
        ...fresh.buildings.farm,
        ...((loaded.buildings || {}).farm || {}),
        upgrades: {
          ...fresh.buildings.farm.upgrades,
          ...(((loaded.buildings || {}).farm || {}).upgrades || {}),
        },
      },
      quarry: {
        ...fresh.buildings.quarry,
        ...((loaded.buildings || {}).quarry || {}),
        upgrades: {
          ...fresh.buildings.quarry.upgrades,
          ...(((loaded.buildings || {}).quarry || {}).upgrades || {}),
        },
      },
      housing: {
        ...fresh.buildings.housing,
        ...((loaded.buildings || {}).housing || {}),
        upgrades: {
          ...fresh.buildings.housing.upgrades,
          ...(((loaded.buildings || {}).housing || {}).upgrades || {}),
        },
      },
    };
  } catch (err) {
    console.error("Save konnte nicht geladen werden", err);
  }
}

function updateUI() {
  const header = document.getElementById("header");
  if (!header || header.classList.contains("hidden")) return;

  const r = gameState.resources;
  const v = gameState.villagers;
  const season = seasons[gameState.season.index];
  const cap = getPopulationCap();
  const wealth = getWealthScore();
  const prestigeProgress = Math.min(1, wealth / PRESTIGE_WEALTH_TARGET);

  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  set("villageName", gameState.villageName || "Unbenannt");
  set("prestige", r.prestige);
  set("seasonName", season.name);
  set("seasonTimeLeft", formatSecondsToMMSS(SEASON_DURATION - gameState.season.secondsInSeason));

  set("wood", Math.floor(r.wood));
  set("woodMax", r.woodStorageMax);
  set("food", Math.floor(r.food));
  set("foodMax", r.foodStorageMax);
  set("stone", Math.floor(r.stone));
  set("stoneMax", r.stoneStorageMax);
  set("gold", r.gold.toFixed(1));
  set("population", r.population);
  set("populationCap", cap);

  const woodPerSec = getWoodPerSecond();
  const foodPerSec = getFoodProductionPerSecond();
  const stonePerSec = getStoneProductionPerSecond();
  const foodCons = getFoodConsumptionPerSecond();

  set("ovWoodPerSecond", woodPerSec.toFixed(2));
  set("ovFoodPerSecond", foodPerSec.toFixed(2));
  set("ovStonePerSecond", stonePerSec.toFixed(2));
  set("ovGoldPerSecond", getGoldPerSecond().toFixed(2));
  set("ovFoodNetPerSecond", (foodPerSec - foodCons).toFixed(2));

  set("ovWood", Math.floor(r.wood));
  set("ovWoodMax", r.woodStorageMax);
  set("ovFood", Math.floor(r.food));
  set("ovFoodMax", r.foodStorageMax);
  set("ovStone", Math.floor(r.stone));
  set("ovStoneMax", r.stoneStorageMax);
  set("ovGold", r.gold.toFixed(1));
  set("ovPopulation", r.population);
  set("ovPopulationCap", cap);

  set("ovWealth", wealth.toFixed(0));
  set("ovPrestigeTarget", PRESTIGE_WEALTH_TARGET);
  const pBar = document.getElementById("prestigeProgressBar");
  if (pBar) pBar.style.width = `${prestigeProgress * 100}%`;

  const pBtn = document.getElementById("btnPrestigeReset");
  if (pBtn) pBtn.disabled = Math.floor(wealth / PRESTIGE_WEALTH_TARGET) <= 0;

  set("villagerHappiness", `${v.happiness.toFixed(0)}%`);
  set("villagerHealth", `${v.health.toFixed(0)}%`);

  const activeEvent = getActiveEvent();
  set("eventInfo", activeEvent ? `${activeEvent.name}: ${activeEvent.description}` : "Kein Ereignis aktiv");

  set("offlineInfo", gameState.world.offlineSummary || "");

  const w = gameState.buildings.woodcutter;
  set("woodLevel", w.level);
  set("woodPerHit", getWoodPerCompletion().toFixed(2));
  set("workSpeed", getWoodWorkSpeed().toFixed(2));
  set("woodPerSecond", woodPerSec.toFixed(2));
  const wNext = woodcutterLevels[w.level + 1];
  set("woodLevelCost", wNext ? wNext.goldCost : "Max");
  set(
    "woodLevelImpact",
    wNext
      ? formatDelta(
          getWoodPerCompletion(),
          wNext.baseProduction * (w.upgrades.mechanicalSaw ? 2 : 1) * season.woodMult
        )
      : "Max-Level"
  );
  const wBar = document.getElementById("workBar");
  if (wBar) wBar.style.width = `${Math.max(0, Math.min(1, w.workProgress)) * 100}%`;

  const f = gameState.buildings.farm;
  set("farmLevel", f.level);
  set("farmPerHit", getFarmPerCompletion().toFixed(2));
  set("farmWorkSpeed", getFarmWorkSpeed().toFixed(2));
  set("farmFoodPerSecond", foodPerSec.toFixed(2));
  set("farmSeasonMult", `${season.foodMult.toFixed(2)}x`);
  const fNext = farmLevels[f.level + 1];
  set("farmLevelCost", fNext ? fNext.goldCost : "Max");
  set(
    "farmLevelImpact",
    fNext
      ? formatDelta(
          getFarmPerCompletion(),
          fNext.baseProduction * (f.upgrades.betterSeeds ? 1.3 : 1) * season.foodMult
        )
      : "Max-Level"
  );
  const fBar = document.getElementById("farmBar");
  if (fBar) fBar.style.width = `${Math.max(0, Math.min(1, f.workProgress)) * 100}%`;

  const q = gameState.buildings.quarry;
  set("quarryLevel", q.level);
  set("stonePerHit", getStonePerCompletion().toFixed(2));
  set("quarryWorkSpeed", getQuarryWorkSpeed().toFixed(2));
  set("stonePerSecond", stonePerSec.toFixed(2));
  set("quarrySeasonMult", `${season.stoneMult.toFixed(2)}x`);
  const qNext = quarryLevels[q.level + 1];
  set("quarryLevelCost", qNext ? qNext.goldCost : "Max");
  set(
    "quarryLevelImpact",
    qNext
      ? formatDelta(
          getStonePerCompletion(),
          qNext.baseProduction * (q.upgrades.blastPowder ? 1.4 : 1) * season.stoneMult
        )
      : "Max-Level"
  );
  const qBar = document.getElementById("quarryBar");
  if (qBar) qBar.style.width = `${Math.max(0, Math.min(1, q.workProgress)) * 100}%`;

  const h = gameState.buildings.housing;
  set("housingLevel", h.level);
  set("housingCap", cap);
  const hNext = housingLevels[h.level + 1];
  set("housingLevelCost", hNext ? `${hNext.goldCost} Gold, ${hNext.woodCost} Holz, ${hNext.stoneCost} Stein` : "Max");

  set("priceWood", `${getCurrentPrice("wood").toFixed(2)} Gold`);
  set("priceFood", `${getCurrentPrice("food").toFixed(2)} Gold`);
  set("priceStone", `${getCurrentPrice("stone").toFixed(2)} Gold`);
  set("lifetimeGold", gameState.meta.lifetimeGoldEarned.toFixed(0));
  set("autoWood", gameState.market.autoSell.wood ? "AN" : "AUS");
  set("autoFood", gameState.market.autoSell.food ? "AN" : "AUS");
  set("autoStone", gameState.market.autoSell.stone ? "AN" : "AUS");
  const basePrices = MARKET_PRICES || BASE_MARKET_PRICES;
  set("basePriceWood", basePrices.wood.toFixed(2));
  set("basePriceFood", basePrices.food.toFixed(2));
  set("basePriceStone", basePrices.stone.toFixed(2));

  set("workersAssigned", getAssignedWorkers());
  set("workersFree", getFreeVillagers());
  set("workersWood", gameState.labor.woodcutter);
  set("workersFarm", gameState.labor.farm);
  set("workersQuarry", gameState.labor.quarry);
  set("workerEff", `${(getVillagerEfficiency() * 100).toFixed(0)}%`);

  const notes = [
    `Resets: ${gameState.meta.resetCount}`,
    `Nahrungsverbrauch: ${foodCons.toFixed(2)}/s`,
    `Freie Dorfbewohner: ${getFreeVillagers()}`,
  ];
  set("statusNotes", notes.join(" | "));

  renderQuests();

}

function gameTick(dt) {
  normalizeWorkerAssignments();
  tickWoodcutter(dt);
  tickFarm(dt);
  tickQuarry(dt);
  tickFoodAndPopulation(dt);
  tickMarket(dt);
  tickSeason(dt);
  tickEvents(dt);
  updateQuestProgress();
  updateUI();
}

window.startGame = startGame;
window.setView = setView;
window.manualSave = manualSave;
window.doPrestigeReset = doPrestigeReset;
window.upgradeWoodcutterLevel = () => { upgradeWoodcutterLevelImpl(); updateUI(); };
window.buyWoodcutterUpgrade = (key) => { buyWoodcutterUpgradeImpl(key); updateUI(); };
window.upgradeFarmLevel = () => { upgradeFarmLevelImpl(); updateUI(); };
window.buyFarmUpgrade = (key) => { buyFarmUpgradeImpl(key); updateUI(); };
window.upgradeQuarryLevel = () => { upgradeQuarryLevel(); updateUI(); };
window.buyQuarryUpgrade = (key) => { buyQuarryUpgrade(key); updateUI(); };
window.upgradeHousingLevel = () => { upgradeHousingLevel(); updateUI(); };
window.buyHousingUpgrade = (key) => { buyHousingUpgrade(key); updateUI(); };
window.sellResource = (resourceKey, amount) => { sellResource(resourceKey, amount); updateUI(); };
window.assignWorker = (buildingKey, delta) => {
  changeWorkers(buildingKey, Number(delta));
  updateUI();
};
window.toggleAutoSell = (resourceKey) => {
  const m = gameState.market.autoSell;
  if (typeof m[resourceKey] !== "boolean") return;
  m[resourceKey] = !m[resourceKey];
  updateUI();
};


setupStartScreenBindings();
loadGame();
updateQuestProgress();
updateUI();

setInterval(() => gameTick(TICKRATE / 1000), TICKRATE);
setInterval(saveGame, SAVE_INTERVAL_MS);
