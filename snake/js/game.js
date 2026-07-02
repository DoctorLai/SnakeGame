"use strict";

/**
 * Browser glue for the Snake game.
 *
 * All game logic lives in the dependency-free `SnakeEngine` module
 * (js/engine.js). This file is only responsible for wiring that engine up to
 * the DOM: reading the user's settings, handling the keyboard, rendering to the
 * canvas and persisting the best score. Keeping it thin makes the logic
 * unit-testable while this layer stays a simple, predictable adapter.
 *
 * Cross-file globals (declared in js/main.js): `bestscore`, `saveSettings`.
 * Provided by js/engine.js: `SnakeEngine`.
 */

const CANVAS_SIZE = 400;
const GRID = SnakeEngine.DEFAULTS.grid;

let context;
let canvas;
let game;
let frameCount = 0;
let paused = false;
let gameOver = false;
let touchStart = null;
let fullscreenFallbackTimer = null;

function showScore(value) {
  document.getElementById("score").innerHTML = value;
}

function showBestScore(value) {
  document.getElementById("bestscore").innerHTML = value;
}

function getSetting(id) {
  const el = document.getElementById(id);
  return el ? el.value : null;
}

// Draw the current apple and snake. Called once per simulated tick.
function render() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  // apple
  context.fillStyle = "red";
  context.fillRect(game.apple.x, game.apple.y, GRID - 1, GRID - 1);

  // snake
  context.fillStyle = "green";
  game.snake.cells.forEach(function (cell) {
    context.fillRect(cell.x, cell.y, GRID - 1, GRID - 1);
  });
}

// Translucent overlay shown while the game is paused.
function renderPaused() {
  context.fillStyle = "rgba(0, 0, 0, 0.5)";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "white";
  context.font = "30px sans-serif";
  context.textAlign = "center";
  context.fillText(
    typeof get_text === "function" ? get_text("paused", "Paused") : "Paused",
    canvas.width / 2,
    canvas.height / 2
  );
  context.textAlign = "start";
}

function togglePause() {
  paused = !paused;
  if (paused) {
    renderPaused();
  }
}

// Translucent "Game Over" overlay with the final score and a restart hint.
function renderGameOver() {
  context.fillStyle = "rgba(0, 0, 0, 0.6)";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "white";
  context.textAlign = "center";

  context.font = "32px sans-serif";
  context.fillText(
    typeof get_text === "function" ? get_text("game_over", "Game Over") : "Game Over",
    canvas.width / 2,
    canvas.height / 2 - 24
  );

  const scoreLabel =
    (typeof get_text === "function" ? get_text("score_text", "Score") : "Score") +
    ": " +
    game.score;
  context.font = "18px sans-serif";
  context.fillText(scoreLabel, canvas.width / 2, canvas.height / 2 + 6);

  context.font = "14px sans-serif";
  context.fillText(
    typeof get_text === "function"
      ? get_text("restart_hint", "Press any key to restart")
      : "Press any key to restart",
    canvas.width / 2,
    canvas.height / 2 + 34
  );

  context.textAlign = "start";
}

// Start a brand new game from the Game Over (or paused) state.
function restartGame() {
  gameOver = false;
  paused = false;
  frameCount = 0;
  game.reset();
  showScore(game.score);
  render();
}

function onTouchStart(e) {
  if (!e.changedTouches || e.changedTouches.length === 0) return;
  const touch = e.changedTouches[0];
  touchStart = { x: touch.clientX, y: touch.clientY };
  e.preventDefault();
}

function onTouchEnd(e) {
  if (gameOver) {
    touchStart = null;
    restartGame();
    e.preventDefault();
    return;
  }
  if (!touchStart || !e.changedTouches || e.changedTouches.length === 0) return;
  const touch = e.changedTouches[0];
  const keyCode = SnakeEngine.getSwipeKeyCode(touchStart, {
    x: touch.clientX,
    y: touch.clientY
  });
  touchStart = null;
  if (keyCode) {
    game.setDirection(keyCode);
  }
  e.preventDefault();
}

// Fullscreen (browser play): scale the board up to fill the screen while the
// engine keeps its fixed 400x400 resolution, so gameplay is unchanged. Uses the
// standard Fullscreen API where available, with a Chrome-extension window
// fallback for the constrained action popup.
function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

function getGamePageUrl() {
  const fullscreenHash = "#fullscreen";
  if (typeof chrome === "object" && chrome.runtime && chrome.runtime.getURL) {
    return chrome.runtime.getURL("main.html") + fullscreenHash;
  }
  return window.location.href.replace(/#.*$/, "") + fullscreenHash;
}

function isFullscreenLayout() {
  return isFullscreen() || window.location.hash === "#fullscreen";
}

function openBrowserWindow(url, state) {
  const createData = { url: url, type: "popup", state: state, focused: true };
  const onCreated = function (createdWindow) {
    if (chrome.runtime.lastError) {
      if (state === "fullscreen") {
        openBrowserWindow(url, "maximized");
      }
      return;
    }
    if (createdWindow && createdWindow.id && state !== "fullscreen" && chrome.windows.update) {
      chrome.windows.update(createdWindow.id, { state: "fullscreen", focused: true });
    }
  };
  const result = chrome.windows.create(createData, onCreated);
  if (result && typeof result.catch === "function") {
    result.catch(function () {
      if (state === "fullscreen") {
        openBrowserWindow(url, "maximized");
      }
    });
  }
}

function openFullscreenWindow(source) {
  const url = getGamePageUrl();
  if (typeof chrome === "object" && chrome.windows && chrome.windows.create) {
    openBrowserWindow(url, "fullscreen");
    return;
  }
  const opened = window.open(url, "_blank", "noopener,noreferrer,fullscreen=yes");
  if (!opened && source) {
    alert(
      "Fullscreen was blocked. Open the game page in a browser tab, then click Fullscreen again."
    );
  }
}

function scheduleFullscreenFallback() {
  clearTimeout(fullscreenFallbackTimer);
  fullscreenFallbackTimer = setTimeout(function () {
    if (!isFullscreen()) {
      openFullscreenWindow("fallback");
    }
  }, 250);
}

function toggleFullscreen() {
  const target = document.getElementById("tabs-canvas");
  if (!target) return;
  if (isFullscreen()) {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (exit) exit.call(document);
    return;
  }
  const request = target.requestFullscreen || target.webkitRequestFullscreen;
  if (!request) {
    openFullscreenWindow("unsupported");
    return;
  }
  try {
    const result = request.call(target);
    scheduleFullscreenFallback();
    // Popup documents can reject fullscreen requests; open the game in a real
    // fullscreen browser window instead of silently doing nothing.
    if (result && typeof result.catch === "function") {
      result
        .then(function () {
          clearTimeout(fullscreenFallbackTimer);
        })
        .catch(function () {
          openFullscreenWindow("rejected");
        });
    }
  } catch (err) {
    openFullscreenWindow("thrown");
  }
}

function onFullscreenChange() {
  if (isFullscreen()) {
    clearTimeout(fullscreenFallbackTimer);
  }
  const target = document.getElementById("tabs-canvas");
  if (target) {
    target.classList.toggle("fs-active", isFullscreenLayout());
  }
  if (document.body) {
    document.body.classList.toggle("window-fullscreen", window.location.hash === "#fullscreen");
  }
  if (canvas) {
    canvas.focus();
  }
}

function windowload() {
  showBestScore(bestscore);
  canvas = document.getElementById("game");
  canvas.setAttribute("tabindex", "0");
  canvas.focus();
  context = canvas.getContext("2d");

  game = new SnakeEngine.SnakeGame({
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    grid: GRID
  });
  showScore(game.score);
  onFullscreenChange();

  // Keyboard: arrow keys / WASD steer the snake, space toggles pause.
  document.addEventListener("keydown", function (e) {
    const code = e.which || e.keyCode;
    if (gameOver) {
      e.preventDefault();
      restartGame();
      return;
    }
    if (code === SnakeEngine.KEY.SPACE) {
      e.preventDefault();
      togglePause();
      return;
    }
    game.setDirection(code);
  });
  canvas.addEventListener("touchstart", onTouchStart, { passive: false });
  canvas.addEventListener("touchend", onTouchEnd, { passive: false });

  // Fullscreen toggle. If the action popup rejects the Fullscreen API request,
  // toggleFullscreen opens the game in a fullscreen Chrome window instead.
  const fullscreenBtn = document.getElementById("text_fullscreen");
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener("click", function () {
      toggleFullscreen();
      this.blur();
    });
  }
  document.addEventListener("fullscreenchange", onFullscreenChange);
  document.addEventListener("webkitfullscreenchange", onFullscreenChange);

  requestAnimationFrame(loop);
}

// Main animation loop, throttled by frame-skipping to control the speed.
function loop() {
  requestAnimationFrame(loop);

  if (paused || gameOver) {
    return;
  }

  const speed = SnakeEngine.computeSpeed(getSetting("speed"), game.snake.cells.length);
  if (++frameCount < speed) {
    return;
  }
  frameCount = 0;

  // "Border ON" lets the snake pass through walls (wrap around).
  const wrap = getSetting("border") === "ON";
  const result = game.step({ wrap: wrap });

  if (result.type === "dead") {
    gameOver = true;
    render();
    renderGameOver();
    return;
  }

  if (result.type === "eat") {
    if (game.score > bestscore) {
      bestscore = game.score;
      saveSettings(false);
    }
    showBestScore(bestscore);
    showScore(game.score);
  }

  render();
}
