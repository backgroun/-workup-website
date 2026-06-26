import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin-auth";

// 공개 GET이 막혀선 안 되는 섹션(팝업·기획전·카테고리 등은 클라이언트에서 조회)과 달리,
// 민감 정보가 담긴 섹션은 관리자만 읽을 수 있게 한다.
const SENSITIVE_SECTIONS = new Set(["notifications"]);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ section: string }> }
) {
  const { section } = await params;
  if (SENSITIVE_SECTIONS.has(section) && !(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("config")
    .eq("section", section)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data?.config ?? null);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ section: string }> }
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { section } = await params;
  const config = await req.json();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("site_settings")
    .upsert({ section, config, updated_at: new Date().toISOString() }, { onConflict: "section" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // 캐시된 섹션(예: 탑바)을 즉시 갱신 — getTopbarConfig 가 tags:["topbar"]로 캐싱됨.
  // Next 16: 라우트 핸들러에서는 revalidateTag(tag, "max") 형태로 호출(updateTag 는 서버액션 전용).
  revalidateTag(section, "max");
  return NextResponse.json({ ok: true });
}
