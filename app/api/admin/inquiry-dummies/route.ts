import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { makeDummy } from "@/data/inquiryDummy";
import { isAdmin } from "@/lib/admin-auth";

function connectedProjectRef() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/^https?:\/\//, "").split(".")[0] || "(NEXT_PUBLIC_SUPABASE_URL 미설정)";
}

// 더미 목록 + 총 개수 (관리자). ?type= 으로 유형별 조회.
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

// "YYYY-MM-DD" → 자정 ms (한국은 DST 없음). 형식 오류 시 null.
function parseDate(s: unknown): number | null {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const t = new Date(s + "T00:00:00").getTime();
  return Number.isNaN(t) ? null : t;
}

// 더미 추가.
//  - 기본:   { count, historical?, type } — historical=true 과거180일 분산, 아니면 '방금'.
//  - 기간형: { mode:"range", start, end, count, maxPerDay, type, clearFirst? }
//            start~end(포함) 사이에 하루 maxPerDay 이하로 랜덤 분산. clearFirst=true 면 해당 유형 먼저 삭제.
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const type = body.type === "franchise" || body.type === "wholesale" ? body.type : undefined;
  const supabase = createAdminClient();

  // 기존 [유형] 삭제 후 생성
  if (body.clearFirst && type) {
    const { error: delErr } = await supabase.from("inquiry_dummies").delete().eq("type", type);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  let rows: ReturnType<typeof makeDummy>[];

  if (body.mode === "range") {
    const start = parseDate(body.start);
    const end = parseDate(body.end);
    if (start === null || end === null || end < start) {
      return NextResponse.json({ error: "기간(시작일/종료일)이 올바르지 않습니다." }, { status: 400 });
    }
    const maxPerDay = Math.min(Math.max(1, Math.floor(Number(body.maxPerDay) || 5)), 50);
    const days = Math.floor((end - start) / 86400000) + 1; // 양끝 포함
    const capacity = days * maxPerDay;
    let count = Math.min(Math.max(1, Math.floor(Number(body.count) || 1)), 6000);
    if (count > capacity) count = capacity; // 하루 상한 때문에 다 못 담으면 용량까지만

    // 하루별 건수 랜덤 배분(상한 maxPerDay)
    const perDay = new Array<number>(days).fill(0);
    let remaining = count;
    let guard = count * 100 + 1000;
    while (remaining > 0 && guard-- > 0) {
      const day = Math.floor(Math.random() * days);
      if (perDay[day] < maxPerDay) { perDay[day]++; remaining--; }
    }

    rows = [];
    for (let day = 0; day < days; day++) {
      for (let k = 0; k < perDay[day]; k++) {
        // 그 날 09:00~20:00 사이 랜덤 시각
        const ms = start + day * 86400000 + (9 * 3600 + Math.floor(Math.random() * 11 * 3600)) * 1000 + Math.floor(Math.random() * 60000);
        rows.push(makeDummy({ createdAt: new Date(ms), type }));
      }
    }
  } else {
    const n = Math.min(Math.max(1, Number(body.count) || 1), 2000);
    const historical = !!body.historical;
    const now = Date.now();
    rows = Array.from({ length: n }, (_, i) => {
      const created = historical
        ? new Date(now - Math.floor(Math.random() * 180 * 86400 * 1000))
        : new Date(now - i * 53); // 살짝 stagger → 순서 안정
      return makeDummy({ createdAt: created, type });
    });
  }

  // 대량 삽입은 청크로(페이로드 안전)
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await supabase.from("inquiry_dummies").insert(rows.slice(i, i + CHUNK));
    if (error) return NextResponse.json({ error: error.message, added: i }, { status: 500 });
  }
  return NextResponse.json({ ok: true, added: rows.length });
}

// 더미 삭제 (관리자). ?id= 개별 / ?type= 유형 전체 / 없으면 전부.
export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
