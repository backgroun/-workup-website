import { NextResponse } from "next/server";
import { isAdmin, getAdminMember } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit-server";
import { getSponsorDetail, updateSponsor, type IHSponsorInput } from "@/lib/ih/collabs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const detail = await getSponsorDetail(id);
  if (!detail) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(detail);
}

// PATCH: 상태 변경 포함 부분 수정({ status } 만 보내도 되고, 다른 필드와 함께 보내도 된다)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const body = (await req.json()) as Partial<IHSponsorInput>;
  try {
    const updated = await updateSponsor(id, body);
    if ("ok" in updated && updated.ok === false) {
      return NextResponse.json({ error: "validation", fieldErrors: updated.errors }, { status: 400 });
    }
    const admin = await getAdminMember();
    await logAudit({
      action: "update",
      resource: "ih_sponsors",
      resourceLabel: "제품 협찬",
      target: updated.product,
      targetId: updated.id,
      summary: body.status ? `협찬 '${updated.product}' 상태를 ${body.status}(으)로 변경` : undefined,
      actorName: admin?.name,
    });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "저장 중 오류가 발생했습니다." }, { status: 500 });
  }
}
