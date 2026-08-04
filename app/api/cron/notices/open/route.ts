import { NextResponse } from "next/server";
import { openTodaysNotices } from "@/lib/notices";

// Vercel Cron이 KST 11:00(UTC 02:00)에 호출 — vercel.json의 crons 참고.
// Vercel이 자동으로 붙이는 Authorization: Bearer $CRON_SECRET 헤더로 검증한다.
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const opened = await openTodaysNotices();
  return NextResponse.json({ opened: opened.length });
}
