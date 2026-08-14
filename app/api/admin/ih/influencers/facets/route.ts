import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getDistinctContentTypes } from "@/lib/ih/influencers";

// 콘텐츠 필터 Dropdown 옵션 — 현재 DB에 실제 등록된 값만 반환한다(임의 목록 아님).
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const contentTypes = await getDistinctContentTypes();
    return NextResponse.json({ contentTypes });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
