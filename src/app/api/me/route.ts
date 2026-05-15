import { NextResponse } from "next/server";
import { getPlayerByToken } from "@/lib/game";

export async function GET(req: Request) {
  const token =
    req.headers.get("x-token") ??
    new URL(req.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "缺少 token" }, { status: 401 });
  }

  const p = await getPlayerByToken(token);
  if (!p) {
    return NextResponse.json({ error: "未登录" }, { status: 404 });
  }

  return NextResponse.json({
    seatId: p.seatId,
    name: p.name,
    employeeId: p.employeeId,
    correctCount: p.correctCount,
    status: p.status,
    submittedThisRound: p.submittedThisRound,
  });
}
