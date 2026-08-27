import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getIHIntegratedDashboardData, type IHDashboardPeriod } from "@/lib/ih/dashboard";

const VALID_PERIODS: IHDashboardPeriod[] = ["all", "this_month", "last_month", "last_3_months", "custom"];

// GET /api/admin/ih/dashboard?period=all|this_month|last_month|last_3_months|custom&from=&to=
// Phase 9 통합 대시보드의 기간 필터 전환용 — 초기 렌더는 페이지에서 서버 조회로 하고, 필터를 바꿀 때만 이 라우트를 쓴다.
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  const periodRaw = sp.get("period") ?? "all";
  const period = (VALID_PERIODS as string[]).includes(periodRaw) ? (periodRaw as IHDashboardPeriod) : "all";

  try {
    const data = await getIHIntegratedDashboardData({
      period,
      from: sp.get("from") ?? undefined,
      to: sp.get("to") ?? undefined,
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
