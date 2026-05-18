import { NextResponse } from "next/server";
import { getAdminAuthStatus, verifyAdminKey } from "@/lib/admin-auth";
import { adminAction } from "@/lib/game";
import { zh } from "@/lib/zh";

/** 场控校验状态（浏览器用于提示是否需在 /settings 填写密钥） */
export async function GET() {
  return NextResponse.json(getAdminAuthStatus());
}

export async function POST(req: Request) {
  const adminKey = req.headers.get("x-admin-key");
  const body = await req.json();
  const { action, timerSec, enabled } = body as {
    action?: string;
    timerSec?: number;
    enabled?: boolean;
  };

  if (!action) {
    return NextResponse.json({ error: "missing action" }, { status: 400 });
  }

  const result = await adminAction(adminKey, action, { timerSec, enabled });
  if ("error" in result) {
    const status = result.error === zh.apiForbidden ? 403 : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}

/** HEAD：仅探测当前 x-admin-key 是否有效（不修改场次） */
export async function HEAD(req: Request) {
  const adminKey = req.headers.get("x-admin-key");
  if (!verifyAdminKey(adminKey)) {
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, { status: 204 });
}
