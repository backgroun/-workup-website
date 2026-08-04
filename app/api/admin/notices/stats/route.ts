import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin-auth";

type StoreAgg = { name: string; pass: number; outbound: number };
type StoreStat = { store_id: number; store_name: string; total: number; outbound: number; pass: number };

function toRows(m: Map<number, StoreAgg>): StoreStat[] {
  return [...m.entries()]
    .map(([store_id, v]) => ({ store_id, store_name: v.name, total: v.pass + v.outbound, outbound: v.outbound, pass: v.pass }))
    .sort((a, b) => b.total - a.total);
}

// 캘린더 드릴다운(일별 오픈 목록 + 그날의 지점별 패스 현황)과, 기본 화면에 보여줄
// 전체 누적 지점별 패스 현황을 한 번에 계산한다 — 원본 행을 그대로 가져와 이 라우트에서 집계
// (이 저장소는 별도 통계 테이블/RPC 없이 관리자 목록 페이지들도 전부 클라이언트/서버에서
//  직접 reduce하는 방식이라 동일한 관례를 따른다).
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = createAdminClient();

  const { data: notices, error: noticeErr } = await sb
    .from("notices")
    .select("id, notice_date, product_id, products(id, name)")
    .order("notice_date", { ascending: false });
  if (noticeErr) return NextResponse.json({ error: noticeErr.message }, { status: 500 });

  const noticeDateById = new Map<string, string>();
  const dailyProducts = new Map<string, { id: string; name: string }[]>();
  for (const n of notices ?? []) {
    noticeDateById.set(n.id, n.notice_date);
    const product = n.products as unknown as { id: string; name: string } | null;
    const list = dailyProducts.get(n.notice_date) ?? [];
    list.push({ id: product?.id ?? n.product_id, name: product?.name ?? "상품 정보 없음" });
    dailyProducts.set(n.notice_date, list);
  }

  const { data: entries, error: entryErr } = await sb
    .from("pass_entries")
    .select("notice_id, store_id, status, stores(name)");
  if (entryErr) return NextResponse.json({ error: entryErr.message }, { status: 500 });

  const overallStoreMap = new Map<number, StoreAgg>();
  const dailyStoreMap = new Map<string, Map<number, StoreAgg>>();

  for (const e of entries ?? []) {
    const storeName = (e.stores as unknown as { name: string } | null)?.name ?? "알 수 없음";

    const overall = overallStoreMap.get(e.store_id) ?? { name: storeName, pass: 0, outbound: 0 };
    if (e.status === "패스") overall.pass += 1;
    else overall.outbound += 1;
    overallStoreMap.set(e.store_id, overall);

    const noticeDate = noticeDateById.get(e.notice_id);
    if (!noticeDate) continue;
    const dayMap = dailyStoreMap.get(noticeDate) ?? new Map<number, StoreAgg>();
    const cur = dayMap.get(e.store_id) ?? { name: storeName, pass: 0, outbound: 0 };
    if (e.status === "패스") cur.pass += 1;
    else cur.outbound += 1;
    dayMap.set(e.store_id, cur);
    dailyStoreMap.set(noticeDate, dayMap);
  }

  const daily = [...dailyProducts.entries()]
    .map(([notice_date, products]) => ({
      notice_date,
      count: products.length,
      products,
      byStore: toRows(dailyStoreMap.get(notice_date) ?? new Map()),
    }))
    .sort((a, b) => b.notice_date.localeCompare(a.notice_date));

  return NextResponse.json({ daily, byStore: toRows(overallStoreMap) });
}
