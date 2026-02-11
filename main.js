// main.js
// Zentrale Spiellogik, Ticks & UI

import {
  TICKRATE,
} from "./constants.js";

import {
  gameState,
  farmLevels,
  woodcutterLevels,
  seasons,
  SEASON_DURATION,
} from "./state.js";

import {
  getWoodPerCompletion,
  getWoodWorkSpeed,
  getWoodPerSecond,
  tickWoodcutter,
  upgradeWoodcutterLevel as upgradeWoodcutterLevelImpl,
  buyWoodcutterUpgrade as buyWoodcutterUpgradeImpl,
} from "./woodcutter.js";

import {
  getFarmPerCompletion,
  getFarmWorkSpeed,
  getFoodProductionPerSecond,
  tickFarm,
  upgradeFarmLevel as upgradeFarmLevelImpl,
  buyFarmUpgrade as buyFarmUpgradeImpl,
} from "./farm.js";

import {
  getFoodConsumptionPerSecond,
  tickFoodAndPopulation,
  getPopulationCap,
} from "./housing.js";

import {
  MARKET_PRICES,
  getGoldPerSecond,
  sellResource,
} from "./market.js";

function startGame() {
  const input = document.getElementById("villageNameInput");
  const name = (input.value || "").trim();
  if (!name) return;

  gameState.villageName = name;

  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("header").classList.remove("hidden");
  document.getElementById("gameArea").classList.remove("hidden");

  setView("overview");
}

function setView(viewName) {
  const allowed = ["overview", "woodcutter", "farm", "market"];
  if (!allowed.includes(viewName)) viewName = "overview";

  gameState.view = viewName;

  document.querySelectorAll(".detailPanel").forEach((p) =>
    p.classList.add("hidden")
  );

  let id = "overviewPanel";
  if (viewName === "woodcutter") id = "woodcutterPanel";
  if (viewName === "farm") id = "farmPanel";
  if (viewName === "market") id = "marketPanel";

  const el = document.getElementById(id);
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

function updateUI() {
  const header = document.getElementById("header");
  if (!header || header.classList.contains("hidden")) return;

  const r = gameState.resources;
  const cap = getPopulationCap();
  const season = seasons[gameState.season.index];

  document.getElementById("villageName").textContent =
    gameState.villageName || "Unbenannt";
  document.getElementById("prestige").textContent = r.prestige;
  document.getElementById("seasonName").textContent = season.name;

  const remaining = SEASON_DURATION - gameState.season.secondsInSeason;
  document.getElementById("seasonTimeLeft").textContent =
    formatSecondsToMMSS(remaining);

  const woodEl = document.getElementById("wood");
  const woodMaxEl = document.getElementById("woodMax");
  const foodEl = document.getElementById("food");
  const foodMaxEl = document.getElementById("foodMax");
  const stoneEl = document.getElementById("stone");
  const stoneMaxEl = document.getElementById("stoneMax");
  const goldEl = document.getElementById("gold");
  const popEl = document.getElementById("population");
  const popCapEl = document.getElementById("populationCap");

  if (woodEl) woodEl.textContent = Math.floor(r.wood);
  if (woodMaxEl) woodMaxEl.textContent = r.woodStorageMax;
  if (foodEl) foodEl.textContent = Math.floor(r.food);
  if (foodMaxEl) foodMaxEl.textContent = r.foodStorageMax;
  if (stoneEl) stoneEl.textContent = Math.floor(r.stone);
  if (stoneMaxEl) stoneMaxEl.textContent = r.stoneStorageMax;
  if (goldEl) goldEl.textContent = r.gold.toFixed(1);
  if (popEl) popEl.textContent = r.population;
  if (popCapEl) popCapEl.textContent = cap;

  const woodPerSec = getWoodPerSecond();
  const foodProdPerSec = getFoodProductionPerSecond();
  const foodConsPerSec = getFoodConsumptionPerSecond();
  const foodNetPerSec = foodProdPerSec - foodConsPerSec;
  const goldPerSec = getGoldPerSecond();

  const ovWps = document.getElementById("ovWoodPerSecond");
  const ovFps = document.getElementById("ovFoodPerSecond");
  const ovGps = document.getElementById("ovGoldPerSecond");
  const ovFNet = document.getElementById("ovFoodNetPerSecond");

  const ovWood = document.getElementById("ovWood");
  const ovWoodMax = document.getElementById("ovWoodMax");
  const ovFood = document.getElementById("ovFood");
  const ovFoodMax = document.getElementById("ovFoodMax");
  const ovStone = document.getElementById("ovStone");
  const ovStoneMax = document.getElementById("ovStoneMax");
  const ovGold = document.getElementById("ovGold");
  const ovPop = document.getElementById("ovPopulation");
  const ovPopCap = document.getElementById("ovPopulationCap");

  if (ovWps) ovWps.textContent = woodPerSec.toFixed(2);
  if (ovFps) ovFps.textContent = foodProdPerSec.toFixed(2);
  if (ovGps) ovGps.textContent = goldPerSec.toFixed(2);
  if (ovFNet) ovFNet.textContent = foodNetPerSec.toFixed(2);

  if (ovWood) ovWood.textContent = Math.floor(r.wood);
  if (ovWoodMax) ovWoodMax.textContent = r.woodStorageMax;
  if (ovFood) ovFood.textContent = Math.floor(r.food);
  if (ovFoodMax) ovFoodMax.textContent = r.foodStorageMax;
  if (ovStone) ovStone.textContent = Math.floor(r.stone);
  if (ovStoneMax) ovStoneMax.textContent = r.stoneStorageMax;
  if (ovGold) ovGold.textContent = r.gold.toFixed(1);
  if (ovPop) ovPop.textContent = r.population;
  if (ovPopCap) ovPopCap.textContent = cap;

  if (gameState.view === "woodcutter") {
    const b = gameState.buildings.woodcutter;

    const lvlEl = document.getElementById("woodLevel");
    const perHitEl = document.getElementById("woodPerHit");
    const speedEl = document.getElementById("workSpeed");
    const wpsEl = document.getElementById("woodPerSecond");
    const costEl = document.getElementById("woodLevelCost");
    const barEl = document.getElementById("workBar");
    const timeEl = document.getElementById("timeToNext");
    const bonusInfo = document.getElementById("woodBonusInfo");
    const impactEl = document.getElementById("woodLevelImpact");

    const perHit = getWoodPerCompletion();
    const speed = getWoodWorkSpeed();

    if (lvlEl) lvlEl.textContent = b.level;
    if (perHitEl) perHitEl.textContent = perHit.toFixed(2);
    if (speedEl) speedEl.textContent = speed.toFixed(2);
    if (wpsEl) wpsEl.textContent = woodPerSec.toFixed(2);

    const next = b.level + 1;
    const nextData = woodcutterLevels[next];
    if (costEl) costEl.textContent = nextData ? nextData.goldCost : "Max";

    if (impactEl) {
      if (!nextData) {
        impactEl.textContent = "Max-Level erreicht";
      } else {
        const before = perHit;
        const after = nextData.baseProduction * (b.upgrades.mechanicalSaw ? 2 : 1) * season.woodMult;
        impactEl.textContent = formatDelta(before, after);
      }
    }

    if (barEl) {
      const progress = Math.max(0, Math.min(1, b.workProgress)) * 100;
      barEl.style.width = progress + "%";
    }

    if (timeEl) {
      const remainingWork = Math.max(0, 1 - b.workProgress);
      const t = speed > 0 ? (remainingWork / speed).toFixed(1) : "–";
      timeEl.textContent = t;
    }

    if (bonusInfo) {
      const u = b.upgrades;
      const bonus = [];
      if (u.sharpAxe) bonus.push("Scharfe Axt: +0,05 Fortschritt/s");
      if (u.secondWorker) bonus.push("Zweiter Arbeiter: +0,10 Fortschritt/s");
      if (u.mechanicalSaw) bonus.push("Mechanische Säge: x2 Holz pro Abschluss");
      bonusInfo.textContent = bonus.length ? bonus.join(" | ") : "Keine Boni aktiv";
    }

    const btnAxe = document.getElementById("btnSharpAxe");
    const btnWorker = document.getElementById("btnSecondWorker");
    const btnSaw = document.getElementById("btnMechanicalSaw");
    const u = b.upgrades;

    if (btnAxe) btnAxe.disabled = u.sharpAxe;
    if (btnWorker) btnWorker.disabled = u.secondWorker;
    if (btnSaw) btnSaw.disabled = u.mechanicalSaw;
  }

  if (gameState.view === "farm") {
    const b = gameState.buildings.farm;
    const seasonData = seasons[gameState.season.index];

    const lvlEl = document.getElementById("farmLevel");
    const perHitEl = document.getElementById("farmPerHit");
    const speedEl = document.getElementById("farmWorkSpeed");
    const fpsEl = document.getElementById("farmFoodPerSecond");
    const timeEl = document.getElementById("farmTimeToNext");
    const seasonMultEl = document.getElementById("farmSeasonMult");
    const costEl = document.getElementById("farmLevelCost");
    const barFarm = document.getElementById("farmBar");
    const impactEl = document.getElementById("farmLevelImpact");

    const perHit = getFarmPerCompletion();
    const speed = getFarmWorkSpeed();
    const fps = getFoodProductionPerSecond();

    if (lvlEl) lvlEl.textContent = b.level;
    if (perHitEl) perHitEl.textContent = perHit.toFixed(2);
    if (speedEl) speedEl.textContent = speed.toFixed(2);
    if (fpsEl) fpsEl.textContent = fps.toFixed(2);

    if (timeEl) {
      const remainingWork = Math.max(0, 1 - b.workProgress);
      const t = speed > 0 ? (remainingWork / speed).toFixed(1) : "–";
      timeEl.textContent = t;
    }

    if (seasonMultEl) {
      seasonMultEl.textContent = seasonData.foodMult.toFixed(2) + "x";
    }

    const nextLevel = b.level + 1;
    const nextData = farmLevels[nextLevel];
    if (costEl) costEl.textContent = nextData ? nextData.goldCost : "Max";

    if (impactEl) {
      if (!nextData) {
        impactEl.textContent = "Max-Level erreicht";
      } else {
        const before = perHit;
        const after = nextData.baseProduction * (b.upgrades.betterSeeds ? 1.3 : 1) * seasonData.foodMult;
        impactEl.textContent = formatDelta(before, after);
      }
    }

    if (barFarm) {
      const progress = Math.max(0, Math.min(1, b.workProgress)) * 100;
      barFarm.style.width = progress + "%";
    }

    const btnPlow = document.getElementById("btnFarmBetterPlow");
    const btnSeeds = document.getElementById("btnFarmBetterSeeds");
    const btnSecond = document.getElementById("btnFarmSecondFarmer");

    if (btnPlow) btnPlow.disabled = b.upgrades.betterPlow;
    if (btnSeeds) btnSeeds.disabled = b.upgrades.betterSeeds;
    if (btnSecond) btnSecond.disabled = b.upgrades.secondFarmer;
  }

  if (gameState.view === "market") {
    const setPrice = (id, price) => {
      const el = document.getElementById(id);
      if (el) el.textContent = `${price.toFixed(1)} Gold`;
    };
    setPrice("priceWood", MARKET_PRICES.wood);
    setPrice("priceFood", MARKET_PRICES.food);
    setPrice("priceStone", MARKET_PRICES.stone);
  }
}

function gameTick(dt) {
  tickWoodcutter(dt);
  tickFarm(dt);
  tickFoodAndPopulation(dt);
  tickSeason(dt);
  updateUI();
}

setInterval(() => {
  const dt = TICKRATE / 1000;
  gameTick(dt);
}, TICKRATE);

window.startGame = startGame;
window.setView = setView;

window.upgradeWoodcutterLevel = function () {
  upgradeWoodcutterLevelImpl();
  updateUI();
};

window.buyWoodcutterUpgrade = function (key) {
  buyWoodcutterUpgradeImpl(key);
  updateUI();
};

window.upgradeFarmLevel = function () {
  upgradeFarmLevelImpl();
  updateUI();
};

window.buyFarmUpgrade = function (key) {
  buyFarmUpgradeImpl(key);
  updateUI();
};

window.sellResource = function (resourceKey, amount) {
  sellResource(resourceKey, amount);
  updateUI();
};
