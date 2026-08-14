import { NextResponse } from "next/server";
import { isAdmin, getAdminMember } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit-server";
import { createSponsor, type IHSponsorInput } from "@/lib/ih/collabs";

// POST /api/admin/ih/influencers/[id]/sponsors — "제품 협찬 메이트" 등록. influencer_id는 URL로 고정한다.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const influencerId = Number((await params).id);
  if (!Number.isFinite(influencerId)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const body = (await req.json()) as Omit<IHSponsorInput, "influencer_id">;
  try {
    const result = await createSponsor({ ...body, influencer_id: influencerId });
    if (!result.ok) return NextResponse.json({ error: "validation", fieldErrors: result.errors }, { status: 400 });

    const admin = await getAdminMember();
    await logAudit({
      action: "create",
      resource: "ih_sponsors",
      resourceLabel: "제품 협찬",
      target: result.sponsor.product,
      targetId: result.sponsor.id,
      actorName: admin?.name,
    });
    return NextResponse.json(result.sponsor, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "저장 중 오류가 발생했습니다." }, { status: 500 });
  }
}
