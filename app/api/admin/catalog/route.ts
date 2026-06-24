import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase-server";

async function isAuthed() {
  const store = await cookies();
  return store.get("wu-auth")?.value === (process.env.AUTH_TOKEN ?? "wu-session-ok");
}

// 앱이 실제로 연결된 Supabase 프로젝트 ref (진단용 — NEXT_PUBLIC_ 값이라 비밀 아님)
function connectedProjectRef() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
    .replace(/^https?:\/\//, "")
    .split(".")[0] || "(NEXT_PUBLIC_SUPABASE_URL 미설정)";
}

// 카탈로그 페이지 전체 조회 (순서대로)
export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("catalog_pages")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (error) {
    // 실제 에러 메시지 + 연결 프로젝트를 함께 반환해 원인 진단을 돕는다.
    return NextResponse.json(
      { error: error.message, project: connectedProjectRef() },
      { status: 500 }
    );
  }
  return NextResponse.json(data ?? []);
}

// 카탈로그 페이지 생성
export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("catalog_pages")
    .insert(body)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
