// Constants and parameters
const size = 600; // Increased size
const da = 1.5,
  db = 1.5;
const f = 0.055,
  k = 0.062;
const dt = 0.01;

const kernel = [
  [0.05, 0.2, 0.05],
  [0.2, -1.0, 0.2],
  [0.05, 0.2, 0.05],
];

let a, b;

// Color palettes
const palettes = [
  [
    [255, 107, 107],
    [255, 230, 109],
    [33, 150, 243],
  ], // Warm sunset
  [
    [75, 0, 130],
    [0, 255, 255],
    [255, 192, 203],
  ], // Cool neon
  [
    [34, 139, 34],
    [255, 215, 0],
    [0, 191, 255],
  ], // Nature inspired
  [
    [138, 43, 226],
    [255, 105, 180],
    [255, 255, 0],
  ], // Vibrant purple
  [
    [255, 87, 51],
    [255, 189, 41],
    [18, 203, 196],
  ], // Tropical sunset
  [
    [46, 134, 193],
    [241, 196, 15],
    [231, 76, 60],
  ], // Primary bold
  [
    [155, 89, 182],
    [52, 152, 219],
    [26, 188, 156],
  ], // Cool jewel tones
  [
    [243, 156, 18],
    [211, 84, 0],
    [192, 57, 43],
  ], // Autumn leaves
  [
    [106, 176, 76],
    [199, 244, 100],
    [39, 174, 96],
  ], // Fresh greens
];
let currentPalette;

// Helper functions
function createArray2D(rows, cols, defaultValue = 0) {
  return Array(rows)
    .fill()
    .map(() => Array(cols).fill(defaultValue));
}

function createOval(center, axes, gridSize) {
  const mask = createArray2D(gridSize[0], gridSize[1]);
  for (let y = 0; y < gridSize[0]; y++) {
    for (let x = 0; x < gridSize[1]; x++) {
      if (
        (x - center[1]) ** 2 / axes[1] ** 2 +
          (y - center[0]) ** 2 / axes[0] ** 2 <=
        1
      ) {
        mask[y][x] = 1;
      }
    }
  }
  return mask;
}

function convolve(matrix, kernel) {
  const result = createArray2D(matrix.length, matrix[0].length);
  const kSize = kernel.length;
  const kCenter = Math.floor(kSize / 2);

  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[0].length; x++) {
      let sum = 0;
      for (let ky = 0; ky < kSize; ky++) {
        for (let kx = 0; kx < kSize; kx++) {
          const my = y + ky - kCenter;
          const mx = x + kx - kCenter;
          if (
            my >= 0 &&
            my < matrix.length &&
            mx >= 0 &&
            mx < matrix[0].length
          ) {
            sum += matrix[my][mx] * kernel[ky][kx];
          }
        }
      }
      result[y][x] = sum;
    }
  }
  return result;
}

function reactionDiffusion(a, b, da, db, f, k, dt, kernel) {
  const new_a = createArray2D(size, size);
  const new_b = createArray2D(size, size);

  // Apply convolution and reaction-diffusion
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let sumA = 0;
      let sumB = 0;

      // Apply convolution
      for (let j = -1; j <= 1; j++) {
        for (let i = -1; i <= 1; i++) {
          const ny = (y + j + size) % size;
          const nx = (x + i + size) % size;
          sumA += a[ny][nx] * kernel[j + 1][i + 1];
          sumB += b[ny][nx] * kernel[j + 1][i + 1];
        }
      }

      // Reaction-diffusion equations
      const reaction = a[y][x] * b[y][x] * b[y][x];
      new_a[y][x] = a[y][x] + (da * sumA - reaction + f * (1 - a[y][x])) * dt;
      new_b[y][x] = b[y][x] + (db * sumB + reaction - (f + k) * b[y][x]) * dt;

      // Clamp values
      new_a[y][x] = constrain(new_a[y][x], 0, 1);
      new_b[y][x] = constrain(new_b[y][x], 0, 1);
    }
  }

  return [new_a, new_b];
}

// Add this function to create a smooth transition between colors
function lerp(start, end, amt) {
  return start + (end - start) * amt;
}

// Add this new function
function inverse_fft(fft_x, fft_y, hamming = false, repeat = false) {
  if (!repeat) {
    fft_x = fft_x.concat(
      [0],
      fft_x
        .slice(1)
        .reverse()
        .map((c) => c.conjugate())
    );
    fft_y = fft_y.concat(
      [0],
      fft_y
        .slice(1)
        .reverse()
        .map((c) => c.conjugate())
    );
  } else {
    const n = fft_x.length;
    const zeros = new Array(10 * 2 * n - 2 * n + 1).fill({ re: 0, im: 0 });
    fft_x = fft_x.concat(
      zeros,
      fft_x
        .slice(1)
        .reverse()
        .map((c) => c.conjugate())
    );
    fft_y = fft_y.concat(
      zeros,
      fft_y
        .slice(1)
        .reverse()
        .map((c) => c.conjugate())
    );
  }

  let ix = ifft(fft_x);
  let iy = ifft(fft_y);

  if (hamming) {
    const hamming = (i, N) =>
      0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (N - 1));
    ix = ix.map((v, i) => v / hamming(i, ix.length));
    iy = iy.map((v, i) => v / hamming(i, iy.length));
  }

  if (repeat) {
    const n = fft_x.length / 2;
    ix = ix.slice(4 * n, 4 * n + 2 * n);
    iy = iy.slice(4 * n, 4 * n + 2 * n);
  }

  return [ix, iy];
}

// New variables for flow field and particles
const particleCount = 50; // Increased from 10
const particleLifespan = 50;
let particles = [];
let flowField;

// Add this at the top of your file with other global variables
let clusterPalettes = [];

let globalPalette = palettes[0];

// Modify the Particle class
class Particle {
  constructor() {
    this.position = createVector(random(width), random(height));
    this.velocity = createVector(0, 0);
    this.acceleration = createVector(0, 0);
    this.lifespan = particleLifespan;
    this.previousPosition = this.position.copy();
    this.clusterPalette = null;
  }

  update() {
    if (this.lifespan > 0) {
      this.previousPosition = this.position.copy();
      let x = floor(this.position.x);
      let y = floor(this.position.y);

      // Add boundary checks
      if (x >= 0 && x < size && y >= 0 && y < size) {
        let force = flowField[y][x];
        this.acceleration.add(force);
        this.velocity.add(this.acceleration);
        this.velocity.limit(2);
        this.position.add(this.velocity);
        this.acceleration.mult(0);
      }

      // Wrap around if particle goes off-screen
      this.position.x = (this.position.x + size) % size;
      this.position.y = (this.position.y + size) % size;

      this.lifespan--;
    } else {
      this.createCluster();
      this.reset();
    }
  }

  createCluster() {
    const clusterRadius = 30; // Increased from 10
    const numOvals = 20; // Increased from 10

    // Assign a new random palette for this cluster
    this.clusterPalette = globalPalette;

    for (let j = 0; j < numOvals; j++) {
      const centerOffset = [
        Math.floor(random() * 2 * clusterRadius) - clusterRadius,
        Math.floor(random() * 2 * clusterRadius) - clusterRadius,
      ];
      const ovalCenter = [
        constrain(this.position.x + centerOffset[0], 0, size - 1),
        constrain(this.position.y + centerOffset[1], 0, size - 1),
      ];
      const axes = [2 + Math.floor(random() * 2), 2 + Math.floor(random() * 2)]; // Increased oval size
      const ovalMask = createOval(ovalCenter, axes, [size, size]);

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (ovalMask[y][x] > 0) {
            b[y][x] += ovalMask[y][x] * 0.5;
            // Store the palette index for this pixel
            clusterPalettes[y * size + x] = this.clusterPalette;
          }
        }
      }
    }
  }

  reset() {
    this.position = createVector(random(width), random(height));
    this.velocity = createVector(0, 0);
    this.lifespan = particleLifespan;
    this.previousPosition = this.position.copy();
  }

  draw() {
    stroke(255, 50); // White color with more transparency
    strokeWeight(5);
    line(
      this.previousPosition.x,
      this.previousPosition.y,
      this.position.x,
      this.position.y
    );
  }
}

// Modify the setup function
function setup() {
  createCanvas(size, size);
  pixelDensity(1);

  currentPalette = random(palettes);

  a = createArray2D(size, size, 1).map((row) =>
    row.map(() => 1 + 0.01 * random())
  );
  b = createArray2D(size, size).map((row) => row.map(() => 0.01 * random()));

  // Initialize flow field
  flowField = createFlowField();

  // Ensure flowField is properly initialized
  if (!flowField || flowField.length !== size || flowField[0].length !== size) {
    console.error("Flow field not properly initialized");
    noLoop();
    return;
  }

  // Create more particles
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  // Initialize clusterPalettes
  clusterPalettes = new Array(size * size).fill(null);

  globalPalette = random(palettes);
}

// New function to create flow field
function createFlowField() {
  let field = [];
  noiseSeed(random(10000));
  for (let y = 0; y < size; y++) {
    let row = [];
    for (let x = 0; x < size; x++) {
      let angle = noise(x * 0.01, y * 0.01) * TWO_PI * 2;
      row.push(p5.Vector.fromAngle(angle).setMag(0.1));
    }
    field.push(row);
  }
  return field;
}

// Modify the draw function
function draw() {
  // Run one step of the simulation
  [a, b] = reactionDiffusion(a, b, da, db, f, k, dt, kernel);

  // Apply threshold
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      b[y][x] *= b[y][x] > 0.2 ? 1 : 0;
    }
  }

  // Draw the result with color
  loadPixels();
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4;
      const value = b[y][x];

      // Use the cluster's palette if available, otherwise use black background
      const palette = clusterPalettes[y * size + x] || [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];

      const color1 = palette[0];
      const color2 = palette[1];
      const color3 = palette[2];

      let r, g, bl;
      if (value < 0.5) {
        const t = value * 2;
        r = lerp(color1[0], color2[0], t);
        g = lerp(color1[1], color2[1], t);
        bl = lerp(color1[2], color2[2], t);
      } else {
        const t = (value - 0.5) * 2;
        r = lerp(color2[0], color3[0], t);
        g = lerp(color2[1], color3[1], t);
        bl = lerp(color2[2], color3[2], t);
      }

      pixels[index] = r;
      pixels[index + 1] = g;
      pixels[index + 2] = bl;
      pixels[index + 3] = 255;
    }
  }
  updatePixels();

  // Update and draw particles
  for (let particle of particles) {
    particle.update();
    particle.draw();
  }

  if (frameCount % 50 === 0) {
    console.log("Frame count: ", frameCount);
  }

  if (frameCount % 100 === 0) {
    globalPalette = random(palettes);
    flowField = createFlowField();
  }

  //   if (frameCount === 300) {
  //     flowField = createFlowField();
  //   }

  // Stop the simulation after 1000 frames
  if (frameCount >= 600) {
    noLoop();
  }
}
