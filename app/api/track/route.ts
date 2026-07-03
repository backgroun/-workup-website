import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

const ALLOWED = new Set([
  "view",
  "list_click",
  "directions_kakao",
  "directions_naver",
  "call",
  "kakao_chat",
]);

// POST /api/track — 매장 이벤트 1건 기록 (공개, 개인정보 없음)
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(await req.text());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const eventType = String(body?.event_type ?? "");
  if (!ALLOWED.has(eventType)) return NextResponse.json({ ok: false }, { status: 400 });

  const storeIdRaw = body?.store_id;
  const storeId =
    storeIdRaw != null && !Number.isNaN(Number(storeIdRaw)) ? Number(storeIdRaw) : null;

  try {
    const supabase = createAdminClient();
    await supabase.from("store_events").insert({
      store_id: storeId,
      store_name: String(body?.store_name ?? "").slice(0, 200),
      event_type: eventType,
      path: String(body?.path ?? "").slice(0, 300),
      visitor_id: String(body?.visitor_id ?? "").slice(0, 64),
    });
  } catch {
    /* 기록 실패는 조용히 무시 */
  }
  return new NextResponse(null, { status: 204 });
}
