import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getSponsorInvoiceRows } from "@/lib/ih/collabs";

// POST /api/admin/ih/sponsors/invoice-export — 선택/필터된 협찬 건의 받는분 성명·주소·연락처·품목을 모아
// 로젠택배 대량접수 양식(송장업로드용) 다운로드에 쓴다.
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as { ids?: number[] };
  const ids = Array.isArray(body.ids) ? body.ids.filter((n) => Number.isFinite(n)) : [];
  if (ids.length === 0) return NextResponse.json({ error: "대상이 없습니다." }, { status: 400 });

  try {
    const rows = await getSponsorInvoiceRows(ids);
    return NextResponse.json({ rows });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
