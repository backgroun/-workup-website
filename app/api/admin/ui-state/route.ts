import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { getAdminMember } from "@/lib/admin-auth";

// 관리자 UI 개인설정(즐겨찾기·열린 탭)을 로그인 계정(memberId) 기준으로 저장.
// site_settings 섹션명에 memberId를 포함해 계정별로 분리하되, memberId는 항상
// 세션 쿠키에서 서버가 직접 구한 값만 쓴다(클라이언트가 다른 계정 id를 보내 남의 설정을
// 읽거나 덮어쓰지 못하게 하기 위함 — URL/바디로 memberId를 받지 않는다).
function sectionFor(memberId: string | number) {
  return `admin_ui_${memberId}`;
}

export async function GET() {
  const member = await getAdminMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("config")
    .eq("section", sectionFor(member.id))
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data?.config ?? {});
}

export async function PUT(req: Request) {
  const member = await getAdminMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = await req.json();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("site_settings")
    .upsert(
      { section: sectionFor(member.id), config, updated_at: new Date().toISOString() },
      { onConflict: "section" }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
