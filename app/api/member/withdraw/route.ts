import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase-server";
import { hashPassword } from "@/lib/password";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const memberId = cookieStore.get("wu-member")?.value;
    if (!memberId) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    const { password, reason } = await req.json();
    if (!password) {
      return NextResponse.json({ error: "비밀번호를 입력해주세요." }, { status: 400 });
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
    if (member.password_hash !== hashPassword(password)) {
      return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
    }

    const { error } = await sb
      .from("members")
      .update({
        status: "withdrawn",
        withdrawn_at: new Date().toISOString(),
        withdrawn_reason: reason || null,
      })
      .eq("id", memberId);
    if (error) throw error;

    cookieStore.delete("wu-member");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "회원 탈퇴 처리에 실패했습니다." }, { status: 500 });
  }
}
