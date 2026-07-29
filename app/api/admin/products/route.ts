import { NextResponse } from "next/server";
import { createAdminClient, mapFromDb, mapToDb } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit-server";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createAdminClient();
  // Supabase(PostgREST)는 .range()로 큰 범위를 요청해도 프로젝트의 최대 응답 행수(기본 1000)를
  // 넘으면 응답을 조용히 잘라버린다. 상품이 1000개를 넘으면 뒤쪽(정렬상 뒤 순번)이 누락되므로
  // 1000개씩 나눠 끝까지 가져와 합친다.
  const PAGE = 1000;
  const products = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) break;
    products.push(...data.map(mapFromDb));
    if (data.length < PAGE) break;
  }
  return NextResponse.json(products);
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
  await logAudit({
    action: "create",
    resource: "products",
    resourceLabel: "상품",
    target: data?.name ?? body?.name,
    targetId: data?.id,
  });
  return NextResponse.json(mapFromDb(data));
}
