import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin-auth";

// 접수된 문의 목록 조회 (관리자)
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // 'franchise' | 'wholesale' | null(전체)

  const supabase = createAdminClient();
  let query = supabase.from("inquiries").select("*").order("created_at", { ascending: false });
  if (type === "franchise" || type === "wholesale") query = query.eq("type", type);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
