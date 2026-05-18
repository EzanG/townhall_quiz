import { NextResponse } from "next/server";
import { sqlite } from "@/lib/db";
import {
  generateSeatsLayout,
  getSeatsLayout,
  parseSeatDimensions,
  writeSeatsLayoutToDisk,
} from "@/lib/seats-layout";
import { verifyAdminKey } from "@/lib/admin-auth";
import { zh } from "@/lib/zh";

export async function GET() {
  const layout = getSeatsLayout();
  return NextResponse.json({
    rows: layout.rows,
    cols: layout.cols,
    viewBox: layout.viewBox,
    stageLabel: layout.stageLabel,
    labelPadLeft: layout.labelPadLeft,
    labelPadBottom: layout.labelPadBottom,
    seats: layout.seats,
  });
}

export async function PUT(req: Request) {
  const adminKey = req.headers.get("x-admin-key");
  if (!verifyAdminKey(adminKey)) {
    return NextResponse.json({ error: zh.apiForbidden }, { status: 403 });
  }

  const body = await req.json();
  const parsed = parseSeatDimensions(body?.rows, body?.cols);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: zh.settingsSeatsInvalid, code: parsed.error },
      { status: 400 }
    );
  }

  const occupied = sqlite
    .prepare("SELECT seat_id FROM player")
    .all() as { seat_id: string }[];
  for (const { seat_id } of occupied) {
    const m = /^(\d+)-(\d+)$/.exec(seat_id);
    if (!m) continue;
    const row = parseInt(m[1]!, 10);
    const col = parseInt(m[2]!, 10);
    if (row > parsed.rows || col > parsed.cols) {
      return NextResponse.json(
        { error: zh.settingsSeatsOccupied },
        { status: 400 }
      );
    }
  }

  const layout = generateSeatsLayout(parsed.rows, parsed.cols);
  writeSeatsLayoutToDisk(layout);
  return NextResponse.json({
    ok: true,
    rows: layout.rows,
    cols: layout.cols,
    seatCount: layout.seats.length,
  });
}
