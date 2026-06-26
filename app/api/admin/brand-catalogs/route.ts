import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-server";
import { logAudit } from "@/lib/audit-server";

function connectedProjectRef() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
    .replace(/^https?:\/\//, "").split(".")[0] || "(NEXT_PUBLIC_SUPABASE_URL 미설정)";
}

// 브랜드 카탈로그 전체 조회 (순서대로) — 관리자 전용(숨긴 항목 포함하므로 인증 필요)
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("brand_catalogs")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (error) return NextResponse.json({ error: error.message, project: connectedProjectRef() }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// 브랜드 카탈로그 생성
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("brand_catalogs").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit({
    action: "create",
    resource: "brand-catalogs",
    resourceLabel: "브랜드 카탈로그",
    target: data?.name ?? data?.title ?? body?.name ?? body?.title,
    targetId: data?.id,
  });
  return NextResponse.json(data);
}
