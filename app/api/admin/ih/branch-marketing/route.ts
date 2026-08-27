import { NextResponse } from "next/server";
import { isAdmin, getAdminMember } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit-server";
import { searchBranchMarketing, createBranchActivity, type IHBranchActivityInput } from "@/lib/ih/collabs";

// GET /api/admin/ih/branch-marketing?branchId=&influencerQ=&operationType=&status=&contentFormat=&dateFrom=&dateTo=&page=&pageSize=
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  const num = (k: string) => (sp.get(k) ? Number(sp.get(k)) : undefined);

  try {
    const result = await searchBranchMarketing({
      branchId: num("branchId"),
      influencerQ: sp.get("influencerQ") ?? undefined,
      operationType: sp.get("operationType") ?? undefined,
      status: sp.get("status") ?? undefined,
      contentFormat: sp.get("contentFormat") ?? undefined,
      dateFrom: sp.get("dateFrom") ?? undefined,
      dateTo: sp.get("dateTo") ?? undefined,
      page: num("page"),
      pageSize: num("pageSize"),
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// POST /api/admin/ih/branch-marketing — 지점 마케팅 등록(운영구분에 따라 activity_type을 GENERAL/INFLUENCER_VISIT로 저장).
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as IHBranchActivityInput;

  try {
    const result = await createBranchActivity(body);
    if (!result.ok) return NextResponse.json({ error: "validation", fieldErrors: result.errors }, { status: 400 });

    const admin = await getAdminMember();
    await logAudit({
      action: "create",
      resource: "ih_branch_marketing",
      resourceLabel: "지점 마케팅",
      targetId: result.activity.id,
      actorName: admin?.name,
    });
    return NextResponse.json(result.activity, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "저장 중 오류가 발생했습니다." }, { status: 500 });
  }
}
