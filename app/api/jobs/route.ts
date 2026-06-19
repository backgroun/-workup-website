import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const region = searchParams.get("region");
  const supabase = createAdminClient();
  let query = supabase
    .from("store_jobs")
    .select("*, stores(id, name, region, address, phone)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (region) query = query.eq("stores.region", region);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // 마감일이 지난 공고 제외
  const today = new Date().toISOString().slice(0, 10);
  const filtered = (data ?? []).filter(
    (j: Record<string, unknown>) => !j.deadline || String(j.deadline) >= today
  );
  return NextResponse.json(filtered);
}
