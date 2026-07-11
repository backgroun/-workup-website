import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase-server";
import { hashPassword } from "@/lib/password";
import { verifyMemberCookie } from "@/lib/session";

// 로그인한 회원 본인이 비밀번호를 변경한다 (관리자의 임시 비밀번호 발급과는 별개).
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const memberId = verifyMemberCookie(cookieStore.get("wu-member")?.value);
    if (!memberId) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "현재 비밀번호와 새 비밀번호를 입력해주세요." }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "새 비밀번호는 8자 이상이어야 합니다." }, { status: 400 });
    }

    const sb = createAdminClient();
    const { data: member } = await sb
      .from("members")
      .select("id, password_hash, status")
      .eq("id", memberId)
      .maybeSingle();

    if (!member || member.status === "withdrawn") {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }
    if (member.password_hash !== hashPassword(currentPassword)) {
      return NextResponse.json({ error: "현재 비밀번호가 올바르지 않습니다." }, { status: 401 });
    }

    const { error } = await sb
      .from("members")
      .update({ password_hash: hashPassword(newPassword) })
      .eq("id", memberId);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "비밀번호 변경에 실패했습니다." }, { status: 500 });
  }
}
