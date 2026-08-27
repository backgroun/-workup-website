import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getDistinctBranchMarketingContentFormats } from "@/lib/ih/collabs";

// GET /api/admin/ih/branch-marketing/facets — 목록 필터의 "콘텐츠 형태" Dropdown용, 실제 등록된 값만.
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const contentFormats = await getDistinctBranchMarketingContentFormats();
    return NextResponse.json({ contentFormats });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
