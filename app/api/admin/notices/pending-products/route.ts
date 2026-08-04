import { NextResponse } from "next/server";
import { createAdminClient, mapFromDb } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin-auth";

// "정식등록 대기" 목록 전용 — 지점 출고 패스(공지 상품 선택 → 새 상품 임시등록)에서 실제로
// 만들어져 공지에 쓰인 임시등록 상품만 보여준다. (한 번도 공지에 쓰인 적 없는 옛 미완성
// 상품 — 예: 진열대기 상태로 남아있는 기존 상품 — 은 이 기능과 무관하므로 제외한다.)
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = createAdminClient();

  const { data: noticeRows, error: noticeErr } = await sb.from("notices").select("product_id");
  if (noticeErr) return NextResponse.json({ error: noticeErr.message }, { status: 500 });
  const noticedIds = [...new Set((noticeRows ?? []).map((n) => n.product_id))];
  if (noticedIds.length === 0) return NextResponse.json([]);

  const { data, error } = await sb
    .from("products")
    .select("*")
    .eq("registration_status", "임시등록")
    .in("id", noticedIds)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map(mapFromDb));
}
