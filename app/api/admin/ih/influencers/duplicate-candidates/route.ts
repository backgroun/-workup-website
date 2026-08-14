import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { listPendingDuplicateCandidates } from "@/lib/ih/influencers";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const items = await listPendingDuplicateCandidates();
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
