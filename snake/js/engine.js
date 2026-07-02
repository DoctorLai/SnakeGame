/**
 * Simple Snake Game - pure game engine.
 *
 * This module contains all of the game logic with **no** DOM, Canvas or
 * browser dependencies so that it can be unit-tested in Node.js while still
 * being usable directly in the Chrome extension via a classic <script> tag.
 *
 * It exposes itself as `window.SnakeEngine` in the browser and as a CommonJS
 * module (`module.exports`) under Node.js (used by the test-suite).
 */
(function (root, factory) {
  "use strict";
  /* istanbul ignore else -- browser UMD global fallback, exercised by the vm-based test in tests/engine.test.js */
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.SnakeEngine = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /** Default board geometry (the canvas is 400x400 split into 16px cells). */
  var DEFAULTS = { grid: 16, width: 400, height: 400 };

  /** Frame-skip values: the smaller the number the faster the snake moves. */
  var SPEED = { FAST: 2, NORMAL: 3, SLOW: 4 };

  /** Recognised keyboard codes (arrow keys + WASD + space). */
  var KEY = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    A: 65,
    W: 87,
    D: 68,
    S: 83,
    SPACE: 32
  };

  /**
   * Return a random integer in the half-open range [min, max).
   * @param {number} min inclusive lower bound
   * @param {number} max exclusive upper bound
   * @param {function} [rng] optional random source (defaults to Math.random)
   */
  function getRandomInt(min, max, rng) {
    rng = rng || Math.random;
    return Math.floor(rng() * (max - min)) + min;
  }

  /** Structural equality for two `{x, y}` cells. */
  function cellsEqual(a, b) {
    return a.x === b.x && a.y === b.y;
  }

  /**
   * Resolve the frame-skip speed from the UI value.
   * A `uiSpeed` of 0 (or non-numeric) means AUTO: the snake speeds up as it
   * grows. Any other value is used verbatim.
   */
  function computeSpeed(uiSpeed, bodyLength, speeds) {
    speeds = speeds || SPEED;
    var v = parseInt(uiSpeed, 10);
    if (!v) {
      if (bodyLength >= 25) return speeds.FAST;
      if (bodyLength >= 15) return speeds.NORMAL;
      return speeds.SLOW;
    }
    return v;
  }

  /**
   * Wrap a single coordinate around the board (used in "pass-through-walls"
   * mode). Returns the unchanged value when inside the board.
   */
  function wrapCoordinate(value, size, grid) {
    if (value < 0) return size - grid;
    if (value >= size) return 0;
    return value;
  }

  /** True when the head has left the board. */
  function isOutOfBounds(x, y, width, height) {
    return x < 0 || x >= width || y < 0 || y >= height;
  }

  /**
   * Compute the next velocity from a key press, supporting both the arrow keys
   * and WASD. Returns `null` when the key does not change direction (either it
   * is not a movement key, or it would make the snake reverse onto itself).
   */
  function getNextDirection(snake, keyCode, grid) {
    var left = keyCode === KEY.LEFT || keyCode === KEY.A;
    var up = keyCode === KEY.UP || keyCode === KEY.W;
    var right = keyCode === KEY.RIGHT || keyCode === KEY.D;
    var down = keyCode === KEY.DOWN || keyCode === KEY.S;

    if (left && snake.dx === 0) return { dx: -grid, dy: 0 };
    if (up && snake.dy === 0) return { dx: 0, dy: -grid };
    if (right && snake.dx === 0) return { dx: grid, dy: 0 };
    if (down && snake.dy === 0) return { dx: 0, dy: grid };
    return null;
  }

  /**
   * Convert a swipe gesture into an arrow-key code. Short gestures are ignored,
   * and diagonal swipes choose the dominant axis.
   */
  function getSwipeKeyCode(start, end, minDistance) {
    minDistance = minDistance || 24;
    var dx = end.x - start.x;
    var dy = end.y - start.y;
    var absX = Math.abs(dx);
    var absY = Math.abs(dy);

    if (Math.max(absX, absY) < minDistance) return null;
    if (absX > absY) return dx > 0 ? KEY.RIGHT : KEY.LEFT;
    return dy > 0 ? KEY.DOWN : KEY.UP;
  }

  /**
   * Return the given page URL with the "#fullscreen" hash set, replacing any
   * existing hash. Used by the browser fullscreen fallback so re-opening an
   * already-fullscreen page stays idempotent (never "#fullscreen#fullscreen").
   */
  function withFullscreenHash(url) {
    return String(url).replace(/#.*$/, "") + "#fullscreen";
  }

  /**
   * Pick a random apple position that does not overlap the snake body.
   * @param {number} gridCount number of cells per axis (e.g. 25)
   * @param {number} grid cell size in pixels
   * @param {function} [rng] optional random source
   * @param {Array<{x:number,y:number}>} [occupied] cells to avoid
   */
  function placeApple(gridCount, grid, rng, occupied) {
    occupied = occupied || [];
    var x,
      y,
      onSnake,
      tries = 0;
    do {
      x = getRandomInt(0, gridCount, rng) * grid;
      y = getRandomInt(0, gridCount, rng) * grid;
      onSnake = occupied.some(function (c) {
        return c.x === x && c.y === y;
      });
      tries++;
    } while (onSnake && tries < 1000);
    return { x: x, y: y };
  }

  /** Build a fresh snake centred near the top-left, 4 cells long. */
  function createSnake(grid, direction) {
    var snake = { x: 160, y: 160, dx: grid, dy: 0, cells: [], maxCells: 4 };
    if (direction) {
      snake.dx = direction.dx;
      snake.dy = direction.dy;
    }
    return snake;
  }

  /**
   * The stateful game. Holds the snake, apple and score and advances the
   * simulation one tick at a time via `step()`. Rendering and input are the
   * caller's responsibility, which keeps this class fully testable.
   */
  function SnakeGame(options) {
    options = options || {};
    this.width = options.width || DEFAULTS.width;
    this.height = options.height || DEFAULTS.height;
    this.grid = options.grid || DEFAULTS.grid;
    this.gridCount = Math.floor(this.width / this.grid);
    this.rng = options.rng || Math.random;
    this.speeds = options.speeds || SPEED;
    this.reset();
  }

  /** Random starting direction (right or down), mirroring the original game. */
  SnakeGame.prototype.randomDirection = function () {
    if (this.rng() < 0.5) return { dx: this.grid, dy: 0 };
    return { dx: 0, dy: this.grid };
  };

  /** Reset the snake, score and apple to a fresh game. */
  SnakeGame.prototype.reset = function () {
    this.snake = createSnake(this.grid, this.randomDirection());
    this.score = 0;
    this.apple = placeApple(this.gridCount, this.grid, this.rng, this.snake.cells);
    return this;
  };

  /**
   * Apply a key press to the snake's direction.
   * @returns {boolean} true when the direction actually changed.
   */
  SnakeGame.prototype.setDirection = function (keyCode) {
    var d = getNextDirection(this.snake, keyCode, this.grid);
    if (!d) return false;
    this.snake.dx = d.dx;
    this.snake.dy = d.dy;
    return true;
  };

  /**
   * Advance the simulation by one tick.
   * @param {{wrap?: boolean}} [options] when `wrap` is true the snake passes
   *        through walls instead of dying.
   * @returns {{type: 'move'|'eat'|'dead', reason?: 'wall'|'self'}} the outcome.
   */
  SnakeGame.prototype.step = function (options) {
    options = options || {};
    var snake = this.snake;

    snake.x += snake.dx;
    snake.y += snake.dy;

    if (options.wrap) {
      snake.x = wrapCoordinate(snake.x, this.width, this.grid);
      snake.y = wrapCoordinate(snake.y, this.height, this.grid);
    }

    if (isOutOfBounds(snake.x, snake.y, this.width, this.height)) {
      return { type: "dead", reason: "wall" };
    }

    // Record the new head; drop the tail unless we are growing.
    snake.cells.unshift({ x: snake.x, y: snake.y });
    if (snake.cells.length > snake.maxCells) {
      snake.cells.pop();
    }

    var ate = false;
    if (cellsEqual(snake.cells[0], this.apple)) {
      snake.maxCells++;
      this.score++;
      ate = true;
      this.apple = placeApple(this.gridCount, this.grid, this.rng, snake.cells);
    }

    // Collision with own body (head against any other cell).
    for (var i = 1; i < snake.cells.length; i++) {
      if (cellsEqual(snake.cells[0], snake.cells[i])) {
        return { type: "dead", reason: "self" };
      }
    }

    return { type: ate ? "eat" : "move" };
  };

  return {
    DEFAULTS: DEFAULTS,
    SPEED: SPEED,
    KEY: KEY,
    getRandomInt: getRandomInt,
    cellsEqual: cellsEqual,
    computeSpeed: computeSpeed,
    wrapCoordinate: wrapCoordinate,
    isOutOfBounds: isOutOfBounds,
    getNextDirection: getNextDirection,
    getSwipeKeyCode: getSwipeKeyCode,
    withFullscreenHash: withFullscreenHash,
    placeApple: placeApple,
    createSnake: createSnake,
    SnakeGame: SnakeGame
  };
});
