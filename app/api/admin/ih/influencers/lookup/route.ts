import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { listInfluencerNicknameIndex } from "@/lib/ih/collabs";

// GET /api/admin/ih/influencers/lookup — 전체 인플루언서 id/닉네임만 가볍게 반환.
// 제품 협찬 Excel 업로드에서 "닉네임" 컬럼을 influencer_id로 매칭하는 데 사용한다.
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const influencers = await listInfluencerNicknameIndex();
    return NextResponse.json({ influencers });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
