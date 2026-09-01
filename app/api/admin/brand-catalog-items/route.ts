import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-server";
import { logAudit } from "@/lib/audit-server";

function projectRef() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
    .replace(/^https?:\/\//, "").split(".")[0] || "(NEXT_PUBLIC_SUPABASE_URL 미설정)";
}

// 특정 브랜드의 조립형 카탈로그 항목 전체 (숨김 포함 — 관리자 전용)
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const brandId = new URL(req.url).searchParams.get("brandId");
  if (!brandId) return NextResponse.json({ error: "brandId 필요" }, { status: 400 });

  const supabase = createAdminClient();
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
  const row = { id: crypto.randomUUID(), ...body, brand_id: String(body.brand_id) };
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
