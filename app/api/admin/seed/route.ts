import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient, mapToDb } from "@/lib/supabase-server";
import { products } from "@/data/products";

export async function POST() {
  const store = await cookies();
  const token = store.get("wu-auth")?.value;
  if (token !== (process.env.AUTH_TOKEN ?? "wu-session-ok")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const rows = products.map((p, i) => ({ ...mapToDb(p), sort_order: i }));
  const { error } = await supabase.from("products").upsert(rows, { onConflict: "id", ignoreDuplicates: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, count: rows.length });
}
