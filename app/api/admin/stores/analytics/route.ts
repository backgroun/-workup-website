import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin-auth";

type StatRow = { store_id: number | null; store_name: string; event_type: string; cnt: number };

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
  const days = Number(searchParams.get("days") ?? "30");
  const since =
    days > 0 ? new Date(Date.now() - days * 86400000).toISOString() : new Date(0).toISOString();

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("store_event_stats", { since });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const map = new Map<string, StoreStat>();
  for (const row of (data ?? []) as StatRow[]) {
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
    const cnt = Number(row.cnt) || 0;
    if (row.event_type in s) (s as unknown as Record<string, number>)[row.event_type] = cnt;
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
