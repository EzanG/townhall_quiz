import { NextResponse } from "next/server";
import { submitAnswer } from "@/lib/game";

export async function POST(req: Request) {
  const body = await req.json();
  const { token, choice } = body as { token?: string; choice?: string };

  if (!token || !choice) {
    return NextResponse.json({ error: "缺少 token 或选项" }, { status: 400 });
  }

  const result = await submitAnswer(token, choice);
  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
