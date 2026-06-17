import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase-server";

async function isAuthed() {
  const store = await cookies();
  return store.get("wu-auth")?.value === (process.env.AUTH_TOKEN ?? "wu-session-ok");
}

function connectedProjectRef() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
    .replace(/^https?:\/\//, "").split(".")[0] || "(NEXT_PUBLIC_SUPABASE_URL 미설정)";
}

// 브랜드 카탈로그 전체 조회 (순서대로)
export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("brand_catalogs")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (error) return NextResponse.json({ error: error.message, project: connectedProjectRef() }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// 브랜드 카탈로그 생성
export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("brand_catalogs").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
