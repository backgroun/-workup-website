import { NextResponse, after } from "next/server";
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

  // 허용 유형: 가맹·창업 / 입점·제휴 / 고객(1:1)
  if (type !== "franchise" && type !== "wholesale" && type !== "support") {
    return NextResponse.json({ error: "문의 유형이 올바르지 않습니다." }, { status: 400 });
  }

  // 페이로드 크기 제한 (대용량 페이로드 방지)
  if (JSON.stringify(payload).length > 8000) {
    return NextResponse.json({ error: "문의 내용이 너무 깁니다. 줄여서 다시 시도해주세요." }, { status: 400 });
  }

  // 필수값 최소 검증 (연락처) — 자릿수만 관대하게 확인
  const phone = String((payload as Record<string, unknown>).phone ?? "").trim();
  if (!phone) {
    return NextResponse.json({ error: "연락처를 입력해주세요." }, { status: 400 });
  }
  if (phone.replace(/\D/g, "").length < 8) {
    return NextResponse.json({ error: "연락처를 정확히 입력해주세요." }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("inquiries").insert({ type, payload, status: "new" });
    if (error) {
      // DB 오류 원인은 서버 로그로만 남기고, 고객에게는 일반 안내 문구만 노출(내부 정보 비노출).
      console.error("[inquiries] insert 실패:", error.message);
      return NextResponse.json({ error: "접수 처리 중 오류가 발생했습니다. 잠시 후 다시 시도하시거나 전화로 문의해 주세요." }, { status: 500 });
    }

    // 구글시트(Apps Script 웹앱)에도 누적 — 응답 후 비차단으로 전송(after), 2.5초 타임아웃.
    // 시트가 느리거나 실패해도 사용자 접수 응답을 막거나 실패시키지 않는다.
    const webhook = process.env.GOOGLE_SHEET_WEBHOOK_URL;
    if (webhook) {
      after(async () => {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 2500);
        try {
          await fetch(webhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, ...payload, submitted_at: new Date().toISOString() }),
            signal: ctrl.signal,
            redirect: "follow",
          });
        } catch { /* 시트 기록 실패는 접수 자체를 막지 않음 */ } finally {
          clearTimeout(t);
        }
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[inquiries] 처리 오류:", msg);
    return NextResponse.json({ error: "접수 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
}
