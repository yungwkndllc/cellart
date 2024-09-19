let particles = [];
let flowField;
let cols, rows;
let resolution = 20;
let noiseScale = 0.1;
let noiseStrength = 0.5;
let colorPalettes = [
  // Warm cellular
  [
    [255, 150, 150],
    [255, 200, 150],
    [255, 220, 200],
  ],
  // Cool cellular
  [
    [150, 200, 255],
    [180, 220, 255],
    [200, 240, 255],
  ],
  // Earthy tones
  [
    [200, 180, 140],
    [180, 160, 120],
    [160, 140, 100],
  ],
  // Vibrant cellular
  [
    [255, 100, 100],
    [100, 255, 100],
    [100, 100, 255],
  ],
  // Pastel cellular
  [
    [255, 200, 200],
    [200, 255, 200],
    [200, 200, 255],
  ],
];
let selectedPalette;
let ecmColor;
let zoff = 0;

function setup() {
  createCanvas(800, 600);
  cols = floor(width / resolution);
  rows = floor(height / resolution);

  // Select a single palette for all cells
  selectedPalette = random(colorPalettes);

  // Set ECM color based on the selected palette
  ecmColor = color(
    selectedPalette[0][0] * 0.8,
    selectedPalette[0][1] * 0.8,
    selectedPalette[0][2] * 0.8,
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
}

function draw() {
  // Semi-transparent background for trail effect
  background(240, 240, 250, 10);

  // Redraw ECM with slight transparency
  drawECM(200);

  // Update and display particles
  for (let cell of particles) {
    cell.follow(flowField);
    cell.update();
    cell.display();
  }

  zoff += 0.01;
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

  for (let i = 0; i < width; i += 15) {
    for (let j = 0; j < height; j += 15) {
      let n = noise(i * 0.005, j * 0.005);
      if (n > 0.4) {
        push();
        translate(i, j);
        rotate(n * TWO_PI);
        beginShape();
        for (let k = 0; k < 5; k++) {
          let x = cos((k * TWO_PI) / 5) * 10 * n;
          let y = sin((k * TWO_PI) / 5) * 10 * n;
          curveVertex(x, y);
        }
        endShape(CLOSE);
        pop();
      }
    }
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
    let baseColor = random(selectedPalette);
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
  ecmColor = color(
    selectedPalette[0][0] * 0.8,
    selectedPalette[0][1] * 0.8,
    selectedPalette[0][2] * 0.8,
    50
  );
  for (let cell of particles) {
    cell.color = cell.getRandomColorFromPalette();
  }
}
