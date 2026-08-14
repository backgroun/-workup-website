import { NextResponse } from "next/server";
import { isAdmin, getAdminMember } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit-server";
import { createBranchActivity, type IHBranchActivityInput } from "@/lib/ih/collabs";

// POST /api/admin/ih/influencers/[id]/branch-activities
// "일반 지점 활동"과 "방문 인플루언서"를 모두 여기서 등록한다(body.activity_type로 구분).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const influencerId = Number((await params).id);
  if (!Number.isFinite(influencerId)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const body = (await req.json()) as Omit<IHBranchActivityInput, "influencer_id">;
  try {
    const result = await createBranchActivity({ ...body, influencer_id: influencerId });
    if (!result.ok) return NextResponse.json({ error: "validation", fieldErrors: result.errors }, { status: 400 });

    const admin = await getAdminMember();
    await logAudit({
      action: "create",
      resource: "ih_branch_marketing",
      resourceLabel: body.activity_type === "INFLUENCER_VISIT" ? "방문 인플루언서" : "지점 활동",
      targetId: result.activity.id,
      actorName: admin?.name,
    });
    return NextResponse.json(result.activity, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "저장 중 오류가 발생했습니다." }, { status: 500 });
  }
}
