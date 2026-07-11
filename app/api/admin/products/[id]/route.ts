import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createAdminClient, mapFromDb, mapToDb } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit-server";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .update({ ...mapToDb({ ...body, id }), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateTag("products", "max");
  await logAudit({
    action: "update",
    resource: "products",
    resourceLabel: "상품",
    target: data?.name ?? body?.name,
    targetId: id,
  });
  return NextResponse.json(mapFromDb(data));
}

export async function DELETE(_req: Request, { params }: Params) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateTag("products", "max");
  await logAudit({
    action: "delete",
    resource: "products",
    resourceLabel: "상품",
    targetId: id,
  });
  return NextResponse.json({ ok: true });
}
