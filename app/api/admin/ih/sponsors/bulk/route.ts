import { NextResponse } from "next/server";
import { isAdmin, getAdminMember } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit-server";
import { bulkUpdateSponsors, type IHSponsorBulkPatch } from "@/lib/ih/collabs";

// PATCH /api/admin/ih/sponsors/bulk — 여러 협찬을 선택해 상태/발송일/조회수/비용 중 하나를 한 번에 변경.
export async function PATCH(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as {
    ids?: number[];
    status?: string;
    send_date?: string | null;
    views?: number | null;
    cost?: number | null;
  };
  const ids = Array.isArray(body.ids) ? body.ids.filter((n) => Number.isFinite(n)) : [];
  if (ids.length === 0) return NextResponse.json({ error: "선택된 협찬이 없습니다." }, { status: 400 });

  let patch: IHSponsorBulkPatch;
  let summary: string;
  if (body.status) {
    patch = { status: body.status };
    summary = `제품 협찬 ${ids.length}건 일괄 상태 변경 → ${body.status}`;
  } else if (body.send_date !== undefined) {
    patch = { send_date: body.send_date };
    summary = `제품 협찬 ${ids.length}건 일괄 발송일 변경 → ${body.send_date || "미정"}`;
  } else if (body.views !== undefined) {
    patch = { views: body.views };
    summary = `제품 협찬 ${ids.length}건 일괄 조회수 변경 → ${body.views ?? "미정"}`;
  } else if (body.cost !== undefined) {
    patch = { cost: body.cost };
    summary = `제품 협찬 ${ids.length}건 일괄 비용 변경 → ${body.cost ?? "미정"}`;
  } else {
    return NextResponse.json({ error: "변경할 값을 선택해주세요." }, { status: 400 });
  }

  try {
    const count = await bulkUpdateSponsors(ids, patch);
    const admin = await getAdminMember();
    await logAudit({
      action: "update",
      resource: "ih_sponsors",
      resourceLabel: "제품 협찬",
      summary,
      actorName: admin?.name,
    });
    return NextResponse.json({ ok: true, count });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "저장 중 오류가 발생했습니다." }, { status: 500 });
  }
}
