import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-server";
import { logAudit } from "@/lib/audit-server";

// 앱이 실제로 연결된 Supabase 프로젝트 ref (진단용 — NEXT_PUBLIC_ 값이라 비밀 아님)
function connectedProjectRef() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
    .replace(/^https?:\/\//, "")
    .split(".")[0] || "(NEXT_PUBLIC_SUPABASE_URL 미설정)";
}

// 카탈로그 페이지 조회 — ?brand=<id> 로 브랜드별 분리(없으면 WORKUP 전용: brand_id=""), ?summary=1 로 브랜드별 집계
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createAdminClient();
  const { searchParams } = new URL(req.url);

  // 브랜드별 집계 맵 — /admin/catalog/brands 목록 뱃지용
  if (searchParams.get("summary")) {
    const { data, error } = await supabase
      .from("catalog_pages")
      .select("brand_id, updated_at, is_visible");
    if (error) return NextResponse.json({ error: error.message, project: connectedProjectRef() }, { status: 500 });
    const summary: Record<string, { count: number; visibleCount: number; latest: string }> = {};
    for (const row of (data ?? []) as { brand_id: string | null; updated_at: string | null; is_visible: boolean | null }[]) {
      const bid = String(row.brand_id ?? "");
      if (!bid) continue; // WORKUP 전용 페이지 제외
      const entry = summary[bid] ?? { count: 0, visibleCount: 0, latest: "" };
      entry.count += 1;
      if (row.is_visible !== false) entry.visibleCount += 1;
      if (row.updated_at && row.updated_at > entry.latest) entry.latest = row.updated_at;
      summary[bid] = entry;
    }
    return NextResponse.json(summary);
  }

  const brand = searchParams.get("brand");
  const { data, error } = await supabase
    .from("catalog_pages")
    .select("*")
    .eq("brand_id", brand ? String(brand) : "")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (error) {
    // 실제 에러 메시지 + 연결 프로젝트를 함께 반환해 원인 진단을 돕는다.
    return NextResponse.json(
      { error: error.message, project: connectedProjectRef() },
      { status: 500 }
    );
  }
  return NextResponse.json(data ?? []);
}

// 카탈로그 페이지 생성
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("catalog_pages")
    .insert({ brand_id: "", ...body })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit({
    action: "create",
    resource: "catalog",
    resourceLabel: "카탈로그",
    target: data?.title ?? data?.name ?? body?.title ?? body?.name,
    targetId: data?.id,
  });
  return NextResponse.json(data);
}
