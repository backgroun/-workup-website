import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("stores")
    .select("*, store_jobs(id, title, employment_type, salary_info, deadline, is_active)")
    .eq("id", id)
    .eq("is_active", true)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}
