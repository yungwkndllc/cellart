let particles = [];
let flowField;
let cols, rows;
let resolution = 20;
let noiseScale = 0.1;
let noiseStrength = 0.5;
let colorPalettes = [
  {
    name: "Warm Cellular",
    colors: [
      [255, 150, 150],
      [255, 200, 150],
      [255, 220, 200],
    ],
  },
  {
    name: "Cool Cellular",
    colors: [
      [150, 200, 255],
      [180, 220, 255],
      [200, 240, 255],
    ],
  },
  {
    name: "Earthy Tones",
    colors: [
      [200, 180, 140],
      [180, 160, 120],
      [160, 140, 100],
    ],
  },
  {
    name: "Vibrant Cellular",
    colors: [
      [255, 100, 100],
      [100, 255, 100],
      [100, 100, 255],
    ],
  },
  {
    name: "Pastel Cellular",
    colors: [
      [255, 200, 200],
      [200, 255, 200],
      [200, 200, 255],
    ],
  },
];
let selectedPalette;
let ecmColor;
let zoff = 0;
let selectedECMFunction;

function setup() {
  createCanvas(800, 600);
  cols = floor(width / resolution);
  rows = floor(height / resolution);

  // Select a single palette for all cells
  selectedPalette = random(colorPalettes);
  console.log("Selected palette:", selectedPalette.name);

  // Set ECM color based on the selected palette
  ecmColor = color(
    selectedPalette.colors[0][0] * 0.8,
    selectedPalette.colors[0][1] * 0.8,
    selectedPalette.colors[0][2] * 0.8,
    50
  );

  flowField = new Array(cols * rows);

  // Initialize flow field
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let index = x + y * cols;
      let angle = noise(x * noiseScale, y * noiseScale) * TWO_PI * 4;
      flowField[index] = p5.Vector.fromAngle(angle);
    }
  }

  // Create particles
  for (let i = 0; i < 250; i++) {
    particles.push(new Cell());
  }

  background(240, 240, 250);
  drawECM();

  // Randomly select an ECM function
  selectedECMFunction = random([drawECM1, drawECM2, drawECM3]);

  // Log all the selected functions
  console.log(selectedECMFunction);
  console.log(selectedPalette.name);

  for (let i = 0; i < 100; i++) {
    // Semi-transparent background for trail effect
    background(240, 240, 250, 10);

    // Only draw ECM on the first frame using the selected function
    selectedECMFunction();

    // Update and display particles
    for (let cell of particles) {
      cell.follow(flowField);
      cell.update();
      cell.display();
    }

    zoff += 0.01;
  }
}

function draw() {
  if (frameCount > 100) {
    noLoop();
  }
}

function updateFlowField() {
  let yoff = 0;
  for (let y = 0; y < rows; y++) {
    let xoff = 0;
    for (let x = 0; x < cols; x++) {
      let index = x + y * cols;
      let angle = noise(xoff, yoff, zoff) * TWO_PI * 4;
      flowField[index] = p5.Vector.fromAngle(angle);
      xoff += noiseScale;
    }
    yoff += noiseScale;
  }
}

function drawECM(alpha = 255) {
  noFill();
  stroke(ecmColor);
  strokeWeight(0.3);

  let numElements = (width * height) / 400; // Adjust this value to control density

  for (let i = 0; i < numElements; i++) {
    let x = random(width);
    let y = random(height);
    let n = noise(x * 0.005, y * 0.005, frameCount * 0.01);

    if (n > 0.4) {
      push();
      translate(x, y);
      rotate(n * TWO_PI);
      beginShape();
      let sides = floor(random(3, 7));
      for (let k = 0; k < sides; k++) {
        let radius = random(5, 15) * n;
        let vx = cos((k * TWO_PI) / sides) * radius;
        let vy = sin((k * TWO_PI) / sides) * radius;
        curveVertex(vx, vy);
      }
      endShape(CLOSE);
      pop();
    }
  }
}

function drawECM1() {
  // Original ECM function
  noFill();
  stroke(ecmColor);
  strokeWeight(0.3);

  let numElements = (width * height) / 400;

  for (let i = 0; i < numElements; i++) {
    let x = random(width);
    let y = random(height);
    let n = noise(x * 0.005, y * 0.005, frameCount * 0.01);

    if (n > 0.4) {
      push();
      translate(x, y);
      rotate(n * TWO_PI);
      beginShape();
      let sides = floor(random(3, 7));
      for (let k = 0; k < sides; k++) {
        let radius = random(5, 15) * n;
        let vx = cos((k * TWO_PI) / sides) * radius;
        let vy = sin((k * TWO_PI) / sides) * radius;
        curveVertex(vx, vy);
      }
      endShape(CLOSE);
      pop();
    }
  }
}

function drawECM2() {
  // New ECM function with circular patterns
  noFill();
  stroke(ecmColor);
  strokeWeight(0.3);

  let numCircles = 50;
  for (let i = 0; i < numCircles; i++) {
    let x = random(width);
    let y = random(height);
    let radius = random(10, 50);
    let segments = floor(random(5, 15));

    beginShape();
    for (let j = 0; j <= segments; j++) {
      let angle = map(j, 0, segments, 0, TWO_PI);
      let r = radius + random(-5, 5);
      let px = x + cos(angle) * r;
      let py = y + sin(angle) * r;
      curveVertex(px, py);
    }
    endShape(CLOSE);
  }
}

function drawECM3() {
  // New ECM function with line-based patterns
  stroke(ecmColor);
  strokeWeight(0.3);

  let numLines = 200;
  for (let i = 0; i < numLines; i++) {
    let x1 = random(width);
    let y1 = random(height);
    let angle = random(TWO_PI);
    let length = random(20, 100);
    let x2 = x1 + cos(angle) * length;
    let y2 = y1 + sin(angle) * length;

    let midX = (x1 + x2) / 2;
    let midY = (y1 + y2) / 2;
    let ctrlX = midX + random(-20, 20);
    let ctrlY = midY + random(-20, 20);

    noFill();
    beginShape();
    vertex(x1, y1);
    quadraticVertex(ctrlX, ctrlY, x2, y2);
    endShape();
  }
}

class Cell {
  constructor() {
    this.pos = createVector(random(width), random(height));
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.maxSpeed = random(0.5, 2);
    this.size = random(8, 20);
    this.color = this.getRandomColorFromPalette();
    this.shape = random(["circle", "oval", "irregular"]);
    this.lifespan = random(100, 200);
    this.age = 0;
  }

  getRandomColorFromPalette() {
    let baseColor = random(selectedPalette.colors);
    return color(
      baseColor[0] + random(-20, 20),
      baseColor[1] + random(-20, 20),
      baseColor[2] + random(-20, 20),
      180
    );
  }

  follow(flowField) {
    let x = floor(this.pos.x / resolution);
    let y = floor(this.pos.y / resolution);
    let index = constrain(x + y * cols, 0, flowField.length - 1);
    let force = flowField[index].copy();
    force.mult(noiseStrength);
    this.applyForce(force);
  }

  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);

    this.edges();
    this.age++;
    if (this.age > this.lifespan) {
      this.respawn();
    }
  }

  respawn() {
    this.pos = createVector(random(width), random(height));
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.color = this.getRandomColorFromPalette();
    this.age = 0;
    this.lifespan = random(100, 200);
  }

  edges() {
    if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.x < 0) this.pos.x = width;
    if (this.pos.y > height) this.pos.y = 0;
    if (this.pos.y < 0) this.pos.y = height;
  }

  display() {
    let alpha = map(this.age, 0, this.lifespan, 180, 0);
    let cellColor = color(
      red(this.color),
      green(this.color),
      blue(this.color),
      alpha
    );
    noStroke();
    fill(cellColor);
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());

    if (this.shape === "circle") {
      ellipse(0, 0, this.size, this.size);
    } else if (this.shape === "oval") {
      ellipse(0, 0, this.size * 1.5, this.size * 0.8);
    } else {
      beginShape();
      for (let i = 0; i < 5; i++) {
        let angle = map(i, 0, 5, 0, TWO_PI);
        let r =
          this.size *
          0.5 *
          (1 + 0.3 * noise(this.pos.x * 0.1, this.pos.y * 0.1, i * 0.5));
        let x = r * cos(angle);
        let y = r * sin(angle);
        curveVertex(x, y);
      }
      endShape(CLOSE);
    }
    pop();
  }
}

function mousePressed() {
  selectedPalette = random(colorPalettes);
  console.log("New selected palette:", selectedPalette.name);
  ecmColor = color(
    selectedPalette.colors[0][0] * 0.8,
    selectedPalette.colors[0][1] * 0.8,
    selectedPalette.colors[0][2] * 0.8,
    50
  );
  for (let cell of particles) {
    cell.color = cell.getRandomColorFromPalette();
  }
}
