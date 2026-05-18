import { NextResponse } from "next/server";
import { login } from "@/lib/game";
import { getSeat } from "@/lib/seats-server";
import { normalizeSeatId } from "@/lib/normalizeSeat";
import { zh } from "@/lib/zh";

export async function POST(req: Request) {
  const body = await req.json();
  const { seatId: rawSeat, name, employeeId } = body as {
    seatId?: string;
    name?: string;
    employeeId?: string;
  };

  const seatId = rawSeat ? normalizeSeatId(rawSeat) : "";

  if (!seatId || !name?.trim()) {
    return NextResponse.json({ error: zh.apiNeedNameSeat }, { status: 400 });
  }

  if (!getSeat(seatId)) {
    return NextResponse.json({ error: zh.apiInvalidSeat }, { status: 400 });
  }

  const result = await login({ seatId, name, employeeId });
  if ("error" in result) {
    return NextResponse.json(result, { status: 409 });
  }

  return NextResponse.json(result);
}
