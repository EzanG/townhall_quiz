import { NextResponse } from "next/server";
import {
  getQuestionsList,
  parseQuestionsJson,
  writeQuestionsToDisk,
} from "@/lib/questions";
import { verifyAdminKey } from "@/lib/game";
import { zh } from "@/lib/zh";

export async function GET(req: Request) {
  const adminKey = req.headers.get("x-admin-key");
  if (!verifyAdminKey(adminKey)) {
    return NextResponse.json({ error: zh.apiForbidden }, { status: 403 });
  }
  return NextResponse.json(getQuestionsList());
}

export async function PUT(req: Request) {
  const adminKey = req.headers.get("x-admin-key");
  if (!verifyAdminKey(adminKey)) {
    return NextResponse.json({ error: zh.apiForbidden }, { status: 403 });
  }
  const body = await req.json();
  let raw: string;
  if (typeof body === "string") raw = body;
  else if (typeof body?.raw === "string") raw = body.raw;
  else if (Array.isArray(body)) raw = JSON.stringify(body);
  else if (Array.isArray(body?.questions))
    raw = JSON.stringify(body.questions);
  else raw = JSON.stringify(body ?? []);
  const parsed = parseQuestionsJson(raw);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: zh.settingsQuestionsInvalid, code: parsed.error },
      { status: 400 }
    );
  }
  writeQuestionsToDisk(parsed.data);
  return NextResponse.json({ ok: true, count: parsed.data.length });
}
