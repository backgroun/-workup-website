import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-server";
import { logAudit } from "@/lib/audit-server";
import { getImagekit } from "@/lib/imagekit-server";

// 브랜드 카탈로그 수정 (부분 업데이트: 노출 토글·순서 변경 등)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("brand_catalogs")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit({
    action: "update",
    resource: "brand-catalogs",
    resourceLabel: "브랜드 카탈로그",
    target: data?.name ?? data?.title ?? body?.name ?? body?.title,
    targetId: id,
  });
  return NextResponse.json(data);
}

// 브랜드 카탈로그 삭제 (ImageKit 원본 PDF도 함께 정리)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: row } = await supabase.from("brand_catalogs").select("pdf_file_id").eq("id", id).maybeSingle();
  const { error } = await supabase.from("brand_catalogs").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    action: "delete",
    resource: "brand-catalogs",
    resourceLabel: "브랜드 카탈로그",
    targetId: id,
  });

  if (row?.pdf_file_id) {
    try { await getImagekit().files.delete(row.pdf_file_id as string); } catch { /* 자산 정리 실패는 무시 */ }
  }
  return NextResponse.json({ ok: true });
}
