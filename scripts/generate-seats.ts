import {
  generateSeatsLayout,
  writeSeatsLayoutToDisk,
} from "../src/lib/seats-layout";

const rows = parseInt(process.argv[2] ?? "14", 10);
const cols = parseInt(process.argv[3] ?? "20", 10);

const layout = generateSeatsLayout(rows, cols);
writeSeatsLayoutToDisk(layout);
console.log(
  `Wrote ${layout.seats.length} seats (${rows}×${cols}) to src/data/seats.layout.json`
);
