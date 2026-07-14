import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export const revalidate = 0;

// 공개 API — 상품 검색에서 브랜드 한글 검색명을 매칭하기 위해 이름 목록만 노출 (인증 불필요)
export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("brands").select("name, name_ko");
  if (error) return NextResponse.json([]);
  return NextResponse.json(data ?? []);
}
