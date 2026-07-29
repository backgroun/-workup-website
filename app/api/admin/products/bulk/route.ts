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
  if (body.length > 1000) {
    return NextResponse.json({ error: "한 번에 최대 1000개까지 가져올 수 있습니다." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const rows = body.map(mapToDb);

  // 같은 id(상품명 슬러그)가 배치 안에 두 번 있으면 upsert가 "ON CONFLICT DO UPDATE ... cannot affect row a second time"로 전체가 실패한다.
  // 클라이언트(엑셀 업로드 미리보기)에서 미리 걸러내지만, 다른 경로로 들어올 경우를 대비해 서버에서도 명확한 오류로 막는다.
  const idCounts = new Map<string, number>();
  rows.forEach((r) => { if (r.id) idCounts.set(r.id, (idCounts.get(r.id) ?? 0) + 1); });
  const dupIds = [...idCounts.entries()].filter(([, n]) => n > 1).map(([id]) => id);
  if (dupIds.length > 0) {
    return NextResponse.json(
      { error: `상품명이 같아 동일하게 처리되는 항목이 있습니다: ${dupIds.join(", ")}` },
      { status: 400 },
    );
  }

  // 이미 등록된 상품(같은 id=상품명 슬러그)은 절대 덮어쓰지 않는다 — upsert 대신 insert만 사용하고,
  // 사전에 기존 id와 겹치는 행이 있는지 확인해 명확한 오류로 걸러낸다(클라이언트 미리보기에서도 걸러지지만 서버에서 최종 보장).
  // ids가 많으면 .in() 쿼리의 URL이 너무 길어져 400 Bad Request가 나므로 청크로 나눠 조회한다.
  const ids = rows.map((r) => r.id).filter(Boolean) as string[];
  const ID_CHUNK = 200;
  const existing: { id: string; name: string | null }[] = [];
  for (let i = 0; i < ids.length; i += ID_CHUNK) {
    const chunk = ids.slice(i, i + ID_CHUNK);
    const { data, error: existingErr } = await supabase
      .from("products")
      .select("id, name")
      .in("id", chunk);
    if (existingErr) return NextResponse.json({ error: existingErr.message }, { status: 500 });
    if (data) existing.push(...data);
  }
  if (existing.length > 0) {
    const names = existing.map((p) => p.name ?? p.id).join(", ");
    return NextResponse.json(
      { error: `이미 등록된 상품과 이름이 같아 건너뜁니다(덮어쓰기 방지): ${names}` },
      { status: 409 },
    );
  }

  const { data, error } = await supabase
    .from("products")
    .insert(rows)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit({
    action: "create",
    resource: "products",
    resourceLabel: "상품",
    summary: `상품 ${data?.length ?? rows.length}건 일괄 등록`,
  });
  return NextResponse.json({ ok: true, count: data?.length ?? 0 });
}
