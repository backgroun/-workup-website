import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createAdminClient, mapFromDb, mapToDb } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit-server";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createAdminClient();
  // Supabase(PostgREST) 기본 반환 상한이 1000행이라 등록 상품이 많으면 잘림 → 범위를 명시해 전체 조회
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .range(0, 9999);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map(mapFromDb));
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .insert(mapToDb(body))
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // 공개 제품 목록(/api/products)이 unstable_cache(tags:["products"])로 캐싱되므로 저장 즉시 갱신한다.
  revalidateTag("products", "max");
  await logAudit({
    action: "create",
    resource: "products",
    resourceLabel: "상품",
    target: data?.name ?? body?.name,
    targetId: data?.id,
  });
  return NextResponse.json(mapFromDb(data));
}
