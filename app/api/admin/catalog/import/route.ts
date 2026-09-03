import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-server";
import { logAudit } from "@/lib/audit-server";
import type { CatalogPageType, CatalogPageData } from "@/data/catalog";

// POST /api/admin/catalog/import
// body: { brand_id?: string, rows: ImportRow[] }
// ImportRow(엑셀 파싱 결과 한 줄) → catalog_pages 신규 insert (기존 페이지 뒤에 이어붙임)
type ImportRow = {
  page_type: CatalogPageType;     // "image" | "divider" (엑셀 지원 범위)
  image_url: string;
  title: string;
  description: string;
  link_url: string;
  link_label: string;
  divider_no: string;
  divider_desc: string;
  is_visible: boolean;
};

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const brandId = typeof body?.brand_id === "string" ? body.brand_id : "";
  const rows: ImportRow[] = Array.isArray(body?.rows) ? body.rows : [];
  if (rows.length === 0) return NextResponse.json({ error: "가져올 데이터가 없습니다." }, { status: 400 });

  const supabase = createAdminClient();

  // 기존 페이지 수 → sort_order 시작값 (엑셀 행이 맨 뒤에 순서대로 붙는다)
  const { count } = await supabase
    .from("catalog_pages")
    .select("id", { count: "exact", head: true })
    .eq("brand_id", brandId);
  const start = count ?? 0;

  const inserts = rows.map((r, i) => {
    const type: CatalogPageType = r.page_type === "divider" ? "divider" : "image";
    const data: CatalogPageData =
      type === "divider"
        ? { eyebrow: "", no: r.divider_no || "", title: r.title || "", desc: r.divider_desc || "", bg: "#303236" }
        : {};
    return {
      id: crypto.randomUUID(),
      brand_id: brandId,
      page_type: type,
      admin_title: r.title || (type === "divider" ? "구분" : "이미지"),
      image_url: r.image_url || null,
      title: type === "divider" ? "" : (r.title || ""),
      description: type === "divider" ? "" : (r.description || ""),
      link_url: r.link_url || "",
      link_label: r.link_label || "",
      data,
      is_visible: r.is_visible !== false,
      sort_order: start + i,
    };
  });

  const { error } = await supabase.from("catalog_pages").insert(inserts);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    action: "create",
    resource: "catalog",
    resourceLabel: "카탈로그",
    summary: `카탈로그 페이지 엑셀 업로드 — ${inserts.length}건${brandId ? ` (브랜드 ${brandId})` : ""}`,
  });

  return NextResponse.json({ ok: true, count: inserts.length });
}
