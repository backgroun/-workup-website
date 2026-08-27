import { NextResponse } from "next/server";
import { isAdmin, getAdminMember } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit-server";
import { searchBrandedPpl, createBrandedPpl, type IHBrandedPplInput } from "@/lib/ih/collabs";

// GET /api/admin/ih/branded-ppl?nameQ=&status=&category=&page=&pageSize=
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  const num = (k: string) => (sp.get(k) ? Number(sp.get(k)) : undefined);

  try {
    const result = await searchBrandedPpl({
      nameQ: sp.get("nameQ") ?? undefined,
      status: sp.get("status") ?? undefined,
      category: sp.get("category") ?? undefined,
      page: num("page"),
      pageSize: num("pageSize"),
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// POST /api/admin/ih/branded-ppl — 신규 등록.
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as IHBrandedPplInput;

  try {
    const result = await createBrandedPpl(body);
    if (!result.ok) return NextResponse.json({ error: "validation", fieldErrors: result.errors }, { status: 400 });

    const admin = await getAdminMember();
    await logAudit({
      action: "create",
      resource: "ih_branded_ppl",
      resourceLabel: "브랜디드 PPL",
      target: result.brandedPpl.name,
      targetId: result.brandedPpl.id,
      actorName: admin?.name,
    });
    return NextResponse.json(result.brandedPpl, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "저장 중 오류가 발생했습니다." }, { status: 500 });
  }
}
