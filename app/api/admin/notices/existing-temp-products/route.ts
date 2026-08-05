import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin-auth";

// "기존 상품에서 선택" 목록 — 지점 출고 패스로 이전에 등록했던 마감패스 전용 상품(temp_name)만,
// 이름 기준으로 중복 제거해 최신순으로 보여준다. products 테이블과는 무관하다.
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("notices")
    .select("temp_name, temp_image_url, temp_tagline, created_at")
    .not("temp_name", "is", null)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const seen = new Set<string>();
  const result: { temp_name: string; temp_image_url: string | null; temp_tagline: string | null }[] = [];
  for (const row of data ?? []) {
    if (!row.temp_name || seen.has(row.temp_name)) continue;
    seen.add(row.temp_name);
    result.push({ temp_name: row.temp_name, temp_image_url: row.temp_image_url, temp_tagline: row.temp_tagline });
  }
  return NextResponse.json(result);
}
