import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase-server";
import { makeDummy } from "@/data/inquiryDummy";

async function isAuthed() {
  const store = await cookies();
  return store.get("wu-auth")?.value === (process.env.AUTH_TOKEN ?? "wu-session-ok");
}
function connectedProjectRef() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/^https?:\/\//, "").split(".")[0] || "(NEXT_PUBLIC_SUPABASE_URL 미설정)";
}

// 더미 목록 + 총 개수 (관리자). ?type= 으로 유형별 조회.
export async function GET(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createAdminClient();
  const { searchParams } = new URL(req.url);
  const tp = searchParams.get("type");
  const t = tp === "franchise" || tp === "wholesale" ? tp : null;
  const lq = supabase.from("inquiry_dummies").select("*").order("created_at", { ascending: false }).limit(50);
  const cq = supabase.from("inquiry_dummies").select("*", { count: "exact", head: true });
  const [{ data, error }, { count }] = await Promise.all([
    t ? lq.eq("type", t) : lq,
    t ? cq.eq("type", t) : cq,
  ]);
  if (error) return NextResponse.json({ error: error.message, project: connectedProjectRef() }, { status: 500 });
  return NextResponse.json({ items: data ?? [], total: count ?? 0 });
}

// 더미 추가. body: { count?: number, historical?: boolean }
//  historical=true → 과거 180일에 분산(초기 1000개 시드용), 아니면 '방금'(상단에 올라옴).
export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const n = Math.min(Math.max(1, Number(body.count) || 1), 2000);
  const historical = !!body.historical;
  const type = body.type === "franchise" || body.type === "wholesale" ? body.type : undefined;
  const now = Date.now();

  const rows = Array.from({ length: n }, (_, i) => {
    const created = historical
      ? new Date(now - Math.floor(Math.random() * 180 * 86400 * 1000))
      : new Date(now - i * 53); // 살짝 stagger → 순서 안정
    return makeDummy({ createdAt: created, type });
  });

  const supabase = createAdminClient();
  const { error } = await supabase.from("inquiry_dummies").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, added: n });
}

// 더미 삭제 (관리자). ?id= 개별 / ?type= 유형 전체 / 없으면 전부.
export async function DELETE(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createAdminClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const tp = searchParams.get("type");
  const t = tp === "franchise" || tp === "wholesale" ? tp : null;
  const base = supabase.from("inquiry_dummies").delete();
  const q = id ? base.eq("id", id) : t ? base.eq("type", t) : base.not("id", "is", null);
  const { error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
