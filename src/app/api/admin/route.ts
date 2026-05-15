import { NextResponse } from "next/server";
import { adminAction } from "@/lib/game";
import { zh } from "@/lib/zh";

export async function POST(req: Request) {
  const adminKey = req.headers.get("x-admin-key");
  const body = await req.json();
  const { action, timerSec } = body as { action?: string; timerSec?: number };

  if (!action) {
    return NextResponse.json({ error: "missing action" }, { status: 400 });
  }

  const result = await adminAction(adminKey, action, { timerSec });
  if ("error" in result) {
    const status = result.error === zh.apiForbidden ? 403 : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
