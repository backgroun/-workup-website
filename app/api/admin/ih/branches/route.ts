import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { listBranchOptions } from "@/lib/ih/collabs";

// 방문 지점 / 지점 활동 등록 Dropdown용 — 활성 지점만 반환.
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const branches = await listBranchOptions();
    return NextResponse.json({ branches });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
