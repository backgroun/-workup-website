import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase-server";

// 공개 엔드포인트: 로그인 없이 자기 글을 비밀번호로 열람.
// 목록에서 글을 눌러 비밀번호를 입력하면 본문·연락처·관리자 답변을 반환한다.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const password = String(body.password ?? "");
  if (!password) return NextResponse.json({ error: "비밀번호를 입력해주세요." }, { status: 400 });

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("inquiries")
      .select("type,payload,status,created_at")
      .eq("id", id)
      .maybeSingle();
    if (error) return NextResponse.json({ error: "조회 중 오류가 발생했습니다." }, { status: 500 });
    if (!data) return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });

    const p = (data.payload ?? {}) as Record<string, unknown>;
    const hash = String(p._pwHash ?? "").trim();
    const salt = String(p._pwSalt ?? "");
    if (!hash) return NextResponse.json({ error: "비밀번호가 설정되지 않은 글입니다." }, { status: 400 });

    const check = createHash("sha256").update(salt + password).digest("hex");
    if (check !== hash) return NextResponse.json({ error: "비밀번호가 일치하지 않습니다." }, { status: 401 });

    // 열람 허용 — 본문/답변 반환(내부 키·해시 제외)
    return NextResponse.json({
      ok: true,
      type: data.type,
      status: data.status,
      created_at: data.created_at,
      name: String(p.name ?? p.manager ?? ""),
      title: String(p.title ?? "").trim(),
      content: String(p.message ?? p.content ?? ""),
      phone: String(p.phone ?? ""),
      reply: p._reply ? String(p._reply) : null,
      repliedAt: p._repliedAt ? String(p._repliedAt) : null,
    });
  } catch {
    return NextResponse.json({ error: "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
