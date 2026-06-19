import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const region = searchParams.get("region");
  const supabase = createAdminClient();
  let query = supabase
    .from("stores")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (region) query = query.eq("region", region);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
