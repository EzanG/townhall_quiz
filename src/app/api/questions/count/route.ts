import { NextResponse } from "next/server";
import { getQuestionCount } from "@/lib/questions";

/** 公开：题库题目总数（大屏题号分母） */
export async function GET() {
  return NextResponse.json({ count: getQuestionCount() });
}
