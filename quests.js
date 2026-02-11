import { gameState } from "./state.js";

export const QUESTS = [
  {
    id: "wood_500",
    title: "Holzvorrat",
    text: "Sammle 500 Holz.",
    isComplete: () => gameState.resources.wood >= 500,
    reward: { gold: 250 },
  },
  {
    id: "farm_lvl3",
    title: "Ernährer",
    text: "Erreiche Bauernhof Level 3.",
    isComplete: () => gameState.buildings.farm.level >= 3,
    reward: { food: 300, gold: 150 },
  },
  {
    id: "pop_40",
    title: "Wachsendes Dorf",
    text: "Erreiche 40 Bewohner.",
    isComplete: () => gameState.resources.population >= 40,
    reward: { gold: 500, stone: 120 },
  },
  {
    id: "gold_5000",
    title: "Wohlhabend",
    text: "Erhalte insgesamt 5000 Gold (Lebenszeit).",
    isComplete: () => gameState.meta.lifetimeGoldEarned >= 5000,
    reward: { prestige: 1 },
  },
];

export function updateQuestProgress() {
  for (const q of QUESTS) {
    if (!gameState.quests.completed[q.id] && q.isComplete()) {
      gameState.quests.completed[q.id] = true;
    }
  }
}

export function claimQuestReward(id) {
  const quest = QUESTS.find((q) => q.id === id);
  if (!quest) return false;
  if (!gameState.quests.completed[id]) return false;
  if (gameState.quests.rewardClaimed[id]) return false;

  const r = gameState.resources;
  const rw = quest.reward;

  if (rw.gold) r.gold += rw.gold;
  if (rw.wood) r.wood = Math.min(r.woodStorageMax, r.wood + rw.wood);
  if (rw.food) r.food = Math.min(r.foodStorageMax, r.food + rw.food);
  if (rw.stone) r.stone = Math.min(r.stoneStorageMax, r.stone + rw.stone);
  if (rw.prestige) r.prestige += rw.prestige;

  gameState.quests.rewardClaimed[id] = true;
  return true;
}
