import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { hashPassword } from "@/lib/password";

// POST { step: "verify", name, email }
//   → 일치하면 { ok: true }
// POST { step: "reset", name, email, newPassword }
//   → 비밀번호 변경
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { step, name, email, newPassword } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "이름과 이메일을 입력해주세요." }, { status: 400 });
    }

    const sb = createAdminClient();
    const { data: member } = await sb
      .from("members")
      .select("id, status")
      .eq("name", name.trim())
      .eq("email", email.trim().toLowerCase())
      .neq("status", "withdrawn")
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ error: "일치하는 회원 정보가 없습니다." }, { status: 404 });
    }

    if (step === "verify") {
      return NextResponse.json({ ok: true });
    }

    if (step === "reset") {
      if (!newPassword || newPassword.length < 8) {
        return NextResponse.json({ error: "새 비밀번호는 8자 이상이어야 합니다." }, { status: 400 });
      }
      const { error } = await sb
        .from("members")
        .update({ password_hash: hashPassword(newPassword) })
        .eq("id", member.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "오류가 발생했습니다." }, { status: 500 });
  }
}
