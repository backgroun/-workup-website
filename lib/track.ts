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

// 매장 이벤트 기록. 화면 이동을 막지 않도록 sendBeacon 우선 사용.
export function trackStoreEvent(eventType: StoreEventType, store?: TrackStore) {
  if (typeof window === "undefined") return;
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
