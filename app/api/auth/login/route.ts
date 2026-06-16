import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const validEmail = process.env.AUTH_EMAIL ?? "admin@workup.kr";
  const validPassword = process.env.AUTH_PASSWORD ?? "workup2026";
  const sessionValue = process.env.AUTH_TOKEN ?? "wu-session-ok";

  if (email === validEmail && password === validPassword) {
    const cookieStore = await cookies();
    cookieStore.set("wu-auth", sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    { ok: false, message: "이메일 또는 비밀번호가 올바르지 않습니다." },
    { status: 401 }
  );
}
