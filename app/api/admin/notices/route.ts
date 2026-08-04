import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit-server";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("notices")
    .select("id, product_id, notice_date, status, opened_at, closed_at, created_at, description, extra_images, products(id, name, image_url, registration_status)")
    .order("notice_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body?.product_id) {
    return NextResponse.json({ error: "product_id는 필수입니다." }, { status: 400 });
  }
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("notices")
    .insert({
      product_id: body.product_id,
      notice_date: body.notice_date ?? new Date().toISOString().slice(0, 10),
      status: "대기",
      description: body.description ?? null,
      extra_images: Array.isArray(body.extra_images) ? body.extra_images : [],
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit({
    action: "create",
    resource: "notices",
    resourceLabel: "공지",
    target: body.product_name ?? data?.product_id,
    targetId: data?.id,
  });
  return NextResponse.json(data);
}
