import { NextResponse } from "next/server";
import { isAdmin, getAdminMember } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit-server";
import {
  getInfluencerDetail,
  updateInfluencer,
  updateInfluencerStatus,
  type IHInfluencerInput,
  type IHInfluencerStatus,
} from "@/lib/ih/influencers";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const detail = await getInfluencerDetail(id);
  if (!detail) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(detail);
}

// PATCH: 전체 필드 수정({ ...input }) 또는 상태만 변경({ status })
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const body = await req.json();
  const admin = await getAdminMember();

  try {
    if (body && typeof body === "object" && Object.keys(body).length === 1 && "status" in body) {
      const updated = await updateInfluencerStatus(id, body.status as IHInfluencerStatus);
      if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
      await logAudit({
        action: "update",
        resource: "ih_influencers",
        resourceLabel: "인플루언서",
        target: updated.nickname,
        targetId: updated.id,
        summary: `인플루언서 '${updated.nickname}' 상태를 ${body.status}(으)로 변경`,
        actorName: admin?.name,
      });
      return NextResponse.json(updated);
    }

    const result = await updateInfluencer(id, body as IHInfluencerInput);
    if (!result.ok) {
      if (result.reason === "validation") {
        return NextResponse.json({ error: "validation", fieldErrors: result.errors }, { status: 400 });
      }
      if (result.reason === "duplicate") {
        return NextResponse.json(
          {
            error: "duplicate",
            message: "이미 등록된 인플루언서입니다.",
            existing: { id: result.existing.id, nickname: result.existing.nickname },
          },
          { status: 409 }
        );
      }
      if (result.reason === "not_found") return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (result.ok) {
      await logAudit({
        action: "update",
        resource: "ih_influencers",
        resourceLabel: "인플루언서",
        target: result.influencer.nickname,
        targetId: result.influencer.id,
        actorName: admin?.name,
      });
      return NextResponse.json(result.influencer);
    }
    return NextResponse.json({ error: "unknown" }, { status: 500 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "저장 중 오류가 발생했습니다." }, { status: 500 });
  }
}
