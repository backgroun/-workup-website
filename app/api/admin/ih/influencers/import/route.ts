import { NextResponse } from "next/server";
import { isAdmin, getAdminMember } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit-server";
import { bulkImportInfluencers, type IHInfluencerBulkRow } from "@/lib/ih/influencers";

// POST /api/admin/ih/influencers/import — Excel 파싱 결과(배열)를 신규 등록 / ID 기준 수정.
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const rowsRaw = Array.isArray(body) ? (body as { rowNum: number; input: IHInfluencerBulkRow }[]) : [];
  if (rowsRaw.length === 0) return NextResponse.json({ error: "데이터가 없습니다." }, { status: 400 });

  try {
    const { inserted, updated, failed } = await bulkImportInfluencers(rowsRaw);
    const admin = await getAdminMember();
    await logAudit({
      action: updated > 0 && inserted === 0 ? "update" : "create",
      resource: "ih_influencers",
      resourceLabel: "인플루언서",
      summary: `인플루언서 엑셀 업로드 — 신규 ${inserted}건 · 수정 ${updated}건 · 실패 ${failed.length}건`,
      actorName: admin?.name,
    });
    return NextResponse.json({ ok: true, count: inserted + updated, inserted, updated, failed });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "업로드 중 오류가 발생했습니다." }, { status: 500 });
  }
}
