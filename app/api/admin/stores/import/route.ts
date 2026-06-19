import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase-server";
import { stores as staticStores } from "@/data/stores";

async function isAuthed() {
  const store = await cookies();
  const token = store.get("wu-auth")?.value;
  return token === (process.env.AUTH_TOKEN ?? "wu-session-ok");
}

// POST /api/admin/stores/import — Excel 파싱 결과(배열)를 upsert
export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  // seed=true 이면 data/stores.ts 정적 데이터를 upsert (중복 방지)
  if (body.seed === true) {
    const supabase = createAdminClient();
    const rows = staticStores.map((s, i) => ({
      id: s.id,
      name: s.name,
      region: extractRegion(s.address),
      address: s.address,
      lat: s.lat ?? null,
      lng: s.lng ?? null,
      hours: s.hours ?? "",
      phone: s.phone ?? "",
      description: "",
      image_urls: [],
      brands: [],
      parking: false,
      is_active: true,
      store_type: inferType(s.name),
      kakao_channel_url: "",
      store_url: "",
      sort_order: i + 1,
    }));
    const { error } = await supabase.from("stores").upsert(rows, { onConflict: "id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    // 시퀀스를 마지막 id 이후로 재설정
    await supabase.rpc("setval_stores_seq", { val: staticStores.length });
    return NextResponse.json({ ok: true, count: rows.length });
  }

  // 일반 Excel 업로드
  const rows = Array.isArray(body) ? body : [];
  if (rows.length === 0) return NextResponse.json({ error: "데이터가 없습니다." }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from("stores").insert(
    rows.map((r: Record<string, unknown>, i: number) => ({
      name: r.name,
      region: r.region ?? extractRegion(String(r.address ?? "")),
      address: r.address,
      lat: r.lat ? Number(r.lat) : null,
      lng: r.lng ? Number(r.lng) : null,
      hours: r.hours ?? "",
      phone: r.phone ?? "",
      description: r.description ?? "",
      image_urls: [],
      brands: r.brands ? String(r.brands).split(";").map((b: string) => b.trim()).filter(Boolean) : [],
      parking: String(r.parking).toLowerCase() === "true" || String(r.parking) === "1",
      is_active: String(r.is_active).toLowerCase() !== "false",
      store_type: r.store_type ?? "직영점",
      kakao_channel_url: r.kakao_channel_url ?? "",
      store_url: r.store_url ?? "",
      sort_order: i,
    }))
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, count: rows.length });
}

function extractRegion(address: string): string {
  const m = address.match(/^(서울|부산|대구|인천|광주|대전|울산|세종|경기도?|강원도?|충북|충청북도|충남|충청남도|전북|전라북도|전남|전라남도|경북|경상북도|경남|경상남도|제주도?)/);
  if (!m) return "";
  const r = m[1];
  if (r.startsWith("경기")) return "경기";
  if (r.startsWith("강원")) return "강원";
  if (r.startsWith("충북") || r.startsWith("충청북")) return "충북";
  if (r.startsWith("충남") || r.startsWith("충청남")) return "충남";
  if (r.startsWith("전북") || r.startsWith("전라북")) return "전북";
  if (r.startsWith("전남") || r.startsWith("전라남")) return "전남";
  if (r.startsWith("경북") || r.startsWith("경상북")) return "경북";
  if (r.startsWith("경남") || r.startsWith("경상남")) return "경남";
  if (r.startsWith("제주")) return "제주";
  return r;
}

function inferType(name: string): string {
  if (name.includes("모다아울렛") || name.includes("아울렛")) return "아울렛";
  if (name.includes("직영")) return "직영점";
  return "대리점";
}
