"use client";

// 익명 방문자 식별용 랜덤 id (localStorage). 개인정보 아님.
const VID_KEY = "wu_vid";
function getVisitorId(): string {
  try {
    let v = localStorage.getItem(VID_KEY);
    if (!v) {
      v = crypto.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(VID_KEY, v);
    }
    return v;
  } catch {
    return "";
  }
}

export type TrackStore = { id?: number | null; name?: string | null };
export type StoreEventType =
  | "view"
  | "list_click"
  | "directions_kakao"
  | "directions_naver"
  | "call"
  | "kakao_chat";

declare global {
  interface Window { dataLayer?: Record<string, unknown>[] }
}

// GTM에서 커스텀 이벤트 트리거로 잡을 수 있도록 dataLayer에도 함께 기록.
// (오프라인 전환 이벤트 — 전화문의/카톡상담/길찾기/제품문의 — GA4 전환 설정용)
export function pushConversionEvent(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
}

// 매장 이벤트 종류 → GTM에 넘길 전환 이벤트명 매핑 (view/list_click은 조회일 뿐이라 전환 이벤트 제외)
const GTM_CONVERSION_EVENT: Partial<Record<StoreEventType, string>> = {
  call: "call_click",
  kakao_chat: "kakao_chat_click",
  directions_kakao: "directions_click",
  directions_naver: "directions_click",
};

// 매장 이벤트 기록. 화면 이동을 막지 않도록 sendBeacon 우선 사용.
export function trackStoreEvent(eventType: StoreEventType, store?: TrackStore) {
  if (typeof window === "undefined") return;

  const gtmEvent = GTM_CONVERSION_EVENT[eventType];
  if (gtmEvent) {
    pushConversionEvent(gtmEvent, {
      method: eventType.startsWith("directions_") ? eventType.replace("directions_", "") : undefined,
      store_id: store?.id ?? null,
      store_name: store?.name ?? "",
    });
  }

  try {
    const payload = JSON.stringify({
      event_type: eventType,
      store_id: store?.id ?? null,
      store_name: store?.name ?? "",
      path: window.location.pathname,
      visitor_id: getVisitorId(),
    });
    const blob = new Blob([payload], { type: "application/json" });
    if (navigator.sendBeacon && navigator.sendBeacon("/api/track", blob)) return;
    fetch("/api/track", {
      method: "POST",
      body: payload,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* 트래킹 실패는 무시 */
  }
}
