"use strict";

const engine = require("../snake/js/engine");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const {
  DEFAULTS,
  SPEED,
  KEY,
  getRandomInt,
  cellsEqual,
  computeSpeed,
  wrapCoordinate,
  isOutOfBounds,
  getNextDirection,
  getSwipeKeyCode,
  placeApple,
  createSnake,
  SnakeGame
} = engine;

/** Deterministic random source that cycles through the supplied values. */
function seq(values) {
  let i = 0;
  return () => values[i++ % values.length];
}

describe("constants", () => {
  test("exposes board defaults", () => {
    expect(DEFAULTS).toEqual({ grid: 16, width: 400, height: 400 });
  });

  test("exposes speed and key tables", () => {
    expect(SPEED).toEqual({ FAST: 2, NORMAL: 3, SLOW: 4 });
    expect(KEY.LEFT).toBe(37);
    expect(KEY.SPACE).toBe(32);
  });
});

describe("getRandomInt", () => {
  test("uses the provided rng and floors the result", () => {
    expect(getRandomInt(0, 10, () => 0)).toBe(0);
    expect(getRandomInt(0, 10, () => 0.99)).toBe(9);
    expect(getRandomInt(5, 10, () => 0.5)).toBe(7);
  });

  test("defaults to Math.random and stays in range", () => {
    for (let i = 0; i < 100; i++) {
      const v = getRandomInt(0, 25);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(25);
      expect(Number.isInteger(v)).toBe(true);
    }
  });
});

describe("cellsEqual", () => {
  test("compares both coordinates", () => {
    expect(cellsEqual({ x: 1, y: 2 }, { x: 1, y: 2 })).toBe(true);
    expect(cellsEqual({ x: 1, y: 2 }, { x: 9, y: 2 })).toBe(false);
    expect(cellsEqual({ x: 1, y: 2 }, { x: 1, y: 9 })).toBe(false);
  });
});

describe("computeSpeed", () => {
  test("returns the numeric UI value verbatim", () => {
    expect(computeSpeed("2", 0)).toBe(2);
    expect(computeSpeed("3", 100)).toBe(3);
    expect(computeSpeed("4", 0)).toBe(4);
  });

  test("AUTO speeds up as the snake grows", () => {
    expect(computeSpeed("0", 5)).toBe(SPEED.SLOW);
    expect(computeSpeed("0", 14)).toBe(SPEED.SLOW);
    expect(computeSpeed("0", 15)).toBe(SPEED.NORMAL);
    expect(computeSpeed("0", 24)).toBe(SPEED.NORMAL);
    expect(computeSpeed("0", 25)).toBe(SPEED.FAST);
    expect(computeSpeed("0", 40)).toBe(SPEED.FAST);
  });

  test("treats non-numeric values as AUTO", () => {
    expect(computeSpeed("", 5)).toBe(SPEED.SLOW);
    expect(computeSpeed(undefined, 30)).toBe(SPEED.FAST);
  });

  test("honours a custom speed table", () => {
    const speeds = { FAST: 1, NORMAL: 2, SLOW: 3 };
    expect(computeSpeed("0", 30, speeds)).toBe(1);
    expect(computeSpeed("0", 5, speeds)).toBe(3);
  });
});

describe("wrapCoordinate", () => {
  test("wraps off the low edge to the far side", () => {
    expect(wrapCoordinate(-16, 400, 16)).toBe(384);
  });

  test("wraps off the high edge back to zero", () => {
    expect(wrapCoordinate(400, 400, 16)).toBe(0);
    expect(wrapCoordinate(416, 400, 16)).toBe(0);
  });

  test("leaves in-bounds values unchanged", () => {
    expect(wrapCoordinate(160, 400, 16)).toBe(160);
  });
});

describe("isOutOfBounds", () => {
  test("detects every wall", () => {
    expect(isOutOfBounds(-1, 10, 400, 400)).toBe(true);
    expect(isOutOfBounds(400, 10, 400, 400)).toBe(true);
    expect(isOutOfBounds(10, -1, 400, 400)).toBe(true);
    expect(isOutOfBounds(10, 400, 400, 400)).toBe(true);
  });

  test("returns false inside the board", () => {
    expect(isOutOfBounds(0, 0, 400, 400)).toBe(false);
    expect(isOutOfBounds(384, 384, 400, 400)).toBe(false);
  });
});

describe("getNextDirection", () => {
  const grid = 16;

  test("turns vertically while moving horizontally (arrows)", () => {
    const snake = { dx: grid, dy: 0 };
    expect(getNextDirection(snake, KEY.UP, grid)).toEqual({ dx: 0, dy: -grid });
    expect(getNextDirection(snake, KEY.DOWN, grid)).toEqual({ dx: 0, dy: grid });
    expect(getNextDirection(snake, KEY.LEFT, grid)).toBeNull();
    expect(getNextDirection(snake, KEY.RIGHT, grid)).toBeNull();
  });

  test("turns horizontally while moving vertically (arrows)", () => {
    const snake = { dx: 0, dy: grid };
    expect(getNextDirection(snake, KEY.LEFT, grid)).toEqual({ dx: -grid, dy: 0 });
    expect(getNextDirection(snake, KEY.RIGHT, grid)).toEqual({ dx: grid, dy: 0 });
    expect(getNextDirection(snake, KEY.UP, grid)).toBeNull();
    expect(getNextDirection(snake, KEY.DOWN, grid)).toBeNull();
  });

  test("supports WASD keys", () => {
    expect(getNextDirection({ dx: grid, dy: 0 }, KEY.W, grid)).toEqual({ dx: 0, dy: -grid });
    expect(getNextDirection({ dx: grid, dy: 0 }, KEY.S, grid)).toEqual({ dx: 0, dy: grid });
    expect(getNextDirection({ dx: 0, dy: grid }, KEY.A, grid)).toEqual({ dx: -grid, dy: 0 });
    expect(getNextDirection({ dx: 0, dy: grid }, KEY.D, grid)).toEqual({ dx: grid, dy: 0 });
  });

  test("ignores non-movement keys", () => {
    expect(getNextDirection({ dx: grid, dy: 0 }, 99, grid)).toBeNull();
  });
});

describe("getSwipeKeyCode", () => {
  test("ignores short gestures", () => {
    expect(getSwipeKeyCode({ x: 10, y: 10 }, { x: 20, y: 10 })).toBeNull();
    expect(getSwipeKeyCode({ x: 10, y: 10 }, { x: 20, y: 10 }, 4)).toBe(KEY.RIGHT);
  });

  test("maps horizontal swipes to left and right", () => {
    expect(getSwipeKeyCode({ x: 10, y: 10 }, { x: 80, y: 20 })).toBe(KEY.RIGHT);
    expect(getSwipeKeyCode({ x: 80, y: 10 }, { x: 10, y: 20 })).toBe(KEY.LEFT);
  });

  test("maps vertical swipes to up and down", () => {
    expect(getSwipeKeyCode({ x: 10, y: 10 }, { x: 20, y: 80 })).toBe(KEY.DOWN);
    expect(getSwipeKeyCode({ x: 10, y: 80 }, { x: 20, y: 10 })).toBe(KEY.UP);
  });

  test("uses the dominant axis for diagonal gestures", () => {
    expect(getSwipeKeyCode({ x: 0, y: 0 }, { x: 90, y: 30 })).toBe(KEY.RIGHT);
    expect(getSwipeKeyCode({ x: 0, y: 0 }, { x: 30, y: 90 })).toBe(KEY.DOWN);
  });
});

describe("placeApple", () => {
  test("maps the rng onto grid-aligned coordinates", () => {
    const apple = placeApple(25, 16, seq([0.2, 0.2]));
    expect(apple).toEqual({ x: 80, y: 80 });
  });

  test("avoids cells occupied by the snake", () => {
    // First candidate (0,0) is occupied, so it retries.
    const apple = placeApple(25, 16, seq([0, 0, 0.5, 0.5]), [{ x: 0, y: 0 }]);
    expect(apple).toEqual({ x: 192, y: 192 });
  });

  test("always lands inside the board with the default rng", () => {
    for (let i = 0; i < 100; i++) {
      const apple = placeApple(25, 16);
      expect(apple.x % 16).toBe(0);
      expect(apple.x).toBeGreaterThanOrEqual(0);
      expect(apple.x).toBeLessThan(400);
    }
  });
});

describe("createSnake", () => {
  test("builds the default four-cell snake moving right", () => {
    expect(createSnake(16)).toEqual({
      x: 160,
      y: 160,
      dx: 16,
      dy: 0,
      cells: [],
      maxCells: 4
    });
  });

  test("accepts a starting direction override", () => {
    const snake = createSnake(16, { dx: 0, dy: 16 });
    expect(snake.dx).toBe(0);
    expect(snake.dy).toBe(16);
  });
});

describe("SnakeGame", () => {
  test("constructs with sensible defaults", () => {
    const game = new SnakeGame();
    expect(game.width).toBe(400);
    expect(game.height).toBe(400);
    expect(game.grid).toBe(16);
    expect(game.gridCount).toBe(25);
    expect(game.score).toBe(0);
    expect(Array.isArray(game.snake.cells)).toBe(true);
    expect(isOutOfBounds(game.apple.x, game.apple.y, 400, 400)).toBe(false);
  });

  test("randomDirection picks right or down based on the rng", () => {
    expect(new SnakeGame({ rng: () => 0.2 }).snake).toMatchObject({ dx: 16, dy: 0 });
    expect(new SnakeGame({ rng: () => 0.9 }).snake).toMatchObject({ dx: 0, dy: 16 });
  });

  test("setDirection returns whether the heading changed", () => {
    const game = new SnakeGame({ rng: () => 0.2 }); // moving right
    expect(game.setDirection(KEY.UP)).toBe(true);
    expect(game.snake).toMatchObject({ dx: 0, dy: -16 });
    // Now moving up; pressing down would reverse onto itself -> ignored.
    expect(game.setDirection(KEY.DOWN)).toBe(false);
    expect(game.setDirection(99)).toBe(false);
  });

  test("step moves the snake one cell and grows the body", () => {
    const game = new SnakeGame({ rng: () => 0.2 });
    game.snake = { x: 160, y: 160, dx: 16, dy: 0, cells: [{ x: 160, y: 160 }], maxCells: 4 };
    game.apple = { x: 999, y: 999 };
    const result = game.step({ wrap: false });
    expect(result).toEqual({ type: "move" });
    expect(game.snake.cells[0]).toEqual({ x: 176, y: 160 });
    expect(game.snake.cells.length).toBe(2);
  });

  test("step drops the tail once at full length", () => {
    const game = new SnakeGame({ rng: () => 0.2 });
    game.snake = {
      x: 160,
      y: 160,
      dx: 16,
      dy: 0,
      cells: [
        { x: 160, y: 160 },
        { x: 144, y: 160 },
        { x: 128, y: 160 },
        { x: 112, y: 160 }
      ],
      maxCells: 4
    };
    game.apple = { x: 999, y: 999 };
    game.step({ wrap: false });
    expect(game.snake.cells.length).toBe(4);
    expect(game.snake.cells[0]).toEqual({ x: 176, y: 160 });
  });

  test("step eats an apple, scores and respawns it", () => {
    const game = new SnakeGame({ rng: () => 0.2 });
    game.snake = { x: 160, y: 160, dx: 16, dy: 0, cells: [{ x: 160, y: 160 }], maxCells: 4 };
    game.apple = { x: 176, y: 160 };
    game.rng = () => 0; // respawn apple at (0,0)
    const result = game.step({ wrap: false });
    expect(result).toEqual({ type: "eat" });
    expect(game.score).toBe(1);
    expect(game.snake.maxCells).toBe(5);
    expect(game.apple).toEqual({ x: 0, y: 0 });
  });

  test("step kills the snake at a wall when not wrapping", () => {
    const game = new SnakeGame({ rng: () => 0.2 });
    game.snake = { x: 384, y: 160, dx: 16, dy: 0, cells: [{ x: 384, y: 160 }], maxCells: 4 };
    const result = game.step({ wrap: false });
    expect(result).toEqual({ type: "dead", reason: "wall" });
  });

  test("step wraps through the wall when wrapping is enabled", () => {
    const game = new SnakeGame({ rng: () => 0.2 });
    game.snake = { x: 384, y: 160, dx: 16, dy: 0, cells: [{ x: 384, y: 160 }], maxCells: 4 };
    game.apple = { x: 999, y: 999 };
    const result = game.step({ wrap: true });
    expect(result).toEqual({ type: "move" });
    expect(game.snake.x).toBe(0);
  });

  test("step wraps off the low edge too", () => {
    const game = new SnakeGame({ rng: () => 0.2 });
    game.snake = { x: 0, y: 0, dx: -16, dy: 0, cells: [{ x: 0, y: 0 }], maxCells: 4 };
    game.apple = { x: 999, y: 999 };
    game.step({ wrap: true });
    expect(game.snake.x).toBe(384);
  });

  test("step detects self-collision", () => {
    const game = new SnakeGame({ rng: () => 0.2 });
    game.snake = {
      x: 160,
      y: 160,
      dx: 0,
      dy: 16,
      cells: [
        { x: 160, y: 160 },
        { x: 176, y: 160 },
        { x: 176, y: 176 },
        { x: 160, y: 176 }
      ],
      maxCells: 10
    };
    const result = game.step({ wrap: false });
    expect(result).toEqual({ type: "dead", reason: "self" });
  });

  test("step defaults to no-wrap when called without options", () => {
    const game = new SnakeGame({ rng: () => 0.2 });
    game.snake = { x: 384, y: 160, dx: 16, dy: 0, cells: [{ x: 384, y: 160 }], maxCells: 4 };
    expect(game.step()).toEqual({ type: "dead", reason: "wall" });
  });

  test("reset restores a fresh game", () => {
    const game = new SnakeGame({ rng: () => 0.2 });
    game.score = 42;
    game.snake.cells = [
      { x: 0, y: 0 },
      { x: 16, y: 0 }
    ];
    game.snake.maxCells = 99;
    game.reset();
    expect(game.score).toBe(0);
    expect(game.snake.cells).toEqual([]);
    expect(game.snake.maxCells).toBe(4);
    expect(isOutOfBounds(game.apple.x, game.apple.y, 400, 400)).toBe(false);
  });

  test("honours custom board geometry", () => {
    const game = new SnakeGame({ width: 320, height: 240, grid: 16, rng: () => 0.2 });
    expect(game.width).toBe(320);
    expect(game.height).toBe(240);
    expect(game.gridCount).toBe(20);
  });

  test("plays a short deterministic game end to end", () => {
    const game = new SnakeGame({ rng: () => 0.2 }); // moving right
    game.snake = { x: 160, y: 160, dx: 16, dy: 0, cells: [{ x: 160, y: 160 }], maxCells: 4 };
    game.apple = { x: 176, y: 160 }; // directly ahead
    game.rng = seq([0.5, 0.5]); // respawn the next apple mid-board

    const eaten = game.step();
    expect(eaten).toEqual({ type: "eat" });
    expect(game.score).toBe(1);
    expect(game.snake.maxCells).toBe(5);

    const moved = game.step();
    expect(moved).toEqual({ type: "move" });
    expect(game.snake.cells[0]).toEqual({ x: 192, y: 160 });
    expect(game.snake.cells.length).toBe(3);
  });
});

describe("edge cases", () => {
  test("computeSpeed accepts a numeric UI value", () => {
    expect(computeSpeed(2, 0)).toBe(2);
    expect(computeSpeed(0, 30)).toBe(SPEED.FAST);
  });

  test("getSwipeKeyCode triggers when the gesture exactly meets the threshold", () => {
    expect(getSwipeKeyCode({ x: 0, y: 0 }, { x: 24, y: 0 })).toBe(KEY.RIGHT);
    expect(getSwipeKeyCode({ x: 0, y: 0 }, { x: 0, y: 24 })).toBe(KEY.DOWN);
  });

  test("placeApple gives up after exhausting its retries on a full board", () => {
    // A 1x1 board whose only cell is occupied: every candidate collides, so the
    // loop must bail out after its retry budget rather than spin forever.
    const apple = placeApple(1, 16, () => 0, [{ x: 0, y: 0 }]);
    expect(apple).toEqual({ x: 0, y: 0 });
  });
});

describe("module registration", () => {
  test("registers SnakeEngine on the global object without a CommonJS module", () => {
    const code = fs.readFileSync(path.join(__dirname, "../snake/js/engine.js"), "utf8");
    const sandbox = {};
    sandbox.self = sandbox; // emulate the browser global (window / self)
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);
    expect(sandbox.SnakeEngine).toBeDefined();
    expect(typeof sandbox.SnakeEngine.SnakeGame).toBe("function");
    expect(sandbox.SnakeEngine.DEFAULTS).toEqual({ grid: 16, width: 400, height: 400 });
  });
});
