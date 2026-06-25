import { NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { getSiteSection } from "@/lib/site-settings";
import { normalizeNotifications, type NotificationConfig } from "@/lib/site-content";

function typeLabelOf(type: string): string {
  return type === "wholesale" ? "입점·제휴"
    : type === "support" ? "고객 1:1"
    : type === "product" ? "상품 문의"
    : "가맹·창업";
}

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

  // 허용 유형: 가맹·창업 / 입점·제휴 / 고객(1:1) / 상품 문의
  if (type !== "franchise" && type !== "wholesale" && type !== "support" && type !== "product") {
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
  const phoneDigits = phone.replace(/\D/g, "").length;
  if (phoneDigits < 8 || phoneDigits > 15) {
    return NextResponse.json({ error: "연락처를 정확히 입력해주세요." }, { status: 400 });
  }

  // 가맹·창업 문의는 로그인 없이 접수하므로 개인정보 동의를 서버에서도 필수로 검증한다.
  // (클라이언트 우회 방지 — 입점·제휴 / 고객 1:1 폼은 영향받지 않음)
  if (type === "franchise") {
    const agreed = String((payload as Record<string, unknown>).privacyAgree ?? "").trim();
    if (!agreed) {
      return NextResponse.json({ error: "개인정보 수집·이용에 동의해주세요." }, { status: 400 });
    }
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("inquiries").insert({ type, payload, status: "new" });
    if (error) {
      // DB 오류 원인은 서버 로그로만 남기고, 고객에게는 일반 안내 문구만 노출(내부 정보 비노출).
      console.error("[inquiries] insert 실패:", error.message);
      return NextResponse.json({ error: "접수 처리 중 오류가 발생했습니다. 잠시 후 다시 시도하시거나 전화로 문의해 주세요." }, { status: 500 });
    }

    // 구글시트(Apps Script 웹앱)에 누적 + 담당자 이메일 발송(설정 시).
    // 응답 후 비차단으로 전송(after) — 시트/메일이 느리거나 실패해도 접수 자체는 정상 처리한다.
    const webhook = process.env.GOOGLE_SHEET_WEBHOOK_URL;
    if (webhook) {
      // 담당자 이메일 설정을 요청 컨텍스트에서 미리 읽어 클로저에 담는다(after 내부 동적 API 회피).
      const notif = normalizeNotifications(await getSiteSection<NotificationConfig>("notifications"));
      const notifyEmail = notif.email_enabled ? notif.manager_email.trim() : "";
      const outgoing = {
        type,
        type_label: typeLabelOf(type),
        ...payload,
        submitted_at: new Date().toISOString(),
        notify_email: notifyEmail, // Apps Script가 이 값으로 담당자 메일 발송
      };
      after(async () => {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 8000); // Apps Script 콜드스타트 여유
        try {
          const res = await fetch(webhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(outgoing),
            signal: ctrl.signal,
            redirect: "follow",
          });
          console.log(`[inquiries] webhook 전송 완료 status=${res.status} email=${notifyEmail ? "on" : "off"}`);
        } catch (e) {
          console.error("[inquiries] webhook 전송 실패:", e instanceof Error ? e.message : String(e));
        } finally {
          clearTimeout(t);
        }
      });
    } else {
      console.warn("[inquiries] GOOGLE_SHEET_WEBHOOK_URL 미설정 — 시트/이메일 전송을 건너뜁니다.");
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[inquiries] 처리 오류:", msg);
    return NextResponse.json({ error: "접수 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
}
