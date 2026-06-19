import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase-server";

async function isAuthed() {
  const store = await cookies();
  const token = store.get("wu-auth")?.value;
  return token === (process.env.AUTH_TOKEN ?? "wu-session-ok");
}

export async function GET(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("store_id");
  const supabase = createAdminClient();
  let query = supabase
    .from("store_jobs")
    .select("*, stores(id, name, region)")
    .order("created_at", { ascending: false });
  if (storeId) query = query.eq("store_id", storeId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("store_jobs")
    .insert({
      store_id: body.store_id,
      title: body.title,
      description: body.description ?? "",
      employment_type: body.employment_type ?? "정규직",
      salary_info: body.salary_info ?? "",
      requirements: body.requirements ?? "",
      deadline: body.deadline || null,
      is_active: body.is_active ?? true,
    })
    .select("*, stores(id, name, region)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
