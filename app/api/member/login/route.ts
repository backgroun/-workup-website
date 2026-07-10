import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { hashPassword } from "@/lib/password";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email?.trim() || !password) {
      return NextResponse.json({ error: "이메일과 비밀번호를 입력해주세요." }, { status: 400 });
    }

    const sb = createAdminClient();
    const { data: member } = await sb
      .from("members")
      .select("id, name, email, grade, status, password_hash")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (!member || member.password_hash !== hashPassword(password)) {
      return NextResponse.json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
    }
    if (member.status === "withdrawn") {
      return NextResponse.json({ error: "탈퇴한 계정입니다." }, { status: 401 });
    }
    if (member.status === "dormant") {
      return NextResponse.json({ error: "휴면 상태입니다. 매장에 문의하세요." }, { status: 401 });
    }

    await sb.from("members").update({ last_login_at: new Date().toISOString() }).eq("id", member.id);

    const cookieStore = await cookies();
    cookieStore.set("wu-member", String(member.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return NextResponse.json({
      ok: true,
      member: { id: member.id, name: member.name, email: member.email, grade: member.grade },
    });
  } catch {
    return NextResponse.json({ error: "오류가 발생했습니다." }, { status: 500 });
  }
}
