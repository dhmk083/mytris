const canvas = document.getElementById("app");
const ctx = canvas.getContext("2d");

const cellSize = 32;
const rows = 20;
const cols = 10;
const gameSpeed = 500;

let field;
let currentFig;
let currentPos;
let slideValue;
let shouldFall;
let timer;
let gameState;
let prevStepTime = 0;

function init() {
  canvas.width = cols * cellSize;
  canvas.height = rows * cellSize;
  restart();

  window.addEventListener("keydown", ev => {
    switch (ev.key) {
      case "ArrowLeft":
        slide(-1);
        break;
      case "ArrowRight":
        slide(+1);
        break;
      case "ArrowUp":
        rotate();
        break;
      case "ArrowDown":
        fall();
        break;
      case " ":
        togglePause();
        break;
    }
  });
}
setTimeout(init);

const figures = [
  [[1, 1, 1, 1]],
  [
    [2, 2],
    [2, 2]
  ],
  [
    [3, 0],
    [3, 3],
    [0, 3]
  ],
  [
    [0, 4, 0],
    [4, 4, 4]
  ]
];

const getNextFig = () => pickRandom(figures);

function step() {
  const stepTime = Date.now();

  if (!currentFig) {
    currentFig = getNextFig();
    currentPos = [0, ~~(cols / 2 - currentFig[0].length / 2)];

    if (!canMove(currentFig, currentPos)) {
      over();
    }
  } else {
    let rowNum = currentPos[0];
    if (shouldFall || stepTime - prevStepTime >= gameSpeed) {
      prevStepTime = stepTime;
      rowNum += shouldFall ? 3 : 1;
    }
    shouldFall = false;

    const nextPos = [
      rowNum,
      clamp(currentPos[1] + slideValue, 0, cols - getFigureWidth(currentFig))
    ];
    slideValue = 0;

    const nextAvailablePos = getNextAvailablePos(
      currentFig,
      currentPos,
      nextPos
    );

    currentPos = nextAvailablePos;

    if (rowNum > 0 && nextAvailablePos[0] !== nextPos[0]) {
      place(currentFig, currentPos);
    }
  }

  draw();
}

function setGameState(state) {
  gameState = state;
  draw();
}

function stopLoop() {
  timer = clearInterval(timer);
}

function togglePause() {
  if (gameState === "over") return restart();

  timer ? pause() : resume();
}

function pause() {
  stopLoop();
  setGameState("pause");
}

function resume() {
  timer = setInterval(step, gameSpeed);
  setGameState("run");
}

function over() {
  stopLoop();
  setGameState("over");
}

function restart() {
  field = range(rows).map(() => range(cols).fill(0));
  currentFig = undefined;
  currentPos = undefined;
  slideValue = 0;
  shouldFall = undefined;

  resume();
}

function slide(dx) {
  if (!timer) return;
  slideValue += dx;
  step();
}

function fall() {
  if (!timer) return;
  shouldFall = true;
  step();
}

function getFigureWidth(fig) {
  return fig[0].length;
}
function getFigureHeight(fig) {
  return fig.length;
}

function checkRows() {
  for (let r = 0; r < field.length; ++r) {
    if (field[r].every(Boolean)) {
      field.splice(r, 1);
      r--;
    }
  }

  const removed = rows - field.length;

  if (removed) {
    field.unshift(...range(removed).map(() => range(cols).fill(0)));
  }
}

function getNextAvailablePos(currentFig, fromPos, toPos) {
  let [row, col] = toPos;

  const fromCol = fromPos[1];
  const dc = col < fromCol ? +1 : -1;

  while (col !== fromCol && !canMove(currentFig, [row, col])) {
    col += dc;
  }

  const fromRow = fromPos[0];
  const dr = row < fromRow ? +1 : -1;

  while (row !== fromRow && !canMove(currentFig, [row, col])) {
    row += dr;
  }

  return [row, col];
}

function canMove(fig, [rr, cc]) {
  const frows = fig.length;
  const fcols = fig[0].length;

  for (let r = 0; r < frows; ++r)
    for (let c = 0; c < fcols; ++c) {
      const newr = rr + r;
      const newc = cc + c;

      if (
        newr < 0 ||
        newr >= rows ||
        newc < 0 ||
        newc >= cols ||
        (field[newr][newc] > 0 && fig[r][c] > 0)
      )
        return false;
    }

  return true;
}

function place(fig, [rr, cc]) {
  for (let r = 0; r < fig.length; ++r)
    for (let c = 0; c < fig[0].length; ++c) {
      const cell = fig[r][c];
      if (cell > 0) {
        field[rr + r][cc + c] = cell;
      }
    }

  currentFig = undefined;
  checkRows();
}

function rotate() {
  if (!timer) return;
  if (!currentFig) return;

  const nextFig = rotateLeft(currentFig);
  if (canMove(nextFig, currentPos)) {
    currentFig = nextFig;
    step();
  }
}

function rotateLeft(fig) {
  const w = getFigureWidth(fig);
  const h = getFigureHeight(fig);
  const res = Array(w);

  for (let i = 0; i < res.length; ++i) {
    const row = Array(h);

    for (let j = 0; j < row.length; ++j) {
      row[j] = fig[j][w - 1 - i];
    }

    res[i] = row;
  }

  return res;
}

function draw() {
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillRect(0, 0, w, h);

  const fieldWidth = cellSize * cols;
  const fieldHeight = cellSize * rows;
  const fieldX = (w - fieldWidth) / 2;
  const fieldY = (h - fieldHeight) / 2;

  drawField(fieldX, fieldY, cellSize);

  if (gameState != "run") {
    const text = gameState;
    const textHeight = 30;
    ctx.font = `${textHeight}px Arial`;
    const textSize = ctx.measureText(text);
    const boxSize = {
      width: textSize.width + 100,
      height: textHeight + 100
    };
    ctx.beginPath();
    ctx.fillStyle = "gray";
    ctx.strokeStyle = "white";
    ctx.rect(
      (w - boxSize.width) / 2,
      (h - boxSize.height) / 2,
      boxSize.width,
      boxSize.height
    );
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.fillText(gameState, w / 2, h / 2);
  }
}

function drawField(x, y, cellSize) {
  const w = cellSize * cols;
  const h = cellSize * rows;

  ctx.strokeStyle = "white";
  ctx.strokeRect(x, y, w, h);

  withTranslate(ctx, [x, y], () => {
    drawCells(field, [0, 0], cellSize, true);

    if (currentFig) {
      drawCells(currentFig, currentPos, cellSize, false);
    }
  });
}

function drawCells(arr, [rr, cc], cellSize, draw0) {
  const rows = arr.length;
  const cols = arr[0].length;
  const colors = ["indigo", "tomato", "gold", "tan", "beige"];

  for (let r = 0; r < rows; ++r)
    for (let c = 0; c < cols; ++c) {
      const cell = arr[r][c];
      if (cell == 0 && !draw0) continue;

      const fill = colors[cell];
      const stroke = colors[cell + 1] || colors[0];

      ctx.beginPath();
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.rect((cc + c) * cellSize, (rr + r) * cellSize, cellSize, cellSize);
      ctx.fill();
      ctx.stroke();
    }
}
