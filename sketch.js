let cellSize = 20;
let cols, rows;

function setup() {
  createCanvas(400, 400);
  cols = width / cellSize;
  rows = height / cellSize;
  noStroke();
}

function draw() {
  background(220);

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let x = i * cellSize;
      let y = j * cellSize;

      // Generate a random color for each cell
      fill(random(255), random(255), random(255));

      // Draw the cell
      ellipse(x + cellSize / 2, y + cellSize / 2, cellSize * 0.8);
    }
  }

  // Stop the draw loop after one frame
  noLoop();
}
