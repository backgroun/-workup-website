import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit-server";

const VALID_TYPES = ["franchise", "wholesale", "support", "product"];

// 접수된 문의 목록 조회 (관리자)
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // 'franchise' | 'wholesale' | null(전체)

  const supabase = createAdminClient();
  // Supabase 기본 조회 상한(1000행)에 걸리지 않도록 명시적으로 범위를 넓힌다.
  let query = supabase.from("inquiries").select("*").order("created_at", { ascending: false }).range(0, 9999);
  if (type === "franchise" || type === "wholesale") query = query.eq("type", type);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// 여러 문의의 게시판 유형 일괄 변경 (관리자). body: { ids: string[], type }
export async function PATCH(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.ids) ? body.ids.filter((x: unknown) => typeof x === "string") : [];
  const type = body.type;

  if (!ids.length) return NextResponse.json({ error: "선택된 문의가 없습니다." }, { status: 400 });
  if (ids.length > 2000) return NextResponse.json({ error: "한 번에 이동할 수 있는 문의는 2000건까지입니다." }, { status: 400 });
  if (!VALID_TYPES.includes(type)) return NextResponse.json({ error: "잘못된 유형입니다." }, { status: 400 });

  const supabase = createAdminClient();
  // URL 길이 제한을 피하기 위해 id를 청크로 나눠 업데이트한다.
  const CHUNK = 100;
  let updated = 0;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const { error } = await supabase.from("inquiries").update({ type }).in("id", ids.slice(i, i + CHUNK));
    if (error) return NextResponse.json({ error: error.message, updated }, { status: 500 });
    updated += Math.min(CHUNK, ids.length - i);
  }
  await logAudit({
    action: "update",
    resource: "inquiries",
    resourceLabel: "문의",
    summary: `문의 ${updated}건 유형 변경 → ${type}`,
  });
  return NextResponse.json({ ok: true, updated });
}
