import { NextResponse } from "next/server";
import { isAdmin, getAdminMember } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit-server";
import { bulkUpdateBrandedPpl, type IHBrandedPplBulkPatch } from "@/lib/ih/collabs";

// PATCH /api/admin/ih/branded-ppl/bulk — 여러 브랜디드 PPL을 선택해 상태/구분/단가 중 하나를 한 번에 변경.
export async function PATCH(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as {
    ids?: number[];
    status?: string;
    category?: string;
    cost?: number | null;
  };
  const ids = Array.isArray(body.ids) ? body.ids.filter((n) => Number.isFinite(n)) : [];
  if (ids.length === 0) return NextResponse.json({ error: "선택된 항목이 없습니다." }, { status: 400 });

  let patch: IHBrandedPplBulkPatch;
  let summary: string;
  if (body.status) {
    patch = { status: body.status };
    summary = `브랜디드 PPL ${ids.length}건 일괄 상태 변경 → ${body.status}`;
  } else if (body.category) {
    patch = { category: body.category };
    summary = `브랜디드 PPL ${ids.length}건 일괄 구분 변경 → ${body.category}`;
  } else if (body.cost !== undefined) {
    patch = { cost: body.cost };
    summary = `브랜디드 PPL ${ids.length}건 일괄 단가 변경 → ${body.cost ?? "미정"}`;
  } else {
    return NextResponse.json({ error: "변경할 값을 선택해주세요." }, { status: 400 });
  }

  try {
    const count = await bulkUpdateBrandedPpl(ids, patch);
    const admin = await getAdminMember();
    await logAudit({
      action: "update",
      resource: "ih_branded_ppl",
      resourceLabel: "브랜디드 PPL",
      summary,
      actorName: admin?.name,
    });
    return NextResponse.json({ ok: true, count });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "저장 중 오류가 발생했습니다." }, { status: 500 });
  }
}
