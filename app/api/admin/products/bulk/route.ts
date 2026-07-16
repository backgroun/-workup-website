import { NextResponse } from "next/server";
import { createAdminClient, mapToDb } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit-server";

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!Array.isArray(body) || body.length === 0) {
    return NextResponse.json({ error: "빈 데이터입니다." }, { status: 400 });
  }
  if (body.length > 500) {
    return NextResponse.json({ error: "한 번에 최대 500개까지 가져올 수 있습니다." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const rows = body.map(mapToDb);

  // 같은 id(상품명 슬러그)가 배치 안에 두 번 있으면 upsert가 "ON CONFLICT DO UPDATE ... cannot affect row a second time"로 전체가 실패한다.
  // 클라이언트(엑셀 업로드 미리보기)에서 미리 걸러내지만, 다른 경로로 들어올 경우를 대비해 서버에서도 명확한 오류로 막는다.
  const idCounts = new Map<string, number>();
  rows.forEach((r) => { if (r.id) idCounts.set(r.id, (idCounts.get(r.id) ?? 0) + 1); });
  const dupIds = [...idCounts.entries()].filter(([, n]) => n > 1).map(([id]) => id);
  if (dupIds.length > 0) {
    return NextResponse.json(
      { error: `상품명이 같아 동일하게 처리되는 항목이 있습니다: ${dupIds.join(", ")}` },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("products")
    .upsert(rows, { onConflict: "id" })
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit({
    action: "create",
    resource: "products",
    resourceLabel: "상품",
    summary: `상품 ${data?.length ?? rows.length}건 일괄 등록`,
  });
  return NextResponse.json({ ok: true, count: data?.length ?? 0 });
}
