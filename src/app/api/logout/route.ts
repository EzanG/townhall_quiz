import { NextResponse } from "next/server";
import { isDebugReregisterEnabled } from "@/lib/debug-config";
import { logoutPlayer } from "@/lib/game";
import { zh } from "@/lib/zh";

export async function POST(req: Request) {
  if (!isDebugReregisterEnabled()) {
    return NextResponse.json({ error: zh.apiReregisterDisabled }, { status: 403 });
  }

  const body = await req.json();
  const { token } = body as { token?: string };
  if (!token) {
    return NextResponse.json({ error: zh.apiInvalidSession }, { status: 400 });
  }

  const result = await logoutPlayer(token);
  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
