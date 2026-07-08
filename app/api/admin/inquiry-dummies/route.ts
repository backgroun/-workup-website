import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { makeDummy } from "@/data/inquiryDummy";
import { isAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit-server";

function connectedProjectRef() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/^https?:\/\//, "").split(".")[0] || "(NEXT_PUBLIC_SUPABASE_URL 미설정)";
}

// 더미 목록 + 총 개수 (관리자). ?type= 으로 유형별 조회.
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createAdminClient();
  const { searchParams } = new URL(req.url);
  const tp = searchParams.get("type");
  const t = tp === "franchise" || tp === "wholesale" ? tp : null;
  const lq = supabase.from("inquiry_dummies").select("*").order("created_at", { ascending: false }).limit(50);
  const cq = supabase.from("inquiry_dummies").select("*", { count: "exact", head: true });
  const [{ data, error }, { count }] = await Promise.all([
    t ? lq.eq("type", t) : lq,
    t ? cq.eq("type", t) : cq,
  ]);
  if (error) return NextResponse.json({ error: error.message, project: connectedProjectRef() }, { status: 500 });
  return NextResponse.json({ items: data ?? [], total: count ?? 0 });
}

// 더미 추가 (수동 소량). { count?, type } — count 미지정 시 1개, 최대 100개.
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const type = body.type === "franchise" || body.type === "wholesale" ? body.type : undefined;
  const supabase = createAdminClient();

  const n = Math.min(Math.max(1, Math.floor(Number(body.count) || 1)), 100);
  const now = Date.now();
  const rows = Array.from({ length: n }, (_, i) => makeDummy({ createdAt: new Date(now - i * 53), type })); // 살짝 stagger → 순서 안정

  const { error } = await supabase.from("inquiry_dummies").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit({
    action: "create",
    resource: "inquiries",
    resourceLabel: "문의",
    summary: "문의 더미 생성",
  });
  return NextResponse.json({ ok: true, added: rows.length });
}

// 더미 삭제 (관리자). ?id= 개별 / ?type= 유형 전체 / 없으면 전부.
export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createAdminClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const tp = searchParams.get("type");
  const t = tp === "franchise" || tp === "wholesale" ? tp : null;
  const base = supabase.from("inquiry_dummies").delete();
  const q = id ? base.eq("id", id) : t ? base.eq("type", t) : base.not("id", "is", null);
  const { error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit({
    action: "delete",
    resource: "inquiries",
    resourceLabel: "문의",
    summary: "문의 더미 삭제",
  });
  return NextResponse.json({ ok: true });
}
