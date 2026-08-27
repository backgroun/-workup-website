import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { listBranchOptions } from "@/lib/ih/collabs";

// 방문 지점 / 지점 마케팅 등록 Dropdown용 — stores(고객용 매장) 중 활성 매장만 반환.
// 매장 자체의 등록/수정은 /admin/stores에서 하므로 여기서는 조회만 제공한다.
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const branches = await listBranchOptions();
    return NextResponse.json({ branches });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
