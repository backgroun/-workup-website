import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getBrandedPplPriceHistory } from "@/lib/ih/collabs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  try {
    const history = await getBrandedPplPriceHistory(id);
    return NextResponse.json({ history });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
