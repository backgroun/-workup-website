import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { hashPassword } from "@/lib/password";
import { signMemberId } from "@/lib/session";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { name, email, password, phone } = await req.json();

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "이름, 이메일, 비밀번호는 필수입니다." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "비밀번호는 8자 이상이어야 합니다." }, { status: 400 });
    }

    const sb = createAdminClient();

    // 이메일 중복 확인
    const { data: existing } = await sb
      .from("members")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "이미 가입된 이메일입니다." }, { status: 409 });
    }

    const { data, error } = await sb.from("members").insert([{
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      password_hash: hashPassword(password),
      grade: "일반회원",
      status: "active",
    }]).select("id, name, email").single();

    if (error) throw error;

    // 회원가입 후 자동 로그인
    const cookieStore = await cookies();
    cookieStore.set("wu-member", signMemberId(data.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
  } catch (e: unknown) {
    const msg = (e as Error).message ?? "";
    if (msg.includes("password_hash") && msg.includes("column")) {
      return NextResponse.json(
        { error: "서버 설정 오류: 관리자에게 문의해주세요. (members 테이블에 password_hash 컬럼이 필요합니다)" },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: msg || "오류가 발생했습니다." }, { status: 500 });
  }
}
