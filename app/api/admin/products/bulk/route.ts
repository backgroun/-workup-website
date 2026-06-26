import { NextResponse } from "next/server";
import { createAdminClient, mapToDb } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit-server";

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!Array.isArray(body) || body.length === 0) {
    return NextResponse.json({ error: "빈 데이터입니다." }, { status: 400 });
  }
  if (body.length > 500) {
    return NextResponse.json({ error: "한 번에 최대 500개까지 가져올 수 있습니다." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const rows = body.map(mapToDb);

  const { data, error } = await supabase
    .from("products")
    .upsert(rows, { onConflict: "id" })
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, count: data?.length ?? 0 });
}
