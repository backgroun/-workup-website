import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { searchSponsors } from "@/lib/ih/collabs";

// GET /api/admin/ih/sponsors?influencerQ=&productQ=&status=&contentFormat=&dateFrom=&dateTo=&page=&pageSize=
// 제품 협찬 전체 목록("제품 협찬" 메뉴의 협찬 현황 화면) — 인플루언서 상세 탭과 별개로 전체를 가로질러 조회한다.
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  const num = (k: string) => (sp.get(k) ? Number(sp.get(k)) : undefined);

  try {
    const result = await searchSponsors({
      influencerQ: sp.get("influencerQ") ?? undefined,
      productQ: sp.get("productQ") ?? undefined,
      status: sp.get("status") ?? undefined,
      contentFormat: sp.get("contentFormat") ?? undefined,
      dateFrom: sp.get("dateFrom") ?? undefined,
      dateTo: sp.get("dateTo") ?? undefined,
      page: num("page"),
      pageSize: num("pageSize"),
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
