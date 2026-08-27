import { NextResponse } from "next/server";
import { isAdmin, getAdminMember } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit-server";
import { searchInfluencers, createInfluencer, type IHInfluencerInput } from "@/lib/ih/influencers";

// GET /api/admin/ih/influencers?q=&channel=&contentType=&region=&followerMin=&followerMax=&status=&tag=&page=&pageSize=
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  const num = (k: string) => (sp.get(k) ? Number(sp.get(k)) : undefined);

  try {
    const result = await searchInfluencers({
      q: sp.get("q") ?? undefined,
      channel: sp.get("channel") ?? undefined,
      contentType: sp.get("contentType") ?? undefined,
      region: sp.get("region") ?? undefined,
      followerMin: num("followerMin"),
      followerMax: num("followerMax"),
      costMin: num("costMin"),
      costMax: num("costMax"),
      status: sp.get("status") ?? undefined,
      tag: sp.get("tag") ?? undefined,
      page: num("page"),
      pageSize: num("pageSize"),
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// POST /api/admin/ih/influencers — 신규 등록. 정확 일치 중복이면 409로 기존 레코드를 안내한다.
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as IHInfluencerInput;

  try {
    const result = await createInfluencer(body);
    if (!result.ok) {
      if (result.reason === "validation") {
        return NextResponse.json({ error: "validation", fieldErrors: result.errors }, { status: 400 });
      }
      if (result.reason === "duplicate") {
        // 중복 안내 UI에는 id/닉네임만 필요 — 기존 레코드의 개인정보까지 응답에 담지 않는다.
        return NextResponse.json(
          {
            error: "duplicate",
            message: "이미 등록된 인플루언서입니다.",
            existing: { id: result.existing.id, nickname: result.existing.nickname },
          },
          { status: 409 }
        );
      }
    }
    if (result.ok) {
      const admin = await getAdminMember();
      await logAudit({
        action: "create",
        resource: "ih_influencers",
        resourceLabel: "인플루언서",
        target: result.influencer.nickname,
        targetId: result.influencer.id,
        actorName: admin?.name,
      });
      return NextResponse.json(result.influencer, { status: 201 });
    }
    return NextResponse.json({ error: "unknown" }, { status: 500 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "저장 중 오류가 발생했습니다." }, { status: 500 });
  }
}
