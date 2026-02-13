(function setupStartBootstrap() {
  function showStartError(message) {
    const error = document.getElementById("startError");
    if (error) error.textContent = message;
  }

  function fallbackStart() {
    const input = document.getElementById("villageNameInput");
    const name = ((input && input.value) || "").trim();
    if (!name) {
      showStartError("Bitte gib zuerst einen Dorfnamen ein.");
      return;
    }

    const startScreen = document.getElementById("startScreen");
    const header = document.getElementById("header");
    const gameArea = document.getElementById("gameArea");
    const villageName = document.getElementById("villageName");

    if (villageName) villageName.textContent = name;
    if (startScreen) startScreen.classList.add("hidden");
    if (header) header.classList.remove("hidden");
    if (gameArea) gameArea.classList.remove("hidden");

    showStartError("Hinweis: Spielskripte wurden nicht vollständig geladen. Bitte Seite mit Strg+F5 neu laden.");
  }

  function runStart() {
    if (typeof window.startGame === "function") {
      window.startGame();
      return;
    }

    fallbackStart();
  }

  function bindStartControls() {
    const btn = document.getElementById("startButton");
    const input = document.getElementById("villageNameInput");

    if (btn && !btn.dataset.bound) {
      btn.addEventListener("click", runStart);
      btn.dataset.bound = "1";
    }

    if (input && !input.dataset.bound) {
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") runStart();
      });
      input.dataset.bound = "1";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindStartControls);
  } else {
    bindStartControls();
  }
})();
