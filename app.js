const FIELD_WIDTH = 10;
const FIELD_HEIGHT = 20;
const MINUTES = 2;

const soundImg = document.querySelector(".sound");
const music = document.querySelector(".audio");
const field = document.querySelector(".field");
const dropSound = document.querySelector(".drop");
const deleteSound = document.querySelector(".delete");
const startBtn = document.querySelector(".start");
const timer = document.querySelector(".timer");
const gameOverText = document.querySelector("#game-over");
const newGameText = document.querySelector(".new-game");
const scoreText = document.querySelector(".score");
const recordsTable = document.querySelectorAll(".record");
const tableTitle = document.querySelector(".table__title");

let fieldMap = [];
let time;
let musicOn = false;
let rotatedMatrix;
let moveInterval;
let timeInterval;
let gameOverTimeout;
let score = 0;
let topScores;

if (localStorage.getItem("topScores")) {
  topScores = JSON.parse(localStorage.getItem("topScores"));
  tableTitle.classList.remove("invisible");
  topScores.forEach(
    (score, i) => (recordsTable[i].innerHTML = `${i + 1}. ${score}`)
  );
} else {
  topScores = [];
}

const shapes = [
  {
    matrix: [
      [1, 1],
      [1, 1],
    ],
    color: "rgba(0, 0, 88, 0.3)",
  },
  {
    matrix: [
      [0, 2, 0],
      [2, 2, 2],
    ],
    color: "rgba(0, 0, 88, 0.4)",
  },
  {
    matrix: [
      [0, 3, 3],
      [3, 3, 0],
    ],
    color: "rgba(0, 0, 88, 0.5)",
  },
  {
    matrix: [
      [4, 4, 0],
      [0, 4, 4],
    ],
    color: "rgba(0, 0, 88, 0.6)",
  },
  {
    matrix: [
      [5, 0, 0],
      [5, 5, 5],
    ],
    color: "rgba(0, 0, 88, 0.7)",
  },
  {
    matrix: [
      [0, 0, 6],
      [6, 6, 6],
    ],
    color: "rgba(0, 0, 88, 0.8)",
  },
  {
    matrix: [[7, 7, 7, 7]],
    color: "rgba(0, 0, 88, 0.9)",
  },
];

const randomShape = () => {
  const index = Math.floor(Math.random() * shapes.length);
  const shape = shapes[index];
  return {
    matrix: shape.matrix,
    color: shape.color,
    horiz: 0,
    vert: Math.ceil((FIELD_WIDTH - shape.matrix[0].length) / 2),
  };
};

let currentShape = randomShape();

const getShape = () => {
  const matrix = currentShape.matrix;
  const color = currentShape.color;
  const horiz = currentShape.horiz;
  const vert = currentShape.vert;

  for (let h = 0; h < matrix.length; h++) {
    for (let v = 0; v < matrix[h].length; v++) {
      if (matrix[h][v]) {
        const square = document.createElement("div");
        square.classList.add("square");
        square.style.backgroundColor = color;
        square.style.top = (horiz + h) * 22 + "px";
        square.style.left = (vert + v) * 22 + "px";
        square.setAttribute("id", `square-${horiz + h}-${vert + v}`);
        field.appendChild(square);
      }
    }
  }
};

const deleteShape = () => {
  for (let i = 0; i < currentShape.matrix.length; i++) {
    for (let j = 0; j < currentShape.matrix[i].length; j++) {
      if (currentShape.matrix[i][j] !== 0) {
        let horiz = currentShape.horiz + i;
        let vert = currentShape.vert + j;
        let square = document.getElementById(`square-${horiz}-${vert}`);
        if (square) {
          field.removeChild(square);
        }
      }
    }
  }
};

const canMove = (horizOffset, vertOffset) => {
  for (let i = 0; i < currentShape.matrix.length; i++) {
    for (let j = 0; j < currentShape.matrix[0].length; j++) {
      if (currentShape.matrix[i][j] !== 0) {
        let horiz = currentShape.horiz + i + horizOffset;
        let vert = currentShape.vert + j + vertOffset;
        if (
          horiz >= FIELD_HEIGHT ||
          vert < 0 ||
          vert >= FIELD_WIDTH ||
          (horiz >= 0 && fieldMap[horiz][vert] !== 0)
        ) {
          return false;
        }
      }
    }
  }
  return true;
};

const canRotate = () => {
  for (let i = 0; i < rotatedMatrix.length; i++) {
    for (let j = 0; j < rotatedMatrix[i].length; j++) {
      if (rotatedMatrix[i][j] !== 0) {
        let horiz = currentShape.horiz + i;
        let vert = currentShape.vert + j;
        if (
          horiz >= FIELD_HEIGHT ||
          vert < 0 ||
          vert >= FIELD_WIDTH ||
          (horiz >= 0 && fieldMap[horiz][vert] !== 0)
        ) {
          return false;
        }
      }
    }
  }
  return true;
};

const deleteRows = () => {
  let rowsDeleted = 0;

  for (let y = 0; y < FIELD_HEIGHT; y++) {
    let rowFull = true;

    for (let x = 0; x < FIELD_WIDTH; x++) {
      if (fieldMap[y][x] === 0) {
        rowFull = false;
        break;
      }
    }

    if (rowFull) {
      rowsDeleted++;
      score += 10;
      deleteSound.play();

      for (let yy = y; yy > 0; yy--) {
        for (let x = 0; x < FIELD_WIDTH; x++) {
          fieldMap[yy][x] = fieldMap[yy - 1][x];
        }
      }
      for (let x = 0; x < FIELD_WIDTH; x++) {
        fieldMap[0][x] = 0;
      }
      field.innerHTML = "";
      for (let horiz = 0; horiz < FIELD_HEIGHT; horiz++) {
        for (let vert = 0; vert < FIELD_WIDTH; vert++) {
          if (fieldMap[horiz][vert]) {
            const square = document.createElement("div");
            square.classList.add("square");
            square.style.backgroundColor = fieldMap[horiz][vert];
            square.style.top = horiz * 22 + "px";
            square.style.left = vert * 22 + "px";
            square.setAttribute("id", `square-${horiz}-${vert}`);
            field.appendChild(square);
          }
        }
      }
    }
  }
  return score;
};

const lockShape = () => {
  for (let i = 0; i < currentShape.matrix.length; i++) {
    for (let j = 0; j < currentShape.matrix[0].length; j++) {
      if (currentShape.matrix[i][j] !== 0) {
        let horiz = currentShape.horiz + i;
        let vert = currentShape.vert + j;
        fieldMap[horiz][vert] = currentShape.color;
      }
    }
  }
  let rowsDeleted = deleteRows();
  currentShape = randomShape();
  if (canMove(1, 0)) {
    getShape();
  } else {
    gameOver();
  }
};

const rotateShape = () => {
  rotatedMatrix = [];
  for (let i = 0; i < currentShape.matrix[0].length; i++) {
    let horiz = [];
    for (let j = currentShape.matrix.length - 1; j >= 0; j--) {
      horiz.push(currentShape.matrix[j][i]);
    }
    rotatedMatrix.push(horiz);
  }

  if (canRotate()) {
    deleteShape();
    currentShape.matrix = rotatedMatrix;
    getShape();
  }
};

const moveShape = (way) => {
  let horiz = currentShape.horiz;
  let vert = currentShape.vert;

  if (way === "left") {
    if (canMove(0, -1)) {
      deleteShape();
      vert -= 1;
      currentShape.vert = vert;
      currentShape.horiz = horiz;
      getShape();
    }
  } else if (way === "right") {
    if (canMove(0, 1)) {
      deleteShape();
      vert += 1;
      currentShape.vert = vert;
      currentShape.horiz = horiz;
      getShape();
    }
  } else {
    if (canMove(1, 0)) {
      deleteShape();
      horiz += 1;
      currentShape.vert = vert;
      currentShape.horiz = horiz;
      getShape();
    } else {
      lockShape();
    }
  }
};

const dropShape = () => {
  let horiz = currentShape.horiz;
  let vert = currentShape.vert;

  dropSound.play();

  while (canMove(1, 0)) {
    deleteShape();
    horiz++;
    currentShape.vert = vert;
    currentShape.horiz = horiz;
    getShape();
  }
  lockShape();
};

const keyPressHandler = (e) => {
  switch (e.keyCode) {
    case 37:
      moveShape("left");
      break;
    case 39:
      moveShape("right");
      break;
    case 40:
      moveShape("down");
      break;
    case 38:
      rotateShape();
      break;
    case 32:
      dropShape();
      break;
  }
};

const updateTimer = () => {
  let remainingMINUTES = Math.floor(time / 60);
  if (remainingMINUTES < 10) {
    remainingMINUTES = "0" + remainingMINUTES;
  }
  let remainginSeconds = time % 60;
  if (remainginSeconds < 10) {
    remainginSeconds = "0" + remainginSeconds;
  }
  timer.innerHTML = `${remainingMINUTES}:${remainginSeconds}`;
  if (time === 0) {
    return;
  } else {
    time--;
  }
};

const checkScore = () => {
  topScores.push(score);
  topScores.sort((a, b) => b - a);
  if (topScores.length > 10) {
    topScores.pop();
  }

  return topScores;
};

const gameOver = () => {
  tableTitle.classList.remove("invisible");
  gameOverText.classList.remove("invisible");
  scoreText.innerHTML = `${score}`;
  checkScore();
  topScores.forEach(
    (score, i) => (recordsTable[i].innerHTML = `${i + 1}. ${score}`)
  );
  localStorage.setItem("topScores", JSON.stringify(topScores));
  fieldMap = [];
  startBtn.classList.remove("inactive");
  newGameText.classList.remove("invisible");
  clearInterval(moveInterval);
  clearInterval(timeInterval);
  clearTimeout(gameOverTimeout);
  timer.innerHTML = "00:00";
  document.removeEventListener("keydown", keyPressHandler);
};

soundImg.addEventListener("click", () => {
  if (musicOn) {
    soundImg.src = "assets/svg/sound-on.svg";
    music.pause();
    musicOn = false;
  } else {
    soundImg.src = "assets/svg/sound-off.svg";
    music.play();
    musicOn = true;
  }
});

startBtn.addEventListener("click", () => {
  document.addEventListener("keydown", keyPressHandler);
  score = 0;
  field.innerHTML = "";
  for (let horiz = 0; horiz < FIELD_HEIGHT; horiz++) {
    fieldMap[horiz] = [];
    for (let vert = 0; vert < FIELD_WIDTH; vert++) {
      fieldMap[horiz][vert] = 0;
    }
  }
  timer.innerHTML = "02:00";
  time = MINUTES * 60 - 1;
  timeInterval = setInterval(updateTimer, 1000);
  music.play();
  musicOn = true;
  soundImg.src = "assets/svg/sound-off.svg";
  currentShape = randomShape();
  getShape();
  moveInterval = setInterval(moveShape, 500);
  startBtn.classList.add("inactive");
  gameOverTimeout = setTimeout(gameOver, 120000);
  gameOverText.classList.add("invisible");
  newGameText.classList.add("invisible");
  return moveInterval, timeInterval;
});

startBtn.addEventListener("keydown", (event) => {
  if ((event.keyCode = 32)) {
    event.preventDefault();
  }
});
