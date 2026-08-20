import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-server";
import { logAudit } from "@/lib/audit-server";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { name, name_ko, ...rest } = body;
  if (!name?.trim()) return NextResponse.json({ error: "브랜드명을 입력하세요." }, { status: 400 });
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("brands")
    .insert({ name: name.trim(), name_ko: name_ko?.trim() || null, ...rest })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit({ action: "create", resource: "brands", resourceLabel: "브랜드", target: data?.name, targetId: String(data?.id) });
  return NextResponse.json(data, { status: 201 });
}

// 기존 브랜드/제조사 관리 페이지가 사용하는 PUT (body에 id 포함)
export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, name, name_ko, ...rest } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "브랜드명을 입력하세요." }, { status: 400 });
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("brands")
    .update({ name: name.trim(), name_ko: name_ko?.trim() || null, ...rest })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit({ action: "update", resource: "brands", resourceLabel: "브랜드", target: data?.name, targetId: String(id) });
  return NextResponse.json(data);
}

// 기존 브랜드/제조사 관리 페이지가 사용하는 DELETE (body에 id 포함)
export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  const supabase = createAdminClient();
  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit({ action: "delete", resource: "brands", resourceLabel: "브랜드", targetId: String(id) });
  return NextResponse.json({ ok: true });
}
