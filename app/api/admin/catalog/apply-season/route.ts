import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-server";
import { logAudit } from "@/lib/audit-server";

// POST /api/admin/catalog/apply-season
// body: { season: string, brand_ids: string[] }
// 선택된 브랜드들의 모든 카탈로그 페이지 중
// page_type === "cover" 이거나 data.season 이 있는 페이지에 season 적용
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const season: string = typeof body?.season === "string" ? body.season.trim() : "";
  const brand_ids: string[] = Array.isArray(body?.brand_ids) ? body.brand_ids.filter((x: unknown) => typeof x === "string") : [];

  if (!season) return NextResponse.json({ error: "season 값이 없습니다." }, { status: 400 });
  if (brand_ids.length === 0) return NextResponse.json({ error: "브랜드를 선택하세요." }, { status: 400 });

  const supabase = createAdminClient();

  // 선택된 브랜드의 모든 페이지 조회
  const { data: pages, error: fetchErr } = await supabase
    .from("catalog_pages")
    .select("id, page_type, data")
    .in("brand_id", brand_ids);

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  // season 이 들어갈 대상: cover 타입이거나, 기존에 data.season 이 있는 페이지
  const targets = (pages ?? []).filter(
    (p) => p.page_type === "cover" || (p.data && typeof p.data === "object" && "season" in p.data)
  );

  if (targets.length === 0) {
    return NextResponse.json({ ok: true, updated: 0, message: "적용할 페이지가 없습니다." });
  }

  // 개별 업데이트 (Supabase in-batch update)
  const results = await Promise.allSettled(
    targets.map((p) => {
      const newData = { ...(p.data ?? {}), season };
      return supabase
        .from("catalog_pages")
        .update({ data: newData })
        .eq("id", p.id)
        .then(({ error }) => { if (error) throw new Error(error.message); });
    })
  );

  const ok = results.filter((r) => r.status === "fulfilled").length;
  const fail = results.length - ok;

  await logAudit({
    action: "update",
    resource: "catalog",
    resourceLabel: "카탈로그",
    summary: `시즌 일괄 적용 "${season}" — ${ok}개 성공${fail > 0 ? `, ${fail}개 실패` : ""}`,
  });

  return NextResponse.json({ ok: true, updated: ok, failed: fail });
}
