import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit-server";
import { hashPassword, generateTempPassword } from "@/lib/password";
import { sendTempPasswordEmail } from "@/lib/email";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const sb = createAdminClient();
    const { data: member, error: findError } = await sb
      .from("members")
      .select("id, name, email")
      .eq("id", id)
      .maybeSingle();
    if (findError) throw findError;
    if (!member) return NextResponse.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });

    const tempPassword = generateTempPassword();
    const { error: updateError } = await sb
      .from("members")
      .update({ password_hash: hashPassword(tempPassword) })
      .eq("id", id);
    if (updateError) throw updateError;

    await sendTempPasswordEmail(member.email, member.name, tempPassword);

    await logAudit({
      action: "update",
      resource: "members",
      resourceLabel: "회원",
      target: member.name,
      targetId: id,
      summary: `회원 '${member.name}' 비밀번호 리셋 (임시 비밀번호 이메일 발송)`,
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message || "비밀번호 리셋에 실패했습니다." }, { status: 500 });
  }
}
