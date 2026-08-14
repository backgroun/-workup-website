import { NextResponse } from "next/server";
import { isAdmin, getAdminMember } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit-server";
import { createRate, type IHRateInput } from "@/lib/ih/rates";

// POST /api/admin/ih/influencers/[id]/rates — 단가 등록. 기존 행을 덮어쓰지 않고 항상 새 이력을 추가한다.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const influencerId = Number((await params).id);
  if (!Number.isFinite(influencerId)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const body = (await req.json()) as Omit<IHRateInput, "influencer_id">;
  try {
    const result = await createRate({ ...body, influencer_id: influencerId });
    if (!result.ok) return NextResponse.json({ error: "validation", fieldErrors: result.errors }, { status: 400 });

    const admin = await getAdminMember();
    await logAudit({
      action: "create",
      resource: "ih_influencer_rates",
      resourceLabel: "인플루언서 단가",
      targetId: result.rate.id,
      actorName: admin?.name,
    });
    return NextResponse.json(result.rate, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "저장 중 오류가 발생했습니다." }, { status: 500 });
  }
}
