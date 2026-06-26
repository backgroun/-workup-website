import { NextResponse } from "next/server";
import { createAdminClient, mapToDb } from "@/lib/supabase-server";
import { products } from "@/data/products";
import { isAdmin } from "@/lib/admin-auth";

export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const rows = products.map((p, i) => ({ ...mapToDb(p), sort_order: i }));
  const { error } = await supabase.from("products").upsert(rows, { onConflict: "id", ignoreDuplicates: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, count: rows.length });
}
