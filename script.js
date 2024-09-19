const fs = require("fs");
const readline = require("readline");

const fileStream = fs.createReadStream("fftcoefs_128.txt");

const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity,
});

let lineCount = 0;

console.log("First 10 lines of fftcoefs_128.txt:");

rl.on("line", (line) => {
  lineCount++;
  console.log(`${lineCount}: ${line}`);

  if (lineCount >= 1) {
    rl.close();
    fileStream.close();
  }
});

rl.on("close", () => {
  console.log("Finished reading the first 10 lines.");
});
