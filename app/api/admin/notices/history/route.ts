import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin-auth";

// 전체 공지 오픈/마감 이력 (마감 관리 화면 전용 — 개별 공지가 아니라 전사 단위 변경 이력)
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("audit_logs")
    .select("summary, actor_name, created_at")
    .eq("resource", "notices")
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
