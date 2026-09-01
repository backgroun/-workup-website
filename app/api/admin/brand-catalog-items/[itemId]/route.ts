import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-server";
import { logAudit } from "@/lib/audit-server";

export async function PUT(req: Request, { params }: { params: Promise<{ itemId: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { itemId } = await params;
  const body = await req.json();
  // id/brand_id 변경 금지
  const patch = { ...body };
  delete patch.id;
  delete patch.brand_id;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("brand_catalog_items")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", itemId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    action: "update",
    resource: "brand-catalog-items",
    resourceLabel: "조립형 카탈로그 항목",
    target: data?.name,
    targetId: itemId,
  });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ itemId: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { itemId } = await params;

  const supabase = createAdminClient();
  const { error } = await supabase.from("brand_catalog_items").delete().eq("id", itemId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    action: "delete",
    resource: "brand-catalog-items",
    resourceLabel: "조립형 카탈로그 항목",
    targetId: itemId,
  });
  return NextResponse.json({ ok: true });
}
