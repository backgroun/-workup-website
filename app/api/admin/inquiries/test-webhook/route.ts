import { NextResponse } from "next/server";
import { getSiteSection } from "@/lib/site-settings";
import { normalizeNotifications, type NotificationConfig } from "@/lib/site-content";
import { isAdmin } from "@/lib/admin-auth";

// 관리자: 구글시트/이메일 웹훅을 동기로 테스트 호출하고 결과를 그대로 반환한다.
// "수집 안 됨"의 원인(환경변수 미설정 / Apps Script 배포·권한 오류 / 타임아웃)을 즉시 확인하기 위함.
export async function POST() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const webhook = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhook) {
    return NextResponse.json({
      ok: false,
      configured: false,
      error: "GOOGLE_SHEET_WEBHOOK_URL 환경변수가 설정되지 않았습니다. Vercel 환경변수에 Apps Script 웹앱 URL(…/exec)을 등록하고 재배포하세요.",
    });
  }

  const notif = normalizeNotifications(await getSiteSection<NotificationConfig>("notifications"));
  // 테스트는 공통 담당자 우선, 없으면 형태별에 등록된 첫 이메일로 발송.
  const anyEmail = notif.manager_email.trim() || Object.values(notif.emails_by_type).flat().find((e) => e.trim()) || "";
  const notifyEmail = notif.email_enabled ? anyEmail : "";

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 9000);
  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "support",
        type_label: "테스트",
        subject: "연동 테스트",
        name: "관리자 테스트",
        phone: "010-0000-0000",
        message: "구글시트/담당자 이메일 연동 테스트입니다. 이 행/메일이 보이면 정상입니다.",
        submitted_at: new Date().toISOString(),
        notify_email: notifyEmail,
        test: true,
      }),
      signal: ctrl.signal,
      redirect: "follow",
    });
    const text = await res.text().catch(() => "");
    return NextResponse.json({
      ok: res.ok,
      configured: true,
      status: res.status,
      notifyEmail: notifyEmail || null,
      body: text.slice(0, 300),
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      configured: true,
      error: e instanceof Error ? e.message : String(e),
    });
  } finally {
    clearTimeout(t);
  }
}
