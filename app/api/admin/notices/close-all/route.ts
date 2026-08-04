import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { closeOpenNotices } from "@/lib/notices";

// "진행중"인 공지를 전부 "마감"으로 — 마감 관리 화면의 "지금 전체 마감하기" 전용.
export async function POST() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows = await closeOpenNotices({ manual: true });
    return NextResponse.json({ closed: rows.length });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
