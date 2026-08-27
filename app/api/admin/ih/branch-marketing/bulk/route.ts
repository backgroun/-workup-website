import { NextResponse } from "next/server";
import { isAdmin, getAdminMember } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit-server";
import { bulkUpdateBranchMarketing, type IHBranchMarketingBulkPatch } from "@/lib/ih/collabs";

// PATCH /api/admin/ih/branch-marketing/bulk — 여러 지점 마케팅을 선택해 상태/상태 날짜/조회수/반응수/비용 중 하나를 한 번에 변경.
export async function PATCH(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as {
    ids?: number[];
    status?: string;
    support_date?: string | null;
    views?: number | null;
    reactions?: number | null;
    cost?: number | null;
  };
  const ids = Array.isArray(body.ids) ? body.ids.filter((n) => Number.isFinite(n)) : [];
  if (ids.length === 0) return NextResponse.json({ error: "선택된 지점 마케팅이 없습니다." }, { status: 400 });

  let patch: IHBranchMarketingBulkPatch;
  let summary: string;
  if (body.status) {
    patch = { status: body.status };
    summary = `지점 마케팅 ${ids.length}건 일괄 상태 변경 → ${body.status}`;
  } else if (body.support_date !== undefined) {
    patch = { support_date: body.support_date };
    summary = `지점 마케팅 ${ids.length}건 일괄 상태 날짜 변경 → ${body.support_date || "미정"}`;
  } else if (body.views !== undefined) {
    patch = { views: body.views };
    summary = `지점 마케팅 ${ids.length}건 일괄 조회수 변경 → ${body.views ?? "미정"}`;
  } else if (body.reactions !== undefined) {
    patch = { reactions: body.reactions };
    summary = `지점 마케팅 ${ids.length}건 일괄 반응수 변경 → ${body.reactions ?? "미정"}`;
  } else if (body.cost !== undefined) {
    patch = { cost: body.cost };
    summary = `지점 마케팅 ${ids.length}건 일괄 비용 변경 → ${body.cost ?? "미정"}`;
  } else {
    return NextResponse.json({ error: "변경할 값을 선택해주세요." }, { status: 400 });
  }

  try {
    const count = await bulkUpdateBranchMarketing(ids, patch);
    const admin = await getAdminMember();
    await logAudit({
      action: "update",
      resource: "ih_branch_marketing",
      resourceLabel: "지점 마케팅",
      summary,
      actorName: admin?.name,
    });
    return NextResponse.json({ ok: true, count });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "저장 중 오류가 발생했습니다." }, { status: 500 });
  }
}
