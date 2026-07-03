import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin-auth";

type EventRow = { store_id: number | null; store_name: string | null; event_type: string };

type StoreStat = {
  store_id: number | null;
  store_name: string;
  view: number;
  list_click: number;
  directions_kakao: number;
  directions_naver: number;
  call: number;
  kakao_chat: number;
  conversions: number; // 길찾기+전화+카톡 (실제 방문/문의로 이어지는 행동)
};

// GET /api/admin/stores/analytics?days=30  (days=0 → 전체)
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from"); // YYYY-MM-DD (임의 기간 시작)
  const toParam = searchParams.get("to"); // YYYY-MM-DD (임의 기간 끝, 포함)
  const dateRe = /^\d{4}-\d{2}-\d{2}$/;

  // 임의 기간(from~to)이 유효하면 우선, 아니면 days 프리셋 사용. 경계는 KST(+09:00) 기준.
  let sinceIso: string;
  let untilIso: string | null = null;
  if (fromParam && toParam && dateRe.test(fromParam) && dateRe.test(toParam)) {
    sinceIso = new Date(`${fromParam}T00:00:00+09:00`).toISOString();
    untilIso = new Date(`${toParam}T23:59:59.999+09:00`).toISOString();
  } else {
    const days = Number(searchParams.get("days") ?? "30");
    sinceIso = days > 0 ? new Date(Date.now() - days * 86400000).toISOString() : new Date(0).toISOString();
  }

  const supabase = createAdminClient();

  // store_events를 페이지 단위로 모두 읽어 앱에서 집계 (RPC 불필요, Max rows 제한 회피)
  const rows: EventRow[] = [];
  const PAGE = 1000;
  for (let offset = 0; offset <= 200000; offset += PAGE) {
    let q = supabase
      .from("store_events")
      .select("store_id, store_name, event_type")
      .gte("created_at", sinceIso);
    if (untilIso) q = q.lte("created_at", untilIso);
    const { data, error } = await q.range(offset, offset + PAGE - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) break;
    rows.push(...(data as EventRow[]));
    if (data.length < PAGE) break;
  }

  const map = new Map<string, StoreStat>();
  for (const row of rows) {
    const key = String(row.store_id ?? `name:${row.store_name}`);
    let s = map.get(key);
    if (!s) {
      s = {
        store_id: row.store_id,
        store_name: row.store_name || "(삭제된 지점)",
        view: 0, list_click: 0, directions_kakao: 0, directions_naver: 0,
        call: 0, kakao_chat: 0, conversions: 0,
      };
      map.set(key, s);
    }
    if (row.event_type in s) (s as unknown as Record<string, number>)[row.event_type] += 1;
  }

  const stores = Array.from(map.values()).map((s) => ({
    ...s,
    conversions: s.directions_kakao + s.directions_naver + s.call + s.kakao_chat,
  }));
  stores.sort((a, b) => b.conversions - a.conversions || b.view - a.view);

  const totals = stores.reduce(
    (t, s) => ({
      view: t.view + s.view,
      list_click: t.list_click + s.list_click,
      directions: t.directions + s.directions_kakao + s.directions_naver,
      call: t.call + s.call,
      kakao_chat: t.kakao_chat + s.kakao_chat,
      conversions: t.conversions + s.conversions,
    }),
    { view: 0, list_click: 0, directions: 0, call: 0, kakao_chat: 0, conversions: 0 },
  );

  return NextResponse.json({ stores, totals });
}
