import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROWS = 14;
const COLS = 20;
const SEAT_R = 14;
const SEAT_GAP_X = 36;
const SEAT_GAP_Y = 36;
const AISLE_X = 48;
const AISLE_Y = 40;
const MARGIN_TOP = 80;
const MARGIN_LEFT = 40;

function blockFor(row, col) {
  const front = row <= 8;
  const left = col <= 10;
  if (front && left) return "front_left";
  if (front && !left) return "front_right";
  if (!front && left) return "back_left";
  return "back_right";
}

const seats = [];
for (let row = 1; row <= ROWS; row++) {
  for (let col = 1; col <= COLS; col++) {
    const aisleColOffset = col > 10 ? AISLE_X : 0;
    const aisleRowOffset = row > 8 ? AISLE_Y : 0;
    const x = MARGIN_LEFT + (col - 1) * SEAT_GAP_X + aisleColOffset;
    const y = MARGIN_TOP + (row - 1) * SEAT_GAP_Y + aisleRowOffset;
    seats.push({
      id: `${row}-${col}`,
      row,
      col,
      block: blockFor(row, col),
      x,
      y,
      r: SEAT_R,
    });
  }
}

const maxX =
  MARGIN_LEFT + (COLS - 1) * SEAT_GAP_X + AISLE_X + SEAT_R * 2;
const maxY =
  MARGIN_TOP + (ROWS - 1) * SEAT_GAP_Y + AISLE_Y + SEAT_R * 2 + 40;

const layout = {
  viewBox: `0 0 ${maxX} ${maxY}`,
  stageLabel: "舞台",
  seats,
};

const outDir = path.join(__dirname, "..", "src", "data");
mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "seats.layout.json");
writeFileSync(outPath, JSON.stringify(layout, null, 2), "utf8");
console.log(`Wrote ${seats.length} seats to ${outPath}`);
