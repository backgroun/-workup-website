import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin-auth";

// 지점 출고 패스(공지)에 실제로 한 번이라도 쓰인 상품 id 목록.
// products.registration_status 컬럼은 과거 ALTER TABLE 기본값(DEFAULT '임시등록') 탓에
// 출고 패스와 무관한 옛 상품에도 잘못 남아있을 수 있어, "진짜 임시등록 상품"인지 판단할 땐
// registration_status 값 단독이 아니라 반드시 이 목록과 함께(교집합으로) 확인해야 한다.
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = createAdminClient();
  const { data, error } = await sb.from("notices").select("product_id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json([...new Set((data ?? []).map((n) => n.product_id))]);
}
