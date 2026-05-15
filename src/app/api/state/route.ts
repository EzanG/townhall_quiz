import { NextResponse } from "next/server";
import { getAppState } from "@/lib/game";

export async function GET() {
  const state = await getAppState();
  return NextResponse.json(state);
}
