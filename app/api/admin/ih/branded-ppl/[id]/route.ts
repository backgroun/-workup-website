import { NextResponse } from "next/server";
import { isAdmin, getAdminMember } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit-server";
import { getBrandedPplDetail, updateBrandedPpl, type IHBrandedPplInput } from "@/lib/ih/collabs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const detail = await getBrandedPplDetail(id);
  if (!detail) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(detail);
}

// PATCH: 부분 수정({ status }만 보내도 되고, 다른 필드와 함께 보내도 된다)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const body = (await req.json()) as Partial<IHBrandedPplInput>;
  try {
    const updated = await updateBrandedPpl(id, body);
    const admin = await getAdminMember();
    await logAudit({
      action: "update",
      resource: "ih_branded_ppl",
      resourceLabel: "브랜디드 PPL",
      target: updated.name,
      targetId: updated.id,
      actorName: admin?.name,
    });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "저장 중 오류가 발생했습니다." }, { status: 500 });
  }
}
