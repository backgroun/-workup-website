import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-server";
import { logAudit } from "@/lib/audit-server";

// POST /api/admin/notices/close-by-date?date=YYYY-MM-DD
// 특정 날짜의 "진행중" 공지를 모두 "마감"으로 전환
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date 파라미터가 필요합니다." }, { status: 400 });
  }

  const sb = createAdminClient();
  const { data, error } = await sb
    .from("notices")
    .update({ status: "마감", closed_at: new Date().toISOString() })
    .eq("status", "진행중")
    .eq("notice_date", date)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];
  if (rows.length > 0) {
    await logAudit({
      action: "update",
      resource: "notices",
      resourceLabel: "공지",
      target: `${date} 일자 마감 처리 (${rows.length}건)`,
    }).catch(() => {});
  }

  return NextResponse.json({ closed: rows.length });
}
