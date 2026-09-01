import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-server";
import { logAudit } from "@/lib/audit-server";
import type { AssembledCatalogSummary } from "@/data/brandCatalog";

function projectRef() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
    .replace(/^https?:\/\//, "").split(".")[0] || "(NEXT_PUBLIC_SUPABASE_URL 미설정)";
}

// GET
//  ?brandId=<id>  → 그 브랜드의 항목 전체 (숨김 포함, 관리자 편집용)
//  ?summary=1     → 전 브랜드 요약 맵 (목록 화면의 상태 표시·정렬용)
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const params = new URL(req.url).searchParams;
  const supabase = createAdminClient();

  if (params.get("summary")) {
    const { data, error } = await supabase
      .from("brand_catalog_items")
      .select("brand_id, updated_at, is_visible");
    if (error) return NextResponse.json({ error: error.message, project: projectRef() }, { status: 500 });
    const map: AssembledCatalogSummary = {};
    for (const r of (data ?? []) as { brand_id: unknown; updated_at: string | null; is_visible: unknown }[]) {
      const k = String(r.brand_id);
      const bucket = map[k] ?? (map[k] = { count: 0, visibleCount: 0, latest: "" });
      bucket.count += 1;
      if (r.is_visible !== false) bucket.visibleCount += 1;
      if (r.updated_at && r.updated_at > bucket.latest) bucket.latest = r.updated_at;
    }
    return NextResponse.json(map);
  }

  const brandId = params.get("brandId");
  if (!brandId) return NextResponse.json({ error: "brandId 또는 summary 필요" }, { status: 400 });

  const { data, error } = await supabase
    .from("brand_catalog_items")
    .select("*")
    .eq("brand_id", String(brandId))
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (error) return NextResponse.json({ error: error.message, project: projectRef() }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// 항목 생성
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body?.brand_id) return NextResponse.json({ error: "brand_id 필요" }, { status: 400 });

  const supabase = createAdminClient();
  const row = { ...body, id: crypto.randomUUID(), brand_id: String(body.brand_id) };
  const { data, error } = await supabase.from("brand_catalog_items").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    action: "create",
    resource: "brand-catalog-items",
    resourceLabel: "조립형 카탈로그 항목",
    target: data?.name ?? body?.name,
    targetId: data?.id,
  });
  return NextResponse.json(data);
}
