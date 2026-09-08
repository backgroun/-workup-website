import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visibleLen = Math.min(3, local.length);
  const masked = local.slice(0, visibleLen) + "*".repeat(Math.max(local.length - visibleLen, 0));
  return `${masked}@${domain}`;
}

export async function POST(req: Request) {
  try {
    const { name, phone } = await req.json();
    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: "이름과 전화번호를 입력해주세요." }, { status: 400 });
    }

    const normalizedPhone = phone.replace(/\D/g, "");
    if (normalizedPhone.length < 10) {
      return NextResponse.json({ error: "올바른 전화번호를 입력해주세요." }, { status: 400 });
    }

    const sb = createAdminClient();
    const { data: rows } = await sb
      .from("members")
      .select("email, created_at, phone")
      .eq("name", name.trim())
      .neq("status", "withdrawn");

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "일치하는 회원 정보가 없습니다." }, { status: 404 });
    }

    const matched = rows.filter((m: { phone?: string }) =>
      m.phone && m.phone.replace(/\D/g, "") === normalizedPhone
    );

    if (matched.length === 0) {
      return NextResponse.json({ error: "일치하는 회원 정보가 없습니다." }, { status: 404 });
    }

    const results = matched.map((m: { email: string; created_at: string }) => ({
      maskedEmail: maskEmail(m.email),
      joinedAt: m.created_at ? m.created_at.slice(0, 10) : null,
    }));

    return NextResponse.json({ ok: true, results });
  } catch {
    return NextResponse.json({ error: "오류가 발생했습니다." }, { status: 500 });
  }
}
