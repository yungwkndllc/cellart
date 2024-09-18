let cells = [];
let numInitialCells = 50;
let growthRate = 0.5;
let minCellSize = 5;
let worleyPoints = [];
let numWorleyPoints = 20;

function setup() {
  createCanvas(400, 400);
  noStroke();

  // Generate Worley noise points
  for (let i = 0; i < numWorleyPoints; i++) {
    worleyPoints.push(createVector(random(width), random(height)));
  }

  // Create initial cell seeds
  for (let i = 0; i < numInitialCells; i++) {
    cells.push(new Cell(random(width), random(height)));
  }
}

function draw() {
  background(240, 240, 250);

  // Grow existing cells
  let growing = true;
  while (growing) {
    growing = false;
    for (let cell of cells) {
      if (cell.grow()) {
        growing = true;
      }
    }
  }

  // Add new cells in empty spaces
  let newCells = [];
  for (let i = 0; i < 100; i++) {
    let x = random(width);
    let y = random(height);
    if (isFreeSpace(x, y)) {
      newCells.push(new Cell(x, y));
    }
  }
  cells = cells.concat(newCells);

  // Final expansion to close gaps
  if (newCells.length === 0) {
    for (let cell of cells) {
      cell.finalExpand();
    }
    noLoop();
  }

  // Draw cells
  for (let cell of cells) {
    cell.display();
  }
}

function isFreeSpace(x, y) {
  for (let cell of cells) {
    if (dist(x, y, cell.x, cell.y) < cell.size + minCellSize) {
      return false;
    }
  }
  return true;
}

class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = minCellSize;
    this.color = color(
      random(200, 240),
      random(200, 240),
      random(200, 240),
      200
    );
    this.noiseOffset = random(1000);
    this.points = 24;
    this.vertices = [];
    this.updateVertices();
    this.worleyScale = random(0.5, 1.5);
  }

  updateVertices() {
    this.vertices = [];
    for (let i = 0; i < this.points; i++) {
      let angle = map(i, 0, this.points, 0, TWO_PI);
      let r =
        this.size +
        map(
          noise(cos(angle) + 1, sin(angle) + 1, this.noiseOffset),
          0,
          1,
          -this.size * 0.1,
          this.size * 0.1
        );

      // Apply Worley noise
      let worleyNoise = this.getWorleyNoise(
        this.x + cos(angle) * r,
        this.y + sin(angle) * r
      );
      r +=
        map(worleyNoise, 0, 1, -this.size * 0.2, this.size * 0.2) *
        this.worleyScale;

      let x = this.x + cos(angle) * r;
      let y = this.y + sin(angle) * r;
      this.vertices.push(createVector(x, y));
    }
  }

  getWorleyNoise(x, y) {
    let closest = Infinity;
    let secondClosest = Infinity;

    for (let point of worleyPoints) {
      let d = dist(x, y, point.x, point.y);
      if (d < closest) {
        secondClosest = closest;
        closest = d;
      } else if (d < secondClosest) {
        secondClosest = d;
      }
    }

    return map(secondClosest - closest, 0, 50, 0, 1);
  }

  grow() {
    let canGrow = true;
    for (let other of cells) {
      if (other !== this && this.isColliding(other)) {
        canGrow = false;
        break;
      }
    }
    if (canGrow) {
      this.size += growthRate;
      this.updateVertices();
      return true;
    }
    return false;
  }

  finalExpand() {
    this.size += 0.5;
    this.updateVertices();
  }

  isColliding(other) {
    for (let v of this.vertices) {
      if (dist(v.x, v.y, other.x, other.y) < other.size) {
        return true;
      }
    }
    return false;
  }

  display() {
    // Cell membrane
    fill(this.color);
    beginShape();
    for (let v of this.vertices) {
      curveVertex(v.x, v.y);
    }
    endShape(CLOSE);

    // Nucleus
    fill(100, 100, 150);
    ellipse(this.x, this.y, this.size * 0.4);

    // Organelles
    for (let i = 0; i < 5; i++) {
      let angle = random(TWO_PI);
      let r = random(this.size * 0.2, this.size * 0.4);
      let orgX = this.x + cos(angle) * r;
      let orgY = this.y + sin(angle) * r;

      fill(random(100, 200), random(100, 200), random(100, 200), 150);
      ellipse(orgX, orgY, this.size * 0.1);
    }
  }
}
