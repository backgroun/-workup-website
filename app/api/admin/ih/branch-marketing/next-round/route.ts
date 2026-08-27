import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getNextBranchMarketingRound } from "@/lib/ih/collabs";

// 등록 폼에서 "다음 회차"를 미리 보여주기 위한 조회용(실제 저장값은 등록 시 서버에서 다시 계산).
export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const influencerId = Number(req.nextUrl.searchParams.get("influencerId"));
  if (!Number.isFinite(influencerId)) return NextResponse.json({ error: "invalid influencerId" }, { status: 400 });
  try {
    const round = await getNextBranchMarketingRound(influencerId);
    return NextResponse.json({ round });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
