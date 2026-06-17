import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

// 공개 엔드포인트: 가맹·창업 / 입점·제휴 문의 폼 제출을 저장한다.
export async function POST(req: Request) {
  let body: { type?: string; payload?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const type = body.type;
  const payload = body.payload ?? {};

  if (type !== "franchise" && type !== "wholesale") {
    return NextResponse.json({ error: "문의 유형이 올바르지 않습니다." }, { status: 400 });
  }

  // 필수값 최소 검증 (연락처)
  const phone = String((payload as Record<string, unknown>).phone ?? "").trim();
  if (!phone) {
    return NextResponse.json({ error: "연락처를 입력해주세요." }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("inquiries").insert({ type, payload, status: "new" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // 구글시트(Apps Script 웹앱)에도 누적 — 설정돼 있을 때만, 실패해도 접수는 성공 처리.
    const webhook = process.env.GOOGLE_SHEET_WEBHOOK_URL;
    if (webhook) {
      try {
        await fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, ...payload, submitted_at: new Date().toISOString() }),
        });
      } catch { /* 시트 기록 실패는 접수 자체를 막지 않음 */ }
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
