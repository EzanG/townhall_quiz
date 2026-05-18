import { NextResponse } from "next/server";
import { isDebugReregisterEnabled } from "@/lib/debug-config";

/** 公开：前端可读的全场配置（调试开关等） */
export async function GET() {
  return NextResponse.json({
    debugReregister: isDebugReregisterEnabled(),
  });
}
