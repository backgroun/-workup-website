import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase-server";

async function checkAuth() {
  const store = await cookies();
  return store.get("wu-auth")?.value === (process.env.AUTH_TOKEN ?? "wu-session-ok");
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const body = await req.json();
    const update: Record<string, unknown> = {
      name:   body.name,
      phone:  body.phone  ?? null,
      memo:   body.memo   ?? null,
      grade:  body.grade,
      status: body.status,
    };
    if (body.status === "withdrawn" && !body.withdrawn_at) {
      update.withdrawn_at = new Date().toISOString();
    }
    if (body.withdrawn_reason !== undefined) update.withdrawn_reason = body.withdrawn_reason;
    if (body.last_login_at    !== undefined) update.last_login_at    = body.last_login_at;

    const sb = createAdminClient();
    const { data, error } = await sb.from("members").update(update).eq("id", id).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const sb = createAdminClient();
    const { error } = await sb.from("members").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
