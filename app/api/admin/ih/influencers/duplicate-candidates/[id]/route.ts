import { NextResponse } from "next/server";
import { isAdmin, getAdminMember } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit-server";
import { resolveDuplicateCandidate } from "@/lib/ih/influencers";

// PATCH { decision: "same" | "different" } — 실제 데이터 병합은 하지 않고 검수 상태만 변경한다.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const body = await req.json();
  const decision = body?.decision;
  if (decision !== "same" && decision !== "different") {
    return NextResponse.json({ error: "decision must be 'same' or 'different'" }, { status: 400 });
  }

  const admin = await getAdminMember();
  try {
    const updated = await resolveDuplicateCandidate(id, decision, admin?.id);
    if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
    await logAudit({
      action: "update",
      resource: "ih_influencer_duplicate_candidates",
      resourceLabel: "인플루언서 중복 검수",
      targetId: id,
      summary: `중복 후보 #${id} 검수 결과: ${decision === "same" ? "동일 인물" : "다른 인물"}`,
      actorName: admin?.name,
    });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
