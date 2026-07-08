import { NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { getSiteSection } from "@/lib/site-settings";
import { normalizeNotifications, notifyRecipients, type NotificationConfig } from "@/lib/site-content";
import { normalizePartnership, type PartnershipConfig } from "@/data/partnership";

function typeLabelOf(type: string): string {
  return type === "wholesale" ? "입점·제휴"
    : type === "support" ? "고객 1:1"
    : type === "product" ? "상품 문의"
    : "가맹·창업";
}

// 공개 GET: 특정 상품(productId)의 상품문의 목록.
// 서비스롤로 조회하되 안전 필드만 반환하고, 비밀글은 제목·내용을 마스킹한다(연락처 등 비노출).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = (searchParams.get("productId") ?? "").trim();
  if (!productId) return NextResponse.json([]);
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("inquiries")
      .select("id, created_at, status, payload")
      .eq("type", "product")
      .eq("payload->>productId", productId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      console.error("[inquiries] GET 실패:", error.message);
      return NextResponse.json([]);
    }
    const list = (data ?? []).map((r) => {
      const payload = (r.payload ?? {}) as Record<string, unknown>;
      const secret = !!String(payload.secret ?? "").trim();
      return {
        id: r.id,
        createdAt: r.created_at,
        status: r.status,
        secret,
        subject: String(payload.subject ?? ""),
        title: secret ? "" : String(payload.title ?? ""),
        content: secret ? "" : String(payload.content ?? ""),
      };
    });
    return NextResponse.json(list);
  } catch (e) {
    console.error("[inquiries] GET 오류:", e instanceof Error ? e.message : String(e));
    return NextResponse.json([]);
  }
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

  const p = payload as Record<string, unknown>;

  // 유형별 검증
  if (type === "franchise" || type === "wholesale") {
    // 가맹·창업 / 입점·제휴는 로그인 없이 접수하므로 개인정보 동의를 서버에서도 필수로 검증(클라이언트 우회 방지).
    if (!String(p.privacyAgree ?? "").trim()) {
      return NextResponse.json({ error: "개인정보 수집·이용에 동의해주세요." }, { status: 400 });
    }
    // 관리자가 구성한 폼의 필수 항목·연락처 형식을 검증한다.
    // 필드가 동적으로 추가/삭제되어도 저장된 폼 설정과 항상 동기화된다.
    const cfg = normalizePartnership(await getSiteSection<PartnershipConfig>("partnership_page"));
    for (const field of cfg[type].form.fields) {
      const val = String(p[field.key] ?? "").trim();
      if (field.required && !val) {
        return NextResponse.json({ error: `${field.label}을(를) 입력해 주세요.` }, { status: 400 });
      }
      if (val && field.type === "tel") {
        const digits = val.replace(/\D/g, "").length;
        if (digits < 8 || digits > 15) {
          return NextResponse.json({ error: "연락처를 정확히 입력해 주세요." }, { status: 400 });
        }
      }
    }
  } else if (type === "support") {
    // 고객 1:1 문의는 연락처 필수(자릿수만 관대하게 확인).
    const phone = String(p.phone ?? "").trim();
    if (!phone) {
      return NextResponse.json({ error: "연락처를 입력해주세요." }, { status: 400 });
    }
    const phoneDigits = phone.replace(/\D/g, "").length;
    if (phoneDigits < 8 || phoneDigits > 15) {
      return NextResponse.json({ error: "연락처를 정확히 입력해주세요." }, { status: 400 });
    }
  }
  // 상품 문의(product)는 연락처를 받지 않으므로 별도 필수 검증 없음.

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
      // 유형(게시판 형태)별 담당자에게 발송 — 형태별 미설정 시 공통 담당자. 여러 명은 콤마로.
      const notifyEmail = notif.email_enabled ? notifyRecipients(notif, type).join(",") : "";
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
