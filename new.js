let cells = [];
let ecmPattern;

const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 900; // 16:9 ratio
const MIN_CELLS = 50;
const MAX_CELLS = 20000; // Increased for larger canvas
const CELL_TYPES_PER_GENERATION = 3;

const particleCount = 50; // Increased from 10
const particleLifespan = 50;
let particles = [];
let flowField;

// New variables for flow field parameters
const FLOW_SCALE = 0.005; // Reduced for larger waves
const FLOW_STRENGTH = 0.2; // Increased for more pronounced effect
const FLOW_OCTAVES = 2; // Reduced for smoother waves
const FLOW_FALLOFF = 0.5;
const FLOW_TIME_SCALE = 0.001; // New parameter for time-based variation

// Modified function to create a more wavy flow field
function createFlowField() {
  let field = [];
  noiseSeed(random(10000));
  noiseDetail(FLOW_OCTAVES, FLOW_FALLOFF);
  let t = random(1000); // Time offset for variation
  for (let y = 0; y < height; y++) {
    let row = [];
    for (let x = 0; x < width; x++) {
      let angle = noise(x * FLOW_SCALE, y * FLOW_SCALE, t) * TWO_PI * 4;
      angle += sin(y * 0.1) * 0.5; // Add sine wave influence
      row.push(p5.Vector.fromAngle(angle).setMag(FLOW_STRENGTH));
    }
    field.push(row);
    t += FLOW_TIME_SCALE; // Increment time for each row
  }
  return field;
}

// Define colors based on the image
const COLORS = [
  [255, 132, 212], // Pink
  [255, 165, 225], // Light Pink
  [254, 227, 251], // Lavender Blush
  [255, 42, 58], // Red-Orange
  [254, 79, 103], // Tomato
  [254, 80, 0], // Coral
  [0, 255, 151], // Light Green
  [6, 195, 111], // Medium Sea Green
  [86, 255, 114], // Pale Green
  [255, 198, 0], // Gold
  [254, 219, 90], // Light Yellow
  [237, 168, 7], // Goldenrod
  [196, 103, 253], // Medium Purple
  [42, 98, 255], // Blue
  [82, 136, 213], // Cornflower Blue
  [0, 161, 250], // Sky Blue
  [62, 213, 253], // Pale Turquoise
  [114, 125, 255], // Blue Violet
];

function setup() {
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  noLoop(); // Ensure draw() is only called once

  flowField = createFlowField();

  // Randomly select background color
  let bgColor = random(COLORS);
  background(bgColor);

  // Create ECM pattern
  createECMPattern();

  // Randomly select 3 cell types
  let selectedTypes = [];
  while (selectedTypes.length < CELL_TYPES_PER_GENERATION) {
    let type = floor(random(COLORS.length));
    if (!selectedTypes.includes(type)) {
      selectedTypes.push(type);
    }
  }

  // Randomly determine the number of cells (confluence)
  let totalCellCount = floor(random(MIN_CELLS, MAX_CELLS + 1));

  // // Create cells
  // for (let i = 0; i < totalCellCount; i++) {
  //   let cell = new Cell(type, random(width), random(height));
  //   cells.push(cell);
  // }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let force = flowField[y][x];

      // stroke(0, 0, 0, 30); // Adjusted for visibility on colored backgrounds
      // line(x, y, x + force.x * 100, y + force.y * 100);

      if (random() < 0.007) {
        let type = random(selectedTypes);

        let cell = new Cell(type, x + force.x * 100, y + force.y * 100);
        cells.push(cell);
      }
    }
  }

  blendMode(DIFFERENCE);

  // Draw all cells
  for (let cell of cells) {
    cell.display();
  }
}

function draw() {
  // This function is intentionally left empty as we're creating a static image
}

function createECMPattern() {
  stroke(0, 0, 0, 30); // Adjusted for visibility on colored backgrounds
  for (let i = 0; i < 4000; i++) {
    // Increased number of ECM lines for larger canvas
    let x = random(CANVAS_WIDTH);
    let y = random(CANVAS_HEIGHT);
    line(x, y, x + random(-10, 10), y + random(-10, 10));
  }
}

class Cell {
  constructor(type, x, y) {
    this.type = type;
    this.position = createVector(x, y);
    this.size = random(4, 8); // Reduced by factor of 5
    this.color = color(...COLORS[type], 200); // Using predefined colors with some transparency
    this.borderColor = this.getRandomColor();
    this.nucleusColor = this.getRandomColor();
    this.angle = random(TWO_PI);
  }

  getRandomColor() {
    let colorType;
    do {
      colorType = floor(random(COLORS.length));
    } while (colorType === this.type);
    return color(...COLORS[colorType], 255); // Border color is fully opaque
  }

  display() {
    push();
    translate(this.position.x, this.position.y);
    rotate(this.angle);

    // Cell border
    stroke(this.borderColor);
    strokeWeight(random(1, 1)); // Adjust this value for border thickness

    // Cell body
    fill(this.color);
    ellipse(0, 0, this.size, this.size * 0.8);

    // Cell nucleus (internals)
    fill(this.nucleusColor);
    noStroke();
    ellipse(this.size * 0.1, 0, this.size * 0.4, this.size * 0.3);

    pop();
  }
}
