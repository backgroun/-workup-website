import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase-server";

async function isAuthed() {
  const store = await cookies();
  const token = store.get("wu-auth")?.value;
  return token === (process.env.AUTH_TOKEN ?? "wu-session-ok");
}

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("store_jobs")
    .update({
      store_id: body.store_id,
      title: body.title,
      description: body.description ?? "",
      employment_type: body.employment_type ?? "정규직",
      salary_info: body.salary_info ?? "",
      requirements: body.requirements ?? "",
      deadline: body.deadline || null,
      is_active: body.is_active ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*, stores(id, name, region)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: Params) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from("store_jobs").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
