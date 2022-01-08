let context;
let canvas;
let score = 0;

function windowload() {
  showBestScore(bestscore);
  canvas = document.getElementById("game");
  canvas.setAttribute("tabindex", "0");
  canvas.focus();
  context = canvas.getContext("2d");

  // listen to keyboard events to move the snake
  document.addEventListener("keydown", function(e) {
    // prevent snake from backtracking on itself by checking that it's
    // not already moving on the same axis (pressing left while moving
    // left won't do anything, and pressing right while moving left
    // shouldn't let you collide with your own body)

    // left arrow key
    if (e.which === 37 && snake.dx === 0) {
      snake.dx = -grid;
      snake.dy = 0;
    }
    // up arrow key
    else if (e.which === 38 && snake.dy === 0) {
      snake.dy = -grid;
      snake.dx = 0;
    }
    // right arrow key
    else if (e.which === 39 && snake.dx === 0) {
      snake.dx = grid;
      snake.dy = 0;
    }
    // down arrow key
    else if (e.which === 40 && snake.dy === 0) {
      snake.dy = grid;
      snake.dx = 0;
    }
  });

  requestAnimationFrame(loop);
}

let grid = 16;
let count = 0;

let snake = {
  x: 160,
  y: 160,

  // snake velocity. moves one grid length every frame in either the x or y direction
  dx: grid,
  dy: 0,

  // keep track of all grids the snake body occupies
  cells: [],

  // length of the snake. grows when eating an apple
  maxCells: 4
};
let apple = {
  x: 320,
  y: 320
};

if (Math.random() < 0.5) {
  snake.dx = grid;
  snake.dy = 0;
} else {
  snake.dx = 0;
  snake.dy = grid;
}

// get random whole numbers in a specific range
// @see https://stackoverflow.com/a/1527820/2124254
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function showScore(score) {
  document.getElementById("score").innerHTML = score;
}

function showBestScore(score) {
  document.getElementById("bestscore").innerHTML = score;
}

function resetGame() {
  snake.x = 160;
  snake.y = 160;
  snake.cells = [];
  snake.maxCells = 4;
  if (Math.random() < 0.5) {
    snake.dx = grid;
    snake.dy = 0;
  } else {
    snake.dx = 0;
    snake.dy = grid;
  }
  score = 0;
  showScore(score);
  apple.x = getRandomInt(0, 25) * grid;
  apple.y = getRandomInt(0, 25) * grid;
}

// game loop
function loop() {
  requestAnimationFrame(loop);

  const FAST = 2;
  const NORMAL = 3;
  const SLOW = 4;

  let speed = NORMAL;
  const ui_speed = document.getElementById('speed').value;
  if (ui_speed == 0) {
    let bodylen = snake.cells.length;
    if (bodylen >= 25) {
      speed = FAST;
    } else if (bodylen >= 15) {
      speed = NORMAL;
    } else {
      speed = SLOW;
    }
  } else {
    speed = parseInt(ui_speed);
  }

  // slow game loop to 30 fps instead of 60 (60/30 = 2)
  if (++count < speed) {
    return;
  }

  count = 0;
  context.clearRect(0, 0, canvas.width, canvas.height);

  // move snake by it's velocity
  snake.x += snake.dx;
  snake.y += snake.dy;


  if (document.getElementById('border').value == "ON") {
    // wrap snake position horizontally on edge of screen
    if (snake.x < 0) {
      snake.x = canvas.width - grid;
    }
    else if (snake.x >= canvas.width) {
      snake.x = 0;
    }
    
    // wrap snake position vertically on edge of screen
    if (snake.y < 0) {
      snake.y = canvas.height - grid;
    }
    else if (snake.y >= canvas.height) {
      snake.y = 0;
    }
  }

  if (snake.x < 0 || snake.x >= canvas.width) {
    resetGame();
    return;
  }

  if (snake.y < 0 || snake.y >= canvas.height) {
    resetGame();
    return;
  }

  // keep track of where snake has been. front of the array is always the head
  snake.cells.unshift({ x: snake.x, y: snake.y });

  // remove cells as we move away from them
  if (snake.cells.length > snake.maxCells) {
    snake.cells.pop();
  }

  // draw apple
  context.fillStyle = "red";
  context.fillRect(apple.x, apple.y, grid - 1, grid - 1);

  // draw snake one cell at a time
  context.fillStyle = "green";
  snake.cells.forEach(function(cell, index) {
    // drawing 1 px smaller than the grid creates a grid effect in the snake body so you can see how long it is
    context.fillRect(cell.x, cell.y, grid - 1, grid - 1);

    // snake ate apple
    if (cell.x === apple.x && cell.y === apple.y) {
      snake.maxCells++;

      // canvas is 400x400 which is 25x25 grids
      apple.x = getRandomInt(0, 25) * grid;
      apple.y = getRandomInt(0, 25) * grid;

      score++;
      if (score > bestscore) {
        bestscore = score;
        saveSettings(false);
      }
      showBestScore(bestscore);
      showScore(score);
    }

    // check collision with all cells after this one (modified bubble sort)
    for (let i = index + 1; i < snake.cells.length; i++) {
      // snake occupies same space as a body part. reset game
      if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
        resetGame();
        return;
      }
    }
  });
}