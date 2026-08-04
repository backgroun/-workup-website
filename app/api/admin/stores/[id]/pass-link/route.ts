import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit-server";

type Params = { params: Promise<{ id: string }> };

// 지점 전용 패스 링크 토큰 재발급 — 기존 링크는 즉시 무효화된다.
export async function POST(_req: Request, { params }: Params) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const token = randomBytes(6).toString("hex");
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("stores")
    .update({ pass_link_token: token })
    .eq("id", id)
    .select("id, name, pass_link_token")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit({
    action: "update",
    resource: "stores",
    resourceLabel: "지점 링크",
    target: data?.name,
    targetId: id,
  });
  return NextResponse.json(data);
}

// 담당자명만 부분 수정 — 다른 매장 정보(주소·전화 등)는 건드리지 않는다.
export async function PATCH(req: Request, { params }: Params) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("stores")
    .update({ manager_name: body.manager_name ?? null })
    .eq("id", id)
    .select("id, name, manager_name")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
