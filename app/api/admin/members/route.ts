import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase-server";

async function checkAuth() {
  const store = await cookies();
  return store.get("wu-auth")?.value === (process.env.AUTH_TOKEN ?? "wu-session-ok");
}

export async function GET(req: Request) {
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
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const sb = createAdminClient();
    const { data, error } = await sb.from("members").insert([{
      email:  body.email,
      name:   body.name,
      phone:  body.phone  ?? null,
      memo:   body.memo   ?? null,
      grade:  body.grade  ?? "일반회원",
      status: "active",
    }]).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
