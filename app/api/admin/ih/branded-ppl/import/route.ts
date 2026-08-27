import { NextResponse } from "next/server";
import { isAdmin, getAdminMember } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit-server";
import { bulkUpsertBrandedPpl, type IHBrandedPplBulkRow } from "@/lib/ih/collabs";

// POST /api/admin/ih/branded-ppl/import — Excel 파싱 결과(배열)를 신규 insert / ID 기준 수정(upsert).
// 인플루언서 FK가 없는 자유 텍스트 구조라 닉네임 매칭 같은 사전 조회가 필요 없다.
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const rows = Array.isArray(body) ? (body as IHBrandedPplBulkRow[]) : [];
  if (rows.length === 0) return NextResponse.json({ error: "데이터가 없습니다." }, { status: 400 });

  try {
    const { inserted, updated } = await bulkUpsertBrandedPpl(rows);
    const admin = await getAdminMember();
    await logAudit({
      action: updated > 0 && inserted === 0 ? "update" : "create",
      resource: "ih_branded_ppl",
      resourceLabel: "브랜디드 PPL",
      summary: `브랜디드 PPL 엑셀 업로드 — 신규 ${inserted}건 · 수정 ${updated}건`,
      actorName: admin?.name,
    });
    return NextResponse.json({ ok: true, count: inserted + updated, inserted, updated });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "업로드 중 오류가 발생했습니다." }, { status: 500 });
  }
}
