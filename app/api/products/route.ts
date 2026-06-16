import { NextResponse } from "next/server";
import { createAdminClient, mapFromDb } from "@/lib/supabase-server";
import { products as staticProducts } from "@/data/products";

export const revalidate = 0;

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error || !data || data.length === 0) {
      return NextResponse.json(staticProducts);
    }

    return NextResponse.json(data.map(mapFromDb));
  } catch {
    return NextResponse.json(staticProducts);
  }
}
