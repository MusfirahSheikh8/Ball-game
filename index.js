// --- Element references
const els = {
  grid: document.getElementById("grid"),
  score: document.getElementById("score"),
  time: document.getElementById("time"),
  high: document.getElementById("high"),
  start: document.getElementById("start"),
  stop: document.getElementById("stop"),
  difficulty: document.getElementById("difficulty"),
};

// --- State
const state = {
  running: false,
  score: 0,
  timeLeft: 30,
  lastHole: -1,
  activeHole: -1,
  moleTimeoutId: null,
  spawnIntervalId: null,
  timerId: null,
};

const holes = [...document.querySelectorAll(".hole")];

// --- Config
const configByDifficulty = {
  easy: { spawnEvery: 900, upTime: [700, 1000] },
  normal: { spawnEvery: 700, upTime: [550, 800] },
  hard: { spawnEvery: 550, upTime: [400, 650] },
};

// --- Helpers
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

//Moles appearing in different hole
function pickHole() {
  let idx;
  do {
    idx = randInt(0, holes.length - 1);
  } while (idx === state.lastHole);
  state.lastHole = idx;
  return idx;
}

function setScore(v) {
  state.score = v;
  els.score.textContent = v;
  els.score.parentElement.classList.add("pulse");
  setTimeout(() => els.score.parentElement.classList.remove("pulse"), 180);
}
function setTime(v) {
  state.timeLeft = v;
  els.time.textContent = v;
}

function setHighIfNeeded() {
  const hi = Math.max(
    Number(localStorage.getItem("whack_hi") || 0),
    state.score
  );
  localStorage.setItem("whack_hi", hi);
  els.high.textContent = hi;
}
function loadHigh() {
  els.high.textContent = localStorage.getItem("whack_hi") || 0;
}

// --- Game Over Function
function gameOver() {
  stopGame();

  // Create custom alert overlay
  const overlay = document.createElement("div");
  overlay.className = "game-over-overlay";

  const alertBox = document.createElement("div");
  alertBox.className = "game-over-alert";

  const title = document.createElement("h2");
  title.textContent = "Game Over!";

  const message = document.createElement("p");
  message.textContent = `You tapped the wrong hole! Final Score: ${state.score}`;

  const restartBtn = document.createElement("button");
  restartBtn.textContent = "Play Again";
  restartBtn.className = "restart-btn";
  restartBtn.addEventListener("click", () => {
    document.body.removeChild(overlay);
    startGame();
  });

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Close";
  closeBtn.className = "close-btn";
  closeBtn.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });

  const buttonContainer = document.createElement("div");
  buttonContainer.className = "alert-buttons";
  buttonContainer.appendChild(restartBtn);
  buttonContainer.appendChild(closeBtn);

  alertBox.appendChild(title);
  alertBox.appendChild(message);
  alertBox.appendChild(buttonContainer);
  overlay.appendChild(alertBox);

  document.body.appendChild(overlay);
}

// --- Mole show/hide
function showMole(upTimeMs) {
  if (state.activeHole !== -1) holes[state.activeHole].classList.remove("mole");
  const idx = pickHole();
  state.activeHole = idx;
  holes[idx].classList.add("mole");

  clearTimeout(state.moleTimeoutId);
  state.moleTimeoutId = setTimeout(() => hideMole(idx), upTimeMs);
}

function hideMole(idx) {
  if (idx === -1) return;
  holes[idx].classList.remove("mole");
  if (state.activeHole === idx) state.activeHole = -1;
}

// --- Spawning loop
function startSpawning() {
  const diff = configByDifficulty[els.difficulty.value];
  clearInterval(state.spawnIntervalId);
  state.spawnIntervalId = setInterval(() => {
    const upTime = randInt(diff.upTime[0], diff.upTime[1]);
    showMole(upTime);
  }, diff.spawnEvery);
}

// --- Timer loop
function startTimer() {
  clearInterval(state.timerId);
  setTime(30);
  state.timerId = setInterval(() => {
    setTime(state.timeLeft - 1);
    if (state.timeLeft <= 0) stopGame();
  }, 1000);
}

// --- Input handling (mouse + touch via pointer events)
els.grid.addEventListener("pointerdown", (e) => {
  const hole = e.target.closest(".hole");
  if (!state.running || !hole) return;

  if (hole.classList.contains("mole")) {
    // ✅ Correct hole (mole present) → increase score
    hole.classList.remove("mole");
    hole.classList.add("hit");
    setTimeout(() => hole.classList.remove("hit"), 120);
    setScore(state.score + 1);
    state.activeHole = -1;
  } else {
    // ❌ Wrong hole → game over
    gameOver();
  }
});

// --- Controls
function startGame() {
  if (state.running) return;
  state.running = true;
  setScore(0);
  loadHigh();
  els.start.disabled = true;
  els.stop.disabled = false;
  els.difficulty.disabled = true;
  startTimer();
  startSpawning();
}

function stopGame() {
  if (!state.running) return;
  state.running = false;
  clearInterval(state.spawnIntervalId);
  clearInterval(state.timerId);
  clearTimeout(state.moleTimeoutId);
  hideMole(state.activeHole);
  els.start.disabled = false;
  els.stop.disabled = true;
  els.difficulty.disabled = false;
  setHighIfNeeded();
}

els.start.addEventListener("click", startGame);
els.stop.addEventListener("click", stopGame);

// Persist difficulty
(function init() {
  loadHigh();
  const savedDiff = localStorage.getItem("whack_diff");
  if (savedDiff && configByDifficulty[savedDiff])
    els.difficulty.value = savedDiff;
  els.difficulty.addEventListener("change", () => {
    localStorage.setItem("whack_diff", els.difficulty.value);
    if (state.running) startSpawning();
  });
})();
