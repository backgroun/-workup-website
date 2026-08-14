import { NextResponse } from "next/server";
import { isAdmin, getAdminMember } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit-server";
import { listInfluencerMemos, createInfluencerMemo } from "@/lib/ih/memos";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const influencerId = Number((await params).id);
  if (!Number.isFinite(influencerId)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const memos = await listInfluencerMemos(influencerId);
  return NextResponse.json({ memos });
}

// POST { content } — ih_influencers.memo(단일 필드)는 건드리지 않고 별도 이력에 추가만 한다.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const influencerId = Number((await params).id);
  if (!Number.isFinite(influencerId)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const body = await req.json();
  try {
    const result = await createInfluencerMemo(influencerId, body?.content ?? "");
    if (!result.ok) return NextResponse.json({ error: "validation", fieldErrors: result.errors }, { status: 400 });

    const admin = await getAdminMember();
    await logAudit({
      action: "create",
      resource: "ih_influencer_memos",
      resourceLabel: "인플루언서 메모",
      targetId: result.memo.id,
      actorName: admin?.name,
    });
    return NextResponse.json(result.memo, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "메모 이력 테이블이 아직 준비되지 않았습니다(migration 필요)." },
      { status: 500 }
    );
  }
}
