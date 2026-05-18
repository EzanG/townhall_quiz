import { readFileSync, statSync, writeFileSync } from "fs";
import { join } from "path";
import type { SeatDef, SeatsLayout } from "@/lib/seats";

const LAYOUT_FILE = join(process.cwd(), "src", "data", "seats.layout.json");

const SEAT_R = 14;
const SEAT_GAP_X = 36;
const SEAT_GAP_Y = 36;
const AISLE_X = 48;
const AISLE_Y = 40;
const MARGIN_TOP = 80;
const MARGIN_LEFT = 40;
const LABEL_PAD_LEFT = 32;
/** 列号区域高度（须大于座位半径，避免与末排圆重叠） */
const LABEL_PAD_BOTTOM = 40;

let cache: SeatsLayout | null = null;
let cachedMtime = 0;

/** 上半场排数（偶数行上下各半；奇数行上少下一多 1 排） */
export function topRowCount(rows: number): number {
  return Math.floor(rows / 2);
}

function aisleRowSplit(rows: number): number {
  return topRowCount(rows);
}

function blockFor(row: number, col: number, rows: number, cols: number): string {
  const front = row <= topRowCount(rows);
  const left = col <= Math.floor(cols / 2);
  if (front && left) return "front_left";
  if (front && !left) return "front_right";
  if (!front && left) return "back_left";
  return "back_right";
}

export function generateSeatsLayout(rows: number, cols: number): SeatsLayout {
  const seats: SeatDef[] = [];
  const colSplit = Math.floor(cols / 2);
  const rowSplit = aisleRowSplit(rows);

  for (let row = 1; row <= rows; row++) {
    for (let col = 1; col <= cols; col++) {
      const aisleColOffset = col > colSplit ? AISLE_X : 0;
      const aisleRowOffset = row > rowSplit ? AISLE_Y : 0;
      const x = MARGIN_LEFT + (col - 1) * SEAT_GAP_X + aisleColOffset;
      const y = MARGIN_TOP + (row - 1) * SEAT_GAP_Y + aisleRowOffset;
      seats.push({
        id: `${row}-${col}`,
        row,
        col,
        block: blockFor(row, col, rows, cols),
        x,
        y,
        r: SEAT_R,
      });
    }
  }

  const maxX =
    MARGIN_LEFT + (cols - 1) * SEAT_GAP_X + AISLE_X + SEAT_R * 2;
  const lastSeatCenterY =
    MARGIN_TOP + (rows - 1) * SEAT_GAP_Y + AISLE_Y;
  const maxSeatBottom = lastSeatCenterY + SEAT_R;
  const viewBoxH = maxSeatBottom + LABEL_PAD_BOTTOM;

  return {
    rows,
    cols,
    viewBox: `0 0 ${maxX + LABEL_PAD_LEFT} ${viewBoxH}`,
    stageLabel: "舞台",
    labelPadLeft: LABEL_PAD_LEFT,
    labelPadBottom: LABEL_PAD_BOTTOM,
    seats,
  };
}

function normalizeLayout(raw: SeatsLayout): SeatsLayout {
  let rows = raw.rows;
  let cols = raw.cols;
  if (!rows || !cols) {
    rows = 0;
    cols = 0;
    for (const s of raw.seats) {
      rows = Math.max(rows, s.row);
      cols = Math.max(cols, s.col);
    }
  }
  return {
    ...raw,
    rows,
    cols,
    labelPadLeft: raw.labelPadLeft ?? LABEL_PAD_LEFT,
    labelPadBottom: raw.labelPadBottom ?? LABEL_PAD_BOTTOM,
  };
}

function loadFromDisk(): SeatsLayout {
  const m = statSync(LAYOUT_FILE).mtimeMs;
  if (cache && m === cachedMtime) return cache;
  const raw = JSON.parse(readFileSync(LAYOUT_FILE, "utf8")) as SeatsLayout;
  cache = normalizeLayout(raw);
  cachedMtime = m;
  return cache;
}

export function getSeatsLayout(): SeatsLayout {
  return loadFromDisk();
}

export function writeSeatsLayoutToDisk(layout: SeatsLayout): void {
  writeFileSync(
    LAYOUT_FILE,
    JSON.stringify(layout, null, 2) + "\n",
    "utf8"
  );
  cache = layout;
  cachedMtime = statSync(LAYOUT_FILE).mtimeMs;
}

export function parseSeatDimensions(
  rows: unknown,
  cols: unknown
): { ok: true; rows: number; cols: number } | { ok: false; error: string } {
  const r = typeof rows === "number" ? rows : parseInt(String(rows ?? ""), 10);
  const c = typeof cols === "number" ? cols : parseInt(String(cols ?? ""), 10);
  if (!Number.isInteger(r) || r < 1 || r > 40) {
    return { ok: false, error: "rows" };
  }
  if (!Number.isInteger(c) || c < 1 || c > 40) {
    return { ok: false, error: "cols" };
  }
  return { ok: true, rows: r, cols: c };
}
