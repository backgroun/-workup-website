import { NextResponse } from "next/server";
import { isAdmin, getAdminMember } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit-server";
import { bulkUpsertSponsors, type IHSponsorBulkRow } from "@/lib/ih/collabs";

// POST /api/admin/ih/sponsors/import — Excel 파싱 결과(배열)를 신규 insert / ID 기준 수정(upsert).
// influencer_id 매칭(닉네임 → id)은 클라이언트에서 이미 끝낸 상태로 전달받는다(기존 매장 업로드와 동일 패턴).
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const rows = Array.isArray(body) ? (body as IHSponsorBulkRow[]) : [];
  if (rows.length === 0) return NextResponse.json({ error: "데이터가 없습니다." }, { status: 400 });

  try {
    const { inserted, updated } = await bulkUpsertSponsors(rows);
    const admin = await getAdminMember();
    await logAudit({
      action: updated > 0 && inserted === 0 ? "update" : "create",
      resource: "ih_sponsors",
      resourceLabel: "제품 협찬",
      summary: `제품 협찬 엑셀 업로드 — 신규 ${inserted}건 · 수정 ${updated}건`,
      actorName: admin?.name,
    });
    return NextResponse.json({ ok: true, count: inserted + updated, inserted, updated });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "업로드 중 오류가 발생했습니다." }, { status: 500 });
  }
}
