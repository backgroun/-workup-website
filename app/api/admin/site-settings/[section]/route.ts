import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase-server";

async function isAuthed() {
  const store = await cookies();
  return store.get("wu-auth")?.value === (process.env.AUTH_TOKEN ?? "wu-session-ok");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ section: string }> }
) {
  const { section } = await params;
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
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
