let cells = [];
let ecmPattern;
let flowFields = {}; // Change this to an object

const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 900; // 16:9 ratio
const MIN_CELLS = 5;
const MAX_CELLS = 30000; // Increased for larger canvas
const CELL_TYPES_PER_GENERATION = 3;

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

const MIN_ECM_LINES = 5000;
const MAX_ECM_LINES = 20000;
const MIN_ECM_LENGTH = 25;
const MAX_ECM_LENGTH = 75;

// New constants for Dots ECM
const MIN_ECM_DOTS = 100000;
const MAX_ECM_DOTS = 200000;
const MIN_DOT_SIZE = 1;
const MAX_DOT_SIZE = 2;

const ECM_TYPES = ["Lines", "Dots"];

const FLOW_CELL_SIZE = 20;
const NOISE_SCALE = 0.1;
const NOISE_STRENGTH = 2; // Increased for more pronounced effect

// New constants for colony tightness
const MIN_COLONY_TIGHTNESS = 0.1;
const MAX_COLONY_TIGHTNESS = 10;

const CELL_TYPES = [1, 2, 3, 4, 5, 6]; // Add cell type 4

function setup() {
  p5grain.setup();
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  noLoop(); // Ensure draw() is only called once

  // Randomly select background color
  let bgColor = random(COLORS);
  background(color(...bgColor));
  console.log("Background color set:", bgColor);

  console.log("CELL_TYPES:", CELL_TYPES);
  let selectedTypes = shuffle(CELL_TYPES).slice(0, floor(random(1, 5)));
  console.log("Selected cell types:", selectedTypes);

  // Assign colors to each selected cell type
  let typeFillColors = {};
  let typeNucleusColors = {};
  for (let type of selectedTypes) {
    typeFillColors[type] = random(COLORS);
    do {
      typeNucleusColors[type] = random(COLORS);
    } while (typeNucleusColors[type] === typeFillColors[type]);
  }

  // Create ECM pattern
  createECMPattern();

  // Create flow fields for all types
  for (let type of CELL_TYPES) {
    flowFields[type] = createFlowField(random(10000), type);
  }

  let totalCellCount = floor(random(MIN_CELLS, MAX_CELLS + 1));

  // Create cells
  for (let i = 0; i < totalCellCount; i++) {
    let type = random(selectedTypes);
    let borderColor = floor(random(COLORS.length));
    console.log(`Creating cell ${i}: Type ${type}`);
    let cell = new Cell(
      type,
      borderColor,
      random(MIN_COLONY_TIGHTNESS, MAX_COLONY_TIGHTNESS),
      typeFillColors[type],
      typeNucleusColors[type],
      random() * 4
    );
    cells.push(cell);
  }

  // Draw all cells
  for (let cell of cells) {
    cell.display();
  }

  applyMonochromaticGrain(42);
}

function draw() {
  // This function is intentionally left empty as we're creating a static image
}

function createECMPattern() {
  let bgColor = color(get(0, 0)); // Get the background color
  let ecmColor = color(
    255 - red(bgColor),
    255 - green(bgColor),
    255 - blue(bgColor),
    30 // Keep the low opacity
  );

  let selectedECMType = random(ECM_TYPES);

  switch (selectedECMType) {
    case "Lines":
      createLinesECM(ecmColor);
      break;
    case "Dots":
      createDotsECM(ecmColor);
      break;
  }
}

function createLinesECM(ecmColor) {
  stroke(ecmColor);
  let ecmLineCount = floor(random(MIN_ECM_LINES, MAX_ECM_LINES + 1));

  for (let i = 0; i < ecmLineCount; i++) {
    let x = random(CANVAS_WIDTH);
    let y = random(CANVAS_HEIGHT);
    let lineLength = random(MIN_ECM_LENGTH, MAX_ECM_LENGTH);
    let angle = random(TWO_PI);

    let endX = x + cos(angle) * lineLength;
    let endY = y + sin(angle) * lineLength;

    line(x, y, endX, endY);
  }
}

function createDotsECM(ecmColor) {
  stroke(ecmColor);
  let dotCount = floor(random(MIN_ECM_DOTS, MAX_ECM_DOTS + 1));

  for (let i = 0; i < dotCount; i++) {
    let x = random(width);
    let y = random(height);
    let dotSize = random(MIN_DOT_SIZE, MAX_DOT_SIZE);

    noStroke();
    fill(ecmColor);
    ellipse(x, y, dotSize, dotSize);
  }
}

function createFlowField(seed, type) {
  noiseSeed(seed);
  let field = new Array(ceil(width / FLOW_CELL_SIZE));
  for (let i = 0; i < field.length; i++) {
    field[i] = new Array(ceil(height / FLOW_CELL_SIZE));
    for (let j = 0; j < field[i].length; j++) {
      let angle =
        noise(i * NOISE_SCALE, j * NOISE_SCALE) * TWO_PI * NOISE_STRENGTH;
      field[i][j] = p5.Vector.fromAngle(angle);
    }
  }
  return field;
}

class Cell {
  constructor(
    type,
    borderColorIndex,
    colonyTightness,
    fillColor,
    nucleusColor,
    sizeMultiplier
  ) {
    this.type = parseInt(type);
    this.colonyTightness = colonyTightness;
    this.position = this.getFlowPosition();
    this.size = this.getSize();
    this.size = this.size * sizeMultiplier;
    this.borderColor = color(...COLORS[borderColorIndex], 255);
    this.color = color(...fillColor, 200);
    this.nucleusColor = color(...nucleusColor, 255);
    this.angle =
      this.type === 3 || this.type === 4 || this.type === 5 || this.type === 6
        ? 0
        : random(TWO_PI);
    this.rayCount = this.type === 5 ? floor(random(8, 16)) : 0;
    this.dendrites = this.type === 6 ? this.generateDendrites() : [];
    console.log(`Constructed cell: Type ${this.type}`);
  }

  getSize() {
    switch (this.type) {
      case 1:
        return { width: random(4, 6), height: random(5, 7) };
      case 2:
        return { width: random(5, 7), height: random(4, 6) };
      case 3:
        return random(2, 12);
      case 4:
        return random(4, 8);
      case 5:
        return random(6, 10); // Slightly larger for sun-like cells
      case 6:
        return random(8, 12); // Slightly larger for neuron-like cells
      default:
        return random(4, 8);
    }
  }

  generateDendrites() {
    let dendrites = [];
    let dendriteCount = floor(random(3, 7));
    for (let i = 0; i < dendriteCount; i++) {
      let angle = random(TWO_PI);
      let length = random(this.size * 0.5, this.size * 2);
      dendrites.push({ angle, length });
    }
    return dendrites;
  }

  display() {
    console.log(`Displaying cell: Type ${this.type}`);
    push();
    translate(this.position.x, this.position.y);
    if (
      this.type !== 3 &&
      this.type !== 4 &&
      this.type !== 5 &&
      this.type !== 6
    ) {
      rotate(this.angle);
    }

    // Cell border
    stroke(this.borderColor);
    strokeWeight(1);

    // Cell body
    fill(this.color);
    switch (this.type) {
      case 1:
      case 2:
        console.log("Drawing elliptical cell");
        ellipse(0, 0, this.size.width, this.size.height);
        break;
      case 3:
        console.log("Drawing square cell");
        rectMode(CENTER);
        rect(0, 0, this.size * 0.75, this.size * 0.75);
        break;
      case 4:
        console.log("Drawing diamond cell");
        beginShape();
        vertex(0, -this.size / 2);
        vertex(this.size / 2, 0);
        vertex(0, this.size / 2);
        vertex(-this.size / 2, 0);
        endShape(CLOSE);
        break;
      case 5:
        console.log("Drawing sun-like cell");
        this.drawSunlikeCell();
        break;
      case 6:
        console.log("Drawing neuron-like cell");
        this.drawNeuronLikeCell();
        break;
    }

    // Cell nucleus
    fill(this.nucleusColor);
    noStroke();
    if (this.type === 1 || this.type === 2) {
      ellipse(0, 0, this.size.width * 0.5, this.size.height * 0.5);
    } else if (this.type === 3) {
      rect(0, 0, this.size * 0.25, this.size * 0.25);
    } else if (this.type === 4) {
      let nucleusSize = this.size * 0.5;
      beginShape();
      vertex(0, -nucleusSize / 2);
      vertex(nucleusSize / 2, 0);
      vertex(0, nucleusSize / 2);
      vertex(-nucleusSize / 2, 0);
      endShape(CLOSE);
    } else if (this.type === 5) {
      ellipse(0, 0, this.size * 0.6, this.size * 0.6);
    } else if (this.type === 6) {
      ellipse(0, 0, this.size * 0.4, this.size * 0.4);
    }

    pop();
  }

  drawSunlikeCell() {
    // Draw the circular body
    ellipse(0, 0, this.size, this.size);

    // Draw the rays
    stroke(this.borderColor);
    strokeWeight(1); // Changed from 2 to 1 for thinner rays
    let rayLength = this.size * 0.3; // Length of rays
    for (let i = 0; i < this.rayCount; i++) {
      let angle = (TWO_PI / this.rayCount) * i;
      let x1 = (cos(angle) * this.size) / 2;
      let y1 = (sin(angle) * this.size) / 2;
      let x2 = cos(angle) * (this.size / 2 + rayLength);
      let y2 = sin(angle) * (this.size / 2 + rayLength);
      line(x1, y1, x2, y2);
    }
  }

  drawNeuronLikeCell() {
    // Draw cell body
    ellipse(0, 0, this.size, this.size);

    // Draw dendrites
    stroke(this.borderColor);
    strokeWeight(0.5);
    for (let dendrite of this.dendrites) {
      let endX = cos(dendrite.angle) * dendrite.length;
      let endY = sin(dendrite.angle) * dendrite.length;
      line(0, 0, endX, endY);
      // Add small branches at the end of each dendrite
      for (let i = 0; i < 3; i++) {
        let branchAngle = dendrite.angle + random(-PI / 4, PI / 4);
        let branchLength = random(5, 15);
        let branchEndX = endX + cos(branchAngle) * branchLength;
        let branchEndY = endY + sin(branchAngle) * branchLength;
        line(endX, endY, branchEndX, branchEndY);
      }
    }
  }

  getFlowPosition() {
    let x = random(width);
    let y = random(height);
    let steps = floor(random(10, 30));

    if (this.type === 1 || this.type === 6) {
      // For types 1 and 6, create larger clusters
      let clusterCenterX = random(width);
      let clusterCenterY = random(height);
      let clusterRadius = random(50, 150); // Adjust this range for desired cluster size
      let angle = random(TWO_PI);
      x = clusterCenterX + cos(angle) * random(clusterRadius);
      y = clusterCenterY + sin(angle) * random(clusterRadius);

      // For type 6 (neurons), add some additional randomness to create more spread-out clusters
      if (this.type === 6) {
        x += random(-30, 30);
        y += random(-30, 30);
      }
    } else {
      // For other types, use the flow field
      for (let i = 0; i < steps; i++) {
        let force = this.getFlowForce(x, y);
        x += force.x * this.colonyTightness;
        y += force.y * this.colonyTightness;

        // Wrap around canvas edges
        x = (x + width) % width;
        y = (y + height) % height;
      }
    }

    return createVector(x, y);
  }

  getFlowForce(x, y) {
    if (!flowFields[this.type]) {
      console.error(`Flow field for type ${this.type} is undefined`);
      return createVector(0, 0);
    }
    let col = floor(x / FLOW_CELL_SIZE);
    let row = floor(y / FLOW_CELL_SIZE);
    col = constrain(col, 0, flowFields[this.type].length - 1);
    row = constrain(row, 0, flowFields[this.type][0].length - 1);
    return flowFields[this.type][col][row].copy();
  }
}
