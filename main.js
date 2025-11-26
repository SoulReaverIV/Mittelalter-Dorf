// main.js
// Zentrale Spiellogik, Ticks & UI

import {
  TICKRATE,
  FOOD_CONSUMPTION_PER_PERSON,
  BASE_FARM_PER_COMPLETION,
  BASE_FARM_WORK_SPEED,
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

// ===============================
// VIEW-STEUERUNG
// ===============================

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
  const allowed = ["overview", "woodcutter", "farm"];
  if (!allowed.includes(viewName)) viewName = "overview";

  gameState.view = viewName;

  // alle Detailpanels ausblenden
  document.querySelectorAll(".detailPanel").forEach((p) =>
    p.classList.add("hidden")
  );

  let id = "overviewPanel";
  if (viewName === "woodcutter") id = "woodcutterPanel";
  if (viewName === "farm") id = "farmPanel";

  const el = document.getElementById(id);
  if (el) el.classList.remove("hidden");

  updateUI();
}

// ===============================
// BAUERNHOF-LOGIK
// ===============================

function getFarmPerCompletion() {
  const b = gameState.buildings.farm;
  const levelData = farmLevels[b.level];
  if (!levelData) return 0;

  let amount = levelData.baseProduction ?? BASE_FARM_PER_COMPLETION;

  // Upgrades
  if (b.upgrades.betterSeeds) amount *= 1.3;

  // Jahreszeiten-Multiplikator
  const season = seasons[gameState.season.index];
  if (season && typeof season.foodMult === "number") {
    amount *= season.foodMult;
  }

  return amount;
}

function getFarmWorkSpeed() {
  const b = gameState.buildings.farm;
  let speed = BASE_FARM_WORK_SPEED;

  if (b.upgrades.betterPlow) speed += 0.05;
  if (b.upgrades.secondFarmer) speed += 0.1;

  speed *= 1 + gameState.resources.prestige * 0.02;

  return speed;
}

function getFoodProductionPerSecond() {
  return getFarmPerCompletion() * getFarmWorkSpeed();
}

function tickFarm(dt) {
  const b = gameState.buildings.farm;
  const r = gameState.resources;

  const speed = getFarmWorkSpeed();
  b.workProgress += speed * dt;

  while (b.workProgress >= 1) {
    b.workProgress -= 1;

    let gain = getFarmPerCompletion();

    const free = r.foodStorageMax - r.food;
    if (free <= 0) {
      gain = 0;
    } else if (gain > free) {
      gain = free;
    }

    if (gain <= 0) break;

    r.food += gain;
  }
}

// ===============================
// FARM: LEVEL & UPGRADES
// ===============================

function upgradeFarmLevel() {
  const b = gameState.buildings.farm;
  const r = gameState.resources;

  const nextLevel = b.level + 1;
  const data = farmLevels[nextLevel];

  if (!data) return;            // Max-Level
  if (r.gold < data.goldCost) return;

  r.gold -= data.goldCost;
  b.level = nextLevel;
}

function buyFarmUpgrade(key) {
  const b = gameState.buildings.farm;
  const r = gameState.resources;

  const costs = {
    betterPlow: 200,
    betterSeeds: 350,
    secondFarmer: 800,
  };

  const cost = costs[key];
  if (!cost) return;
  if (b.upgrades[key]) return;
  if (r.gold < cost) return;

  r.gold -= cost;
  b.upgrades[key] = true;
}

// ===============================
// NAHRUNG & BEVÖLKERUNG
// ===============================

function getFoodConsumptionPerSecond() {
  const r = gameState.resources;
  return r.population * FOOD_CONSUMPTION_PER_PERSON;
}

function tickFoodAndPopulation(dt) {
  const r = gameState.resources;

  const prod = getFoodProductionPerSecond();
  const cons = getFoodConsumptionPerSecond();
  const net = prod - cons;

  r.food += net * dt;

  if (r.food < 0) r.food = 0;
  if (r.food > r.foodStorageMax) r.food = r.foodStorageMax;

  // Hungersystem
  if (r.food <= 0 && r.population > 0) {
    gameState.starvationCounter += dt;
    if (gameState.starvationCounter >= 30) {
      r.population = Math.max(0, r.population - 1);
      gameState.starvationCounter = 0;
    }
  } else {
    gameState.starvationCounter = 0;
  }
}

function getPopulationCap() {
  // später Housing-System – aktuell fix
  return 50;
}

// ===============================
// JAHRESZEIT
// ===============================

function tickSeason(dt) {
  const s = gameState.season;
  s.secondsInSeason += dt;

  while (s.secondsInSeason >= s.duration) {
    s.secondsInSeason -= s.duration;
    s.index = (s.index + 1) % seasons.length;
  }
}

// ===============================
// UI-UTILS
// ===============================

function formatSecondsToMMSS(secFloat) {
  const sec = Math.max(0, Math.floor(secFloat));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ===============================
// UI-UPDATE
// ===============================

function updateUI() {
  const header = document.getElementById("header");
  if (!header || header.classList.contains("hidden")) return;

  const r = gameState.resources;
  const cap = getPopulationCap();
  const season = seasons[gameState.season.index];

  // Header
  document.getElementById("villageName").textContent =
    gameState.villageName || "Unbenannt";
  document.getElementById("prestige").textContent = r.prestige;
  document.getElementById("seasonName").textContent = season.name;

  const remaining = SEASON_DURATION - gameState.season.secondsInSeason;
  document.getElementById("seasonTimeLeft").textContent =
    formatSecondsToMMSS(remaining);

  // Ressourcenpanel
  const woodEl = document.getElementById("wood");
  const woodMaxEl = document.getElementById("woodMax");
  const foodEl = document.getElementById("food");
  const foodMaxEl = document.getElementById("foodMax");
  const goldEl = document.getElementById("gold");
  const stoneEl = document.getElementById("stone");
  const popEl = document.getElementById("population");
  const popCapEl = document.getElementById("populationCap");

  if (woodEl) woodEl.textContent = Math.floor(r.wood);
  if (woodMaxEl) woodMaxEl.textContent = r.woodStorageMax;
  if (foodEl) foodEl.textContent = Math.floor(r.food);
  if (foodMaxEl) foodMaxEl.textContent = r.foodStorageMax;
  if (goldEl) goldEl.textContent = r.gold.toFixed(1);
  if (stoneEl) stoneEl.textContent = Math.floor(r.stone);
  if (popEl) popEl.textContent = r.population;
  if (popCapEl) popCapEl.textContent = cap;

  // Produktionswerte
  const woodPerSec = getWoodPerSecond();
  const foodProdPerSec = getFoodProductionPerSecond();
  const foodConsPerSec = getFoodConsumptionPerSecond();
  const foodNetPerSec = foodProdPerSec - foodConsPerSec;
  const goldPerSec = 0; // später Markt

  // Übersichtspanel
  const ovWps = document.getElementById("ovWoodPerSecond");
  const ovFps = document.getElementById("ovFoodPerSecond");
  const ovGps = document.getElementById("ovGoldPerSecond");
  const ovFNet = document.getElementById("ovFoodNetPerSecond");

  const ovWood = document.getElementById("ovWood");
  const ovWoodMax = document.getElementById("ovWoodMax");
  const ovFood = document.getElementById("ovFood");
  const ovFoodMax = document.getElementById("ovFoodMax");
  const ovGold = document.getElementById("ovGold");
  const ovStone = document.getElementById("ovStone");
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
  if (ovGold) ovGold.textContent = r.gold.toFixed(1);
  if (ovStone) ovStone.textContent = Math.floor(r.stone);
  if (ovPop) ovPop.textContent = r.population;
  if (ovPopCap) ovPopCap.textContent = cap;

  // Holzfällerlager-Panel
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

    const perHit = getWoodPerCompletion();
    const speed = getWoodWorkSpeed();

    if (lvlEl) lvlEl.textContent = b.level;
    if (perHitEl) perHitEl.textContent = perHit.toFixed(2);
    if (speedEl) speedEl.textContent = speed.toFixed(2);
    if (wpsEl) wpsEl.textContent = woodPerSec.toFixed(2);

    const next = b.level + 1;
    const nextData = woodcutterLevels[next];
    if (costEl) costEl.textContent = nextData ? nextData.goldCost : "Max";

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
      if (u.mechanicalSaw)
        bonus.push("Mechanische Säge: x2 Holz pro Abschluss");
      bonusInfo.textContent =
        bonus.length ? bonus.join(" | ") : "Keine Boni aktiv";
    }

    const btnAxe = document.getElementById("btnSharpAxe");
    const btnWorker = document.getElementById("btnSecondWorker");
    const btnSaw = document.getElementById("btnMechanicalSaw");
    const u = b.upgrades;

    if (btnAxe) btnAxe.disabled = u.sharpAxe;
    if (btnWorker) btnWorker.disabled = u.secondWorker;
    if (btnSaw) btnSaw.disabled = u.mechanicalSaw;
  }

  // Bauernhof-Panel
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

    // Fortschrittsbalken Bauernhof
    if (barFarm) {
      const progress = Math.max(0, Math.min(1, b.workProgress)) * 100;
      barFarm.style.width = progress + "%";
    }

    // Upgrade-Buttons
    const btnPlow = document.getElementById("btnFarmBetterPlow");
    const btnSeeds = document.getElementById("btnFarmBetterSeeds");
    const btnSecond = document.getElementById("btnFarmSecondFarmer");

    if (btnPlow) btnPlow.disabled = b.upgrades.betterPlow;
    if (btnSeeds) btnSeeds.disabled = b.upgrades.betterSeeds;
    if (btnSecond) btnSecond.disabled = b.upgrades.secondFarmer;
  }
}

// ===============================
// TICK-LOOP
// ===============================

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

// ===============================
// FUNKTIONEN GLOBAL MACHEN
// ===============================

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
  upgradeFarmLevel();
  updateUI();
};

window.buyFarmUpgrade = function (key) {
  buyFarmUpgrade(key);
  updateUI();
};
