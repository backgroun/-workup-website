import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit-server";
import { hashPassword } from "@/lib/password";

export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const status    = searchParams.get("status");
  const search    = searchParams.get("search");
  const sType     = searchParams.get("searchType") || "name";
  const grade     = searchParams.get("grade");
  const dateStart = searchParams.get("dateStart");
  const dateEnd   = searchParams.get("dateEnd");

  try {
    const sb = createAdminClient();
    let q = sb.from("members").select("*").order("created_at", { ascending: false });

    if (status && status !== "all") q = q.eq("status", status);
    if (grade  && grade  !== "전체")  q = q.eq("grade",  grade);
    if (search) {
      if (sType === "name")  q = q.ilike("name",  `%${search}%`);
      if (sType === "email") q = q.ilike("email", `%${search}%`);
      if (sType === "phone") q = q.ilike("phone", `%${search}%`);
    }
    if (dateStart) q = q.gte("created_at", dateStart);
    if (dateEnd)   q = q.lte("created_at", dateEnd + "T23:59:59");

    const { data, error } = await q;
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    if (!body.email?.trim() || !body.name?.trim() || !body.password) {
      return NextResponse.json({ error: "이름, 이메일, 비밀번호는 필수입니다." }, { status: 400 });
    }
    if (body.password.length < 8) {
      return NextResponse.json({ error: "비밀번호는 8자 이상이어야 합니다." }, { status: 400 });
    }
    const sb = createAdminClient();
    const { data, error } = await sb.from("members").insert([{
      email:  body.email.trim().toLowerCase(),
      name:   body.name.trim(),
      phone:  body.phone  ?? null,
      memo:   body.memo   ?? null,
      grade:  body.grade  ?? "일반회원",
      status: "active",
      password_hash: hashPassword(body.password),
    }]).select().single();
    if (error) throw error;
    await logAudit({
      action: "create",
      resource: "members",
      resourceLabel: "회원",
      target: data?.name ?? body?.name,
      targetId: data?.id,
    });
    return NextResponse.json(data);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
